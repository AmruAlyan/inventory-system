import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

const SwitchableBarChart = ({ budgetData, purchaseData }) => {
  const [activeChart, setActiveChart] = useState('budget'); // 'budget' or 'purchases'
  const [dataCount, setDataCount] = useState(5); // Default to 5 items
  
  // Format data to only show the last {dataCount} items
  const filteredBudgetData = budgetData
    ?.slice(0, dataCount)
    ?.map(item => ({
      name: item.formatted || new Date(item.date).toLocaleDateString('he-IL'),
      amount: item.amount,
    }))
    .reverse(); // To display oldest to newest
  
  const filteredPurchaseData = purchaseData
    ?.slice(0, dataCount)
    ?.map(item => ({
      name: item.date ? new Date(item.date).toLocaleDateString('he-IL') : '---',
      amount: item.totalAmount || 0,
    }))
    .reverse(); // To display oldest to newest
  
  const handleChartChange = (chartType) => {
    setActiveChart(chartType);
  };
  
  const handleCountChange = (e) => {
    setDataCount(Number(e.target.value));
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
        <div className="chart-filter">
          <label>
            <FontAwesomeIcon icon={faFilter} />
            הצג 
            <select value={dataCount} onChange={handleCountChange}>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
            {activeChart === 'budget' ? ' תקציבים אחרונים' : ' רכישות אחרונות'}
          </label>
        </div>
      </div>
      
      <div className="chart-title">
        {activeChart === 'budget' 
          ? 'תקציבים אחרונים שהוגדרו על ידי המנהל' 
          : 'סכומי רכישה אחרונים'}
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={activeChart === 'budget' ? filteredBudgetData : filteredPurchaseData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
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