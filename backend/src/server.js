/**
 * This is the main server file for the Track My Threads API.
 * It sets up the Express application, configures middleware,
 * and defines the routes for the API.
 */

// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

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
app.use(bodyParser.json());

// Mount the clothes routes at /api/clothes
// This means all routes defined in clothesRoutes.js will be prefixed with /api/clothes
app.use('/api/clothes', clothesRoutes);

// Define a simple root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Track My Threads API' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
