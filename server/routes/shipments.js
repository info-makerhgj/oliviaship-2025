import express from 'express';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, async (req, res) => {
  res.json({ success: true, shipments: [] });
});

export default router;

