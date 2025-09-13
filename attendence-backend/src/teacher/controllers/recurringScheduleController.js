import { RecurringSchedule, ScheduleOverride, ScheduleInstance } from '../../shared/models/recurringScheduleModel.js';
import { Class } from '../../shared/models/classModel.js';

// Create a recurring schedule for the semester
export const createRecurringSchedule = async (req, res) => {
  try {
    const {
      classId,
      title,
      sessionType,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber,
      semester,
      academicYear,
      semesterStartDate,
      semesterEndDate,
      frequency = 'weekly',
      description,
      notes
    } = req.body;

    const teacherId = req.user.id;

    // Verify class belongs to teacher
    const classData = await Class.findOne({ _id: classId, teacherId });
    if (!classData) {
      return res.status(403).json({
        success: false,
        message: 'You can only create schedules for your own classes'
      });
    }

    // Check for conflicts with existing recurring schedules
    const conflictingSchedule = await RecurringSchedule.findOne({
      teacherId,
      dayOfWeek,
      isActive: true,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingSchedule) {
      return res.status(400).json({
        success: false,
        message: `You already have a class scheduled on ${dayOfWeek} from ${conflictingSchedule.startTime} to ${conflictingSchedule.endTime}`
      });
    }

    // Create recurring schedule
    const recurringSchedule = await RecurringSchedule.create({
      classId,
      teacherId,
      title: title || `${classData.subjectCode} - ${classData.subjectName}`,
      sessionType,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber,
      semester,
      academicYear,
      semesterStartDate: new Date(semesterStartDate),
      semesterEndDate: new Date(semesterEndDate),
      frequency,
      description,
      notes
    });

    // Generate schedule instances for the semester
    await generateScheduleInstances(recurringSchedule._id);

    const populatedSchedule = await RecurringSchedule.findById(recurringSchedule._id)
      .populate('classId', 'subjectCode subjectName classYear division');

    res.status(201).json({
      success: true,
      message: 'Recurring schedule created successfully',
      data: populatedSchedule
    });

  } catch (error) {
    console.error('Create Recurring Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recurring schedule',
      error: error.message
    });
  }
};

// Generate schedule instances based on recurring schedule
export const generateScheduleInstances = async (recurringScheduleId) => {
  try {
    const recurringSchedule = await RecurringSchedule.findById(recurringScheduleId);
    if (!recurringSchedule) {
      throw new Error('Recurring schedule not found');
    }

    // Delete existing instances for this recurring schedule
    await ScheduleInstance.deleteMany({ recurringScheduleId });

    const instances = [];
    const startDate = new Date(recurringSchedule.semesterStartDate);
    const endDate = new Date(recurringSchedule.semesterEndDate);
    
    // Find the first occurrence of the specified day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = daysOfWeek.indexOf(recurringSchedule.dayOfWeek);
    
    let currentDate = new Date(startDate);
    
    // Move to first occurrence of target day
    while (currentDate.getDay() !== targetDayIndex) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate instances
    while (currentDate <= endDate) {
      const instance = {
        recurringScheduleId,
        classId: recurringSchedule.classId,
        teacherId: recurringSchedule.teacherId,
        scheduledDate: new Date(currentDate),
        startTime: recurringSchedule.startTime,
        endTime: recurringSchedule.endTime,
        roomNumber: recurringSchedule.roomNumber,
        sessionType: recurringSchedule.sessionType
      };

      instances.push(instance);

      // Move to next occurrence based on frequency
      if (recurringSchedule.frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (recurringSchedule.frequency === 'biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      }
    }

    // Create all instances
    if (instances.length > 0) {
      await ScheduleInstance.insertMany(instances);
    }

    return instances.length;
  } catch (error) {
    console.error('Generate Schedule Instances Error:', error);
    throw error;
  }
};

// Get all recurring schedules for a teacher
export const getRecurringSchedules = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const schedules = await RecurringSchedule.find({ 
      teacherId, 
      isActive: true 
    })
    .populate('classId', 'subjectCode subjectName classYear division')
    .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: schedules,
      total: schedules.length
    });

  } catch (error) {
    console.error('Get Recurring Schedules Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recurring schedules',
      error: error.message
    });
  }
};

// Create schedule override for specific date
export const createScheduleOverride = async (req, res) => {
  try {
    const {
      recurringScheduleId,
      overrideDate,
      overrideType,
      newStartTime,
      newEndTime,
      newRoomNumber,
      newDate,
      reason,
      notes
    } = req.body;

    const teacherId = req.user.id;

    // Verify recurring schedule belongs to teacher
    const recurringSchedule = await RecurringSchedule.findOne({ 
      _id: recurringScheduleId, 
      teacherId 
    });
    
    if (!recurringSchedule) {
      return res.status(403).json({
        success: false,
        message: 'You can only create overrides for your own schedules'
      });
    }

    // Check if override already exists for this date
    const existingOverride = await ScheduleOverride.findOne({
      recurringScheduleId,
      overrideDate: new Date(overrideDate),
      isActive: true
    });

    if (existingOverride) {
      return res.status(400).json({
        success: false,
        message: 'An override already exists for this date'
      });
    }

    // Create override
    const override = await ScheduleOverride.create({
      recurringScheduleId,
      classId: recurringSchedule.classId,
      teacherId,
      overrideDate: new Date(overrideDate),
      overrideType,
      newStartTime,
      newEndTime,
      newRoomNumber,
      newDate: newDate ? new Date(newDate) : null,
      reason,
      notes
    });

    // Update corresponding schedule instance
    await updateScheduleInstance(recurringScheduleId, overrideDate, override);

    const populatedOverride = await ScheduleOverride.findById(override._id)
      .populate('recurringScheduleId', 'title sessionType')
      .populate('classId', 'subjectCode subjectName');

    res.status(201).json({
      success: true,
      message: 'Schedule override created successfully',
      data: populatedOverride
    });

  } catch (error) {
    console.error('Create Schedule Override Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule override',
      error: error.message
    });
  }
};

// Update schedule instance based on override
const updateScheduleInstance = async (recurringScheduleId, overrideDate, override) => {
  try {
    const targetDate = new Date(overrideDate);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const instance = await ScheduleInstance.findOne({
      recurringScheduleId,
      scheduledDate: { $gte: targetDate, $lt: nextDate }
    });

    if (!instance) {
      console.log('No schedule instance found for override date');
      return;
    }

    // Store original values
    const updateData = {
      overrideId: override._id,
      isOverridden: true,
      originalStartTime: instance.startTime,
      originalEndTime: instance.endTime,
      originalRoomNumber: instance.roomNumber,
      overrideReason: override.reason
    };

    // Apply override changes
    if (override.overrideType === 'cancel') {
      updateData.status = 'cancelled';
    } else if (override.overrideType === 'reschedule' || override.overrideType === 'modify') {
      if (override.newStartTime) updateData.startTime = override.newStartTime;
      if (override.newEndTime) updateData.endTime = override.newEndTime;
      if (override.newRoomNumber) updateData.roomNumber = override.newRoomNumber;
      if (override.newDate) updateData.scheduledDate = new Date(override.newDate);
    }

    await ScheduleInstance.findByIdAndUpdate(instance._id, updateData);

  } catch (error) {
    console.error('Update Schedule Instance Error:', error);
    throw error;
  }
};

// Get schedule for a specific date range
export const getScheduleForDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const teacherId = req.user.id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const instances = await ScheduleInstance.find({
      teacherId,
      scheduledDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('classId', 'subjectCode subjectName classYear division')
    .populate('recurringScheduleId', 'title sessionType')
    .populate('overrideId', 'reason overrideType')
    .sort({ scheduledDate: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: instances,
      total: instances.length
    });

  } catch (error) {
    console.error('Get Schedule For Date Range Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule',
      error: error.message
    });
  }
};

// Get today's schedule
export const getTodaysSchedule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const instances = await ScheduleInstance.find({
      teacherId,
      scheduledDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    })
    .populate('classId', 'subjectCode subjectName classYear division')
    .populate('recurringScheduleId', 'title sessionType')
    .populate('overrideId', 'reason overrideType')
    .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: instances,
      total: instances.length,
      message: instances.length === 0 ? 'No classes scheduled for today' : `${instances.length} classes scheduled for today`
    });

  } catch (error) {
    console.error('Get Todays Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s schedule',
      error: error.message
    });
  }
};

// Update recurring schedule
export const updateRecurringSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;
    const updateData = req.body;

    // Verify schedule belongs to teacher
    const schedule = await RecurringSchedule.findOne({ _id: id, teacherId });
    if (!schedule) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own schedules'
      });
    }

    // Update recurring schedule
    const updatedSchedule = await RecurringSchedule.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('classId', 'subjectCode subjectName classYear division');

    // Regenerate schedule instances if time/day changed
    if (updateData.dayOfWeek || updateData.startTime || updateData.endTime || 
        updateData.semesterStartDate || updateData.semesterEndDate) {
      await generateScheduleInstances(id);
    }

    res.status(200).json({
      success: true,
      message: 'Recurring schedule updated successfully',
      data: updatedSchedule
    });

  } catch (error) {
    console.error('Update Recurring Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recurring schedule',
      error: error.message
    });
  }
};

// Delete recurring schedule
export const deleteRecurringSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    // Verify schedule belongs to teacher
    const schedule = await RecurringSchedule.findOne({ _id: id, teacherId });
    if (!schedule) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own schedules'
      });
    }

    // Soft delete by setting isActive to false
    await RecurringSchedule.findByIdAndUpdate(id, { isActive: false });
    
    // Also delete/cancel related schedule instances
    await ScheduleInstance.updateMany(
      { recurringScheduleId: id },
      { status: 'cancelled' }
    );

    res.status(200).json({
      success: true,
      message: 'Recurring schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete Recurring Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recurring schedule',
      error: error.message
    });
  }
};
