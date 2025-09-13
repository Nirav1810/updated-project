import express from 'express';
import { registerTeacher, loginTeacher, getTeacherProfile, updateTeacherProfile } from '../controllers/authController.js';
import { protect } from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerTeacher);
router.post('/login', loginTeacher);

// Protected routes
router.get('/profile', protect, getTeacherProfile);
router.put('/profile', protect, updateTeacherProfile);

export default router;
