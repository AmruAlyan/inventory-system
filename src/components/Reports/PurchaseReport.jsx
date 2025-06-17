import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReceipt, faChartLine } from "@fortawesome/free-solid-svg-icons";
import ReportBarChart from "../Charts/ReportBarChart";

const PurchaseReport = ({ purchaseData, formatCurrency, formatDate }) => {
  if (!purchaseData || purchaseData.length === 0) {
    return (
      <div className="no-data">
        <p>לא נמצאו נתוני רכישות לתקופה הנבחרת</p>
      </div>
    );
  }

  // Calculate summary data
  const totalPurchases = purchaseData.length;
  const totalSpent = purchaseData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const averagePurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

  // Prepare chart data with formatted date for X-axis
  const chartData = purchaseData.map(item => {
    const formatted = formatDate(item.date);
    return {
      ...item,
      date: formatted,
      name: formatted,
    };
  });

  return (
    <div className="purchase-report">
      {/* Purchase Summary Card */}
      <div className="report-summary">
        <h3>סיכום רכישות</h3>
        <div className="summary-cards">
          <div className="summary-card purchase-summary">
            <h4><FontAwesomeIcon icon={faReceipt} /> רכישות</h4>
            <p>מספר רכישות: {totalPurchases}</p>
            <p>סה"כ הוצאות: {formatCurrency(totalSpent)}</p>
            <p>ממוצע רכישה: {formatCurrency(averagePurchase)}</p>
          </div>
        </div>
      </div>

      {/* Purchase Chart */}
      <div className="report-section chart-section">
        <h3><FontAwesomeIcon icon={faChartLine} /> תרשים רכישות</h3>
        <div className="chart-container">
          <ReportBarChart data={chartData} reportType="purchase" />
        </div>
      </div>

      {/* Purchase Details Table */}
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
    </div>
  );
};

export default PurchaseReport;
