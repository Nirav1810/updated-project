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

// Merge two consecutive schedules into one
export const mergeSchedules = async (req, res) => {
  try {
    const { sourceScheduleId, targetScheduleId, customLabel } = req.body;
    const teacherId = req.user.id;

    console.log('Merge request:', { sourceScheduleId, targetScheduleId, customLabel, teacherId });

    // Find both schedules
    const sourceSchedule = await Schedule.findOne({ 
      _id: sourceScheduleId, 
      teacherId 
    }).populate('classId');
    
    const targetSchedule = await Schedule.findOne({ 
      _id: targetScheduleId, 
      teacherId 
    }).populate('classId');

    console.log('Found schedules:', { 
      source: sourceSchedule ? 'found' : 'not found', 
      target: targetSchedule ? 'found' : 'not found' 
    });

    if (!sourceSchedule || !targetSchedule) {
      return res.status(404).json({ message: 'One or both schedules not found' });
    }

    // Validate that schedules can be merged
    if (sourceSchedule.dayOfWeek !== targetSchedule.dayOfWeek) {
      return res.status(400).json({ message: 'Can only merge schedules on the same day' });
    }

    if (sourceSchedule.classId._id.toString() !== targetSchedule.classId._id.toString()) {
      return res.status(400).json({ message: 'Can only merge schedules for the same class' });
    }

    // Determine the time range for merged session
    const times = [
      { time: sourceSchedule.startTime, type: 'start' },
      { time: sourceSchedule.endTime, type: 'end' },
      { time: targetSchedule.startTime, type: 'start' },
      { time: targetSchedule.endTime, type: 'end' }
    ];
    
    // Sort times properly (handling HH:mm format)
    times.sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number);
      const [bHour, bMin] = b.time.split(':').map(Number);
      const aMinutes = aHour * 60 + aMin;
      const bMinutes = bHour * 60 + bMin;
      return aMinutes - bMinutes;
    });
    
    const startTime = times[0].time;
    const endTime = times[3].time;

    console.log('Creating merged schedule with:', {
      classId: sourceSchedule.classId._id,
      teacherId,
      sessionType: 'lab',
      dayOfWeek: sourceSchedule.dayOfWeek,
      startTime,
      endTime,
      roomNumber: sourceSchedule.roomNumber,
      semester: sourceSchedule.semester,
      academicYear: sourceSchedule.academicYear,
      customLabel: customLabel || 'Lab Session'
    });

    // Create merged schedule entries for each original time slot
    // This ensures they appear correctly in the grid
    const mergedSchedules = [];
    
    // Create schedule for first time slot
    const firstMergedSchedule = new Schedule({
      classId: sourceSchedule.classId._id,
      teacherId,
      sessionType: 'lab',
      dayOfWeek: sourceSchedule.dayOfWeek,
      startTime: sourceSchedule.startTime,
      endTime: sourceSchedule.endTime,
      roomNumber: sourceSchedule.roomNumber,
      semester: sourceSchedule.semester,
      academicYear: sourceSchedule.academicYear,
      isMerged: true,
      customLabel: customLabel || 'Lab Session',
      originalSlots: [
        {
          startTime: sourceSchedule.startTime,
          endTime: sourceSchedule.endTime,
          timeSlotId: sourceSchedule._id.toString()
        },
        {
          startTime: targetSchedule.startTime,
          endTime: targetSchedule.endTime,
          timeSlotId: targetSchedule._id.toString()
        }
      ],
      mergedTimeSlots: [sourceSchedule._id.toString(), targetSchedule._id.toString()],
      mergedSessionRange: `${startTime}-${endTime}` // Store full range
    });

    // Create schedule for second time slot
    const secondMergedSchedule = new Schedule({
      classId: sourceSchedule.classId._id,
      teacherId,
      sessionType: 'lab',
      dayOfWeek: sourceSchedule.dayOfWeek,
      startTime: targetSchedule.startTime,
      endTime: targetSchedule.endTime,
      roomNumber: sourceSchedule.roomNumber,
      semester: sourceSchedule.semester,
      academicYear: sourceSchedule.academicYear,
      isMerged: true,
      customLabel: customLabel || 'Lab Session',
      originalSlots: [
        {
          startTime: sourceSchedule.startTime,
          endTime: sourceSchedule.endTime,
          timeSlotId: sourceSchedule._id.toString()
        },
        {
          startTime: targetSchedule.startTime,
          endTime: targetSchedule.endTime,
          timeSlotId: targetSchedule._id.toString()
        }
      ],
      mergedTimeSlots: [sourceSchedule._id.toString(), targetSchedule._id.toString()],
      mergedSessionRange: `${startTime}-${endTime}`, // Store full range
      linkedMergedSchedule: null // Will be set after saving
    });

    await firstMergedSchedule.save();
    await secondMergedSchedule.save();
    
    // Link the two merged schedules
    firstMergedSchedule.linkedMergedSchedule = secondMergedSchedule._id;
    secondMergedSchedule.linkedMergedSchedule = firstMergedSchedule._id;
    
    await firstMergedSchedule.save();
    await secondMergedSchedule.save();

    mergedSchedules.push(firstMergedSchedule, secondMergedSchedule);
    
    console.log('Merged schedules saved:', mergedSchedules.map(s => s._id));

    // Delete the original schedules
    const deleteResult = await Schedule.deleteMany({ 
      _id: { $in: [sourceScheduleId, targetScheduleId] },
      teacherId 
    });
    
    console.log('Deleted original schedules:', deleteResult.deletedCount);

    const populatedMerged = await Schedule.find({ 
      _id: { $in: mergedSchedules.map(s => s._id) }
    }).populate('classId', 'subjectCode subjectName classYear semester division');

    res.status(200).json({
      success: true,
      message: 'Schedules merged successfully',
      mergedSchedules: populatedMerged
    });
  } catch (error) {
    console.error('Merge schedules error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Split a merged schedule back into individual slots
export const splitSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const teacherId = req.user.id;

    const mergedSchedule = await Schedule.findOne({ 
      _id: scheduleId, 
      teacherId,
      isMerged: true 
    }).populate('classId');

    if (!mergedSchedule) {
      return res.status(404).json({ message: 'Merged schedule not found' });
    }

    // Find the linked merged schedule
    const linkedSchedule = await Schedule.findOne({
      _id: mergedSchedule.linkedMergedSchedule,
      teacherId,
      isMerged: true
    });

    // Recreate original schedules
    const originalSchedules = [];
    for (const slot of mergedSchedule.originalSlots) {
      const newSchedule = new Schedule({
        classId: mergedSchedule.classId._id,
        teacherId,
        sessionType: 'lecture', // Default back to lecture
        dayOfWeek: mergedSchedule.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomNumber: mergedSchedule.roomNumber,
        semester: mergedSchedule.semester,
        academicYear: mergedSchedule.academicYear,
        isMerged: false
      });
      
      await newSchedule.save();
      originalSchedules.push(newSchedule);
    }

    // Delete both merged schedules
    const scheduleIdsToDelete = [scheduleId];
    if (linkedSchedule) {
      scheduleIdsToDelete.push(linkedSchedule._id);
    }
    
    await Schedule.deleteMany({ 
      _id: { $in: scheduleIdsToDelete },
      teacherId 
    });

    const populatedSchedules = await Schedule.find({ 
      _id: { $in: originalSchedules.map(s => s._id) }
    }).populate('classId', 'subjectCode subjectName classYear semester division');

    res.status(200).json({
      success: true,
      message: 'Merged schedule split successfully',
      schedules: populatedSchedules
    });
  } catch (error) {
    console.error('Split schedule error:', error);
    res.status(500).json({ message: error.message });
  }
};