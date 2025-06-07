import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { faCartPlus, faEdit, faTrashAlt, faPlus, faFilter, faBoxesStacked, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ProductModal from '../../components/Modals/ProductModal';
import AddToListModal from '../../components/Modals/AddToListModal';
import { toast } from 'react-toastify';
// import SeedProductsComponent from '../../components/SeedProductComponent';
import '../../styles/ForManager/products.css';
import FilterModal from '../../components/Modals/FilterModal';
import Spinner from '../../components/Spinner';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditWidget, setShowEditWidget] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState({});
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  // Handle filter state passed from navigation
  useEffect(() => {
    if (location.state?.applyFilter) {
      setActiveFilters(location.state.applyFilter);
      // Clear the state to prevent reapplying on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesMap = {};
      querySnapshot.docs.forEach(doc => {
        categoriesMap[doc.id] = doc.data().name;
      });
      setCategories(categoriesMap);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Define fetchProducts in the component scope so it can be used as a callback
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    stockStatus: 'all'
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };  const filterProducts = (products) => {
    return products.filter(product => {
      // First apply search filter
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (categories[product.category] || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Then apply category filter
      const matchesCategory = 
        activeFilters.categories.length === 0 || 
        activeFilters.categories.includes(product.category);

      if (!matchesCategory) return false;

      // Finally apply stock status filter
      switch (activeFilters.stockStatus) {
        case 'inStock':
          return product.quantity > 0;
        case 'highStock':
          return product.quantity >= 10;
        case 'outOfStock':
          return product.quantity <= 0;
        case 'lowStock':
          return product.quantity > 0 && product.quantity < 10;
        case 'outOfStockOrLow':
          return product.quantity <= 0 || (product.quantity > 0 && product.quantity < 10);
        default:
          return true;
      }
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortProducts = (products) => {
    if (!sortField) return products;

    return [...products].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Special handling for category field
      if (sortField === 'category') {
        aValue = categories[a.category] || 'לא מוגדר';
        bValue = categories[b.category] || 'לא מוגדר';
      }

      // Convert to numbers for price and quantity
      if (sortField === 'price' || sortField === 'quantity') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };
  const filteredProducts = sortProducts(filterProducts(products));
  
  // Get current products for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event) => {
    const newItemsPerPage = parseInt(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleAddToList = (id) => {
    const product = products.find((p) => p.id === id);
    setSelectedProduct(product);
    setShowAddToListModal(true);
  };
  const addProductToShoppingList = async (product, quantity) => {
    try {
      const itemRef = doc(db, 'sharedShoppingList', 'globalList', 'items', product.id);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        // Update existing item quantity
        const currentQuantity = itemDoc.data().quantity;
        await updateDoc(itemRef, {
          quantity: currentQuantity + quantity
        });
      } else {
        // Add new item
        await setDoc(itemRef, {
          productRef: doc(db, 'products', product.id),
          quantity: quantity,
          purchased: false
        });
      }
      
      toast.success('המוצר נוסף לרשימת הקניות בהצלחה!');
    } catch (error) {
      console.error('Error adding product to shopping list:', error);
      toast.error('שגיאה בהוספת המוצר לרשימת הקניות');
    }
  };

  const [showAddWidget, setShowAddWidget] = useState(false);

  const handleAddProduct = () => {
    setShowAddWidget(true);
  };
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleFilter = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    toast.success('הסינון הוחל בהצלחה');
  };

  // Prevent adding a product with a duplicate name (case-insensitive)
  const isDuplicateProductName = (name) => {
    return products.some(
      (product) => product.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

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
      {showFilterModal && (
        <FilterModal
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters}
          categories={Object.entries(categories).map(([id, name]) => ({ id, name }))}
        />
      )}
      {showAddWidget && (
        <ProductModal 
          onClose={() => setShowAddWidget(false)} 
          onSave={fetchProducts} 
          existingProductNames={products.map(p => p.name)}
        />
      )}
      {showEditWidget && editingProduct && (
        <ProductModal
          mode="edit"
          product={editingProduct}
          onClose={() => setShowEditWidget(false)}
          onSave={() => {
            setShowEditWidget(false);
            setEditingProduct(null);
            fetchProducts();
          }}
          existingProductNames={products.filter(p => p.id !== (editingProduct?.id)).map(p => p.name)}
        />
      )}
      {showAddToListModal && selectedProduct && (
        <AddToListModal
          product={selectedProduct}
          onClose={() => setShowAddToListModal(false)}
          onAdd={addProductToShoppingList}
        />
      )}
      {loading ? (
        <Spinner />
      ) : filteredProducts.length === 0 ? (
        <div className="empty-list">
          <p>אין מוצרים להצגה</p>
          <p className="empty-list-subtext">הוסף מוצרים חדשים כדי להתחיל</p>
        </div>
      ) : (
        <table className="inventory-table">          
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                שם{' '}
                <FontAwesomeIcon 
                  icon={sortField === 'name' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort}
                />
              </th>
              <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                קטגוריה{' '}
                <FontAwesomeIcon 
                  icon={sortField === 'category' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort}
                />
              </th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                מחיר{' '}
                <FontAwesomeIcon 
                  icon={sortField === 'price' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort}
                />
              </th>
              <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                מלאי{' '}
                <FontAwesomeIcon 
                  icon={sortField === 'quantity' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort}
                />
              </th>
              <th>פעולות</th>
            </tr>
          </thead>          
          <tbody>
            {currentProducts.map((product) => (              
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{categories[product.category] || 'לא מוגדר'}</td>
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
                  <button 
                    onClick={() => handleAddToList(product.id)} 
                    title={product.quantity <= 0 ? "המוצר אזל מהמלאי" : "הוסף לסל"}
                    disabled={product.quantity <= 0}
                    style={product.quantity <= 0 ? { 
                      opacity: 0.5, 
                      cursor: 'not-allowed',
                      color: '#ccc'
                    } : {}}
                  >
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
      )}
      {products.length > 0 && (
        <div className="pagination">
            <div className="pagination-controls">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                הקודם
              </button>
              <span className="pagination-info">
                עמוד {currentPage} מתוך {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                הבא
              </button>
            </div>
            <div className="items-per-page">
              <label style={{ color: 'white' }}>שורות בעמוד:</label>
              <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className="items-per-page-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
      )}
    </div>
  );
};
export default Products;