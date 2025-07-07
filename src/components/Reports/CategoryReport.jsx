import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faShekelSign, 
    faChartLine, 
    faSort, 
    faSortUp, 
    faSortDown,
    faBoxes,
    faLayerGroup,
    faBarcode,
    faWarning,
    faCheckCircle,
    faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import ReportBarChart from "../Charts/ReportBarChart";
import "./CategoryReport.css";

const CategoryReport = ({ categoryData, formatCurrency, formatDate }) => {
    const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });

    if (!categoryData || categoryData.length === 0) {
        return (
            <div className="category-report">
                <div className="no-data">
                    <FontAwesomeIcon icon={faLayerGroup} size="3x" color="#ccc" />
                    <p>לא נמצאו נתוני קטגוריות לתקופה הנבחרת</p>
                </div>
            </div>
        );
    }

    // Calculate summary statistics
    const summary = useMemo(() => {
        const totalCategories = categoryData.length;
        const totalProducts = categoryData.reduce((sum, cat) => sum + (cat.products?.length || 0), 0);
        const totalValue = categoryData.reduce((sum, cat) => 
            sum + (cat.products?.reduce((productSum, product) => 
                productSum + (product.quantity * product.price || 0), 0) || 0), 0);
        const averageProductsPerCategory = totalProducts / totalCategories || 0;
        
        // Find categories with most/least products
        const categoriesByProductCount = [...categoryData].sort((a, b) => 
            (b.products?.length || 0) - (a.products?.length || 0));
        
        const mostProductsCategory = categoriesByProductCount[0];
        const leastProductsCategory = categoriesByProductCount[categoriesByProductCount.length - 1];

        // Categories with low stock warnings
        const lowStockCategories = categoryData.filter(cat =>
            cat.products?.some(product => product.quantity < (product.minStock || 10))
        );

        // Find category with highest value
        const categoriesByValue = [...categoryData].sort((a, b) => {
            const aValue = a.products?.reduce((sum, product) => 
                sum + (product.quantity * product.price || 0), 0) || 0;
            const bValue = b.products?.reduce((sum, product) => 
                sum + (product.quantity * product.price || 0), 0) || 0;
            return bValue - aValue;
        });
        
        const highestValueCategory = categoriesByValue[0];
        const highestCategoryValue = highestValueCategory?.products?.reduce((sum, product) => 
            sum + (product.quantity * product.price || 0), 0) || 0;

        return {
            totalCategories,
            totalProducts,
            totalValue,
            averageProductsPerCategory,
            mostProductsCategory,
            leastProductsCategory,
            lowStockCategories: lowStockCategories.length,
            highestValueCategory,
            highestCategoryValue
        };
    }, [categoryData]);

    // Table sorting logic
    const handleSort = (field) => {
        const direction = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ field, direction });
    };

    const getSortIcon = (field) => {
        if (sortConfig.field !== field) return faSort;
        return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
    };

    const sortProducts = (products, sortConfig) => {
        if (!sortConfig.field || !products) return products;
        
        return [...products].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortConfig.field) {
                case 'name':
                    aValue = a.name || '';
                    bValue = b.name || '';
                    break;
                case 'quantity':
                    aValue = a.quantity || 0;
                    bValue = b.quantity || 0;
                    break;
                case 'price':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                case 'totalValue':
                    aValue = (a.quantity || 0) * (a.price || 0);
                    bValue = (b.quantity || 0) * (b.price || 0);
                    break;
                default:
                    return 0;
            }

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const getStockStatus = (product) => {
        const quantity = product.quantity || 0;
        const minStock = product.minStock || 10;
        
        if (quantity === 0) return { status: 'out', icon: faWarning, color: '#dc3545' };
        if (quantity < minStock) return { status: 'low', icon: faExclamationTriangle, color: '#fd7e14' };
        return { status: 'good', icon: faCheckCircle, color: '#28a745' };
    };

    return (
        <div className="category-report">
            {/* Summary Statistics */}
            <div className="summary-section">
                <h3>
                    <FontAwesomeIcon icon={faChartLine} />
                    סיכום כללי
                </h3>
                
                <div className="summary-container">
                    {/* Main Stats Row */}
                    <div className="main-stats">
                        <div className="stat-card primary">
                            <div className="stat-icon">
                                <FontAwesomeIcon icon={faLayerGroup} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">{summary.totalCategories}</div>
                                <div className="stat-label">קטגוריות</div>
                            </div>
                        </div>

                        <div className="stat-card secondary">
                            <div className="stat-icon">
                                <FontAwesomeIcon icon={faBoxes} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">{summary.totalProducts}</div>
                                <div className="stat-label">מוצרים</div>
                            </div>
                        </div>

                        <div className="stat-card accent">
                            <div className="stat-icon">
                                <FontAwesomeIcon icon={faShekelSign} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">{formatCurrency(summary.totalValue)}</div>
                                <div className="stat-label">ערך כולל</div>
                            </div>
                        </div>
                    </div>

                    {/* Insight Cards */}
                    <div className="insight-cards">
                        <div className="insight-card">
                            <div className="insight-header">
                                <FontAwesomeIcon icon={faShekelSign} className="insight-icon" />
                                <span>קטגוריה בעלת הערך הגבוה ביותר</span>
                            </div>
                            <div className="insight-content">
                                <div className="insight-main">{summary.highestValueCategory?.name || 'לא זמין'}</div>
                                <div className="insight-sub">{formatCurrency(summary.highestCategoryValue)}</div>
                            </div>
                        </div>

                        <div className="insight-card">
                            <div className="insight-header">
                                <FontAwesomeIcon icon={faBoxes} className="insight-icon" />
                                <span>קטגוריה עם הכי הרבה מוצרים</span>
                            </div>
                            <div className="insight-content">
                                <div className="insight-main">{summary.mostProductsCategory?.name || 'לא זמין'}</div>
                                <div className="insight-sub">{summary.mostProductsCategory?.products?.length || 0} מוצרים</div>
                            </div>
                        </div>

                        <div className={`insight-card ${summary.lowStockCategories > 0 ? 'warning' : 'success'}`}>
                            <div className="insight-header">
                                <FontAwesomeIcon 
                                    icon={summary.lowStockCategories > 0 ? faExclamationTriangle : faCheckCircle} 
                                    className="insight-icon" 
                                />
                                <span>מצב מלאי</span>
                            </div>
                            <div className="insight-content">
                                <div className="insight-main">
                                    {summary.lowStockCategories > 0 
                                        ? `${summary.lowStockCategories} אזהרות` 
                                        : 'מלאי תקין'
                                    }
                                </div>
                                <div className="insight-sub">
                                    {summary.lowStockCategories > 0 
                                        ? 'קטגוריות עם מלאי נמוך'
                                        : 'כל הקטגוריות במלאי טוב'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Detail Section */}
            <div className="categories-section">
                <h3>
                    <FontAwesomeIcon icon={faBarcode} />
                    פירוט קטגוריות ומוצרים
                </h3>

                {categoryData.map((category, index) => {
                    const categoryValue = category.products?.reduce((sum, product) => 
                        sum + (product.quantity * product.price || 0), 0) || 0;
                    const sortedProducts = sortProducts(category.products, sortConfig);
                    const lowStockProducts = category.products?.filter(product => {
                        const status = getStockStatus(product);
                        return status.status !== 'good';
                    }) || [];

                    return (
                        <div key={category.id} className="category-section">
                            {/* Category Header */}
                            <div className="category-header">
                                <div>
                                    <h4>
                                        <FontAwesomeIcon icon={faLayerGroup} />
                                        {category.name}
                                    </h4>
                                </div>
                                
                                <div className="category-stats">
                                    <div className="category-stat">
                                        <div className="category-stat-value">
                                            {category.products?.length || 0}
                                        </div>
                                        <div className="category-stat-label">מוצרים</div>
                                    </div>
                                    <div className="category-stat">
                                        <div className="category-stat-value">
                                            {formatCurrency(categoryValue)}
                                        </div>
                                        <div className="category-stat-label">ערך כולל</div>
                                    </div>
                                    {lowStockProducts.length > 0 && (
                                        <div className="category-stat">
                                            <div className="category-stat-value category-stat-warning">
                                                {lowStockProducts.length}
                                            </div>
                                            <div className="category-stat-label">אזהרות</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Products Table */}
                            {category.products && category.products.length > 0 ? (
                                <div className="products-table">
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th 
                                                        className="text-right"
                                                        onClick={() => handleSort('name')}
                                                    >
                                                        שם המוצר
                                                        <FontAwesomeIcon 
                                                            icon={getSortIcon('name')} 
                                                            className="sort-icon"
                                                        />
                                                    </th>
                                                    <th 
                                                        className="text-center"
                                                        onClick={() => handleSort('quantity')}
                                                    >
                                                        כמות
                                                        <FontAwesomeIcon 
                                                            icon={getSortIcon('quantity')} 
                                                            className="sort-icon"
                                                        />
                                                    </th>
                                                    <th 
                                                        className="text-center"
                                                        onClick={() => handleSort('price')}
                                                    >
                                                        מחיר יחידה
                                                        <FontAwesomeIcon 
                                                            icon={getSortIcon('price')} 
                                                            className="sort-icon"
                                                        />
                                                    </th>
                                                    <th 
                                                        className="text-center"
                                                        onClick={() => handleSort('totalValue')}
                                                    >
                                                        ערך כולל
                                                        <FontAwesomeIcon 
                                                            icon={getSortIcon('totalValue')} 
                                                            className="sort-icon"
                                                        />
                                                    </th>
                                                    <th className="text-center">
                                                        מצב מלאי
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedProducts.map((product, productIndex) => {
                                                    const stockStatus = getStockStatus(product);
                                                    const totalValue = (product.quantity || 0) * (product.price || 0);
                                                    
                                                    return (
                                                        <tr key={product.id || productIndex}>
                                                            <td className="text-right">
                                                                {product.name || 'ללא שם'}
                                                            </td>
                                                            <td className="text-center">
                                                                {product.quantity || 0}
                                                            </td>
                                                            <td className="text-center">
                                                                {formatCurrency(product.price || 0)}
                                                            </td>
                                                            <td className="text-center primary-color">
                                                                {formatCurrency(totalValue)}
                                                            </td>
                                                            <td className="text-center">
                                                                <span className={`stock-status ${stockStatus.status}`}>
                                                                    <FontAwesomeIcon icon={stockStatus.icon} />
                                                                    {stockStatus.status === 'out' ? 'אזל' : 
                                                                     stockStatus.status === 'low' ? 'נמוך' : 'תקין'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-products">
                                    <FontAwesomeIcon icon={faBoxes} size="2x" className="icon" />
                                    <p>אין מוצרים בקטגוריה זו</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryReport;
