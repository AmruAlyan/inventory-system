// Utility functions for date and time formatting

/**
 * Formats a timestamp for display with both date and time
 * @param {any} timestamp - Firebase Timestamp, Date object, or timestamp value
 * @param {boolean} includeTime - Whether to include time (default: true)
 * @returns {string} Formatted date/time string in Hebrew locale
 */
export const formatTimestamp = (timestamp, includeTime = true) => {
  if (!timestamp) return '—';
  
  let date;
  
  // Handle Firebase Timestamp with seconds property
  if (typeof timestamp === 'object' && timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // Handle Firebase Timestamp with toDate method
  else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle regular Date object or timestamp
  else {
    date = new Date(timestamp);
  }
  
  // Check if date is valid
  if (isNaN(date)) return '—';
  
  const dateString = date.toLocaleDateString('he-IL');
  
  if (!includeTime) {
    return dateString;
  }
  
  const timeString = date.toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${dateString} בשעה ${timeString}`;
};

/**
 * Formats a timestamp for display with only date (no time)
 * @param {any} timestamp - Firebase Timestamp, Date object, or timestamp value
 * @returns {string} Formatted date string in Hebrew locale
 */
export const formatDate = (timestamp) => {
  return formatTimestamp(timestamp, false);
};

/**
 * Creates a formatted success message for receipt upload
 * @returns {string} Success message with current date and time
 */
export const getReceiptUploadSuccessMessage = () => {
  const now = new Date();
  const dateTimeString = formatTimestamp(now);
  return `הקבלה הועלתה בהצלחה ב-${dateTimeString}`;
};
