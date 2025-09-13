import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "1st Period", "2nd Period"
  startTime: { type: String, required: true }, // Format: "09:00"
  endTime: { type: String, required: true },   // Format: "10:00"
  type: { 
    type: String, 
    enum: ['lecture', 'lab', 'break'], 
    required: true 
  },
  duration: { type: Number }, // Duration in minutes - calculated automatically
  isActive: { type: Boolean, default: true },
  order: { type: Number, required: true }, // Order of the time slot in a day
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who created it
}, { timestamps: true });

// Index for efficient querying
timeSlotSchema.index({ order: 1 });
timeSlotSchema.index({ startTime: 1 });
timeSlotSchema.index({ isActive: 1 });

// Static method to get active time slots ordered by time
timeSlotSchema.statics.getActiveSlots = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// Instance method to calculate duration
timeSlotSchema.methods.calculateDuration = function() {
  const start = new Date(`2000-01-01T${this.startTime}:00`);
  const end = new Date(`2000-01-01T${this.endTime}:00`);
  return (end - start) / (1000 * 60); // Duration in minutes
};

// Pre-save middleware to calculate duration
timeSlotSchema.pre('save', function(next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    this.duration = this.calculateDuration();
  }
  next();
});

export const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
