// Video utility functions for the video trimmer app

/**
 * Format time from milliseconds to MM:SS format
 * @param {number} timeInMillis - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTime = (timeInMillis) => {
  const totalSeconds = Math.floor(timeInMillis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format time from milliseconds to HH:MM:SS format for longer videos
 * @param {number} timeInMillis - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatLongTime = (timeInMillis) => {
  const totalSeconds = Math.floor(timeInMillis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Convert time string (MM:SS) to milliseconds
 * @param {string} timeString - Time string in MM:SS format
 * @returns {number} Time in milliseconds
 */
export const timeStringToMillis = (timeString) => {
  const [minutes, seconds] = timeString.split(':').map(Number);
  return (minutes * 60 + seconds) * 1000;
};

/**
 * Validate if start time is less than end time
 * @param {number} startTime - Start time in milliseconds
 * @param {number} endTime - End time in milliseconds
 * @returns {boolean} True if valid, false otherwise
 */
export const validateTimeRange = (startTime, endTime) => {
  return startTime < endTime && startTime >= 0 && endTime > 0;
};

/**
 * Calculate trimmed duration
 * @param {number} startTime - Start time in milliseconds
 * @param {number} endTime - End time in milliseconds
 * @returns {number} Duration in milliseconds
 */
export const calculateTrimmedDuration = (startTime, endTime) => {
  return Math.max(0, endTime - startTime);
};

/**
 * Get video file size estimation (rough calculation)
 * @param {number} durationInMillis - Duration in milliseconds
 * @param {number} bitrate - Bitrate in kbps (default: 1000)
 * @returns {number} Estimated file size in bytes
 */
export const estimateFileSize = (durationInMillis, bitrate = 1000) => {
  const durationInSeconds = durationInMillis / 1000;
  const sizeInBits = durationInSeconds * bitrate * 1000;
  return sizeInBits / 8; // Convert to bytes
};

/**
 * Format file size from bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if video duration is valid for trimming
 * @param {number} duration - Video duration in milliseconds
 * @param {number} minDuration - Minimum required duration (default: 1000ms)
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidVideoDuration = (duration, minDuration = 1000) => {
  return duration && duration > minDuration;
};

/**
 * Get suggested trim points based on video duration
 * @param {number} videoDuration - Total video duration in milliseconds
 * @returns {object} Object with suggested start and end times
 */
export const getSuggestedTrimPoints = (videoDuration) => {
  const maxTrimDuration = 30000; // 30 seconds max
  const suggestedDuration = Math.min(videoDuration, maxTrimDuration);

  return {
    startTime: 0,
    endTime: suggestedDuration,
    duration: suggestedDuration,
  };
};

/**
 * Calculate progress percentage
 * @param {number} currentTime - Current playback time in milliseconds
 * @param {number} totalTime - Total duration in milliseconds
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (currentTime, totalTime) => {
  if (!totalTime || totalTime === 0) return 0;
  return Math.max(0, Math.min(100, (currentTime / totalTime) * 100));
};

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Debounce function to limit function calls
 * @param {function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Generate video metadata object
 * @param {string} uri - Video URI
 * @param {number} duration - Video duration in milliseconds
 * @param {number} width - Video width
 * @param {number} height - Video height
 * @returns {object} Video metadata object
 */
export const createVideoMetadata = (uri, duration, width, height) => {
  return {
    uri,
    duration,
    width,
    height,
    aspectRatio: width / height,
    formattedDuration: formatTime(duration),
    estimatedSize: estimateFileSize(duration),
    isValid: isValidVideoDuration(duration),
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generate trim settings object
 * @param {number} startTime - Start time in milliseconds
 * @param {number} endTime - End time in milliseconds
 * @param {string} videoUri - Video URI
 * @returns {object} Trim settings object
 */
export const createTrimSettings = (startTime, endTime, videoUri) => {
  const trimmedDuration = calculateTrimmedDuration(startTime, endTime);

  return {
    startTime,
    endTime,
    duration: trimmedDuration,
    videoUri,
    formattedStartTime: formatTime(startTime),
    formattedEndTime: formatTime(endTime),
    formattedDuration: formatTime(trimmedDuration),
    isValid: validateTimeRange(startTime, endTime),
    estimatedSize: estimateFileSize(trimmedDuration),
    createdAt: new Date().toISOString(),
  };
};

/**
 * Common video formats and their extensions
 */
export const VIDEO_FORMATS = {
  MP4: '.mp4',
  MOV: '.mov',
  AVI: '.avi',
  MKV: '.mkv',
  WMV: '.wmv',
  FLV: '.flv',
  WEBM: '.webm',
};

/**
 * Common video resolutions
 */
export const VIDEO_RESOLUTIONS = {
  SD_480P: { width: 640, height: 480, name: '480p' },
  HD_720P: { width: 1280, height: 720, name: '720p' },
  FHD_1080P: { width: 1920, height: 1080, name: '1080p' },
  UHD_4K: { width: 3840, height: 2160, name: '4K' },
};

/**
 * Get video resolution name from dimensions
 * @param {number} width - Video width
 * @param {number} height - Video height
 * @returns {string} Resolution name
 */
export const getResolutionName = (width, height) => {
  const resolutions = Object.values(VIDEO_RESOLUTIONS);
  const match = resolutions.find(res => res.width === width && res.height === height);
  return match ? match.name : `${width}x${height}`;
};

export default {
  formatTime,
  formatLongTime,
  timeStringToMillis,
  validateTimeRange,
  calculateTrimmedDuration,
  estimateFileSize,
  formatFileSize,
  isValidVideoDuration,
  getSuggestedTrimPoints,
  calculateProgress,
  clamp,
  debounce,
  createVideoMetadata,
  createTrimSettings,
  VIDEO_FORMATS,
  VIDEO_RESOLUTIONS,
  getResolutionName,
};