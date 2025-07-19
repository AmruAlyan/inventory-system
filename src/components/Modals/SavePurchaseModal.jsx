import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faReceipt, 
  faTimes, 
  faShoppingBag, 
  faCloudUploadAlt, 
  faCheckCircle, 
  faSave, 
  faCartPlus 
} from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import '../../styles/ForModals/savePurchaseModal.css';

const SavePurchaseModal = ({
  isOpen,
  onClose,
  currentPurchase,
  receiptFile,
  dragActive,
  uploadingReceipt,
  onReceiptFileSelect,
  onRemoveReceiptFile,
  onDragIn,
  onDragOut,
  onDrag,
  onDrop,
  onConfirmSave
}) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="save-purchase-modal-content">
        {/* Modal Header */}
        <div className="spm-modal-header">
          <div className="spm-header-title-section">
            <h2 className="spm-modal-title">
                <FontAwesomeIcon icon={faReceipt} /> שמירת רכישה
            </h2>
          </div>
          <button className="spm-close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="spm-modal-body">
          {/* Purchase Summary */}
          <div className="spm-purchase-summary">
            <div className="spm-summary-header">
              <FontAwesomeIcon icon={faShoppingBag} className="spm-summary-icon" />
              <h3 className="spm-summary-title">סיכום הרכישה</h3>
            </div>
            <div className="spm-purchase-summary-grid">
              <div className="spm-summary-card spm-purchase-summary-card">
                <div className="spm-summary-value">
                  {currentPurchase.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} ₪
                </div>
                <div className="spm-summary-label">
                  סה"כ עלות
                </div>
              </div>
              <div className="spm-summary-card spm-purchase-summary-card">
                <div className="spm-summary-value spm-items-count">
                  {currentPurchase.items.length}
                </div>
                <div className="spm-summary-label">
                  פריטים
                </div>
              </div>
            </div>
          </div>
          
          {/* Receipt Upload Section */}
          <div className="spm-receipt-upload-section">
            <div className="spm-upload-header">
              <FontAwesomeIcon icon={faCloudUploadAlt} className="spm-upload-icon" />
              <label className="spm-upload-label">
                העלאת קבלה
              </label>
              <span className="spm-required-badge">
                חובה
              </span>
            </div>
            
            <p className="spm-upload-description">
              צרף תמונה או PDF של הקבלה לתיעוד הרכישה (שדה חובה)
            </p>
            
            <div className="spm-file-input-wrapper">
              <input
                id="receipt-file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={onReceiptFileSelect}
                className="spm-hidden-file-input"
              />
              
              {!receiptFile ? (
                <div
                  className={`spm-file-upload-area ${dragActive ? 'spm-drag-active' : ''}`}
                  onClick={() => document.getElementById('receipt-file-input').click()}
                  onDragEnter={onDragIn}
                  onDragLeave={onDragOut}
                  onDragOver={onDrag}
                  onDrop={onDrop}
                >
                  <FontAwesomeIcon 
                    icon={faCloudUploadAlt} 
                    className={`spm-upload-area-icon ${dragActive ? 'spm-drag-active' : ''}`}
                  />
                  <div>
                    <div className={`spm-upload-area-title ${dragActive ? 'spm-drag-active' : ''}`}>
                      {dragActive ? 'שחרר לכן להעלאה' : 'לחץ לבחירת קובץ קבלה'}
                    </div>
                    <div className={`spm-upload-area-subtitle ${dragActive ? 'spm-drag-active' : ''}`}>
                      {dragActive ? 'קובץ מוכן להעלאה' : 'או גרור ושחרר כאן'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="spm-file-selected">
                  <div className="spm-file-check-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </div>
                  <div className="spm-file-info">
                    <div className="spm-file-name">
                      {receiptFile.name}
                    </div>
                    <div className="spm-file-details">
                      <span>{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{receiptFile.type.includes('image') ? '📷 תמונה' : '📄 PDF'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveReceiptFile}
                    className="spm-remove-file-button"
                    title="הסר קובץ"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="spm-upload-restrictions">
              <span>📏 מקסימום 10MB</span>
              <span>•</span>
              <span>📷 JPG, PNG </span>
              <span>•</span>
              <span>📄 PDF</span>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="spm-modal-footer">
          <button
            className={`spm-save-purchase-btn ${(uploadingReceipt || !receiptFile) ? 'spm-disabled' : ''} ${uploadingReceipt ? 'spm-uploading-state' : ''}`}
            onClick={onConfirmSave}
            disabled={uploadingReceipt || !receiptFile}
            title={!receiptFile ? 'נדרשת העלאת קבלה לפני שמירת הרכישה' : ''}
          >
            {uploadingReceipt ? (
              <>
                <FontAwesomeIcon icon={faCartPlus} spin />
                שומר...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                שמור רכישה
              </>
            )}
          </button>
          <button
            className="spm-cancel-button"
            onClick={onClose}
            disabled={uploadingReceipt}
          >
            ביטול
          </button>
          
        </div>
      </div>
    </Modal>
  );
};

export default SavePurchaseModal;
