import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, cartController.getCart);
router.get('/pricing', protect, cartController.getCartPricing);
router.post('/fetch-and-add', protect, cartController.fetchAndAdd);
router.put('/items/:itemId/quantity', protect, cartController.updateQuantity);
router.put('/items/:itemId/options', protect, cartController.updateItemOptions);
router.delete('/items/:itemId', protect, cartController.removeItem);
router.delete('/clear', protect, cartController.clearCart);
router.post('/checkout', protect, cartController.checkout);

export default router;
