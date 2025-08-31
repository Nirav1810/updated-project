import express from 'express';
import { 
  createClass, 
  getAllClasses, 
  getClassById, 
  updateClass, 
  deleteClass,
  enrollStudent,
  enrollStudentByEnrollmentNo,
  getEnrolledStudents,
  removeStudentFromClass
} from '../controllers/classController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Teacher routes
router.route('/').post(teacher, createClass).get(getAllClasses);
router.route('/:id').get(getClassById).put(teacher, updateClass).delete(teacher, deleteClass);

// Student enrollment routes
router.route('/:classId/enroll').post(teacher, enrollStudent);
router.route('/:classId/enroll-by-enrollment-no').post(teacher, enrollStudentByEnrollmentNo);
router.route('/:classId/students').get(teacher, getEnrolledStudents);
router.route('/:classId/students/:studentId').delete(teacher, removeStudentFromClass);

export default router;