import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

const CustomPie = ({ products = [] }) => {
  const [data, setData] = useState([
    { name: LABELS[0], value: 0 },
    { name: LABELS[1], value: 0 },
    { name: LABELS[2], value: 0 }
  ]);

  useEffect(() => {
    let inStock = 0, lowStock = 0, outOfStock = 0;
    products.forEach(p => {
      if (p.quantity > 0 && p.quantity >= 10) inStock++;
      else if (p.quantity > 0 && p.quantity < 10) lowStock++;
      else outOfStock++;
    });
    setData([
      { name: LABELS[0], value: inStock },
      { name: LABELS[1], value: lowStock },
      { name: LABELS[2], value: outOfStock }
    ]);
  }, [products]);

  const tooltipFormatter = (value, name) => [`${value} מוצרים`, name];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="40%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          dataKey="value"
          isAnimationActive={false}
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
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
            marginTop: '10px'
          }} 
          formatter={(value) => <span style={{ marginRight: 8 }}>{value}</span>} 
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPie;
