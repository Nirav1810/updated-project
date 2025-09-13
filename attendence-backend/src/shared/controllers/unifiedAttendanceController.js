import { Attendance } from '../models/attendanceModel.js';
import { QRCodeSession } from '../models/qrCodeSessionModel.js';
import { Class } from '../models/classModel.js';
import { ClassEnrollment } from '../models/classEnrollmentModel.js';
import { Schedule } from '../models/scheduleModel.js';

// Submit attendance (unified endpoint for student app)
export const submitAttendance = async (req, res) => {
  try {
    const { 
      sessionId, 
      classId, 
      scheduleId, 
      studentCoordinates, 
      livenessPassed, 
      faceEmbedding 
    } = req.body;
    
    const studentId = req.user.id;

    console.log('Attendance submission request:', { 
      sessionId, 
      classId, 
      scheduleId, 
      studentId,
      livenessPassed
    });

    // Validate required fields
    if (!sessionId || !classId) {
      return res.status(400).json({ 
        message: 'Session ID and Class ID are required' 
      });
    }

    // Verify the QR session exists and is active
    const qrSession = await QRCodeSession.findOne({
      sessionId,
      classId,
      isActive: true,
      sessionExpiresAt: { $gt: new Date() }
    });

    if (!qrSession) {
      return res.status(400).json({ 
        message: 'QR session not found or expired. Please scan a new QR code.' 
      });
    }

    // Check if attendance already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      studentId,
      classId,
      timestamp: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      return res.status(409).json({ 
        message: 'Attendance already marked for today' 
      });
    }

    // Verify student is enrolled in the class
    const enrollment = await ClassEnrollment.findOne({
      studentId,
      classId
    });

    if (!enrollment) {
      return res.status(403).json({
        message: 'You are not enrolled in this class'
      });
    }

    // Create attendance record
    const attendanceData = {
      studentId,
      classId,
      scheduleId: scheduleId || null,
      sessionId: qrSession._id, // Reference to QR session
      studentCoordinates: studentCoordinates || {},
      livenessPassed: livenessPassed || true,
      faceEmbedding: faceEmbedding || [],
      timestamp: new Date(),
      synced: true,
      syncVersion: 1,
      manualEntry: false
    };

    const attendance = await Attendance.create(attendanceData);
    
    // Populate the attendance record for response
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('classId', 'subjectCode subjectName classYear semester division classNumber')
      .populate('studentId', 'name fullName email enrollmentNo')
      .populate('scheduleId');

    // Transform to match student app expected format
    const transformedAttendance = {
      _id: populatedAttendance._id,
      studentId: {
        _id: populatedAttendance.studentId._id,
        fullName: populatedAttendance.studentId.fullName || populatedAttendance.studentId.name,
        email: populatedAttendance.studentId.email,
        enrollmentNo: populatedAttendance.studentId.enrollmentNo
      },
      sessionId: {
        qrPayload: {
          timestamp: qrSession.qrPayload.timestamp
        }
      },
      classId: {
        _id: populatedAttendance.classId._id,
        classNumber: populatedAttendance.classId.classNumber,
        subjectCode: populatedAttendance.classId.subjectCode,
        subjectName: populatedAttendance.classId.subjectName,
        classYear: populatedAttendance.classId.classYear,
        semester: populatedAttendance.classId.semester,
        division: populatedAttendance.classId.division
      },
      scheduleId: populatedAttendance.scheduleId,
      studentCoordinates: populatedAttendance.studentCoordinates,
      attendedAt: populatedAttendance.timestamp,
      livenessPassed: populatedAttendance.livenessPassed,
      faceEmbedding: populatedAttendance.faceEmbedding,
      synced: populatedAttendance.synced,
      syncVersion: populatedAttendance.syncVersion,
      manualEntry: populatedAttendance.manualEntry,
      status: 'present'
    };

    res.status(201).json(transformedAttendance);

  } catch (error) {
    console.error('Submit Attendance Error:', error);
    res.status(500).json({ 
      message: 'Failed to submit attendance',
      error: error.message 
    });
  }
};

// Sync multiple attendance records
export const syncAttendance = async (req, res) => {
  try {
    const { attendances } = req.body;
    const studentId = req.user.id;

    if (!attendances || !Array.isArray(attendances)) {
      return res.status(400).json({ 
        message: 'Attendances array is required' 
      });
    }

    console.log(`Syncing ${attendances.length} attendance records for student ${studentId}`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    for (const attendanceData of attendances) {
      try {
        const {
          sessionId,
          classId,
          scheduleId,
          studentCoordinates,
          livenessPassed,
          faceEmbedding
        } = attendanceData;

        // Check if already exists
        const existing = await Attendance.findOne({
          studentId,
          classId,
          sessionId: attendanceData.sessionId
        });

        if (existing) {
          results.skipped++;
          results.details.push({
            status: 'skipped',
            data: attendanceData,
            error: 'Already exists'
          });
          continue;
        }

        // Create new attendance record
        const newAttendance = await Attendance.create({
          studentId,
          classId,
          scheduleId: scheduleId || null,
          sessionId,
          studentCoordinates: studentCoordinates || {},
          livenessPassed: livenessPassed || true,
          faceEmbedding: faceEmbedding || [],
          synced: true,
          syncVersion: 1,
          manualEntry: false
        });

        results.success++;
        results.details.push({
          status: 'success',
          data: attendanceData
        });

      } catch (error) {
        console.error('Failed to sync attendance record:', error);
        results.failed++;
        results.details.push({
          status: 'failed',
          data: attendanceData,
          error: error.message
        });
      }
    }

    res.json(results);

  } catch (error) {
    console.error('Sync Attendance Error:', error);
    res.status(500).json({ 
      message: 'Failed to sync attendance',
      error: error.message 
    });
  }
};

// Get attendance records by class
export const getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, status } = req.query;
    const userId = req.user.id;

    console.log('Get attendance by class:', { classId, userId, startDate, endDate, status });

    // Build query
    let query = { classId };
    
    // If user is a student, only show their own attendance
    if (req.user.role === 'student') {
      query.studentId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'name fullName email enrollmentNo')
      .populate('classId', 'subjectCode subjectName classYear semester division classNumber')
      .populate('scheduleId')
      .sort({ timestamp: -1 });

    // Transform records to match student app format
    const transformedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      studentId: {
        _id: record.studentId._id,
        fullName: record.studentId.fullName || record.studentId.name,
        email: record.studentId.email,
        enrollmentNo: record.studentId.enrollmentNo
      },
      sessionId: record.sessionId ? {
        qrPayload: {
          timestamp: record.timestamp
        }
      } : null,
      classId: {
        _id: record.classId._id,
        classNumber: record.classId.classNumber,
        subjectCode: record.classId.subjectCode,
        subjectName: record.classId.subjectName,
        classYear: record.classId.classYear,
        semester: record.classId.semester,
        division: record.classId.division
      },
      scheduleId: record.scheduleId,
      studentCoordinates: record.studentCoordinates,
      attendedAt: record.timestamp,
      livenessPassed: record.livenessPassed,
      faceEmbedding: record.faceEmbedding,
      synced: record.synced,
      syncVersion: record.syncVersion,
      manualEntry: record.manualEntry,
      status: 'present'
    }));

    // Calculate stats
    const total = transformedRecords.length;
    const present = transformedRecords.filter(r => r.status === 'present').length;
    const late = transformedRecords.filter(r => r.status === 'late').length;
    const absent = transformedRecords.filter(r => r.status === 'absent').length;
    const manualEntries = transformedRecords.filter(r => r.manualEntry).length;

    const response = {
      attendance: transformedRecords,
      stats: {
        total,
        present,
        late,
        absent,
        manualEntries
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Get Attendance By Class Error:', error);
    res.status(500).json({ 
      message: 'Failed to get attendance records',
      error: error.message 
    });
  }
};