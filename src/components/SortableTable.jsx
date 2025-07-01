import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import './SortableTable.css';

const SortableTable = ({ 
  columns, 
  data, 
  onEdit, 
  onDelete, 
  className = '',
  emptyMessage = 'אין נתונים להצגה',
  rtl = true 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle different data types
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Handle column sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon for column
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return faSort;
    }
    return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
  };

  // Render cell content
  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }
    
    const value = item[column.key];
    
    // Handle different data types for display
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number' && column.type === 'currency') {
      return `₪ ${value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('he-IL');
    }
    
    return String(value);
  };

  if (!data || data.length === 0) {
    return (
      <div className="sortable-table-container">
        <div className="empty-table">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`sortable-table-container ${className}`}>
      <div className="table-wrapper">
        <table className={`sortable-table ${rtl ? 'rtl' : 'ltr'}`}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`
                    ${column.sortable !== false ? 'sortable' : ''}
                    ${sortConfig.key === column.key ? 'sorted' : ''}
                    ${column.align || 'center'}
                  `}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="header-content">
                    <span className="header-text">{column.title}</span>
                    {column.sortable !== false && (
                      <FontAwesomeIcon 
                        icon={getSortIcon(column.key)} 
                        className={`sort-icon ${sortConfig.key === column.key ? 'active' : ''}`}
                      />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="actions-header">
                  פעולות
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={item.id || index} className="table-row">
                {columns.map((column) => (
                  <td 
                    key={`${item.id || index}-${column.key}`}
                    className={`table-cell ${column.align || 'center'}`}
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="table-cell actions-cell">
                    <div className="table-actions">
                      {onEdit && (
                        <button
                          className="action-btn edit-btn"
                          onClick={() => onEdit(item)}
                          title="עריכה"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="action-btn delete-btn"
                          onClick={() => onDelete(item)}
                          title="מחיקה"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SortableTable;
