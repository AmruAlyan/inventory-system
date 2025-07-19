import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../../utils/timestampUtils';
import Modal from './Modal';
import '../../styles/ForModals/deletePurchaseModal.css';

const DeletePurchaseModal = ({ 
  isOpen, 
  onClose, 
  purchase, 
  onConfirmDelete 
}) => {
  if (!isOpen || !purchase) return null;

  return (
    <Modal onClose={onClose}>
      <div className="dpm-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="dpm-modal-header">
          <h3>
            <FontAwesomeIcon icon={faExclamationTriangle} className="dpm-header-icon" />
            מחיקת רכישה
          </h3>
          <button className="dpm-close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="dpm-modal-content">
          <div className="dpm-warning-section">
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              className="dpm-warning-icon"
            />
            <h4 className="dpm-warning-title">
              האם אתה בטוח שברצונך למחוק את הרכישה?
            </h4>
          </div>

          {/* Purchase Details */}
          <div className="dpm-purchase-details">
            <div className="dpm-detail-row">
              <strong>תאריך:</strong>
              <span>{formatDate(purchase.date)}</span>
            </div>
            <div className="dpm-detail-row">
              <strong>מספר פריטים:</strong>
              <span>{purchase.items?.length || 0}</span>
            </div>
            <div className="dpm-detail-row">
              <strong>סכום:</strong>
              <span>{purchase.totalAmount?.toFixed(2) || '0.00'} ₪</span>
            </div>
          </div>

          {/* Warning Text */}
          <div className="dpm-warning-text">
            <p>
              <strong>שימו לב:</strong> פעולה זו תחזיר את הסכום לתקציב ותעדכן את כמויות המוצרים במלאי
            </p>
            <p className="dpm-irreversible-text">
              פעולה זו אינה ניתנת לביטול
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="dpm-modal-footer">
          <button 
            className="dpm-cancel-button" 
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
            ביטול
          </button>
          
          <button 
            className="dpm-delete-button"
            onClick={() => onConfirmDelete(purchase)}
          >
            <FontAwesomeIcon icon={faTrash} />
            מחק רכישה
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePurchaseModal;
