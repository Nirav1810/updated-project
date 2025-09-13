import { TimeSlot } from '../../shared/models/timeSlotModel.js';
import { Schedule } from '../../shared/models/scheduleModel.js';

// Get all time slots
export const getTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlot.getActiveSlots();
    
    res.status(200).json({
      success: true,
      timeSlots
    });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new time slot
export const createTimeSlot = async (req, res) => {
  try {
    const { name, startTime, endTime, type, order } = req.body;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM format.' });
    }

    // Check if start time is before end time
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    // Check for overlapping time slots
    const overlapping = await TimeSlot.findOne({
      isActive: true,
      $or: [
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gt: startTime } }
          ]
        }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ 
        message: 'Time slot overlaps with existing slot: ' + overlapping.name 
      });
    }

    // If no order provided, set it as the last one
    let slotOrder = order;
    if (!slotOrder) {
      const lastSlot = await TimeSlot.findOne({ isActive: true }).sort({ order: -1 });
      slotOrder = lastSlot ? lastSlot.order + 1 : 1;
    }

    const timeSlot = new TimeSlot({
      name,
      startTime,
      endTime,
      type,
      order: slotOrder,
      createdBy: req.user.id
    });

    await timeSlot.save();

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      timeSlot
    });
  } catch (error) {
    console.error('Create time slot error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update a time slot
export const updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, type, order } = req.body;

    const timeSlot = await TimeSlot.findById(id);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    // Validate time format if provided
    if (startTime || endTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (startTime && !timeRegex.test(startTime)) {
        return res.status(400).json({ message: 'Invalid start time format. Use HH:MM format.' });
      }
      if (endTime && !timeRegex.test(endTime)) {
        return res.status(400).json({ message: 'Invalid end time format. Use HH:MM format.' });
      }
    }

    // Check if start time is before end time
    const newStartTime = startTime || timeSlot.startTime;
    const newEndTime = endTime || timeSlot.endTime;
    const start = new Date(`2000-01-01T${newStartTime}:00`);
    const end = new Date(`2000-01-01T${newEndTime}:00`);
    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    // Check for overlapping time slots (excluding current slot)
    const overlapping = await TimeSlot.findOne({
      _id: { $ne: id },
      isActive: true,
      $or: [
        {
          $and: [
            { startTime: { $lt: newEndTime } },
            { endTime: { $gt: newStartTime } }
          ]
        }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ 
        message: 'Time slot overlaps with existing slot: ' + overlapping.name 
      });
    }

    // Update the time slot
    if (name) timeSlot.name = name;
    if (startTime) timeSlot.startTime = startTime;
    if (endTime) timeSlot.endTime = endTime;
    if (type) timeSlot.type = type;
    if (order) timeSlot.order = order;

    await timeSlot.save();

    res.status(200).json({
      success: true,
      message: 'Time slot updated successfully',
      timeSlot
    });
  } catch (error) {
    console.error('Update time slot error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a time slot
export const deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const timeSlot = await TimeSlot.findById(id);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    // Check if this time slot is being used in any schedule
    const schedulesUsingSlot = await Schedule.find({
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      isActive: true
    });

    if (schedulesUsingSlot.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete time slot. It is being used in ${schedulesUsingSlot.length} schedule(s). Please remove or update those schedules first.` 
      });
    }

    // Soft delete the time slot
    timeSlot.isActive = false;
    await timeSlot.save();

    res.status(200).json({
      success: true,
      message: 'Time slot deleted successfully'
    });
  } catch (error) {
    console.error('Delete time slot error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get available time slots for scheduling (exclude breaks)
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlot.find({
      isActive: true,
      type: { $in: ['lecture', 'lab'] } // Exclude breaks
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      timeSlots
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Initialize default time slots (for setup)
export const initializeDefaultTimeSlots = async (req, res) => {
  try {
    // Check if time slots already exist
    const existingSlots = await TimeSlot.countDocuments({ isActive: true });
    if (existingSlots > 0) {
      return res.status(400).json({ message: 'Time slots already exist' });
    }

    const defaultSlots = [
      { name: '1st Period', startTime: '09:00', endTime: '10:00', type: 'lecture', order: 1 },
      { name: '2nd Period', startTime: '10:00', endTime: '11:00', type: 'lecture', order: 2 },
      { name: 'Refreshment Break', startTime: '11:00', endTime: '11:15', type: 'break', order: 3 },
      { name: '3rd Period', startTime: '11:15', endTime: '12:15', type: 'lecture', order: 4 },
      { name: '4th Period', startTime: '12:15', endTime: '13:15', type: 'lecture', order: 5 },
      { name: 'Lunch Break', startTime: '13:15', endTime: '14:00', type: 'break', order: 6 },
      { name: '5th Period', startTime: '14:00', endTime: '15:00', type: 'lecture', order: 7 },
      { name: '6th Period', startTime: '15:00', endTime: '16:00', type: 'lecture', order: 8 },
      { name: '7th Period', startTime: '16:00', endTime: '17:00', type: 'lecture', order: 9 },
    ];

    const createdSlots = await TimeSlot.insertMany(
      defaultSlots.map(slot => ({
        ...slot,
        createdBy: req.user?.id || null // Allow null for public initialization
      }))
    );

    res.status(201).json({
      success: true,
      message: 'Default time slots initialized successfully',
      timeSlots: createdSlots
    });
  } catch (error) {
    console.error('Initialize default time slots error:', error);
    res.status(500).json({ message: error.message });
  }
};
