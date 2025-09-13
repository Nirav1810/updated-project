import { TimeSlot } from '../models/timeSlotModel.js';

// Get all time slots
export const getAllTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlot.find().sort({ startTime: 1 });

    const transformedTimeSlots = timeSlots.map(slot => ({
      _id: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime
    }));

    res.json(transformedTimeSlots);

  } catch (error) {
    console.error('Get All Time Slots Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get available time slots
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { roomId, date } = req.query;

    // For now, just return all time slots
    // In a more complex implementation, you would check for conflicts
    const timeSlots = await TimeSlot.find().sort({ startTime: 1 });

    const transformedTimeSlots = timeSlots.map(slot => ({
      _id: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime
    }));

    res.json(transformedTimeSlots);

  } catch (error) {
    console.error('Get Available Time Slots Error:', error);
    res.status(500).json({ message: error.message });
  }
};