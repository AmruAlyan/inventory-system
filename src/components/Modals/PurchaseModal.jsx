import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faReceipt, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import { formatTimestamp } from '../../utils/timestampUtils';
import '../../styles/ForModals/productModal.css';
import '../../styles/ForModals/PurchaseModal.css';

const PurchaseModal = ({ purchase, onClose, categories }) => {
  const [sortField, setSortField] = React.useState('name');
  const [sortDirection, setSortDirection] = React.useState('asc');

  if (!purchase) return null;

  // Sorting functionality
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return faSort;
    return sortDirection === 'asc' ? faSortUp : faSortDown;
  };

  const sortedItems = React.useMemo(() => {
    if (!purchase.items || !Array.isArray(purchase.items)) return [];
    
    return [...purchase.items].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'category':
          aValue = (a.categoryName || categories[a.category] || 'לא מוגדר').toLowerCase();
          bValue = (b.categoryName || categories[b.category] || 'לא מוגדר').toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'total':
          aValue = (a.price * a.quantity) || 0;
          bValue = (b.price * b.quantity) || 0;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [purchase.items, sortField, sortDirection, categories]);

  return (
    <Modal onClose={onClose}>
      <div className="purchase-modal">
        <div className="sticky-header">
          <h2>
            <FontAwesomeIcon icon={faReceipt} className="ml-2" />
            פרטי רכישה
          </h2>
          <button className="close-button ml-2" onClick={onClose}>
            <h3>
                <FontAwesomeIcon icon={faTimes} />
            </h3>
          </button>
        </div>

        <div className="purchase-scrollable-content">
        {/* <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh)', padding: '20px' }}> */}
          {/* <div className="purchase-details">
            <h3>פרטי הרכישה</h3>
            <p>צפה בפירוט המלא של הרכישה ובמוצרים שנרכשו</p>
          </div> */}
          
          <div className="purchase-header">
            <div>
              <strong>תאריך רכישה</strong>
              {(() => {
                if (!purchase.date) return '—';
                // Firebase Timestamp: {seconds, nanoseconds}
                if (typeof purchase.date === 'object' && purchase.date.seconds) {
                  return new Date(purchase.date.seconds * 1000).toLocaleDateString('he-IL');
                }
                // ISO string or number
                const d = new Date(purchase.date);
                return isNaN(d) ? '—' : d.toLocaleDateString('he-IL');
              })()}
            </div>
            
            <div>
              <strong>סה"כ רכישה</strong>
              {purchase.totalAmount.toFixed(2)} ₪
            </div>
            
            <div>
              <strong>תקציב לפני</strong>
              {purchase.budgetBefore.toFixed(2)} ₪
            </div>
            
            <div>
              <strong>תקציב אחרי</strong>
              {purchase.budgetAfter.toFixed(2)} ₪
            </div>
          </div>

          <div className="table-container">
              <table className="inventory-table">
                  <thead>
                      <tr>
                          <th 
                            onClick={() => handleSort('name')} 
                            data-active={sortField === 'name'}
                            style={{ 
                              cursor: 'pointer', 
                              userSelect: 'none',
                              transition: 'background-color 0.2s ease',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            title="לחץ למיון לפי שם מוצר"
                          >
                            שם מוצר <FontAwesomeIcon icon={getSortIcon('name')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                          </th>
                          <th 
                            onClick={() => handleSort('category')} 
                            data-active={sortField === 'category'}
                            style={{ 
                              cursor: 'pointer', 
                              userSelect: 'none',
                              transition: 'background-color 0.2s ease',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            title="לחץ למיון לפי קטגוריה"
                          >
                            קטגוריה <FontAwesomeIcon icon={getSortIcon('category')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                          </th>
                          <th 
                            onClick={() => handleSort('quantity')} 
                            data-active={sortField === 'quantity'}
                            style={{ 
                              cursor: 'pointer', 
                              userSelect: 'none',
                              transition: 'background-color 0.2s ease',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            title="לחץ למיון לפי כמות"
                          >
                            כמות <FontAwesomeIcon icon={getSortIcon('quantity')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                          </th>
                          <th 
                            onClick={() => handleSort('price')} 
                            data-active={sortField === 'price'}
                            style={{ 
                              cursor: 'pointer', 
                              userSelect: 'none',
                              transition: 'background-color 0.2s ease',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            title="לחץ למיון לפי מחיר"
                          >
                            מחיר <FontAwesomeIcon icon={getSortIcon('price')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                          </th>
                          <th 
                            onClick={() => handleSort('total')} 
                            data-active={sortField === 'total'}
                            style={{ 
                              cursor: 'pointer', 
                              userSelect: 'none',
                              transition: 'background-color 0.2s ease',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            title="לחץ למיון לפי סה&quot;כ"
                          >
                            סה"כ <FontAwesomeIcon icon={getSortIcon('total')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                      {sortedItems.map((item, index) => (
                      <tr key={item.id || `item-${index}`}>
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

          <div className="purchase-summary">
            <div className="total-label">סה"כ לתשלום:</div>
            <div className="total-amount">{purchase.totalAmount.toFixed(2)} ₪</div>
          </div>

          <div className="receipt-section">
            <div className="receipt-header">
              <div className="receipt-title">
                <h4>קבלה:</h4>
                {purchase.receiptName && (
                  <div className="receipt-info">
                    <small>שם קובץ: {purchase.receiptName}</small>
                    <br />
                    <small>הועלה בתאריך: {formatTimestamp(purchase.uploadedAt)}</small>
                  </div>
                )}
              </div>
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
                <div className="no-receipt">
                  <p style={{ color: '#6c757d', fontStyle: 'italic' }}>לא הועלתה קבלה</p>
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