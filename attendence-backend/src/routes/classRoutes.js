import express from 'express';
import { createClass, getAllClasses, getClassById } from '../controllers/classController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Teacher routes
router.route('/').post(teacher, createClass).get(getAllClasses);
router.route('/:id').get(getClassById);

export default router;