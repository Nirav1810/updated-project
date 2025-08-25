import mongoose from 'mongoose';
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QRCodeSession', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  studentCoordinates: { latitude: Number, longitude: Number },
  timestamp: { type: Date, default: Date.now },
  livenessPassed: { type: Boolean, required: true },
  faceEmbedding: { type: [Number], required: true },
  synced: { type: Boolean, default: false },
  syncVersion: { type: Number, default: 1 },
  manualEntry: { type: Boolean, default: false },
}, { timestamps: true });
export const Attendance = mongoose.model('Attendance', attendanceSchema);