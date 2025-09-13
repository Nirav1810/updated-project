import express from 'express';
import { getAllClasses, getClassById, getEnrolledClasses, getAvailableClasses, enrollInClass, getAvailableStudentsForClass, teacherEnrollStudent, teacherBatchEnrollStudents } from '../controllers/unifiedClassController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.get('/', protect, getAllClasses);
router.get('/enrolled', protect, getEnrolledClasses);
router.get('/available', protect, getAvailableClasses); // For students to browse available classes
router.get('/:classId/available-students', protect, getAvailableStudentsForClass); // For teachers to get all available students
router.post('/:classId/enroll', protect, enrollInClass); // For student self-enrollment
router.post('/:classId/enroll-student', protect, teacherEnrollStudent); // For teacher single enrollment
router.post('/:classId/batch-enroll', protect, teacherBatchEnrollStudents); // For teacher batch enrollment
router.get('/:id', protect, getClassById);

export default router;