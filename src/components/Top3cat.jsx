import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useData } from '../context/DataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faMedal, faAward, faShoppingCart, faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';
import '../styles/ForComponents/top3Categories.css';

const Top3Categories = () => {
  const { categories } = useData();
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to purchase history
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'purchases/history/items'),
      (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          items: [],
          totalAmount: 0,
          ...doc.data()
        }));
        setPurchaseHistory(historyData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching purchase history:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Calculate category expenses
  const calculateCategoryExpenses = () => {
    const categoryExpenses = {};

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
              purchaseCount: 0
            };
          }

          categoryExpenses[categoryId].totalExpense += itemTotal;
          categoryExpenses[categoryId].totalItems += item.quantity || 0;
          categoryExpenses[categoryId].purchaseCount += 1;
        });
      }
    });

    // Sort by total expense and get top 3
    return Object.values(categoryExpenses)
      .filter(category => category.totalExpense > 0)
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, 3);
  };

  const top3Categories = calculateCategoryExpenses();

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

  if (loading) {
    return (
      <div className="top3-categories-container">
        <div className="top3-header">
          <FontAwesomeIcon icon={faArrowTrendUp} className="header-icon" />
          <h3>3 הקטגוריות היקרות ביותר</h3>
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
          <FontAwesomeIcon icon={faArrowTrendUp} className="header-icon" />
          <h3>3 הקטגוריות היקרות ביותר</h3>
        </div>
        <div className="empty-state">
          <FontAwesomeIcon icon={faShoppingCart} className="empty-icon" />
          <p>אין נתוני רכישות זמינים</p>
          <small>נתונים יופיעו לאחר ביצוע רכישות</small>
        </div>
      </div>
    );
  }

  return (
    <div className="top3-categories-container">
      <div className="top3-header">
        <FontAwesomeIcon icon={faArrowTrendUp} className="header-icon" />
        <h3>3 הקטגוריות המובילות</h3>
        <p style={{ padding: '0', margin: '0' }}>(לפי קניות)</p>
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
                </div>
              </div>

              {/* <div className="category-stats">
                <div className="stat">
                  <span className="stat-label">פריטים:</span>
                  <span className="stat-value">{category.totalItems}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">רכישות:</span>
                  <span className="stat-value">{category.purchaseCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">ממוצע לפריט:</span>
                  <span className="stat-value">
                    {formatCurrency(category.totalExpense / category.totalItems)}
                  </span>
                </div>
              </div> */}

              {/* Progress bar showing relative expense */}
              <div className="expense-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${(category.totalExpense / top3Categories[0].totalExpense) * 100}%`,
                    backgroundColor: getRankColor(index)
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="summary-footer">
        <div className="total-expense">
          <strong>
            סה"כ הוצאות 3 קטגוריות עליונות: {' '}
            {formatCurrency(top3Categories.reduce((sum, cat) => sum + cat.totalExpense, 0))}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default Top3Categories;
