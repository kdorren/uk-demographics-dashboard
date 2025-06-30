# UK Demographics Live Dashboard 🇬🇧

A real-time web dashboard that tracks and visualizes UK demographic changes, specifically focusing on people entering the 65+ age group and live birth rates.

## Features

- **Real-time Updates**: Live data updates every 5 seconds
- **Interactive Charts**: Beautiful visualizations using Chart.js
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Socket.IO Integration**: Real-time communication between server and client
- **Modern UI**: Clean, professional interface with smooth animations
- **Connection Status**: Visual indicator of real-time connection status

## Screenshots

The dashboard displays:
- People entering the 65+ demographic (daily count and trends)
- Live birth rates (daily count and trends)
- Population balance comparison
- Real-time charts with historical data
- Connection status indicator

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup Instructions

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
uk-demographics-dashboard/
├── server.js              # Express server with Socket.IO
├── package.json           # Node.js dependencies
├── README.md             # This file
└── public/               # Static files
    ├── index.html        # Main HTML page
    ├── styles.css        # CSS styles
    └── script.js         # Client-side JavaScript
```

## How It Works

### Server (server.js)
- Express.js server with Socket.IO for real-time communication
- Simulates demographic data updates every 5 seconds
- Provides API endpoints for data access
- Serves static files and handles WebSocket connections

### Client (public/)
- **index.html**: Main dashboard interface
- **styles.css**: Modern, responsive styling with animations
- **script.js**: Real-time data handling and chart management

### Data Simulation
The dashboard currently uses simulated data based on UK Office for National Statistics:
- **65+ Population**: ~1,000 people enter this age group daily
- **Birth Rate**: ~1,600 babies born daily

## Customization

### Changing Update Frequency
In `server.js`, modify the interval in the `setInterval` call:
```javascript
setInterval(updateDemographics, 5000); // 5 seconds
```

### Real Data Integration
To use real data instead of simulation:
1. Replace the `updateDemographics()` function in `server.js`
2. Connect to actual demographic APIs (ONS, etc.)
3. Update the data fetching logic

### Styling
Modify `public/styles.css` to customize:
- Colors and gradients
- Layout and spacing
- Animations and transitions
- Responsive breakpoints

## Technologies Used

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Real-time**: Socket.IO
- **Styling**: Custom CSS with modern design principles

## API Endpoints

- `GET /` - Main dashboard page
- `GET /api/demographics` - All demographic data
- `GET /api/over65` - 65+ population data
- `GET /api/births` - Birth rate data

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for educational or commercial purposes.

## Future Enhancements

- Integration with real UK demographic APIs
- Historical data analysis
- Export functionality
- Additional demographic metrics
- Geographic breakdown by UK regions
- Age distribution charts
- Population pyramid visualization

## Support

For questions or issues, please open an issue on the project repository. 