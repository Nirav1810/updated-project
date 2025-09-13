import api from './api';

export const roomService = {
  // Get all rooms
  getRooms: async () => {
    try {
      const response = await api.get('/api/teacher/rooms');
      return response.data.rooms;
    } catch (error) {
      // If authentication fails, try public endpoint
      if (error.response?.status === 401) {
        const response = await api.get('/api/teacher/rooms/public');
        return response.data.rooms;
      }
      throw error;
    }
  },

  // Get rooms by type
  getRoomsByType: async (type) => {
    const response = await api.get(`/api/teacher/rooms/type/${type}`);
    return response.data.rooms;
  },

  // Create a new room
  createRoom: async (roomData) => {
    const response = await api.post('/api/teacher/rooms', roomData);
    return response.data.room;
  },

  // Update a room
  updateRoom: async (id, roomData) => {
    const response = await api.put(`/api/teacher/rooms/${id}`, roomData);
    return response.data.room;
  },

  // Delete a room
  deleteRoom: async (id) => {
    const response = await api.delete(`/api/teacher/rooms/${id}`);
    return response.data;
  },

  // Initialize default rooms
  initializeDefaultRooms: async () => {
    try {
      const response = await api.post('/api/teacher/rooms/initialize');
      return response.data.rooms;
    } catch (error) {
      // If authentication fails, try public endpoint
      if (error.response?.status === 401) {
        const response = await api.post('/api/teacher/rooms/initialize-public');
        return response.data.rooms;
      }
      throw error;
    }
  },
};
