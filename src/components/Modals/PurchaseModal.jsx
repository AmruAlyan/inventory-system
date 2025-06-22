import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShoppingCart, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import '../../styles/ForModals/productModal.css';
import '../../styles/ForModals/PurchaseModal.css';

// Drag and Drop Upload Component
const DragDropUpload = ({ onFileDrop }) => {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef(null);

  const handleDrag = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Create synthetic event to match input onChange signature
      const syntheticEvent = {
        target: {
          files: [file]
        }
      };
      onFileDrop(syntheticEvent);
      e.dataTransfer.clearData();
    }
  }, [onFileDrop]);

  const handleClick = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  React.useEffect(() => {
    window.addEventListener('dragover', handleDrag);
    window.addEventListener('drop', handleDrag);
    
    return () => {
      window.removeEventListener('dragover', handleDrag);
      window.removeEventListener('drop', handleDrag);
    };
  }, [handleDrag]);

  return (
    <div
      className={`drag-drop-area ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        border: '2px dashed #007bff',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: dragActive ? '#e3f2fd' : '#f8f9fa',
        transition: 'all 0.3s ease',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={onFileDrop}
        style={{ display: 'none' }}
      />
      <FontAwesomeIcon 
        icon={faCloudUploadAlt} 
        style={{ 
          fontSize: '2rem', 
          color: dragActive ? '#007bff' : '#6c757d',
          transition: 'color 0.3s ease'
        }} 
      />
      <span style={{ 
        color: dragActive ? '#007bff' : '#6c757d',
        fontWeight: '500',
        transition: 'color 0.3s ease'
      }}>
        גרור ושחרר קובץ כאן, או לחץ להעלאה
      </span>
      <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
        תומך בתמונות (JPG, PNG, GIF) ו-PDF עד 10MB
      </small>
    </div>
  );
};

const PurchaseModal = ({ purchase, onClose, categories, onReceiptUpload }) => {
  if (!purchase) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onReceiptUpload(file, purchase.id);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="card purchase-modal">
        <div className="sticky-header">
          <h2>
            <FontAwesomeIcon icon={faShoppingCart} className="ml-2" />
            פרטי רכישה
          </h2>
          <button className="close-button ml-2" onClick={onClose}>
            <h3>
                <FontAwesomeIcon icon={faTimes} />
            </h3>
          </button>
        </div>

        <div className="modal-body scrollable-content">
          <div className="purchase-details">
            {/* ...existing header content... */}
            <div className="purchase-header">
              <p><strong>תאריך רכישה:</strong> {(() => {
                if (!purchase.date) return '—';
                // Firebase Timestamp: {seconds, nanoseconds}
                if (typeof purchase.date === 'object' && purchase.date.seconds) {
                  return new Date(purchase.date.seconds * 1000).toLocaleDateString('he-IL');
                }
                // ISO string or number
                const d = new Date(purchase.date);
                return isNaN(d) ? '—' : d.toLocaleDateString('he-IL');
              })()}</p>
              <p><strong>סה"כ רכישה:</strong> {purchase.totalAmount.toFixed(2)} ₪</p>
              <p><strong>תקציב לפני:</strong> {purchase.budgetBefore.toFixed(2)} ₪</p>
              <p><strong>תקציב אחרי:</strong> {purchase.budgetAfter.toFixed(2)} ₪</p>
            </div>

            <div className="table-container">
              {/* ...existing table content... */}
                <table className="inventory-table mt-3">
                    <thead>
                        <tr>
                            <th>שם מוצר</th>
                            <th>קטגוריה</th>
                            <th>כמות</th>
                            <th>מחיר</th>
                            <th>סה"כ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchase.items.map(item => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.categoryName || categories[item.category] || 'לא מוגדר'}</td>
                            <td>{item.quantity}</td>
                            <td>{item.price.toFixed(2)} ₪</td>
                            <td>{(item.price * item.quantity).toFixed(2)} ₪</td>
                        </tr>
                        ))}
                    </tbody>
                </table>            
              </div>

            <div className="receipt-section">
              <div className="d-flex justify-content-between align-items-center">
                <h4>קבלה</h4>
                {purchase.receiptURL ? (
                  <div className="d-flex gap-2">
                    <a 
                      href={purchase.receiptURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-info"
                    >
                      צפה בקבלה
                    </a>
                  </div>
                ) : (
                  <DragDropUpload onFileDrop={handleFileChange} />
                )}
              </div>
              {purchase.receiptName && (
                <div className="receipt-info mt-2">
                  <small>שם קובץ: {purchase.receiptName}</small>
                  <br />
                  <small>הועלה בתאריך: {(() => {
                    if (!purchase.uploadedAt) return '—';
                    if (typeof purchase.uploadedAt === 'object' && purchase.uploadedAt.seconds) {
                      return new Date(purchase.uploadedAt.seconds * 1000).toLocaleDateString('he-IL');
                    }
                    const d = new Date(purchase.uploadedAt);
                    return isNaN(d) ? '—' : d.toLocaleDateString('he-IL');
                  })()}</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseModal;