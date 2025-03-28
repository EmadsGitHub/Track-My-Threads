// src/routes/clothesRoutes.js

/**
 * This file defines the routes for the clothes API.
 * Routes are the endpoints that clients can access to interact with your API.
 */

// Import the Express framework to use its router functionality
const express = require('express');

// Create a new router instance
// The router will handle requests to specific endpoints
const router = express.Router();

// Import the clothes controller
// The controller contains the functions that will handle the requests
const ClothesController = require('../controllers/clothesController');

/**
 * GET /api/clothes
 */
router.get('/clothingcatalog', ClothesController.getAllClothesFromCatalog);
router.get('/', ClothesController.getAllClothes);
router.get('/image/:id', ClothesController.getClothingImage);
router.get('/laundrylist', ClothesController.getAllLaundryList);

/**
 * POST /api/clothes
 */
router.post('/', ClothesController.addClothes);
router.post('/clothingcatalog', ClothesController.uploadClothingCatalog);
router.post('/laundrylist', ClothesController.uploadLaundryList);

/**
 * PUT /api/clothes
 */
router.put('/:name', ClothesController.updateClothingItem);

/**
 * DELETE /api/clothes
 * NOTE: Route order matters! More specific routes should come before generic ones.
 */
// Place the laundrylist/all route before the /:id route to avoid conflicts
router.delete('/laundrylist/all', ClothesController.clearLaundryList);
router.delete('/:name', ClothesController.deleteClothes);

/**
 * POST /api/clothes/upload
 */
router.post('/upload', ClothesController.uploadClothing);

// Export the router so it can be used in the main server file
module.exports = router;
