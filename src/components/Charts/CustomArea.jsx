import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Text } from 'recharts';
import '../../styles/ForAdmin/customBar.css';

const GRADIENT_ID = 'area-gradient';

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

const AreaChartFillByValue = ({ data = [] }) => {
  const [theme, setTheme] = useState('light');
  const [chartData, setChartData] = useState([]);
  const [gradientOffset, setGradientOffset] = useState(1);

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
        .map(item => ({
          date: item.formatted || new Intl.DateTimeFormat('he-IL', { month: 'long', day: 'numeric' }).format(item.date),
          ערך: item.value,
          rawDate: item.date
        }));
      setChartData(sortedData);
      // Calculate gradient offset for value sign split
      const gradientOffset = () => {
        if (!sortedData.length) return 1;
        const dataMax = Math.max(...sortedData.map((d) => d.ערך));
        const dataMin = Math.min(...sortedData.map((d) => d.ערך));
        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;
        return dataMax / (dataMax - dataMin);
      };
      const off = gradientOffset();
      setGradientOffset(off);
    } else {
      setChartData([]);
      setGradientOffset(1);
    }
  }, [data]);

  const tooltipStyle = {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--panel-bg').trim(),
    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim(),
    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-text').trim()}`,
    borderRadius: '0.5rem',
    padding: '0.5rem',
  };

  const formatTooltip = (value, name) => [`${value.toFixed(2)} ₪`, name === 'ערך' ? 'ערך' : name];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px', paddingTop: '10px' }}>
        מגמות תקציב לאורך זמן
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={chartData}
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
        <Tooltip contentStyle={tooltipStyle} formatter={formatTooltip} />
        <Legend />
        {/* Single area, gradient split at zero */}
        {chartData.length > 0 && (
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
