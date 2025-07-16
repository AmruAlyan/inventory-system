import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFilter, faSave, faTimes, faSortUp, faSortDown, faSort } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../firebase/firebase';
import { collection, doc, getDocs, updateDoc, setDoc, query, orderBy, Timestamp, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Spinner from '../Spinner';

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
    return saved ? parseInt(saved) : 10;
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

  // Apply sorting to data
  const applySorting = useCallback((data) => {
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
  }, [sortBy, sortOrder]);

  const applyFilter = useCallback((filterValue) => {
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

    // Apply sorting to filtered data
    const sortedData = applySorting(filteredData);
    setFilteredHistory(sortedData);
  }, [history, applySorting]);

  // Fetch budget history
  useEffect(() => {
    fetchBudgetHistory();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  // Apply filters and sorting when relevant data changes
  useEffect(() => {
    if (history.length > 0) {
      applyFilter(filter);
      setCurrentPage(1); // Reset to first page on filter change
    }
  }, [filter, history, applyFilter]);

  // Re-apply filter when sort criteria changes (which will also apply sorting)
  useEffect(() => {
    if (history.length > 0) {
      applyFilter(filter);
    }
  }, [sortBy, sortOrder, applyFilter, filter, history]);

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

      // Only initialize budget document if it doesn't exist, but don't trigger refresh
      if (historyData.length === 0) {
        try {
          const currentBudgetRef = doc(db, 'budgets', 'current');
          const currentBudgetSnap = await getDoc(currentBudgetRef);
          
          // Only create the document if it doesn't exist
          if (!currentBudgetSnap.exists()) {
            await setDoc(currentBudgetRef, {
              totalBudget: 0,
              latestUpdate: {
                amount: 0,
                date: Timestamp.fromDate(new Date())
              }
            });
          }
        } catch (initError) {
          console.warn("Could not initialize budget document:", initError);
        }
        
        // Don't call onBudgetChange() here as it causes infinite refresh loop
        // The empty state is handled properly by the parent component
      }
    } catch (err) {
      console.error("Error fetching budget history:", err);
      setError("אירעה שגיאה בטעינת היסטורית התקציב");
    } finally {
      setIsLoading(false);
    }
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
    const dateObj = toDateObj(entry.date); // Use the helper function to properly convert the date
    setEditForm({
      amount: entry.amount,
      date: dateObj.toISOString().split('T')[0]
    });
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

          {/* {history.length > 0 && (
            <div className="delete-all-container">
              <button className="delete-all-btn" onClick={handleDeleteAll}>
                <FontAwesomeIcon icon={faEraser} />
                <span>אפס את כל ההכנסות</span>
              </button>
            </div>
          )} */}
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
                          {/* <button className="delete-btn" onClick={() => handleDelete(entry.id, entry.amount, entry.totalBudget)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button> */}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHistory.length > 0 && (
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
                  <option value="15">15</option>
                  <option value="20">20</option>
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
