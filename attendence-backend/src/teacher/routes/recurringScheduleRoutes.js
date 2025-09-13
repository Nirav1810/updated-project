import express from 'express';
import {
  createRecurringSchedule,
  getRecurringSchedules,
  createScheduleOverride,
  getScheduleForDateRange,
  getTodaysSchedule,
  updateRecurringSchedule,
  deleteRecurringSchedule
} from '../controllers/recurringScheduleController.js';
import { protect, teacher } from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes and ensure only teachers can access
router.use(protect);
router.use(teacher);

// Recurring Schedule Routes
router.route('/')
  .post(createRecurringSchedule)  // Create new recurring schedule
  .get(getRecurringSchedules);    // Get all recurring schedules for teacher

router.route('/today')
  .get(getTodaysSchedule);        // Get today's schedule

router.route('/range')
  .get(getScheduleForDateRange);  // Get schedule for date range

router.route('/:id')
  .put(updateRecurringSchedule)   // Update recurring schedule
  .delete(deleteRecurringSchedule); // Delete recurring schedule

// Schedule Override Routes
router.route('/override')
  .post(createScheduleOverride);  // Create schedule override for specific date

export default router;
