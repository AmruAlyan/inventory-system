import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/systemDialogs.css';

/**
 * Override for native browser dialogs
 * This module replaces the standard browser confirm/alert dialogs with
 * styled dialogs that match the application's design system
 */

let container = null;
let root = null;

// Create container for dialogs if not exists
const ensureContainer = () => {
  if (!container) {
    container = document.createElement('div');
    container.id = 'system-dialog-container';
    document.body.appendChild(container);
    root = createRoot(container);
  }
  return { container, root };
};

// Helper to render a React component into the container
const renderDialog = (component) => {
  const { root } = ensureContainer();
  return new Promise(resolve => {
    root.render(component(resolve));
    // Store the resolver to call it when unmounting
    container.resolver = resolve;
  }).finally(() => {
    // Clean up by unmounting the component
    if (root) {
      root.render(null);
    }
  });
};

// Info icon component - simple div with background color
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

// Confirm icon component - simple div with background color
function ConfirmIcon() {
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

// Close icon component - simple text X
function CloseIcon() {
  return (
    <span style={{ 
      fontWeight: 'bold', 
      fontSize: '16px',
      lineHeight: '16px'
    }}>×</span>
  );
}

// Dialog close button component
function CloseButton({ onClick }) {
  return (
    <button 
      onClick={onClick} 
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        color: 'var(--secondary-text, #777)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-text, #333)'}
      onMouseOut={(e) => e.currentTarget.style.color = 'var(--secondary-text, #777)'}
    >
      <CloseIcon />
    </button>
  );
}

// Alert dialog component
function AlertDialog({ message, onClose, title = 'הודעת מערכת' }) {
  return (
    <div className="system-dialog-overlay" onClick={() => onClose(true)}>
      <div className="system-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="system-dialog-header">
          <div className="system-dialog-title">{title}</div>
          <CloseButton onClick={() => onClose(true)} />
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
            onClick={() => onClose(true)}
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
function ConfirmDialog({ message, onClose, title = 'אישור פעולה' }) {
  return (
    <div className="system-dialog-overlay">
      <div className="system-dialog">
        <div className="system-dialog-header">
          <div className="system-dialog-title">{title}</div>
          <CloseButton onClick={() => onClose(false)} />
        </div>
        <div className="system-dialog-content">
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className="system-dialog-icon">
              <ConfirmIcon />
            </div>
            <div>{message}</div>
          </div>
        </div>
        <div className="system-dialog-footer">
          <button
            className="system-dialog-button confirm"
            onClick={() => onClose(true)}
          >
            אישור
          </button>
          <button
            className="system-dialog-button cancel"
            onClick={() => onClose(false)}
            autoFocus
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// Override for window.alert
function customAlert(message, title) {
  return renderDialog((resolve) => (
    <AlertDialog
      message={message}
      title={title}
      onClose={() => {
        resolve();
      }}
    />
  ));
}

// Override for window.confirm
function customConfirm(message, title) {
  return renderDialog((resolve) => (
    <ConfirmDialog
      message={message}
      title={title}
      onClose={(result) => {
        resolve(result);
      }}
    />
  ));
}

// Install the overrides
export const installDialogOverrides = () => {
  // Store original methods
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;

  // Override window.alert
  window.alert = function(message) {
    return customAlert(message);
  };

  // Override window.confirm
  window.confirm = function(message) {
    return customConfirm(message);
  };
  
  // Return function to restore original behavior if needed
  return () => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  };
};

export default {
  installDialogOverrides,
  alert: customAlert,
  confirm: customConfirm
};
