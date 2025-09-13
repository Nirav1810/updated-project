import express from 'express';
import { registerStudent, loginStudent, getStudentProfile, updateStudentProfile } from '../controllers/authController.js';
import { protect } from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);

// Protected routes
router.get('/profile', protect, getStudentProfile);
router.put('/profile', protect, updateStudentProfile);

export default router;
