import { User } from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { uploadFaceImage, generateFaceImageFilename } from '../services/s3Service.js';
import { createSimpleFaceEmbedding } from '../services/faceEmbeddingService.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// Unified Register (works for both students and teachers)
export const register = async (req, res) => {
  console.log('Unified registration request received:', req.body);
  console.log('Files received:', req.files);
  
  try {
    const { name, fullName, email, password, enrollmentNo, role, classYear, semester } = req.body;
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
    console.log('Password received for registration:', password);
    console.log('Password length:', password ? password.length : 'undefined');
    console.log('NOTE: Letting User model pre-save hook handle password hashing to avoid double-hashing');

    // Create user data - pass plain password, let pre-save hook handle hashing
    const userData = {
      name: userName,
      fullName: userName,
      email,
      password: password, // Pass plain password - pre-save hook will hash it
      role: role || 'student'
    };

    // Add student-specific fields only for students
    if (role === 'student') {
      userData.enrollmentNo = enrollmentNo;
      userData.classYear = classYear;
      userData.semester = semester;
    }

    // Handle face image upload if provided
    let faceImageS3Key = null;
    let faceEmbedding = [];

    if (req.files && req.files.faceImage) {
      try {
        console.log('Processing face image upload...');
        const faceImageFile = req.files.faceImage[0];
        const filename = generateFaceImageFilename(userName);
        
        // Upload to S3
        faceImageS3Key = await uploadFaceImage(
          faceImageFile.buffer, 
          filename, 
          faceImageFile.mimetype
        );
        
        // Create face embedding
        faceEmbedding = await createSimpleFaceEmbedding(faceImageFile.buffer);
        
        console.log('Face image uploaded to S3:', faceImageS3Key);
        console.log('Face embedding created, length:', faceEmbedding.length);
        
        userData.faceImageS3Key = faceImageS3Key;
        userData.faceEmbedding = faceEmbedding;
      } catch (faceError) {
        console.error('Error processing face image:', faceError);
        // Continue with registration even if face processing fails
        console.log('Continuing registration without face data...');
      }
    } else if (req.body.faceImageBase64) {
      try {
        console.log('Processing base64 face image...');
        console.log('Base64 image size:', req.body.faceImageBase64.length);
        // Handle base64 image from mobile app
        const base64Data = req.body.faceImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        console.log('Image buffer size:', imageBuffer.length);
        const filename = generateFaceImageFilename(userName);
        console.log('Generated filename:', filename);
        
        // Upload to S3
        console.log('Attempting S3 upload...');
        faceImageS3Key = await uploadFaceImage(imageBuffer, filename, 'image/jpeg');
        
        // Create face embedding
        faceEmbedding = await createSimpleFaceEmbedding(imageBuffer);
        
        console.log('Face image uploaded to S3:', faceImageS3Key);
        console.log('Face embedding created, length:', faceEmbedding.length);
        
        userData.faceImageS3Key = faceImageS3Key;
        userData.faceEmbedding = faceEmbedding;
      } catch (faceError) {
        console.error('Error processing base64 face image:', faceError);
        // Continue with registration even if face processing fails
        console.log('Continuing registration without face data...');
      }
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]', faceEmbedding: '[HIDDEN]' });

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
          semester: user.semester,
          hasFaceImage: !!faceImageS3Key
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
  console.log('Login request received:', { email: req.body.email, enrollmentNo: req.body.enrollmentNo, hasPassword: !!req.body.password });
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

    console.log('Searching for user with query:', query);

    // Find user
    const user = await User.findOne(query);
    console.log('User found:', !!user, user ? { id: user._id, email: user.email, enrollmentNo: user.enrollmentNo, role: user.role } : 'No user found');

    if (user) {
      console.log('User found, comparing password...');
      console.log('Provided password:', password);
      console.log('Stored password hash starts with:', user.password.substring(0, 10));
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', passwordMatch);
      
      if (passwordMatch) {
        console.log('Password comparison successful');
      } else {
        console.log('Password mismatch - login failed');
      }
    } else {
      console.log('User not found');
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      console.log('Login successful for user:', user.enrollmentNo || user.email);
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
      console.log('Sending 401 Invalid credentials response');
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
      // Also clean up related enrollment records if it's a student
      let deletedEnrollments = 0;
      if (deletedUser.role === 'student') {
        const ClassEnrollment = (await import('../models/classEnrollmentModel.js')).ClassEnrollment;
        const result = await ClassEnrollment.deleteMany({ studentId: deletedUser._id });
        deletedEnrollments = result.deletedCount;
        console.log(`Deleted ${deletedEnrollments} enrollment records for user ${email}`);
      }
      
      console.log('Deleted user for testing:', email);
      res.status(200).json({
        success: true,
        message: `User with email ${email} has been deleted`,
        deletedUser: {
          _id: deletedUser._id,
          email: deletedUser.email,
          role: deletedUser.role,
          enrollmentNo: deletedUser.enrollmentNo
        },
        deletedEnrollments
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

// Test endpoint for password debugging
export const testPassword = async (req, res) => {
  try {
    const { password } = req.body;
    console.log('=== PASSWORD DEBUGGING TEST ===');
    console.log('Original password:', password);
    console.log('Password type:', typeof password);
    console.log('Password length:', password ? password.length : 'undefined');
    
    // Hash it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Generated hash:', hashedPassword);
    
    // Test comparison
    const comparison = await bcrypt.compare(password, hashedPassword);
    console.log('Comparison result:', comparison);
    
    res.json({
      original: password,
      hash: hashedPassword,
      comparison: comparison
    });
  } catch (error) {
    console.error('Password test error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cleanup orphaned enrollment records
export const cleanupOrphanedEnrollments = async (req, res) => {
  try {
    // Only allow this in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        message: 'This endpoint is not available in production' 
      });
    }

    const ClassEnrollment = (await import('../models/classEnrollmentModel.js')).ClassEnrollment;
    
    // Find all enrollments and populate studentId
    const enrollments = await ClassEnrollment.find({}).populate('studentId');
    
    // Find enrollments where studentId is null (orphaned)
    const orphanedEnrollments = enrollments.filter(enrollment => !enrollment.studentId);
    
    // Delete orphaned enrollments
    const orphanedIds = orphanedEnrollments.map(enrollment => enrollment._id);
    const result = await ClassEnrollment.deleteMany({ _id: { $in: orphanedIds } });
    
    console.log(`Cleaned up ${result.deletedCount} orphaned enrollment records`);
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} orphaned enrollment records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: error.message });
  }
};