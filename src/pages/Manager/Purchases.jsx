import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faSave, faEdit, faTimes, faHistory, faEye } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/firebase';
import '../../styles/ForManager/products.css';
import '../../styles/ForModals/PurchaseModal.css'
import PurchaseModal from '../../components/Modals/PurchaseModal';
import Spinner from '../../components/Spinner';

const Purchases = () => {
  const [currentPurchase, setCurrentPurchase] = useState({ items: [] });
  const [categories, setCategories] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(true);


  // Subscribe to current purchase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'purchases', 'current'),
      (doc) => {
        setLoading(false);
        if (doc.exists()) {
          setCurrentPurchase(doc.data() || { items: [] });
        } else {
          // Initialize current purchase document if it doesn't exist
          setDoc(doc(db, 'purchases', 'current'), { items: [] });
        }
      },
      (error) => {
        setLoading(false);
        console.error('Error fetching current purchase:', error);
        toast.error('שגיאה בטעינת הרכישה הנוכחית');
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to purchase history
  useEffect(() => {
    if (showHistory) {
      const unsubscribe = onSnapshot(
        collection(db, 'purchases/history/items'),
        (snapshot) => {
          const historyData = snapshot.docs.map(doc => ({
            id: doc.id,
            items: [],  // Default empty array
            totalAmount: 0, // Default amount
            ...doc.data()
          }));
          setPurchaseHistory(historyData.sort((a, b) => b.date - a.date));
        }
      );
      return () => unsubscribe();
    }
  }, [showHistory]);

  // Add fetchCategories useEffect after the existing useEffects
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
        toast.error('שגיאה בטעינת הקטגוריות');
      }
    };

    fetchCategories();
  }, []);

  // --- Add cancel and save logic for price editing ---
const handleEditPrice = (item) => {
  setEditingId(item.id);
  setEditPrice(item.price);
};

const handleCancelEdit = () => {
  setEditingId(null);
  setEditPrice('');
};

const handleSavePrice = async (itemId) => {
  try {
    // Update price in purchases/current
    const currentDoc = doc(db, 'purchases', 'current');
    const currentData = await getDoc(currentDoc);
    let productId = null;
    if (currentData.exists()) {
      const items = currentData.data().items.map(item => {
        if (item.id === itemId) {
          productId = item.id;
          return { ...item, price: Number(editPrice) };
        }
        return item;
      });
      await updateDoc(currentDoc, { items });
    }
    // Update price in products collection
    if (productId) {
      const productDoc = doc(db, 'products', productId);
      await updateDoc(productDoc, { price: Number(editPrice) });
    }
    setEditingId(null);
    setEditPrice('');
    toast.success('המחיר עודכן בהצלחה');
  } catch (error) {
    console.error('Error updating price:', error);
    toast.error('שגיאה בעדכון המחיר');
  }
};

  // Save final purchase
  const handleSavePurchase = async () => {
  if (!currentPurchase.items || currentPurchase.items.length === 0) {
    toast.warning('אין פריטים לשמירה');
    return;
  }

  const confirmed = window.confirm('האם אתה בטוח שברצונך לשמור את הרכישה?');
  if (!confirmed) return;

  try {
    const batch = writeBatch(db);
    const purchaseId = Date.now().toString();

    // Calculate total purchase amount
    const purchaseAmount = currentPurchase.items.reduce((sum, item) => 
      sum + (item.actualPrice * item.quantity), 0
    );

    // Get current budget
    const budgetSnapshot = await getDocs(collection(db, 'budgets'));
    if (budgetSnapshot.empty) {
      throw new Error('לא נמצא תקציב במערכת');
    }

    // Get latest budget document
    const latestBudget = budgetSnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .sort((a, b) => b.date - a.date)[0];

    if (latestBudget.totalBudget < purchaseAmount) {
      toast.error('חריגה מהתקציב! לא ניתן לשמור את הרכישה');
      return;
    }

    // Update budget
    const budgetRef = doc(db, 'budgets', latestBudget.id);
    batch.update(budgetRef, {
      totalBudget: latestBudget.totalBudget - purchaseAmount
    });

    // Add to purchase history
    const historyDoc = doc(db, 'purchases/history/items', purchaseId);
    batch.set(historyDoc, {
      date: Date.now(),
      items: currentPurchase.items,
      totalAmount: purchaseAmount,
      budgetBefore: latestBudget.totalBudget,
      budgetAfter: latestBudget.totalBudget - purchaseAmount
    });

    // Clear current purchase
    batch.update(doc(db, 'purchases', 'current'), { items: [] });

    // Delete items from shopping list
    currentPurchase.items.forEach(item => {
      batch.delete(doc(db, 'sharedShoppingList', 'globalList', 'items', item.id));
    });

    await batch.commit();
    toast.success('הרכישה נשמרה בהצלחה והתקציב עודכן!');
  } catch (error) {
    console.error('Error saving purchase:', error);
    toast.error(error.message || 'שגיאה בשמירת הרכישה');
  }
};

// Add the handleViewPurchaseDetails function
const handleViewPurchaseDetails = (purchase) => {
  setSelectedPurchase(purchase);
};

// Handle receipt upload
const handleReceiptUpload = async (file, purchaseId) => {
  try {
    // Create a reference to the storage location
    const storageRef = ref(storage, `receipts/${purchaseId}/${file.name}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update the purchase document with the receipt URL
    await updateDoc(doc(db, 'purchases/history/items', purchaseId), {
      receiptURL: downloadURL,
      receiptName: file.name,
      uploadedAt: Date.now()
    });

    toast.success('הקבלה הועלתה בהצלחה');
  } catch (error) {
    console.error('Error uploading receipt:', error);
    toast.error('שגיאה בהעלאת הקבלה');
  }
};

  return (
    <div className="inventory-container">      {selectedPurchase && (
        <PurchaseModal 
          purchase={selectedPurchase}
          categories={categories}
          onClose={() => setSelectedPurchase(null)}
          onReceiptUpload={handleReceiptUpload}
        />
      )}
      <div className="page-header justify-content-between d-flex align-items-center mb-3">
        <h1>
          <FontAwesomeIcon icon={faShoppingBag} className="page-header-icon" />
          רשימת רכישות
        </h1>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowHistory(!showHistory)}
        >
          <FontAwesomeIcon icon={faHistory} style={{ marginLeft: '8px' }} />
          {showHistory ? 'הצג רכישה נוכחית' : 'הצג היסטוריה'}
        </button>
      </div>

      {showHistory ? (
        loading ? (
          <Spinner />
        ) : purchaseHistory.length === 0 ? (
          <div className="empty-list">
            <p>אין היסטוריית רכישות</p>
            <p className="empty-list-subtext">רכישות שנשמרו יופיעו כאן</p>
          </div>
        ) : (
          <>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>תאריך רכישה</th>
                  <th>מספר פריטים</th>
                  <th>סה"כ רכישה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map(purchase => (
                  <tr key={purchase.id}>
                    <td>{new Date(purchase.date).toLocaleDateString('he-IL')}</td>
                    <td>{purchase.items?.length || 0}</td>
                    <td>{purchase.totalAmount?.toFixed(2) || '0.00'} ₪</td>
                    <td className='purchases-actions'>
                      <button onClick={() => handleViewPurchaseDetails(purchase)} title="צפה בפרטים">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="purchase-summary card">
              <h3>סה"כ רכישות: {purchaseHistory.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)} ₪</h3>
            </div>
          </>
        )
      ) : (
        loading ? (
          <Spinner />
        ) : (!currentPurchase.items || currentPurchase.items.length === 0) ? (
          <div className="empty-list">
            <p>אין פריטים ברכישה הנוכחית</p>
            <p className="empty-list-subtext">סמן פריטים כנרכשו ברשימת הקניות</p>
          </div>
        ) : (
          <>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>שם מוצר</th>
                  <th>קטגוריה</th>
                  <th>כמות</th>
                  <th>מחיר</th>
                  <th>סה"כ</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {currentPurchase.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{categories[item.category] || 'לא מוגדר'}</td>
                    <td>{item.quantity}</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="price-input"
                          step="0.01"
                          min="0"
                          style={{ textAlign: 'center', margin: '0 auto', display: 'block', maxWidth: 100 }}
                          autoFocus
                        />
                      ) : (
                        `${item.price?.toFixed(2) || 0} ₪`
                      )}
                    </td>
                    <td>{((editingId === item.id ? Number(editPrice) : item.price) * item.quantity).toFixed(2)} ₪</td>
                    <td className="inventory-actions">
                      {editingId === item.id ? (
                        <>
                          <button onClick={() => handleSavePrice(item.id)} title="שמור" className="btn btn-sm btn-success">
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button onClick={handleCancelEdit} title="בטל" className="btn btn-sm btn-danger">
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </>
                      ) : (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEditPrice(item)}
                          title="ערוך מחיר"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="purchase-summary card">
              <div className="d-flex justify-content-between align-items-center" style={{ margin: '1rem' }}>
                <h3>
                  סה"כ רכישה: {currentPurchase.items.reduce((sum, item) => 
                    sum + (item.actualPrice * item.quantity), 0).toFixed(2)} ₪
                </h3>
                <button
                  className="btn btn-primary"
                  onClick={handleSavePurchase}
                >
                  <FontAwesomeIcon icon={faSave} style={{ marginLeft: '8px' }} />
                  שמור רכישה
                </button>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default Purchases;