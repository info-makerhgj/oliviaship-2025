import express from 'express';
import * as productController from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', productController.getAllProducts);

// Get single product
router.get('/:id', productController.getProductById);

router.post('/fetch-from-url', protect, productController.fetchFromUrl);
router.post('/calculate-cost', protect, productController.calculateCostForProduct);
router.post('/validate-url', productController.validateUrl);

export default router;

