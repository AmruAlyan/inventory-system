import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faShekel, faArrowLeftLong, faReceipt } from '@fortawesome/free-solid-svg-icons';
import CustomBar from "../../components/Charts/CustomBar";
import CustomLine from "../../components/Charts/CustomLine";
import CustomPie from "../../components/Charts/CustomPie";
import CustomArea from "../../components/Charts/CustomArea";
import SwitchableBarChart from "../../components/Charts/SwitchableBarChart";
import Top3Categories from "../../components/Top3cat";
import { db } from '../../firebase/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import Spinner from '../../components/Spinner';
import { UI_CONFIG } from '../../constants/config';

import '../../styles/dashboard.css';
import '../../styles/ForManager/products.css';
import '../../styles/ForAdmin/switchableBarChart.css';

const ManagerDash = () => {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(0);
  const [lastBalance, setLastBalance] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [barData, setBarData] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [areaData, setAreaData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch budget
        const budgetDocRef = doc(db, "budgets", "current");
        const budgetSnapshot = await getDoc(budgetDocRef);

        // Fetch budget history for the chart
        const historyQuery = query(
          collection(db, "budgets", "history", "entries"),
          orderBy("date", "desc")
        );
        const historySnapshot = await getDocs(historyQuery);
        const historyData = [];
        historySnapshot.forEach(doc => {
          const data = doc.data();
          historyData.push({
            id: doc.id,
            amount: data.amount,
            date: data.date && data.date.toDate ? data.date.toDate() : new Date(),
            formatted: data.date && data.date.toDate ? new Intl.DateTimeFormat('he-IL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(data.date.toDate()) : ''
          });
        });
        // Sort history data by date (newest first)
        historyData.sort((a, b) => b.date - a.date);
        setBarData(historyData);

        // If budget document exists, use its data
        if (budgetSnapshot.exists()) {
          const data = budgetSnapshot.data();
          setBudget(data.totalBudget || 0);
          setLastBalance(data.latestUpdate?.amount || 0);
        }
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        let count = 0;
        let lowStock = 0;
        productsSnapshot.forEach(doc => {
          const p = doc.data();
          count++;
          // Count items that are either out of stock OR low stock
          if (p.quantity <= 0 || (p.quantity > 0 && p.quantity < UI_CONFIG.LOW_STOCK_THRESHOLD)) {
            lowStock++;
          }
        });
        setProductsCount(count);
        setLowStockCount(lowStock);

        // Fetch last 3 purchases
        const purchasesQuery = query(
          collection(db, 'purchases/history/items'),
          orderBy('date', 'desc')
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        const purchases = [];
        purchasesSnapshot.forEach(doc => {
          const data = doc.data();
          const dateObj = data.date && data.date.toDate ? data.date.toDate() : new Date();
          purchases.push({
            id: doc.id,
            date: dateObj,
            totalAmount: data.totalAmount,
            items: data.items || [],
            budgetBefore: data.budgetBefore,
            budgetAfter: data.budgetAfter
          });
        });
        setRecentPurchases(purchases.slice(0, 10));

        // Fetch budget history for the area chart
        const budgetHistoryQuery = query(
          collection(db, "budgets", "history", "entries"),
          orderBy("date", "asc")
        );
        const budgetHistorySnapshot = await getDocs(budgetHistoryQuery);
        const areaBudgetData = [];
        budgetHistorySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.date && data.totalBudget !== undefined) {
            const dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date);
            areaBudgetData.push({
              date: dateObj,
              value: data.totalBudget
            });
          }
        });

        // Fetch purchase history for the area chart
        const purchaseHistoryQuery = query(
          collection(db, 'purchases/history/items'),
          orderBy('date', 'asc')
        );
        const purchaseHistorySnapshot = await getDocs(purchaseHistoryQuery);
        const areaPurchaseData = [];
        purchaseHistorySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.date && data.budgetAfter !== undefined) {
            const dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date);
            areaPurchaseData.push({
              date: dateObj,
              value: data.budgetAfter
            });
          }
        });

        // Merge and sort by date ascending
        const mergedAreaData = [...areaBudgetData, ...areaPurchaseData].sort((a, b) => a.date - b.date);
        setAreaData(mergedAreaData);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setLoading(true);
    // Listen for real-time updates from purchases/history/items
    const unsubscribe = onSnapshot(
      query(collection(db, 'purchases/history/items'), orderBy('date', 'desc')),
      (snapshot) => {
        const purchases = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const dateObj = data.date && data.date.toDate ? data.date.toDate() : new Date();
          purchases.push({
            id: doc.id,
            date: dateObj,
            totalAmount: data.totalAmount,
            items: data.items || [],
            budgetBefore: data.budgetBefore,
            budgetAfter: data.budgetAfter
          });
        });
        setRecentPurchases(purchases.slice(0, 10));
        setLoading(false);
      },
      (error) => {
        // Optionally handle error
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLowStockCardClick = () => {
    navigate('/manager-dashboard/products', {
      state: {
        applyFilter: {
          categories: [],
          stockStatus: 'outOfStockOrLow'
        }
      }
    });
  };

  const handlePurchaseItemClick = (purchaseId) => {
    // Navigate to purchases history page and pass the purchase id to trigger modal
    navigate('/manager-dashboard/new-purchase', {
      state: {
        showPurchaseModal: true,
        purchaseId: purchaseId
      }
    });
  };

  const handleLastPurchaseCardClick = () => {
    if (recentPurchases.length > 0) {
      // Navigate to purchases history page and pass the last purchase id to trigger modal
      navigate('/manager-dashboard/new-purchase', {
        state: {
          showPurchaseModal: true,
          purchaseId: recentPurchases[0].id
        }
      });
    } else {
      // Just navigate to purchases history if no purchases
      navigate('/manager-dashboard/new-purchase');
    }
  };

  if (loading) return <Spinner text="טוען נתונים..." />;

  return (
    <div className="inventory-container">
      <div className="page-header">
        <h1>
          <FontAwesomeIcon icon={faHome} className="page-header-icon" /> לוח ראשי
        </h1>
      </div>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">
            <p>תקציב נוכחי</p>
            {/* <button><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button> */}
          </h3>
          <h2 className="dashboard-card-value">{budget.toFixed(2)} <FontAwesomeIcon icon={faShekel} className="dashboard-icon" /></h2>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">
            <p>תקציב אחרון שהוגדר</p>
            {/* <button onClick={handleBudgetCardClick}><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button> */}
          </h3>
          <h2 className="dashboard-card-value">{lastBalance.toFixed(2)} <FontAwesomeIcon icon={faShekel} className="dashboard-icon" /></h2>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">
            <p>רכישה אחרונה</p>
            <button onClick={handleLastPurchaseCardClick}><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button>
          </h3>
          <h2 className="dashboard-card-value">
            {recentPurchases.length > 0 && recentPurchases[0].totalAmount !== undefined
              ? `${recentPurchases[0].totalAmount.toFixed(2)} `
              : '--- '}
            <FontAwesomeIcon icon={faShekel} className="dashboard-icon" />
          </h2>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">
            <p>נמוך במלאי</p>
            <button onClick={handleLowStockCardClick}><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button>
          </h3>
          <h2 className="dashboard-card-value">{lowStockCount} / {productsCount}</h2>
        </div>
        
      </div>

      {/* Main chart area: two rows, two columns */}
      <div className="dashboard-main-charts" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="dashboard-main-row" style={{ display: 'flex', gap: '1.5rem' }}>
          
          {/* <div className="dashboard-chart-wrapper pie-chart-wrapper">
            <CustomPie products={products} userRole="manager" />
          </div> */}
          <Top3Categories />
          <div className="dashboard-chart-wrapper area-chart-wrapper">
            <CustomArea data={areaData} />
          </div>
        </div>
        <div className="dashboard-main-row" style={{ display: 'flex', gap: '1.5rem' }}>
          <div className="dashboard-chart-wrapper purchases-chart-wrapper">
            <div className="dashboard-purchases">
              <h2 className="dashboard-purchases-title">
                <FontAwesomeIcon icon={faReceipt} className="dashboard-purchases-icon" />
                הוצאות אחרונות
              </h2>
              <div className="dashboard-purchases-list">
                {recentPurchases.length > 0 ? (
                  <ul>
                    {recentPurchases.map((purchase) => (
                      <li key={purchase.id} className="dashboard-purchase-item">
                        <span className="dashboard-purchase-date">
                          {purchase.date ? purchase.date.toLocaleDateString('he-IL') : '---'}
                        </span>                        <span className="dashboard-purchase-amount">
                          {purchase.totalAmount ? purchase.totalAmount.toFixed(2) : '0.00'} ₪
                        </span>
                        <span 
                          className="dashboard-purchase-items clickable"
                          onClick={() => handlePurchaseItemClick(purchase.id)}
                          style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                        >
                          {purchase.items.length} פריטים
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>לא נמצאו רכישות אחרונות</p>
                )}
              </div>
            </div>
          </div>
          <div className="dashboard-chart-wrapper switchable-chart-wrapper">
            <SwitchableBarChart
              budgetData={barData}
              purchaseData={recentPurchases}
            />
          </div>
        </div>
        
        {/* Third row: Top 3 Categories */}
        {/* <div className="dashboard-main-row">
            <Top3Categories />
        </div> */}
      </div>
    </div>
  );
};

export default ManagerDash;


