import React from 'react';
import { ForecastData } from '../types';
import { formatCurrency, formatPercentage } from '../utils/helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ForecastCardProps {
  forecast: ForecastData;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast }) => {
  const getTrendIcon = () => {
    switch (forecast.trendDirection) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (forecast.trendDirection) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Forecast</h3>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {forecast.trendDirection}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">Next Month</span>
            <span className="text-xs text-blue-600">
              {formatPercentage(forecast.nextMonth.confidence)} confidence
            </span>
          </div>
          <p className="text-xl font-bold text-blue-900">
            {formatCurrency(forecast.nextMonth.predictedAmount)}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-purple-800">Next Quarter</span>
            <span className="text-xs text-purple-600">
              {formatPercentage(forecast.nextQuarter.confidence)} confidence
            </span>
          </div>
          <p className="text-xl font-bold text-purple-900">
            {formatCurrency(forecast.nextQuarter.predictedAmount)}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          Forecast based on historical donation patterns and linear regression analysis.
          Confidence levels indicate prediction reliability.
        </p>
      </div>
    </div>
  );
};