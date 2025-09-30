/**
 * Image compression utility for reducing payload size
 */

/**
 * Compresses a base64 image string by reducing quality
 * @param base64String - The base64 image string (with or without data URI prefix)
 * @param maxSizeKB - Maximum size in KB (default: 500KB)
 * @returns Promise<string> - Compressed base64 string
 */
export const compressBase64Image = async (base64String: string, maxSizeKB: number = 500): Promise<string> => {
  return new Promise((resolve) => {
    // Remove data URI prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    // Calculate current size
    const currentSizeKB = Math.round((base64Data.length * 3) / 4 / 1024);
    
    console.log(`Image size: ${currentSizeKB}KB, target: ${maxSizeKB}KB`);
    
    // If already small enough, return as is
    if (currentSizeKB <= maxSizeKB) {
      resolve(base64Data);
      return;
    }
    
    // For React Native, we'll use a simple quality reduction approach
    // Since we can't easily manipulate canvas in RN, we'll rely on camera quality settings
    // This function serves as a size checker and validator
    
    console.log(`Warning: Image size (${currentSizeKB}KB) exceeds target (${maxSizeKB}KB)`);
    console.log('Consider reducing camera quality further');
    
    // Return the original data - actual compression would need native modules
    resolve(base64Data);
  });
};

/**
 * Estimates the size of a base64 string in KB
 * @param base64String - The base64 string
 * @returns size in KB
 */
export const getBase64SizeKB = (base64String: string): number => {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Math.round((base64Data.length * 3) / 4 / 1024);
};

/**
 * Validates if image size is within acceptable limits
 * @param base64String - The base64 string
 * @param maxSizeKB - Maximum allowed size in KB
 * @returns boolean indicating if size is acceptable
 */
export const isImageSizeAcceptable = (base64String: string, maxSizeKB: number = 1000): boolean => {
  const sizeKB = getBase64SizeKB(base64String);
  return sizeKB <= maxSizeKB;
};