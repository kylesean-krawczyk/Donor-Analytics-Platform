import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RetentionData } from '../types';
import { formatPercentage } from '../utils/helpers';

interface RetentionChartProps {
  data: RetentionData;
}

export const RetentionChart: React.FC<RetentionChartProps> = ({ data }) => {
  // Calculate total for percentage calculation
  const total = data.returningDonors + data.newDonors;
  
  const chartData = [
    { 
      name: 'Returning Donors', 
      value: total > 0 ? data.returningDonors / total : 0, 
      count: data.returningDonors,
      absoluteValue: data.returningDonors
    },
    { 
      name: 'New Donors', 
      value: total > 0 ? data.newDonors / total : 0, 
      count: data.newDonors,
      absoluteValue: data.newDonors
    }
  ];

  const COLORS = ['#059669', '#3b82f6'];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, absoluteValue }) => `${name}: ${absoluteValue} (${formatPercentage(value)})`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${props.payload.absoluteValue} donors (${formatPercentage(value)})`,
              name
            ]}
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