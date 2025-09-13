import mongoose from 'mongoose';

// Master recurring schedule template
const recurringScheduleSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Schedule details
  title: { type: String, required: true }, // e.g., "CS201 - BDA Lecture"
  sessionType: { type: String, enum: ['lecture', 'lab', 'project', 'tutorial'], required: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  startTime: { type: String, required: true }, // Format: "09:00"
  endTime: { type: String, required: true },   // Format: "10:00"
  roomNumber: { type: String, required: true },
  
  // Semester configuration
  semester: { type: String, required: true }, // e.g., "VII"
  academicYear: { type: String, required: true }, // e.g., "2025-26"
  semesterStartDate: { type: Date, required: true },
  semesterEndDate: { type: Date, required: true },
  
  // Recurrence settings
  isRecurring: { type: Boolean, default: true },
  frequency: { type: String, enum: ['weekly', 'biweekly'], default: 'weekly' },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Notes and description
  description: { type: String },
  notes: { type: String },
  
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [72.8311, 21.1591] },
  },
}, { timestamps: true });

// Schedule overrides for specific dates
const scheduleOverrideSchema = new mongoose.Schema({
  recurringScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringSchedule', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Override date
  overrideDate: { type: Date, required: true, index: true },
  
  // Override type
  overrideType: { 
    type: String, 
    enum: ['cancel', 'reschedule', 'modify'], 
    required: true 
  },
  
  // Modified schedule details (for reschedule/modify)
  newStartTime: { type: String }, // New start time if rescheduled
  newEndTime: { type: String },   // New end time if rescheduled
  newRoomNumber: { type: String }, // New room if changed
  newDate: { type: Date }, // New date if rescheduled to different day
  
  // Reason and notes
  reason: { type: String, required: true }, // e.g., "Holiday", "Makeup class", "Room change"
  notes: { type: String },
  
  // Status
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Generated schedule instances for each occurrence
const scheduleInstanceSchema = new mongoose.Schema({
  recurringScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringSchedule', required: true },
  overrideId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleOverride' }, // If this instance is overridden
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Actual schedule details for this instance
  scheduledDate: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  roomNumber: { type: String, required: true },
  sessionType: { type: String, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['scheduled', 'cancelled', 'completed', 'ongoing'], 
    default: 'scheduled' 
  },
  
  // Override information
  isOverridden: { type: Boolean, default: false },
  originalStartTime: { type: String }, // Original time before override
  originalEndTime: { type: String },
  originalRoomNumber: { type: String },
  overrideReason: { type: String },
  
  // Attendance tracking
  attendanceSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QRCodeSession' },
  attendanceMarked: { type: Boolean, default: false },
  attendanceCount: { type: Number, default: 0 },
  
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [72.8311, 21.1591] },
  },
}, { timestamps: true });

// Indexes for better performance
recurringScheduleSchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1 });
recurringScheduleSchema.index({ classId: 1, isActive: 1 });
recurringScheduleSchema.index({ location: '2dsphere' });

scheduleOverrideSchema.index({ recurringScheduleId: 1, overrideDate: 1 });
scheduleOverrideSchema.index({ teacherId: 1, overrideDate: 1 });

scheduleInstanceSchema.index({ teacherId: 1, scheduledDate: 1 });
scheduleInstanceSchema.index({ classId: 1, scheduledDate: 1 });
scheduleInstanceSchema.index({ recurringScheduleId: 1, scheduledDate: 1 });
scheduleInstanceSchema.index({ location: '2dsphere' });

export const RecurringSchedule = mongoose.model('RecurringSchedule', recurringScheduleSchema);
export const ScheduleOverride = mongoose.model('ScheduleOverride', scheduleOverrideSchema);
export const ScheduleInstance = mongoose.model('ScheduleInstance', scheduleInstanceSchema);
