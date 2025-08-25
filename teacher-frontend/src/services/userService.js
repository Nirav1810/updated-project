import api from './api';

export const userService = {
  login: async (credentials) => {
    console.log('UserService: Sending login request to:', '/api/users/login');
    const response = await api.post('/api/users/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    console.log('UserService: Sending registration request to:', '/api/users/register');
    console.log('UserService: Registration data:', userData);
    const response = await api.post('/api/users/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/api/users/profile', profileData);
    return response.data;
  },
  
  changePassword: async (passwordData) => {
    const response = await api.put('/api/users/change-password', passwordData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};