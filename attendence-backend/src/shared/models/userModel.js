import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  enrollmentNo: { 
    type: String, 
    required: function() {
      return this.role === 'student'; // Only required for students
    },
    index: { unique: true, sparse: true } // Unique sparse index
  },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  fullName: { type: String },
  role: { type: String, enum: ['teacher', 'student', 'admin'], required: true, default: 'teacher' },
  // Student-specific fields
  classYear: { 
    type: String, 
    required: function() {
      return this.role === 'student';
    },
    enum: ['1', '2', '3', '4'] // Academic years
  },
  semester: { 
    type: String, 
    required: function() {
      return this.role === 'student';
    },
    enum: ['1', '2', '3', '4', '5', '6', '7', '8'] // Semesters
  },
  faceEmbedding: { type: [Number], default: [] },
}, { 
  timestamps: true,
  strict: true
});

// Pre-save hook to ensure enrollmentNo, classYear, and semester are not set for teachers/admins
userSchema.pre('save', function(next) {
  if (this.role === 'teacher' || this.role === 'admin') {
    // Remove student-specific fields completely for teachers/admins
    this.enrollmentNo = undefined;
    this.classYear = undefined;
    this.semester = undefined;
  }
  next();
});

export const User = mongoose.model('User', userSchema);