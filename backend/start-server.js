/**
 * This script starts the server with proper error handling.
 */

// Set the NODE_ENV to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
try {
  console.log('Starting server...');
  require('./src/server');
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
} 