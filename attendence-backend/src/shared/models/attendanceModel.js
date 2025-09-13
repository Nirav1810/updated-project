import mongoose from 'mongoose';
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QRCodeSession', required: false },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: false },
  studentCoordinates: { latitude: Number, longitude: Number },
  timestamp: { type: Date, default: Date.now },
  livenessPassed: { type: Boolean, required: true },
  faceEmbedding: { type: [Number], required: false, default: [] },
  synced: { type: Boolean, default: false },
  syncVersion: { type: Number, default: 1 },
  manualEntry: { type: Boolean, default: false },
  notes: { type: String, default: '' }, // Add notes field for manual entries
}, { timestamps: true });
export const Attendance = mongoose.model('Attendance', attendanceSchema);