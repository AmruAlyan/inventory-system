import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { faCartPlus, faEdit, faTrashAlt, faPlus, faFilter, faBoxesStacked, faSort, faSortUp, faSortDown, faList, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ProductModal from '../../components/Modals/ProductModal';
import AddToListModal from '../../components/Modals/AddToListModal';
import ProductCard from '../../components/ProductCard';
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
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Get saved value from localStorage, default to 2 rows (8 cards for card view, 8 rows for list view)
    const saved = localStorage.getItem('productsItemsPerPage');
    return saved ? parseInt(saved) : 8;
  });
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // Get saved value from localStorage, default to 2 rows
    const saved = localStorage.getItem('productsRowsPerPage');
    return saved ? parseInt(saved) : 2;
  });
  // Track actual cards per row dynamically
  const [actualCardsPerRow, setActualCardsPerRow] = useState(4);
  // Add a debounced timer ref
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState({});
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    // Get saved view mode from localStorage, default to 'list'
    const saved = localStorage.getItem('productsViewMode');
    return saved || 'list';
  });
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    stockStatus: 'all'
  });

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
  
  // For cards view, calculate based on exact rows
  let itemsToShow = itemsPerPage;
  if (viewMode === 'cards' && actualCardsPerRow > 0) {
    itemsToShow = rowsPerPage * actualCardsPerRow;
  }
  
  // Get current products for pagination
  const indexOfLastItem = currentPage * itemsToShow;
  const indexOfFirstItem = indexOfLastItem - itemsToShow;
  let currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  
  // Ensure we show exactly the requested number of rows (except on last page)
  if (viewMode === 'cards' && actualCardsPerRow > 0) {
    const maxItemsForExactRows = rowsPerPage * actualCardsPerRow;
    const isLastPage = currentPage === Math.ceil(filteredProducts.length / itemsToShow);
    
    if (!isLastPage) {
      // For non-last pages, show exact number of complete rows
      currentProducts = currentProducts.slice(0, maxItemsForExactRows);
    }
  }
  
  const totalPages = Math.ceil(filteredProducts.length / (viewMode === 'cards' && actualCardsPerRow > 0 ? rowsPerPage * actualCardsPerRow : itemsPerPage));
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event) => {
    const newValue = parseInt(event.target.value);
    
    if (viewMode === 'cards') {
      // For cards view, we're selecting rows
      setRowsPerPage(newValue);
      // Use actual cards per row instead of assumed 4
      const newItemsPerPage = newValue * actualCardsPerRow;
      setItemsPerPage(newItemsPerPage);
      localStorage.setItem('productsRowsPerPage', newValue.toString());
      localStorage.setItem('productsItemsPerPage', newItemsPerPage.toString());
    } else {
      // For list view, we're selecting actual items per page
      setItemsPerPage(newValue);
      localStorage.setItem('productsItemsPerPage', newValue.toString());
    }
    
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

  // Function to calculate actual cards per row based on container width
  const calculateActualCardsPerRow = useCallback(() => {
    if (viewMode !== 'cards') return;
    
    const container = document.querySelector('.products-grid');
    if (container) {
      const containerWidth = container.offsetWidth;
      const cardMinWidth = 280; // Based on CSS minmax(280px, 1fr)
      const gap = 24; // Based on var(--spacing-lg) which is typically 24px
      const possibleCards = Math.floor((containerWidth + gap) / (cardMinWidth + gap));
      const cardsPerRow = Math.max(1, possibleCards); // At least 1 card per row
      
      if (cardsPerRow !== actualCardsPerRow) {
        console.log(`Cards per row changed from ${actualCardsPerRow} to ${cardsPerRow}`);
        setActualCardsPerRow(cardsPerRow);
        
        // Force recalculation of current page to ensure we don't exceed total pages
        const newItemsPerPage = rowsPerPage * cardsPerRow;
        const newTotalPages = Math.ceil(filteredProducts.length / newItemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      }
    }
  }, [viewMode, actualCardsPerRow, rowsPerPage, currentPage, filteredProducts.length]);

  // Debounced version for high-frequency events
  const debouncedCalculateActualCardsPerRow = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(calculateActualCardsPerRow, 100);
    setDebounceTimer(timer);
  }, [calculateActualCardsPerRow, debounceTimer]);

  // Effect to recalculate cards per row when layout changes
  useEffect(() => {
    if (viewMode === 'cards') {
      // Initial calculation with delay to ensure DOM is ready
      const timeoutId = setTimeout(calculateActualCardsPerRow, 200);
      
      // Set up ResizeObserver to watch for container size changes
      const contentArea = document.querySelector('.content-area');
      const productsGrid = document.querySelector('.products-grid');
      
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
          // Use debounced calculation for smooth performance
          debouncedCalculateActualCardsPerRow();
        });
        
        // Observe both content area and the grid container
        if (contentArea) resizeObserver.observe(contentArea);
        if (productsGrid) resizeObserver.observe(productsGrid);
        
        return () => {
          clearTimeout(timeoutId);
          if (debounceTimer) clearTimeout(debounceTimer);
          resizeObserver.disconnect();
        };
      }
      
      // Fallback: also listen for window resize and transition events
      const handleResize = () => debouncedCalculateActualCardsPerRow();
      const handleTransition = (event) => {
        if (event.propertyName === 'width' || event.propertyName === 'transform') {
          debouncedCalculateActualCardsPerRow();
        }
      };
      
      window.addEventListener('resize', handleResize);
      if (contentArea) {
        contentArea.addEventListener('transitionend', handleTransition);
      }
      
      return () => {
        clearTimeout(timeoutId);
        if (debounceTimer) clearTimeout(debounceTimer);
        window.removeEventListener('resize', handleResize);
        if (contentArea) {
          contentArea.removeEventListener('transitionend', handleTransition);
        }
      };
    }
    
    // Cleanup debounce timer when component unmounts or view mode changes
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [viewMode, calculateActualCardsPerRow, debouncedCalculateActualCardsPerRow, debounceTimer]);

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
        <div className="view-toggle">
          <span className="view-toggle-label">תצוגה:</span>
          <div className="view-toggle-buttons">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('list');
                localStorage.setItem('productsViewMode', 'list');
              }}
            >
              <FontAwesomeIcon icon={faList} />
              רשימה
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('cards');
                localStorage.setItem('productsViewMode', 'cards');
              }}
            >
              <FontAwesomeIcon icon={faTableCells} />
              כרטיסים
            </button>
          </div>
        </div>
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
      ) : viewMode === 'list' ? (
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
      ) : (
        <div className="product-cards-container">
          <div className="products-grid">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categories[product.category] || 'לא מוגדר'}
                onAddToList={handleAddToList}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
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
              <label style={{ color: 'white' }}>
                {viewMode === 'cards' ? 'שורות בעמוד:' : 'שורות בעמוד:'}
              </label>
              <select 
                value={viewMode === 'cards' ? rowsPerPage : itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className="items-per-page-select"
              >
                {viewMode === 'cards' ? (
                  <>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </>
                ) : (
                  <>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </>
                )}
              </select>
            </div>
          </div>
      )}
    </div>
  );
};
export default Products;