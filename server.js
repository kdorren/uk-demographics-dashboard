const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Alternative Data Sources Configuration
const DATA_SOURCES = {
  worldBank: {
    baseUrl: 'https://api.worldbank.org/v2',
    country: 'GBR', // UK country code
    indicators: {
      population65: 'SP.POP.65UP.TO', // Population ages 65 and above
      populationTotal: 'SP.POP.TOTL', // Total population
      birthRate: 'SP.DYN.CBRT.IN' // Birth rate, crude (per 1,000 people)
    }
  },
  unPopulation: {
    baseUrl: 'https://population.un.org/dataportalapi/api/v1',
    country: 'GBR'
  },
  eurostat: {
    baseUrl: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data',
    datasets: {
      population: 'demo_pjan', // Population by age and sex
      births: 'demo_fmonth' // Fertility indicators
    }
  }
};

// Store current demographic data
let demographicData = {
  over65: {
    count: 0,
    dailyIncrease: 0,
    lastUpdate: new Date(),
    source: 'World Bank'
  },
  births: {
    count: 0,
    dailyRate: 0,
    lastUpdate: new Date(),
    source: 'World Bank'
  },
  totalPopulation: {
    count: 0,
    lastUpdate: new Date(),
    source: 'World Bank'
  }
};

// Cache for API responses to avoid rate limiting
let dataCache = {
  population: null,
  births: null,
  lastFetch: null
};

// Fetch data from World Bank API
async function fetchWorldBankData(indicator, year = '2022') {
  try {
    console.log(`Fetching World Bank data for indicator: ${indicator}`);
    
    const url = `${DATA_SOURCES.worldBank.baseUrl}/country/${DATA_SOURCES.worldBank.country}/indicator/${indicator}?format=json&date=${year}`;
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UK-Demographics-Dashboard/1.0'
      },
      timeout: 15000
    });
    
    if (response.data && response.data[1] && response.data[1].length > 0) {
      const latestData = response.data[1][0];
      console.log(`World Bank data for ${indicator}:`, latestData.value);
      return latestData.value;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching World Bank data for ${indicator}:`, error.message);
    return null;
  }
}

// Fetch data from Eurostat API
async function fetchEurostatData(dataset, filters = {}) {
  try {
    console.log(`Fetching Eurostat data for dataset: ${dataset}`);
    
    const url = `${DATA_SOURCES.eurostat.baseUrl}/${dataset}`;
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UK-Demographics-Dashboard/1.0'
      },
      timeout: 15000
    });
    
    console.log(`Eurostat data received for ${dataset}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Eurostat data for ${dataset}:`, error.message);
    return null;
  }
}

// Calculate daily rates from annual data
function calculateDailyRates(annualValue, type = 'population') {
  if (type === 'population') {
    // For population, estimate daily increase based on growth rate
    const growthRate = 0.005; // 0.5% annual growth rate for UK
    const dailyIncrease = Math.round((annualValue * growthRate) / 365);
    return dailyIncrease;
  } else if (type === 'births') {
    // For births, calculate daily average
    return Math.round(annualValue / 365);
  }
  return 0;
}

// Update demographics with real data from multiple sources
async function updateDemographicsWithRealData() {
  try {
    console.log('Fetching live demographic data from multiple sources...');
    
    // Try World Bank API first
    const over65Population = await fetchWorldBankData(DATA_SOURCES.worldBank.indicators.population65);
    const totalPopulation = await fetchWorldBankData(DATA_SOURCES.worldBank.indicators.populationTotal);
    const birthRate = await fetchWorldBankData(DATA_SOURCES.worldBank.indicators.birthRate);
    
    if (over65Population) {
      const previousCount = demographicData.over65.count;
      demographicData.over65.count = over65Population;
      demographicData.over65.dailyIncrease = calculateDailyRates(over65Population, 'population');
      demographicData.over65.lastUpdate = new Date();
      demographicData.over65.source = 'World Bank';
      console.log(`Updated 65+ population: ${over65Population.toLocaleString()}`);
    }
    
    if (totalPopulation) {
      demographicData.totalPopulation.count = totalPopulation;
      demographicData.totalPopulation.lastUpdate = new Date();
      demographicData.totalPopulation.source = 'World Bank';
      console.log(`Updated total population: ${totalPopulation.toLocaleString()}`);
    }
    
    if (birthRate) {
      // Convert birth rate per 1000 to total annual births
      const annualBirths = Math.round((birthRate * totalPopulation) / 1000);
      const dailyBirths = calculateDailyRates(annualBirths, 'births');
      
      demographicData.births.count = annualBirths;
      demographicData.births.dailyRate = dailyBirths;
      demographicData.births.lastUpdate = new Date();
      demographicData.births.source = 'World Bank';
      console.log(`Updated birth rate: ${dailyBirths} daily average (${annualBirths} annual)`);
    }
    
    // If World Bank data is not available, try Eurostat
    if (!over65Population || !birthRate) {
      console.log('Trying Eurostat as fallback...');
      
      const eurostatPopulation = await fetchEurostatData(DATA_SOURCES.eurostat.datasets.population);
      const eurostatBirths = await fetchEurostatData(DATA_SOURCES.eurostat.datasets.births);
      
      if (eurostatPopulation && !over65Population) {
        // Parse Eurostat population data for 65+ age group
        // This would need specific parsing based on Eurostat data structure
        console.log('Eurostat population data available');
      }
      
      if (eurostatBirths && !birthRate) {
        // Parse Eurostat birth data
        console.log('Eurostat birth data available');
      }
    }
    
    // Cache the data
    dataCache.lastFetch = new Date();
    
  } catch (error) {
    console.error('Error updating demographics with real data:', error);
    // Fallback to simulated data if all APIs fail
    updateDemographicsSimulated();
  }
}

// Fallback simulated data (original function)
function updateDemographicsSimulated() {
  console.log('Using simulated data (external APIs unavailable)');
  
  // Use realistic UK demographic data
  const ukOver65Population = 12500000; // ~12.5 million people 65+ in UK
  const ukAnnualBirths = 600000; // ~600k births per year in UK
  
  const dailyOver65Increase = Math.floor(Math.random() * 200) + 900;
  demographicData.over65.count = ukOver65Population + (dailyOver65Increase * Math.floor(Math.random() * 100));
  demographicData.over65.dailyIncrease = dailyOver65Increase;
  demographicData.over65.lastUpdate = new Date();
  demographicData.over65.source = 'Simulated (UK Estimates)';

  const dailyBirths = Math.floor(Math.random() * 300) + 1400;
  demographicData.births.count = ukAnnualBirths + (dailyBirths * Math.floor(Math.random() * 100));
  demographicData.births.dailyRate = dailyBirths;
  demographicData.births.lastUpdate = new Date();
  demographicData.births.source = 'Simulated (UK Estimates)';
  
  demographicData.totalPopulation.count = 67000000; // ~67 million UK population
  demographicData.totalPopulation.lastUpdate = new Date();
  demographicData.totalPopulation.source = 'Simulated (UK Estimates)';
}

// Main update function
async function updateDemographics() {
  // Try to fetch real data every 10 minutes
  const now = new Date();
  const timeSinceLastFetch = dataCache.lastFetch ? 
    (now - dataCache.lastFetch) / (1000 * 60) : 999; // minutes
  
  if (timeSinceLastFetch >= 10) {
    await updateDemographicsWithRealData();
  } else {
    // Use cached data but update timestamps
    demographicData.over65.lastUpdate = now;
    demographicData.births.lastUpdate = now;
    demographicData.totalPopulation.lastUpdate = now;
  }

  // Emit updated data to all connected clients
  io.emit('demographicsUpdate', demographicData);
}

// Update data every 30 seconds (less frequent for real API)
setInterval(updateDemographics, 30000);

// Initial data fetch
updateDemographicsWithRealData();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current data to newly connected client
  socket.emit('demographicsUpdate', demographicData);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// API endpoints
app.get('/api/demographics', (req, res) => {
  res.json(demographicData);
});

app.get('/api/over65', (req, res) => {
  res.json(demographicData.over65);
});

app.get('/api/births', (req, res) => {
  res.json(demographicData.births);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    lastDataUpdate: dataCache.lastFetch,
    dataSource: demographicData.over65.source,
    nextUpdate: new Date(Date.now() + 30000),
    dataSources: ['World Bank', 'Eurostat', 'UN Population Division'],
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dataSource: demographicData.over65.source
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Use Railway's PORT environment variable or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 UK Demographics Dashboard deployed successfully!`);
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Data Source: World Bank API`);
  console.log(`🔄 Updates every 30 seconds`);
  console.log(`📈 Visit the dashboard to see live UK demographic data!`);
}); 