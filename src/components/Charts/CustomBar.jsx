import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/ForAdmin/customBar.css';

const CustomBar = ({ data = [] }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const sortedData = [...data]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 10)
        .map(item => ({
          date: item.formatted || new Intl.DateTimeFormat('he-IL', { month: 'long', day: 'numeric' }).format(item.date),
          תקציב: item.amount,
          rawDate: item.date
        }));
      setChartData(sortedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  const tooltipStyle = {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--panel-bg').trim(),
    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(),
    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}`,
    borderRadius: '0.5rem',
    padding: '0.5rem',
  };
  
  // Custom tooltip formatter to add ₪ symbol
  const formatTooltip = (value, name) => {
    return [`${value} ₪`, name];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData}
        margin={{ left: 25, right: 20, top: 10, bottom: 5 }} // Add margin to give space for the labels
      >
        <CartesianGrid strokeDasharray="5 5" stroke={getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}/>
        <XAxis axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}} dataKey="date" />
        <YAxis 
          axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}} 
          tickFormatter={(value) => `${value} ₪`}
          dx={-20} // Move labels further to the left to avoid intersection with the grid line
          width={60} // Increase width of Y-axis area
        />
        <Tooltip 
          contentStyle={tooltipStyle} 
          formatter={formatTooltip}
        />        
        <Legend />
        <Bar dataKey="תקציב" fill="#518664" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CustomBar;
