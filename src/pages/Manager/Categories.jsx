import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { faTableCellsLarge, faEdit, faTrashAlt, faPlus, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CategoryWidget from '../../components/Widgets/CategoryWidget';
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';
import { showConfirm } from '../../utils/dialogs';
import '../../styles/ForManager/categories.css';

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
        {/* ...existing header actions... */}
      </div>
      <div className='cat'>
        <div className='catL'>
          {showEditWidget ? (
            <div className='sticky-box'>
              <CategoryWidget
                editingCategory={editingCategory}   
                onUpdate={() => {
                  setShowEditWidget(false);
                  setEditingCategory(null);
                }}
                onCancel={() => {
                  setShowEditWidget(false);
                  setEditingCategory(null);
                }}
                categoriesList={categories}
              />
            </div>
          ) : (
            <div className='sticky-box'>
              <CategoryWidget categoriesList={categories} />
            </div>
          )}
        </div>
        <div className="catR">
          <div className="searchBar">
            <input
              type="search"
              name="search4category"
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div>
            {loading ? (
              <Spinner />
            ) : filteredCategories.length === 0 ? (
              <div className="empty-list">
                <p>אין קטגוריות להצגה</p>
                <p className="empty-list-subtext">הוסף קטגוריות חדשות כדי להתחיל</p>
              </div>
            ) : (
              <table className="inventory-table">              
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                      שם קטיגוריה
                      <FontAwesomeIcon icon={getSortIcon('name')} className="sort-icon" />
                    </th>
                    <th onClick={() => handleSort('productCount')} style={{ cursor: 'pointer' }}>
                      כמות מוצרים
                      <FontAwesomeIcon icon={getSortIcon('productCount')} className="sort-icon" />
                    </th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.productCount}</td>
                      <td className='inventory-actions'>
                        <button onClick={() => handleEdit(category.id)} title="עדכן">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => handleDelete(category.id)} title="מחק">
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Categories;