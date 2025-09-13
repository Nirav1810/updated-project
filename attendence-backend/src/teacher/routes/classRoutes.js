import express from 'express';
import { 
  createClass, 
  getAllClasses, 
  getClassById, 
  updateClass, 
  deleteClass 
} from '../controllers/classController.js';
import { protect } from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected (teacher must be logged in)
router.use(protect);

// Class management routes
router.post('/', createClass);
router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

export default router;
