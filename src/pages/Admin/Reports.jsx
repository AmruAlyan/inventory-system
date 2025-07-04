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
import { exportToPDF } from "../../utils/reportExport";
import { toast } from "react-toastify";
// import logo from "../../assets/pics/Logo-green.svg";
import logo from "../../assets/pics/Home1.png";
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
      toast.success('הדו״ח נוצר בהצלחה');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('שגיאה ביצירת הדו״ח');
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

  // Print report function using blank window method like shopping list
  const printReport = () => {
    if (!reportGenerated) {
      toast.error('אנא צור דו״ח קודם');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    // Generate report content based on type
    let reportContent = '';
    
    if (reportType === 'budget') {
      const totalUpdates = budgetData.length;
      const totalAdded = budgetData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const finalBudget = budgetData.length > 0 ? budgetData[budgetData.length - 1].totalBudget : 0;
      
      reportContent = `
        <div class="section">
          <h2>סיכום תקציב</h2>
          <div class="summary-cards">
            <div class="summary-card">
              <h3>סה"כ עדכונים</h3>
              <p class="summary-value">${totalUpdates}</p>
            </div>
            <div class="summary-card">
              <h3>סה"כ הפקדות</h3>
              <p class="summary-value">${formatCurrency(totalAdded)}</p>
            </div>
            <div class="summary-card">
              <h3>תקציב נוכחי</h3>
              <p class="summary-value">${formatCurrency(finalBudget)}</p>
            </div>
          </div>
        </div>
        
        ${budgetData.length > 0 ? `
        <div class="section">
          <h2>פירוט עדכוני התקציב</h2>
          <table>
            <thead>
              <tr>
                <th>תאריך</th>
                <th>הפקדה נוכחית</th>
                <th>תקציב אחרי עדכון</th>
              </tr>
            </thead>
            <tbody>
              ${budgetData.map(item => `
                <tr>
                  <td>${formatDate(item.date)}</td>
                  <td>${formatCurrency(item.amount || 0)}</td>
                  <td>${formatCurrency(item.totalBudget || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      `;
    } else if (reportType === 'purchase') {
      const totalPurchases = purchaseData.length;
      const totalSpent = purchaseData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const averagePurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
      
      reportContent = `
        <div class="section">
          <h2>סיכום רכישות</h2>
          <div class="summary-cards">
            <div class="summary-card">
              <h3>מספר רכישות</h3>
              <p class="summary-value">${totalPurchases}</p>
            </div>
            <div class="summary-card">
              <h3>סה"כ הוצאות</h3>
              <p class="summary-value">${formatCurrency(totalSpent)}</p>
            </div>
            <div class="summary-card">
              <h3>ממוצע רכישה</h3>
              <p class="summary-value">${formatCurrency(averagePurchase)}</p>
            </div>
          </div>
        </div>
        
        ${purchaseData.length > 0 ? `
        <div class="section">
          <h2>פירוט רכישות</h2>
          <table>
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
              ${purchaseData.map(item => `
                <tr>
                  <td>${formatDate(item.date)}</td>
                  <td>${item.items?.length || 0}</td>
                  <td>${formatCurrency(item.totalAmount || 0)}</td>
                  <td>${formatCurrency(item.budgetBefore || 0)}</td>
                  <td>${formatCurrency(item.budgetAfter || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      `;
    } else if (reportType === 'combined') {
      const totalBudgetUpdates = budgetData.length;
      const totalBudgetAdded = budgetData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const finalBudget = budgetData.length > 0 ? budgetData[budgetData.length - 1].totalBudget : 0;
      
      const totalPurchases = purchaseData.length;
      const totalPurchaseAmount = purchaseData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const averagePurchase = totalPurchases > 0 ? totalPurchaseAmount / totalPurchases : 0;
      
      reportContent = `
        <div class="section">
          <h2>סיכום כללי</h2>
          <div class="summary-cards">
            <div class="summary-card">
              <h3>תקציב נוכחי</h3>
              <p class="summary-value">${formatCurrency(finalBudget)}</p>
            </div>
            <div class="summary-card">
              <h3>סה"כ הוצאות</h3>
              <p class="summary-value">${formatCurrency(totalPurchaseAmount)}</p>
            </div>
            <div class="summary-card">
              <h3>יתרה</h3>
              <p class="summary-value" style="color: ${(finalBudget - totalPurchaseAmount) >= 0 ? '#2e7d32' : '#d32f2f'}">${formatCurrency(finalBudget - totalPurchaseAmount)}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>פירוט תקציב</h2>
          <div class="summary-grid">
            <div>עדכוני תקציב: ${totalBudgetUpdates}</div>
            <div>הפקדות תקציב: ${formatCurrency(totalBudgetAdded)}</div>
          </div>
        </div>
        
        <div class="section">
          <h2>פירוט רכישות</h2>
          <div class="summary-grid">
            <div>מספר רכישות: ${totalPurchases}</div>
            <div>ממוצע רכישה: ${formatCurrency(averagePurchase)}</div>
          </div>
        </div>
        
        ${budgetData.length > 0 ? `
        <div class="section">
          <h2>פירוט עדכוני תקציב</h2>
          <table>
            <thead>
              <tr>
                <th>תאריך</th>
                <th>הפקדה נוכחית</th>
                <th>תקציב אחרי עדכון</th>
              </tr>
            </thead>
            <tbody>
              ${budgetData.map(item => `
                <tr>
                  <td>${formatDate(item.date)}</td>
                  <td>${formatCurrency(item.amount || 0)}</td>
                  <td>${formatCurrency(item.totalBudget || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${purchaseData.length > 0 ? `
        <div class="section">
          <h2>פירוט רכישות</h2>
          <table>
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
              ${purchaseData.map(item => `
                <tr>
                  <td>${formatDate(item.date)}</td>
                  <td>${item.items?.length || 0}</td>
                  <td>${formatCurrency(item.totalAmount || 0)}</td>
                  <td>${formatCurrency(item.budgetBefore || 0)}</td>
                  <td>${formatCurrency(item.budgetAfter || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      `;
    }

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>דו״ח - עמותת ותיקי מטה יהודה</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: white;
            color: black;
            direction: rtl;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            color: #2e7d32;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .report-title {
            font-size: 24px;
            color: #2e7d32;
            margin: 20px 0;
            text-align: center;
          }
          .report-period {
            text-align: center;
            color: #666;
            margin-bottom: 10px;
          }
          .report-generated {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-bottom: 30px;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section h2 {
            background-color: #f5f5f5;
            padding: 10px;
            margin: 20px 0 10px 0;
            border-right: 4px solid #2e7d32;
            font-size: 18px;
          }
          .summary-cards {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          .summary-card {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin: 10px;
            text-align: center;
            min-width: 150px;
            flex: 1;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            color: #2e7d32;
            font-size: 14px;
          }
          .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin: 0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
          }
          .summary-grid div {
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #ddd;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f9f9f9;
            font-weight: bold;
            color: #2e7d32;
          }
          tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tbody tr:hover {
            background-color: #e8f5e9;
          }
          .print-date {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 15px;
              font-size: 11px;
            }
            .header {
              margin-bottom: 20px;
              padding-bottom: 15px;
            }
            .header h1 {
              font-size: 22px;
            }
            .report-title {
              font-size: 18px;
            }
            .section h2 {
              font-size: 14px;
              padding: 8px;
              margin: 15px 0 8px 0;
            }
            .summary-cards {
              flex-direction: row;
              justify-content: space-between;
            }
            .summary-card {
              margin: 5px;
              padding: 10px;
              min-width: 120px;
            }
            .summary-card h3 {
              font-size: 12px;
            }
            .summary-value {
              font-size: 16px;
            }
            table {
              font-size: 10px;
            }
            th, td {
              padding: 6px 4px;
            }
            .section {
              margin-bottom: 20px;
            }
            .summary-grid {
              gap: 10px;
            }
            .summary-grid div {
              padding: 8px;
              font-size: 11px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>מערכת ניהול מלאי</h1>
          <p>עמותת ותיקי מטה יהודה</p>
        </div>

        <div class="report-title">
          ${reportType === 'budget' && 'דו״ח תקציב'}
          ${reportType === 'purchase' && 'דו״ח רכישות'}
          ${reportType === 'combined' && 'דו״ח משולב - תקציב ורכישות'}
        </div>
        
        <div class="report-period">
          תקופה: ${formatDate(new Date(dateRange.startDate))} - ${formatDate(new Date(dateRange.endDate))}
        </div>
        
        <div class="report-generated">
          נוצר בתאריך: ${formatDate(new Date())}
        </div>

        ${reportContent}

        <div class="print-date">
          הודפס ב: ${new Date().toLocaleString('he-IL')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait a bit for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="inventory-container">
      <div className="page-header">
        <h1>
          <FontAwesomeIcon icon={faFileLines} className="page-header-icon" />
          דו״חות
        </h1>
      </div>

      {/* Report Configuration */}
      <div className="report-config">
        <div className="config-section">
          <h3>הגדרות דו״ח</h3>
          <div className="config-form">
            <div className="form-group">
              <label>סוג דו״ח:</label>              
              <select 
                value={selectedReportType} 
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="form-control"
              >
                <option value="budget">דו״ח תקציב</option>
                <option value="purchase">דו״ח רכישות</option>
                <option value="combined">דו״ח משולב</option>
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
              {loading ? 'מייצר דו״ח...' : 'צור דו״ח'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {loading && <Spinner text="מייצר דו״ח..." />}
      
      {reportGenerated && !loading && (
        <div className="report-content" id="report-content">
          {/* Report Header */}
          <div className="report-header no-print">
            <div className="report-actions">
              <button onClick={printReport} className="btn" title="הדפס דו״ח">
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
                {reportType === 'budget' && 'דו״ח תקציב'}
                {reportType === 'purchase' && 'דו״ח רכישות'}
                {reportType === 'combined' && 'דו״ח משולב - תקציב ורכישות'}
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