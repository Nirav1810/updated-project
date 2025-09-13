import { Room } from '../../shared/models/roomModel.js';
import { Schedule } from '../../shared/models/scheduleModel.js';

// Get all rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.getActiveRooms();
    
    res.status(200).json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new room
export const createRoom = async (req, res) => {
  try {
    const { roomNumber, type } = req.body;

    if (!roomNumber || !type) {
      return res.status(400).json({ message: 'Room number and type are required' });
    }

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomNumber, isActive: true });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = new Room({
      roomNumber,
      type,
      createdBy: req.user?.id
    });

    await room.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Room number already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update a room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, type } = req.body;

    const room = await Room.findById(id);
    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if new room number already exists (excluding current room)
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ 
        roomNumber, 
        isActive: true, 
        _id: { $ne: id } 
      });
      if (existingRoom) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    // Update the room
    if (roomNumber) room.roomNumber = roomNumber;
    if (type) room.type = type;

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    console.error('Update room error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Room number already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete a room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if this room is being used in any schedule
    const schedulesUsingRoom = await Schedule.find({
      roomNumber: room.roomNumber,
      isActive: true
    });

    if (schedulesUsingRoom.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete room. It is being used in ${schedulesUsingRoom.length} schedule(s). Please remove or update those schedules first.` 
      });
    }

    // Soft delete the room
    room.isActive = false;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get rooms by type
export const getRoomsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const rooms = await Room.getRoomsByType(type);
    
    res.status(200).json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get rooms by type error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Initialize default rooms (for setup)
export const initializeDefaultRooms = async (req, res) => {
  try {
    // Check if rooms already exist
    const existingRooms = await Room.countDocuments({ isActive: true });
    if (existingRooms > 0) {
      return res.status(400).json({ message: 'Rooms already exist' });
    }

    const defaultRooms = [
      { roomNumber: 'C-201', type: 'classroom' },
      { roomNumber: 'C-202', type: 'classroom' },
      { roomNumber: 'C-203', type: 'classroom' },
      { roomNumber: 'C-204', type: 'classroom' },
      { roomNumber: 'E-201', type: 'lab' },
      { roomNumber: 'E-202', type: 'lab' },
      { roomNumber: 'A-301', type: 'auditorium' },
      { roomNumber: 'S-101', type: 'seminar' },
    ];

    const createdRooms = await Room.insertMany(
      defaultRooms.map(room => ({
        ...room,
        createdBy: req.user?.id || null
      }))
    );

    res.status(201).json({
      success: true,
      message: 'Default rooms initialized successfully',
      rooms: createdRooms
    });
  } catch (error) {
    console.error('Initialize default rooms error:', error);
    res.status(500).json({ message: error.message });
  }
};
