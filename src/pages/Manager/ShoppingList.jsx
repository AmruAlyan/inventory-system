import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSave, faTimes, faShoppingCart, faBroom, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../styles/ForManager/products.css';

const ShoppingList = () => {  const [shoppingList, setShoppingList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [useCustomQuantity, setUseCustomQuantity] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [categories, setCategories] = useState({});
  const [budget, setBudget] = useState(0);

  // Subscribe to shopping list changes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(doc(db, 'sharedShoppingList', 'globalList'), 'items'),
      async (snapshot) => {
        const items = [];
        for (const doc of snapshot.docs) {
          const itemData = doc.data();
          // Fetch the referenced product data
          const productDoc = await getDoc(itemData.productRef);
          if (productDoc.exists()) {
            const productData = productDoc.data();
            items.push({
              id: doc.id,
              quantity: itemData.quantity,
              purchased: itemData.purchased || false,
              purchaseDate: itemData.purchaseDate,
              name: productData.name,
              category: productData.category,
              price: productData.price,
            });
          }
        }
        setShoppingList(items);
      },
      (error) => {
        console.error('Error fetching shopping list:', error);
        toast.error('שגיאה בטעינת רשימת הקניות');
      }
    );

    return () => unsubscribe();
  }, []);
  
  // Handle purchase status change
  // const handlePurchaseChange = async (id) => {
  //   try {
  //     const itemRef = doc(db, 'sharedShoppingList', 'globalList', 'items', id);
  //     const itemDoc = await getDoc(itemRef);
      
  //     if (itemDoc.exists()) {
  //       const newPurchased = !itemDoc.data().purchased;
  //       await updateDoc(itemRef, { 
  //         purchased: newPurchased,
  //         purchaseDate: newPurchased ? Date.now() : null
  //       });

  //       // If item is purchased, add to purchases collection
  //       if (newPurchased) {
  //         const item = shoppingList.find(item => item.id === id);
  //         if (item) {
  //           await setDoc(doc(db, 'purchases', id), {
  //             ...item,
  //             purchaseDate: Date.now()
  //           });
  //         }
  //       }

  //       toast.success(newPurchased ? 'המוצר סומן כנרכש' : 'המוצר סומן כלא נרכש');
  //     }
  //   } catch (error) {
  //     console.error('Error updating purchase status:', error);
  //     toast.error('שגיאה בעדכון סטטוס הרכישה');
  //   }
  // };

  const handlePurchaseChange = async (id) => {
    try {
      const itemRef = doc(db, 'sharedShoppingList', 'globalList', 'items', id);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        const newPurchased = !itemDoc.data().purchased;
        
        // Get the item from current shopping list state
        const item = shoppingList.find(item => item.id === id);
        if (!item) {
          throw new Error('Item not found in shopping list');
        }

        // Update item purchase status in shopping list
        await updateDoc(itemRef, { 
          purchased: newPurchased,
        });

        // Get reference to current purchase document
        const currentPurchaseRef = doc(db, 'purchases', 'current');
        const currentPurchaseDoc = await getDoc(currentPurchaseRef);
        
        if (newPurchased) {
          // If item is being checked (purchased)
          const purchaseData = {
            items: []
          };

          if (currentPurchaseDoc.exists()) {
            // Add new item to existing items array
            const existingItems = currentPurchaseDoc.data().items || [];
            purchaseData.items = [
              ...existingItems,
              {
                id: item.id,
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                price: item.price,
                actualPrice: item.price, // Default to original price
                checkedAt: Date.now()
              }
            ];
          } else {
            // Create new items array with first item
            purchaseData.items = [{
              id: item.id,
              name: item.name,
              category: item.category,
              categoryName: categories[item.category] || 'לא מוגדר',
              quantity: item.quantity,
              price: item.price,
              actualPrice: item.price,
              checkedAt: Date.now()
            }];
          }

          // Set or update the current purchase document
          await setDoc(currentPurchaseRef, purchaseData, { merge: true });

        } else {
          // If item is being unchecked (removed from purchase)
          if (currentPurchaseDoc.exists()) {
            const existingItems = currentPurchaseDoc.data().items || [];
            await updateDoc(currentPurchaseRef, {
              items: existingItems.filter(item => item.id !== id)
            });
          }
        }

        toast.success(newPurchased ? 'המוצר סומן כנרכש' : 'המוצר סומן כלא נרכש');
      }
    } catch (error) {
      console.error('Error updating purchase status:', error);
      toast.error('שגיאה בעדכון סטטוס הרכישה');
    }
  };
  
  // Fetch budget from Firebase
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

  // useEffect(() => {
  //   const loadShoppingList = () => {
  //     const savedList = localStorage.getItem('shoppingList');
  //     if (savedList) {
  //       setShoppingList(JSON.parse(savedList));
  //     }
  //   };

  //   loadShoppingList();
  //   // Add event listener to update list if changed in another tab
  //   window.addEventListener('storage', loadShoppingList);
  //   return () => window.removeEventListener('storage', loadShoppingList);
  // }, []);
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
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('האם אתה בטוח שברצונך להסיר פריט זה מהרשימה?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'sharedShoppingList', 'globalList', 'items', id));
      toast.success('המוצר נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('שגיאה במחיקת המוצר');
    }
  };

  // Clear all items
  const handleClearAll = async () => {
  if (shoppingList.length === 0) return;
  
  const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את כל המוצרים מהרשימה?');
  if (!confirmed) return;

  setClearing(true);
  try {
    const batch = writeBatch(db);
    const itemsRef = collection(doc(db, 'sharedShoppingList', 'globalList'), 'items');
    const snapshot = await getDocs(itemsRef);
    
    // Only delete unpurchased items
    snapshot.docs.forEach(doc => {
      const item = doc.data();
      if (!item.purchased) {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();
    toast.success('הרשימה נוקתה בהצלחה!');
  } catch (error) {
    console.error('Error clearing shopping list:', error);
    toast.error('שגיאה בניקוי הרשימה');
  } finally {
    setClearing(false);
  }
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
  const handleSave = async (id) => {
    try {
      await updateDoc(doc(db, 'sharedShoppingList', 'globalList', 'items', id), {
        quantity: Number(editQuantity)
      });
      setEditingId(null);
      setUseCustomQuantity(false);
      toast.success('הכמות עודכנה בהצלחה');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('שגיאה בעדכון הכמות');
    }
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