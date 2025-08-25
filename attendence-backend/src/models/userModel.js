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
  faceEmbedding: { type: [Number], default: [] },
}, { 
  timestamps: true,
  strict: true
});

// Pre-save hook to ensure enrollmentNo is not set for teachers/admins
userSchema.pre('save', function(next) {
  if (this.role === 'teacher' || this.role === 'admin') {
    // Remove enrollmentNo field completely for teachers/admins
    this.enrollmentNo = undefined;
  }
  next();
});

export const User = mongoose.model('User', userSchema);