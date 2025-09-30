import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as T from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor to add the token
api.interceptors.request.use(async (config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url, 'Base URL:', BASE_URL);
  console.log('Request data:', config.data);
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.config?.url);
    return response;
  },
  async (error) => {
    console.log('API Response Error:', error.response?.status, error.response?.data, error.config?.url);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An Unknown error occurred';
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing stored tokens');
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('role');
      throw new Error('Session expired. Please log in again.');
    }
    console.error('API Error:', message, error.response?.data);
    throw new Error(message);
  }
);

// Reusable Role Check Logic
type UserRole = 'student' | 'teacher' | 'admin';

const checkRole = async (requiredRoles: UserRole[]): Promise<boolean> => {
  const role = (await SecureStore.getItemAsync('role')) as UserRole | null;
  return role ? requiredRoles.includes(role) : false;
}

// Higher-Order Function to wrap API calls with a role check
const withRoleCheck = <T extends any[], R>(
  apiCall: (...args: T) => Promise<R>,
  requiredRoles: UserRole[]
) => {
  return async (...args: T): Promise<R> => {
    const hasPermission = await checkRole(requiredRoles);
    if (!hasPermission) {
      throw new Error(`Unauthorized: Requires one of [${requiredRoles.join(', ')}] roles.`);
    }
    return apiCall(...args);
  };
};

// API Endpoints for Students
export const auth = {
  // POST users/login
  login: (data: { enrollmentNo?: string; email?: string; password: string }) => {
    return api.post<T.AuthResponse>('/auth/login', data).then(res => res.data);
  },
  // POST users/register
  register: (data: {
    enrollmentNo?: string;
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    classYear?: string;
    semester?: string;
    faceEmbedding?: number[];
    faceImageBase64?: string;
  }) => {
    return api.post<T.AuthResponse>('/auth/register', data).then(res => res.data);
  },
  // POST /auth/forgot-password
  forgotPassword: (data: { email?: string; enrollmentNo?: string }) => {
    return api.post<{ message: string }>('/auth/forgot-password', data).then(res => res.data);
  },
};

export const users = {
  // GET /users/profile (auth)
  getProfile: () => api.get<T.User>('/users/profile').then(res => res.data),
  // PUT /users/profile (auth)
  updateProfile: (data: Partial<Omit<T.User, '_id' | 'role' | 'enrollmentNo' | 'email'>>) =>
    api.put<T.User>('/users/profile', data).then(res => res.data),
  // PUT /users/change-password (auth)
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/users/change-password', data).then(res => res.data),
};

export const attendance = {
  // POST /attendances (student)
  submit: withRoleCheck(
    (data: T.AttendanceSubmission) => api.post<T.Attendance>('/attendances', data).then(res => res.data),
    ['student']
  ),
  // POST /attendances/sync (student)
  sync: withRoleCheck(
    (data: T.AttendanceSubmission[]) => api.post<T.SyncResponse>('/attendances/sync', { attendances: data }).then(res => res.data),
    ['student']
  ),
  // GET /attendances/records/class/:classId (teacher, admin, student)
  getByClass: async (classId: string, query: { startDate?: string; endDate?: string; status?: string } = {}) => {
    return api.get<T.AttendanceResponse>(`/attendances/records/class/${classId}`, { params: query }).then(res => res.data);
  },
};

export const classes = {
  // GET /classes (auth)
  getAll: () => api.get<T.Class[]>('/classes').then(res => res.data),
  // GET /classes/:id (auth)
  getById: (id: string) => api.get<T.Class>(`/classes/${id}`).then(res => res.data),
  // GET /classes/enrolled (student)
  getEnrolled: withRoleCheck(
    () => api.get<T.Class[]>('/classes/enrolled').then(res => res.data),
    ['student']
  ),
};

export const qr = {
  // POST /qr/validate (student)
  validate: withRoleCheck(
    (data: { token: string }) => api.post<T.QRValidationResponse>('/qr/validate', data).then(res => res.data),
    ['student']
  ),
};

export const timeSlot = {
  // GET /timeslots (public)
  getAll: () => api.get<T.TimeSlot[]>('/timeslots').then(res => res.data),
  // GET /timeslots/available (auth)
  getAvailable: (query: { roomId?: string; date?: string }) => api.get<T.TimeSlot[]>('/timeslots/available', { params: query }).then(res => res.data),
};

export default api;