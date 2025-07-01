import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign, faReceipt, faChartLine, faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import CustomArea from "../Charts/CustomArea";

const CombinedReport = ({ budgetData, purchaseData, formatCurrency, formatDate }) => {
  // Sorting state for both tables
  const [budgetSort, setBudgetSort] = useState({ field: null, direction: 'asc' });
  const [purchaseSort, setPurchaseSort] = useState({ field: null, direction: 'asc' });

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

  // Sorting functions
  const handleBudgetSort = (field) => {
    const direction = budgetSort.field === field && budgetSort.direction === 'asc' ? 'desc' : 'asc';
    setBudgetSort({ field, direction });
  };

  const handlePurchaseSort = (field) => {
    const direction = purchaseSort.field === field && purchaseSort.direction === 'asc' ? 'desc' : 'asc';
    setPurchaseSort({ field, direction });
  };

  const getSortIcon = (field, currentSort) => {
    if (currentSort.field !== field) return faSort;
    return currentSort.direction === 'asc' ? faSortUp : faSortDown;
  };

  // Sorted data
  const sortedBudgetData = useMemo(() => {
    if (!budgetData || !budgetSort.field) return budgetData;
    
    return [...budgetData].sort((a, b) => {
      let aValue, bValue;
      
      switch (budgetSort.field) {
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
      
      if (aValue < bValue) return budgetSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return budgetSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [budgetData, budgetSort]);

  const sortedPurchaseData = useMemo(() => {
    if (!purchaseData || !purchaseSort.field) return purchaseData;
    
    return [...purchaseData].sort((a, b) => {
      let aValue, bValue;
      
      switch (purchaseSort.field) {
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
      
      if (aValue < bValue) return purchaseSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return purchaseSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [purchaseData, purchaseSort]);


  return (
    <div className="combined-report">
      {/* Combined Summary Cards */}
      <div className="report-summary">
        <h3>סיכום</h3>
        <div className="summary-cards">
          <div className="summary-card budget-summary">
            <h4><FontAwesomeIcon icon={faShekelSign} /> תקציב</h4>
            <p>עדכוני תקציב: {budgetSummary.totalUpdates}</p>
            <p>סה"כ הפקדות: {formatCurrency(budgetSummary.totalAdded)}</p>
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
                  <th className="sortable-header" onClick={() => handleBudgetSort('date')}>
                    תאריך <FontAwesomeIcon icon={getSortIcon('date', budgetSort)} />
                  </th>
                  <th className="sortable-header" onClick={() => handleBudgetSort('amount')}>
                    הפקדה נוכחית <FontAwesomeIcon icon={getSortIcon('amount', budgetSort)} />
                  </th>
                  <th className="sortable-header" onClick={() => handleBudgetSort('totalBudget')}>
                    תקציב אחרי עדכון <FontAwesomeIcon icon={getSortIcon('totalBudget', budgetSort)} />
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
      )}

      {/* Purchase Details Table */}
      {purchaseData?.length > 0 && (
        <div className="report-section">
          <h3>פירוט רכישות</h3>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="sortable-header" onClick={() => handlePurchaseSort('date')}>
                    תאריך <FontAwesomeIcon icon={getSortIcon('date', purchaseSort)} />
                  </th>
                  <th className="sortable-header" onClick={() => handlePurchaseSort('itemsCount')}>
                    מספר פריטים <FontAwesomeIcon icon={getSortIcon('itemsCount', purchaseSort)} />
                  </th>
                  <th className="sortable-header" onClick={() => handlePurchaseSort('totalAmount')}>
                    סה"כ רכישה <FontAwesomeIcon icon={getSortIcon('totalAmount', purchaseSort)} />
                  </th>
                  <th className="sortable-header" onClick={() => handlePurchaseSort('budgetBefore')}>
                    תקציב לפני <FontAwesomeIcon icon={getSortIcon('budgetBefore', purchaseSort)} />
                  </th>
                  <th className="sortable-header" onClick={() => handlePurchaseSort('budgetAfter')}>
                    תקציב אחרי <FontAwesomeIcon icon={getSortIcon('budgetAfter', purchaseSort)} />
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
      )}
    </div>
  );
};

export default CombinedReport;
