import { Attendance } from '../../shared/models/attendanceModel.js';
import { QRCodeSession } from '../../shared/models/qrCodeSessionModel.js';
import { Class } from '../../shared/models/classModel.js';
import { User } from '../../shared/models/userModel.js';
import { ClassEnrollment } from '../../shared/models/classEnrollmentModel.js';
import crypto from 'crypto';

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
        
        // Verify student is enrolled in the class
        const enrollment = await ClassEnrollment.findOne({
          studentId,
          classId
        });

        if (!enrollment) {
          errors.push({
            studentId,
            error: 'Student is not enrolled in this class'
          });
          continue;
        }

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

// Generate a new token for dynamic QR
const generateNewToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

// QR Code Session Management with Dynamic QR
export const generateQRSession = async (req, res) => {
  try {
    const { classId, duration = 10 } = req.body;
    const teacherId = req.user.id;
    
    console.log(`Generating QR session for class ${classId}, duration: ${duration} minutes`);
    
    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only generate QR codes for your own classes' 
      });
    }

    // Terminate any existing active sessions for this class
    await QRCodeSession.updateMany(
      { classId, isActive: true },
      { isActive: false, sessionEndedAt: new Date() }
    );

    // Create QR session
    const qrSessionData = {
      sessionId: crypto.randomUUID(),
      classId,
      teacherId,
      durationMinutes: duration,
      sessionExpiresAt: new Date(Date.now() + duration * 60 * 1000),
      currentToken: generateNewToken(),
      qrPayload: {
        sessionId: '', // Will be set below
        classId,
        token: '', // Will be set below
        expiresAt: new Date(Date.now() + duration * 60 * 1000),
        subjectCode: classData.subjectCode,
        subjectName: classData.subjectName,
        classYear: classData.classYear,
        semester: classData.semester,
        division: classData.division,
        timestamp: new Date()
      },
      isActive: true,
      createdAt: new Date()
    };

    // Set the payload
    qrSessionData.qrPayload.sessionId = qrSessionData.sessionId;
    qrSessionData.qrPayload.token = qrSessionData.currentToken;

    // Add schedule ID if provided
    if (req.body.scheduleId) {
      qrSessionData.scheduleId = req.body.scheduleId;
    }

    const qrSession = await QRCodeSession.create(qrSessionData);

    console.log('QR session created:', qrSession.sessionId);

    res.status(201).json({
      success: true,
      message: 'QR session generated successfully',
      sessionId: qrSession.sessionId,
      qrPayload: qrSession.qrPayload,
      expiresAt: qrSession.sessionExpiresAt,
      sessionExpiresAt: qrSession.sessionExpiresAt,
      duration: duration,
      data: {
        sessionId: qrSession.sessionId,
        qrPayload: qrSession.qrPayload,
        expiresAt: qrSession.sessionExpiresAt,
        sessionExpiresAt: qrSession.sessionExpiresAt,
        duration: duration
      }
    });

  } catch (error) {
    console.error('Generate QR Session Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate QR session',
      error: error.message 
    });
  }
};

// Refresh QR Token (for dynamic QR)
export const refreshQRToken = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const teacherId = req.user.id;

    console.log('Refreshing QR token for session:', sessionId);

    // Find the active session
    const session = await QRCodeSession.findOne({
      sessionId,
      teacherId, // Ensure teacher owns this session
      isActive: true,
      sessionExpiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'QR session not found, expired, or access denied' 
      });
    }

    // Generate new token
    const newToken = generateNewToken();
    
    // Update the session with new token
    session.currentToken = newToken;
    session.qrPayload.token = newToken;
    session.tokenRefreshedAt = new Date();
    
    await session.save();

    console.log('QR token refreshed for session:', sessionId);

    res.status(200).json({
      success: true,
      message: 'QR token refreshed successfully',
      sessionId: session.sessionId,
      newToken: newToken,
      qrPayload: session.qrPayload,
      expiresAt: session.sessionExpiresAt,
      data: {
        sessionId: session.sessionId,
        newToken: newToken,
        qrPayload: session.qrPayload,
        expiresAt: session.sessionExpiresAt
      }
    });

  } catch (error) {
    console.error('Refresh QR Token Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to refresh QR token',
      error: error.message 
    });
  }
};

// Terminate QR Session
export const terminateQRSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const teacherId = req.user.id;

    console.log('Terminating QR session:', sessionId);

    const session = await QRCodeSession.findOne({
      sessionId,
      teacherId, // Ensure teacher owns this session
      isActive: true
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'QR session not found or access denied' 
      });
    }

    // Mark session as inactive
    session.isActive = false;
    session.sessionEndedAt = new Date();
    await session.save();

    console.log('QR session terminated:', sessionId);

    res.status(200).json({
      success: true,
      message: 'QR session terminated successfully',
      data: {
        sessionId: session.sessionId,
        endedAt: session.sessionEndedAt
      }
    });

  } catch (error) {
    console.error('Terminate QR Session Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to terminate QR session',
      error: error.message 
    });
  }
};

// Get Active QR Sessions for Teacher
export const getActiveQRSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const activeSessions = await QRCodeSession.find({
      teacherId,
      isActive: true,
      sessionExpiresAt: { $gt: new Date() }
    })
    .populate('classId', 'subjectCode subjectName classYear semester division')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sessions: activeSessions,
      data: activeSessions,
      total: activeSessions.length
    });

  } catch (error) {
    console.error('Get Active QR Sessions Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get active QR sessions',
      error: error.message 
    });
  }
};

// Terminate All QR Sessions for Teacher
export const terminateAllQRSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await QRCodeSession.updateMany(
      { teacherId, isActive: true },
      { 
        isActive: false, 
        sessionEndedAt: new Date() 
      }
    );

    console.log(`Terminated ${result.modifiedCount} QR sessions for teacher ${teacherId}`);

    res.status(200).json({
      success: true,
      message: `Terminated ${result.modifiedCount} active QR sessions`,
      data: {
        terminatedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Terminate All QR Sessions Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to terminate QR sessions',
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

// Get attendance records for teacher's classes
export const getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access attendance for your own classes' 
      });
    }

    // Build query
    const query = { classId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get attendance records with pagination
    const attendance = await Attendance.find(query)
      .populate('studentId', 'name email enrollmentNo')
      .populate('classId', 'subjectCode subjectName')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        attendance,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get Attendance By Class Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get attendance records',
      error: error.message 
    });
  }
};

// Get teacher's attendance statistics
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
    .populate('studentId', 'name email enrollmentNo')
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
        recentAttendance,
        totalClasses: teacherClasses.length
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
