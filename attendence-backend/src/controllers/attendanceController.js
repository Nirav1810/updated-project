import { Attendance } from '../models/attendanceModel.js';
import { QRCodeSession } from '../models/qrCodeSessionModel.js';
import { Class } from '../models/classModel.js';
import crypto from 'crypto';

// Basic CRUD for Attendance Records
export const createAttendanceRecord = async (req, res) => {
  try {
    const record = await Attendance.create(req.body);
    res.status(201).json(record);
  } catch (error) { res.status(400).json({ message: error.message }) }
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
    
    // Find all attendance records for this class
    const records = await Attendance.find({ classId })
      .populate('studentId', 'fullName enrollmentNo')
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