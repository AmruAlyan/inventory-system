import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faFilter, faEraser, faSave, faTimes, faSortUp, faSortDown, faSort } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../firebase/firebase';
import { collection, doc, getDocs, deleteDoc, updateDoc, setDoc, query, orderBy, Timestamp, getDoc, limit, addDoc } from 'firebase/firestore';
import Spinner from '../Spinner';
import { showConfirm } from '../../utils/dialogs';
import '../../styles/ForAdmin/budgetHistoryTable.css';
import '../../styles/ForManager/products.css';
const BudgetHistoryTable = ({ onBudgetChange, refreshTrigger }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'week', 'month', '6months', 'year'
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ amount: 0, date: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('budgetItemsPerPage');
    return saved ? parseInt(saved) : 8;
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Format currency with ₪ on the right
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '';
    // Format as number with 2 decimals, add space and then the shekel sign
    return amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₪';
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let dateObj;
    if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Try to parse string
      const parsed = Date.parse(timestamp);
      dateObj = isNaN(parsed) ? new Date() : new Date(parsed);
    } else {
      dateObj = new Date();
    }
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  };

  // Filter options with Hebrew labels
  const filterOptions = [
    { value: 'all', label: 'הכל' },
    { value: 'week', label: 'שבוע אחרון' },
    { value: 'month', label: 'חודש אחרון' },
    { value: '6months', label: '6 חודשים אחרונים' },
    { value: 'year', label: 'שנה אחרונה' }
  ];

  // Fetch budget history
  useEffect(() => {
    fetchBudgetHistory();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  // Apply filters when filter value changes
  useEffect(() => {
    applyFilter(filter);
    setCurrentPage(1); // Reset to first page on filter change
  }, [filter, history]);

  // Apply sorting when sort criteria changes
  useEffect(() => {
    if (filteredHistory.length > 0) {
      const sortedData = applySorting(filteredHistory);
      setFilteredHistory(sortedData);
    }
  }, [sortBy, sortOrder]);

  const fetchBudgetHistory = async () => {
    try {
      setIsLoading(true);
      const historyRef = collection(db, 'budgets', 'history', 'entries');
      const q = query(historyRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      const historyData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        historyData.push({
          id: doc.id,
          amount: data.amount,
          totalBudget: data.totalBudget,
          date: data.date
        });
      });

      setHistory(historyData);
      setFilteredHistory(historyData);
      setError(null);

      // Check if there are no entries - in case the Firestore is not completely synced yet
      if (historyData.length === 0) {
        const currentBudgetRef = doc(db, 'budgets', 'current');
        await setDoc(currentBudgetRef, {
          totalBudget: 0,
          latestUpdate: {
            amount: 0,
            date: Timestamp.fromDate(new Date())
          }
        }, { merge: true });

        // Notify parent component that there are no entries
        if (onBudgetChange) {
          onBudgetChange();
        }
      }
    } catch (err) {
      console.error("Error fetching budget history:", err);
      setError("אירעה שגיאה בטעינת היסטורית התקציב");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get JS Date from any Firestore/JS/string/number date
  const toDateObj = (date) => {
    if (!date) return new Date(0);
    if (date instanceof Date) return date;
    if (date && typeof date.toDate === 'function') return date.toDate();
    if (typeof date === 'number') return new Date(date);
    if (typeof date === 'string') {
      const parsed = Date.parse(date);
      return isNaN(parsed) ? new Date(0) : new Date(parsed);
    }
    return new Date(0);
  };

  const applyFilter = (filterValue) => {
    if (!history.length) return;

    const now = new Date();
    let filteredData = [];

    switch (filterValue) {
      case 'week': {
        // Last 7 days
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = history.filter(item => toDateObj(item.date) >= weekAgo);
        break;
      }
      case 'month': {
        // Last 30 days
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = history.filter(item => toDateObj(item.date) >= monthAgo);
        break;
      }
      case '6months': {
        // Last 180 days
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        filteredData = history.filter(item => toDateObj(item.date) >= sixMonthsAgo);
        break;
      }
      case 'year': {
        // Last 365 days
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredData = history.filter(item => toDateObj(item.date) >= yearAgo);
        break;
      }
      case 'all':
      default:
        filteredData = [...history];
    }

    // Apply sorting
    filteredData = applySorting(filteredData);

    setFilteredHistory(filteredData);
  };

  // Handle column sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Apply sorting to data
  const applySorting = (data) => {
    return [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = toDateObj(a.date).getTime();
          bValue = toDateObj(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'totalBudget':
          aValue = a.totalBudget;
          bValue = b.totalBudget;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  // Get sort icon for column headers
  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return faSort;
    }
    return sortOrder === 'asc' ? faSortUp : faSortDown;
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistory = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handleItemsPerPageChange = (event) => {
    const newItemsPerPage = parseInt(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    localStorage.setItem('budgetItemsPerPage', newItemsPerPage.toString());
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry.id);
    setEditForm({
      amount: entry.amount,
      date: new Date(entry.date).toISOString().split('T')[0]
    });
  };

  const handleDeleteAll = async () => {
    const confirmed = await showConfirm(
      'האם אתה בטוח שברצונך למחוק את כל רשומות התקציב? פעולה זו אינה ניתנת לביטול.',
      'מחק הכל'
    );
    if (confirmed) {
      try {
        setIsLoading(true);

        // Get all budget entries
        const historyRef = collection(db, "budgets", "history", "entries");
        const querySnapshot = await getDocs(historyRef);

        // Delete each entry
        const deletePromises = [];
        querySnapshot.forEach((document) => {
          deletePromises.push(deleteDoc(doc(db, "budgets", "history", "entries", document.id)));
        });

        await Promise.all(deletePromises);

        // Reset the current budget document
        const currentBudgetRef = doc(db, "budgets", "current");
        await setDoc(currentBudgetRef, {
          totalBudget: 0,
          latestUpdate: {
            amount: 0,
            date: Timestamp.fromDate(new Date())
          }
        });

        // Clear local state
        setHistory([]);
        setFilteredHistory([]);

        // Notify parent component
        if (onBudgetChange) {
          onBudgetChange();
        }

        setError(null);
      } catch (err) {
        console.error("Error deleting all budget entries:", err);
        setError("אירעה שגיאה במחיקת רשומות התקציב");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id, amount, totalBudget) => {
    const confirmed = await showConfirm(
      'האם אתה בטוח שברצונך למחוק רשומה זו?',
      'מחק'
    );
    if (confirmed) {
      try {
        setIsLoading(true);

        // Get the entry to delete
        const entryRef = doc(db, "budgets", "history", "entries", id);

        // Get current budget document
        const currentBudgetRef = doc(db, "budgets", "current");

        // Get all history entries to check if this is the last one
        const historyQuery = query(collection(db, "budgets", "history", "entries"));
        const historySnapshot = await getDocs(historyQuery);
        const isLastEntry = historySnapshot.size === 1;

        // Get the entry we are about to delete to check if it's the latest update
        const entryToDelete = await getDoc(entryRef);
        const entryToDeleteData = entryToDelete.data();
        const entryToDeleteDate = entryToDeleteData.date.toDate();

        // Delete the entry
        await deleteDoc(entryRef);

        if (isLastEntry) {
          // If this is the last entry, reset everything
          await setDoc(currentBudgetRef, {
            totalBudget: 0,
            latestUpdate: {
              amount: 0,
              date: Timestamp.fromDate(new Date())
            }
          });
        } else {
          // Update total budget
          const newTotalBudget = totalBudget - amount;
          
          // Check if we're deleting the latest update
          // Get the current budget document to check the latest update
          const currentBudgetDoc = await getDoc(currentBudgetRef);
          const currentBudgetData = currentBudgetDoc.data();
          const latestUpdateDate = currentBudgetData.latestUpdate.date.toDate();
          
          // If the deleted entry was the latest update, find the new latest update
          if (latestUpdateDate.getTime() === entryToDeleteDate.getTime()) {
            // Query for the most recent entry after deletion
            const sortedHistoryQuery = query(
              collection(db, "budgets", "history", "entries"),
              orderBy("date", "desc"),
              // Limit to 1 to get only the most recent entry
              limit(1)
            );
            
            const sortedHistorySnapshot = await getDocs(sortedHistoryQuery);
            
            if (!sortedHistorySnapshot.empty) {
              // Get the most recent entry
              const mostRecentDoc = sortedHistorySnapshot.docs[0];
              const mostRecentData = mostRecentDoc.data();
              
              // Update the current budget document with this entry as the latest
              await setDoc(currentBudgetRef, {
                totalBudget: newTotalBudget,
                latestUpdate: {
                  amount: mostRecentData.amount,
                  date: mostRecentData.date
                }
              }, { merge: true });
            } else {
              // Fallback in case something went wrong with the query
              await updateDoc(currentBudgetRef, {
                totalBudget: newTotalBudget
              });
            }
          } else {
            // If deleted entry wasn't the latest, just update the total budget
            await updateDoc(currentBudgetRef, {
              totalBudget: newTotalBudget
            });
          }
        }

        // Update both history and filteredHistory state
        setHistory(prev => prev.filter(item => item.id !== id));
        setFilteredHistory(prev => prev.filter(item => item.id !== id));

        // Notify parent component
        if (onBudgetChange) {
          onBudgetChange();
        }

        setError(null);
      } catch (err) {
        console.error("Error deleting budget entry:", err);
        setError("אירעה שגיאה במחיקת הרשומה");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const saveEdit = async () => {
    if (!editingEntry) return;

    try {
      setIsLoading(true);

      // Find the entry being edited
      const entry = history.find(item => item.id === editingEntry);
      if (!entry) {
        throw new Error("Entry not found");
      }

      // Calculate change in amount
      const originalAmount = entry.amount;
      const newAmount = parseFloat(editForm.amount);
      const amountDifference = newAmount - originalAmount;

      // Calculate new total budget
      const newTotalBudget = entry.totalBudget + amountDifference;

      // Remove the old entry (with old id)
      const oldEntryRef = doc(db, "budgets", "history", "entries", editingEntry);
      await deleteDoc(oldEntryRef);

      // Create a new entry with the new date as the id (now use addDoc for auto ID)
      const newDateTimestamp = Timestamp.fromDate(new Date(editForm.date));
      const historyRef = collection(db, "budgets", "history", "entries");
      await addDoc(historyRef, {
        amount: newAmount,
        totalBudget: newTotalBudget,
        date: newDateTimestamp
      });

      // Update current total budget
      const currentBudgetRef = doc(db, "budgets", "current");
      await updateDoc(currentBudgetRef, {
        totalBudget: newTotalBudget
      });

      // Update local state
      setHistory(prev =>
        prev
          .filter(item => item.id !== editingEntry)
          .concat({
            id: String(newDateTimestamp),
            amount: newAmount,
            totalBudget: newTotalBudget,
            date: newDateTimestamp
          })
          .sort((a, b) => b.date - a.date)
      );

      // Reset editing state
      setEditingEntry(null);
      setEditForm({ amount: 0, date: '' });

      // Notify parent component
      if (onBudgetChange) {
        onBudgetChange();
      }

      setError(null);
    } catch (err) {
      console.error("Error updating budget entry:", err);
      setError("אירעה שגיאה בעדכון הרשומה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="budget-history-container">
      <div className="bht-header page-header">
        <h2 className="history-title">היסטוריית הכנסות</h2>
        <div className="history-controls searchBar" style={{ marginBottom: 0 }}>
          <div className="filter-container">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {history.length > 0 && (
            <div className="delete-all-container">
              <button className="delete-all-btn" onClick={handleDeleteAll}>
                <FontAwesomeIcon icon={faEraser} />
                <span>אפס את כל ההכנסות</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}


      {isLoading ? (
        <Spinner text="טוען נתונים..." />
      ) : filteredHistory.length === 0 ? (
        <div className="empty-list">
          <p>לא נמצאו רשומות תקציב</p>
          <p className="empty-list-subtext">הוספת עדכון תקציב תציג אותו כאן</p>
        </div>
      ) : (
        <>
          <div className="history-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('date')}
                    title="לחץ לסידור לפי תאריך"
                  >
                    תאריך
                    <FontAwesomeIcon 
                      icon={getSortIcon('date')} 
                      className={`sort-icon ${sortBy === 'date' ? 'active' : ''}`}
                    />
                  </th>
                  <th 
                    className="sortable-header" 
                    style={{ textAlign: 'center' }}
                    onClick={() => handleSort('amount')}
                    title="לחץ לסידור לפי סכום"
                  >
                    סכום
                    <FontAwesomeIcon 
                      icon={getSortIcon('amount')} 
                      className={`sort-icon ${sortBy === 'amount' ? 'active' : ''}`}
                    />
                  </th>
                  <th 
                    className="sortable-header" 
                    style={{ textAlign: 'center' }}
                    onClick={() => handleSort('totalBudget')}
                    title="לחץ לסידור לפי סה״כ תקציב"
                  >
                    סה״כ תקציב
                    <FontAwesomeIcon 
                      icon={getSortIcon('totalBudget')} 
                      className={`sort-icon ${sortBy === 'totalBudget' ? 'active' : ''}`}
                    />
                  </th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {currentHistory.map(entry => (
                  <tr key={entry.id}>
                    <td>
                      {editingEntry === entry.id ? (
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="date-input"
                        />
                      ) : (
                        formatDate(entry.date)
                      )}
                    </td>
                    <td style={{ direction: 'ltr', textAlign: 'center' }}>
                      {editingEntry === entry.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        />
                      ) : (
                        formatCurrency(entry.amount)
                      )}
                    </td>
                    <td style={{ direction: 'ltr', textAlign: 'center' }}>{formatCurrency(entry.totalBudget)}</td>
                    <td className="inventory-actions">
                      {editingEntry === entry.id ? (
                        <>
                          <button className="save-btn" onClick={saveEdit}>
                            <FontAwesomeIcon icon={faSave} style={{ color: 'white' }} />
                          </button>
                          <button className="cancel-btn" onClick={() => setEditingEntry(null)}>
                            <FontAwesomeIcon icon={faTimes} style={{ color: 'white' }} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="edit-btn" onClick={() => handleEdit(entry)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="delete-btn" onClick={() => handleDelete(entry.id, entry.amount, entry.totalBudget)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHistory.length > itemsPerPage && (
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
                  <option value="4">4</option>
                  <option value="8">8</option>
                  <option value="16">16</option>
                  <option value="32">32</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BudgetHistoryTable;
