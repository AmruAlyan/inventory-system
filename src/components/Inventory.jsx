import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { faCartPlus, faEdit, faTrashAlt, faPlus, faFilter, faBoxesStacked } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AddProductWidget from './addProductWidget';
import AddToListModal from './AddToListModal';
import { toast } from 'react-toastify';
// import SeedProductsComponent from './seedProductComponent';
import '../styles/inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditWidget, setShowEditWidget] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    const product = products.find((p) => p.id === id);
    const confirmDelete = window.confirm(
      `האם אתה בטוח שברצונך למחוק את המוצר "${product?.name ?? ''}"? פעולה זו אינה ניתנת לביטול.`
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
      toast.success('המוצר נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('שגיאה: לא ניתן למחוק את המוצר');
    }
  };

  const handleEdit = (id) => {
    const product = products.find((p) => p.id === id);
    setEditingProduct(product);
    setShowEditWidget(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm)
  );

  const handleAddToList = (id) => {
    const product = products.find((p) => p.id === id);
    setSelectedProduct(product);
    setShowAddToListModal(true);
  };

  const addProductToShoppingList = (product, quantity) => {
    const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
    
    // Check if product already exists in list
    const existingIndex = shoppingList.findIndex(item => item.id === product.id);
    
    if (existingIndex !== -1) {
      // Update quantity if product already in list
      shoppingList[existingIndex].quantity += quantity;
    } else {
      // Add new product to list
      shoppingList.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity
      });
    }
    
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    toast.success('המוצר נוסף לרשימת הקניות בהצלחה!');
  };

  const [showAddWidget, setShowAddWidget] = useState(false);

  const handleAddProduct = () => {
    setShowAddWidget(true);
  };

  const handleFilter = () => {
    console.log("filter clicked");
  }

  const categories = [
    'פירות וירקות',
    'מוצרי חלב',
    'בשר ודגים',
    'מאפים ולחמים',
    'משקאות',
    'מוצרי ניקיון',
    'חטיפים ומתוקים',
    'מזון יבש',
    'קפואים',
    'מוצרי נייר'
  ];


  return (
    <div className='inventory-container'>
      {/* <SeedProductsComponent/> */}
      <div className="page-header">
        <h1>
          <FontAwesomeIcon icon={faBoxesStacked} className="page-header-icon" />
          מוצרים
        </h1>
      </div>
      <div className="searchBar">
        <input
          type="search"
          name="search4product"
          placeholder="חיפוש לפי שם מוצר או קטיגוריה..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button onClick={handleFilter}>
          <FontAwesomeIcon icon={faFilter} /> סינון
        </button>
        <button onClick={handleAddProduct}>
          <FontAwesomeIcon icon={faPlus} /> הוסף מוצר
        </button>
      </div>
      {showAddWidget && (
        <div className="overlay">
            <AddProductWidget onClose={() => setShowAddWidget(false)} onSave={fetchProducts} />
        </div>
      )}
      {showEditWidget && editingProduct && (
        <div className="overlay">
          <AddProductWidget
            mode="edit"
            product={editingProduct}
            onClose={() => setShowEditWidget(false)}
            onSave={() => {
              setShowEditWidget(false);
              setEditingProduct(null);
              fetchProducts();
            }}
          />
        </div>
      )}
      {showAddToListModal && selectedProduct && (
        <div className="overlay">
          <AddToListModal
            product={selectedProduct}
            onClose={() => setShowAddToListModal(false)}
            onAdd={addProductToShoppingList}
          />
        </div>
      )}
      <div className="card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>קטגוריה</th>
              <th>מחיר</th>
              <th>מלאי</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.price} ₪</td>
                <td>
                  <span className='rounded-full'>
                    {product.quantity <= 0 ? (
                      <span className="bg-red-100">{product.quantity}</span>
                    ) : product.quantity < 10 ? (
                      <span className="bg-yellow-100">{product.quantity}</span>
                    ) : (
                      <span className="bg-green-100">{product.quantity}</span>
                    )}
                  </span>
                </td>
                <td className='inventory-actions'>
                  <button onClick={() => handleAddToList(product.id)} title="הוסף לסל">
                    <FontAwesomeIcon icon={faCartPlus} />
                  </button>
                  <button onClick={() => handleEdit(product.id)} title="עדכן">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} title="מחק">
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
