import express from 'express';
import { 
  markManualAttendance,
  generateQRSession,
  refreshQRToken,
  terminateQRSession,
  getActiveQRSessions,
  terminateAllQRSessions,
  getStudentsForClass,
  getAttendanceByClass,
  getAttendanceStats
} from '../controllers/attendanceController.js';
import { protect } from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected (teacher must be logged in)
router.use(protect);

// Manual attendance routes
router.post('/manual', markManualAttendance);
router.get('/class/:classId/students', getStudentsForClass);
router.get('/class/:classId', getAttendanceByClass);

// QR Session management routes
router.post('/qr/generate', generateQRSession);
router.post('/qr/refresh', refreshQRToken);
router.post('/qr/terminate', terminateQRSession);
router.post('/qr/terminate-all', terminateAllQRSessions);
router.get('/qr/active', getActiveQRSessions);

// Attendance statistics
router.get('/stats', getAttendanceStats);

export default router;
