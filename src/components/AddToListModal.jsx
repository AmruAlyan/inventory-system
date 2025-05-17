import React, { useState } from 'react';
import '../styles/addProductWidget.css'; // Reuse the same styling

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
    if (!finalQuantity || finalQuantity < 1) return;
    onAdd(product, finalQuantity);
    onClose();
  };

  return (
    <div className="addProduct-widget">
      <h2>הוסף לרשימת קניות</h2>
      <form onSubmit={handleSubmit} className="addProduct-form">
        <div className="addProduct-form-group">
          <label>שם מוצר:</label>
          <input type="text" value={product.name} readOnly />
        </div>
        <div className="addProduct-form-group">
          <label>כמות:</label>
          {!useCustom ? (
            <select value={quantity} onChange={handleQuantityChange}>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
              <option value="other">כמות אחרת</option>
            </select>
          ) : (
            <input
              type="number"
              min="1"
              value={customQuantity}
              onChange={handleCustomQuantityChange}
              placeholder="הזן כמות"
            />
          )}
        </div>
        <div className="addProduct-button-group">
          <button type="submit" className="addNewProduct-button">הוסף לרשימה</button>
          <button type="button" onClick={onClose} className="addNewProduct-button">ביטול</button>
        </div>
      </form>
    </div>
  );
};

export default AddToListModal; 