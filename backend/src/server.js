/**
 * This is the main server file for the Track My Threads API.
 * It sets up the Express application, configures middleware,
 * and defines the routes for the API.
 */

// Import required packages
const dotenv = require('dotenv');
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
const PORT = process.env.PORT || BACKEND_SERVER_PORT;

// Configure middleware
// CORS allows your API to be accessed from different domains
app.use(cors({
  // Allow requests from any origin
  origin: '*',
  // Allow these HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Allow these headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For']
}));

// bodyParser.json() parses incoming JSON requests and puts the data in req.body
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

if (!fs.existsSync('./databases')) {
  fs.mkdirSync('./databases');
}

app.use((req, res, next) => {
  // Get client IP address, using X-Forwarded-For header if available (for proxy setups)
  const clientIp = (req.headers['x-forwarded-for'] || req.ip || '127.0.0.1').replace(/[:.]/g, '_');
  
  // Log the identifier being used
  console.log(`Client IP: ${clientIp}`);
  
  // Create a database path specific to this IP
  const dbPath = path.resolve(__dirname, `../databases/user_${clientIp}.db`);
  console.log(`Using database: ${dbPath}`);
  
  // Create and attach the database to the request object
  req.db = new sqlite3.Database(dbPath);
  
  // Store the IP on the request for future use
  req.clientIp = clientIp;
  
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

// Return the client IP for identification
app.get('/api/client-ip', (req, res) => {
  res.json({ clientIp: req.clientIp });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


