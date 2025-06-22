import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileLines, 
  faSearch, 
  faToggleOn, 
  faToggleOff, 
  faMinus, 
  faEdit, 
  faSave, 
  faTimes,
  faSpinner,
  faPenToSquare,
  faList,
  faTableCells,
  faBorderAll,
  faFilter,
  faSort,
  faSortUp,
  faSortDown
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../styles/ForManager/products.css';
import Spinner from '../../components/Spinner';
import ProductCard from '../../components/ProductCard';
import { useData } from '../../context/DataContext';
import FilterModal from '../../components/Modals/FilterModal';

const ConsumedItems = () => {
  const { products, categories, loading, setProducts } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState('consumption'); // 'consumption' or 'stocktaking'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ categories: [], stockStatus: '' });
  
  // Update body attribute when mode changes
  useEffect(() => {
    document.body.setAttribute('data-mode', mode);
    
    // Cleanup function to remove attribute when component unmounts
    return () => {
      document.body.removeAttribute('data-mode');
    };
  }, [mode]);

  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // Get saved value from localStorage, default to 2 rows
    const saved = localStorage.getItem('consumedItemsRowsPerPage');
    return saved ? parseInt(saved) : 2;
  });
  // Track actual cards per row dynamically
  const [actualCardsPerRow, setActualCardsPerRow] = useState(4);
  // Add a debounced timer ref
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState(() => {
    // Get saved view mode from localStorage, default to 'list'
    const saved = localStorage.getItem('consumedItemsViewMode');
    return saved || 'list';
  });

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

      // Special handling for lastModified field
      if (sortField === 'lastModified') {
        aValue = a.lastModified ? new Date(a.lastModified.seconds * 1000) : new Date(0);
        bValue = b.lastModified ? new Date(b.lastModified.seconds * 1000) : new Date(0);
      }

      // Convert to numbers for quantity
      if (sortField === 'quantity') {
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

  // Handle applying filters
  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setShowFilterModal(false);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Enhanced filter function to include category and stock status filters
  const filterProducts = (products) => {
    return products.filter(product => {
      // Search term filter
      const categoryName = categories[product.category] || '';
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             categoryName.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = activeFilters.categories.length === 0 || 
                             activeFilters.categories.includes(product.category);

      // Stock status filter
      let matchesStockStatus = true;
      if (activeFilters.stockStatus) {
        switch (activeFilters.stockStatus) {
          case 'inStock':
            matchesStockStatus = product.quantity > 10;
            break;
          case 'lowStock':
            matchesStockStatus = product.quantity > 0 && product.quantity <= 10;
            break;
          case 'outOfStock':
            matchesStockStatus = product.quantity <= 0;
            break;
          case 'outOfStockOrLow':
            matchesStockStatus = product.quantity <= 10;
            break;
          default:
            matchesStockStatus = true;
        }
      }

      return matchesSearch && matchesCategory && matchesStockStatus;
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
      localStorage.setItem('consumedItemsRowsPerPage', newValue.toString());
      localStorage.setItem('consumedItemsItemsPerPage', newItemsPerPage.toString());
    } else {
      // For list view, we're selecting actual items per page
      setItemsPerPage(newValue);
      localStorage.setItem('consumedItemsItemsPerPage', newValue.toString());
    }
    
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle consumption mode - subtract quantity from stock
  const handleConsumption = async (productId, consumedQuantity) => {
    if (!consumedQuantity || consumedQuantity <= 0) {
      toast.error('יש להזין כמות חוקית');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('מוצר לא נמצא');
      return;
    }

    if (consumedQuantity > product.quantity) {
      toast.error(`לא ניתן לצרוך ${consumedQuantity} יחידות. במלאי רק ${product.quantity} יחידות`);
      return;
    }

    setProcessingIds(prev => new Set([...prev, productId]));

    try {
      const newQuantity = product.quantity - consumedQuantity;
      
      // Update product quantity
      await updateDoc(doc(db, 'products', productId), {
        quantity: newQuantity,
        lastModified: Timestamp.fromDate(new Date())
      });

      // Log consumption activity
      await addDoc(collection(db, 'consumptions'), {
        productId,
        productName: product.name,
        category: product.category,
        consumedQuantity,
        previousQuantity: product.quantity,
        newQuantity,
        date: Timestamp.fromDate(new Date()),
        type: 'consumption'
      });

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, quantity: newQuantity, lastModified: Timestamp.fromDate(new Date()) } : p
      ));

      toast.success(`צריכה נרשמה בהצלחה: ${consumedQuantity} יחידות של ${product.name}`);
    } catch (error) {
      console.error('Error recording consumption:', error);
      toast.error('שגיאה ברישום הצריכה');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Handle stocktaking mode - update absolute quantity
  const handleStocktaking = async (productId, newQuantity) => {
    if (newQuantity < 0) {
      toast.error('הכמות חייבת להיות חיובית');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('מוצר לא נמצא');
      return;
    }

    setProcessingIds(prev => new Set([...prev, productId]));

    try {
      // Update product quantity
      await updateDoc(doc(db, 'products', productId), {
        quantity: newQuantity,
        lastModified: Timestamp.fromDate(new Date())
      });

      // Log stocktaking activity
      await addDoc(collection(db, 'consumptions'), {
        productId,
        productName: product.name,
        category: product.category,
        previousQuantity: product.quantity,
        newQuantity,
        adjustment: newQuantity - product.quantity,
        date: Timestamp.fromDate(new Date()),
        type: 'stocktaking'
      });

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, quantity: newQuantity, lastModified: Timestamp.fromDate(new Date()) } : p
      ));

      toast.success(`מלאי עודכן בהצלחה: ${product.name} - ${newQuantity} יחידות`);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('שגיאה בעדכון המלאי');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Start editing
  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditingValue(mode === 'consumption' ? '1' : product.quantity.toString());
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  // Save changes
  const handleSave = async (productId) => {
    const value = parseInt(editingValue);
    if (isNaN(value) || value < 0) {
      toast.error('יש להזין מספר חוקי');
      return;
    }

    if (mode === 'consumption') {
      await handleConsumption(productId, value);
    } else {
      await handleStocktaking(productId, value);
    }

    setEditingId(null);
    setEditingValue('');
  };

  // Toggle mode
  const toggleMode = () => {
    setMode(prev => prev === 'consumption' ? 'stocktaking' : 'consumption');
    setEditingId(null);
    setEditingValue('');
  };

  // Handle filter action
  const handleFilter = () => {
    setShowFilterModal(true);
  };

  // Handle actions for cards view
  const handleCardAction = (product) => {
    if (mode === 'consumption') {
      const quantity = prompt(`כמה יחידות של ${product.name} נצרכו?`, '1');
      if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        handleConsumption(product.id, parseInt(quantity));
      }
    } else {
      const quantity = prompt(`מה הכמות הנוכחית של ${product.name} במלאי?`, product.quantity.toString());
      if (quantity !== null && !isNaN(quantity) && parseInt(quantity) >= 0) {
        handleStocktaking(product.id, parseInt(quantity));
      }
    }
  };

  // Calculate actual cards per row based on container width
  const calculateActualCardsPerRow = useCallback(() => {
    if (viewMode === 'cards') {
      const productsGrid = document.querySelector('.products-grid');
      if (productsGrid) {
        const containerWidth = productsGrid.offsetWidth;
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
    <div className="inventory-container">
      <div className="page-header">
        <h1>
          <FontAwesomeIcon icon={faPenToSquare} className="page-header-icon" />
          עדכון מלאי 
        </h1>
      </div>

      {/* Mode Toggle and Search */}
      <div className="searchBar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <input
            type="search"
            placeholder="חיפוש לפי שם מוצר או קטיגוריה..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        

        {viewMode === 'cards' && (
          <div className="sort-controls">
            <span className="sort-label">מיון: </span>
            <select 
              value={sortField || ''} 
              onChange={(e) => {
                const field = e.target.value;
                if (field) {
                  handleSort(field);
                } else {
                  setSortField(null);
                  setSortDirection('asc');
                }
              }}
              className="sort-select"
            >
              <option value="">ללא מיון</option>
              <option value="name">שם מוצר</option>
              <option value="category">קטגוריה</option>
              <option value="quantity">כמות במלאי</option>
              <option value="lastModified">תאריך עדכון אחרון</option>
            </select>
            {/* {sortField && ( */}
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="sort-direction-btn"
                title={sortDirection === 'asc' ? 'מיון עולה' : 'מיון יורד'}
              >
                <FontAwesomeIcon icon={sortDirection === 'asc' ? faSortUp : faSortDown} />
              </button>
            {/* )} */}
          </div>
        )}

        <div className="view-toggle">
          <button
          title='תצוגת רשימה'
            className={`view-toggle-btn right ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('list');
              localStorage.setItem('consumedItemsViewMode', 'list');
            }}
          >
            <FontAwesomeIcon icon={faList} className="view-icon"/>
          </button>
          <button
          title='תצוגת כרטיסים'
            className={`view-toggle-btn left ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('cards');
              localStorage.setItem('consumedItemsViewMode', 'cards');
            }}
          >
            <FontAwesomeIcon icon={faBorderAll} className="view-icon"/>
          </button>
        </div>

        <button onClick={handleFilter}>
          <FontAwesomeIcon icon={faFilter} /> סינון
        </button>
        
        {/* Mode Toggle */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem', 
            background: 'var(--panel-bg)', 
            borderRadius: '8px', 
            border: `2px solid ${mode === 'consumption' ? 'var(--warning)' : 'var(--success)'}`,
            transition: 'border-color 0.3s ease',
            height: '25px'
          }}>
          <span 
            onClick={mode != 'consumption' ? toggleMode : undefined}
            style={{ 
              fontWeight: 'bold', 
              color: mode === 'consumption' ? 'var(--warning)' : 'var(--secondary-text)',
              transition: 'color 0.3s ease',
              cursor: 'pointer'
            }}>
            צריכה
          </span>
          <FontAwesomeIcon 
            icon={faToggleOff} 
            onClick={toggleMode}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '1.5rem', 
              color: mode === 'consumption' ? 'var(--warning)' : 'var(--success)',
              transition: 'color 0.3s ease',
              rotate: mode === 'consumption' ? '180deg' : '0deg'
            }}
            title={mode === 'consumption' ? 'עבור למצב ספירת מלאי' : 'עבור למצב צריכה'}              
          />
          <span 
            onClick={mode === 'consumption' ? toggleMode : undefined}
            style={{ 
              fontWeight: 'bold',
              color: mode === 'stocktaking' ? 'var(--success)' : 'var(--secondary-text)',
              transition: 'color 0.3s ease',
              cursor: 'pointer'
            }}>
            ספירת מלאי
          </span>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters}
          categories={Object.entries(categories).map(([id, name]) => ({ id, name }))}
        />
      )}

      {/* Mode Description */}
      <div style={{ 
        padding: '1rem', 
        marginBottom: '1rem', 
        background: mode === 'consumption' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(40, 167, 69, 0.1)', 
        border: `2px solid ${mode === 'consumption' ? 'var(--warning)' : 'var(--success)'}`,
        borderRadius: '8px',
        textAlign: 'center',
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}>
        {mode === 'consumption' ? (
          <p style={{ margin: 0, color: 'var(--warning)' }}>
            <strong>מצב צריכה:</strong> הזן את הכמות שנצרכה מהמוצר, הכמות תופחת מהמלאי הקיים.
          </p>
        ) : (
          <p style={{ margin: 0, color: 'var(--success)' }}>
            <strong>מצב ספירת מלאי:</strong> הזן את הכמות הנוכחית במלאי, המלאי יעודכן לכמות שהזנת.
          </p>
        )}
      </div>

      {/* Products Display */}
      {loading ? (
        <Spinner />
      ) : filteredProducts.length === 0 ? (
        <div className="empty-list">
          <p>לא נמצאו מוצרים</p>
          <p className="empty-list-subtext">
            {searchTerm || activeFilters.categories.length > 0 || activeFilters.stockStatus ? 
              'נסה לשנות את הסינון או מונחי החיפוש' : 
              'הוסף מוצרים חדשים כדי להתחיל'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <>
        <table className="inventory-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                שם מוצר{' '}
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
              <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                מלאי נוכחי{' '}
                <FontAwesomeIcon 
                  icon={sortField === 'quantity' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort}
                />
              </th>
              <th>סטטוס מלאי</th>
              <th onClick={() => handleSort('lastModified')} style={{ cursor: 'pointer' }}>
                עדכון אחרון{' '}
                <FontAwesomeIcon 
                  icon={sortField === 'lastModified' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort}
                />
              </th>
              <th>{mode === 'consumption' ? 'כמות לצריכה' : 'כמות חדשה'}</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{categories[product.category] || 'לא מוגדר'}</td>
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
                <td>
                  {product.quantity <= 0 ? (
                    <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>אזל</span>
                  ) : product.quantity < 10 ? (
                    <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>נמוך</span>
                  ) : (
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>תקין</span>
                  )}
                </td>
                <td>
                  {product.lastModified ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                      {new Date(product.lastModified.seconds * 1000).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--secondary-text)' }}>לא עודכן</span>
                  )}
                </td>
                <td>
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      min={mode === 'consumption' ? '1' : '0'}
                      max={mode === 'consumption' ? product.quantity : undefined}
                      className="quantity-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      autoFocus
                    />
                  ) : (
                    <span>--</span>
                  )}
                </td>
                <td className="inventory-actions">
                  {processingIds.has(product.id) ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : editingId === product.id ? (
                    <>
                      <button 
                        onClick={() => handleSave(product.id)} 
                        title="שמור"
                        className="btn btn-sm btn-success"
                        style={{
                            color: 'white',
                            border: '1px solid white',
                            backgroundColor: 'transparent'
                          }}
                      >
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button 
                        onClick={handleCancelEdit} 
                        title="בטל"
                        className="btn btn-sm btn-danger"
                        style={{
                            color: 'white',
                            border: '1px solid white',
                            backgroundColor: 'transparent'
                          }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(product)}
                      title={mode === 'consumption' ? 'רשום צריכה' : 'עדכן מלאי'}
                      className="btn btn-sm btn-primary"
                      disabled={mode === 'consumption' && product.quantity <= 0}
                      style={{
                        color: mode === 'consumption' && product.quantity <= 0 ? 'var(--secondary-text)' : mode === 'consumption' ? '#ffc107' : '#28a745',
                        borderColor: mode === 'consumption' && product.quantity <= 0 ? 'var(--border-color)' : mode === 'consumption' ? '#ffc107' : '#28a745',
                        opacity: mode === 'consumption' && product.quantity <= 0 ? '0.5' : '1',
                        cursor: mode === 'consumption' && product.quantity <= 0 ? 'not-allowed' : 'pointer',
                        backgroundColor: mode === 'consumption' && product.quantity <= 0 ? 'var(--bg-color)' : 'transparent'
                      }}
                    >
                      <FontAwesomeIcon 
                        icon={faEdit}
                        
                      />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      ) : (
        <div className="products-grid">
          {currentProducts.map((product) => (
            <div key={product.id} className="product-card-wrapper">
              <ProductCard
                product={product}
                categoryName={categories[product.category] || 'לא מוגדר'}
                onEdit={() => handleCardAction(product)}
                onAddToCart={() => handleCardAction(product)}
                hidePrice={true}
                mode="consumed-items"
                consumedItemsMode={mode}
                isProcessing={processingIds.has(product.id)}
                disabled={mode === 'consumption' && product.quantity <= 0}
              />
            </div>
          ))}
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
              {viewMode === 'cards' ? 'שורות בעמוד:' : 'פריטים בעמוד:'}
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
                  <option value="25">25</option>
                  <option value="50">50</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumedItems;
