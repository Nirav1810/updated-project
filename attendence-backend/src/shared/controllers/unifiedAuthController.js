import { User } from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// Unified Register (works for both students and teachers)
export const register = async (req, res) => {
  console.log('Unified registration request received:', req.body);
  try {
    const { name, fullName, email, password, enrollmentNo, role, classYear, semester, faceEmbedding } = req.body;
    console.log('Extracted data:', { name, fullName, email, enrollmentNo, role, classYear, semester });

    // Use fullName if provided, otherwise use name, and ensure we have at least one
    const userName = fullName || name;
    if (!userName || !email || !password) {
      return res.status(400).json({ 
        message: 'Name/fullName, email, and password are required' 
      });
    }

    // Validate student-specific fields
    if (role === 'student') {
      if (!enrollmentNo) {
        return res.status(400).json({ 
          message: 'Enrollment number is required for students',
          error: 'ENROLLMENT_REQUIRED'
        });
      }
      if (!classYear) {
        return res.status(400).json({ 
          message: 'Class year is required for students',
          error: 'CLASS_YEAR_REQUIRED'
        });
      }
      if (!semester) {
        return res.status(400).json({ 
          message: 'Semester is required for students',
          error: 'SEMESTER_REQUIRED'
        });
      }
    }

    // Check if user exists by email
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists with email:', email);
      return res.status(409).json({ 
        message: 'An account with this email already exists. Please use a different email or try logging in.',
        error: 'EMAIL_EXISTS',
        suggestion: 'Try logging in instead or use a different email address'
      });
    }

    // Check if enrollment number already exists (for students)
    if (enrollmentNo) {
      const enrollmentExists = await User.findOne({ enrollmentNo });
      if (enrollmentExists) {
        console.log('Enrollment number already exists:', enrollmentNo);
        return res.status(409).json({ 
          message: 'This enrollment number is already registered. Please check your enrollment number or contact support.',
          error: 'ENROLLMENT_EXISTS',
          suggestion: 'Verify your enrollment number or try logging in if you already have an account'
        });
      }
    }

    console.log('Creating new user...');
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user data
    const userData = {
      name: userName,
      fullName: userName,
      email,
      password: hashedPassword,
      role: role || 'student',
      faceEmbedding: faceEmbedding || []
    };

    // Add student-specific fields only for students
    if (role === 'student') {
      userData.enrollmentNo = enrollmentNo;
      userData.classYear = classYear;
      userData.semester = semester;
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    // Create user
    const user = await User.create(userData);

    console.log('User created successfully:', user._id);

    if (user) {
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          fullName: user.fullName || user.name,
          email: user.email,
          role: user.role,
          enrollmentNo: user.enrollmentNo,
          classYear: user.classYear,
          semester: user.semester
        }
      });
    } else {
      console.log('Failed to create user');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Unified Login (works for both students and teachers)
export const login = async (req, res) => {
  try {
    const { email, enrollmentNo, password } = req.body;

    // Build query - support login with either email or enrollmentNo
    let query = {};
    if (email) {
      query.email = email;
    } else if (enrollmentNo) {
      query.enrollmentNo = enrollmentNo;
    } else {
      return res.status(400).json({ message: 'Email or enrollment number is required' });
    }

    // Find user
    const user = await User.findOne(query);

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          fullName: user.fullName || user.name,
          email: user.email,
          role: user.role,
          enrollmentNo: user.enrollmentNo
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Development helper: Clear user by email (for testing)
export const clearUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Only allow this in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        message: 'This endpoint is not available in production' 
      });
    }

    const deletedUser = await User.findOneAndDelete({ email });
    
    if (deletedUser) {
      console.log('Deleted user for testing:', email);
      res.status(200).json({
        success: true,
        message: `User with email ${email} has been deleted`,
        deletedUser: {
          _id: deletedUser._id,
          email: deletedUser.email,
          role: deletedUser.role,
          enrollmentNo: deletedUser.enrollmentNo
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: `No user found with email ${email}`
      });
    }

  } catch (error) {
    console.error('Clear user error:', error);
    res.status(500).json({ 
      message: 'Failed to clear user',
      error: error.message 
    });
  }
};

// Check if email or enrollment number exists
export const checkUserExists = async (req, res) => {
  try {
    const { email, enrollmentNo } = req.query;
    
    if (!email && !enrollmentNo) {
      return res.status(400).json({ 
        message: 'Email or enrollment number is required' 
      });
    }

    const result = {
      email: { exists: false, available: true },
      enrollmentNo: { exists: false, available: true }
    };

    // Check email if provided
    if (email) {
      const emailExists = await User.findOne({ email });
      result.email.exists = !!emailExists;
      result.email.available = !emailExists;
    }

    // Check enrollment number if provided
    if (enrollmentNo) {
      const enrollmentExists = await User.findOne({ enrollmentNo });
      result.enrollmentNo.exists = !!enrollmentExists;
      result.enrollmentNo.available = !enrollmentExists;
    }

    res.status(200).json({
      success: true,
      data: result,
      message: 'Availability check completed'
    });

  } catch (error) {
    console.error('Check user exists error:', error);
    res.status(500).json({ 
      message: 'Failed to check user availability',
      error: error.message 
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email, enrollmentNo } = req.body;
    
    if (!email && !enrollmentNo) {
      return res.status(400).json({ message: 'Email or enrollment number is required' });
    }

    // Build query
    let query = {};
    if (email) {
      query.email = email;
    } else if (enrollmentNo) {
      query.enrollmentNo = enrollmentNo;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For now, just return a success message
    // In a real implementation, you would send an email with a reset link
    res.json({ 
      message: 'Password reset instructions have been sent to your email address',
      userFound: true,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};