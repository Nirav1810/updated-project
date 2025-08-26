import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  getAvailableTimeSlots,
  initializeDefaultTimeSlots
} from '../controllers/timeSlotController.js';

const router = express.Router();

// Public routes (no auth required for initial setup)
router.get('/public', getTimeSlots);
router.post('/initialize-public', initializeDefaultTimeSlots);

// All other routes require authentication
router.use(protect);

// Get all time slots
router.get('/', getTimeSlots);

// Get available time slots for scheduling (no breaks)
router.get('/available', getAvailableTimeSlots);

// Create a new time slot
router.post('/', createTimeSlot);

// Initialize default time slots
router.post('/initialize', initializeDefaultTimeSlots);

// Update a time slot
router.put('/:id', updateTimeSlot);

// Delete a time slot
router.delete('/:id', deleteTimeSlot);

export default router;
