/**
 * This is the main server file for the Track My Threads API.
 * It sets up the Express application, configures middleware,
 * and defines the routes for the API.
 */

// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const ClothesModel = require('./models/clothesModel');

// Import routes
const clothesRoutes = require('./routes/clothesRoutes');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
// CORS allows your API to be accessed from different domains
app.use(cors({
  // Allow requests from any origin
  origin: '*',
  // Allow these HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Allow these headers
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// bodyParser.json() parses incoming JSON requests and puts the data in req.body
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

if (!fs.existsSync('./databases')) {
  fs.mkdirSync('./databases');
}

app.use((req, res, next) => {
  // Get Device ID from header, fall back to IP if not available
  const deviceId = req.headers['device-id'] || req.ip.replace(/[:.]/g, '_');
  
  // Log which identifier is being used
  const idType = req.headers['device-id'] ? 'Device ID' : 'IP address';
  
  // Create a database path specific to this device
  const dbPath = path.resolve(__dirname, `../databases/user_${deviceId}.db`);
  console.log(`Using database for ${idType} ${deviceId}: ${dbPath}`);
  
  // Create and attach the database to the request object
  req.db = new sqlite3.Database(dbPath);
  
  // Continue to the next middleware
  next();
});

app.use((req, res, next) => {
  // Initialize database tables if needed
  ClothesModel.initializeTables(req.db, (err) => {
      if (err) {
          return res.status(500).json({ error: 'Database initialization failed' });
      }
      next();
  });
});
// Mount the clothes routes at /api/clothes
// This means all routes defined in clothesRoutes.js will be prefixed with /api/clothes
app.use('/api/clothes', clothesRoutes);



// Define a simple root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Track My Threads API' });
});
app.get('/api/device/id', (req, res) => {
  // This would need to get the device ID from your database
  const deviceId = req.headers['device-id'] || req.ip.replace(/[:.]/g, '_');
  res.json({ deviceId: deviceId });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


