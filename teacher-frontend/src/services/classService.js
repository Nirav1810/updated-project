import api from './api';

export const classService = {
  getClasses: async () => {
    try {
      const response = await api.get('/api/classes');
      console.log('Raw API response:', response);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  getClassById: async (id) => {
    const response = await api.get(`/api/classes/${id}`);
    return response.data;
  },
  createClass: async (classData) => {
    const response = await api.post('/api/classes', classData);
    return response.data;
  },
  updateClass: async (id, classData) => {
    const response = await api.put(`/api/classes/${id}`, classData);
    return response.data;
  },
  deleteClass: async (id) => {
    const response = await api.delete(`/api/classes/${id}`);
    return response.data;
  },
  getStudentsInClass: async (classId) => {
    const response = await api.get(`/api/classes/${classId}/students`);
    return response.data;
  },
  
  // Get students enrolled in a class (for reports)
  getClassStudents: async (classId) => {
    const response = await api.get(`/api/attendance/students/${classId}`);
    return response.data;
  },
  
  enrollStudent: async (classId, studentId) => {
    const response = await api.post(`/api/classes/${classId}/enroll`, { studentId });
    return response.data;
  },
  
  enrollStudentByEnrollmentNo: async (classId, enrollmentNo) => {
    const response = await api.post(`/api/classes/${classId}/enroll-by-enrollment-no`, { enrollmentNo });
    return response.data;
  },
  
  removeStudentFromClass: async (classId, studentId) => {
    const response = await api.delete(`/api/classes/${classId}/students/${studentId}`);
    return response.data;
  },
};