import { Schedule } from '../models/scheduleModel.js';
import { Class } from '../models/classModel.js';

// Get teacher's weekly schedule
export const getTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { week, academicYear } = req.query;

    const query = { 
      teacherId,
      isActive: true
    };

    if (academicYear) {
      query.academicYear = academicYear;
    }

    const schedules = await Schedule.find(query)
      .populate('classId', 'subjectCode subjectName classYear semester division')
      .sort({ dayOfWeek: 1, startTime: 1 });

    // Group by day of week
    const weeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: []
    };

    schedules.forEach(schedule => {
      if (weeklySchedule[schedule.dayOfWeek]) {
        weeklySchedule[schedule.dayOfWeek].push(schedule);
      }
    });

    res.status(200).json({
      success: true,
      weeklySchedule,
      totalClasses: schedules.length
    });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get today's schedule
export const getTodaySchedule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const todaySchedules = await Schedule.find({
      teacherId,
      dayOfWeek: today,
      isActive: true
    })
    .populate('classId', 'subjectCode subjectName classYear semester division')
    .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      day: today,
      classes: todaySchedules,
      totalClasses: todaySchedules.length
    });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create multiple schedules (bulk import)
export const createBulkSchedules = async (req, res) => {
  try {
    const { schedules } = req.body;
    const teacherId = req.user.id;

    // Add teacherId to each schedule
    const schedulesWithTeacher = schedules.map(schedule => ({
      ...schedule,
      teacherId
    }));

    const createdSchedules = await Schedule.insertMany(schedulesWithTeacher);

    res.status(201).json({
      success: true,
      message: `${createdSchedules.length} schedules created successfully`,
      schedules: createdSchedules
    });
  } catch (error) {
    console.error('Create bulk schedules error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Check for schedule conflicts
export const checkScheduleConflict = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, roomNumber, excludeId } = req.body;
    const teacherId = req.user.id;

    const query = {
      teacherId,
      dayOfWeek,
      roomNumber,
      isActive: true,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const conflictingSchedules = await Schedule.find(query)
      .populate('classId', 'subjectCode subjectName');

    res.status(200).json({
      success: true,
      hasConflict: conflictingSchedules.length > 0,
      conflicts: conflictingSchedules
    });
  } catch (error) {
    console.error('Check schedule conflict error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Basic CRUD for Schedules
export const createSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.create({
      ...req.body,
      teacherId: req.user.id
    });
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('classId', 'subjectCode subjectName classYear semester division');
    
    res.status(201).json(populatedSchedule);
  } catch (error) { 
    console.error('Create schedule error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacherId: req.user.id })
      .populate('classId', 'subjectCode subjectName classYear semester division')
      .sort({ dayOfWeek: 1, startTime: 1 });
    res.status(200).json(schedules);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ 
      _id: req.params.id, 
      teacherId: req.user.id 
    }).populate('classId', 'subjectCode subjectName classYear semester division');
    
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.status(200).json(schedule);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user.id },
      req.body,
      { new: true }
    ).populate('classId', 'subjectCode subjectName classYear semester division');
    
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.status(200).json(schedule);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ 
      _id: req.params.id, 
      teacherId: req.user.id 
    });
    
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};