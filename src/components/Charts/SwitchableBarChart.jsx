import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// Hebrew month names
const hebrewMonths = [
  'בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני',
  'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'
];

// Format date in Hebrew format: "day בmonth year" (if not current year)
const formatHebrewDate = (date) => {
  if (!date) return '';
  const currentYear = new Date().getFullYear();
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Include year only if it's not the current year
  const yearDisplay = year !== currentYear ? ` ${year}` : '';
  
  return `${day} ${hebrewMonths[month]}${yearDisplay}`;
};

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
        name: formatHebrewDate(itemDate),
        amount: activeChart === 'budget' ? item.amount : (item.totalAmount || 0),
        date: itemDate,
        rawDate: itemDate // Keep the original date for tooltip
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
  
  // Custom tooltip to display the date in full Hebrew format
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const amount = payload[0].value;
      const item = filteredData.find(item => item.name === label);
      const dateStr = item ? formatHebrewDate(item.rawDate) : label;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{dateStr}</p>
          <p className="tooltip-amount">
            {activeChart === 'budget' ? 'תקציב: ' : 'סכום רכישה: '}
            <span className="amount-value">{`₪ ${amount.toFixed(2)}`}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="switchable-bar-chart">
      <div className="chart-controls">
        <div className="chart-tabs">
          <button 
            className={`chart-tab ${activeChart === 'budget' ? 'active' : ''}`} 
            onClick={() => handleChartChange('budget')}
          >
            הכנסות אחרונות
          </button>
          <button 
            className={`chart-tab ${activeChart === 'purchases' ? 'active' : ''}`} 
            onClick={() => handleChartChange('purchases')}
          >
            הוצאות אחרונות
          </button>
        </div>
        <div className="filter-type-toggle">
          <button
            className={`filter-type-btn ${filterType === 'count' ? 'active' : ''}`}
            onClick={() => handleFilterTypeChange('count')}
          >
           סנן לפי כמות
          </button>
          <button
            className={`filter-type-btn ${filterType === 'date' ? 'active' : ''}`}
            onClick={() => handleFilterTypeChange('date')}
          >
            סנן לפי תאריכים
          </button>
        </div>
      </div>
      
      <div className="filter-controls" style={{ display: 'flex', flexDirection: 'row-reverse' }}>
        {filterType === 'count' ? (
          <div className="chart-filter">
            <label>
              <FontAwesomeIcon icon={faFilter} />
              {' '}הצג 
              <select value={dataCount} onChange={handleCountChange}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              {activeChart === 'budget' ? ' ההכנסות אחרונות' : ' הוצאות אחרונות'}
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
                  value={startDate}
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
                  value={endDate}
                  onChange={(e) => handleDateChange('end', e)}
                />
              </label>
            </div>
          </div>
        )}
      </div>
      
      <div className="chart-title">
        {activeChart === 'budget' 
          ? 'הכנסות אחרונות שהוגדרו ע״י המנכ״ל' 
          : 'סכומי הוצאה אחרונים'}
      </div>
      
      <ResponsiveContainer width={'100%'} height={300}> 
        <BarChart
          data={filteredData}
          // margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={0} 
            textAnchor="middle" 
            height={40}
            interval={0}
            fontSize={12}
            tick={{fill: '#333', fontWeight: 500}}
          />
          <YAxis 
            tickFormatter={(value) => {
              
              return `₪ ${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="amount" 
            name={activeChart === 'budget' ? ' תקציב' : ' סכום רכישה'} 
            fill={activeChart === 'budget' ? '#5C8D70' : '#8884d8'} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SwitchableBarChart;