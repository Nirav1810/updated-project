import express from 'express';
import { register, login, forgotPassword, checkUserExists, clearUserByEmail, testPassword, cleanupOrphanedEnrollments } from '../controllers/unifiedAuthController.js';
import { uploadFaceImage, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', uploadFaceImage, handleMulterError, register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/check-availability', checkUserExists);
router.delete('/clear-user', clearUserByEmail); // Development only
router.post('/test-password', testPassword); // Debug only
router.post('/cleanup-enrollments', cleanupOrphanedEnrollments); // Development only

export default router;