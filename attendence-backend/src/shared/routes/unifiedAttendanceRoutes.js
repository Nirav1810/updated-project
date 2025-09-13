import express from 'express';
import { submitAttendance, syncAttendance, getAttendanceByClass } from '../controllers/unifiedAttendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/', protect, submitAttendance);
router.post('/sync', protect, syncAttendance);
router.get('/records/class/:classId', protect, getAttendanceByClass);

export default router;