import { QRCodeSession } from '../models/qrCodeSessionModel.js';

// Validate QR Code Token
export const validateQRCode = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    console.log('Validating QR token:', token);
    console.log('QR validation request body:', req.body);

    // Find active QR session with matching token
    const session = await QRCodeSession.findOne({
      currentToken: token,
      isActive: true,
      sessionExpiresAt: { $gt: new Date() }
    }).populate('classId');

    if (!session) {
      console.log('Invalid or expired QR token:', token);
      console.log('Current time:', new Date());
      
      // Debug: Check if there are any active sessions
      const activeSessions = await QRCodeSession.find({
        isActive: true,
        sessionExpiresAt: { $gt: new Date() }
      });
      console.log('Active sessions found:', activeSessions.length);
      
      return res.status(400).json({ 
        valid: false, 
        message: 'Invalid or expired QR code' 
      });
    }

    console.log('QR token validated successfully:', session.sessionId);
    console.log('Session details:', {
      sessionId: session.sessionId,
      classId: session.classId._id,
      token: session.currentToken,
      expiresAt: session.sessionExpiresAt
    });

    res.json({
      valid: true,
      sessionId: session.sessionId,
      classId: session.classId._id,
      classInfo: {
        classNumber: session.qrPayload.classNumber,
        subjectCode: session.qrPayload.subjectCode,
        subjectName: session.qrPayload.subjectName,
        classYear: session.qrPayload.classYear,
        semester: session.qrPayload.semester,
        division: session.qrPayload.division
      },
      coordinates: session.qrPayload.coordinates,
      timestamp: session.qrPayload.timestamp
    });

  } catch (error) {
    console.error('QR validation error:', error);
    res.status(500).json({ message: error.message });
  }
};