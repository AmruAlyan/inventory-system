import { toast } from 'react-toastify';
import React from 'react';
import '../styles/notifications.css';

/**
 * Custom notification system that replaces browser's default alert and confirm dialogs
 * with styled toast notifications that match the application's design aesthetic.
 */

// Basic alert notification - replaces window.alert()
export const showAlert = (message, options = {}) => {
  return toast.info(
    <div className="custom-toast-alert">
      <div className="toast-message">{message}</div>
    </div>,
    {
      className: 'custom-toast-container alert',
      autoClose: options.autoClose || 5000,
      closeButton: true,
      ...options
    }
  );
};

// Error notification
export const showError = (message, options = {}) => {
  return toast.error(
    <div className="custom-toast-alert">
      <div className="toast-message">{message}</div>
    </div>,
    {
      className: 'custom-toast-container error',
      autoClose: options.autoClose || 5000,
      closeButton: true,
      ...options
    }
  );
};

// Success notification
export const showSuccess = (message, options = {}) => {
  return toast.success(
    <div className="custom-toast-alert">
      <div className="toast-message">{message}</div>
    </div>,
    {
      className: 'custom-toast-container success',
      autoClose: options.autoClose || 3000,
      closeButton: true,
      ...options
    }
  );
};

// Warning notification
export const showWarning = (message, options = {}) => {
  return toast.warning(
    <div className="custom-toast-alert">
      <div className="toast-message">{message}</div>
    </div>,
    {
      className: 'custom-toast-container warning',
      autoClose: options.autoClose || 5000,
      closeButton: true,
      ...options
    }
  );
};

// Confirmation dialog - replaces window.confirm()
export const showConfirm = (message, onConfirm, onCancel, options = {}) => {
  return toast(
    ({ closeToast }) => (
      <div className="custom-toast-confirm">
        <div className="toast-message">{message}</div>
        <div className="toast-actions">
          <button 
            className="toast-button confirm"
            onClick={() => {
              closeToast();
              if (onConfirm) onConfirm();
            }}
          >
            {options.confirmText || 'אישור'}
          </button>
          <button 
            className="toast-button cancel"
            onClick={() => {
              closeToast();
              if (onCancel) onCancel();
            }}
          >
            {options.cancelText || 'ביטול'}
          </button>
        </div>
      </div>
    ),
    {
      className: 'custom-toast-container confirm',
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      ...options
    }
  );
};

// A dialog with an input field
export const showPrompt = (message, defaultValue = '', onConfirm, onCancel, options = {}) => {
  let inputValue = defaultValue;
  
  return toast(
    ({ closeToast }) => (
      <div className="custom-toast-prompt">
        <div className="toast-message">{message}</div>
        <input 
          className="toast-input"
          type="text"
          defaultValue={defaultValue}
          onChange={(e) => { inputValue = e.target.value; }}
          autoFocus
        />
        <div className="toast-actions">
          <button 
            className="toast-button confirm"
            onClick={() => {
              closeToast();
              if (onConfirm) onConfirm(inputValue);
            }}
          >
            {options.confirmText || 'אישור'}
          </button>
          <button 
            className="toast-button cancel"
            onClick={() => {
              closeToast();
              if (onCancel) onCancel();
            }}
          >
            {options.cancelText || 'ביטול'}
          </button>
        </div>
      </div>
    ),
    {
      className: 'custom-toast-container prompt',
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      ...options
    }
  );
};
