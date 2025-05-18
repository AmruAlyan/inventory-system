import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { faTableCellsLarge, faEdit, faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AddProductWidget from '../../components/addProductWidget';
import AddToListModal from '../../components/AddToListModal';
import CategoryWidget from '../../components/CategoryWidget';
import { toast } from 'react-toastify';
import '../../styles/categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditWidget, setShowEditWidget] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    const category = categories.find((c) => c.id === id);
    const confirmDelete = window.confirm(
      `האם אתה בטוח שברצונך למחוק את הקטגוריה "${category?.name ?? ''}"? פעולה זו אינה ניתנת לביטול.`
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(categories.filter(c => c.id !== id));
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

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm)
  );

  return (
    <div className='inventory-container'>
      <div className="page-header">
        <h1>
          <FontAwesomeIcon icon={faTableCellsLarge} className="page-header-icon" />
          קטיגוריות
        </h1>
      </div>      <div className='cat'>
        <div className='catL'>
          {showEditWidget ? (
            <div className='sticky-box'>
              <CategoryWidget
                editingCategory={editingCategory}
                onUpdate={() => {
                  setShowEditWidget(false);
                  setEditingCategory(null);
                  fetchCategories();
                }}
                onCancel={() => {
                  setShowEditWidget(false);
                  setEditingCategory(null);
                }}
              />
            </div>
          ) : (
            <div className='sticky-box'>
              <CategoryWidget onCategoryAdded={fetchCategories} />
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
          {/* {showAddWidget && (
            <div className="overlay">
              <AddProductWidget onClose={() => setShowAddWidget(false)} onSave={fetchCategories} />
              <AddCategoryWidget
                    editingCategory={editingCategory}
                    onUpdate={() => {
                        setShowEditWidget(false);
                        setEditingCategory(null);
                        fetchCategories();
                    }}
                    onCancel={() => {
                        setShowEditWidget(false);
                        setEditingCategory(null);
                    }}
                />
            </div>
          )}
          {showEditWidget && editingCategory && (
            <div className='overlay'>
                <AddCategoryWidget
                    editingCategory={editingCategory}
                    onUpdate={() => {
                        setShowEditWidget(false);
                        setEditingCategory(null);
                        fetchCategories();
                    }}
                    onCancel={() => {
                        setShowEditWidget(false);
                        setEditingCategory(null);
                    }}
                />
            </div>
          )} */}
          <div>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>שם קטיגוריה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
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
          </div>
        </div>
      </div>
    </div>
  );
}
export default Categories;