import { Attendance } from '../models/attendanceModel.js';
import { QRCodeSession } from '../models/qrCodeSessionModel.js';
import { Class } from '../models/classModel.js';
import { ClassEnrollment } from '../models/classEnrollmentModel.js';
import { Schedule } from '../models/scheduleModel.js';
import { User } from '../models/userModel.js'; // Import User model
import { compareFaces } from '../services/rekognitionService.js'; // Import our new service

// Submit attendance (unified endpoint for student app)
export const submitAttendance = async (req, res) => {
  try {
    const { 
      sessionId, 
      classId, 
      studentCoordinates, 
      livenessPassed, 
      faceImage // Expecting a base64 encoded image string from the app
    } = req.body;
    
    const studentId = req.user.id;

    console.log('New attendance submission request:', { 
      sessionId, 
      classId, 
      studentId,
      livenessPassed
    });

    // --- 1. Basic Validation ---
    if (!sessionId || !classId || !studentCoordinates || !faceImage) {
      return res.status(400).json({ message: 'Missing required attendance data.' });
    }
    if (livenessPassed !== true) {
      return res.status(400).json({ message: 'Liveness check was not passed.' });
    }

    // --- 2. Find Student and their Reference Face Image Key ---
    const student = await User.findById(studentId);
    if (!student || !student.faceImageS3Key) {
      return res.status(404).json({ message: 'Student profile not found or face is not registered.' });
    }

    // --- 3. Perform Face Recognition via AWS Rekognition ---
    // Convert the base64 image string from the app into a Buffer for the AWS SDK
    const base64Data = faceImage.replace(/^data:image\/\w+;base64,/, '');
    const targetImageBuffer = Buffer.from(base64Data, 'base64');
    
    // Check image size (AWS Rekognition has limits)
    const imageSizeInMB = targetImageBuffer.length / (1024 * 1024);
    console.log(`Image size: ${imageSizeInMB.toFixed(2)}MB`);
    
    if (imageSizeInMB > 5) {
      return res.status(400).json({ message: 'Image too large. Please try again with a smaller image.' });
    }
    
    const facesDoMatch = await compareFaces(student.faceImageS3Key, targetImageBuffer);

    if (!facesDoMatch) {
      return res.status(401).json({ message: 'Face recognition failed. Identity could not be verified.' });
    }
    console.log(`✅ Face successfully verified for student: ${student.fullName}`);

    // --- 4. Verify QR Session and Prevent Duplicates ---
    const qrSession = await QRCodeSession.findOne({
      sessionId,
      classId,
      isActive: true,
      sessionExpiresAt: { $gt: new Date() }
    });

    if (!qrSession) {
      return res.status(400).json({ message: 'This QR code is invalid or has expired.' });
    }
    
    const existingAttendance = await Attendance.findOne({ studentId, sessionId: qrSession._id });
    if (existingAttendance) {
      return res.status(409).json({ message: 'You have already marked attendance for this session.' });
    }

    // --- 5. Save the Attendance Record ---
    const attendanceRecord = new Attendance({
      studentId,
      classId,
      sessionId: qrSession._id, // Use QRCodeSession's ObjectId instead of sessionId string
      scheduleId: qrSession.scheduleId, // Associate with schedule from QR session
      status: 'present',
      location: {
        type: 'Point',
        coordinates: [studentCoordinates.longitude, studentCoordinates.latitude],
      },
      markedBy: 'student',
      livenessPassed: true,
      timestamp: new Date()
    });

    await attendanceRecord.save();

    res.status(201).json({
      message: 'Attendance marked successfully!',
      attendance: attendanceRecord,
    });

  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ message: error.message || 'An unexpected server error occurred.' });
  }
};


// Sync offline attendance records
export const syncAttendance = async (req, res) => {
  try {
    const { attendances } = req.body;
    const studentId = req.user.id;

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return res.status(400).json({ message: 'No attendance records to sync.' });
    }

    const syncResults = [];
    for (const record of attendances) {
      const { sessionId, classId, scheduleId, studentCoordinates, livenessPassed, faceEmbedding, timestamp } = record;
      
      const existing = await Attendance.findOne({ studentId, sessionId });

      if (existing) {
        syncResults.push({ sessionId, status: 'skipped', message: 'Already exists.' });
        continue;
      }

      const newRecord = new Attendance({
        studentId,
        sessionId,
        classId,
        scheduleId,
        studentCoordinates,
        livenessPassed,
        faceEmbedding,
        timestamp: new Date(timestamp),
        synced: true,
      });

      await newRecord.save();
      syncResults.push({ sessionId, status: 'success' });
    }

    res.status(200).json({
      message: 'Sync completed.',
      results: syncResults,
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: error.message });
  }
};


// Get attendance records for a class (for teachers/admins)
export const getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, status } = req.query;

    const query = { classId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'studentId',
        select: 'fullName enrollmentNo name'
      })
      .populate({
        path: 'classId',
        select: 'classNumber subjectCode subjectName'
      })
      .sort({ timestamp: -1 });
    
    // Also, we need a list of all enrolled students to mark absentees
    const enrolledStudents = await ClassEnrollment.find({ classId }).populate('studentId', 'fullName enrollmentNo name');

    // This logic needs to be more sophisticated.
    // For a given day/session, you'd find who from the enrolled list DID NOT attend.
    // The current implementation just returns recorded presences/manual entries.

    const transformedRecords = records.map(record => ({
      _id: record._id,
      student: record.studentId ? {
        _id: record.studentId._id,
        fullName: record.studentId.fullName || record.studentId.name,
        enrollmentNo: record.studentId.enrollmentNo,
      } : null,
      classInfo: record.classId,
      attendedAt: record.timestamp,
      status: record.status,
    }));

    const stats = {
      totalEnrolled: enrolledStudents.length,
      present: transformedRecords.filter(r => r.status === 'present').length,
      absent: enrolledStudents.length - transformedRecords.filter(r => r.status === 'present').length, // Simplistic calculation
    };

    res.json({
      attendance: transformedRecords,
      stats,
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: error.message });
  }
};


// Get attendance records for a student
export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId } = req.query; // optional filter by class

    const query = { studentId };
    if (classId) {
      query.classId = classId;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'classId',
        select: 'subjectName subjectCode'
      })
      .sort({ timestamp: -1 });

    res.json(records);
    
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update an attendance record (e.g., mark as absent)
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const updatedRecord = await Attendance.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedRecord) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: error.message });
  }
};


// Manually create an attendance record
export const createManualAttendance = async (req, res) => {
  try {
    const { studentId, classId, scheduleId, status, timestamp } = req.body;
    
    const newRecord = new Attendance({
      studentId,
      classId,
      scheduleId,
      status,
      timestamp: new Date(timestamp),
      manualEntry: true,
      markedBy: req.user.id, // Log who made the manual entry
    });

    await newRecord.save();
    res.status(201).json(newRecord);
    
  } catch (error) {
    console.error('Error with manual attendance:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const attendanceRecords = await Attendance.find({ scheduleId: scheduleId })
      .populate('studentId', 'fullName enrollmentNo');
      
    if (!attendanceRecords) {
      return res.status(404).json({ message: 'No attendance records found for this schedule.' });
    }

    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getFullAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, studentId } = req.query;

    const matchQuery = { classId: mongoose.Types.ObjectId(classId) };
    if (startDate) {
      matchQuery.timestamp = { $gte: new Date(startDate) };
    }
    if (endDate) {
      matchQuery.timestamp = { ...matchQuery.timestamp, $lte: new Date(endDate) };
    }
    if (studentId) {
      matchQuery.studentId = mongoose.Types.ObjectId(studentId);
    }

    const report = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$studentId',
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          _id: 0,
          studentId: '$_id',
          studentName: '$studentInfo.fullName',
          enrollmentNo: '$studentInfo.enrollmentNo',
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          totalDays: { $add: ['$presentDays', '$absentDays', '$lateDays'] }
        }
      },
      {
        $project: {
          studentId: 1,
          studentName: 1,
          enrollmentNo: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          totalDays: 1,
          percentage: {
            $cond: [
              { $eq: ['$totalDays', 0] },
              0,
              { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] }
            ]
          }
        }
      }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Error generating full report:', error);
    res.status(500).json({ message: error.message });
  }
};