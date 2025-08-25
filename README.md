# Attendance Management System

A comprehensive attendance management system built with React.js frontend and Node.js/Express backend, featuring QR code-based attendance tracking and real-time reporting.

## Features

### 🎯 Core Features
- **QR Code Attendance**: Students scan QR codes to mark attendance
- **Real-time Tracking**: Live attendance monitoring with rotating QR tokens
- **Teacher Dashboard**: Comprehensive class and attendance management
- **Schedule Management**: Class scheduling with break times (11:00-11:15 refreshment, 13:15-14:00 lunch)
- **Attendance Reports**: PDF and CSV export functionality with real data calculations
- **Multi-role Support**: Separate interfaces for teachers, students, and administrators

### 🔐 Security Features
- **JWT Authentication**: Secure user authentication and authorization
- **Role-based Access**: Teachers can only access their own classes and data
- **Data Isolation**: Complete separation between different teachers' data
- **Secure API Endpoints**: Protected routes with middleware authentication

### 📊 Reporting Features
- **Real Attendance Data**: Actual attendance calculations replacing mock data
- **Export Options**: PDF and CSV downloads for attendance reports
- **Empty Data Handling**: Graceful handling when no attendance data exists
- **Comprehensive Statistics**: Detailed attendance analytics per class

## Technology Stack

### Frontend (teacher-frontend)
- **React 19.1.1**: Modern React with latest features
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **jsPDF & jsPDF-autoTable**: PDF generation for reports
- **QR Code Libraries**: QR code generation and scanning

### Backend (attendence-backend)
- **Node.js & Express 4.21.2**: RESTful API server
- **MongoDB with Mongoose**: NoSQL database with ODM
- **JWT**: Authentication and authorization
- **bcrypt**: Password hashing
- **CORS**: Cross-origin resource sharing

## Project Structure

```
attendenceapp/
├── attendence-backend/          # Backend API server
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── models/             # Database schemas
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Authentication middleware
│   │   └── config/             # Database configuration
│   ├── server.js               # Entry point
│   └── package.json
├── teacher-frontend/           # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── contexts/          # React contexts
│   │   └── utils/             # Utility functions
│   ├── public/
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database
- npm or yarn package manager

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd attendence-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file with the following variables:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the server:
   ```bash
   npm start
   # or
   yarn start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd teacher-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login

### Classes
- `GET /api/classes` - Get teacher's classes
- `POST /api/classes` - Create new class
- `GET /api/classes/:id` - Get specific class

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance

### Schedules
- `GET /api/schedules` - Get schedules
- `POST /api/schedules` - Create schedule

## Key Features Implementation

### Teacher Data Isolation
Each teacher can only access their own classes and attendance data through:
- JWT-based user identification
- Database queries filtered by teacher ID
- Middleware protection on all routes

### Schedule Management
- Integrated break times (refreshment and lunch breaks)
- Visual break indicators in the schedule interface
- Simplified UI for multi-semester teaching

### Attendance Reports
- Real-time data calculations
- PDF export with proper formatting
- CSV export for data analysis
- Graceful empty state handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
