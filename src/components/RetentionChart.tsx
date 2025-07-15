import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RetentionData } from '../types';
import { formatPercentage } from '../utils/helpers';

interface RetentionChartProps {
  data: RetentionData;
}

export const RetentionChart: React.FC<RetentionChartProps> = ({ data }) => {
  const chartData = [
    { name: 'Repeat Donors', value: data.retentionRate, count: data.returningDonors },
    { name: 'New/One-time Donors', value: data.churnRate, count: data.newDonors }
  ];

  const COLORS = ['#059669', '#ef4444'];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${formatPercentage(value)}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatPercentage(value)}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};