import api from './api';

export const userService = {
  login: (credentials) => api.post('/api/users/login', credentials),
  register: (userData) => api.post('/api/users/register', userData),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (profileData) => api.put('/api/users/profile', profileData),
};