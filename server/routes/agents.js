import express from 'express';
import * as agentController from '../controllers/agentController.js';
import * as agentCustomerController from '../controllers/agentCustomerController.js';
import * as agentOrderController from '../controllers/agentOrderController.js';
import * as agentPaymentController from '../controllers/agentPaymentController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Agent routes
// Get my agent profile
router.get('/me', protect, agentController.getMyAgent);

// Agent Payments routes (Admin only) - MUST be before :id routes
router.get('/payments/all', protect, admin, agentPaymentController.getAllAgentPayments);
router.get('/payments/stats', protect, admin, agentPaymentController.getAgentPaymentStats);

// Admin routes - must be before :id routes
router.post('/', protect, admin, agentController.createAgent);
router.get('/', protect, admin, agentController.getAllAgents);
router.get('/stats/:id', protect, admin, agentController.getAgentStats);

// Agent specific routes
router.get('/:id', protect, agentController.getAgent);
router.put('/:id', protect, admin, agentController.updateAgent);
router.patch('/:id/toggle-status', protect, admin, agentController.toggleAgentStatus);
router.delete('/:id', protect, admin, agentController.deleteAgent);
router.get('/:id/stats', protect, agentController.getAgentStats);

// Agent Customers routes
router.post('/:agentId/customers', protect, agentCustomerController.createCustomer);
router.get('/:agentId/customers', protect, agentCustomerController.getCustomers);
router.get('/:agentId/customers/:customerId', protect, agentCustomerController.getCustomer);
router.put('/:agentId/customers/:customerId', protect, agentCustomerController.updateCustomer);
router.delete('/:agentId/customers/:customerId', protect, agentCustomerController.deleteCustomer);

// Agent Orders routes
router.post('/:agentId/orders', protect, agentOrderController.createOrder);
router.get('/:agentId/orders', protect, agentOrderController.getOrders);
router.post('/:agentId/orders/batch-submit', protect, agentOrderController.batchSubmitOrders);
router.get('/:agentId/orders/:orderId', protect, agentOrderController.getOrder);
router.put('/:agentId/orders/:orderId/status', protect, agentOrderController.updateOrderStatus);
router.post('/:agentId/orders/:orderId/customer-payment', protect, agentOrderController.markCustomerPayment);
router.post('/:agentId/orders/:orderId/submit', protect, agentOrderController.submitOrder);
router.post('/:agentId/orders/:orderId/agent-payment', protect, agentOrderController.markAgentPayment);

export default router;

