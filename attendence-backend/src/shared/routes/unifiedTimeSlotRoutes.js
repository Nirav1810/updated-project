import express from 'express';
import { getAllTimeSlots, getAvailableTimeSlots } from '../controllers/unifiedTimeSlotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for time slots
router.get('/', getAllTimeSlots);

// Protected route for available time slots
router.get('/available', protect, getAvailableTimeSlots);

export default router;