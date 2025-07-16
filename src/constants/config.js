/**
 * Application configuration constants
 * Centralized configuration for the inventory management system
 */

// Environment configuration
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// UI Configuration
export const UI_CONFIG = {
  // Low stock threshold for inventory alerts
  LOW_STOCK_THRESHOLD: 10,
  
  // Pagination and display limits
  DEFAULT_PAGE_SIZE: 20,
  MAX_RESULTS_PER_PAGE: 100,
  
  // Debounce delays (in milliseconds)
  SEARCH_DEBOUNCE_DELAY: 300,
  RESIZE_DEBOUNCE_DELAY: 250,
  UPDATE_DEBOUNCE_DELAY: 2000,
  
  // Auto-save intervals
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  
  // Toast notification settings
  TOAST_AUTO_CLOSE_DELAY: 3000,
};

// Firebase collection names
export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  PURCHASES: 'purchases',
  BUDGETS: 'budgets',
  USERS: 'users',
  SHOPPING_LIST: 'sharedShoppingList',
  CONSUMPTIONS: 'consumptions',
};

// Date formatting configuration
export const DATE_CONFIG = {
  LOCALE: 'he-IL',
  TIMEZONE: 'Asia/Jerusalem',
  FORMAT_OPTIONS: {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
  },
};

// File upload configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  IMAGE_QUALITY: 0.8,
  STORAGE_PATHS: {
    PRODUCTS: 'products',
    RECEIPTS: 'receipts',
    TEMP: 'temp',
  },
};

// Report configuration
export const REPORT_CONFIG = {
  DEFAULT_DATE_RANGE_DAYS: 30,
  PDF_PAGE_SIZE: 'A4',
  CHART_HEIGHT: 300,
};
