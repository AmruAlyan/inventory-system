import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const hardcodedBudgetData = [
  { date: '2025-06-01', amount: 500, totalBudget: 5000 },
  { date: '2025-06-02', amount: 300, totalBudget: 5300 },
  { date: '2025-06-03', amount: 200, totalBudget: 5500 },
  { date: '2025-06-04', amount: 0, totalBudget: 5500 },
  { date: '2025-06-05', amount: 100, totalBudget: 5600 },
];

const hardcodedPurchaseData = [
  { date: '2025-04-12', totalAmount: 1080, budgetBefore: 2700, budgetAfter: 1620 },
  { date: '2025-04-25', totalAmount: 1140, budgetBefore: 1620, budgetAfter: 480 },
  { date: '2025-05-20', totalAmount: 4000, budgetBefore: 1980, budgetAfter: -2020 },
  { date: '2025-06-05', totalAmount: 19.90, budgetBefore: 980, budgetAfter: 960.10 },
  { date: '2025-06-12', totalAmount: 22.00, budgetBefore: 2460.10, budgetAfter: 2438.10 },
  { date: '2025-06-14', totalAmount: 3.90, budgetBefore: 2395.20, budgetAfter: 2391.30 },
];

const ReportBarChart = ({ data = [], reportType = 'budget' }) => {
  const [chartData, setChartData] = useState([]);
  useEffect(() => {
    const sourceData = (data && data.length > 0) ? data : (reportType === 'budget' ? hardcodedBudgetData : hardcodedPurchaseData);
    const processedData = [...sourceData]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10)
      .map(item => {
        if (reportType === 'budget') {
          return {
            name: item.date,
            updateAmount: item.amount.toFixed(2) || 0,
            totalBudget: item.totalBudget.toFixed(2) || 0,
          };
        } else if (reportType === 'purchase') {
          return {
            name: item.date,
            totalAmount: item.totalAmount.toFixed(2) || 0,
            budgetBefore: item.budgetBefore.toFixed(2) || 0,
            budgetAfter: item.budgetAfter.toFixed(2) || 0,
          };
        } else {
          return {
            name: item.date,
            value: item.amount || item.totalAmount || 0,
          };
        }
      });
    setChartData(processedData);
  }, [data, reportType]);

  // Custom tooltip formatter to add ₪ symbol
  const formatTooltip = (value, name) => {
    return [`${value} ₪`, name];
  };

  if (reportType !== 'budget' && reportType !== 'purchase') {
    return <div style={{ color: 'red' }}>Unsupported report type</div>;
  }

  if (reportType === 'budget') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `${value} ₪`} />
          <Tooltip 
            formatter={(value, name, props) => {
              // Color match for tooltip
              if (name === 'תקציב נוכחי') return [`${value} ₪`, name, { color: '#82ca9d' }];
              if (name === 'סכום עדכון') return [`${value} ₪`, name, { color: '#8884d8' }];
              return [`${value} ₪`, name];
            }}
            contentStyle={{ backgroundColor: 'var(--panel-bg)', color: 'var(--primary-text)', borderRadius: '4px', transform: 'scale(0.8)' }}
          />
          <Legend />
          <Bar dataKey="totalBudget" name="תקציב נוכחי" fill="#82ca9d" legendType="rect" />
          <Bar dataKey="updateAmount" name="סכום עדכון" fill="#8884d8" legendType="rect" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (reportType === 'purchase') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `${value} ₪`} />
          <Tooltip 
            formatter={(value, name, props) => {
              if (name === 'סה"כ רכישה') return [`${value} ₪`, name, { color: '#8884d8' }];
              if (name === 'תקציב לפני') return [`${value} ₪`, name, { color: '#82ca9d' }];
              if (name === 'תקציב אחרי') return [`${value} ₪`, name, { color: '#ffc658' }];
              return [`${value} ₪`, name];
            }}
            contentStyle={{ backgroundColor: 'var(--panel-bg)', color: 'var(--primary-text)', borderRadius: '4px', transform: 'scale(0.8)' }}
          />
          <Legend />
          <Bar dataKey="totalAmount" name={'סה"כ רכישה'} fill="#8884d8" legendType="rect" />
          <Bar dataKey="budgetBefore" name={'תקציב לפני'} fill="#82ca9d" legendType="rect" />
          <Bar dataKey="budgetAfter" name={'תקציב אחרי'} fill="#ffc658" legendType="rect" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

};

export default ReportBarChart;