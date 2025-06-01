import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/ForAdmin/customBar.css';

const CustomLine = ({ data = [] }) => {
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

  const formatTooltip = (value, name) => {
    return [`${value} ₪`, name];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ left: 25, right: 20, top: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="5 5" stroke={getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}/>
        <XAxis axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}} dataKey="date" />
        <YAxis
          axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}}
          tickFormatter={(value) => `${value} ₪`}
          dx={-20}
          width={60}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={formatTooltip}
        />
        <Legend />
        {/* <Line type="monotone" dataKey="תקציב" stroke="#8884d8" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} /> */}
        <Line type="monotone" dataKey="תקציב" stroke="#518664" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CustomLine;
