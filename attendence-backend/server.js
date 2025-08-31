import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';

// Import all routes
import userRoutes from './src/routes/userRoutes.js';
import classRoutes from './src/routes/classRoutes.js';
import scheduleRoutes from './src/routes/scheduleRoutes.js';
import recurringScheduleRoutes from './src/routes/recurringScheduleRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import timeSlotRoutes from './src/routes/timeSlotRoutes.js';
import roomRoutes from './src/routes/roomRoutes.js';
// Note: You can create and import routes for other models like ClassEnrollment, etc.

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Home Route
app.get('/', (req, res) => {
  res.send('Attendance API is up and running...🚀');
});

// Test POST route
app.post('/test', (req, res) => {
  res.json({ message: 'Test POST route works', body: req.body });
});

// Use API Routes
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/recurring-schedules', recurringScheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timeslots', timeSlotRoutes);
app.use('/api/rooms', roomRoutes);

console.log('Routes registered:');
console.log('- /api/users');
console.log('- /api/classes');
console.log('- /api/schedules');
console.log('- /api/recurring-schedules');
console.log('- /api/attendance');
console.log('- /api/timeslots');
console.log('- /api/rooms');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));