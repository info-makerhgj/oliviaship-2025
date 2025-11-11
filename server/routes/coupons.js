import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/active', couponController.getActiveCoupons);
router.post('/validate', protect, couponController.validateCoupon);

// User routes
router.post('/apply', protect, couponController.applyCouponToCart);
router.delete('/remove/:couponId', protect, couponController.removeCouponFromCart);

// Admin routes
router.get('/', protect, admin, couponController.getAllCoupons);
router.get('/:id', protect, admin, couponController.getCoupon);
router.post('/', protect, admin, couponController.createCoupon);
router.put('/:id', protect, admin, couponController.updateCoupon);
router.delete('/:id', protect, admin, couponController.deleteCoupon);
router.patch('/:id/toggle-status', protect, admin, couponController.toggleCouponStatus);

export default router;

