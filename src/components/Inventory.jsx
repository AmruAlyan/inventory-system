import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { faCartPlus, faEdit, faTrashAlt, faPlus, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AddProductWidget from './AddProductWidget';
// import SeedProductsComponent from './seedProductComponent';
import '../styles/inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // const [showEditWidget, setShowEditWidget] = useState(false);
  // const handleEdit = async (id) => {
  //   setShowEditWidget(true);
  // };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm)
  );

  const addToShoppingList = (id) => {
    // Add your logic here
    console.log("Added to shopping list:", id);
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
      <h1>מוצרים</h1>
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
            <AddProductWidget onClose={() => setShowAddWidget(false)} />
        </div>
      )}
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
                <button onClick={() => addToShoppingList(product.id)} title="הוסף לסל">
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
  );
};

export default Inventory;
