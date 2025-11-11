import express from 'express';
import * as walletController from '../controllers/walletController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.get('/', protect, walletController.getWallet);
router.get('/transactions', protect, walletController.getTransactions);
router.post('/redeem-code', protect, walletController.redeemCode);

// Admin routes
router.get('/by-user', protect, admin, walletController.getWalletByUserId); // Must be before /all
router.post('/codes', protect, admin, walletController.createWalletCode);
router.get('/codes', protect, admin, walletController.getAllWalletCodes);
router.get('/codes/export', protect, admin, walletController.exportWalletCodes);
router.get('/codes/:codeId/qr', protect, admin, walletController.getWalletCodeQR);
router.get('/all', protect, admin, walletController.getAllWallets);
router.post('/adjust', protect, admin, walletController.adjustBalance);
router.get('/transactions/export', protect, walletController.exportTransactions);
router.get('/:walletId/transactions', protect, admin, walletController.getWalletTransactions);

export default router;

