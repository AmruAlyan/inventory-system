import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useData } from '../context/DataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faMedal, faAward, faShoppingCart, faCalendar } from '@fortawesome/free-solid-svg-icons';
import '../styles/ForComponents/top3Categories.css';

const Top3Categories = () => {
  const { categories } = useData();
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get date 3 months ago
  const getThreeMonthsAgo = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date;
  };

  // Subscribe to purchase history (last 3 months)
  useEffect(() => {
    const threeMonthsAgo = getThreeMonthsAgo();
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'purchases/history/items'),
        where('date', '>=', threeMonthsAgo),
        orderBy('date', 'desc')
      ),
      (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          items: [],
          totalAmount: 0,
          ...doc.data()
        }));
        setPurchaseHistory(historyData);
      },
      (error) => {
        console.error('Error fetching purchase history:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to budget entries (last 3 months)
  useEffect(() => {
    const threeMonthsAgo = getThreeMonthsAgo();
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'budgets', 'history', 'entries'),
        where('date', '>=', threeMonthsAgo),
        orderBy('date', 'desc')
      ),
      (snapshot) => {
        const budgetData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBudgetEntries(budgetData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching budget entries:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Calculate total budget for last 3 months
  const getTotalBudget = () => {
    return budgetEntries.reduce((total, entry) => total + (entry.amount || 0), 0);
  };

  // Calculate category expenses (last 3 months)
  const calculateCategoryExpenses = () => {
    const categoryExpenses = {};
    const totalBudget = getTotalBudget();

    purchaseHistory.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          const categoryId = item.category;
          const categoryName = categories[categoryId] || 'לא מוגדר';
          const itemTotal = (item.price || item.actualPrice || 0) * (item.quantity || 0);

          if (!categoryExpenses[categoryId]) {
            categoryExpenses[categoryId] = {
              id: categoryId,
              name: categoryName,
              totalExpense: 0,
              totalItems: 0,
              purchaseCount: 0,
              budgetPercentage: 0
            };
          }

          categoryExpenses[categoryId].totalExpense += itemTotal;
          categoryExpenses[categoryId].totalItems += item.quantity || 0;
          categoryExpenses[categoryId].purchaseCount += 1;
        });
      }
    });

    // Calculate budget percentage for each category
    Object.values(categoryExpenses).forEach(category => {
      if (totalBudget > 0) {
        category.budgetPercentage = (category.totalExpense / totalBudget) * 100;
      }
    });

    // Sort by total expense and get top 3
    return Object.values(categoryExpenses)
      .filter(category => category.totalExpense > 0)
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, 3);
  };

  const top3Categories = calculateCategoryExpenses();
  const totalBudget = getTotalBudget();
  const totalSpent = top3Categories.reduce((sum, cat) => sum + cat.totalExpense, 0);
  
  // Calculate total expenses across ALL categories (not just top 3)
  const getTotalCategoryExpenses = () => {
    const allCategoryExpenses = {};
    
    purchaseHistory.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          const categoryId = item.category;
          const itemTotal = (item.price || item.actualPrice || 0) * (item.quantity || 0);
          
          if (!allCategoryExpenses[categoryId]) {
            allCategoryExpenses[categoryId] = 0;
          }
          
          allCategoryExpenses[categoryId] += itemTotal;
        });
      }
    });
    
    return Object.values(allCategoryExpenses).reduce((total, expense) => total + expense, 0);
  };
  
  const totalAllExpenses = getTotalCategoryExpenses();

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return faCrown;
      case 1:
        return faMedal;
      case 2:
        return faAward;
      default:
        return faShoppingCart;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return '#FFD700'; // Gold
      case 1:
        return '#C0C0C0'; // Silver
      case 2:
        return '#CD7F32'; // Bronze
      default:
        return 'var(--primary)';
    }
  };

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)} ₪`;
  };

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="top3-categories-container">
        <div className="top3-header">
          <FontAwesomeIcon icon={faCalendar} className="header-icon" />
          <h3>3 הקטגוריות המובילות</h3>
          <p style={{ padding: '0', margin: '0' }}>(3 חודשים אחרונים)</p>
        </div>
        <div className="loading-placeholder">
          <div className="spinner"></div>
          <p>טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (top3Categories.length === 0) {
    return (
      <div className="top3-categories-container">
        <div className="top3-header">
          <FontAwesomeIcon icon={faCalendar} className="header-icon" />
          <h3>3 הקטגוריות המובילות</h3>
          <p style={{ padding: '0', margin: '0' }}>(3 חודשים אחרונים)</p>
        </div>
        <div className="empty-state">
          <FontAwesomeIcon icon={faShoppingCart} className="empty-icon" />
          <p>אין נתוני רכישות זמינים</p>
          <small>נתונים יופיעו לאחר ביצוע רכישות ב-3 החודשים האחרונים</small>
        </div>
      </div>
    );
  }

  return (
    <div className="top3-categories-container">
      <div className="top3-header">
        <FontAwesomeIcon icon={faCalendar} className="header-icon" />
        <h3>3 הקטגוריות המובילות</h3>
        <p style={{ padding: '0', margin: '0' }}>(3 חודשים אחרונים)</p>
      </div>

      {/* Expenses Overview */}
      <div className="budget-overview">
        <div className="budget-stat">
          <span className="budget-label">3 קטגוריות עליונות:</span>
          <span className="budget-value">{formatCurrency(totalSpent)}</span>
        </div>
        <div className="budget-stat">
          <span className="budget-label">אחוז מההוצאות:</span>
          <span className="budget-value">
            {totalAllExpenses > 0 ? formatPercentage((totalSpent / totalAllExpenses) * 100) : '0%'}
          </span>
        </div>
        <div className="budget-stat">
          <span className="budget-label">סה"כ הוצאות:</span>
          <span className="budget-value">{formatCurrency(totalAllExpenses)}</span>
        </div>
      </div>

      <div className="top3list">
        {top3Categories.map((category, index) => (
          <div key={category.id} className={`category-item rank-${index + 1}`}>
            <div className="rank-section">
              <div 
                className="rank-icon"
                style={{ color: getRankColor(index) }}
              >
                <FontAwesomeIcon icon={getRankIcon(index)} />
              </div>
              <div className="rank-number">#{index + 1}</div>
            </div>

            <div className="category-content">
              <div className="category-header">
                <h4 className="category-name">{category.name}</h4>
                <div className="category-expense">
                  {formatCurrency(category.totalExpense)}
                  <small className="budget-percentage">
                    ({totalAllExpenses > 0 ? formatPercentage((category.totalExpense / totalAllExpenses) * 100) : '0%'} מסה"כ ההוצאות)
                  </small>
                </div>
              </div>

              {/* Progress bar showing percentage of total expenses */}
              <div className="expense-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: totalAllExpenses > 0 ? `${(category.totalExpense / totalAllExpenses) * 100}%` : '0%',
                    backgroundColor: getRankColor(index)
                  }}
                ></div>
                <span className="progress-label">
                  {totalAllExpenses > 0 ? formatPercentage((category.totalExpense / totalAllExpenses) * 100) : '0%'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Summary */}
      <div className="summary-footer">
        {/* <div className="total-expense">
          <strong>
            3 קטגוריות עליונות: {formatCurrency(totalSpent)}
            <span> ({totalAllExpenses > 0 ? formatPercentage((totalSpent / totalAllExpenses) * 100) : '0%'} מסה"כ ההוצאות)</span>
          </strong>
        </div> */}
        <div className="remaining-budget">
          <strong>
            סה"כ הוצאות בקטגוריות אחרות: {formatCurrency(totalAllExpenses - totalSpent)}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default Top3Categories;
