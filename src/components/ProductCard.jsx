import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faEdit, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ProductCard = ({ 
  product, 
  categoryName, 
  onAddToList, 
  onEdit, 
  onDelete,
  onAddToCart,
  hidePrice = false,
  mode = 'default', // 'default' or 'consumed-items'
  consumedItemsMode = 'consumption', // 'consumption' or 'stocktaking'
  isProcessing = false,
  disabled = false
}) => {
  const getStockStatusClass = (quantity) => {
    if (quantity <= 0) return 'bg-red-100';
    if (quantity < 10) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getStockStatusText = (quantity) => {
    if (quantity <= 0) return 'אזל';
    if (quantity < 10) return 'נמוך';
    return 'תקין';
  };

  return (
    <div className="product-card">
      <div className="product-card-image">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="product-no-image">
            <span>אין תמונה</span>
          </div>
        )}
        
      </div>
      
      <div className="product-card-content">
        <h3 className="product-name" title={product.name}>
          {product.name}
        </h3>
        
        <div className="product-info">
          <div className="product-category">
            {categoryName}
          </div>
          {!hidePrice && (
            <div className="product-price">
              {product.price} ₪
            </div>
          )}
        </div>
        
        <div className="product-stock-info">
          <span className="stock-label">מלאי:</span>
          <span className={`stock-status ${getStockStatusClass(product.quantity)}`}>
            {getStockStatusText(product.quantity)} ({product.quantity})
          </span>
        </div>
        
        {mode === 'consumed-items' && (
          <div className="product-last-modified">
            <span className="last-modified-label">עדכון אחרון:</span>
            <span className="last-modified-date">
              {product.lastModified ? (
                new Date(product.lastModified.seconds * 1000).toLocaleDateString('he-IL', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              ) : (
                'לא עודכן'
              )}
            </span>
          </div>
        )}
        
        <div className="product-card-actions">
          {isProcessing ? (
            <div className="processing-indicator">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>מתעדכן...</span>
            </div>
          ) : mode === 'consumed-items' ? (
            <button 
              onClick={onEdit} 
              title={consumedItemsMode === 'consumption' ? 'רשום צריכה' : 'עדכן מלאי'}
              disabled={disabled}
              className={`action-btn ${consumedItemsMode === 'consumption' ? 'consumption-btn' : 'stocktaking-btn'} ${disabled ? 'disabled' : ''}`}
              style={{
                backgroundColor: disabled ? 'var(--bg-color)' : consumedItemsMode === 'consumption' ? '#ffc107' : '#28a745',
                color: disabled ? 'var(--secondary-text)' : 'white',
                opacity: disabled ? '0.5' : '1',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              <FontAwesomeIcon icon={faEdit} />
              {consumedItemsMode === 'consumption' ? 'צריכה' : 'עדכון'}
            </button>
          ) : (
            <>
              <button 
                onClick={() => onAddToList ? onAddToList(product.id) : onAddToCart && onAddToCart(product.id)} 
                title={product.quantity <= 0 ? "המוצר אזל מהמלאי" : "הוסף לסל"}
                disabled={product.quantity <= 0}
                className={`action-btn add-btn ${product.quantity <= 0 ? 'disabled' : ''}`}
              >
                <FontAwesomeIcon icon={faCartPlus} />
              </button>
              <button 
                onClick={() => onEdit(product.id)} 
                title="עדכן"
                className="action-btn edit-btn"
              >
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button 
                onClick={() => onDelete(product.id)} 
                title="מחק"
                className="action-btn delete-btn"
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
