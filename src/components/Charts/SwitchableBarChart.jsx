import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const SwitchableBarChart = ({ budgetData, purchaseData }) => {
  const [activeChart, setActiveChart] = useState('budget'); // 'budget' or 'purchases'
  const [dataCount, setDataCount] = useState(5); // Default to 5 items
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [filterType, setFilterType] = useState('count'); // 'count' or 'date'
  
  // Process and filter the data whenever dependencies change
  useEffect(() => {
    const currentData = activeChart === 'budget' ? budgetData : purchaseData;
    
    if (!currentData || currentData.length === 0) {
      setFilteredData([]);
      return;
    }
    
    let result = [...currentData];
    
    // Apply date filtering if selected
    if (filterType === 'date' && (startDate || endDate)) {
      const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
      const endTimestamp = endDate ? new Date(endDate).getTime() : Infinity;
      
      result = result.filter(item => {
        const itemDate = item.date instanceof Date 
          ? item.date 
          : (item.date && item.date.toDate ? item.date.toDate() : new Date(item.date));
        const itemTimestamp = itemDate.getTime();
        return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
      });
    } 
    // Apply count filtering
    else if (filterType === 'count') {
      result = result.slice(0, dataCount);
    }
    
    // Format the data for the chart
    result = result.map(item => {
      const itemDate = item.date instanceof Date 
        ? item.date 
        : (item.date && item.date.toDate ? item.date.toDate() : new Date(item.date));
      
      return {
        name: item.formatted || itemDate.toLocaleDateString('he-IL'),
        amount: activeChart === 'budget' ? item.amount : (item.totalAmount || 0),
        date: itemDate
      };
    })
    .sort((a, b) => a.date - b.date); // Sort by date ascending
    
    setFilteredData(result);
  }, [activeChart, dataCount, budgetData, purchaseData, filterType, startDate, endDate]);
  
  const handleChartChange = (chartType) => {
    setActiveChart(chartType);
  };
  
  const handleCountChange = (e) => {
    setDataCount(Number(e.target.value));
  };
  
  const handleFilterTypeChange = (type) => {
    setFilterType(type);
  };
  
  const handleDateChange = (type, e) => {
    if (type === 'start') {
      setStartDate(e.target.value);
    } else {
      setEndDate(e.target.value);
    }
  };
  
  // Format date for the input value (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return (
    <div className="switchable-bar-chart">
      <div className="chart-controls">
        <div className="chart-tabs">
          <button 
            className={`chart-tab ${activeChart === 'budget' ? 'active' : ''}`} 
            onClick={() => handleChartChange('budget')}
          >
            תקציבים אחרונים
          </button>
          <button 
            className={`chart-tab ${activeChart === 'purchases' ? 'active' : ''}`} 
            onClick={() => handleChartChange('purchases')}
          >
            רכישות אחרונות
          </button>
        </div>
        <div className="filter-type-toggle">
          <button
            className={`filter-type-btn ${filterType === 'count' ? 'active' : ''}`}
            onClick={() => handleFilterTypeChange('count')}
          >
            פילטר כמות
          </button>
          <button
            className={`filter-type-btn ${filterType === 'date' ? 'active' : ''}`}
            onClick={() => handleFilterTypeChange('date')}
          >
            פילטר תאריכים
          </button>
        </div>
      </div>
      
      <div className="filter-controls">
        {filterType === 'count' ? (
          <div className="chart-filter">
            <label>
              <FontAwesomeIcon icon={faFilter} />
              הצג 
              <select value={dataCount} onChange={handleCountChange}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              {activeChart === 'budget' ? ' תקציבים אחרונים' : ' רכישות אחרונות'}
            </label>
          </div>
        ) : (
          <div className="date-filter">
            <div className="date-input-group">
              <label>
                <FontAwesomeIcon icon={faCalendarAlt} />
                מתאריך:
                <input 
                  type="date" 
                  value={formatDateForInput(startDate)}
                  onChange={(e) => handleDateChange('start', e)}
                />
              </label>
            </div>
            <div className="date-input-group">
              <label>
                <FontAwesomeIcon icon={faCalendarAlt} />
                עד תאריך:
                <input 
                  type="date" 
                  value={formatDateForInput(endDate)}
                  onChange={(e) => handleDateChange('end', e)}
                />
              </label>
            </div>
          </div>
        )}
      </div>
      
      <div className="chart-title">
        {activeChart === 'budget' 
          ? 'תקציבים אחרונים שהוגדרו על ידי המנהל' 
          : 'סכומי רכישה אחרונים'}
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={filteredData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip formatter={(value) => `₪${value}`} />
          <Legend />
          <Bar 
            dataKey="amount" 
            name={activeChart === 'budget' ? 'תקציב' : 'סכום רכישה'} 
            fill={activeChart === 'budget' ? '#5C8D70' : '#8884d8'} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SwitchableBarChart;