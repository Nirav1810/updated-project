import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';

// The SDK automatically uses credentials from process.env (e.g., AWS_ACCESS_KEY_ID)
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
});

// IMPORTANT: Replace with your actual S3 bucket name from your AWS account
const S3_BUCKET_NAME = 'qr-attendance-student-faces-18102025'; 
const SIMILARITY_THRESHOLD = 98; // Faces must be at least 98% similar to be a match

/**
 * Compares a face from an image buffer against a reference image stored in S3.
 * @param {string} sourceImageS3Key - The S3 key (path) to the student's registered face image.
 * @param {Buffer} targetImageBytes - The newly captured face image from the mobile app as a Buffer.
 * @returns {Promise<boolean>} - Resolves to true if faces match, otherwise false.
 */
export const compareFaces = async (sourceImageS3Key, targetImageBytes) => {
  try {
    const command = new CompareFacesCommand({
      SourceImage: {
        S3Object: {
          Bucket: S3_BUCKET_NAME,
          Name: sourceImageS3Key,
        },
      },
      TargetImage: {
        Bytes: targetImageBytes,
      },
      SimilarityThreshold: SIMILARITY_THRESHOLD,
    });

    const response = await rekognitionClient.send(command);

    if (response.FaceMatches && response.FaceMatches.length > 0) {
      const bestMatch = response.FaceMatches[0];
      console.log(`Face match successful. Similarity: ${bestMatch.Similarity?.toFixed(2)}%`);
      return bestMatch.Similarity >= SIMILARITY_THRESHOLD;
    }
    
    console.log('Face match failed: No matching faces found above the similarity threshold.');
    return false;

  } catch (error) {
    console.error('AWS Rekognition error:', error);
    // For security, any error during face comparison is treated as a failed match.
    throw new Error('Face could not be verified. Please ensure your face is clear and centered.');
  }
};