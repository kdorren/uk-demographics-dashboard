// Initialize Socket.IO connection
const socket = io();

// DOM elements
const connectionStatus = document.getElementById('connectionStatus');
const statusDot = connectionStatus.querySelector('.status-dot');
const statusText = connectionStatus.querySelector('.status-text');

const dataSource = document.getElementById('dataSource');
const sourceValue = dataSource.querySelector('.source-value');

const over65Count = document.getElementById('over65Count');
const over65Change = document.getElementById('over65Change');
const birthsCount = document.getElementById('birthsCount');
const birthsChange = document.getElementById('birthsChange');
const lastUpdate = document.getElementById('lastUpdate');

// Data Source Status elements
const primarySource = document.getElementById('primarySource');
const lastDataUpdate = document.getElementById('lastDataUpdate');
const nextUpdate = document.getElementById('nextUpdate');

// Chart instances
let over65Chart, birthsChart, comparisonChart;

// Data storage
let over65Data = [];
let birthsData = [];
let timeLabels = [];

// Check API status
async function checkAPIStatus() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        // Update data source indicators
        primarySource.textContent = status.dataSource;
        primarySource.className = `status-value ${status.dataSource.toLowerCase().includes('world') ? 'online' : 'checking'}`;
        
        if (status.lastDataUpdate) {
            lastDataUpdate.textContent = new Date(status.lastDataUpdate).toLocaleString();
        }
        
        if (status.nextUpdate) {
            nextUpdate.textContent = new Date(status.nextUpdate).toLocaleString();
        }
        
        // Update data source indicator
        sourceValue.textContent = status.dataSource;
        sourceValue.className = `source-value ${status.dataSource.toLowerCase().includes('world') ? 'worldbank' : 
            status.dataSource.toLowerCase().includes('simulated') ? 'simulated' : 'other'}`;
        
    } catch (error) {
        console.error('Error checking API status:', error);
        primarySource.textContent = 'Error';
        primarySource.className = 'status-value offline';
    }
}

// Initialize charts
function initializeCharts() {
    // Over 65 Chart
    const over65Ctx = document.getElementById('over65Chart').getContext('2d');
    over65Chart = new Chart(over65Ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Daily Increase',
                data: over65Data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Births Chart
    const birthsCtx = document.getElementById('birthsChart').getContext('2d');
    birthsChart = new Chart(birthsCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Daily Births',
                data: birthsData,
                borderColor: '#51cf66',
                backgroundColor: 'rgba(81, 207, 102, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Comparison Chart
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: ['65+ Population', 'Annual Births'],
            datasets: [{
                label: 'Count',
                data: [0, 0],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(81, 207, 102, 0.8)'
                ],
                borderColor: [
                    '#667eea',
                    '#51cf66'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
}

// Update UI with new data
function updateUI(data) {
    // Update connection status
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';

    // Store previous values for animation
    const prevOver65 = parseInt(over65Count.textContent.replace(/,/g, '')) || 0;
    const prevBirths = parseInt(birthsCount.textContent.replace(/,/g, '')) || 0;

    // Update counts with animation
    animateNumber(over65Count, prevOver65, data.over65.count);
    animateNumber(birthsCount, prevBirths, data.births.count);

    // Update change indicators
    updateChangeIndicator(over65Change, data.over65.dailyIncrease, 'positive');
    updateChangeIndicator(birthsChange, data.births.dailyRate, 'positive');

    // Update charts
    updateCharts(data);

    // Update timestamp
    lastUpdate.textContent = new Date().toLocaleTimeString();
    
    // Update data source
    if (data.over65.source) {
        sourceValue.textContent = data.over65.source;
        sourceValue.className = `source-value ${data.over65.source.toLowerCase().includes('world') ? 'worldbank' : 
            data.over65.source.toLowerCase().includes('simulated') ? 'simulated' : 'other'}`;
    }
}

// Animate number changes
function animateNumber(element, from, to) {
    if (from !== to) {
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 500);
    }
    element.textContent = to.toLocaleString();
}

// Update change indicators
function updateChangeIndicator(element, value, type) {
    const changeValue = element.querySelector('.change-value');
    changeValue.textContent = value.toLocaleString();
    
    element.className = `stat-change ${type}`;
}

// Update charts with new data
function updateCharts(data) {
    const now = new Date().toLocaleTimeString();
    
    // Add new data points
    timeLabels.push(now);
    over65Data.push(data.over65.dailyIncrease);
    birthsData.push(data.births.dailyRate);

    // Keep only last 10 data points
    if (timeLabels.length > 10) {
        timeLabels.shift();
        over65Data.shift();
        birthsData.shift();
    }

    // Update chart data
    over65Chart.data.labels = timeLabels;
    over65Chart.data.datasets[0].data = over65Data;
    over65Chart.update('none');

    birthsChart.data.labels = timeLabels;
    birthsChart.data.datasets[0].data = birthsData;
    birthsChart.update('none');

    // Update comparison chart
    comparisonChart.data.datasets[0].data = [
        data.over65.count,
        data.births.count
    ];
    comparisonChart.update('none');
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';
    
    // Check API status on connection
    checkAPIStatus();
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    statusDot.classList.remove('connected');
    statusText.textContent = 'Disconnected';
});

socket.on('demographicsUpdate', (data) => {
    console.log('Received demographics update:', data);
    updateUI(data);
    
    // Update API status periodically
    checkAPIStatus();
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    
    // Check API status on page load
    checkAPIStatus();
    
    // Add some interactive features
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
    });
    
    // Check API status every hour (since data updates daily)
    setInterval(checkAPIStatus, 60 * 60 * 1000);
});

// Handle window resize
window.addEventListener('resize', () => {
    if (over65Chart) over65Chart.resize();
    if (birthsChart) birthsChart.resize();
    if (comparisonChart) comparisonChart.resize();
}); 