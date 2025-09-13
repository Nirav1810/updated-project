// Shared exports
export { default as connectDB } from './config/db.js';
export { protect, admin, teacher } from './middleware/authMiddleware.js';

// Model exports
export { User } from './models/userModel.js';
export { Class } from './models/classModel.js';
export { Attendance } from './models/attendanceModel.js';
export { QRCodeSession } from './models/qrCodeSessionModel.js';
export { ClassEnrollment } from './models/classEnrollmentModel.js';
export { Schedule } from './models/scheduleModel.js';
export { RecurringSchedule, ScheduleOverride, ScheduleInstance } from './models/recurringScheduleModel.js';
export { Room } from './models/roomModel.js';
export { TimeSlot } from './models/timeSlotModel.js';
