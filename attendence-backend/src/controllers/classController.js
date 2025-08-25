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