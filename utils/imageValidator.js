/**
 * Image validation utility
 * Validates base64 image size and optionally compresses it
 */

const MAX_BASE64_SIZE = 500 * 1024; // 500KB base64 ≈ 375KB image
const MAX_IMAGE_SIZE = 375 * 1024; // 375KB original image

/**
 * Validates base64 image size
 * @param {string} base64String - Base64 encoded image string
 * @returns {Object} { valid: boolean, error?: string, size?: number }
 */
function validateBase64Image(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    return { valid: false, error: 'Invalid base64 string' };
  }
  
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  const size = base64Data.length;
  
  if (size > MAX_BASE64_SIZE) {
    return { 
      valid: false, 
      error: `Image too large: ${(size / 1024).toFixed(2)}KB. Maximum: ${(MAX_BASE64_SIZE / 1024).toFixed(2)}KB base64 (≈${(MAX_IMAGE_SIZE / 1024).toFixed(2)}KB image)`,
      size 
    };
  }
  
  return { valid: true, size };
}

/**
 * Estimates original image size from base64
 * Base64 is approximately 1.33x the original size
 * @param {string} base64String - Base64 encoded image string
 * @returns {number} Estimated original size in bytes
 */
function estimateOriginalSize(base64String) {
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  return Math.floor(base64Data.length / 1.33);
}

module.exports = {
  validateBase64Image,
  estimateOriginalSize,
  MAX_BASE64_SIZE,
  MAX_IMAGE_SIZE
};
