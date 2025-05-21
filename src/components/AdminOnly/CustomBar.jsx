'use client'

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/ForAdmin/customBar.css';

// Sample data as fallback if no props data is provided
const sampleData = [
  { date: 'Apr-1', תקציב: 500 },
  { date: 'Apr-2', תקציב: 380 },
  { date: 'Apr-3', תקציב: 300 },
  { date: 'Apr-4', תקציב: 150 },
  { date: 'Apr-5', תקציב: 80 },
  { date: 'Apr-6', תקציב: 50 },
  { date: 'Apr-7', תקציב: 0 }
];

const CustomBar = ({ data = [] }) => {
  const [theme, setTheme] = useState('light');
  const [chartData, setChartData] = useState([]);

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

  // Process data for chart display when it changes
  useEffect(() => {
    if (data && data.length > 0) {
      // Format the data for the chart - take the most recent entries (up to 10)
      // Make a copy of the data and sort it by date (oldest to newest) for the chart
      const sortedData = [...data]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 10)
        .map(item => ({
          date: item.formatted || new Intl.DateTimeFormat('he-IL', { 
            month: 'long', 
            day: 'numeric' 
          }).format(item.date),
          תקציב: item.amount,
          rawDate: item.date // Store raw date for sorting
        }));
      
      // We've removed the empty data point as per requirement
        
      setChartData(sortedData);
    } else {
      // When there's no data, show empty chart without placeholder data points
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
        <Bar dataKey="תקציב" fill="#8884d8" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CustomBar;
