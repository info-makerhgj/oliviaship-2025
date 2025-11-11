import express from 'express';
import * as productController from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/fetch-from-url', protect, productController.fetchFromUrl);
router.post('/calculate-cost', protect, productController.calculateCostForProduct);
router.post('/validate-url', productController.validateUrl);

export default router;

