import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/shared/config/db.js';

// Import student routes
import studentAuthRoutes from './src/student/routes/authRoutes.js';

// Import unified routes (for mobile app)
import unifiedAuthRoutes from './src/shared/routes/unifiedAuthRoutes.js';
import unifiedClassRoutes from './src/shared/routes/unifiedClassRoutes.js';
import unifiedAttendanceRoutes from './src/shared/routes/unifiedAttendanceRoutes.js';
import unifiedUserRoutes from './src/shared/routes/unifiedUserRoutes.js';
import unifiedTimeSlotRoutes from './src/shared/routes/unifiedTimeSlotRoutes.js';
import qrRoutes from './src/shared/routes/qrRoutes.js';

// Import teacher routes
import teacherAuthRoutes from './src/teacher/routes/authRoutes.js';
import teacherClassRoutes from './src/teacher/routes/classRoutes.js';
import teacherAttendanceRoutes from './src/teacher/routes/attendanceRoutes.js';
import teacherScheduleRoutes from './src/teacher/routes/scheduleRoutes.js';
import teacherRecurringScheduleRoutes from './src/teacher/routes/recurringScheduleRoutes.js';
import teacherTimeSlotRoutes from './src/teacher/routes/timeSlotRoutes.js';
import teacherRoomRoutes from './src/teacher/routes/roomRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Home Route
app.get('/', (req, res) => {
  res.send('Attendance API is up and running...🚀');
});

// Test POST route
app.post('/test', (req, res) => {
  res.json({ message: 'Test POST route works', body: req.body });
});

// Use API Routes

// Unified routes (for mobile app)
app.use('/api/auth', unifiedAuthRoutes);
app.use('/api/classes', unifiedClassRoutes);
app.use('/api/attendances', unifiedAttendanceRoutes);
app.use('/api/users', unifiedUserRoutes);
app.use('/api/timeslots', unifiedTimeSlotRoutes);
app.use('/api/qr', qrRoutes);

// Student routes
app.use('/api/student/auth', studentAuthRoutes);


// Teacher routes  
app.use('/api/teacher/auth', teacherAuthRoutes);
app.use('/api/teacher/classes', teacherClassRoutes);
app.use('/api/teacher/attendance', teacherAttendanceRoutes);
app.use('/api/teacher/schedules', teacherScheduleRoutes);
app.use('/api/teacher/recurring-schedules', teacherRecurringScheduleRoutes);
app.use('/api/teacher/timeslots', teacherTimeSlotRoutes);
app.use('/api/teacher/rooms', teacherRoomRoutes);

console.log('Routes registered:');
console.log('Unified routes (for mobile app):');
console.log('- /api/auth');
console.log('- /api/classes');
console.log('- /api/attendances');
console.log('- /api/users');
console.log('- /api/timeslots');
console.log('- /api/qr');

console.log('Student routes:');
console.log('- /api/student/auth');

console.log('Teacher routes:');
console.log('- /api/teacher/auth');
console.log('- /api/teacher/classes');
console.log('- /api/teacher/attendance');
console.log('- /api/teacher/schedules');
console.log('- /api/teacher/recurring-schedules');
console.log('- /api/teacher/timeslots');
console.log('- /api/teacher/rooms');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));