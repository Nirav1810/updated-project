import { User } from '../../shared/models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// Register Student
export const registerStudent = async (req, res) => {
  console.log('Student registration request received:', req.body);
  try {
    const { name, email, password, enrollmentNo } = req.body;
    console.log('Extracted student data:', { name, email, enrollmentNo });

    // Validate required fields
    if (!name || !email || !password || !enrollmentNo) {
      return res.status(400).json({ 
        message: 'Name, email, password, and enrollment number are required for students' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if enrollment number already exists
    const enrollmentExists = await User.findOne({ enrollmentNo });
    if (enrollmentExists) {
      console.log('Enrollment number already exists:', enrollmentNo);
      return res.status(400).json({ message: 'Enrollment number already exists' });
    }

    console.log('Creating new student...');
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create student user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: 'student',
      enrollmentNo
    };

    console.log('Creating student with data:', { ...userData, password: '[HIDDEN]' });

    // Create user
    const user = await User.create(userData);

    console.log('Student created successfully:', user._id);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNo: user.enrollmentNo,
        token: generateToken(user._id)
      });
    } else {
      console.log('Failed to create student');
      res.status(400).json({ message: 'Invalid student data' });
    }
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Login Student
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email and ensure it's a student
    const user = await User.findOne({ email, role: 'student' });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNo: user.enrollmentNo,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Student Profile
export const getStudentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Student Profile
export const updateStudentProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      enrollmentNo: updatedUser.enrollmentNo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
