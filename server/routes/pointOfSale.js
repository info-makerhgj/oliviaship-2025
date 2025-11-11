import express from 'express';
import * as pointOfSaleController from '../controllers/pointOfSaleController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/public', pointOfSaleController.getPublicPoints); // Public access to all active points
router.get('/nearest', protect, pointOfSaleController.getNearestPoints);
router.get('/code/:code', pointOfSaleController.getPointByCode); // Public QR code access
router.get('/search-customer', protect, pointOfSaleController.searchCustomer);

// Admin routes
router.post('/', protect, admin, pointOfSaleController.createPoint);
router.get('/', protect, pointOfSaleController.getAllPoints); // Allow point managers to see their point
router.get('/my-point', protect, pointOfSaleController.getMyPoint); // Get user's managed point
router.post('/:id/distribute-codes', protect, admin, pointOfSaleController.distributeCodes);

// Point Manager routes
router.get('/:id', protect, pointOfSaleController.getPoint);
router.put('/:id', protect, pointOfSaleController.updatePoint);
router.get('/:id/codes', protect, pointOfSaleController.getPointCodes);
router.get('/:id/orders', protect, pointOfSaleController.getPointOrders);
router.post('/:id/sell-code', protect, pointOfSaleController.sellCodeToCustomer);
router.post('/:id/return-code', protect, pointOfSaleController.returnCode);
router.post('/:id/request-codes', protect, pointOfSaleController.requestCodes);
router.put('/:id/orders/:orderId/ready', protect, pointOfSaleController.markOrderReady); // orderType in query: ?orderType=smartCart
router.get('/:id/stats', protect, pointOfSaleController.getPointStats);
router.get('/:id/admin-stats', protect, admin, pointOfSaleController.getPointAdminStats);
router.get('/:id/commissions', protect, pointOfSaleController.getPointCommissions);

// Admin only routes
router.delete('/:id', protect, admin, pointOfSaleController.deletePoint);
router.patch('/:id/toggle-status', protect, admin, pointOfSaleController.togglePointStatus);
router.put('/commissions/:commissionId', protect, admin, pointOfSaleController.updateCommissionStatus);

// Customer route
router.put('/orders/:orderId/confirm-pickup', protect, pointOfSaleController.confirmOrderPickup);

export default router;

