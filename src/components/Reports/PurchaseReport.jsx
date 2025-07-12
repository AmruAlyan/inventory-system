import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReceipt, faChartLine, faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import ReportBarChart from "../Charts/ReportBarChart";

const PurchaseReport = ({ purchaseData, formatCurrency, formatDate }) => {
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });

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
  const sortedPurchaseData = useMemo(() => {
    if (!sortConfig.field) return purchaseData;
    
    return [...purchaseData].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.field) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'itemsCount':
          aValue = a.items?.length || 0;
          bValue = b.items?.length || 0;
          break;
        case 'totalAmount':
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case 'budgetBefore':
          aValue = a.budgetBefore || 0;
          bValue = b.budgetBefore || 0;
          break;
        case 'budgetAfter':
          aValue = a.budgetAfter || 0;
          bValue = b.budgetAfter || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [purchaseData, sortConfig]);

  return (
    <div className="purchase-report">
      {/* Purchase Summary Card */}
      <div className="report-summary">
        {/* <h3>סיכום רכישות</h3> */}
        <div className="summary-cards">
          <div className="summary-card purchase-summary">
            <h4><FontAwesomeIcon icon={faReceipt} />סיכום רכישות</h4>
            <p>מספר רכישות: {totalPurchases}</p>
            <p>סה"כ הוצאות: {formatCurrency(totalSpent)}</p>
            <p>ממוצע רכישה: {formatCurrency(averagePurchase)}</p>
          </div>
        </div>
      </div>

      {/* Purchase Chart */}
      <div className="chart-section">
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
                <th className="sortable-header" onClick={() => handleSort('date')}>
                  תאריך <FontAwesomeIcon icon={getSortIcon('date')} />
                </th>
                <th className="sortable-header" onClick={() => handleSort('itemsCount')}>
                  מספר פריטים <FontAwesomeIcon icon={getSortIcon('itemsCount')} />
                </th>
                <th className="sortable-header" onClick={() => handleSort('totalAmount')}>
                  סה"כ רכישה <FontAwesomeIcon icon={getSortIcon('totalAmount')} />
                </th>
                <th className="sortable-header" onClick={() => handleSort('budgetBefore')}>
                  תקציב לפני <FontAwesomeIcon icon={getSortIcon('budgetBefore')} />
                </th>
                <th className="sortable-header" onClick={() => handleSort('budgetAfter')}>
                  תקציב אחרי <FontAwesomeIcon icon={getSortIcon('budgetAfter')} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPurchaseData.map((item, index) => (
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
