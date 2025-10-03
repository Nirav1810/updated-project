import { Class } from '../../shared/models/classModel.js';
import { ClassEnrollment } from '../../shared/models/classEnrollmentModel.js';
import { User } from '../../shared/models/userModel.js';
// Basic CRUD for Classes
export const createClass = async (req, res) => {
  console.log('Create class request received:', req.body);
  try {
    // Ensure we have the teacher's full information
    const teacher = await User.findById(req.user.id).select('fullName email');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Add teacher information to the class
    const classData = {
      ...req.body,
      teacherId: req.user.id, // From JWT token
      teacherName: teacher.fullName, // From database to ensure we have the correct field
      createdBy: req.user.id // Track that teacher created this class
    };
    
    console.log('Final classData:', classData);
    
    const newClass = await Class.create(classData);
    console.log('Class created successfully:', newClass._id);
    res.status(201).json(newClass);
  } catch (error) { 
    console.error('Create class error:', error);
    res.status(400).json({ message: error.message });
  }
};
export const getAllClasses = async (req, res) => {
  try {
    // Only return classes for the logged-in teacher
    const classes = await Class.find({ teacherId: req.user.id });
    
    // Add student count to each class
    const classesWithCounts = await Promise.all(
      classes.map(async (classItem) => {
        const studentCount = await ClassEnrollment.countDocuments({ classId: classItem._id });
        return {
          ...classItem.toObject(),
          studentCount
        };
      })
    );
    
    console.log(`Found ${classes.length} classes for teacher ${req.user.name}`);
    res.status(200).json(classesWithCounts);
  } catch (error) { 
    console.error('Get all classes error:', error);
    res.status(500).json({ message: error.message });
  }
};
export const getClassById = async (req, res) => {
  try {
    // Only allow access to classes owned by the logged-in teacher
    const singleClass = await Class.findOne({ 
      _id: req.params.id, 
      teacherId: req.user.id 
    });
    
    if (!singleClass) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }
    
    res.status(200).json(singleClass);
  } catch (error) { 
    console.error('Get class by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    // Only allow updates to classes owned by the logged-in teacher
    const updatedClass = await Class.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }
    
    console.log('Class updated successfully:', updatedClass._id);
    res.status(200).json(updatedClass);
  } catch (error) { 
    console.error('Update class error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    // Only allow deletion of classes owned by the logged-in teacher
    const classToDelete = await Class.findOne({ 
      _id: req.params.id, 
      teacherId: req.user.id 
    });
    
    if (!classToDelete) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }

    // Import Schedule and other models if needed for cascading deletes
    // Note: We'll do a soft cascade by removing related records
    try {
      // Delete related schedules (if Schedule model is available)
      const { Schedule } = await import('../../shared/models/scheduleModel.js');
      await Schedule.deleteMany({ classId: req.params.id });
      console.log('Related schedules deleted for class:', req.params.id);
    } catch (scheduleError) {
      console.log('No schedules to delete or schedule model not available:', scheduleError.message);
    }

    // Delete the class
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    
    console.log('Class deleted successfully:', deletedClass._id);
    res.status(200).json({ 
      message: 'Class and related records deleted successfully',
      deletedClass: {
        _id: deletedClass._id,
        subjectCode: deletedClass.subjectCode,
        subjectName: deletedClass.subjectName
      }
    });
  } catch (error) { 
    console.error('Delete class error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Enroll a student in a class
export const enrollStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;
    const teacherId = req.user.id;

    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only enroll students in your own classes' 
      });
    }

    // Verify the student exists and has student role
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found or invalid user role' 
      });
    }

    // Check if student is already enrolled
    const existingEnrollment = await ClassEnrollment.findOne({ classId, studentId });
    if (existingEnrollment) {
      return res.status(409).json({ 
        success: false, 
        message: 'Student is already enrolled in this class' 
      });
    }

    // Create enrollment
    const enrollment = await ClassEnrollment.create({ classId, studentId });
    
    // Populate the enrollment for response
    const populatedEnrollment = await ClassEnrollment.findById(enrollment._id)
      .populate('studentId', 'name email enrollmentNo rollNumber')
      .populate('classId', 'subjectCode subjectName');

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: populatedEnrollment
    });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to enroll student',
      error: error.message 
    });
  }
};

// Enroll student by enrollment number (easier for teachers)
export const enrollStudentByEnrollmentNo = async (req, res) => {
  try {
    const { classId } = req.params;
    const { enrollmentNo } = req.body;
    const teacherId = req.user.id;

    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only enroll students in your own classes' 
      });
    }

    // Find student by enrollment number
    const student = await User.findOne({ enrollmentNo, role: 'student' });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found with this enrollment number' 
      });
    }

    // Check if student is already enrolled
    const existingEnrollment = await ClassEnrollment.findOne({ classId, studentId: student._id });
    if (existingEnrollment) {
      return res.status(409).json({ 
        success: false, 
        message: 'Student is already enrolled in this class' 
      });
    }

    // Create enrollment
    const enrollment = await ClassEnrollment.create({ classId, studentId: student._id });
    
    // Populate the enrollment for response
    const populatedEnrollment = await ClassEnrollment.findById(enrollment._id)
      .populate('studentId', 'name email enrollmentNo rollNumber')
      .populate('classId', 'subjectCode subjectName');

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: populatedEnrollment
    });

  } catch (error) {
    console.error('Enroll student by enrollment number error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to enroll student',
      error: error.message 
    });
  }
};

// Get enrolled students for a class
export const getEnrolledStudents = async (req, res) => {
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

    // Get enrolled students
    const enrollments = await ClassEnrollment.find({ classId })
      .populate('studentId', 'name email enrollmentNo rollNumber')
      .sort({ enrolledAt: 1 });

    const students = enrollments.map(enrollment => ({
      _id: enrollment.studentId._id,
      name: enrollment.studentId.name,
      rollNumber: enrollment.studentId.rollNumber,
      email: enrollment.studentId.email,
      enrollmentNo: enrollment.studentId.enrollmentNo,
      enrolledAt: enrollment.enrolledAt
    }));

    res.status(200).json({
      success: true,
      data: students,
      total: students.length
    });

  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch enrolled students',
      error: error.message 
    });
  }
};

// Remove student from class
export const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.user.id;

    // Verify the class belongs to the teacher
    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only remove students from your own classes' 
      });
    }

    // Find and remove enrollment
    const enrollment = await ClassEnrollment.findOneAndDelete({ classId, studentId });
    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student enrollment not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student removed from class successfully'
    });

  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove student from class',
      error: error.message 
    });
  }
};