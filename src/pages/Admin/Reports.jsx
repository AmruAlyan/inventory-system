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
import { BudgetReport, PurchaseReport, CombinedReport, CategoryReport } from "../../components/Reports";
import { exportToPDF, printReport } from "../../utils/reportExport";
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
  const [categoryData, setCategoryData] = useState([]);
  
  // Category report specific states
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySortBy, setCategorySortBy] = useState('name-asc');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Load available categories when component mounts or when report type changes to category
  useEffect(() => {
    if (selectedReportType === 'category') {
      loadAvailableCategories();
    }
  }, [selectedReportType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownOpen && !event.target.closest('.category-dropdown-container')) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  const loadAvailableCategories = async () => {
    try {
      // Fetch all categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));

      // Add "ללא קטגוריה" option
      categories.push({
        id: 'no-category',
        name: 'ללא קטגוריה'
      });

      setAvailableCategories(categories);
      // By default, select all categories
      setSelectedCategories(categories.map(cat => cat.id));
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('שגיאה בטעינת קטגוריות');
    }
  };

  const handleCategorySelection = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const toggleCategoryDropdown = () => {
    setCategoryDropdownOpen(!categoryDropdownOpen);
  };

  const getCategorySelectionText = () => {
    if (selectedCategories.length === 0) {
      return 'לא נבחרו קטגוריות';
    } else if (selectedCategories.length === availableCategories.length) {
      return 'כל הקטגוריות';
    } else {
      return `${selectedCategories.length} קטגוריות נבחרו`;
    }
  };
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
      }

      // Fetch category data if needed
      if (selectedReportType === 'category') {
        try {
          // Fetch all categories
          const categoriesSnapshot = await getDocs(collection(db, 'categories'));
          const categoriesMap = {};
          categoriesSnapshot.docs.forEach(doc => {
            categoriesMap[doc.id] = { id: doc.id, name: doc.data().name };
          });

          // Fetch all products
          const productsSnapshot = await getDocs(collection(db, 'products'));
          const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Group products by category
          const categoryDataWithProducts = Object.values(categoriesMap).map(category => ({
            ...category,
            products: products.filter(product => product.category === category.id)
          }));

          // Add products without category to "ללא קטגוריה"
          const productsWithoutCategory = products.filter(product => 
            !product.category || !categoriesMap[product.category]
          );
          
          if (productsWithoutCategory.length > 0) {
            categoryDataWithProducts.push({
              id: 'no-category',
              name: 'ללא קטגוריה',
              products: productsWithoutCategory
            });
          }

          // Filter categories based on user selection
          const filteredCategories = categoryDataWithProducts.filter(category => 
            selectedCategories.includes(category.id)
          );

          // Sort categories based on user selection
          const sortedCategories = [...filteredCategories].sort((a, b) => {
            const [sortField, sortDirection] = categorySortBy.split('-');
            let result = 0;
            
            switch (sortField) {
              case 'name':
                result = a.name.localeCompare(b.name, 'he');
                break;
              case 'value':
                const aValue = a.products?.reduce((sum, product) => 
                  sum + (product.quantity * product.price || 0), 0) || 0;
                const bValue = b.products?.reduce((sum, product) => 
                  sum + (product.quantity * product.price || 0), 0) || 0;
                result = aValue - bValue;
                break;
              case 'products':
                result = (a.products?.length || 0) - (b.products?.length || 0);
                break;
              case 'alerts':
                const aAlerts = a.products?.filter(product => 
                  product.quantity < (product.minStock || 10)).length || 0;
                const bAlerts = b.products?.filter(product => 
                  product.quantity < (product.minStock || 10)).length || 0;
                result = aAlerts - bAlerts;
                break;
              default:
                return 0;
            }
            
            // Apply direction (desc = descending, asc = ascending)
            return sortDirection === 'desc' ? -result : result;
          });

          setCategoryData(sortedCategories);
        } catch (error) {
          console.error('Error fetching category data:', error);
          toast.error('שגיאה בטעינת נתוני קטגוריות');
        }
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
                <option value="category">דו״ח קטגוריה</option>
              </select>
            </div>
            {selectedReportType === 'category' ? (
              <>
                <div className="form-group">
                  <label>קטגוריות לכלול בדו״ח:</label>
                  <div className="category-dropdown-container">
                    <div 
                      className="category-dropdown-toggle"
                      onClick={toggleCategoryDropdown}
                    >
                      <span className="dropdown-text">{getCategorySelectionText()}</span>
                      <span className={`dropdown-arrow ${categoryDropdownOpen ? 'open' : ''}`}>▼</span>
                    </div>
                    {categoryDropdownOpen && (
                      <div className="category-dropdown-menu">
                        {availableCategories.map(category => (
                          <label key={category.id} className="category-checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleCategorySelection(category.id)}
                            />
                            <span className="checkbox-text">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>מיון קטגוריות לפי:</label>
                  <select 
                    value={categorySortBy} 
                    onChange={(e) => setCategorySortBy(e.target.value)}
                    className="form-control"
                  >
                    <option value="name-asc">שם קטגוריה (א-ב)</option>
                    <option value="name-desc">שם קטגוריה (ב-א)</option>
                    <option value="value-desc">ערך כולל (גבוה לנמוך)</option>
                    <option value="value-asc">ערך כולל (נמוך לגבוה)</option>
                    <option value="products-desc">מספר מוצרים (רב למעט)</option>
                    <option value="products-asc">מספר מוצרים (מעט לרב)</option>
                    <option value="alerts-desc">אזהרות מלאי (רב למעט)</option>
                    <option value="alerts-asc">אזהרות מלאי (מעט לרב)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
              <div className="association-logo">
                <img src={logo} alt="לוגו הארגון" className="report-logo" />
              </div>
              <div className="association-info">
                <h1 className="association-title">מערכת ניהול מלאי</h1>
                <p className="association-subtitle">עמותת ותיקי מטה יהודה</p>
              </div>
            </div>

            <div className="report-title">
              <h2>
                {reportType === 'budget' && 'דו״ח תקציב'}
                {reportType === 'purchase' && 'דו״ח רכישות'}
                {reportType === 'combined' && 'דו״ח משולב - תקציב ורכישות'}
                {reportType === 'category' && 'דו״ח קטגוריה'}
              </h2>
              <p className="report-period">
                תקופה: {formatDate(new Date(dateRange.startDate))} - {formatDate(new Date(dateRange.endDate))}
              </p>              
              <p className="report-generated">
                נוצר בתאריך: {formatDate(new Date())} בשעה {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
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

            {reportType === 'category' && (
              <CategoryReport
                categoryData={categoryData}
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