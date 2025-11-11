import express from 'express';
import * as chatController from '../controllers/chatController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.get('/my-chat', protect, chatController.getOrCreateChat);
router.post('/send', protect, chatController.sendMessage);
router.get('/:id', protect, chatController.getChat);
router.patch('/:id/read', protect, chatController.markAsRead);

// Admin routes
router.get('/', protect, admin, chatController.getAllChats);
router.patch('/:id/status', protect, admin, chatController.updateStatus);

export default router;






