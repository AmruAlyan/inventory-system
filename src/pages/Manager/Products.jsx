import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { faCartPlus, faEdit, faTrashAlt, faPlus, faFilter, faBoxesStacked, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ProductModal from '../../components/Modals/ProductModal';
import AddToListModal from '../../components/Modals/AddToListModal';
import { toast } from 'react-toastify';
// import SeedProductsComponent from '../../components/SeedProductComponent';
import '../../styles/ForManager/products.css';
import FilterModal from '../../components/Modals/FilterModal';

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
        case 'outOfStock':
          return product.quantity <= 0;
        case 'lowStock':
          return product.quantity > 0 && product.quantity < 10;
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

  const addProductToShoppingList = (product, quantity) => {
    const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
    
    // Check if product already exists in list
    const existingIndex = shoppingList.findIndex(item => item.id === product.id);
    
    if (existingIndex !== -1) {
      // Update quantity if product already in list
      shoppingList[existingIndex].quantity += quantity;
    } else {      // Add new product to list
      shoppingList.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        category: product.category
      });
    }
    
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    toast.success('המוצר נוסף לרשימת הקניות בהצלחה!');
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
      </div>      {showFilterModal && (
        <FilterModal
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters}
        />
      )}
      {showAddWidget && (
        <ProductModal onClose={() => setShowAddWidget(false)} onSave={fetchProducts} />
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
        />
      )}
      {showAddToListModal && selectedProduct && (
        <AddToListModal
          product={selectedProduct}
          onClose={() => setShowAddToListModal(false)}
          onAdd={addProductToShoppingList}
        />
      )}
      {/* <div className="card"> */}
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
          </thead>          <tbody>
            {currentProducts.map((product) => (              <tr key={product.id}>
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
                  <button onClick={() => handleAddToList(product.id)} title="הוסף לסל">
                    <FontAwesomeIcon icon={faCartPlus} />
                  </button>
                  <button onClick={() => handleEdit(product.id)} title="עדכן">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} title="מחק">
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                </td>              </tr>
            ))}
          </tbody>
        </table>        <div className="pagination">
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
              <label>שורות בעמוד:</label>
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
      {/* </div> */}
    </div>
  );
};
export default Products;