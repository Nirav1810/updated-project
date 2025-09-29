import mongoose from 'mongoose';

const qrCodeSessionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: false },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true }, // Main session identifier
  currentToken: { type: String, required: true }, // Current rotating token
  tokenGeneratedAt: { type: Date, default: Date.now }, // When current token was generated
  sessionExpiresAt: { type: Date, required: true }, // When entire session expires
  qrPayload: {
    classNumber: String,
    subjectCode: String,
    subjectName: String,
    classYear: String,
    semester: String,
    division: String,
    timestamp: Date,
    coordinates: { latitude: Number, longitude: Number },
    sessionId: String, // Reference to main session
    token: String, // Current rotating token
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Only auto-expire based on session expiration when isActive is false
// Active sessions should not auto-expire until manually terminated
qrCodeSessionSchema.index({ sessionExpiresAt: 1 }, { 
  expireAfterSeconds: 60, // Give 1 minute buffer after session expires
  partialFilterExpression: { isActive: false }
});

// Regular indexes for performance (no auto-deletion)
// sessionId already has unique index from schema definition, no need to add another
qrCodeSessionSchema.index({ teacherId: 1, isActive: 1 });
qrCodeSessionSchema.index({ tokenGeneratedAt: 1 });

export const QRCodeSession = mongoose.model('QRCodeSession', qrCodeSessionSchema);