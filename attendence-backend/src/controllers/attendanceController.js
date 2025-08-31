import { Attendance } from '../models/attendanceModel.js';
import { QRCodeSession } from '../models/qrCodeSessionModel.js';
import { Class } from '../models/classModel.js';
import { User } from '../models/userModel.js';
import { ClassEnrollment } from '../models/classEnrollmentModel.js';
import crypto from 'crypto';

// Basic CRUD for Attendance Records
export const createAttendanceRecord = async (req, res) => {
  try {
    const record = await Attendance.create(req.body);
    res.status(201).json(record);
  } catch (error) { res.status(400).json({ message: error.message }) }
};

// Manual Attendance Marking
export const markManualAttendance = async (req, res) => {
  try {
    console.log('Manual attendance request received:', req.body);
    console.log('User from token:', req.user);
    
    const { studentIds, classId, scheduleId, notes } = req.body;
    const teacherId = req.user.id;

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !classId) {
      console.log('Validation failed:', { studentIds, classId });
      return res.status(400).json({ 
        success: false, 
        message: 'Student IDs array and Class ID are required' 
      });
    }

    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    console.log('Class data found:', classData ? 'Yes' : 'No');
    console.log('Class teacher ID:', classData?.teacherId);
    console.log('Request teacher ID:', teacherId);
    
    if (!classData || classData.teacherId.toString() !== teacherId) {
      console.log('Class verification failed');
      return res.status(403).json({ 
        success: false, 
        message: 'You can only mark attendance for your own classes' 
      });
    }

    // Check for today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = [];
    const errors = [];

    // Process each student
    console.log('Processing students:', studentIds);
    for (const studentId of studentIds) {
      try {
        console.log('Processing student ID:', studentId);
        
        // Verify student exists (in a real system, you'd check enrollment)
        // For now, we'll accept the dummy student IDs from getStudentsForClass

        // Check if attendance already exists for today
        const existingAttendance = await Attendance.findOne({
          studentId,
          classId,
          timestamp: { $gte: today, $lt: tomorrow }
        });

        if (existingAttendance) {
          console.log('Attendance already exists for student:', studentId);
          errors.push({
            studentId,
            error: 'Attendance already marked for this student today'
          });
          continue;
        }

        console.log('Creating attendance record for student:', studentId);
        // Create manual attendance record
        const attendanceRecord = await Attendance.create({
          studentId,
          classId,
          scheduleId: scheduleId || null,
          sessionId: null, // No QR session for manual entries
          manualEntry: true,
          livenessPassed: true, // Manual entries are considered verified
          faceEmbedding: [], // No face embedding for manual entries
          timestamp: new Date(),
          notes: notes || 'Manual attendance entry by teacher'
        });

        console.log('Attendance record created:', attendanceRecord._id);
        results.push({
          studentId,
          attendanceId: attendanceRecord._id,
          success: true
        });

      } catch (studentError) {
        console.error(`Error processing student ${studentId}:`, studentError);
        errors.push({
          studentId,
          error: studentError.message
        });
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: `Manual attendance processed for ${results.length} student(s)`,
      data: {
        successful: results,
        failed: errors,
        totalProcessed: studentIds.length,
        successCount: results.length,
        errorCount: errors.length
      }
    };

    // If some failed, adjust the success status
    if (errors.length > 0 && results.length === 0) {
      response.success = false;
      response.message = 'Failed to mark attendance for any students';
      return res.status(400).json(response);
    } else if (errors.length > 0) {
      response.message = `Partial success: ${results.length} marked, ${errors.length} failed`;
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Manual Attendance Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark manual attendance',
      error: error.message 
    });
  }
};

// Get students for a class (for manual attendance)
export const getStudentsForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access students from your own classes' 
      });
    }

    // Get enrolled students from ClassEnrollment
    const enrollments = await ClassEnrollment.find({ classId })
      .populate('studentId', 'name email enrollmentNo fullName')
      .sort({ enrolledAt: 1 });

    // Extract student data from enrollments
    const students = enrollments.map(enrollment => ({
      _id: enrollment.studentId._id,
      name: enrollment.studentId.name || enrollment.studentId.fullName,
      enrollmentNo: enrollment.studentId.enrollmentNo,
      email: enrollment.studentId.email,
      enrolledAt: enrollment.enrolledAt
    }));

    res.status(200).json({
      success: true,
      data: students,
      total: students.length,
      message: students.length === 0 ? 'No students enrolled in this class' : `Found ${students.length} enrolled students`
    });

  } catch (error) {
    console.error('Get Students For Class Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch students for class',
      error: error.message 
    });
  }
};

// Temporary function to get all students (for debugging)
export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email enrollmentNo fullName');
    res.status(200).json({
      success: true,
      data: students,
      total: students.length
    });
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch students',
      error: error.message 
    });
  }
};

// Bulk enroll students by email addresses
export const bulkEnrollStudents = async (req, res) => {
  try {
    const { classId, studentEmails } = req.body;
    const teacherId = req.user.id;

    if (!classId || !studentEmails || !Array.isArray(studentEmails)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Class ID and array of student emails are required' 
      });
    }

    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only enroll students in your own classes' 
      });
    }

    const results = [];
    const errors = [];

    for (const email of studentEmails) {
      try {
        // Find student by email
        const student = await User.findOne({ email: email.toLowerCase(), role: 'student' });
        if (!student) {
          errors.push({ email, error: 'Student not found' });
          continue;
        }

        // Check if already enrolled
        const existingEnrollment = await ClassEnrollment.findOne({ 
          classId, 
          studentId: student._id 
        });
        
        if (existingEnrollment) {
          errors.push({ email, error: 'Student already enrolled' });
          continue;
        }

        // Create enrollment
        await ClassEnrollment.create({ classId, studentId: student._id });
        results.push({ 
          email, 
          studentName: student.name || student.fullName,
          studentId: student._id 
        });

      } catch (error) {
        errors.push({ email, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Enrolled ${results.length} students successfully`,
      data: {
        enrolled: results,
        failed: errors,
        totalAttempted: studentEmails.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Bulk enroll students error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to enroll students',
      error: error.message 
    });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({})
      .populate('studentId', 'fullName enrollmentNo')
      .populate('classId', 'subjectName');
    res.status(200).json(records);
  } catch (error) { res.status(500).json({ message: error.message }) }
};

export const getAttendanceByStudent = async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.params.studentId });
    if (!records) return res.status(404).json({ message: 'No records found for this student' });
    res.status(200).json(records);
  } catch (error) { res.status(500).json({ message: error.message }) }
};

export const getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    
    // Verify the class belongs to the teacher
    const classData = await Class.findOne({ _id: classId, teacherId });
    if (!classData) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view attendance for your own classes' 
      });
    }
    
    // Find all attendance records for this class
    const records = await Attendance.find({ classId })
      .populate('studentId', 'name fullName enrollmentNo')
      .populate('classId', 'subjectName subjectCode')
      .sort({ timestamp: -1 }); // Sort by most recent first
    
    if (!records || records.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [], 
        message: 'No attendance records found for this class' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: records,
      total: records.length 
    });
  } catch (error) {
    console.error('Get Attendance By Class Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch attendance records for class',
      error: error.message 
    });
  }
};

// Generate a new token for dynamic QR
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Generate main session ID
const generateSessionId = () => crypto.randomBytes(16).toString('hex');

// QR Code Session Management with Dynamic QR
export const generateQRSession = async (req, res) => {
  try {
    const { classId, duration = 10 } = req.body; // duration in minutes, default 10
    const teacherId = req.user.id;

    console.log(`Generating QR session for class ${classId}, duration: ${duration} minutes`);

    // Get class details
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Generate unique session ID and first token
    const sessionId = generateSessionId();
    const currentToken = generateToken();
    
    // Create expiration times
    const sessionExpiresAt = new Date(Date.now() + duration * 60 * 1000); // Session expires in specified minutes

    console.log(`Session ${sessionId} will expire at:`, sessionExpiresAt);

    // Create QR session
    const qrSessionData = {
      classId,
      teacherId,
      sessionId,
      currentToken,
      tokenGeneratedAt: new Date(),
      sessionExpiresAt,
      qrPayload: {
        classNumber: classData.classNumber,
        subjectCode: classData.subjectCode,
        subjectName: classData.subjectName,
        classYear: classData.classYear,
        semester: classData.semester,
        division: classData.division,
        timestamp: new Date(),
        coordinates: null,
        sessionId,
        token: currentToken
      },
      isActive: true
    };

    // Add scheduleId only if provided
    if (req.body.scheduleId) {
      qrSessionData.scheduleId = req.body.scheduleId;
    }

    const qrSession = await QRCodeSession.create(qrSessionData);
    console.log('QR session created successfully:', qrSession.sessionId);

    res.status(201).json({
      success: true,
      sessionId: qrSession.sessionId,
      qrPayload: qrSession.qrPayload,
      sessionExpiresAt: qrSession.sessionExpiresAt,
      expiresIn: duration * 60, // total session duration in seconds
      tokenRefreshInterval: 15 // token refresh interval in seconds
    });
  } catch (error) {
    console.error('Generate QR Session Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Refresh QR token (called automatically every 15 seconds)
export const refreshQRToken = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    console.log('Refreshing token for session:', sessionId);

    // Find active session (only check session expiration, not token)
    const qrSession = await QRCodeSession.findOne({
      sessionId,
      teacherId,
      isActive: true,
      sessionExpiresAt: { $gt: new Date() } // Only check if session is still valid
    }).populate('classId');

    if (!qrSession) {
      console.log('Session not found or expired');
      return res.status(404).json({ 
        success: false,
        message: 'QR session not found or session has expired' 
      });
    }

    // Generate new token
    const newToken = generateToken();
    const now = new Date();

    console.log('Generating new token:', newToken.substring(0, 8) + '...');

    // Update session with new token
    qrSession.currentToken = newToken;
    qrSession.tokenGeneratedAt = now;
    qrSession.qrPayload.token = newToken;
    qrSession.qrPayload.timestamp = now;

    await qrSession.save();

    console.log('Token refreshed successfully');

    res.status(200).json({
      success: true,
      qrPayload: qrSession.qrPayload,
      sessionExpiresAt: qrSession.sessionExpiresAt,
      tokenGeneratedAt: now,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh QR Token Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to refresh token' 
    });
  }
};

export const terminateQRSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    console.log('Terminating QR session:', sessionId, 'for teacher:', teacherId);

    // Find and update the session to inactive (using sessionId, not _id)
    const updatedSession = await QRCodeSession.findOneAndUpdate(
      {
        sessionId,
        teacherId,
        isActive: true
      },
      {
        isActive: false,
        sessionExpiresAt: new Date() // Set to expire immediately
      },
      { new: true }
    );

    console.log('Updated session:', updatedSession);

    if (!updatedSession) {
      console.log('QR session not found or unauthorized');
      return res.status(404).json({ message: 'QR session not found or unauthorized' });
    }

    console.log('QR session terminated successfully');
    res.status(200).json({
      success: true,
      message: 'QR session terminated successfully'
    });
  } catch (error) {
    console.error('Terminate QR Session Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getActiveQRSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const now = new Date();

    console.log('Getting active QR sessions for teacher:', teacherId);
    console.log('Current time:', now);

    const activeSessions = await QRCodeSession.find({
      teacherId,
      isActive: true,
      sessionExpiresAt: { $gt: now }
    }).populate('classId', 'subjectCode subjectName classYear semester division');

    console.log('Found active sessions:', activeSessions.length);

    // Map to include current token status
    const sessionsWithTokenStatus = activeSessions.map(session => {
      const tokenAge = now - session.tokenGeneratedAt;
      const isTokenOld = tokenAge > 15000; // More than 15 seconds old
      
      console.log(`Session ${session.sessionId}: token generated at ${session.tokenGeneratedAt}, age: ${tokenAge}ms`);
      
      return {
        _id: session._id,
        sessionId: session.sessionId,
        classId: session.classId,
        qrPayload: session.qrPayload,
        sessionExpiresAt: session.sessionExpiresAt,
        tokenGeneratedAt: session.tokenGeneratedAt,
        tokenAge: tokenAge,
        isTokenOld: isTokenOld,
        createdAt: session.createdAt
      };
    });

    res.status(200).json({
      success: true,
      sessions: sessionsWithTokenStatus
    });
  } catch (error) {
    console.error('Get Active QR Sessions Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const terminateAllQRSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    console.log('Terminating all QR sessions for teacher:', teacherId);

    // Update all active sessions to inactive
    const result = await QRCodeSession.updateMany(
      {
        teacherId,
        isActive: true,
        sessionExpiresAt: { $gt: new Date() }
      },
      {
        isActive: false,
        sessionExpiresAt: new Date()
      }
    );

    console.log('Terminated sessions count:', result.modifiedCount);

    res.status(200).json({
      success: true,
      message: `Terminated ${result.modifiedCount} active sessions`,
      terminatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Terminate All QR Sessions Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Validate QR token for attendance (used by student app)
export const validateQRToken = async (req, res) => {
  try {
    const { token, sessionId } = req.body;

    console.log('Validating token for session:', sessionId);

    const now = new Date();
    
    // Find active session
    const qrSession = await QRCodeSession.findOne({
      sessionId,
      currentToken: token,
      isActive: true,
      sessionExpiresAt: { $gt: now } // Session must not be expired
    }).populate('classId');

    if (!qrSession) {
      // Try to find the session to give better error message
      const session = await QRCodeSession.findOne({
        sessionId,
        isActive: true,
        sessionExpiresAt: { $gt: now }
      });

      if (!session) {
        return res.status(400).json({ 
          success: false,
          message: 'Session not found or expired. Please ask your teacher to generate a new QR code.',
          errorType: 'SESSION_NOT_FOUND'
        });
      } else {
        // Session exists but token doesn't match - check if token is too old
        const tokenAge = now - session.tokenGeneratedAt;
        const maxTokenAge = 20 * 1000; // 20 seconds grace period
        
        if (tokenAge > maxTokenAge) {
          return res.status(400).json({ 
            success: false,
            message: 'QR code has expired. Please scan the latest QR code displayed by your teacher.',
            errorType: 'TOKEN_EXPIRED'
          });
        } else {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid QR code. Please scan the current QR code.',
            errorType: 'INVALID_TOKEN'
          });
        }
      }
    }

    // Check if token is too old (older than 20 seconds)
    const tokenAge = now - qrSession.tokenGeneratedAt;
    const maxTokenAge = 20 * 1000; // 20 seconds
    
    if (tokenAge > maxTokenAge) {
      return res.status(400).json({ 
        success: false,
        message: 'QR code has expired. Please scan the latest QR code.',
        errorType: 'TOKEN_TOO_OLD'
      });
    }

    console.log('Token validated successfully, age:', tokenAge + 'ms');

    res.status(200).json({
      success: true,
      message: 'QR code is valid',
      classInfo: {
        classId: qrSession.classId._id,
        subjectCode: qrSession.classId.subjectCode,
        subjectName: qrSession.classId.subjectName,
        classYear: qrSession.classId.classYear,
        semester: qrSession.classId.semester,
        division: qrSession.classId.division
      },
      sessionId: qrSession.sessionId,
      tokenValid: true
    });
  } catch (error) {
    console.error('Validate QR Token Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to validate QR code',
      errorType: 'SERVER_ERROR'
    });
  }
};

// Get attendance statistics for dashboard
export const getAttendanceStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get teacher's classes
    const teacherClasses = await Class.find({ teacherId });
    const classIds = teacherClasses.map(c => c._id);

    // Get today's attendance count
    const todayAttendance = await Attendance.countDocuments({
      classId: { $in: classIds },
      timestamp: { $gte: today, $lt: tomorrow }
    });

    // Get this week's attendance count
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const thisWeekAttendance = await Attendance.countDocuments({
      classId: { $in: classIds },
      timestamp: { $gte: weekStart, $lt: tomorrow }
    });

    // Get recent attendance records (last 10)
    const recentAttendance = await Attendance.find({
      classId: { $in: classIds }
    })
    .populate('studentId', 'name email enrollmentNumber')
    .populate('classId', 'subjectCode subjectName')
    .sort({ timestamp: -1 })
    .limit(10);

    // Calculate total enrolled students across all classes
    const totalEnrolledStudents = await ClassEnrollment.countDocuments({
      classId: { $in: classIds }
    });

    // Calculate attendance rate (this week)
    const attendanceRate = totalEnrolledStudents > 0 
      ? Math.round((thisWeekAttendance / (totalEnrolledStudents * 7)) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        todayAttendance,
        thisWeekAttendance,
        totalEnrolledStudents,
        attendanceRate: Math.min(attendanceRate, 100), // Cap at 100%
        recentAttendance
      }
    });

  } catch (error) {
    console.error('Get Attendance Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get attendance statistics',
      error: error.message 
    });
  }
};