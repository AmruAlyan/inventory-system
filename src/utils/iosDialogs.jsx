/**
 * Provides showAlert and showConfirm functions 
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// CSS styles for the dialogs
const createThemeCSS = () => {
  if (document.querySelector('#ios-dialog-theme')) return;
  
  const style = document.createElement('style');
  style.id = 'ios-dialog-theme';
  style.textContent = `
    :root {
      --dialog-bg-light: #ffffff;
      --dialog-text-light: #000000;
      --dialog-border-light: rgba(0, 0, 0, 0.1);
      --button-green-light: #28a745;
      
      --dialog-bg-dark: #2c2c2e;
      --dialog-text-dark: #ffffff;
      --dialog-border-dark: rgba(84, 84, 88, 0.6);
      --button-green-dark: #34d058;
    }
    
    .ios-dialog-overlay {
      --dialog-bg: var(--dialog-bg-light);
      --dialog-text: var(--dialog-text-light);
      --dialog-border: var(--dialog-border-light);
      --button-green: var(--button-green-light);
    }
    
    @media (prefers-color-scheme: dark) {
      .ios-dialog-overlay {
        --dialog-bg: var(--dialog-bg-dark);
        --dialog-text: var(--dialog-text-dark);
        --dialog-border: var(--dialog-border-dark);
        --button-green: var(--button-green-dark);
      }
    }
    
    [data-theme="dark"] .ios-dialog-overlay {
      --dialog-bg: var(--dialog-bg-dark);
      --dialog-text: var(--dialog-text-dark);
      --dialog-border: var(--dialog-border-dark);
      --button-green: var(--button-green-dark);
    }
    
    @keyframes iosOverlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes iosDialogSlideIn {
      from {
        opacity: 0;
        transform: scale(0.8) translateY(-50px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
};

// Initialize CSS when module loads
createThemeCSS();

// Global state for dialog management
let dialogContainer = null;
let dialogRoot = null;

// Dialog utilities
const getDialogContainer = () => {
  if (!dialogContainer) {
    dialogContainer = document.createElement('div');
    dialogContainer.id = 'ios-dialog-container';
    document.body.appendChild(dialogContainer);
    dialogRoot = createRoot(dialogContainer);
  }
  return { container: dialogContainer, root: dialogRoot };
};

const clearDialog = () => {
  if (dialogRoot && dialogContainer) {
    dialogRoot.unmount();
    if (dialogContainer.parentNode) {
      dialogContainer.parentNode.removeChild(dialogContainer);
    }
    dialogContainer = null;
    dialogRoot = null;
  }
};

// iOS-style Alert Dialog Component
const IOSAlertDialog = ({ title, message, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  return (
    <div 
      className="ios-dialog-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'iosOverlayFadeIn 0.25s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--dialog-bg)',
          borderRadius: '14px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
          minWidth: '270px',
          maxWidth: '420px',
          width: '90%',
          overflow: 'hidden',
          direction: 'rtl',
          animation: 'iosDialogSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 0 20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '17px',
            fontWeight: '600',
            color: 'var(--dialog-text)',
            lineHeight: '1.3',
            margin: 0,
            letterSpacing: '-0.02em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
          }}>
            {title}
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '8px 20px 20px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--dialog-text)',
            lineHeight: '1.4',
            opacity: '0.8',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
          }}>
            {message}
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          borderTop: '0.5px solid var(--dialog-border)',
          display: 'flex',
          height: '44px'
        }}>
          <button
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--button-green)',
              fontSize: '17px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.1s ease',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(40, 167, 69, 0.04)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.target.style.backgroundColor = 'rgba(40, 167, 69, 0.1)'}
            onMouseUp={(e) => e.target.style.backgroundColor = 'rgba(40, 167, 69, 0.04)'}
            autoFocus
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};

// iOS-style Confirm Dialog Component
const IOSConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);
  
  const buttonStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    fontSize: '17px',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  return (
    <div 
      className="ios-dialog-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'iosOverlayFadeIn 0.25s ease-out'
      }}
      onClick={onCancel}
    >
      <div 
        style={{
          background: 'var(--dialog-bg)',
          borderRadius: '14px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
          minWidth: '270px',
          maxWidth: '420px',
          width: '90%',
          overflow: 'hidden',
          direction: 'rtl',
          animation: 'iosDialogSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 0 20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '17px',
            fontWeight: '600',
            color: 'var(--dialog-text)',
            lineHeight: '1.3',
            margin: 0,
            letterSpacing: '-0.02em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
          }}>
            {title}
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '8px 20px 20px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--dialog-text)',
            lineHeight: '1.4',
            opacity: '0.8',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
          }}>
            {message}
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          borderTop: '0.5px solid var(--dialog-border)',
          display: 'flex',
          height: '44px'
        }}>
          <button
            style={{
              ...buttonStyle,
              color: 'var(--dialog-text)',
              fontWeight: '400'
            }}
            onClick={onCancel}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 122, 255, 0.04)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.target.style.backgroundColor = 'rgba(0, 122, 255, 0.1)'}
            onMouseUp={(e) => e.target.style.backgroundColor = 'rgba(0, 122, 255, 0.04)'}
            autoFocus
          >
            ביטול
          </button>
          <button
            style={{
              ...buttonStyle,
              color: 'var(--button-green)',
              fontWeight: '600',
              borderLeft: '0.5px solid var(--dialog-border)'
            }}
            onClick={onConfirm}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(40, 167, 69, 0.04)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.target.style.backgroundColor = 'rgba(40, 167, 69, 0.1)'}
            onMouseUp={(e) => e.target.style.backgroundColor = 'rgba(40, 167, 69, 0.04)'}
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};

// Async Alert function
export const showAlert = (message, title = 'הודעה') => {
  return new Promise((resolve) => {
    const { root } = getDialogContainer();
    
    const handleClose = () => {
      clearDialog();
      resolve();
    };
    
    root.render(
      <IOSAlertDialog
        title={title}
        message={message}
        onClose={handleClose}
      />
    );
  });
};

// Async Confirm function
export const showConfirm = (message, title = 'אישור פעולה') => {
  return new Promise((resolve) => {
    const { root } = getDialogContainer();
    
    const handleConfirm = () => {
      clearDialog();
      resolve(true);
    };
    
    const handleCancel = () => {
      clearDialog();
      resolve(false);
    };
    
    root.render(
      <IOSConfirmDialog
        title={title}
        message={message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });
};