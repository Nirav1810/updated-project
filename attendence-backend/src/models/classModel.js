import mongoose from 'mongoose';
const classSchema = new mongoose.Schema({
  classNumber: { type: String, required: true },
  subjectCode: { type: String, required: true, index: true },
  subjectName: { type: String, required: true },
  classYear: { type: String, required: true },
  semester: { type: String, required: true },
  division: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, required: true },
}, { timestamps: true });
export const Class = mongoose.model('Class', classSchema);