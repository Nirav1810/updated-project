import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true }, // e.g., "C-201", "E-301"
  type: { 
    type: String, 
    enum: ['classroom', 'lab', 'auditorium', 'seminar'], 
    required: true,
    default: 'classroom'
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Index for efficient querying
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ isActive: 1 });

// Static method to get active rooms
roomSchema.statics.getActiveRooms = function() {
  return this.find({ isActive: true }).sort({ roomNumber: 1 });
};

// Static method to get rooms by type
roomSchema.statics.getRoomsByType = function(type) {
  return this.find({ isActive: true, type }).sort({ roomNumber: 1 });
};

export const Room = mongoose.model('Room', roomSchema);
