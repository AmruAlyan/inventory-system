import React, { useState, useEffect } from "react";
import "../../styles/ForAdmin/budget.css";
import "../../styles/ForManager/products.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign, faSpinner } from "@fortawesome/free-solid-svg-icons";
// import CustomBar from "../../components/Charts/CustomBar";
import BudgetHistoryTable from "../../components/AdminOnly/BudgetHistoryTable";
import Spinner from "../../components/Spinner";
import { db } from "../../firebase/firebase";
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, Timestamp, addDoc } from "firebase/firestore";
import SwitchableBarChart from "../../components/Charts/SwitchableBarChart";

const Budget = () => {
  const [formData, setFormData] = useState({
    current: 0.00,
    latest: { amount: 0.00, date: new Date().toISOString().split("T")[0] },
    updates: { amount: "", date: "" },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [refreshData, setRefreshData] = useState(false);
  const [tableRefreshTrigger, setTableRefreshTrigger] = useState(0);
  const [purchaseChartData, setPurchaseChartData] = useState([]);

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true);
        const budgetDocRef = doc(db, "budgets", "current");
        const budgetSnapshot = await getDoc(budgetDocRef);
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
        historyData.sort((a, b) => b.date - a.date);
        setBudgetHistory(historyData);
        // Fetch purchases for the chart
        const purchasesQuery = query(
          collection(db, 'purchases/history/items'),
          orderBy('date', 'desc')
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        const purchasesData = [];
        purchasesSnapshot.forEach(doc => {
          const data = doc.data();
          purchasesData.push({
            id: doc.id,
            totalAmount: data.totalAmount || 0,
            date: data.date && data.date.toDate ? data.date.toDate() : new Date(),
            formatted: data.date && data.date.toDate ? new Intl.DateTimeFormat('he-IL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(data.date.toDate()) : ''
          });
        });
        purchasesData.sort((a, b) => b.date - a.date);
        setPurchaseChartData(purchasesData);
        if (budgetSnapshot.exists()) {
          const data = budgetSnapshot.data();
          if (data && data.latestUpdate && data.latestUpdate.date && data.latestUpdate.date.toDate) {
            setFormData({
              current: data.totalBudget || 0,
              latest: {
                amount: data.latestUpdate.amount || 0,
                date: data.latestUpdate.date.toDate().toISOString().split("T")[0]
              },
              updates: { amount: "", date: "" }
            });
          } else {
            setFormData({
              current: 0,
              latest: {
                amount: 0,
                date: new Date(Date.now()).toISOString().split("T")[0]
              },
              updates: { amount: "", date: "" }
            });
            if (!budgetSnapshot.exists()) {
              await setDoc(budgetDocRef, {
                totalBudget: 0,
                latestUpdate: {
                  amount: 0,
                  date: Timestamp.fromDate(new Date())
                }
              });
            }
          }
        } else {
          const now = Date.now();
          setFormData({
            current: 0,
            latest: {
              amount: 0,
              date: new Date(now).toISOString().split("T")[0]
            },
            updates: { amount: "", date: "" }
          });
          await setDoc(budgetDocRef, {
            totalBudget: 0,
            latestUpdate: {
              amount: 0,
              date: Timestamp.fromDate(new Date())
            }
          });
        }
      } catch (err) {
        setError("אירעה שגיאה בטעינת נתוני התקציב");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBudgetData();
  }, [refreshData]);

  const handleUpdate = async () => {
    const updateAmount = parseFloat(formData.updates.amount);
    const updateDate = formData.updates.date;
    if (!isNaN(updateAmount) && updateDate) {
      try {
        setIsLoading(true);
        const newTotalBudget = formData.current + updateAmount;
        const entryDate = Timestamp.fromDate(new Date(updateDate));
        const budgetDocRef = doc(db, "budgets", "current");
        await setDoc(budgetDocRef, {
          totalBudget: newTotalBudget,
          latestUpdate: {
            amount: updateAmount,
            date: entryDate
          }
        }, { merge: true });
        const historyRef = collection(db, "budgets", "history", "entries");
        await addDoc(historyRef, {
          amount: updateAmount,
          totalBudget: newTotalBudget,
          date: entryDate
        });
        setFormData(prev => ({
          current: newTotalBudget,
          latest: { amount: updateAmount, date: updateDate },
          updates: { amount: "", date: "" },
        }));
        setBudgetHistory(prev =>
          [...prev, {
            id: new Date().getTime().toString(),
            amount: updateAmount,
            date: new Date(updateDate),
            formatted: new Intl.DateTimeFormat('he-IL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(new Date(updateDate))
          }].sort((a, b) => b.date - a.date)
        );
        setTableRefreshTrigger(prev => prev + 1);
      } catch (err) {
        setError("אירעה שגיאה בעדכון התקציב");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("אנא מלא את כל השדות הנדרשים");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleBudgetHistoryChange = async () => {
    try {
      const budgetDocRef = doc(db, "budgets", "current");
      const budgetSnapshot = await getDoc(budgetDocRef);
      if (budgetSnapshot.exists()) {
        const data = budgetSnapshot.data();
        let latestAmount = 0;
        let latestDate = Date.now();
        if (data && data.latestUpdate) {
          latestAmount = data.latestUpdate.amount || 0;
          if (typeof data.latestUpdate.date === 'number' && !isNaN(data.latestUpdate.date)) {
            latestDate = data.latestUpdate.date;
          }
        }
        setFormData(prev => ({
          current: data.totalBudget || 0,
          latest: {
            amount: latestAmount,
            date: new Date(latestDate).toISOString().split("T")[0]
          },
          updates: { amount: "", date: "" }
        }));
      } else {
        setFormData(prev => ({
          current: 0,
          latest: { amount: 0, date: new Date(Date.now()).toISOString().split("T")[0] },
          updates: { amount: "", date: "" }
        }));
      }
      setBudgetHistory([]);
      setRefreshData(prev => !prev);
    } catch (error) {
      setError("אירעה שגיאה בעדכון נתוני התקציב");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jerusalem'
    }).format(date);
  };

  return (
    <div className="inventory-container">
      <div className="page-header">
        <h1>
          <FontAwesomeIcon icon={faShekelSign} className="page-header-icon" />
          תקציב
        </h1>
      </div>
      {error && <div className="error-message">{error}</div>}
      {isLoading ? (
        <Spinner text="טוען נתונים..." />
      ) : (
        <>
          <div className="budget-content">
            <div className="budget-content-row">
              <div className="cards-holder">
                <div className="current-budget">
                  <h3>התקציב הנוכחי</h3>
                  <div className="current-budget-value">
                    <FontAwesomeIcon icon={faShekelSign} className="shekel-icon" />
                    {formData.current.toFixed(2)}
                  </div>
                </div>
                <div className="latest-update">
                  <h3>עדכון אחרון</h3>
                  <div className="latest-update-value">
                    <FontAwesomeIcon icon={faShekelSign} className="shekel-icon" />
                    {formData.latest.amount.toFixed(2)}
                  </div>
                  <div className="latest-update-date">
                    {formatDate(formData.latest.date)}
                  </div>
                </div>
              </div>
              <div className="update-budget">
                <h3>הגדלת התקציב</h3>
                <div className="update-budget-form">
                  <div className="form">
                    <label htmlFor="budget-amount">סכום:</label>
                    <input
                      id="budget-amount"
                      type="number"
                      step={0.10}
                      required
                      value={formData.updates.amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (parseFloat(value) >= 0 || value === "") {
                          setFormData({
                            ...formData,
                            updates: { ...formData.updates, amount: value },
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="form">
                    <label htmlFor="budget-date">תאריך:</label>
                    <input
                      id="budget-date"
                      type="date"
                      required
                      value={formData.updates.date}
                      className="date-input"
                      onChange={(e) => {
                        const inputDate = e.target.value;
                        setFormData({
                          ...formData,
                          updates: { ...formData.updates, date: inputDate },
                        });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="update-button"
                    onClick={handleUpdate}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : "עדכן"}
                  </button>
                </div>
              </div>
            </div>
            <div className="budget-content-row">
              <div className="budget-chart">
                <SwitchableBarChart
                  budgetData={budgetHistory}
                  purchaseData={purchaseChartData}
                />
              </div>
            </div>
            <div className="budget-content-row">
              <BudgetHistoryTable
                onBudgetChange={handleBudgetHistoryChange}
                refreshTrigger={tableRefreshTrigger}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Budget;
