import { RekognitionClient, IndexFacesCommand } from '@aws-sdk/client-rekognition';
import crypto from 'crypto';

// Initialize Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Create face embedding from image using AWS Rekognition
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<Object>} Face embedding data
 */
const createFaceEmbedding = async (imageBuffer) => {
  try {
    const command = new IndexFacesCommand({
      CollectionId: 'student-faces-collection', // You'll need to create this collection
      Image: {
        Bytes: imageBuffer
      },
      DetectionAttributes: ['ALL'],
      MaxFaces: 1,
      QualityFilter: 'AUTO'
    });

    const response = await rekognitionClient.send(command);
    
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceRecord = response.FaceRecords[0];
      return {
        faceId: faceRecord.Face.FaceId,
        boundingBox: faceRecord.Face.BoundingBox,
        confidence: faceRecord.Face.Confidence,
        landmarks: faceRecord.FaceDetail.Landmarks,
        pose: faceRecord.FaceDetail.Pose,
        quality: faceRecord.FaceDetail.Quality
      };
    } else {
      throw new Error('No face detected in the image');
    }
  } catch (error) {
    console.error('Error creating face embedding:', error);
    if (error.name === 'ResourceNotFoundException') {
      throw new Error('Face collection not found. Please contact administrator.');
    }
    throw new Error(`Failed to create face embedding: ${error.message}`);
  }
};

/**
 * Create a simple face embedding array (fallback method)
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<Array>} Simple embedding array
 */
const createSimpleFaceEmbedding = async (imageBuffer) => {
  try {
    // For now, create a simple hash-based embedding as fallback
    // In production, you'd want to use a proper face recognition library
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    
    // Convert hash to array of numbers (simple embedding)
    const embedding = [];
    for (let i = 0; i < hash.length; i += 2) {
      const hexPair = hash.substr(i, 2);
      embedding.push(parseInt(hexPair, 16) / 255); // Normalize to 0-1
    }
    
    return embedding.slice(0, 128); // Return first 128 values as embedding
  } catch (error) {
    console.error('Error creating simple face embedding:', error);
    throw new Error(`Failed to create face embedding: ${error.message}`);
  }
};

export {
  createFaceEmbedding,
  createSimpleFaceEmbedding
};