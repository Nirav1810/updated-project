import express from 'express';
import { validateQRCode } from '../controllers/qrController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/validate', protect, validateQRCode);

export default router;