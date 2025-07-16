/**
 * Date formatting utilities
 * Provides consistent date formatting across the application
 */

import { DATE_CONFIG } from '../constants/config';

/**
 * Format a date using the application's locale settings
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options (optional)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = DATE_CONFIG.FORMAT_OPTIONS) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(DATE_CONFIG.LOCALE, {
      ...options,
      timeZone: DATE_CONFIG.TIMEZONE
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date with time
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    ...DATE_CONFIG.FORMAT_OPTIONS,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get date string for HTML input elements (YYYY-MM-DD format)
 * @param {Date|string|number} date - Date to convert
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getInputDateString = (date = new Date()) => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error converting date to input string:', error);
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Get date range for reports (X days ago to today)
 * @param {number} days - Number of days to go back
 * @returns {Object} Object with startDate and endDate strings
 */
export const getDateRange = (days = 30) => {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return {
    startDate: getInputDateString(startDate),
    endDate: getInputDateString(endDate)
  };
};

/**
 * Check if a date is within a specified range
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Range start date
 * @param {Date|string} endDate - Range end date
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, startDate, endDate) => {
  try {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return checkDate >= start && checkDate <= end;
  } catch (error) {
    console.error('Error checking date range:', error);
    return false;
  }
};
