'use client'

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, Brush, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/customBar.css';

// const data = [
//   { date: '1/4/2025', תקציב: 500, הוצא: 0 },
//   { date: '2/4/2025', תקציב: 380, הוצא: 120 },
//   { date: '3/4/2025', תקציב: 300, הוצא: 80 },
//   { date: '4/4/2025', תקציב: 150, הוצא: 150 },
//   { date: '5/4/2025', תקציב: 80, הוצא: 70 },
//   { date: '6/4/2025', תקציב: 50, הוצא: 30 },
//   { date: '7/4/2025', תקציב: 0, הוצא: 50 }
// ];

const data = [
    { date: 'Apr-1', תקציב: 500, הוצא: 0 },
    { date: 'Apr-2', תקציב: 380, הוצא: 120 },
    { date: 'Apr-3', תקציב: 300, הוצא: 80 },
    { date: 'Apr-4', תקציב: 150, הוצא: 150 },
    { date: 'Apr-5', תקציב: 80, הוצא: 70 },
    { date: 'Apr-6', תקציב: 50, הוצא: 30 },
    { date: 'Apr-7', תקציב: 0, הוצא: 50 },
    { date: 'Apr-1', תקציב: 500, הוצא: 0 },
    { date: 'Apr-2', תקציב: 380, הוצא: 120 },
    { date: 'Apr-3', תקציב: 300, הוצא: 80 },
    { date: 'Apr-4', תקציב: 150, הוצא: 150 },
    { date: 'Apr-5', תקציב: 80, הוצא: 70 },
    { date: 'Apr-6', תקציב: 50, הוצא: 30 },
    { date: 'Apr-7', תקציב: 0, הוצא: 50 },
    { date: 'Apr-1', תקציב: 500, הוצא: 0 },
    { date: 'Apr-2', תקציב: 380, הוצא: 120 },
    { date: 'Apr-3', תקציב: 300, הוצא: 80 },
    { date: 'Apr-4', תקציב: 150, הוצא: 150 },
    { date: 'Apr-5', תקציב: 80, הוצא: 70 },
    { date: 'Apr-6', תקציב: 50, הוצא: 30 },
    { date: 'Apr-7', תקציב: 0, הוצא: 50 }
  ];
  

const CustomBar = (  ) => {
  const [theme, setTheme] = useState('light');

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

  const tooltipStyle = {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--panel-bg').trim(),
    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(),
    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}`,
    borderRadius: '0.5rem',
    padding: '0.5rem',
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="5 5" stroke={getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}/>
        <XAxis axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}} dataKey="date" />
        <YAxis axisLine={{stroke: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(), strokeWidth: '2px'}} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        {/* <Brush dataKey="date" height={30} stroke={getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()} /> */}
        <Bar dataKey="תקציב" fill="#8884d8" radius={[5, 5, 0, 0]} />
        {/* <Bar dataKey="הוצא" fill="#82ca9d" radius={[5, 5, 0, 0]} /> */}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CustomBar;
