import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign, faChartLine } from "@fortawesome/free-solid-svg-icons";
import ReportBarChart from "../Charts/ReportBarChart";

const BudgetReport = ({ budgetData, formatCurrency, formatDate }) => {
  if (!budgetData || budgetData.length === 0) {
    return (
      <div className="no-data">
        <p>לא נמצאו נתוני תקציב לתקופה הנבחרת</p>
      </div>
    );
  }
  // Calculate summary data
  const totalUpdates = budgetData.length;
  const totalAdded = budgetData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const finalBudget = budgetData.length > 0 ? budgetData[budgetData.length - 1].totalBudget : 0;

  // Prepare chart data with formatted date for X-axis
  const chartData = budgetData.map(item => ({
    ...item,
    date: formatDate(item.date),
    name: formatDate(item.date),
  }));

  return (
    <div className="budget-report">
      {/* Budget Summary Card */}
      <div className="report-summary">
        <h3>סיכום תקציב</h3>
        <div className="summary-cards">
          <div className="summary-card budget-summary">
            <h4><FontAwesomeIcon icon={faShekelSign} /> תקציב</h4>
            <p>עדכוני תקציב: {totalUpdates}</p>
            <p>סה"כ הוספות: {formatCurrency(totalAdded)}</p>
            <p>תקציב נוכחי: {formatCurrency(finalBudget)}</p>
          </div>
        </div>
      </div>      {/* Budget Chart */}
      <div className="report-section chart-section">
        <h3><FontAwesomeIcon icon={faChartLine} /> תרשים תקציב</h3>        
        <div className="chart-container">
          <ReportBarChart data={chartData} reportType="budget" />
        </div>
      </div>

      {/* Budget Details Table */}
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
    </div>
  );
};

export default BudgetReport;
