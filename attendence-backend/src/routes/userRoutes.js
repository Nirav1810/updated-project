import express from 'express';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  changePassword
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('Setting up user routes...');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

console.log('Register and login routes added');

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/change-password').put(protect, changePassword);

// Admin routes (existing CRUD)
router.route('/').post(createUser).get(getAllUsers);
router.route('/:id').get(getUserById);

console.log('All user routes configured');

export default router;