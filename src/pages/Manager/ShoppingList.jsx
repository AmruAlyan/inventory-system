import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSave, faTimes, faShoppingCart, faBroom, faSpinner, faCheckSquare, faPrint } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { showConfirm } from '../../utils/dialogs';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useData } from '../../context/DataContext';
import '../../styles/ForManager/products.css';
import Spinner from '../../components/Spinner';

const ShoppingList = () => {
  const { categories } = useData();
  const [shoppingList, setShoppingList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [useCustomQuantity, setUseCustomQuantity] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  // Subscribe to shopping list changes
  useEffect(() => {
    setLoading(true);
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
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        console.error('Error fetching shopping list:', error);
        toast.error('שגיאה בטעינת רשימת הקניות');
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePurchaseChange = async (id) => {
    // Find the item in current state
    const item = shoppingList.find(item => item.id === id);
    if (!item) {
      toast.error('פריט לא נמצא ברשימה');
      return;
    }

    const originalPurchased = item.purchased;
    const newPurchased = !originalPurchased;

    // Optimistic update - immediately update local state
    setShoppingList(prevList => 
      prevList.map(listItem => 
        listItem.id === id 
          ? { ...listItem, purchased: newPurchased }
          : listItem
      )
    );

    try {
      const itemRef = doc(db, 'sharedShoppingList', 'globalList', 'items', id);
      
      // Update item purchase status in Firestore
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

    } catch (error) {
      console.error('Error updating purchase status:', error);
      
      // Revert optimistic update on error
      setShoppingList(prevList => 
        prevList.map(listItem => 
          listItem.id === id 
            ? { ...listItem, purchased: originalPurchased }
            : listItem
        )
      );
      
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
  // Remove local categories state and fetching, use context
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
    const confirmed = await showConfirm(
      'האם אתה בטוח שברצונך להסיר פריט זה מהרשימה?',
      'הסרת פריט'
    );
    
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'sharedShoppingList', 'globalList', 'items', id));
        toast.success('המוצר נמחק בהצלחה');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('שגיאה במחיקת המוצר');
      }
    }
  };

  // Clear all items
  const handleClearAll = async () => {
    if (shoppingList.length === 0) return;
    
    const confirmed = await showConfirm(
      'האם אתה בטוח שברצונך למחוק את כל המוצרים מהרשימה?',
      'ניקוי רשימה'
    );
    
    if (confirmed) {
      setClearing(true);
      try {
        const batch = writeBatch(db);
        
        // Add all items to the batch delete operation
        shoppingList.forEach(item => {
          const docRef = doc(db, 'sharedShoppingList', 'globalList', 'items', item.id);
          batch.delete(docRef);
        });
        
        // Commit the batch
        await batch.commit();
        
        toast.success('רשימת הקניות נוקתה בהצלחה');
      } catch (error) {
        console.error('Error clearing shopping list:', error);
        toast.error('שגיאה בניקוי רשימת הקניות');
      } finally {
        setClearing(false);
      }
    }
  };

  // Mark all items as purchased
  const handleCheckAll = async () => {
    // Find all unpurchased items
    const unpurchasedItems = shoppingList.filter(item => !item.purchased);
    
    if (unpurchasedItems.length === 0) {
      toast.info('כל הפריטים כבר מסומנים כנרכשים');
      return;
    }
    
    const confirmed = await showConfirm(
      `האם אתה בטוח שברצונך לסמן ${unpurchasedItems.length} פריטים כנרכשים?`,
      'סימון פריטים כנרכשים'
    );
    
    if (confirmed) {
      setCheckingAll(true);
      try {
        const batch = writeBatch(db);
        const currentTime = Date.now();        
        // Get reference to current purchase document
        const currentPurchaseRef = doc(db, 'purchases', 'current');
        const currentPurchaseDoc = await getDoc(currentPurchaseRef);
        
        let purchaseItems = [];
        if (currentPurchaseDoc.exists()) {
          purchaseItems = currentPurchaseDoc.data().items || [];
        }
        
        // Process each unpurchased item
        for (const item of unpurchasedItems) {
          // Update shopping list item
          const itemRef = doc(db, 'sharedShoppingList', 'globalList', 'items', item.id);
          batch.update(itemRef, { 
            purchased: true,
            purchaseDate: currentTime
          });
          
          // Add to purchases tracking
          purchaseItems.push({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price,
            actualPrice: item.price, // Default to original price
            checkedAt: currentTime
          });
        }
        
        // Update current purchase document
        batch.set(currentPurchaseRef, { 
          items: purchaseItems,
          lastUpdated: currentTime
        });
        
        // Commit all the changes
        await batch.commit();
        
        toast.success('כל הפריטים סומנו כנרכשים בהצלחה');
      } catch (error) {
        console.error('Error marking all items as purchased:', error);
        toast.error('שגיאה בסימון הפריטים כנרכשים');
      } finally {
        setCheckingAll(false);
      }
    }
  };

  // Print shopping list
  const handlePrint = () => {
    if (shoppingList.length === 0) {
      toast.info('רשימת הקניות ריקה - אין מה להדפיס');
      return;
    }

    const printWindow = window.open('', '_blank');
    const unpurchasedItems = shoppingList.filter(item => !item.purchased);
    const purchasedItems = shoppingList.filter(item => item.purchased);
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: white;
            color: black;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            color: #2e7d32;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            background-color: #f5f5f5;
            padding: 10px;
            margin: 20px 0 10px 0;
            border-right: 4px solid #2e7d32;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f9f9f9;
            font-weight: bold;
          }
          .total-section {
            background-color: #f0f8f0;
            padding: 15px;
            border: 2px solid #2e7d32;
            border-radius: 5px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total-row strong {
            font-size: 18px;
          }
          .purchased-item {
            background-color: #e8f5e9;
            opacity: 0.7;
          }
          .checkbox-column {
            width: 30px;
            text-align: center;
          }
          .print-date {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
              width: 100%;
              max-width: 100%; /* Changed from none to 100% */
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              overflow: visible; /* Ensure all content is visible */
            }
            .no-print { display: none; }
            .header {
              margin-bottom: 20px;
              padding-bottom: 15px;
              width: 100%;
            }
            table {
              width: 100%;
              font-size: 10px; /* Adjusted font size for better fit */
              table-layout: fixed;
            }
            th, td {
              padding: 5px 3px; /* Adjusted padding */
              font-size: 9px;  /* Adjusted font size for better fit */
              word-wrap: break-word;
            }
            .checkbox-column {
              width: 30px; /* Adjusted checkbox column width */
            }
            .total-section {
              margin-top: 15px;
              padding: 8px;
              width: 100%;
              box-sizing: border-box;
            }
            .total-row strong {
              font-size: 12px; /* Adjusted font size */
            }
            .section {
              width: 100%;
              margin-bottom: 15px;
            }
            .section h2 {
              margin: 10px 0 5px 0;
              padding: 6px;
              font-size: 12px; /* Adjusted font size */
              width: 100%;
              box-sizing: border-box;
            }
            .print-date {
              margin-top: 10px;
              font-size: 9px; /* Adjusted font size */
              width: 100%;
              
            }
            * {
              box-sizing: border-box;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>רשימת קניות</h1>
          <p> עמותת ותיקי מטה יהודה</p>
          <p>תאריך הדפסה: ${new Date().toLocaleDateString('he-IL')}</p>
        </div>

        ${unpurchasedItems.length > 0 ? `
        <div class="section">
          <h2>פריטים לרכישה (${unpurchasedItems.length})</h2>
          <table>
            <thead>
              <tr>
                <th class="checkbox-column">✓</th>
                <th>שם מוצר</th>
                <th>קטגוריה</th>
                <th>כמות</th>
                <th>מחיר יחידה</th>
                <th>מחיר כולל</th>
              </tr>
            </thead>
            <tbody>
              ${unpurchasedItems.map(item => `
                <tr>
                  <td class="checkbox-column">☐</td>
                  <td>${item.name}</td>
                  <td>${categories[item.category] || 'לא מוגדר'}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(2)} ₪</td>
                  <td>${(item.price * item.quantity).toFixed(2)} ₪</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${purchasedItems.length > 0 ? `
        <div class="section">
          <h2>פריטים שנרכשו (${purchasedItems.length})</h2>
          <table>
            <thead>
              <tr>
                <th class="checkbox-column">✓</th>
                <th>שם מוצר</th>
                <th>קטגוריה</th>
                <th>כמות</th>
                <th>מחיר יחידה</th>
                <th>מחיר כולל</th>
              </tr>
            </thead>
            <tbody>
              ${purchasedItems.map(item => `
                <tr class="purchased-item">
                  <td class="checkbox-column">☑</td>
                  <td>${item.name}</td>
                  <td>${categories[item.category] || 'לא מוגדר'}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(2)} ₪</td>
                  <td>${(item.price * item.quantity).toFixed(2)} ₪</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="total-section">
          <div class="total-row">
            <span>סה"כ לרכישה:</span>
            <strong>${unpurchasedItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)} ₪</strong>
          </div>
          <div class="total-row">
            <span>סה"כ כללי:</span>
            <strong>${totalPrice.toFixed(2)} ₪</strong>
          </div>
          <div class="total-row">
            <span>תקציב:</span>
            <strong>${budget.toFixed(2)} ₪</strong>
          </div>
          <div class="total-row">
            <span>יתרה:</span>
            <strong style="color: ${(budget - unpurchasedItems.reduce((total, item) => total + (item.price * item.quantity), 0)) >= 0 ? '#2e7d32' : '#d32f2f'}">${(budget - unpurchasedItems.reduce((total, item) => total + (item.price * item.quantity), 0)).toFixed(2)} ₪</strong>
          </div>
        </div>

        <div class="print-date">
          הודפס ב: ${new Date().toLocaleString('he-IL')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait a bit for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-info"
            style={{ border: '2px solid var(--info)', color: 'var(--info)', background: 'transparent', fontWeight: 600, minWidth: 160 }}
            onClick={handlePrint}
            disabled={shoppingList.length === 0}
          >
            <FontAwesomeIcon icon={faPrint} style={{ marginLeft: '8px' }} />
            הדפס רשימה
          </button>
          <button
            className="btn btn-success"
            style={{ border: '2px solid var(--success)', color: 'var(--success)', background: 'transparent', fontWeight: 600, minWidth: 160 }}
            onClick={handleCheckAll}
            disabled={shoppingList.length === 0 || checkingAll || shoppingList.filter(item => !item.purchased).length === 0}
          >
            {checkingAll ? (
              <FontAwesomeIcon icon={faSpinner} spin style={{ marginLeft: '8px' }} />
            ) : (
              <FontAwesomeIcon icon={faCheckSquare} style={{ marginLeft: '8px' }} />
            )}
            סמן הכל כנרכש
          </button>
          <button
            className="btn btn-danger"
            style={{ border: '2px solid var(--danger)', color: 'var(--danger)', background: 'transparent', fontWeight: 600, minWidth: 160 }}
            onClick={handleClearAll}
            disabled={shoppingList.length === 0 || clearing}
          >
            {clearing ? (
              <FontAwesomeIcon icon={faSpinner} spin style={{ marginLeft: '8px' }} />
            ) : (
              <FontAwesomeIcon icon={faBroom} style={{ marginLeft: '8px' }} />
            )}
            נקה את כל הרשימה
          </button>
        </div>
      </div>
      
      {(loading || clearing || checkingAll) && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <Spinner text={clearing ? 'מנקה את הרשימה...' : checkingAll ? 'מסמן פריטים כנרכשים...' : 'טוען נתונים...'} />
        </div>
      )}
      {!loading && !clearing && !checkingAll && shoppingList.length === 0 ? (
        <div className="empty-list">
          <p>רשימת הקניות ריקה</p>
          <p className="empty-list-subtext">הוסף מוצרים מדף המוצרים</p>
        </div>
      ) : !loading && !clearing && !checkingAll && (
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
          {clearing && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <Spinner />
        </div>
      )}
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