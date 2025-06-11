import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faShekelSign, 
  faFileLines, 
  faPrint, 
  faDownload, 
  faCalendarAlt,
  faFilter,
  faFileExport,
  faChartLine,
  faReceipt
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../firebase/firebase";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import Spinner from "../../components/Spinner";
import { toast } from "react-toastify";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import "../../styles/ForManager/products.css";
import "../../styles/ForAdmin/reports.css";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('budget'); // 'budget', 'purchase', 'combined'
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [reportData, setReportData] = useState(null);
  const [budgetData, setBudgetData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day

      let budgetHistory = [];
      let purchaseHistory = [];

      // Fetch budget data if needed
      if (reportType === 'budget' || reportType === 'combined') {
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
      }

      // Fetch purchase data if needed
      if (reportType === 'purchase' || reportType === 'combined') {
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
      }

      // Generate report summary
      const report = {
        type: reportType,
        dateRange: dateRange,
        generatedAt: new Date(),
        budget: {
          totalUpdates: budgetHistory.length,
          totalAdded: budgetHistory.reduce((sum, item) => sum + (item.amount || 0), 0),
          finalBudget: budgetHistory.length > 0 ? budgetHistory[budgetHistory.length - 1].totalBudget : 0
        },
        purchases: {
          totalPurchases: purchaseHistory.length,
          totalSpent: purchaseHistory.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
          averagePurchase: purchaseHistory.length > 0 ? 
            purchaseHistory.reduce((sum, item) => sum + (item.totalAmount || 0), 0) / purchaseHistory.length : 0
        }
      };

      setReportData(report);
      toast.success('הדוח נוצר בהצלחה');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('שגיאה ביצירת הדוח');
    } finally {
      setLoading(false);
    }
  };  const printReport = () => {
    // Add print-specific styling to the page
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
          direction: rtl !important;
          margin: 0 !important;
          padding: 15mm !important;
          background: white !important;
          color: black !important;
        }
        
        /* Hide everything except the printable report */
        body * {
          visibility: hidden;
        }
        
        #printable-report,
        #printable-report * {
          visibility: visible;
        }
        
        #printable-report {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }        /* Hide print header completely */
        .print-header {
          display: none !important;
        }
        
        /* Report title styling */
        .report-title {
          margin: 0 !important;
          padding: 0 !important;
          border-bottom: 2px solid #518664 !important;
          padding-bottom: 10px !important;
        }
        
        .report-title h2 {
          color: #518664 !important;
          font-size: 22px !important;
          font-weight: bold !important;
          text-align: center !important;
          margin: 0 0 10px 0 !important;
          border: none !important;
          padding: 0 !important;
        }
        
        .report-period,
        .report-generated {
          text-align: center !important;
          font-size: 11px !important;
          color: #666 !important;
          margin: 5px 0 !important;
        }
        
        /* Summary cards styling */
        .summary-cards {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 15px !important;
          margin: 20px 0 !important;
          justify-content: space-around !important;
        }
        
        .summary-card {
          border: 1px solid #518664 !important;
          border-radius: 6px !important;
          padding: 12px !important;
          background: #f8f9fa !important;
          min-width: 180px !important;
          flex: 1 !important;
          max-width: 300px !important;
        }
        
        .summary-card h4 {
          color: #518664 !important;
          font-size: 14px !important;
          font-weight: bold !important;
          margin: 0 0 8px 0 !important;
          text-align: right !important;
        }
        
        .summary-card p {
          margin: 4px 0 !important;
          font-size: 11px !important;
          color: #333 !important;
          text-align: right !important;
        }
        
        /* Table styling */
        .report-section {
          margin: 25px 0 !important;
          page-break-inside: avoid !important;
        }
        
        .report-section h3 {
          color: #518664 !important;
          font-size: 16px !important;
          font-weight: bold !important;
          margin: 0 0 12px 0 !important;
          text-align: right !important;
          border-bottom: 1px solid #518664 !important;
          padding-bottom: 5px !important;
        }
        
        .report-table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10px !important;
          margin-top: 10px !important;
        }
        
        .report-table th {
          background-color: #518664 !important;
          color: white !important;
          padding: 8px 6px !important;
          text-align: right !important;
          font-weight: bold !important;
          border: 1px solid #518664 !important;
        }
        
        .report-table td {
          padding: 6px !important;
          text-align: right !important;
          border: 1px solid #ddd !important;
          background: white !important;
        }
        
        .report-table tr:nth-child(even) td {
          background-color: #f8f9fa !important;
        }
        
        /* No data message */
        .no-data {
          text-align: center !important;
          padding: 30px !important;
          color: #666 !important;
          font-style: italic !important;
        }
        
        /* Page break control */
        .summary-cards {
          page-break-inside: avoid !important;
        }
        
        .report-section {
          page-break-inside: avoid !important;
        }
        
        /* Add header to each page */
        @page {
          margin: 15mm;
          @top-center {
            content: "דוח מערכת ניהול מלאי - " attr(data-report-type);
          }
          @bottom-center {
            content: "עמוד " counter(page) " מתוך " counter(pages);
          }
        }
      }
    `;
    
    // Remove existing print styles if any
    const existingStyles = document.getElementById('print-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    // Add the print styles to head
    document.head.appendChild(printStyles);
    
    // Add print timestamp to the report
    const printableReport = document.getElementById('printable-report');
    if (printableReport) {
      // Add print date if not exists
      let printDate = printableReport.querySelector('.print-timestamp');
      if (!printDate) {
        printDate = document.createElement('div');
        printDate.className = 'print-timestamp';
        printDate.style.cssText = 'text-align: center; font-size: 11px; color: #666; margin-top: 15px; display: none;';
        printDate.innerHTML = `נדפס בתאריך: ${new Date().toLocaleDateString('he-IL')} בשעה: ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
        printableReport.appendChild(printDate);
      }
      
      // Show print timestamp only during print
      printDate.style.display = 'block';
      
      // Trigger print
      setTimeout(() => {
        window.print();
        
        // Hide print timestamp after print
        setTimeout(() => {
          printDate.style.display = 'none';
          // Remove print styles after printing
          const printStylesElement = document.getElementById('print-styles');
          if (printStylesElement) {
            printStylesElement.remove();
          }
        }, 1000);
      }, 100);
      
    } else {
      toast.error('לא נמצא תוכן להדפסה');
    }
  };
  const exportToPDF = async () => {
    const printableReport = document.getElementById('printable-report');
    if (!printableReport) {
      toast.error('לא נמצא תוכן להפקת PDF');
      return;
    }

    try {
      toast.info('מתחיל להפיק PDF...');
      
      // Create a loading overlay to prevent user interaction
      const loadingOverlay = document.createElement('div');
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-size: 18px;
      `;
      loadingOverlay.innerHTML = '<div>מייצר PDF...</div>';
      document.body.appendChild(loadingOverlay);

      // Clone the printable report for PDF processing
      const reportClone = printableReport.cloneNode(true);
      reportClone.id = 'pdf-report-clone';
        // Create a temporary container for PDF generation
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: 190mm;
        background: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        direction: rtl;
        text-align: right;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        overflow: hidden;
      `;
      
      // Style the cloned content for PDF
      reportClone.style.cssText = `
        width: 100%;
        background: white;
        color: black;
        direction: rtl;
        text-align: right;
        padding: 10mm;
        margin: 0;
        box-sizing: border-box;
      `;
      
      // Apply PDF-specific styles to the clone
      const style = document.createElement('style');
      style.textContent = `
        #pdf-report-clone .print-header { display: none !important; }
        #pdf-report-clone .report-title { 
          margin: 0 0 20px 0 !important;
          padding-bottom: 10px !important;
          border-bottom: 2px solid #518664 !important;
        }
        #pdf-report-clone .report-title h2 {
          color: #518664 !important;
          font-size: 24px !important;
          font-weight: bold !important;
          text-align: center !important;
          margin: 0 0 10px 0 !important;
        }
        #pdf-report-clone .report-period,
        #pdf-report-clone .report-generated {
          text-align: center !important;
          font-size: 12px !important;
          color: #666 !important;
          margin: 5px 0 !important;
        }
        #pdf-report-clone .summary-cards {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 15px !important;
          margin: 20px 0 !important;
          justify-content: space-around !important;
        }
        #pdf-report-clone .summary-card {
          border: 1px solid #518664 !important;
          border-radius: 6px !important;
          padding: 15px !important;
          background: #f8f9fa !important;
          min-width: 180px !important;
          flex: 1 !important;
          max-width: 300px !important;
        }
        #pdf-report-clone .summary-card h4 {
          color: #518664 !important;
          font-size: 16px !important;
          font-weight: bold !important;
          margin: 0 0 10px 0 !important;
          text-align: right !important;
        }
        #pdf-report-clone .summary-card p {
          margin: 6px 0 !important;
          font-size: 13px !important;
          color: #333 !important;
          text-align: right !important;
        }
        #pdf-report-clone .report-section {
          margin: 25px 0 !important;
        }
        #pdf-report-clone .report-section h3 {
          color: #518664 !important;
          font-size: 18px !important;
          font-weight: bold !important;
          margin: 0 0 15px 0 !important;
          text-align: right !important;
          border-bottom: 1px solid #518664 !important;
          padding-bottom: 5px !important;
        }
        #pdf-report-clone .report-table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 12px !important;
          margin-top: 10px !important;
        }
        #pdf-report-clone .report-table th {
          background-color: #518664 !important;
          color: white !important;
          padding: 10px 8px !important;
          text-align: right !important;
          font-weight: bold !important;
          border: 1px solid #518664 !important;
        }
        #pdf-report-clone .report-table td {
          padding: 8px !important;
          text-align: right !important;
          border: 1px solid #ddd !important;
          background: white !important;
        }
        #pdf-report-clone .report-table tr:nth-child(even) td {
          background-color: #f8f9fa !important;
        }
        #pdf-report-clone .no-data {
          text-align: center !important;
          padding: 30px !important;
          color: #666 !important;
          font-style: italic !important;
        }
      `;
      
      pdfContainer.appendChild(style);
      pdfContainer.appendChild(reportClone);
      document.body.appendChild(pdfContainer);
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 500));
        // Generate canvas from the container
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: pdfContainer.scrollWidth,
        height: pdfContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        logging: false,
        allowTaint: false
      });
      
      // Create PDF with tight margins
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // 10mm margin
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);
      
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin; // Start at margin position
      
      // Add the image to PDF with proper positioning
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;
      
      // Add extra pages if needed
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toLocaleDateString('he-IL').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
      const reportTypeHebrew = reportType === 'budget' ? 'תקציב' : 
                              reportType === 'purchase' ? 'רכישות' : 'משולב';
      const filename = `דוח-${reportTypeHebrew}-${dateStr}-${timeStr}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
      // Clean up
      document.body.removeChild(pdfContainer);
      document.body.removeChild(loadingOverlay);
      
      toast.success('קובץ PDF נוצר בהצלחה!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('שגיאה ביצירת קובץ PDF');
      
      // Clean up on error
      const overlay = document.querySelector('[style*="z-index: 9999"]');
      const container = document.getElementById('pdf-report-clone');
      if (overlay) document.body.removeChild(overlay.parentElement);
      if (container) document.body.removeChild(container.parentElement);
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
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
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
      
      {reportData && !loading && (
        <div className="report-content" id="report-content">
          {/* Report Header */}
          <div className="report-header no-print">
            <div className="report-actions">
              <button onClick={printReport} className="btn btn-secondary">
                <FontAwesomeIcon icon={faPrint} />
                הדפס
              </button>
              <button onClick={exportToPDF} className="btn btn-secondary">
                <FontAwesomeIcon icon={faDownload} />
                ייצא ל-PDF
              </button>
            </div>
          </div>          {/* Printable Report */}
          <div className="printable-report" id="printable-report">
            {/* Professional Print Header - Only visible during print */}
            <div className="print-header" style={{ display: 'none' }}>
              <h1>מערכת ניהול מלאי</h1>
              <div className="company-info">
                <p>דוח מקיף - מחלקת רכש וניהול משאבים</p>
                <p>מוכן על ידי: מערכת ניהול מלאי אוטומטית</p>
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
                נוצר בתאריך: {formatDate(reportData.generatedAt)}
              </p>
            </div>

            {/* Report Summary */}
            <div className="report-summary">
              <h3>סיכום</h3>
              <div className="summary-cards">
                {(reportType === 'budget' || reportType === 'combined') && (
                  <div className="summary-card budget-summary">
                    <h4><FontAwesomeIcon icon={faShekelSign} /> תקציב</h4>
                    <p>עדכוני תקציב: {reportData.budget.totalUpdates}</p>
                    <p>סה"כ הוספות: {formatCurrency(reportData.budget.totalAdded)}</p>
                    <p>תקציב נוכחי: {formatCurrency(reportData.budget.finalBudget)}</p>
                  </div>
                )}
                {(reportType === 'purchase' || reportType === 'combined') && (
                  <div className="summary-card purchase-summary">
                    <h4><FontAwesomeIcon icon={faReceipt} /> רכישות</h4>
                    <p>מספר רכישות: {reportData.purchases.totalPurchases}</p>
                    <p>סה"כ הוצאות: {formatCurrency(reportData.purchases.totalSpent)}</p>
                    <p>ממוצע רכישה: {formatCurrency(reportData.purchases.averagePurchase)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Budget Details */}
            {(reportType === 'budget' || reportType === 'combined') && budgetData.length > 0 && (
              <div className="report-section">
                <h3>פירוט עדכוני תקציב</h3>
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
            )}

            {/* Purchase Details */}
            {(reportType === 'purchase' || reportType === 'combined') && purchaseData.length > 0 && (
              <div className="report-section">
                <h3>פירוט רכישות</h3>
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
            )}

            {/* No Data Message */}
            {((reportType === 'budget' && budgetData.length === 0) ||
              (reportType === 'purchase' && purchaseData.length === 0) ||
              (reportType === 'combined' && budgetData.length === 0 && purchaseData.length === 0)) && (
              <div className="no-data">
                <p>לא נמצאו נתונים לתקופה הנבחרת</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;