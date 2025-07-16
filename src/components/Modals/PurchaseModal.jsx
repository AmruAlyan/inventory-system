import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faReceipt, faCloudUploadAlt, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
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
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        cursor: 'pointer'
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
          fontSize: '2.5rem', 
          color: dragActive ? '#667eea' : '#94a3b8',
          transition: 'color 0.3s ease'
        }} 
      />
      <span style={{ 
        color: dragActive ? '#667eea' : '#64748b',
        fontWeight: '500',
        transition: 'color 0.3s ease',
        fontSize: '1rem'
      }}>
        גרור ושחרר קובץ כאן, או לחץ להעלאה
      </span>
      <small style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
        תומך בתמונות (JPG, PNG, GIF) ו-PDF עד 10MB
      </small>
    </div>
  );
};

const PurchaseModal = ({ purchase, onClose, categories, onReceiptUpload }) => {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onReceiptUpload(file, purchase.id);
    }
  };

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
            <div className="d-flex justify-content-between align-items-center">
              <h4>קבלה</h4>
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
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseModal;