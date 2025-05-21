import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../styles/ForModals/filterModal.css';

const FilterModal = ({ onClose, onApplyFilters, initialFilters }) => {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    categories: initialFilters?.categories || [],
    stockStatus: initialFilters?.stockStatus || 'all', // 'all', 'inStock', 'outOfStock', 'lowStock'
  });

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

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
        <h2>סינון</h2>
        
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