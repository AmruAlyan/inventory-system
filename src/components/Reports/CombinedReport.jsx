import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign, faReceipt, faChartLine } from "@fortawesome/free-solid-svg-icons";
import CustomArea from "../Charts/CustomArea";

const CombinedReport = ({ budgetData, purchaseData, formatCurrency, formatDate }) => {
  if ((!budgetData || budgetData.length === 0) && (!purchaseData || purchaseData.length === 0)) {
    return (
      <div className="no-data">
        <p>לא נמצאו נתונים לתקופה הנבחרת</p>
      </div>
    );
  }

  // Calculate budget summary
  const budgetSummary = {
    totalUpdates: budgetData?.length || 0,
    totalAdded: budgetData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
    finalBudget: budgetData?.length > 0 ? budgetData[budgetData.length - 1].totalBudget : 0
  };

  // Calculate purchase summary
  const purchaseSummary = {
    totalPurchases: purchaseData?.length || 0,
    totalSpent: purchaseData?.reduce((sum, item) => sum + (item.totalAmount || 0), 0) || 0,
    averagePurchase: purchaseData?.length > 0 ? 
      purchaseData.reduce((sum, item) => sum + (item.totalAmount || 0), 0) / purchaseData.length : 0
  };  // Prepare combined chart data - track budget status over time
  const areaBudgetData = (budgetData || []).map(item => ({
    date: item.date,
    value: item.totalBudget
  }));
  const areaPurchaseData = (purchaseData || [])
    .filter(item => item.budgetAfter !== undefined)
    .map(item => ({
      date: item.date,
      value: item.budgetAfter
    }));
  const combinedChartData = [...areaBudgetData, ...areaPurchaseData]
    .sort((a, b) => new Date(a.date) - new Date(b.date)) || [];


  return (
    <div className="combined-report">
      {/* Combined Summary Cards */}
      <div className="report-summary">
        <h3>סיכום</h3>
        <div className="summary-cards">
          <div className="summary-card budget-summary">
            <h4><FontAwesomeIcon icon={faShekelSign} /> תקציב</h4>
            <p>עדכוני תקציב: {budgetSummary.totalUpdates}</p>
            <p>סה"כ הוספות: {formatCurrency(budgetSummary.totalAdded)}</p>
            <p>תקציב נוכחי: {formatCurrency(budgetSummary.finalBudget)}</p>
          </div>
          <div className="summary-card purchase-summary">
            <h4><FontAwesomeIcon icon={faReceipt} /> רכישות</h4>
            <p>מספר רכישות: {purchaseSummary.totalPurchases}</p>
            <p>סה"כ הוצאות: {formatCurrency(purchaseSummary.totalSpent)}</p>
            <p>ממוצע רכישה: {formatCurrency(purchaseSummary.averagePurchase)}</p>
          </div>
        </div>
      </div>

      {/* Combined Chart */}
      {budgetData?.length > 0 && purchaseData?.length > 0 && (
        <div className="report-section chart-section">
          <h3><FontAwesomeIcon icon={faChartLine} /> תרשים תקציב</h3>
          <div className="chart-container">
            <CustomArea data={combinedChartData} type="budget" chartOnly={true} />
          </div>
        </div>
      )}

      {/* Budget Details Table */}
      {budgetData?.length > 0 && (
        <div className="report-section">
          <h3>פירוט עדכוני תקציב</h3>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>סכום עדכון</th>
                  <th>תקציב אחרי עדכון</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.date)}</td>
                    <td>{formatCurrency(item.amount || 0)}</td>
                    <td>{formatCurrency(item.totalBudget || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Details Table */}
      {purchaseData?.length > 0 && (
        <div className="report-section">
          <h3>פירוט רכישות</h3>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>מספר פריטים</th>
                  <th>סה"כ רכישה</th>
                  <th>תקציב לפני</th>
                  <th>תקציב אחרי</th>
                </tr>
              </thead>
              <tbody>
                {purchaseData.map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.items?.length || 0}</td>
                    <td>{formatCurrency(item.totalAmount || 0)}</td>
                    <td>{formatCurrency(item.budgetBefore || 0)}</td>
                    <td>{formatCurrency(item.budgetAfter || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedReport;
