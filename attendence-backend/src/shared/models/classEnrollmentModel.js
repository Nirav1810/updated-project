import mongoose from 'mongoose';
const classEnrollmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  enrolledAt: { type: Date, default: Date.now },
}, { timestamps: true });
export const ClassEnrollment = mongoose.model('ClassEnrollment', classEnrollmentSchema);