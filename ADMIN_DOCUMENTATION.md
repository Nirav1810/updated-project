# Admin Panel Documentation

## Overview

The Admin Panel is a comprehensive management system that allows administrators to:
- View system-wide statistics
- Manage student and teacher accounts
- Enroll students in classes
- Schedule classes for teachers
- Monitor attendance across the system

## Features

### 1. Dashboard
- **Statistics Overview**: Total students, teachers, classes, and schedules
- **Recent Activity**: View recent registrations (last 30 days)
- **Today's Attendance**: Monitor daily attendance records
- **Quick Actions**: Fast access to common admin tasks

**Access**: `/admin`

### 2. Student Management
- **View All Students**: Browse all registered students with pagination
- **Search & Filter**: Search by name, email, or enrollment number; filter by class year and semester
- **Create Student**: Add new students with face image upload
- **Edit Student**: Update student information
- **Delete Student**: Remove students (also removes their enrollments and attendance records)
- **Bulk Operations**: Delete multiple students at once
- **Pending Students**: View students who haven't been enrolled in any class yet

**Endpoints**:
- GET `/api/admin/students` - Get all students
- GET `/api/admin/students/pending` - Get pending students
- GET `/api/admin/students/:id` - Get student details
- POST `/api/admin/students` - Create new student
- PUT `/api/admin/students/:id` - Update student
- DELETE `/api/admin/students/:id` - Delete student
- POST `/api/admin/students/bulk-delete` - Bulk delete students

**Access**: `/admin/students`

### 3. Teacher Management
- **View All Teachers**: Browse all registered teachers
- **Search Teachers**: Search by name or email
- **Create Teacher**: Add new teacher accounts
- **Edit Teacher**: Update teacher information
- **Delete Teacher**: Remove teachers (checks for active classes first)
- **View Classes**: See which classes each teacher is assigned to

**Endpoints**:
- GET `/api/admin/teachers` - Get all teachers
- GET `/api/admin/teachers/:id` - Get teacher details
- POST `/api/admin/teachers` - Create new teacher
- PUT `/api/admin/teachers/:id` - Update teacher
- DELETE `/api/admin/teachers/:id` - Delete teacher

**Access**: `/admin/teachers`

### 4. Enrollment Management
- **Class-Based Enrollment**: Select a class and enroll students
- **View Enrolled Students**: See all students enrolled in a class
- **Bulk Enrollment**: Enroll multiple students at once
- **Unenroll Students**: Remove students from classes
- **Available Students List**: Only shows students not yet enrolled in the selected class

**Endpoints**:
- POST `/api/admin/enrollments` - Enroll a student
- POST `/api/admin/enrollments/bulk` - Bulk enroll students
- DELETE `/api/admin/enrollments` - Unenroll a student
- GET `/api/admin/enrollments/class/:classId` - Get class enrollments
- GET `/api/admin/enrollments/student/:studentId` - Get student enrollments

**Access**: `/admin/enrollments`

### 5. Schedule Management
- **Create Schedules**: Assign classes to teachers with specific time slots
- **View Schedules**: Filter by teacher, class, or day of week
- **Update Schedules**: Modify existing schedules
- **Delete Schedules**: Remove schedules
- **Conflict Detection**: Automatically prevents scheduling conflicts

**Endpoints**:
- GET `/api/admin/schedules` - Get all schedules
- POST `/api/admin/schedules` - Create schedule
- PUT `/api/admin/schedules/:id` - Update schedule
- DELETE `/api/admin/schedules/:id` - Delete schedule

## User Roles

### Admin
- Full access to all admin features
- Can manage students, teachers, classes, and schedules
- Can view system-wide statistics
- Access to both teacher portal and admin panel

### Teacher
- Access to teacher portal only
- Can manage their own classes
- Can take attendance
- Cannot access admin panel

### Student
- Mobile app access only
- Can view their classes and attendance
- Can scan QR codes for attendance

## Authentication & Authorization

### Middleware
All admin routes are protected by two middleware functions:

1. **`protect`**: Verifies JWT token
2. **`admin`**: Checks if user role is 'admin'

Example route protection:
```javascript
router.use(protect, admin);
```

### Token Storage
- JWT tokens are stored in localStorage
- User data is stored in localStorage
- Tokens expire after 30 days

## Frontend Pages

### Admin Dashboard (`/admin`)
- Statistics cards showing key metrics
- Quick action buttons
- System overview

### Student Management (`/admin/students`)
- Searchable student list
- Filter by class year and semester
- Bulk operations support
- Pending students view

### Teacher Management (`/admin/teachers`)
- Teacher list with search
- Class and schedule counts
- Edit/delete actions

### Enrollment Management (`/admin/enrollments`)
- Two-panel interface
- Available students on left
- Enrolled students on right
- Drag-like selection with checkboxes

## API Examples

### Create a Student
```javascript
POST /api/admin/students
Content-Type: multipart/form-data

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "enrollmentNo": "2024001",
  "classYear": "FY",
  "semester": "I",
  "faceImage": [File]
}
```

### Enroll Students in Bulk
```javascript
POST /api/admin/enrollments/bulk
Content-Type: application/json

{
  "studentIds": ["id1", "id2", "id3"],
  "classId": "classId123"
}
```

### Create a Schedule
```javascript
POST /api/admin/schedules
Content-Type: application/json

{
  "classId": "classId123",
  "teacherId": "teacherId123",
  "sessionType": "lecture",
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "10:00",
  "roomNumber": "C-204",
  "semester": "VII",
  "academicYear": "2025-26"
}
```

## Frontend Services

All admin operations are handled through `adminService.js`:

```javascript
import { getDashboardStats, getAllStudents, createStudent } from '../services/adminService';

// Get dashboard statistics
const stats = await getDashboardStats();

// Get students with filters
const students = await getAllStudents({
  page: 1,
  limit: 20,
  search: 'john',
  classYear: 'FY'
});

// Create a new student
const formData = new FormData();
formData.append('fullName', 'John Doe');
formData.append('email', 'john@example.com');
// ... other fields
await createStudent(formData);
```

## Database Models Used

### User Model
- Stores students, teachers, and admins
- Role-based access control
- Password hashing with bcrypt

### Class Model
- Class information
- Teacher assignment
- Subject details

### ClassEnrollment Model
- Student-class relationships
- Enrollment timestamps

### Schedule Model
- Class schedules
- Teacher assignments
- Time slots and rooms
- Conflict detection support

### Attendance Model
- Attendance records
- Status tracking (present, absent, late)

## Navigation

The sidebar dynamically shows admin menu items when logged in as admin:

```javascript
// Admin menu items only visible to admins
{user?.role === 'admin' && (
  <>
    <div>Admin Panel</div>
    <Link to="/admin">Admin Dashboard</Link>
    <Link to="/admin/students">Students</Link>
    <Link to="/admin/teachers">Teachers</Link>
    <Link to="/admin/enrollments">Enrollments</Link>
  </>
)}
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt (pre-save hook)
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access**: Admin routes require admin role
4. **Input Validation**: All inputs are validated on backend
5. **Unique Constraints**: Email and enrollment numbers are unique
6. **Cascade Deletes**: Related records are cleaned up when deleting users

## Error Handling

All endpoints return consistent error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Frontend displays errors using:
- Alert modals for critical errors
- Toast notifications for success/info
- Inline error messages in forms

## Future Enhancements

Potential improvements:
- Export student/teacher data to CSV
- Import students from CSV
- Advanced attendance reports
- Email notifications
- Audit logs for admin actions
- Role management (create custom roles)
- Bulk schedule creation
- Academic year management

## Setup Instructions

1. **Backend**: Admin routes are already registered in `server.js`
2. **Frontend**: Admin pages are imported in `App.js` and routes are configured
3. **Navigation**: Sidebar automatically shows admin menu for admin users
4. **Access**: Login with an admin account to access admin features

## Testing

To test admin features:

1. Create an admin user in the database:
```javascript
{
  "email": "admin@example.com",
  "password": "hashedPassword",
  "fullName": "Admin User",
  "role": "admin"
}
```

2. Login with admin credentials
3. Navigate to `/admin` to access admin dashboard
4. Test each feature systematically

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify JWT token is valid
- Ensure user role is set to 'admin'
- Check network tab for API response details
