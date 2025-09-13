// Teacher routes exports
export { default as authRoutes } from './routes/authRoutes.js';
export { default as classRoutes } from './routes/classRoutes.js';
export { default as attendanceRoutes } from './routes/attendanceRoutes.js';
export { default as scheduleRoutes } from './routes/scheduleRoutes.js';
export { default as recurringScheduleRoutes } from './routes/recurringScheduleRoutes.js';
export { default as timeSlotRoutes } from './routes/timeSlotRoutes.js';
export { default as roomRoutes } from './routes/roomRoutes.js';

// Teacher controllers exports
export * as authController from './controllers/authController.js';
export * as classController from './controllers/classController.js';
export * as attendanceController from './controllers/attendanceController.js';
export * as scheduleController from './controllers/scheduleController.js';
export * as recurringScheduleController from './controllers/recurringScheduleController.js';
export * as timeSlotController from './controllers/timeSlotController.js';
export * as roomController from './controllers/roomController.js';
