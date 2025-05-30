// Modal means overlay components that popups and closes if clicked outside its borders

// components/Modal.jsx
import React, { useEffect, useRef } from 'react';
import '../../styles/ForModals/overlay.css'; // Make sure this contains the .overlay class

export default function Modal({ children, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    // Prevent background scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleOutsideClick = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      // Restore original overflow when modal closes
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" ref={overlayRef}>
      {children}
    </div>
  );
}

