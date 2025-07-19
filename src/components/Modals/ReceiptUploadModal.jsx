import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCheckCircle, faTimes, faSave, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebase';
import { formatTimestamp, getReceiptUploadSuccessMessage } from '../../utils/timestampUtils';
import Modal from './Modal';
import '../../styles/ForModals/receiptUploadModal.css';

const ReceiptUploadModal = ({ 
  isOpen, 
  onClose, 
  purchase,
  onReceiptUpdated 
}) => {
  const [receiptFile, setReceiptFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReceiptFile(null);
      setDragActive(false);
      setUploading(false);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Validate file and set it
  const validateAndSetFile = (file) => {
    // Validate file type (images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('ניתן להעלות רק תמונות (JPG, PNG, GIF) או קבצי PDF');
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('גודל הקובץ חייב להיות קטן מ-10MB');
      return;
    }
    
    setReceiptFile(file);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setReceiptFile(null);
    // Reset file input
    const fileInput = document.getElementById('receipt-modal-file-input');
    if (fileInput) fileInput.value = '';
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
      e.dataTransfer.clearData();
    }
  };

  // Upload new receipt
  const handleUploadReceipt = async () => {
    if (!receiptFile || !purchase) return;

    setUploading(true);
    
    try {
      // Delete old receipt if exists
      if (purchase.receiptURL) {
        try {
          const oldReceiptRef = ref(storage, `receipts/${purchase.id}/${purchase.receiptName}`);
          await deleteObject(oldReceiptRef);
        } catch (error) {
          console.warn('Could not delete old receipt:', error);
        }
      }

      // Upload new receipt
      const storageRef = ref(storage, `receipts/${purchase.id}/${receiptFile.name}`);
      await uploadBytes(storageRef, receiptFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update purchase document with current timestamp
      const currentTimestamp = Timestamp.fromDate(new Date());
      await updateDoc(doc(db, 'purchases/history/items', purchase.id), {
        receiptURL: downloadURL,
        receiptName: receiptFile.name,
        uploadedAt: currentTimestamp
      });

      const now = new Date();
      const dateTimeString = `${now.toLocaleDateString('he-IL')} בשעה ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
      toast.success(`הקבלה הועלתה בהצלחה ב-${dateTimeString}`);
      
      // Notify parent component
      if (onReceiptUpdated) {
        onReceiptUpdated(purchase.id, {
          receiptURL: downloadURL,
          receiptName: receiptFile.name,
          uploadedAt: currentTimestamp
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('שגיאה בהעלאת הקבלה');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !purchase) return null;

  return (
    <Modal onClose={onClose}>
      <div className="rum-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rum-modal-header">
          <h3>
            <FontAwesomeIcon icon={faFileAlt} className="rum-header-icon" />
            עדכון קבלה
          </h3>
          <button className="rum-close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="rum-modal-content">
          {/* Purchase Info Cards */}
          <div className="rum-purchase-info">
            <div className="rum-purchase-info-card">
              <strong>תאריך רכישה</strong>
              <span>{purchase.date && purchase.date.toDate ? purchase.date.toDate().toLocaleDateString('he-IL') : new Date(purchase.date).toLocaleDateString('he-IL')}</span>
            </div>
            <div className="rum-purchase-info-card">
              <strong>סכום רכישה</strong>
              <span>{purchase.totalAmount?.toFixed(2) || '0.00'} ₪</span>
            </div>
            <div className="rum-purchase-info-card">
              <strong>מספר פריטים</strong>
              <span>{purchase.items?.length || 0}</span>
            </div>
          </div>

          {/* Current Receipt */}
          {purchase.receiptURL && (
            <div className="rum-current-receipt">
              <h4>
                <FontAwesomeIcon icon={faFileAlt} />
                קבלה נוכחית
              </h4>
              <div className="rum-receipt-info">
                <div className="rum-receipt-details">
                  <FontAwesomeIcon icon={faFileAlt} className="rum-receipt-icon" />
                  <div>
                    <div className="rum-receipt-name">{purchase.receiptName}</div>
                    <small style={{ color: '#6c757d' }}>
                      הועלה: {formatTimestamp(purchase.uploadedAt)}
                    </small>
                  </div>
                </div>
                <a
                  href={purchase.receiptURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rum-view-receipt-link"
                >
                  צפייה
                </a>
              </div>
            </div>
          )}

          {/* Upload New Receipt */}
          <div className="rum-upload-section">
            <h4>
              <FontAwesomeIcon icon={faCloudUploadAlt} />
              {purchase.receiptURL ? 'החלפת קבלה' : 'העלאת קבלה'}
            </h4>
            
            <div className="rum-file-input-wrapper">
              <input
                id="receipt-modal-file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="rum-hidden-file-input"
              />
              
              {!receiptFile ? (
                <div
                  className={`rum-file-upload-area ${dragActive ? 'rum-drag-active' : ''}`}
                  onClick={() => document.getElementById('receipt-modal-file-input').click()}
                  onDragEnter={handleDragIn}
                  onDragLeave={handleDragOut}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FontAwesomeIcon 
                    icon={faCloudUploadAlt} 
                    className={`rum-upload-icon ${dragActive ? 'rum-drag-active' : ''}`}
                  />
                  <div>
                    <div className={`rum-upload-title ${dragActive ? 'rum-drag-active' : ''}`}>
                      {dragActive ? 'שחרר כאן להעלאה' : 'לחץ לבחירת קבלה'}
                    </div>
                    <div className={`rum-upload-subtitle ${dragActive ? 'rum-drag-active' : ''}`}>
                      {dragActive ? 'קובץ מוכן להעלאה' : 'או גרור ושחרר כאן'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rum-file-selected">
                  <div className="rum-file-check-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </div>
                  <div className="rum-file-info">
                    <div className="rum-file-name">
                      {receiptFile.name}
                    </div>
                    <div className="rum-file-details">
                      <span>{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{receiptFile.type.includes('image') ? '📷 תמונה' : '📄 PDF'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="rum-remove-file-button"
                    title="הסר קובץ"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="rum-upload-restrictions">
              <span>📏 מקסימום 10MB</span>
              <span>•</span>
              <span>📷 JPG, PNG, GIF</span>
              <span>•</span>
              <span>📄 PDF</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="rum-modal-footer">
          <button 
            className="rum-cancel-button" 
            onClick={onClose}
            disabled={uploading}
          >
            <FontAwesomeIcon icon={faTimes} />
            ביטול
          </button>
          
          {receiptFile && (
            <button 
              className={`rum-upload-button ${uploading ? 'rum-loading' : ''}`}
              onClick={handleUploadReceipt}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="rum-button-spinner"></div>
                  מעלה...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  {purchase.receiptURL ? 'החלף קבלה' : 'העלה קבלה'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptUploadModal;
