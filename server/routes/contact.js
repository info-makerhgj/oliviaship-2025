import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public route - anyone can send a message
router.post('/', contactController.createMessage);

// Get messages (admin or user's own messages)
router.get('/', protect, contactController.getMessages);
router.get('/:id', protect, admin, contactController.getMessage);
router.patch('/:id/status', protect, admin, contactController.updateStatus);
router.post('/:id/reply', protect, admin, contactController.replyToMessage);
router.delete('/:id', protect, admin, contactController.deleteMessage);

export default router;

