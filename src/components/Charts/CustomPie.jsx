import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Text } from 'recharts';
import '../../styles/ForAdmin/customBar.css';

const COLORS = ['#4CAF50', '#FFC107', '#F44336']; // Green, Yellow, Red
const LABELS = ['במלאי', 'נמוך במלאי', 'אזל מהמלאי'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={16}
      fontWeight={600}
    >
      {percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
};

// Custom title component for the chart
const ChartTitle = ({ x, y, width, title }) => {
  return (
    <text
      x={x + width / 2}
      y={y + 20}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={18}
      fontWeight="bold"
      fill="#000"
    >
      {title}
    </text>
  );
};

const CustomPie = ({ products = [], userRole = 'manager' }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([
    { name: LABELS[0], value: 0 },
    { name: LABELS[1], value: 0 },
    { name: LABELS[2], value: 0 }
  ]);

  useEffect(() => {
    let inStock = 0, lowStock = 0, outOfStock = 0;
    products.forEach(p => {
      const minStock = p.minStock || 10; // Default to 10 if not set
      if (p.quantity > 0 && p.quantity >= minStock) inStock++;
      else if (p.quantity > 0 && p.quantity < minStock) lowStock++;
      else outOfStock++;
    });
    setData([
      { name: LABELS[0], value: inStock },
      { name: LABELS[1], value: lowStock },
      { name: LABELS[2], value: outOfStock }
    ]);
  }, [products]);

  const handlePieClick = (data, index) => {
    let stockStatus = '';
    
    // Map the clicked section to the appropriate filter
    switch (index) {
      case 0: // במלאי (In Stock) - Green section
        stockStatus = 'highStock';
        break;
      case 1: // נמוך במלאי (Low Stock) - Yellow section
        stockStatus = 'lowStock';
        break;
      case 2: // אזל מהמלאי (Out of Stock) - Red section
        stockStatus = 'outOfStock';
        break;
      default:
        stockStatus = 'all';
    }

    // Navigate to products page with the appropriate filter
    // Determine path based on userRole
    const basePath = userRole === 'admin' ? '/admin-dashboard/products' : '/manager-dashboard/products';
    navigate(basePath, { 
      state: { 
        applyFilter: { 
          categories: [],
          stockStatus: stockStatus 
        } 
      } 
    });
  };

  const tooltipFormatter = (value, name) => [`${value} מוצרים`, name];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px', paddingTop: '10px' }}>
        סטטוס מלאי מוצרים
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart margin={{ top: -50, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            dataKey="value"
            isAnimationActive={true}
            onClick={handlePieClick}
            style={{ cursor: 'pointer' }}
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={COLORS[idx]} style={{ cursor: 'pointer' }} />
          ))}
        </Pie>
        <Tooltip formatter={tooltipFormatter} />
        <Legend 
          align="center" 
          verticalAlign="bottom" 
          iconType="circle" 
          wrapperStyle={{ 
            lineHeight: '24px', 
            paddingLeft: 8,
            marginTop: '10px',
            marginBottom:'10px'
          }} 
          formatter={(value) => <span style={{ marginRight: 8 }}>{value}</span>} 
        />
      </PieChart>
    </ResponsiveContainer>
    </div>
  );
};

export default CustomPie;
