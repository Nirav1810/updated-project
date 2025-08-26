import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomsByType,
  initializeDefaultRooms
} from '../controllers/roomController.js';

const router = express.Router();

// Public routes (no auth required for initial setup)
router.get('/public', getRooms);
router.post('/initialize-public', initializeDefaultRooms);

// All other routes require authentication
router.use(protect);

// Get all rooms
router.get('/', getRooms);

// Get rooms by type
router.get('/type/:type', getRoomsByType);

// Create a new room
router.post('/', createRoom);

// Initialize default rooms
router.post('/initialize', initializeDefaultRooms);

// Update a room
router.put('/:id', updateRoom);

// Delete a room
router.delete('/:id', deleteRoom);

export default router;
