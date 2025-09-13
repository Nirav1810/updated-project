import express from 'express';
import { 
  createSchedule, 
  getAllSchedules, 
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getTeacherSchedule,
  getTodaySchedule,
  createBulkSchedules,
  checkScheduleConflict,
  mergeSchedules,
  splitSchedule
} from '../controllers/scheduleController.js';
import { protect, teacher } from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes
router.route('/weekly').get(teacher, getTeacherSchedule);
router.route('/today').get(teacher, getTodaySchedule);
router.route('/bulk').post(teacher, createBulkSchedules);
router.route('/check-conflict').post(teacher, checkScheduleConflict);
router.route('/merge').post(teacher, mergeSchedules);
router.route('/split/:scheduleId').post(teacher, splitSchedule);

// CRUD routes
router.route('/').post(teacher, createSchedule).get(teacher, getAllSchedules);
router.route('/:id')
  .get(teacher, getScheduleById)
  .put(teacher, updateSchedule)
  .delete(teacher, deleteSchedule);

export default router;