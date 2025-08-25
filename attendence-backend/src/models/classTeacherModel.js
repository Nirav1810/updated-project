import mongoose from 'mongoose';
const classTeacherSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedAt: { type: Date, default: Date.now },
}, { timestamps: true });
export const ClassTeacher = mongoose.model('ClassTeacher', classTeacherSchema);