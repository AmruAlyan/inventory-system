import React, { useState } from 'react';
import Modal from './Modal'
import '../../styles/ForModals/productModal.css'; // Reuse the same styling
import '../../styles/imageUpload.css'; // Import image styling

const AddToListModal = ({ product, onClose, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleQuantityChange = (e) => {
    if (e.target.value === 'other') {
      setUseCustom(true);
      setCustomQuantity('');
    } else {
      setUseCustom(false);
      setQuantity(Number(e.target.value));
    }
  };

  const handleCustomQuantityChange = (e) => {
    setCustomQuantity(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalQuantity = useCustom ? Number(customQuantity) : Number(quantity);
    
    if (!finalQuantity || finalQuantity < 1) {
      return;
    }
    
    // Check if requested quantity exceeds available stock
    if (finalQuantity > product.quantity) {
      alert(`לא ניתן להוסיף ${finalQuantity} יחידות. יש במלאי רק ${product.quantity} יחידות מהמוצר "${product.name}"`);
      return;
    }
    
    onAdd(product, finalQuantity);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="Product-modal">
        <h2>הוסף לרשימת קניות</h2>
        <form onSubmit={handleSubmit} className="Product-form">
          <div className='Product-form-content'>
            <div className='Product-form-fields'>
              <div className="Product-form-group">
                <label>שם מוצר:</label>
                <input type="text" value={product.name} readOnly />
              </div>
              <div className="Product-form-group">
                <label>במלאי:</label>
                <input type="text" value={`${product.quantity} יחידות`} readOnly />
              </div>
              <div className="Product-form-group">
                <label>כמות:</label>
                {!useCustom ? (
                  <select value={quantity} onChange={handleQuantityChange}>
                    {[...Array(Math.min(10, product.quantity))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                    {product.quantity > 10 && <option value="other">כמות אחרת</option>}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    value={customQuantity}
                    onChange={handleCustomQuantityChange}
                    placeholder={`הזן כמות (מקסימום ${product.quantity})`}
                  />
                )}
              </div>
            </div>
            <div className='Product-form-image'>
              <div className="image-upload-container">
                {/* <label>תמונת מוצר:</label> */}
                <div className="current-image-display">
                  {product.imageUrl ? (
                    <div className="image-preview-container">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="product-image-preview"
                      />
                    </div>
                  ) : (
                    <div className="no-image-placeholder">
                      <div className="placeholder-content">
                        <span className="placeholder-text">אין תמונה</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="Product-button-group">
            <button type="submit" className="NewProduct-button">הוסף לרשימה</button>
            <button type="button" onClick={onClose} className="NewProduct-button">ביטול</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddToListModal; 