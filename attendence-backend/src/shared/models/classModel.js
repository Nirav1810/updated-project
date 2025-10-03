import mongoose from 'mongoose';
const classSchema = new mongoose.Schema({
  classNumber: { type: String, required: true },
  subjectCode: { type: String, required: true, index: true },
  subjectName: { type: String, required: true },
  classYear: { type: String, required: true },
  semester: { type: String, required: true },
  division: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Allow unassigned classes
  teacherName: { type: String, required: false }, // Allow unassigned classes
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Track who created the class (admin or teacher)
}, { timestamps: true });
export const Class = mongoose.model('Class', classSchema);