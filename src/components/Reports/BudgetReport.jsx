import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign, faChartLine, faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import ReportBarChart from "../Charts/ReportBarChart";

const BudgetReport = ({ budgetData, formatCurrency, formatDate }) => {
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });

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

  // Sorting functions
  const handleSort = (field) => {
    const direction = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ field, direction });
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return faSort;
    return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
  };

  // Sorted data
  const sortedBudgetData = useMemo(() => {
    if (!sortConfig.field) return budgetData;
    
    return [...budgetData].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.field) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'totalBudget':
          aValue = a.totalBudget || 0;
          bValue = b.totalBudget || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [budgetData, sortConfig]);

  return (
    <div className="budget-report">
      {/* Budget Summary Card */}
      <div className="report-summary">
        <h3>סיכום תקציב</h3>
        <div className="summary-cards">
          <div className="summary-card budget-summary">
            <h4><FontAwesomeIcon icon={faShekelSign} /> תקציב</h4>
            <p>עדכוני תקציב: {totalUpdates}</p>
            <p>סה"כ הפקדות: {formatCurrency(totalAdded)}</p>
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
                <th className="sortable-header" onClick={() => handleSort('date')}>
                  תאריך <FontAwesomeIcon icon={getSortIcon('date')} />
                </th>
                <th className="sortable-header" onClick={() => handleSort('amount')}>
                  הפקדה נוכחית <FontAwesomeIcon icon={getSortIcon('amount')} />
                </th>
                <th className="sortable-header" onClick={() => handleSort('totalBudget')}>
                  תקציב אחרי עדכון <FontAwesomeIcon icon={getSortIcon('totalBudget')} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBudgetData.map((item, index) => (
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
