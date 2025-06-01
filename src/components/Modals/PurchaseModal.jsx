import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import '../../styles/ForModals/productModal.css';
import '../../styles/ForModals/PurchaseModal.css';

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
              <p><strong>תאריך רכישה:</strong> {new Date(purchase.date).toLocaleDateString('he-IL')}</p>
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

            {/* <div className="receipt-section">
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
                  <div className="upload-area">
                    <input
                      type="file"
                      id="receipt-upload"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="receipt-upload" className="btn btn-sm btn-primary">
                      העלה קבלה
                    </label>
                  </div>
                )}
              </div>
              {purchase.receiptName && (
                <div className="receipt-info mt-2">
                  <small>שם קובץ: {purchase.receiptName}</small>
                  <br />
                  <small>הועלה בתאריך: {new Date(purchase.uploadedAt).toLocaleDateString('he-IL')}</small>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseModal;