import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { faTableCellsLarge, faEdit, faTrashAlt, faPlus, faSort, faSortUp, faSortDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CategoryWidget from '../../components/Widgets/CategoryWidget';
import Modal from '../../components/Modals/Modal';
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';
import { showConfirm } from '../../utils/dialogs';
import '../../styles/ForManager/categories.css';
import '../../styles/ForModals/categoryModal.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditWidget, setShowEditWidget] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);

  // Fetch categories and their product counts from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // First get all categories
        const categorySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categorySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          productCount: 0 // Initialize count
        }));

        // Then get all products to count them per category
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const categoryCounts = {};
        productsSnapshot.docs.forEach(doc => {
          const product = doc.data();
          if (product.category) {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
          }
        });

        // Add counts to categories
        const dataWithCounts = categoriesData.map(category => ({
          ...category,
          productCount: categoryCounts[category.id] || 0
        }));
        setCategories(dataWithCounts);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('שגיאה בטעינת קטגוריות');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    const category = categories.find((c) => c.id === id);
    const confirmDelete = await showConfirm(
      `האם אתה בטוח שברצונך למחוק את הקטגוריה "${category?.name ?? ''}"? פעולה זו אינה ניתנת לביטול.`,
      'מחק קטגוריה'
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('הקטגוריה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('שגיאה: לא ניתן למחוק את הקטגוריה');
    }
  };

  const handleEdit = (id) => {
    const category = categories.find((c) => c.id === id);
    setEditingCategory(category);
    setShowEditWidget(true);
  };

  const handleCategoryAdded = () => {
    setShowAddWidget(false);
    // Refresh categories list
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categorySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categorySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          productCount: 0
        }));

        const productsSnapshot = await getDocs(collection(db, 'products'));
        const categoryCounts = {};
        productsSnapshot.docs.forEach(doc => {
          const product = doc.data();
          if (product.category) {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
          }
        });

        const dataWithCounts = categoriesData.map(category => ({
          ...category,
          productCount: categoryCounts[category.id] || 0
        }));
        setCategories(dataWithCounts);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('שגיאה בטעינת קטגוריות');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  };

  const handleCategoryUpdated = () => {
    setShowEditWidget(false);
    setEditingCategory(null);
    // Refresh categories list
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categorySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categorySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          productCount: 0
        }));

        const productsSnapshot = await getDocs(collection(db, 'products'));
        const categoryCounts = {};
        productsSnapshot.docs.forEach(doc => {
          const product = doc.data();
          if (product.category) {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
          }
        });

        const dataWithCounts = categoriesData.map(category => ({
          ...category,
          productCount: categoryCounts[category.id] || 0
        }));
        setCategories(dataWithCounts);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('שגיאה בטעינת קטגוריות');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };
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

  const filteredCategories = categories
    .filter(category => category.name?.toLowerCase().includes(searchTerm))
    .sort((a, b) => {
      if (!sortField) return 0;

      let aValue = a[sortField];
      let bValue = b[sortField];

      // For numeric values (productCount)
      if (sortField === 'productCount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // For string values (name)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="inventory-container">
      <div className="page-header d-flex align-items-center mb-3">
        <h1>
          <FontAwesomeIcon icon={faTableCellsLarge} className="page-header-icon" />
          קטגוריות
        </h1>
      </div>
      
      <div className='categories-layout'>
        
        <div className="categories-main">
          <div className="categories-controls">
            <div className="search-section">
              <input
                type="search"
                name="search4category"
                placeholder="חיפוש קטגוריות..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            
            <div className="controls-right">
              
              
              <div className="sort-section">
                <label>מיון לפי:</label>
                <select 
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-');
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                  value={sortField ? `${sortField}-${sortDirection}` : ''}
                  className="sort-select"
                >
                  <option value="">ללא מיון</option>
                  <option value="name-asc">שם (א-ת)</option>
                  <option value="name-desc">שם (ת-א)</option>
                  <option value="productCount-desc">כמות מוצרים (הרבה למעט)</option>
                  <option value="productCount-asc">כמות מוצרים (מעט להרבה)</option>
                </select>
              </div>
              <button 
                onClick={() => setShowAddWidget(true)}
                className="add-category-btn"
                title="הוסף קטגוריה חדשה"
              >
                <FontAwesomeIcon icon={faPlus} />
                הוסף קטגוריה
              </button>
            </div>
          </div>
          
          {filteredCategories.length > 0 && (
            <div className="categories-summary" style={{ marginBottom: '25px' }}>
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-number">{filteredCategories.length}</span>
                  <span className="summary-label">קטגוריות</span>
                </div>
                <div className="summary-item">
                  <span className="summary-number">
                    {filteredCategories.reduce((sum, cat) => sum + cat.productCount, 0)}
                  </span>
                  <span className="summary-label">סה"כ מוצרים</span>
                </div>
                <div className="summary-item">
                  <span className="summary-number">
                    {Math.round(filteredCategories.reduce((sum, cat) => sum + cat.productCount, 0) / filteredCategories.length * 10) / 10}
                  </span>
                  <span className="summary-label">ממוצע מוצרים</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="categories-content">
            {loading ? (
              <div className="loading-container">
                <Spinner />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FontAwesomeIcon icon={faTableCellsLarge} />
                </div>
                <h3>אין קטגוריות להצגה</h3>
                <p>הוסף קטגוריות חדשות כדי להתחיל לארגן את המוצרים שלך</p>
              </div>
            ) : (
              <div className="categories-grid">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="card-header">
                      <h3 className="category-name-icon">{category.name}</h3>
                      <div className="card-actions">
                        <button 
                          onClick={() => handleEdit(category.id)} 
                          title="ערוך קטגוריה"
                          className="action-btn edit-btn"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)} 
                          title="מחק קטגוריה"
                          className="action-btn delete-btn"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="category-stats">
                        <div className="stat-item">
                          <span className="stat-number">{category.productCount}</span>
                          <span className="stat-label">מוצרים</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddWidget && (
        <Modal onClose={() => setShowAddWidget(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>הוסף קטגוריה חדשה</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowAddWidget(false)}
                title="סגור"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <CategoryWidget
              onCategoryAdded={handleCategoryAdded}
              onCancel={() => setShowAddWidget(false)}
              categoriesList={categories}
            />
          </div>
        </Modal>
      )}

      {/* Edit Category Modal */}
      {showEditWidget && editingCategory && (
        <Modal onClose={() => { setShowEditWidget(false); setEditingCategory(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>ערוך קטגוריה</h2>
              <button 
                className="modal-close-btn"
                onClick={() => { setShowEditWidget(false); setEditingCategory(null); }}
                title="סגור"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <CategoryWidget
              editingCategory={editingCategory}
              onUpdate={handleCategoryUpdated}
              onCancel={() => { setShowEditWidget(false); setEditingCategory(null); }}
              categoriesList={categories}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
export default Categories;