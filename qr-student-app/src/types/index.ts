// Navigation Param Lists
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined; // New screen for password reset
  MainTabs: undefined;
  ChangePassword: undefined;
  ClassDetails: { classId: string };
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Scan: undefined;
  Classes: undefined;
  Profile: undefined;
  AttendanceManagement: { classId: string };
};

// API & Data Models
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  enrollmentNo?: string;
  classYear?: string;
  semester?: string;
  role: 'student' | 'teacher' | 'admin';
  password?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface Class {
  _id: string;
  classNumber: string;
  subjectCode: string;
  subjectName: string;
  classYear: string;
  semester: string;
  division: string;
  teacherId: string;
}

export interface ClassDetails {
  _id: string;
  classNumber: string;
  subjectCode: string;
  subjectName: string;
  classYear: string;
  semester: string;
  division: string;
  teacherId: {
    _id: string;
    fullName: string;
    email: string;
  };
  students: User[];
}

export interface Schedule {
  _id: string;
  classId: string;
  sessionType: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  semester: string;
  academicYear: string;
  location: { latitude: number; longitude: number };
}

export interface Attendance {
  _id: string;
  studentId: User;
  sessionId?: { qrPayload: { timestamp: string } };
  classId: Class;
  scheduleId: Schedule;
  studentCoordinates?: Coordinates;
  attendedAt: string;
  livenessPassed: boolean;
  faceEmbedding: number[];
  synced: boolean;
  syncVersion: number;
  manualEntry: boolean;
  status: 'present' | 'late' | 'absent';
}

export interface AttendanceSubmission {
  sessionId: string;
  classId: string;
  scheduleId: string;
  studentCoordinates: Coordinates;
  livenessPassed: boolean;
  faceEmbedding: number[];
}

export interface QRValidationResponse {
  valid: boolean;
  sessionId: string;
  classId: string;
  classInfo?: {
    classNumber?: string;
    subjectCode?: string;
    subjectName?: string;
    classYear?: string;
    semester?: string;
    division?: string;
  };
  coordinates?: Coordinates;
  timestamp?: string;
  message?: string;
}

export interface QRData {
  sessionId: string;
  token: string;
  expiredAt: string;
}

export interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
}

// API Response Types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface AttendanceResponse {
  attendance: Attendance[];
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    manualEntries?: number;
  };
}

export interface SyncResponse {
  success: number;
  failed: number;
  skipped: number;
  details: Array<{
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    data: AttendanceSubmission
  }>;
}