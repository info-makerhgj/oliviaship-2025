import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  getAllPayments,
  getPayment,
  getMyPayments,
  createPayment,
  updatePaymentStatus,
  processRefund,
  getPaymentStats,
} from '../controllers/paymentController.js';
import {
  createCashPayPayment,
  handleCashPayCallback,
  handleCashPayWebhook,
  verifyCashPayPayment,
  refundCashPayPayment,
} from '../controllers/cashPayController.js';

const router = express.Router();

// Cash Pay routes - يجب أن تكون قبل dynamic routes
router.post('/cashpay/create', protect, createCashPayPayment);
router.get('/cashpay/callback', handleCashPayCallback);
router.post('/cashpay/webhook', handleCashPayWebhook);
router.get('/cashpay/verify/:paymentId', protect, verifyCashPayPayment);
router.post('/cashpay/refund/:paymentId', protect, admin, refundCashPayPayment);

// Admin routes
router.get('/stats', protect, admin, getPaymentStats);
router.get('/', protect, admin, getAllPayments);

// User routes
router.get('/my/all', protect, getMyPayments);
router.post('/', protect, createPayment);

// Dynamic routes - يجب أن تكون في النهاية
router.get('/:id', protect, getPayment);
router.put('/:id/status', protect, admin, updatePaymentStatus);
router.post('/:id/refund', protect, admin, processRefund);

export default router;
