/**
 * Centralized error handling and logging utility
 * Provides consistent error handling patterns across the application
 */

/**
 * Log error in development mode only
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
export const logError = (message, error) => {
  if (import.meta.env.DEV) {
    console.error(message, error);
  }
};

/**
 * Log warning in development mode only
 * @param {string} message - Warning message
 * @param {any} data - Additional data
 */
export const logWarning = (message, data) => {
  if (import.meta.env.DEV) {
    console.warn(message, data);
  }
};

/**
 * Handle async operations with error logging
 * @param {Function} asyncFn - Async function to execute
 * @param {string} errorMessage - Custom error message
 * @param {Function} onError - Optional error callback
 */
export const handleAsyncError = async (asyncFn, errorMessage, onError) => {
  try {
    return await asyncFn();
  } catch (error) {
    logError(errorMessage, error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Safe error message extraction for user display
 * @param {Error} error - Error object
 * @param {string} fallback - Fallback message
 */
export const getErrorMessage = (error, fallback = 'אירעה שגיאה לא צפויה') => {
  return error?.message || fallback;
};
