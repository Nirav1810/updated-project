import api from './api';

export const attendanceService = {
  // Basic attendance operations
  markAttendance: async (attendanceData) => {
    const response = await api.post('/api/attendance/mark', attendanceData);
    return response.data;
  },

  // Manual attendance marking
  markManualAttendance: async (attendanceData) => {
    const response = await api.post('/api/attendance/manual', attendanceData);
    return response.data;
  },

  // Get students for a class (for manual attendance)
  getStudentsForClass: async (classId) => {
    const response = await api.get(`/api/attendance/students/${classId}`);
    return response.data;
  },
  
  // Get all students (temporary for debugging)
  getAllStudents: async () => {
    const response = await api.get('/api/attendance/all-students');
    return response.data;
  },
  
  // Bulk enroll students by email
  bulkEnrollStudents: async (classId, studentEmails) => {
    const response = await api.post('/api/attendance/bulk-enroll', {
      classId,
      studentEmails
    });
    return response.data;
  },
  
  // Get attendance statistics for dashboard
  getAttendanceStats: async () => {
    const response = await api.get('/api/attendance/stats');
    return response.data;
  },
  
  getAllAttendance: async () => {
    const response = await api.get('/api/attendance');
    return response.data;
  },

  getAttendanceByClass: async (classId) => {
    const response = await api.get(`/api/attendance/class/${classId}`);
    return response.data;
  },
  
  getAttendanceByStudent: async (studentId) => {
    const response = await api.get(`/api/attendance/student/${studentId}`);
    return response.data;
  },

  // QR Code session operations with dynamic QR support
  generateQRSession: async (classId, duration = 10) => {
    const response = await api.post('/api/attendance/qr/generate', {
      classId,
      duration
    });
    return response.data;
  },

  refreshQRToken: async (sessionId) => {
    const response = await api.post(`/api/attendance/qr/refresh/${sessionId}`);
    return response.data;
  },

  terminateQRSession: async (sessionId) => {
    const response = await api.delete(`/api/attendance/qr/terminate/${sessionId}`);
    return response.data;
  },

  getActiveQRSessions: async () => {
    const response = await api.get('/api/attendance/qr/active');
    return response.data;
  },

  terminateAllQRSessions: async () => {
    const response = await api.delete('/api/attendance/qr/terminate-all');
    return response.data;
  },

  validateQRToken: async (token, sessionId) => {
    const response = await api.post('/api/attendance/qr/validate', {
      token,
      sessionId
    });
    return response.data;
  }
};