import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/systemDialogs.css';

/**
 * A simpler version of the system dialog overrides
 * This module replaces the standard browser confirm/alert dialogs with
 * styled dialogs that match the application's design system
 */

// Global variables to track our container and root
let dialogContainer = null;
let dialogRoot = null;

// Info icon component - simple text
function InfoIcon() {
  return (
    <div style={{
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: '#3498db',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px'
    }}>i</div>
  );
}

// Question icon component - simple text
function QuestionIcon() {
  return (
    <div style={{
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: '#f39c12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px'
    }}>?</div>
  );
}

// Create or get dialog container
function getDialogContainer() {
  if (!dialogContainer) {
    dialogContainer = document.createElement('div');
    dialogContainer.id = 'system-dialog-container';
    document.body.appendChild(dialogContainer);
    dialogRoot = createRoot(dialogContainer);
  }
  return { container: dialogContainer, root: dialogRoot };
}

// Clear dialog container
function clearDialogContainer() {
  if (dialogRoot) {
    dialogRoot.render(null);
  }
}

// Alert dialog component
function AlertDialog({ message, onConfirm, title = 'הודעת מערכת' }) {
  return (
    <div className="system-dialog-overlay">
      <div className="system-dialog">
        <div className="system-dialog-header">
          <div className="system-dialog-title">{title}</div>
          <button 
            className="dialog-close-btn"
            onClick={onConfirm}
          >
            ×
          </button>
        </div>
        <div className="system-dialog-content">
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className="system-dialog-icon">
              <InfoIcon />
            </div>
            <div>{message}</div>
          </div>
        </div>
        <div className="system-dialog-footer">
          <button
            className="system-dialog-button confirm"
            onClick={onConfirm}
            autoFocus
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm dialog component
function ConfirmDialog({ message, onConfirm, onCancel, title = 'אישור פעולה' }) {
  return (
    <div className="system-dialog-overlay">
      <div className="system-dialog">
        <div className="system-dialog-header">
          <div className="system-dialog-title">{title}</div>
          <button 
            className="dialog-close-btn"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <div className="system-dialog-content">
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className="system-dialog-icon">
              <QuestionIcon />
            </div>
            <div>{message}</div>
          </div>
        </div>
        <div className="system-dialog-footer">
          <button
            className="system-dialog-button confirm"
            onClick={onConfirm}
          >
            אישור
          </button>
          <button
            className="system-dialog-button cancel"
            onClick={onCancel}
            autoFocus
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// Show an alert dialog
function showAlert(message, title) {
  return new Promise(resolve => {
    const { root } = getDialogContainer();
    
    const handleConfirm = () => {
      clearDialogContainer();
      resolve(true);
    };
    
    root.render(
      <AlertDialog 
        message={message}
        title={title}
        onConfirm={handleConfirm}
      />
    );
  });
}

// Show a confirm dialog
function showConfirm(message, title) {
  return new Promise(resolve => {
    const { root } = getDialogContainer();
    
    const handleConfirm = () => {
      clearDialogContainer();
      resolve(true);
    };
    
    const handleCancel = () => {
      clearDialogContainer();
      resolve(false);
    };
    
    root.render(
      <ConfirmDialog 
        message={message}
        title={title}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });
}

// Install dialog overrides
export function installDialogOverrides() {
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  
  // Override alert
  window.alert = function(message) {
    return showAlert(message);
  };
  
  // Override confirm
  window.confirm = function(message) {
    return showConfirm(message);
  };
  
  // Return function to restore original behavior
  return function cleanup() {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  };
}

export default {
  installDialogOverrides,
  alert: showAlert,
  confirm: showConfirm
};
