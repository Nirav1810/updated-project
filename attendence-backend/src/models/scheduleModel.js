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
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [72.8311, 21.1591] }, // Surat coordinates
  },
}, { timestamps: true });

scheduleSchema.index({ location: '2dsphere' });
scheduleSchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);