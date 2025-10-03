import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// All routes require authentication and admin role
router.use(protect, admin);

// ========================= DASHBOARD =========================
router.get('/dashboard/stats', adminController.getDashboardStats);

// ========================= STUDENT MANAGEMENT =========================
router.get('/students', adminController.getAllStudents);
router.get('/students/pending', adminController.getPendingStudents);
router.get('/students/:id', adminController.getStudentById);
router.post('/students', upload.fields([{ name: 'faceImage', maxCount: 1 }]), adminController.createStudent);
router.put('/students/:id', upload.fields([{ name: 'faceImage', maxCount: 1 }]), adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/bulk-delete', adminController.bulkDeleteStudents);

// ========================= TEACHER MANAGEMENT =========================
router.get('/teachers', adminController.getAllTeachers);
router.get('/teachers/:teacherId/classes', adminController.getTeacherClasses);
router.get('/teachers/:teacherId/schedules', adminController.getTeacherSchedules);
router.get('/teachers/:id', adminController.getTeacherById);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

// ========================= CLASS MANAGEMENT =========================
router.get('/classes', adminController.getAllClasses);
router.get('/classes/:id', adminController.getClassById);
router.post('/classes', adminController.createClass);

// ========================= ATTENDANCE MANAGEMENT =========================
router.get('/attendance/class/:classId', adminController.getAttendanceRecords);

// ========================= ENROLLMENT MANAGEMENT =========================
router.post('/enrollments', adminController.enrollStudent);
router.post('/enrollments/bulk', adminController.bulkEnrollStudents);
router.delete('/enrollments', adminController.unenrollStudent);
router.get('/enrollments/class/:classId', adminController.getClassEnrollments);
router.get('/enrollments/student/:studentId', adminController.getStudentEnrollments);

// ========================= SCHEDULE MANAGEMENT =========================
router.get('/schedules', adminController.getAllSchedules);
router.post('/schedules', adminController.createSchedule);
router.put('/schedules/:id', adminController.updateSchedule);
router.delete('/schedules/:id', adminController.deleteSchedule);

// ========================= RECURRING SCHEDULE MANAGEMENT =========================
router.get('/recurring-schedules', adminController.getAllRecurringSchedules);
router.post('/recurring-schedules', adminController.createRecurringSchedule);
router.delete('/recurring-schedules/:id', adminController.deleteRecurringSchedule);

export default router;
