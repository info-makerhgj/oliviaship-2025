import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, admin, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, userController.getUsers);
router.get('/:id', protect, admin, userController.getUser);
router.post('/', protect, requireSuperAdmin, userController.createAdmin);
router.put('/:id', protect, admin, userController.updateUser);
router.patch('/:id/toggle-status', protect, admin, userController.toggleStatus);
router.patch('/:id/permissions', protect, requireSuperAdmin, userController.updatePermissions);

export default router;

