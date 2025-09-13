import express from 'express';
import { register, login, forgotPassword, checkUserExists, clearUserByEmail } from '../controllers/unifiedAuthController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/check-availability', checkUserExists);
router.delete('/clear-user', clearUserByEmail); // Development only

export default router;