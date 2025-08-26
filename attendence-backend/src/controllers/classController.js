import { Class } from '../models/classModel.js';
// Basic CRUD for Classes
export const createClass = async (req, res) => {
  console.log('Create class request received:', req.body);
  try {
    // Add teacher information to the class
    const classData = {
      ...req.body,
      teacherId: req.user.id, // From JWT token
      teacherName: req.user.name // From JWT token
    };
    
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
    console.log(`Found ${classes.length} classes for teacher ${req.user.name}`);
    res.status(200).json(classes);
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
      const { Schedule } = await import('../models/scheduleModel.js');
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