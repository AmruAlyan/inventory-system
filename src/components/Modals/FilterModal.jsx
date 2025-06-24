import React, { useState } from 'react';
import Modal from './Modal';
import '../../styles/ForModals/filterModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

const FilterModal = ({ onClose, onApplyFilters, initialFilters, categories }) => {
  const [filters, setFilters] = useState({
    categories: initialFilters?.categories || [],
    stockStatus: initialFilters?.stockStatus || 'all', // 'all', 'inStock', 'outOfStock', 'lowStock'
  });

  const handleCategoryChange = (categoryId) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleStockStatusChange = (status) => {
    setFilters(prev => ({
      ...prev,
      stockStatus: status
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      categories: [],
      stockStatus: 'all'
    });
  };

  return (
    <Modal onClose={onClose}>
      <div className="filter-modal">
        <h2><FontAwesomeIcon icon={faFilter}/> סינון</h2>
        <div className="filter-content">
          <div className="filter-section">
            <h3>מצב מלאי</h3>
            <div className="stock-status-options">
              <label>
                <input
                  type="radio"
                  name="stockStatus"
                  value="all"
                  checked={filters.stockStatus === 'all'}
                  onChange={() => handleStockStatusChange('all')}
                />
                הכל
              </label>
              <label>
                <input
                  type="radio"
                  name="stockStatus"
                  value="inStock"
                  checked={filters.stockStatus === 'inStock'}
                  onChange={() => handleStockStatusChange('inStock')}
                />
                במלאי
              </label>
              <label>
                <input
                  type="radio"
                  name="stockStatus"
                  value="outOfStock"
                  checked={filters.stockStatus === 'outOfStock'}
                  onChange={() => handleStockStatusChange('outOfStock')}
                />
                אזל מהמלאי
              </label>
              <label>
                <input
                  type="radio"
                  name="stockStatus"
                  value="lowStock"
                  checked={filters.stockStatus === 'lowStock'}
                  onChange={() => handleStockStatusChange('lowStock')}
                />
                מלאי נמוך
              </label>
              <label>
                <input
                  type="radio"
                  name="stockStatus"
                  value="outOfStockOrLow"
                  checked={filters.stockStatus === 'outOfStockOrLow'}
                  onChange={() => handleStockStatusChange('outOfStockOrLow')}
                />
                חסר/נמוך במלאי
              </label>
            </div>
          </div>

          <div className="filter-section">
            <h3>קטגוריות</h3>
            <div className="categories-list">
              {categories.map(category => (
                <label key={category.id} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleApply} className="apply-button">החל</button>
          <button onClick={handleReset} className="reset-button">אפס</button>
          <button onClick={onClose} className="cancel-button">ביטול</button>
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;