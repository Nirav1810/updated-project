import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Lazy initialize S3 client to ensure environment variables are loaded
let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    // Debug environment variables
    console.log('AWS Environment Check:');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not Set');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not Set');
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not found in environment variables');
    }
    
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log('S3 Client initialized successfully');
  }
  return s3Client;
};

const BUCKET_NAME = 'qr-attendance-student-faces-18102025';

/**
 * Upload face image to S3
 * @param {Buffer} imageBuffer - The image buffer
 * @param {string} filename - The filename for the S3 object
 * @param {string} contentType - The content type of the image
 * @returns {Promise<string>} S3 key of the uploaded image
 */
const uploadFaceImage = async (imageBuffer, filename, contentType = 'image/jpeg') => {
  try {
    const client = getS3Client();
    const key = `face-images/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      ACL: 'private', // Make sure images are private
      Metadata: {
        purpose: 'face-recognition',
        uploadedAt: new Date().toISOString()
      }
    });

    await client.send(command);
    
    console.log(`Successfully uploaded face image to S3: ${key}`);
    return key;
  } catch (error) {
    console.error('Error uploading face image to S3:', error);
    throw new Error(`Failed to upload face image: ${error.message}`);
  }
};

/**
 * Generate a unique filename for face images
 * @param {string} userId - User ID
 * @param {string} extension - File extension (default: jpg)
 * @returns {string} Generated filename
 */
const generateFaceImageFilename = (userId, extension = 'jpg') => {
  const timestamp = Date.now();
  return `user-${userId}-face-${timestamp}.${extension}`;
};

export {
  uploadFaceImage,
  generateFaceImageFilename,
  BUCKET_NAME
};