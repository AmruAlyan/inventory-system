import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import '../../styles/ForAdmin/customBar.css';

const GRADIENT_ID = 'area-gradient';

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

const AreaChartFillByValue = ({ data = [] }) => {
  const [theme, setTheme] = useState('light');
  const [chartData, setChartData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [gradientOffset, setGradientOffset] = useState(1);
  const [dataCount, setDataCount] = useState(5); // Default to 5 items
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('count'); // 'count' or 'date'

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme || 'light';
    setTheme(currentTheme);
    const observer = new MutationObserver(() => {
      const updatedTheme = document.documentElement.dataset.theme || 'light';
      setTheme(updatedTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (data && data.length > 0) {
      const processedData = [...data]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => {
          const itemDate = item.date instanceof Date 
            ? item.date 
            : (item.date && item.date.toDate ? item.date.toDate() : new Date(item.date));
          
          return {
            date: formatHebrewDate(itemDate),
            ערך: item.value,
            rawDate: itemDate,
            originalData: item
          };
        });
      setChartData(processedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  // Process and filter the data whenever dependencies change
  useEffect(() => {
    if (!chartData || chartData.length === 0) {
      setFilteredData([]);
      setGradientOffset(1);
      return;
    }
    
    let result = [...chartData];
    
    // Apply date filtering if selected
    if (filterType === 'date' && (startDate || endDate)) {
      const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
      const endTimestamp = endDate ? new Date(endDate).getTime() : Infinity;
      
      result = result.filter(item => {
        const itemTimestamp = item.rawDate.getTime();
        return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
      });
    } 
    // Apply count filtering
    else if (filterType === 'count') {
      result = result.slice(0, dataCount);
    }
    
    setFilteredData(result);
    
    // Calculate gradient offset for value sign split
    const gradientOffset = () => {
      if (!result.length) return 1;
      const dataMax = Math.max(...result.map((d) => d.ערך));
      const dataMin = Math.min(...result.map((d) => d.ערך));
      if (dataMax <= 0) return 0;
      if (dataMin >= 0) return 1;
      return dataMax / (dataMax - dataMin);
    };
    const off = gradientOffset();
    setGradientOffset(off);
  }, [chartData, dataCount, filterType, startDate, endDate]);

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

  const tooltipStyle = {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--panel-bg').trim(),
    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(),
    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}`,
    borderRadius: '0.5rem',
    padding: '0.5rem',
  };

  // Custom tooltip to display the date in full Hebrew format
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const item = filteredData.find(item => item.date === label);
      const dateStr = item ? formatHebrewDate(item.rawDate) : label;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{dateStr}</p>
          <p className="tooltip-amount">
            תקציב: <span className="amount-value">{`₪${value.toFixed(2)}`}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const formatTooltip = (value, name) => [`${value.toFixed(2)} ₪`, name === 'ערך' ? 'ערך' : name];

  return (
    <div className="switchable-bar-chart" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="chart-controls">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            מגמות תקציב לאורך זמן
          </div>
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
              הצג 
              <select value={dataCount} onChange={handleCountChange}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              נתונים אחרונים
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
      
      <ResponsiveContainer width="100%" height="75%">
        <AreaChart
          data={filteredData}
          margin={{ left: 25, right: 20, top: 10, bottom: 5 }}
        >
          <defs>
          <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset={gradientOffset} stopColor="#518664" stopOpacity={0.8}/>
            <stop offset={gradientOffset} stopColor="#d32f2f" stopOpacity={0.8}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="5 5" stroke={getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}/>
        <XAxis axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}} dataKey="date" />
        <YAxis
          axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}}
          tickFormatter={(value) => `${value} ₪`}
          dx={-20}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {/* Single area, gradient split at zero */}
        {filteredData.length > 0 && (
          <Area
            type="monotone"
            dataKey="ערך"
            stroke="#000"
            fill={`url(#${GRADIENT_ID})`}
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
            isAnimationActive={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
};

export default AreaChartFillByValue;
// Alias for import compatibility
export { AreaChartFillByValue as CustomArea };
