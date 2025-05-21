import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSave, faTimes, faShoppingCart, faBroom, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../styles/ForManager/products.css';

const ShoppingList = () => {
  const [shoppingList, setShoppingList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [useCustomQuantity, setUseCustomQuantity] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [categories, setCategories] = useState({});
  const [budget, setBudget] = useState(0);

  // Handle purchase status change
  const handlePurchaseChange = (id) => {
    const updatedList = shoppingList.map(item => {
      if (item.id === id) {
        return { ...item, purchased: !item.purchased };
      }
      return item;
    });
    setShoppingList(updatedList);
    localStorage.setItem('shoppingList', JSON.stringify(updatedList));
  };  // Fetch budget from Firebase
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const budgetDoc = await getDocs(collection(db, 'budgets'));
        if (!budgetDoc.empty) {
          // Get the latest budget record
          const current = budgetDoc.docs
            .map(doc => ({ ...doc.data(), id: doc.id }))
            .sort((a, b) => b.date - a.date)[0];
          setBudget(current?.totalBudget || 0);
        }
      } catch (error) {
        console.error('Error fetching budget:', error);
        toast.error('שגיאה בטעינת התקציב');
      }
    };

    fetchBudget();
  }, []);

  // Load shopping list from localStorage  // Fetch categories
  useEffect(() => {
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

    fetchCategories();
  }, []);

  useEffect(() => {
    const loadShoppingList = () => {
      const savedList = localStorage.getItem('shoppingList');
      if (savedList) {
        setShoppingList(JSON.parse(savedList));
      }
    };

    loadShoppingList();
    // Add event listener to update list if changed in another tab
    window.addEventListener('storage', loadShoppingList);
    return () => window.removeEventListener('storage', loadShoppingList);
  }, []);
  // Sort shopping list by category
  const sortedShoppingList = [...shoppingList].sort((a, b) => {
    const categoryA = categories[a.category] || 'לא מוגדר';
    const categoryB = categories[b.category] || 'לא מוגדר';
    return categoryA.localeCompare(categoryB);
  });

  // Calculate total price
  const totalPrice = shoppingList.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Handle delete item
  const handleDelete = (id) => {
    const confirmDelete = window.confirm('האם אתה בטוח שברצונך להסיר פריט זה מהרשימה?');
    if (!confirmDelete) return;

    const updatedList = shoppingList.filter(item => item.id !== id);
    setShoppingList(updatedList);
    localStorage.setItem('shoppingList', JSON.stringify(updatedList));
    toast.success('המוצר נמחק בהצלחה');
  };

  // Clear all items
  const handleClearAll = async () => {
    if (shoppingList.length === 0) return;
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את כל המוצרים מהרשימה?');
    if (!confirmed) return;
    setClearing(true);
    // Simulate async for UX, replace with Firestore logic if needed
    setTimeout(() => {
      setShoppingList([]);
      localStorage.setItem('shoppingList', JSON.stringify([]));
      setClearing(false);
      toast.success('הרשימה נוקתה בהצלחה!');
    }, 700);
  };
  // Start editing item
  const handleEdit = (item) => {
    if (item.purchased) {
      toast.warning('לא ניתן לערוך פריט שכבר נרכש');
      return;
    }
    setEditingId(item.id);
    setEditQuantity(item.quantity);
    setUseCustomQuantity(item.quantity > 10);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setUseCustomQuantity(false);
  };

  // Save edited quantity
  const handleSave = (id) => {
    const updatedList = shoppingList.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Number(editQuantity) };
      }
      return item;
    });
    
    setShoppingList(updatedList);
    localStorage.setItem('shoppingList', JSON.stringify(updatedList));
    setEditingId(null);
    setUseCustomQuantity(false);
    toast.success('המוצר עודכן בהצלחה');
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    if (e.target.value === 'other') {
      setUseCustomQuantity(true);
      setEditQuantity('');
    } else {
      setEditQuantity(Number(e.target.value));
    }
  };

  return (
    <div className="inventory-container">
      <div className="page-header justify-content-between d-flex align-items-center mb-3">
        <h1>
          <FontAwesomeIcon icon={faShoppingCart} className="page-header-icon" />
          רשימת קניות
        </h1>
        <button
          className="btn btn-accent"
          style={{ border: '2px solid var(--warning)', color: 'var(--warning)', background: 'transparent', fontWeight: 600, minWidth: 160 }}
          onClick={handleClearAll}
          disabled={shoppingList.length === 0 || clearing}
        >          {clearing ? (
            <FontAwesomeIcon icon={faSpinner} spin style={{ marginLeft: '8px' }} />
          ) : (
            <FontAwesomeIcon icon={faBroom} style={{ marginLeft: '8px' }} />
          )}
          נקה את כל הרשימה
        </button>
      </div>
      
      {shoppingList.length === 0 ? (
        <div className="empty-list">
          <p>רשימת הקניות ריקה</p>
          <p className="empty-list-subtext">הוסף מוצרים מדף המוצרים</p>
        </div>
      ) : (
        <>
          {/* <div className="card"> */}
            <table className="inventory-table">              
              <thead>                
                <tr>
                  <th>נרכש</th>
                  <th>שם מוצר</th>
                  <th>קטגוריה</th>
                  <th>כמות</th>
                  <th>מחיר יחידה</th>
                  <th>מחיר כולל</th>
                  <th>פעולות</th>
                </tr>
              </thead>              
              <tbody>                
                {sortedShoppingList.map(item => (
                  <tr 
                    key={item.id} 
                    style={item.purchased ? { 
                      backgroundColor: '#e8f5e9', 
                      color: '#2e7d32',
                      textDecoration: 'line-through',
                      opacity: 0.8 
                    } : {}}
                  >
                    <td>                      
                      <input
                        type="checkbox"
                        checked={item.purchased || false}
                        onChange={() => handlePurchaseChange(item.id)}
                      />
                    </td>
                    <td>{item.name}</td>
                    <td>{categories[item.category] || 'לא מוגדר'}</td>
                    <td>
                      {editingId === item.id && !item.purchased ? (
                        useCustomQuantity ? (
                          <input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="quantity-input"
                          />
                        ) : (
                          <select 
                            value={editQuantity} 
                            onChange={handleQuantityChange}
                            className="quantity-select"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                            <option value="other">כמות אחרת</option>
                          </select>
                        )
                      ) : (
                        <span className="quantity-display">{item.quantity}</span>
                      )}
                    </td>
                    <td>{item.price.toFixed(2)} ₪</td>
                    <td>{(item.price * item.quantity).toFixed(2)} ₪</td>                    
                    <td className="inventory-actions">
                      {editingId === item.id && !item.purchased ? (
                        <>
                          <button onClick={() => handleSave(item.id)} title="שמור">
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button onClick={handleCancelEdit} title="בטל">
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEdit(item)} 
                            title="ערוך כמות"
                            disabled={item.purchased}
                            style={item.purchased ? { color: '#ccc', cursor: 'not-allowed' } : {}}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            title="הסר"
                            disabled={item.purchased}
                            style={item.purchased ? { color: '#ccc', cursor: 'not-allowed' } : {}}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          {/* </div>             */}
          <div className="shopping-list-total card" style={{ textAlign: 'center', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem' }}>
              <h3 style={{ color: totalPrice > budget ? 'var(--danger)' : 'inherit' }}>
                סה"כ: {totalPrice.toFixed(2)} ₪
              </h3>
              <h3>
                תקציב: {budget.toFixed(2)} ₪
              </h3>
              <h3 style={{ color: totalPrice > budget ? 'var(--danger)' : 'var(--success)' }}>
                {totalPrice > budget ? 'חריגה מהתקציב' : `נותר: ${(budget - totalPrice).toFixed(2)} ₪`}
              </h3>
            </div>
        </>
      )}
    </div>
  );
};

export default ShoppingList; 