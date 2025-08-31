import express from 'express';
import { 
  createAttendanceRecord, 
  markManualAttendance,
  getStudentsForClass,
  getAllStudents,
  bulkEnrollStudents,
  getAllAttendance, 
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceStats,
  generateQRSession,
  refreshQRToken,
  terminateQRSession,
  getActiveQRSessions,
  terminateAllQRSessions,
  validateQRToken
} from '../controllers/attendanceController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Attendance Routes
router.route('/').post(teacher, createAttendanceRecord).get(getAllAttendance);
router.route('/stats').get(teacher, getAttendanceStats); // Add stats endpoint
router.route('/mark').post(teacher, createAttendanceRecord); // Add mark endpoint for frontend
router.route('/manual').post(teacher, markManualAttendance); // Manual attendance marking
router.route('/students/:classId').get(teacher, getStudentsForClass); // Get students for class
router.route('/all-students').get(teacher, getAllStudents); // Get all students (temporary)
router.route('/bulk-enroll').post(teacher, bulkEnrollStudents); // Bulk enroll students
router.route('/student/:studentId').get(getAttendanceByStudent);
router.route('/class/:classId').get(getAttendanceByClass); // Add class-specific attendance

// QR Code Session Routes
router.route('/qr/generate').post(teacher, generateQRSession);
router.route('/qr/refresh/:sessionId').post(teacher, refreshQRToken);
router.route('/qr/terminate/:sessionId').delete(teacher, terminateQRSession);
router.route('/qr/terminate-all').delete(teacher, terminateAllQRSessions);
router.route('/qr/active').get(teacher, getActiveQRSessions);
router.route('/qr/validate').post(validateQRToken); // For student app to validate QR codes

export default router;