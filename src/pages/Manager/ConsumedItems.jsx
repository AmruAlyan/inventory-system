import React, { useState, useEffect } from 'react';
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
  faPenToSquare
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { collection, getDocs, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../styles/ForManager/products.css';
import Spinner from '../../components/Spinner';

const ConsumedItems = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('consumption'); // 'consumption' or 'stocktaking'
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesMap = {};
        categoriesSnapshot.docs.forEach(doc => {
          categoriesMap[doc.id] = doc.data().name;
        });
        setCategories(categoriesMap);

        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    const categoryName = categories[product.category] || '';
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           categoryName.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        quantity: newQuantity
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
        p.id === productId ? { ...p, quantity: newQuantity } : p
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
        quantity: newQuantity
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
        p.id === productId ? { ...p, quantity: newQuantity } : p
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--panel-bg)', borderRadius: '8px', border: '2px solid var(--primary)' }}>
          <span style={{ fontWeight: mode === 'consumption' ? 'bold' : 'normal', color: mode === 'consumption' ? 'var(--primary)' : 'var(--secondary-text)' }}>
            צריכה
          </span>
          <button
            onClick={toggleMode}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--primary)' }}
            title={mode === 'consumption' ? 'עבור למצב ספירת מלאי' : 'עבור למצב צריכה'}
          >
            <FontAwesomeIcon icon={mode === 'consumption' ? faToggleOn : faToggleOff} />
          </button>
          <span style={{ fontWeight: mode === 'stocktaking' ? 'bold' : 'normal', color: mode === 'stocktaking' ? 'var(--primary)' : 'var(--secondary-text)' }}>
            ספירת מלאי
          </span>
        </div>
      </div>

      {/* Mode Description */}
      <div style={{ 
        padding: '1rem', 
        marginBottom: '1rem', 
        background: mode === 'consumption' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(40, 167, 69, 0.1)', 
        border: `2px solid ${mode === 'consumption' ? 'var(--warning)' : 'var(--success)'}`,
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        {mode === 'consumption' ? (
          <p style={{ margin: 0, color: 'var(--warning)' }}>
            <strong>מצב צריכה:</strong> הזן את הכמות שנצרכה מהמוצר. הכמות תופחת מהמלאי הקיים.
          </p>
        ) : (
          <p style={{ margin: 0, color: 'var(--success)' }}>
            <strong>מצב ספירת מלאי:</strong> הזן את הכמות הנוכחית במלאי. המלאי יעודכן לכמות שהזנת.
          </p>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <Spinner />
      ) : filteredProducts.length === 0 ? (
        <div className="empty-list">
          <p>לא נמצאו מוצרים</p>
          <p className="empty-list-subtext">
            {searchTerm ? 'נסה לשנות את מונחי החיפוש' : 'הוסף מוצרים חדשים כדי להתחיל'}
          </p>
        </div>
      ) : (
        <>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>שם מוצר</th>
              <th>קטיגוריה</th>
              <th>מלאי נוכחי</th>
              <th>סטטוס מלאי</th>
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
                      >
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button 
                        onClick={handleCancelEdit} 
                        title="בטל"
                        className="btn btn-sm btn-danger"
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

export default ConsumedItems;
