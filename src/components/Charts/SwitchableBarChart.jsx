import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SwitchableBarChart = ({ purchaseData, budgetData }) => {
  const [activeChart, setActiveChart] = useState('purchases');
  const [purchaseFilter, setPurchaseFilter] = useState(5);
  const [budgetFilter, setBudgetFilter] = useState(5);

  const filteredPurchaseData = useMemo(() => {
    if (!purchaseData || purchaseData.length === 0) return [];
    return purchaseData.slice(0, purchaseFilter).reverse(); // Reverse to show oldest to newest
  }, [purchaseData, purchaseFilter]);

  const filteredBudgetData = useMemo(() => {
    if (!budgetData || budgetData.length === 0) return [];
    return budgetData.slice(0, budgetFilter).reverse(); // Reverse to show oldest to newest
  }, [budgetData, budgetFilter]);

  const formatPurchaseData = (data) => {
    return data.map((item, index) => ({
      name: item.date ? item.date.toLocaleDateString('he-IL', { 
        month: 'short', 
        day: 'numeric' 
      }) : `רכישה ${index + 1}`,
      value: item.totalAmount || 0,
      fullDate: item.date ? item.date.toLocaleDateString('he-IL') : 'תאריך לא זמין'
    }));
  };

  const formatBudgetData = (data) => {
    return data.map((item, index) => ({
      name: item.date ? item.date.toLocaleDateString('he-IL', { 
        month: 'short', 
        day: 'numeric' 
      }) : `תקציב ${index + 1}`,
      value: item.amount || item.totalBudget || 0,
      fullDate: item.formatted || (item.date ? item.date.toLocaleDateString('he-IL') : 'תאריך לא זמין')
    }));
  };

  const currentData = activeChart === 'purchases' 
    ? formatPurchaseData(filteredPurchaseData)
    : formatBudgetData(filteredBudgetData);

  const currentColor = activeChart === 'purchases' ? '#22c55e' : '#a855f7';
  const currentTitle = activeChart === 'purchases' ? 'סכומי רכישות אחרונות' : 'היסטוריית תקציב';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'var(--panel-bg)',
          padding: '12px',
          border: '2px solid var(--primary)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          direction: 'rtl'
        }}>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontWeight: 'bold',
            color: 'var(--primary-text)',
            fontSize: '14px'
          }}>
            {data.fullDate}
          </p>
          <p style={{ 
            margin: 0, 
            color: currentColor,
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {activeChart === 'purchases' ? 'סכום רכישה' : 'תקציב'}: ₪{payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="switchable-chart-container" style={{ width: '100%', padding: '0' }}>
      {/* Chart Controls */}
      <div className="chart-controls" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '15px 20px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--secondary-bg)',
        borderRadius: '12px 12px 0 0'
      }}>
        <div className="chart-tabs" style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveChart('purchases')}
            style={{
              padding: '8px 16px',
              border: activeChart === 'purchases' ? '2px solid #22c55e' : '1px solid var(--border-color)',
              backgroundColor: activeChart === 'purchases' ? '#22c55e' : 'var(--panel-bg)',
              color: activeChart === 'purchases' ? 'white' : 'var(--primary-text)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: activeChart === 'purchases' ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            רכישות
          </button>
          <button
            onClick={() => setActiveChart('budget')}
            style={{
              padding: '8px 16px',
              border: activeChart === 'budget' ? '2px solid #a855f7' : '1px solid var(--border-color)',
              backgroundColor: activeChart === 'budget' ? '#a855f7' : 'var(--panel-bg)',
              color: activeChart === 'budget' ? 'white' : 'var(--primary-text)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: activeChart === 'budget' ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            תקציב
          </button>
        </div>

        <div className="filter-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', color: 'var(--secondary-text)' }}>
            הצג:
          </label>
          <select
            value={activeChart === 'purchases' ? purchaseFilter : budgetFilter}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (activeChart === 'purchases') {
                setPurchaseFilter(value);
              } else {
                setBudgetFilter(value);
              }
            }}
            style={{
              padding: '5px 10px',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              fontSize: '14px',
              backgroundColor: 'var(--panel-bg)',
              color: 'var(--primary-text)'
            }}
          >
            <option value={3}>3 אחרונים</option>
            <option value={5}>5 אחרונים</option>
            <option value={10}>10 אחרונים</option>
            <option value={15}>15 אחרונים</option>
            <option value={20}>20 אחרונים</option>
          </select>
        </div>
      </div>

      {/* Chart Content */}
      <div style={{ padding: '20px' }}>
        {/* Chart Title */}
        <h3 style={{ 
          textAlign: 'center', 
          color: currentColor, 
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {currentTitle}
        </h3>

        {/* Chart */}
        {currentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={currentData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'var(--primary-text)' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="var(--primary-text)"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'var(--primary-text)' }}
                tickFormatter={(value) => `₪${value}`}
                stroke="var(--primary-text)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={currentColor}
                name={activeChart === 'purchases' ? 'סכום רכישה (₪)' : 'תקציב (₪)'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px', 
            color: 'var(--secondary-text)',
            fontSize: '16px'
          }}>
            {activeChart === 'purchases' ? 'אין נתוני רכישות להצגה' : 'אין נתוני תקציב להצגה'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitchableBarChart;
