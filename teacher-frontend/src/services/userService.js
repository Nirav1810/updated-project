import api from './api';

export const userService = {
  login: async (credentials) => {
    console.log('UserService: Sending login request to:', '/api/teacher/auth/login');
    const response = await api.post('/api/teacher/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    console.log('UserService: Sending registration request to:', '/api/teacher/auth/register');
    console.log('UserService: Registration data:', userData);
    const response = await api.post('/api/teacher/auth/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/api/teacher/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/api/teacher/auth/profile', profileData);
    return response.data;
  },
  
  changePassword: async (passwordData) => {
    const response = await api.put('/api/teacher/auth/change-password', passwordData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};