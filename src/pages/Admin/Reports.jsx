import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileLines, 
  faPrint, 
  faFilePdf, 
  faFilter,
  faChartLine
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../firebase/firebase";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import Spinner from "../../components/Spinner";
import { BudgetReport, PurchaseReport, CombinedReport } from "../../components/Reports";
import { printReport, exportToPDF } from "../../utils/reportExport";
import { toast } from "react-toastify";
import logo from "../../assets/pics/Logo-green.svg";

import "../../styles/ForManager/products.css";
import "../../styles/ForAdmin/reports.css";

const Reports = () => {  const [loading, setLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('budget'); // What user selected in dropdown
  const [reportType, setReportType] = useState('budget'); // What's actually being displayed
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [reportGenerated, setReportGenerated] = useState(false);
  const [budgetData, setBudgetData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const generateReport = async () => {
    setLoading(true);
    try {
      // Update the actual report type to what was selected
      setReportType(selectedReportType);
      
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day

      let budgetHistory = [];
      let purchaseHistory = [];

      // Fetch budget data if needed
      if (selectedReportType === 'budget' || selectedReportType === 'combined') {
        const budgetQuery = query(
          collection(db, "budgets", "history", "entries"),
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "asc")
        );
        const budgetSnapshot = await getDocs(budgetQuery);
        budgetHistory = budgetSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));
        setBudgetData(budgetHistory);
      }      // Fetch purchase data if needed
      if (selectedReportType === 'purchase' || selectedReportType === 'combined') {
        const purchaseQuery = query(
          collection(db, 'purchases/history/items'),
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "asc")
        );
        const purchaseSnapshot = await getDocs(purchaseQuery);
        purchaseHistory = purchaseSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));
        setPurchaseData(purchaseHistory);
      }      // Generate report summary
      setReportGenerated(true);
      toast.success('הדוח נוצר בהצלחה');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('שגיאה ביצירת הדוח');
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)} ₪`;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('he-IL').format(date);
  };

  return (
    <div className="inventory-container">
      <div className="page-header">
        <h1>
          <FontAwesomeIcon icon={faFileLines} className="page-header-icon" />
          דוחות
        </h1>
      </div>

      {/* Report Configuration */}
      <div className="report-config">
        <div className="config-section">
          <h3>הגדרות דוח</h3>
          <div className="config-form">
            <div className="form-group">
              <label>סוג דוח:</label>              
              <select 
                value={selectedReportType} 
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="form-control"
              >
                <option value="budget">דוח תקציב</option>
                <option value="purchase">דוח רכישות</option>
                <option value="combined">דוח משולב</option>
              </select>
            </div>
            <div className="form-group">
              <label>תאריך התחלה:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>תאריך סיום:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="form-control"
              />
            </div>
            <button 
              onClick={generateReport} 
              disabled={loading}
              className="btn btn-primary generate-btn"
            >
              {loading ? <FontAwesomeIcon icon={faFilter} spin /> : <FontAwesomeIcon icon={faChartLine} />}
              {loading ? 'מייצר דוח...' : 'צור דוח'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {loading && <Spinner text="מייצר דוח..." />}
      
      {reportGenerated && !loading && (
        <div className="report-content" id="report-content">
          {/* Report Header */}
          <div className="report-header no-print">
            <div className="report-actions">
              <button onClick={printReport} className="btn" title="הדפס דוח">
                <FontAwesomeIcon icon={faPrint} />
              </button>
              <button onClick={exportToPDF} className="btn btn-secondary" title="ייצא ל-PDF">
                <FontAwesomeIcon icon={faFilePdf} />
              </button>
            </div>
          </div>          
          {/* Printable Report */}
          <div className="printable-report" id="printable-report">
              {/* Association Header */}            
            <div className="association-header">
              <div className="association-info">
                <h1 className="association-title">מערכת ניהול מלאי</h1>
                <p className="association-subtitle">עמותת ותיקי מטה יהודה</p>
              </div>
              <div className="association-logo">
                <img src={logo} alt="לוגו הארגון" className="report-logo" />
              </div>
            </div>

            <div className="report-title">
              <h2>
                {reportType === 'budget' && 'דוח תקציב'}
                {reportType === 'purchase' && 'דוח רכישות'}
                {reportType === 'combined' && 'דוח משולב - תקציב ורכישות'}
              </h2>
              <p className="report-period">
                תקופה: {formatDate(new Date(dateRange.startDate))} - {formatDate(new Date(dateRange.endDate))}
              </p>              
              <p className="report-generated">
                נוצר בתאריך: {formatDate(new Date())}
              </p>
            </div>            
            {/* Report Content - Using Modular Components */}
            {reportType === 'budget' && (
              <BudgetReport 
                budgetData={budgetData} 
                formatCurrency={formatCurrency} 
                formatDate={formatDate} 
              />
            )}
            
            {reportType === 'purchase' && (
              <PurchaseReport 
                purchaseData={purchaseData} 
                formatCurrency={formatCurrency} 
                formatDate={formatDate} 
              />
            )}
            
            {reportType === 'combined' && (
              <CombinedReport 
                budgetData={budgetData} 
                purchaseData={purchaseData} 
                formatCurrency={formatCurrency} 
                formatDate={formatDate} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;