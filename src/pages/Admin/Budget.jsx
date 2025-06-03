import React, { useState, useEffect } from "react";
import "../../styles/ForAdmin/budget.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign, faSpinner } from "@fortawesome/free-solid-svg-icons";
import CustomBar from "../../components/Charts/CustomBar"; 
import BudgetHistoryTable from "../../components/AdminOnly/BudgetHistoryTable";
import { db } from "../../firebase/firebase";
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, Timestamp, serverTimestamp, addDoc } from "firebase/firestore";

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

  // Fetch budget data from Firestore
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true);
        
        // Get the main budget document (current value)
        const budgetDocRef = doc(db, "budgets", "current");
        const budgetSnapshot = await getDoc(budgetDocRef);
        
        // Get budget history for the chart
        const historyQuery = query(
          collection(db, "budgets", "history", "entries"), 
          orderBy("date", "desc")
        );
        const historySnapshot = await getDocs(historyQuery);
        const historyData = [];
        
        // Process history data for the chart
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
        
        setBudgetHistory(historyData);
        
        // If budget document exists, use its data
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
            // Handle case where the budget document doesn't exist yet or is missing fields
            setFormData({
              current: 0,
              latest: {
                amount: 0,
                date: new Date(Date.now()).toISOString().split("T")[0]
              },
              updates: { amount: "", date: "" }
            });
            // Create an empty budget document if not present
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
          // No budget document at all
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
        console.error("Error fetching budget data:", err);
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
        // New total budget value
        const newTotalBudget = formData.current + updateAmount;
        // Parse the user input date (YYYY-MM-DD) to Firestore Timestamp
        const entryDate = Timestamp.fromDate(new Date(updateDate));
        // Update the current budget document
        const budgetDocRef = doc(db, "budgets", "current");
        await setDoc(budgetDocRef, {
          totalBudget: newTotalBudget,
          latestUpdate: {
            amount: updateAmount,
            date: entryDate // Use Firestore Timestamp
          }
        }, { merge: true });
        // Add to history collection, use Firestore auto-generated ID
        const historyRef = collection(db, "budgets", "history", "entries");
        await addDoc(historyRef, {
          amount: updateAmount,
          totalBudget: newTotalBudget,
          date: entryDate
        });
        
        // Update local state
        setFormData(prev => ({
          current: newTotalBudget,
          latest: { amount: updateAmount, date: updateDate },
          updates: { amount: "", date: "" },
        }));
        
        // Update budget history and sort by date
        const newEntry = {
          id: new Date().getTime().toString(),
          amount: updateAmount, 
          date: new Date(updateDate),
          formatted: new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(new Date(updateDate))
        };
        
        setBudgetHistory(prev => 
          [...prev, newEntry].sort((a, b) => b.date - a.date) // Sort by date (newest first)
        );
        
        // Trigger table refresh
        setTableRefreshTrigger(prev => prev + 1);
        
      } catch (err) {
        console.error("Error updating budget:", err);
        setError("אירעה שגיאה בעדכון התקציב");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("אנא מלא את כל השדות הנדרשים");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle refresh when budget history is modified
  const handleBudgetHistoryChange = async () => {
    try {
      // Get the latest budget information directly from Firestore
      const budgetDocRef = doc(db, "budgets", "current");
      const budgetSnapshot = await getDoc(budgetDocRef);
      
      if (budgetSnapshot.exists()) {
        const data = budgetSnapshot.data();
        let latestAmount = 0;
        let latestDate = Date.now();
        if (data && data.latestUpdate) {
          latestAmount = data.latestUpdate.amount || 0;
          // Only use the date if it's a valid number
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
        // Reset if there's no data
        setFormData(prev => ({
          current: 0,
          latest: { amount: 0, date: new Date(Date.now()).toISOString().split("T")[0] },
          updates: { amount: "", date: "" }
        }));
      }
      
      // Clear the budget history
      setBudgetHistory([]);
      
      // Trigger a refresh of data
      setRefreshData(prev => !prev);
    } catch (error) {
      console.error("Error refreshing budget data:", error);
      setError("אירעה שגיאה בעדכון נתוני התקציב");
    }
  };

  // Format date for display with improved Hebrew formatting
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
    <div className="budget-container">
        {/* Title */}
        <div className="budget-title"><h1><u>תקציב</u></h1></div>
        
        {isLoading && (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
            <span>טוען נתונים...</span>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}

        {/* Main Content */}
        <div className="main-content">
            {/* Cards Section */}
            <section className="budget-content">
                    {/* Current Budget */}
                <div className="current-budget">
                    <h3>התקציב הנוכחי</h3>
                    <div className="current-budget-value">
                        {formData.current.toFixed(2)}
                        <FontAwesomeIcon icon={faShekelSign} className="shekel-icon" />
                    </div>
                </div>

                    {/* Latest Update */}
                <div className="latest-update">
                    <h3>עדכון אחרון</h3>
                    <div className="latest-update-value">
                        {formData.latest.amount.toFixed(2)}
                        <FontAwesomeIcon icon={faShekelSign} className="shekel-icon" />
                    </div>
                    <div className="latest-update-date">
                        {formatDate(formData.latest.date)}
                    </div>
                </div>

                    {/* Update Budget Form */}
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
            </section>

            {/* Graph Section */}
            <section className="budget-chart">
                <CustomBar data={budgetHistory} />
            </section>
        </div>
        
        {/* Budget History Table Section */}
        <BudgetHistoryTable 
          onBudgetChange={handleBudgetHistoryChange}
          refreshTrigger={tableRefreshTrigger} 
        />
    </div>
  );
};

export default Budget;
