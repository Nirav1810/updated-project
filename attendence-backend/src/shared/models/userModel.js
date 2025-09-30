import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  enrollmentNo: { 
    type: String, 
    required: function() { return this.role === 'student'; },
    index: { unique: true, sparse: true }
  },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student', 'admin'], required: true },
  classYear: { 
    type: String, 
    required: function() { return this.role === 'student'; }
  },
  semester: { 
    type: String, 
    required: function() { return this.role === 'student'; }
  },
  // Replaced faceEmbedding with a reference to the S3 image key
  faceImageS3Key: { type: String, default: null },
}, { 
  timestamps: true,
  strict: true
});

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


export const User = mongoose.model('User', userSchema);