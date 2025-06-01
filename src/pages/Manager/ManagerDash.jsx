import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faWallet, faShekel, faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import CustomBar from "../../components/Charts/CustomBar";
import CustomLine from "../../components/Charts/CustomLine";
import CustomPie from "../../components/Charts/CustomPie";
import { db } from '../../firebase/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import Spinner from '../../components/Spinner';

import '../../styles/dashboard.css';
import '../../styles/ForManager/products.css';

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
            date: data.date.toDate(),
            formatted: new Intl.DateTimeFormat('he-IL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(data.date.toDate())
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
          purchases.push({
            id: doc.id,
            date: data.date ? new Date(data.date) : null,
            totalAmount: data.totalAmount,
            items: data.items || [],
          });
        });
        setRecentPurchases(purchases.slice(0, 5));
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <div className="dashboard-card">
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

      <div className="dashboard-charts">
        {barData && barData.length > 0 ? (
          <>
            {/* <div className="dashboard-chart-wrapper">
              <CustomBar data={barData} />
            </div> */}
            <div className="dashboard-chart-wrapper line-chart-wrapper">
              <CustomLine data={barData} />
            </div>
            <div className="dashboard-chart-wrapper pie-chart-wrapper">
              <CustomPie products={products} />
            </div>
          </>
        ) : (
          <div className="dashboard-chart-wrapper dashboard-chart-empty">אין נתוני תקציב להצגה</div>
        )}
      </div>

      <div className="dashboard-level-2">
        <div className="dashboard-purchases">
          <h2 className="dashboard-purchases-title">
            <FontAwesomeIcon icon={faWallet} className="dashboard-purchases-icon" />
            רכישות אחרונות
          </h2>
          <p className="dashboard-purchases-text">הצג רכישות אחרונות שביצעתם</p>
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
        {barData && barData.length > 0 ? (
          <>
            <div className="dashboard-chart-wrapper bar-chart-wrapper">
              <CustomBar data={barData} />
            </div>
            </>
        ) : (
          <div className="dashboard-chart-wrapper dashboard-chart-empty">אין נתוני תקציב להצגה</div>
        )}
      </div>
    </div>
  );
};

export default ManagerDash;


