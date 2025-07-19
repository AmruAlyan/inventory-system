import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faSave, faEdit, faTimes, faHistory, faEye, faCartPlus, faFileAlt, faCloudUploadAlt, faReceipt, faCheckCircle, faSort, faSortUp, faSortDown, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch, updateDoc, getDoc, Timestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/firebase';
import { formatDate } from '../../utils/timestampUtils';
import '../../styles/ForManager/products.css';
import PurchaseModal from '../../components/Modals/PurchaseModal';
import SavePurchaseModal from '../../components/Modals/SavePurchaseModal';
import ReceiptUploadModal from '../../components/Modals/ReceiptUploadModal';
import DeletePurchaseModal from '../../components/Modals/DeletePurchaseModal';
import Spinner from '../../components/Spinner';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const Purchases = () => {
  const { categories } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPurchase, setCurrentPurchase] = useState({ items: [] });
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [dragActive, setDragActive] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptPurchase, setSelectedReceiptPurchase] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  
  // Sorting state for current purchase table
  const [currentPurchaseSortField, setCurrentPurchaseSortField] = useState('name');
  const [currentPurchaseSortDirection, setCurrentPurchaseSortDirection] = useState('asc');
  
  // Pagination state for purchase history
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Get saved value from localStorage, default to 10
    const saved = localStorage.getItem('purchaseHistoryItemsPerPage');
    return saved ? parseInt(saved) : 10;
  });


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

  // --- Add cancel and save logic for price editing ---
const handleEditPrice = (item) => {
  // Use id as the unique identifier for editing
  setEditingId(item.id);
  setEditPrice(item.price);
};

const handleCancelEdit = () => {
  setEditingId(null);
  setEditPrice('');
};

const handleSavePrice = async (productId) => {
  try {
    // Update price in purchases/current
    const currentDoc = doc(db, 'purchases', 'current');
    const currentData = await getDoc(currentDoc);
    if (currentData.exists()) {
      const items = currentData.data().items.map(item => {
        if (item.id === productId) {
          return { ...item, price: Number(editPrice) };
        }
        return item;
      });
      await updateDoc(currentDoc, { items });
    }
    
    // Note: We can no longer directly update the product price in the products collection
    // since we don't have the product ID. This is actually better for data integrity
    // as it prevents accidental price changes in the main product catalog.
    
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

    // Show the save modal (no receipt requirement here)
    setShowSaveModal(true);
  };

  // Actually save the purchase with required receipt
  const confirmSavePurchase = async () => {
    // Check if receipt is required before proceeding
    if (!receiptFile) {
      toast.warning('נדרשת העלאת קבלה לפני שמירת הרכישה');
      return;
    }

    setUploadingReceipt(true);
    
    try {
      const batch = writeBatch(db);
      const purchaseId = Date.now().toString();

      // Calculate total purchase amount
      const purchaseAmount = currentPurchase.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
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

      // Update budget
      const budgetRef = doc(db, 'budgets', latestBudget.id);
      batch.update(budgetRef, {
        totalBudget: latestBudget.totalBudget - purchaseAmount
      });

      // Prepare purchase data
      const purchaseData = {
        date: Timestamp.fromDate(new Date()),
        items: currentPurchase.items,
        totalAmount: purchaseAmount,
        budgetBefore: latestBudget.totalBudget,
        budgetAfter: latestBudget.totalBudget - purchaseAmount
      };

      // Upload receipt if provided
      if (receiptFile) {
        try {
          const storageRef = ref(storage, `receipts/${purchaseId}/${receiptFile.name}`);
          await uploadBytes(storageRef, receiptFile);
          const downloadURL = await getDownloadURL(storageRef);
          
          purchaseData.receiptURL = downloadURL;
          purchaseData.receiptName = receiptFile.name;
          purchaseData.uploadedAt = Timestamp.fromDate(new Date());
        } catch (receiptError) {
          console.warn('Receipt upload failed, but continuing with purchase save:', receiptError);
          toast.warning('הרכישה נשמרה אך הייתה בעיה בהעלאת הקבלה');
        }
      }

      // Add to purchase history
      await addDoc(collection(db, 'purchases/history/items'), purchaseData);

      // Update product quantities (increase stock for purchased items)
      // Note: Since we no longer have product IDs in the purchase items,
      // we need to find products by name. This is less efficient but more robust.
      for (const item of currentPurchase.items) {
        try {
          // Find product by name
          const productsSnapshot = await getDocs(collection(db, 'products'));
          const matchingProduct = productsSnapshot.docs.find(doc => 
            doc.data().name === item.name
          );
          
          if (matchingProduct) {
            const productRef = doc(db, 'products', matchingProduct.id);
            const currentQuantity = matchingProduct.data().quantity || 0;
            const newQuantity = currentQuantity + item.quantity;
            
            batch.update(productRef, {
              quantity: newQuantity,
              lastModified: Timestamp.fromDate(new Date())
            });
          }
        } catch (error) {
          console.warn(`Could not update quantity for product: ${item.name}`, error);
        }
      }

      // Clear current purchase
      batch.update(doc(db, 'purchases', 'current'), { items: [] });

      // Delete items from shopping list by finding them by product reference
      // Get all shopping list items to find which ones match our purchased products
      const shoppingListSnapshot = await getDocs(
        collection(doc(db, 'sharedShoppingList', 'globalList'), 'items')
      );
      
      for (const item of currentPurchase.items) {
        if (item.id) {
          // Find shopping list items that reference this product
          shoppingListSnapshot.docs.forEach(shoppingListDoc => {
            const shoppingListItem = shoppingListDoc.data();
            if (shoppingListItem.productRef?.id === item.id) {
              batch.delete(doc(db, 'sharedShoppingList', 'globalList', 'items', shoppingListDoc.id));
            }
          });
        }
      }

      await batch.commit();
      
      // Reset modal state
      setShowSaveModal(false);
      setReceiptFile(null);
      // Reset file input
      const fileInput = document.getElementById('receipt-file-input');
      if (fileInput) fileInput.value = '';
      
      toast.success('הרכישה נשמרה בהצלחה והתקציב עודכן!');
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast.error(error.message || 'שגיאה בשמירת הרכישה');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Handle receipt file selection
  const handleReceiptFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('ניתן להעלות רק תמונות (JPG, PNG, GIF) או קבצי PDF');
        event.target.value = '';
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('גודל הקובץ חייב להיות קטן מ-10MB');
        event.target.value = '';
        return;
      }
      
      setReceiptFile(file);
    }
  };

  // Remove selected receipt file
  const handleRemoveReceiptFile = () => {
    setReceiptFile(null);
    // Reset file input
    const fileInput = document.getElementById('receipt-file-input');
    if (fileInput) fileInput.value = '';
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('ניתן להעלות רק תמונות (JPG, PNG, GIF) או קבצי PDF');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('גודל הקובץ חייב להיות קטן מ-10MB');
        return;
      }
      
      setReceiptFile(file);
      e.dataTransfer.clearData();
    }
  };

  // Close save modal and reset state
  const closeSaveModal = () => {
    setShowSaveModal(false);
    setReceiptFile(null);
    // Reset file input
    const fileInput = document.getElementById('receipt-file-input');
    if (fileInput) fileInput.value = '';
  };

  // Sorting functionality
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return faSort;
    return sortDirection === 'asc' ? faSortUp : faSortDown;
  };

  // Sorting functionality for current purchase table
  const handleCurrentPurchaseSort = (field) => {
    if (currentPurchaseSortField === field) {
      setCurrentPurchaseSortDirection(currentPurchaseSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCurrentPurchaseSortField(field);
      setCurrentPurchaseSortDirection('asc');
    }
  };

  const getCurrentPurchaseSortIcon = (field) => {
    if (currentPurchaseSortField !== field) return faSort;
    return currentPurchaseSortDirection === 'asc' ? faSortUp : faSortDown;
  };

  // Sort current purchase items with memoization
  const sortedCurrentPurchaseItems = useMemo(() => {
    if (!currentPurchase.items) return [];
    
    return [...currentPurchase.items].sort((a, b) => {
      let aValue, bValue;
      
      switch (currentPurchaseSortField) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'category':
          aValue = categories[a.category] || a.categoryName || 'לא מוגדר';
          bValue = categories[b.category] || b.categoryName || 'לא מוגדר';
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'total':
          aValue = (a.price || 0) * (a.quantity || 0);
          bValue = (b.price || 0) * (b.quantity || 0);
          break;
        default:
          return 0;
      }
      
      if (currentPurchaseSortDirection === 'asc') {
        if (typeof aValue === 'string') {
          return aValue.localeCompare(bValue);
        }
        return aValue > bValue ? 1 : -1;
      } else {
        if (typeof aValue === 'string') {
          return bValue.localeCompare(aValue);
        }
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [currentPurchase.items, currentPurchaseSortField, currentPurchaseSortDirection, categories]);

  const sortedPurchaseHistory = [...purchaseHistory].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'date':
        aValue = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date);
        bValue = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date);
        break;
      case 'items':
        aValue = a.items?.length || 0;
        bValue = b.items?.length || 0;
        break;
      case 'amount':
        aValue = a.totalAmount || 0;
        bValue = b.totalAmount || 0;
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination calculations for purchase history
  const totalPages = Math.ceil(sortedPurchaseHistory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = sortedPurchaseHistory.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event) => {
    const newValue = parseInt(event.target.value);
    setItemsPerPage(newValue);
    localStorage.setItem('purchaseHistoryItemsPerPage', newValue.toString());
    setCurrentPage(1); // Reset to first page when changing items per page
  };

// Add the handleViewPurchaseDetails function
const handleViewPurchaseDetails = (purchase) => {
  setSelectedPurchase(purchase);
};

// Handle receipt upload modal
const handleShowReceiptModal = (purchase) => {
  setSelectedReceiptPurchase(purchase);
  setShowReceiptModal(true);
};

// Handle receipt updated callback
const handleReceiptUpdated = (purchaseId, receiptData) => {
  // Update the local purchase history state to reflect the changes
  setPurchaseHistory(prevHistory => 
    prevHistory.map(purchase => 
      purchase.id === purchaseId 
        ? { ...purchase, ...receiptData }
        : purchase
    )
  );
};

// Check if purchase can be deleted (within 24 hours and is the most recent)
const canDeletePurchase = (purchase, index) => {
  // Must be the first item (most recent) in the sorted array
  if (index !== 0) return false;
  
  const purchaseDate = purchase.date && purchase.date.toDate ? purchase.date.toDate() : new Date(purchase.date);
  const now = new Date();
  const hoursDiff = (now - purchaseDate) / (1000 * 60 * 60);
  
  return hoursDiff <= 24;
};

// Handle delete purchase
const handleDeletePurchase = async (purchase) => {
  try {
    const batch = writeBatch(db);
    
    // Get current budget
    const budgetSnapshot = await getDocs(collection(db, 'budgets'));
    if (budgetSnapshot.empty) {
      throw new Error('לא נמצא תקציב במערכת');
    }

    // Get latest budget document
    const latestBudget = budgetSnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .sort((a, b) => b.date - a.date)[0];

    // Restore budget (add back the purchase amount)
    const budgetRef = doc(db, 'budgets', latestBudget.id);
    batch.update(budgetRef, {
      totalBudget: latestBudget.totalBudget + purchase.totalAmount
    });

    // Update product quantities (decrease stock - reverse the purchase)
    for (const item of purchase.items) {
      try {
        // Find product by name
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const matchingProduct = productsSnapshot.docs.find(doc => 
          doc.data().name === item.name
        );
        
        if (matchingProduct) {
          const productRef = doc(db, 'products', matchingProduct.id);
          const currentQuantity = matchingProduct.data().quantity || 0;
          const newQuantity = Math.max(0, currentQuantity - item.quantity); // Ensure non-negative
          
          batch.update(productRef, {
            quantity: newQuantity,
            lastModified: Timestamp.fromDate(new Date())
          });
        }
      } catch (error) {
        console.warn(`Could not update quantity for product: ${item.name}`, error);
      }
    }

    // Delete the purchase from history
    const purchaseRef = doc(db, 'purchases/history/items', purchase.id);
    batch.delete(purchaseRef);

    // Delete receipt from storage if exists
    if (purchase.receiptURL && purchase.receiptName) {
      try {
        const receiptRef = ref(storage, `receipts/${purchase.id}/${purchase.receiptName}`);
        await deleteObject(receiptRef);
      } catch (error) {
        console.warn('Could not delete receipt file:', error);
      }
    }

    await batch.commit();
    
    toast.success(`הרכישה נמחקה בהצלחה והתקציב הוחזר (${purchase.totalAmount.toFixed(2)} ₪)`);
    
    // Close confirmation modal
    setShowDeleteConfirmation(false);
    setPurchaseToDelete(null);
    
  } catch (error) {
    console.error('Error deleting purchase:', error);
    toast.error(error.message || 'שגיאה במחיקת הרכישה');
  }
};

// Show delete confirmation
const handleShowDeleteConfirmation = (purchase) => {
  setPurchaseToDelete(purchase);
  setShowDeleteConfirmation(true);
};
  useEffect(() => {
    // If navigated with showHistory or showPurchaseModal, open history and modal
    if (location.state && (location.state.showPurchaseModal || location.state.showHistory)) {
      setShowHistory(true);
      if (location.state.showPurchaseModal && location.state.purchaseId) {
        // Wait for purchaseHistory to load, then open modal
        let interval;
        const openModal = () => {
          const found = purchaseHistory.find(p => p.id === location.state.purchaseId);
          if (found) {
            setSelectedPurchase(found);
            clearInterval(interval);
            // Clear the navigation state to prevent modal from reopening
            navigate('.', { replace: true, state: null });
          }
        };
        
        // Check immediately if purchaseHistory is already loaded
        if (purchaseHistory.length > 0) {
          openModal();
        } else {
          // Wait for purchaseHistory to load
          interval = setInterval(openModal, 100);
        }
        
        // Clean up interval if component unmounts or dependencies change
        return () => {
          if (interval) {
            clearInterval(interval);
          }
        };
      } else if (location.state.showHistory) {
        // If only showing history, clear the navigation state
        navigate('.', { replace: true, state: null });
      }
    }
  }, [location.state, purchaseHistory, navigate]);

  // Reset pagination when switching to history view or when history changes
  useEffect(() => {
    if (showHistory) {
      setCurrentPage(1);
    }
  }, [showHistory, purchaseHistory.length]);

  // Adjust current page if it exceeds total pages after data changes
  useEffect(() => {
    if (showHistory && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [showHistory, totalPages, currentPage]);

  // Prevent default drag behaviors on window
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    events.forEach(eventName => {
      document.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    return () => {
      events.forEach(eventName => {
        document.removeEventListener(eventName, preventDefaults, false);
        document.body.removeEventListener(eventName, preventDefaults, false);
      });
    };
  }, []);

  return (
    <div className="inventory-container">      
    {selectedPurchase && (
        <PurchaseModal 
          purchase={selectedPurchase}
          categories={categories}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
      
      {showReceiptModal && selectedReceiptPurchase && (
        <ReceiptUploadModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceiptPurchase(null);
          }}
          purchase={selectedReceiptPurchase}
          onReceiptUpdated={handleReceiptUpdated}
        />
      )}
      
      {/* Delete Purchase Modal */}
      <DeletePurchaseModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setPurchaseToDelete(null);
        }}
        purchase={purchaseToDelete}
        onConfirmDelete={handleDeletePurchase}
      />
      <div className="page-header justify-content-between d-flex align-items-center mb-3">
        <h1>
          <FontAwesomeIcon icon={showHistory ? faHistory : faCartPlus} className="page-header-icon" />
          {showHistory ? 'היסטוריית רכישות' : 'קנייה חדשה'}
        </h1>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowHistory(!showHistory)}
        >
          <FontAwesomeIcon icon={showHistory ? faCartPlus : faHistory} style={{ marginLeft: '8px' }} />
          {showHistory ? ' קנייה נוכחית' : ' היסטוריה'}
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
                  <th 
                    onClick={() => handleSort('date')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי תאריך"
                  >
                    תאריך רכישה <FontAwesomeIcon icon={getSortIcon('date')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th 
                    onClick={() => handleSort('items')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי מספר פריטים"
                  >
                    מספר פריטים <FontAwesomeIcon icon={getSortIcon('items')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th 
                    onClick={() => handleSort('amount')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי סכום"
                  >
                    סכום רכישה <FontAwesomeIcon icon={getSortIcon('amount')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th>קבלה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {currentPurchases.map((purchase, index) => (
                  <tr key={purchase.id}>
                    <td>
                      {formatDate(purchase.date)}
                    </td>
                    <td>{purchase.items?.length || 0}</td>
                    <td>{purchase.totalAmount?.toFixed(2) || '0.00'} ₪</td>
                    <td style={{ textAlign: 'center' }}>
                      {purchase.receiptURL ? (
                        <a
                          href={purchase.receiptURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="צפה בקבלה"
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            color: 'var(--success)',
                            fontSize: '1.1rem',
                            textDecoration: 'none',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--success)';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                            e.currentTarget.style.color = 'var(--success)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <FontAwesomeIcon icon={faFileAlt} />
                        </a>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(108, 117, 125, 0.1)',
                          color: 'var(--secondary-text)',
                          fontSize: '1rem'
                        }} title="לא הועלתה קבלה">
                          —
                        </span>
                      )}
                    </td>
                    <td className='purchases-actions'>
                      <button onClick={() => handleViewPurchaseDetails(purchase)} title="צפה בפרטים">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleShowReceiptModal(purchase)}
                        title="עדכן קבלה"
                      >
                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                      </button>
                      {canDeletePurchase(purchase, sortedPurchaseHistory.findIndex(p => p.id === purchase.id)) && (
                        <button
                          className="delete-purchase-btn"
                          onClick={() => handleShowDeleteConfirmation(purchase)}
                          title="מחק רכישה (זמין רק 24 שעות מהרכישה)"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination controls for purchase history */}
            {purchaseHistory.length > 0 && (
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
                    שורות בעמוד:
                  </label>
                  <select 
                    value={itemsPerPage} 
                    onChange={handleItemsPerPageChange}
                    className="items-per-page-select"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25">25</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* <div className="purchase-summary card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3>סה"כ רכישות: {purchaseHistory.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)} ₪</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--secondary-text)' }}>
                  מציג {currentPurchases.length} מתוך {purchaseHistory.length} רכישות
                </div>
              </div>
            </div> */}
          </>
        )
      ) : (
        loading ? (
          <Spinner />
        ) : (!currentPurchase.items || currentPurchase.items.length === 0) ? (
          <div className="empty-list">
            <p>אין פריטים בקנייה הנוכחית</p>
            <p className="empty-list-subtext">סמן פריטים כנרכשו ברשימת הקניות</p>
          </div>
        ) : (
          <>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleCurrentPurchaseSort('name')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי שם מוצר"
                  >
                    שם מוצר <FontAwesomeIcon icon={getCurrentPurchaseSortIcon('name')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th 
                    onClick={() => handleCurrentPurchaseSort('category')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי קטגוריה"
                  >
                    קטגוריה <FontAwesomeIcon icon={getCurrentPurchaseSortIcon('category')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th 
                    onClick={() => handleCurrentPurchaseSort('quantity')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי כמות"
                  >
                    כמות <FontAwesomeIcon icon={getCurrentPurchaseSortIcon('quantity')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th 
                    onClick={() => handleCurrentPurchaseSort('price')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי מחיר"
                  >
                    מחיר <FontAwesomeIcon icon={getCurrentPurchaseSortIcon('price')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th 
                    onClick={() => handleCurrentPurchaseSort('total')} 
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="לחץ למיון לפי סהכ"
                  >
                    סה"כ <FontAwesomeIcon icon={getCurrentPurchaseSortIcon('total')} style={{ marginRight: '5px', fontSize: '0.8em', opacity: 0.7 }} />
                  </th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {sortedCurrentPurchaseItems.map((item, index) => (
                  <tr key={item.id || `${item.name}-${index}`}>
                    <td>{item.name}</td>
                    <td>{categories[item.category] || item.categoryName || 'לא מוגדר'}</td>
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
                          <button onClick={() => handleSavePrice(item.id)} title="שמור" className="btn btn-sm btn-success"
                            style={{
                            color: 'white',
                            border: '1px solid white',
                            backgroundColor: 'transparent'
                          }}>
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button onClick={handleCancelEdit} title="בטל" className="btn btn-sm btn-danger"
                          style={{
                            color: 'white',
                            border: '1px solid white',
                            backgroundColor: 'transparent'
                          }}>
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </>
                      ) : (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEditPrice(item)}
                          title="ערוך מחיר"
                          style={{
                            color: 'green',
                            border: '1px solid green',
                            backgroundColor: 'transparent'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.borderColor = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.borderColor = 'green';
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="new-purchase-summary card">
              {/* <div className="d-flex justify-content-between align-items-center" style={{ margin: '1rem' }}> */}
                <h3>
                  סה"כ רכישה: {currentPurchase.items.reduce((sum, item) => 
                    sum + (item.price * item.quantity), 0).toFixed(2)} ₪
                </h3>
                <button
                  className="btn btn-primary"
                  onClick={handleSavePurchase}
                  title="שמור רכישה"
                >
                  <FontAwesomeIcon icon={faSave} style={{ marginLeft: '8px' }} />
                  שמור רכישה
                </button>
              {/* </div> */}
            </div>
          </>
        )
      )}

      <SavePurchaseModal
        isOpen={showSaveModal}
        onClose={closeSaveModal}
        currentPurchase={currentPurchase}
        receiptFile={receiptFile}
        dragActive={dragActive}
        uploadingReceipt={uploadingReceipt}
        onReceiptFileSelect={handleReceiptFileSelect}
        onRemoveReceiptFile={handleRemoveReceiptFile}
        onDragIn={handleDragIn}
        onDragOut={handleDragOut}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onConfirmSave={confirmSavePurchase}
      />
    </div>
  );
};

export default Purchases;