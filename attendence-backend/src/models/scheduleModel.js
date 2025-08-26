import mongoose from 'mongoose';
const scheduleSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionType: { type: String, enum: ['lecture', 'lab', 'project'], required: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  startTime: { type: String, required: true }, // Format: "09:00"
  endTime: { type: String, required: true },   // Format: "10:00"
  roomNumber: { type: String, required: true }, // e.g., "C-204", "E-201"
  isActive: { type: Boolean, default: true },
  semester: { type: String, required: true }, // e.g., "VII"
  academicYear: { type: String, required: true }, // e.g., "2025-26"
  
  // Support for merged sessions
  isMerged: { type: Boolean, default: false },
  mergedTimeSlots: [{ type: String }], // Array of original time slot IDs that were merged
  customLabel: { type: String }, // Custom label for merged sessions (e.g., "Lab Session")
  originalSlots: [{
    startTime: { type: String },
    endTime: { type: String },
    timeSlotId: { type: String }
  }], // Store original individual slots for merged sessions
  mergedSessionRange: { type: String }, // Full time range for merged session (e.g., "09:00-11:00")
  linkedMergedSchedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }, // Link to other part of merged session
  
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [72.8311, 21.1591] }, // Surat coordinates
  },
}, { timestamps: true });

scheduleSchema.index({ location: '2dsphere' });
scheduleSchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);