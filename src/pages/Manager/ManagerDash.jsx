import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faWallet, faShekel, faArrowLeftLong, faReceipt } from '@fortawesome/free-solid-svg-icons';
import CustomBar from "../../components/Charts/CustomBar";
import CustomLine from "../../components/Charts/CustomLine";
import CustomPie from "../../components/Charts/CustomPie";
import CustomArea from "../../components/Charts/CustomArea";
import SwitchableBarChart from "../../components/Charts/SwitchableBarChart";
import { db } from '../../firebase/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import Spinner from '../../components/Spinner';

import '../../styles/dashboard.css';
import '../../styles/ForManager/products.css';
import '../../styles/ForAdmin/switchableBarChart.css';

const LOW_STOCK_THRESHOLD = 10;

const ManagerDash = () => {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(0);
  const [lastBalance, setLastBalance] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [barData, setBarData] = useState([]);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [products, setProducts] = useState([]);
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
        let value = 0;
        const productsArr = [];
        productsSnapshot.forEach(doc => {
          const p = doc.data();
          count++;
          if (p.quantity < LOW_STOCK_THRESHOLD) lowStock++;
          value += (p.price || 0) * (p.quantity || 0);
          productsArr.push(p);
        });
        setProductsCount(count);
        setLowStockCount(lowStock);
        setInventoryValue(value);
        setProducts(productsArr);

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
        setRecentPurchases(purchases.slice(0, 5));

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
        setRecentPurchases(purchases.slice(0, 5));
        setLoading(false);
      },
      (error) => {
        // Optionally handle error
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleProductsCardClick = () => {
    navigate('/manager-dashboard/products');
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
            <p>תקציב</p>
            <button><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button>
          </h3>
          <h2 className="dashboard-card-value">{budget.toFixed(2)} <FontAwesomeIcon icon={faShekel} className="dashboard-icon" /></h2>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">
            <p>יתרה אחרונה</p>
            <button><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button>
          </h3>
          <h2 className="dashboard-card-value">{lastBalance.toFixed(2)} <FontAwesomeIcon icon={faShekel} className="dashboard-icon" /></h2>
        </div>
        <div className="dashboard-card" onClick={handleProductsCardClick} style={{ cursor: 'pointer' }}>
          <h3 className="dashboard-card-title">
            <p>מוצרים</p>
            <button><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button>
          </h3>
          <h2 className="dashboard-card-value">{productsCount}</h2>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">
            <p>נמוך במלאי</p>
            <button><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button>
          </h3>
          <h2 className="dashboard-card-value">{lowStockCount}</h2>
        </div>
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">
            <p>ערך המלאי</p>
            <button><FontAwesomeIcon icon={faArrowLeftLong} className="dashboard-card-title-icon"/></button>
          </h3>
          <h2 className="dashboard-card-value">{inventoryValue.toFixed(2)} <FontAwesomeIcon icon={faShekel} className="dashboard-icon" /></h2>
        </div>
      </div>

      {/* Main chart area: two rows, two columns */}
      <div className="dashboard-main-charts" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="dashboard-main-row" style={{ display: 'flex', gap: '1.5rem' }}>
          <div className="dashboard-chart-wrapper pie-chart-wrapper">
            <CustomPie products={products} />
          </div>
          <div className="dashboard-chart-wrapper purchases-chart-wrapper">
            <div className="dashboard-purchases">
              <h2 className="dashboard-purchases-title">
                <FontAwesomeIcon icon={faReceipt} className="dashboard-purchases-icon" />
                רכישות אחרונות
              </h2>
              <div className="dashboard-purchases-list">
                {recentPurchases.length > 0 ? (
                  <ul>
                    {recentPurchases.map((purchase) => (
                      <li key={purchase.id} className="dashboard-purchase-item">
                        <span className="dashboard-purchase-date">
                          {purchase.date ? purchase.date.toLocaleDateString('he-IL') : '---'}
                        </span>
                        <span className="dashboard-purchase-amount">
                          {purchase.totalAmount ? purchase.totalAmount.toFixed(2) : '0.00'} ₪
                        </span>
                        <span className="dashboard-purchase-items">
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
        </div>
        <div className="dashboard-main-row" style={{ display: 'flex', gap: '1.5rem' }}>
          <div className="dashboard-chart-wrapper area-chart-wrapper">
            <CustomArea data={areaData} />
          </div>
          <div className="dashboard-chart-wrapper switchable-chart-wrapper">
            <SwitchableBarChart
              budgetData={barData}
              purchaseData={recentPurchases}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDash;


