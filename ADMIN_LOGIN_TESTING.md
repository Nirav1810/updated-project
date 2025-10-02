# Admin Login Testing Guide

## Current Setup

### Endpoints Updated:
- ✅ Login: Changed to `/api/auth/login` (unified endpoint)
- ✅ Register: Changed to `/api/auth/register` (unified endpoint)
- ✅ Role-based redirect logic added
- ✅ Debug logging added throughout the flow

### Files Modified:
1. `teacher-frontend/src/services/userService.js` - Unified endpoints
2. `teacher-frontend/src/contexts/AuthContext.js` - Enhanced with debugging
3. `teacher-frontend/src/pages/Login.js` - Role-based redirect + debugging
4. `teacher-frontend/src/pages/Register.js` - Unified endpoint + fullName support
5. `teacher-frontend/src/pages/Dashboard/index.js` - Auto-redirect for admins

## How to Test Admin Login

### Option 1: Register a New Admin Account

1. **Navigate to Register Page**
   - Go to `http://localhost:3000/register`

2. **Fill in the Form**
   - Full Name: `Admin User`
   - Email: `admin@example.com`
   - Role: Select **Admin** from dropdown
   - Password: `admin123`
   - Confirm Password: `admin123`

3. **Click "Create Account"**
   - Should redirect to login page
   - Should see success message

4. **Login with Admin Credentials**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Click "Sign in"

5. **Expected Result**
   - Should automatically redirect to `/admin` (Admin Dashboard)
   - Should see admin menu in sidebar
   - Should see dashboard statistics

### Option 2: Create Admin Directly in Database

If registration isn't working, create an admin user directly in MongoDB:

```javascript
// Connect to your MongoDB
use attendance_db;

// Insert admin user
db.users.insertOne({
  fullName: "Admin User",
  email: "admin@test.com",
  password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

Or using the unified register endpoint with Postman:

```
POST http://localhost:5001/api/auth/register
Content-Type: application/json

{
  "fullName": "Admin User",
  "email": "admin@test.com",
  "password": "admin123",
  "role": "admin"
}
```

### Debugging Steps

When you attempt to login, check the browser console for these logs:

1. **UserService Logs:**
   ```
   UserService: Sending login request to: /api/auth/login
   UserService: Credentials: { email: "admin@test.com", password: "***" }
   UserService: Response received: { token: "...", user: { ... } }
   ```

2. **AuthContext Logs:**
   ```
   AuthContext: Calling login API...
   AuthContext: API response: { token: "...", user: { ... } }
   AuthContext: Extracted token: present
   AuthContext: Extracted user data: { _id: "...", fullName: "...", role: "admin", ... }
   AuthContext: User role: admin
   AuthContext: Login successful, returning user
   ```

3. **Login Page Logs:**
   ```
   Login: Starting login process...
   Login: Result received: { success: true, user: { ... } }
   Login: User data: { _id: "...", fullName: "...", role: "admin", ... }
   Login: User role: admin
   Login: Redirecting to /admin
   ```

### Common Issues & Solutions

#### Issue 1: "Login failed" Error
- **Check**: Backend is running on port 5001
- **Check**: MongoDB is connected
- **Check**: Admin user exists in database with correct role
- **Solution**: Check backend console for errors

#### Issue 2: Redirects to Teacher Dashboard Instead
- **Check**: Console logs for role value
- **Check**: If role is actually "admin" in user object
- **Check**: localStorage for user data: `localStorage.getItem('user')`
- **Solution**: Clear localStorage and login again

#### Issue 3: "Invalid credentials" Error
- **Check**: Email and password are correct
- **Check**: User exists in database
- **Check**: Role is set to "admin"
- **Solution**: Verify database user or re-register

#### Issue 4: Page Loads but Shows Teacher Interface
- **Check**: Sidebar to see if admin menu appears
- **Check**: Console for auto-redirect logs
- **Solution**: The auto-redirect on Dashboard should redirect to /admin

## Verification Checklist

After successful admin login, verify:

- [ ] URL is `/admin` (Admin Dashboard)
- [ ] Page title shows "Admin Dashboard"
- [ ] Statistics cards show:
  - [ ] Total Students
  - [ ] Total Teachers
  - [ ] Total Classes
  - [ ] Active Schedules
- [ ] Sidebar contains:
  - [ ] Regular menu items (Dashboard, Classes, etc.)
  - [ ] "Admin Panel" section header
  - [ ] Admin Dashboard
  - [ ] Students
  - [ ] Teachers
  - [ ] Enrollments
- [ ] Quick action buttons:
  - [ ] Add New Student
  - [ ] Add New Teacher
  - [ ] Manage Enrollments
- [ ] Clicking sidebar items navigates correctly:
  - [ ] Admin Dashboard → `/admin`
  - [ ] Students → `/admin/students`
  - [ ] Teachers → `/admin/teachers`
  - [ ] Enrollments → `/admin/enrollments`

## Testing Different User Roles

### Test Teacher Login:
1. Register/Login with role: "teacher"
2. Should redirect to `/` (Teacher Dashboard)
3. Should NOT see admin menu items
4. Should see only teacher features

### Test Admin Login:
1. Register/Login with role: "admin"
2. Should redirect to `/admin` (Admin Dashboard)
3. Should see admin menu items
4. Should see both teacher and admin features

### Test Role Persistence:
1. Login as admin
2. Navigate to different pages
3. Refresh browser
4. Should stay logged in as admin
5. Should still see admin interface

## Backend Verification

Check backend logs for:

```
Login request received: { email: 'admin@test.com', enrollmentNo: undefined, hasPassword: true }
Searching for user with query: { email: 'admin@test.com' }
User found: true { id: '...', email: 'admin@test.com', role: 'admin' }
User found, comparing password...
Password comparison successful
Login successful for user: admin@test.com
```

## Network Tab Verification

1. Open browser DevTools → Network tab
2. Login with admin credentials
3. Check the login request:
   - URL: `http://localhost:5001/api/auth/login`
   - Method: POST
   - Status: 200 OK
   - Response should contain:
     ```json
     {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {
         "_id": "...",
         "fullName": "Admin User",
         "email": "admin@test.com",
         "role": "admin"
       }
     }
     ```

## If Still Not Working

1. **Clear all browser data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   // Then hard refresh: Ctrl+Shift+R
   ```

2. **Check API base URL:**
   - Open `teacher-frontend/src/services/api.js`
   - Verify baseURL is correct: `http://localhost:5001`

3. **Restart both servers:**
   ```bash
   # Backend
   cd attendence-backend
   yarn start
   
   # Frontend (new terminal)
   cd teacher-frontend
   npm start
   ```

4. **Check for CORS issues:**
   - Look for CORS errors in console
   - Verify backend has CORS enabled

5. **Test with curl:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"admin123"}'
   ```

## Contact for Issues

If admin login still doesn't work after following all steps:
1. Share the console logs (all three sections)
2. Share the Network tab response
3. Share any backend error logs
4. Verify the user document from MongoDB
