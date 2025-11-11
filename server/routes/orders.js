import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/:id', protect, orderController.getOrder);
router.put('/:id/status', protect, admin, orderController.updateOrderStatus);
router.put('/:id/assign-point', protect, admin, orderController.assignOrderToPoint);
router.get('/track/:orderNumber', orderController.trackOrder);

export default router;
