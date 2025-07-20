import React, { useState, useEffect } from "react";
import "../../styles/ForAdmin/budget.css";
import "../../styles/ForManager/products.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign, faSpinner } from "@fortawesome/free-solid-svg-icons";
import BudgetHistoryTable from "../../components/AdminOnly/BudgetHistoryTable";
import Spinner from "../../components/Spinner";
import { db } from "../../firebase/firebase";
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, Timestamp, addDoc } from "firebase/firestore";
import SwitchableBarChart from "../../components/Charts/SwitchableBarChart";
import SortableTable from "../../components/SortableTable.jsx";

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
  const [minAllowedDate, setMinAllowedDate] = useState("");

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch budget data
        const budgetDocRef = doc(db, "budgets", "current");
        const budgetSnapshot = await getDoc(budgetDocRef);
        
        // Fetch budget history - handle empty collection gracefully
        let historyData = [];
        try {
          const historyQuery = query(
            collection(db, "budgets", "history", "entries"),
            orderBy("date", "desc")
          );
          const historySnapshot = await getDocs(historyQuery);
          
          historySnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date && data.date.toDate ? data.date.toDate() : new Date(data.date);
            historyData.push({
              id: doc.id,
              amount: data.amount || 0,
              date: date,
              formatted: new Intl.DateTimeFormat('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }).format(date)
            });
          });
          
          // Sort history by date (newest first)
          historyData.sort((a, b) => b.date - a.date);
        } catch (historyError) {
          console.warn("Budget history collection may not exist yet:", historyError);
          // Continue with empty history - this is normal for new installations
        }
        
        setBudgetHistory(historyData);
        
        // Fetch purchases for the chart - handle empty collection gracefully
        let purchasesData = [];
        try {
          const purchasesQuery = query(
            collection(db, 'purchases/history/items'),
            orderBy('date', 'desc')
          );
          const purchasesSnapshot = await getDocs(purchasesQuery);
          
          purchasesSnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date && data.date.toDate ? data.date.toDate() : new Date(data.date);
            purchasesData.push({
              id: doc.id,
              totalAmount: data.totalAmount || 0,
              date: date,
              formatted: new Intl.DateTimeFormat('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }).format(date)
            });
          });
          
          purchasesData.sort((a, b) => b.date - a.date);
        } catch (purchaseError) {
          console.warn("Purchase history collection may not exist yet:", purchaseError);
          // Continue with empty purchases - this is normal for new installations
        }
        
        setPurchaseChartData(purchasesData);
        
        // Calculate minimum allowed date based on latest budget entry or purchase
        let latestTransactionDate = null;
        
        // Check latest budget history entry
        if (historyData.length > 0) {
          latestTransactionDate = historyData[0].date;
        }
        
        // Check latest purchase entry and compare
        if (purchasesData.length > 0) {
          const latestPurchaseDate = purchasesData[0].date;
          if (!latestTransactionDate || latestPurchaseDate > latestTransactionDate) {
            latestTransactionDate = latestPurchaseDate;
          }
        }
        
        // Set minimum date (if no transactions, allow any date up to today)
        if (latestTransactionDate) {
          setMinAllowedDate(latestTransactionDate.toISOString().split("T")[0]);
        } else {
          setMinAllowedDate(""); // No minimum restriction if no previous transactions
        }
        
        // Set form data based on budget document and history
        const currentBudget = budgetSnapshot.exists() ? (budgetSnapshot.data().totalBudget || 0) : 0;
        
        // Get latest update info from history entries (first entry is most recent due to sorting)
        let latestAmount = 0;
        let latestDate = new Date().toISOString().split("T")[0];
        let latestTime = null; // Add time tracking
        
        if (historyData.length > 0) {
          const latestEntry = historyData[0]; // First entry is most recent
          latestAmount = latestEntry.amount || 0;
          latestDate = latestEntry.date.toISOString().split("T")[0];
          latestTime = latestEntry.date; // Store the full datetime
        }
        
        setFormData({
          current: currentBudget,
          latest: {
            amount: latestAmount,
            date: latestDate,
            timestamp: latestTime // Add timestamp to form data
          },
          updates: { amount: "", date: "" }
        });
        
        // Initialize budget document if it doesn't exist
        if (!budgetSnapshot.exists()) {
          const initialData = {
            totalBudget: 0
          };
          await setDoc(budgetDocRef, initialData);
        }
      } catch (err) {
        console.error("Error fetching budget data:", err);
        setError("אירעה שגיאה בטעינת נתוני התקציב: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBudgetData();
  }, [refreshData]);

  const handleUpdate = async () => {
    const updateAmount = parseFloat(formData.updates.amount);
    const updateDate = formData.updates.date;
    
    // Validation
    if (isNaN(updateAmount) || updateAmount <= 0) {
      setError("אנא הכנס סכום חיובי תקין");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!updateDate) {
      setError("אנא בחר תאריך");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const newTotalBudget = formData.current + updateAmount;
      // Create timestamp with current time but use the selected date
      const selectedDate = new Date(updateDate);
      const now = new Date();
      // Set the selected date but keep current time
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      const entryTimestamp = Timestamp.fromDate(selectedDate);
      
      // Update current budget document (remove latestUpdate as we get it from history)
      const budgetDocRef = doc(db, "budgets", "current");
      await setDoc(budgetDocRef, {
        totalBudget: newTotalBudget
      }, { merge: true });
      
      // Add to history with the timestamp
      const historyRef = collection(db, "budgets", "history", "entries");
      await addDoc(historyRef, {
        amount: updateAmount,
        totalBudget: newTotalBudget,
        date: entryTimestamp
      });
      
      // Update local state immediately
      setFormData(prev => ({
        current: newTotalBudget,
        latest: { 
          amount: updateAmount, 
          date: updateDate,
          timestamp: selectedDate // Store the full timestamp
        },
        updates: { amount: "", date: "" },
      }));
      
      // Add new entry to history state
      const newHistoryEntry = {
        id: new Date().getTime().toString(),
        amount: updateAmount,
        date: selectedDate, // Use the full timestamp instead of new Date(updateDate)
        formatted: new Intl.DateTimeFormat('he-IL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(selectedDate)
      };
      
      setBudgetHistory(prev => [newHistoryEntry, ...prev]);
      
      // Trigger table refresh
      setTableRefreshTrigger(prev => prev + 1);
      
    } catch (err) {
      console.error("Error updating budget:", err);
      setError("אירעה שגיאה בעדכון התקציב: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetHistoryChange = async () => {
    try {
      setError(null);
      
      // Only refresh if not already loading to prevent multiple simultaneous calls
      if (isLoading) {
        return;
      }
      
      // Trigger data refresh to refetch everything including history
      setRefreshData(prev => !prev);
      
    } catch (error) {
      console.error("Error refreshing budget data:", error);
      setError("אירעה שגיאה בעדכון נתוני התקציב: " + error.message);
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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
                  <h3>הכנסה אחרונה</h3>
                  <div className="latest-update-value">
                    <FontAwesomeIcon icon={faShekelSign} className="shekel-icon" />
                    {formData.latest.amount.toFixed(2)}
                  </div>
                  <div className="latest-update-date">
                    {formData.latest.timestamp ? 
                      formatDateTime(formData.latest.timestamp) : 
                      formatDate(formData.latest.date)
                    }
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
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="הכנס סכום"
                      value={formData.updates.amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or positive numbers
                        if (value === "" || (parseFloat(value) > 0 && !isNaN(parseFloat(value)))) {
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
                      min={minAllowedDate} // Minimum date based on latest transaction
                      max={new Date().toISOString().split("T")[0]} // Prevent future dates
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
                    disabled={isLoading || !formData.updates.amount || !formData.updates.date}
                  >
                    {isLoading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : "עדכן תקציב"}
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
