import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BarChart3, Activity, RefreshCw, AlertCircle, CheckCircle, XCircle, Cloud } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EconomicDataService } from '../services/economicDataService';
import { EconomicIndicator } from '../types';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/helpers';

export const EconomicIndicators: React.FC = () => {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<EconomicIndicator | null>(null);
  const [apiStatus, setApiStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [weatherData, setWeatherData] = useState<any[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    testApiConnection();
    loadEconomicData();
  }, []);

  const testApiConnection = async () => {
    try {
      const status = await EconomicDataService.testFredConnection();
      setApiStatus(status);
    } catch (err) {
      setApiStatus({
        success: false,
        message: 'Failed to test API connection'
      });
    }
  };

  const loadEconomicData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await EconomicDataService.getAllEconomicIndicators();
      setIndicators(data);
      if (data.length > 0) {
        setSelectedIndicator(data[0]);
      }
    } catch (err) {
      setError('Failed to load economic data. Using sample data for demonstration.');
      console.error('Economic data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    setWeatherData(null);
    try {
      // Example parameters for NOAA CDO API (Daily Summaries for Raleigh, NC in June 2024)
      const params = new URLSearchParams({
        datasetid: 'GHCND', // Global Historical Climatology Network - Daily
        locationid: 'ZIP:27601', // Example: Raleigh, NC ZIP code
        startdate: '2024-06-01',
        enddate: '2024-06-30',
        datatypeid: 'TMAX,TMIN,PRCP', // Max Temp, Min Temp, Precipitation
        limit: '1000'
      });

      const response = await fetch(`/.netlify/functions/noaa-proxy?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weather data');
      }

      const data = await response.json();
      setWeatherData(data.results || []);
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : 'Unknown error fetching weather data');
      console.error('Weather data fetch error:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const getIconForIndicator = (name: string) => {
    switch (name) {
      case 'Consumer Confidence Index':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'S&P 500 Performance':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'Unemployment Rate':
        return <BarChart3 className="w-5 h-5 text-red-600" />;
      case 'GDP Growth Rate':
        return <DollarSign className="w-5 h-5 text-purple-600" />;
      case 'Inflation Rate':
        return <Activity className="w-5 h-5 text-orange-600" />;
      case 'Federal Funds Rate':
        return <BarChart3 className="w-5 h-5 text-indigo-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading economic indicators...</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* API Connection Status */}
      {apiStatus && (
        <div className={`rounded-lg p-4 border ${
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="font-medium text-blue-800">
              Demo Mode: {apiStatus.message}
            </p>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            Real-time data integration requires backend server deployment to avoid CORS restrictions.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Economic Indicators Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((indicator, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${
              selectedIndicator?.name === indicator.name 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedIndicator(indicator)}
          >
            <div className="flex items-center justify-between mb-2">
              {getIconForIndicator(indicator.name)}
              <span className={`text-sm font-medium ${getTrendColor(indicator.trend)}`}>
                {getTrendIcon(indicator.trend)} {indicator.trend}
              </span>
            </div>
            <h4 className="font-medium text-gray-900 text-sm mb-1">{indicator.name}</h4>
            <p className="text-lg font-bold text-gray-900">
              {indicator.name.includes('Rate') || indicator.name.includes('Growth') 
                ? `${indicator.currentValue.toFixed(1)}%`
                : formatNumber(indicator.currentValue)
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Correlation: {formatPercentage(Math.abs(indicator.correlation))}
            </p>
          </div>
        ))}
      </div>

      {/* Weather Data Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weather Data Insights</h3>
          </div>
          <button
            onClick={fetchWeatherData}
            disabled={weatherLoading}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {weatherLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>Fetch Weather Data</span>
              </>
            )}
          </button>
        </div>

        {weatherError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 text-sm">{weatherError}</p>
            </div>
          </div>
        )}

        {weatherData && weatherData.length > 0 ? (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Location:</strong> ZIP:27601 (Raleigh, NC) | <strong>Period:</strong> June 01-30, 2024 | <strong>Data Points:</strong> {weatherData.length}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-600 mr-2" />
                  <p className="text-sm font-medium text-orange-800">Avg. Max Temperature</p>
                </div>
                <p className="text-xl font-bold text-orange-900">
                  {(() => {
                    const tmaxValues = weatherData.filter(d => d.datatype === 'TMAX').map(d => d.value);
                    if (tmaxValues.length === 0) return 'N/A';
                    const avgTmax = tmaxValues.reduce((sum, val) => sum + val, 0) / tmaxValues.length;
                    const celsius = (avgTmax / 10).toFixed(1);
                    const fahrenheit = ((avgTmax / 10) * 9/5 + 32).toFixed(1);
                    return `${celsius}°C / ${fahrenheit}°F`;
                  })()}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Activity className="w-4 h-4 text-blue-600 mr-2" />
                  <p className="text-sm font-medium text-blue-800">Total Precipitation</p>
                </div>
                <p className="text-xl font-bold text-blue-900">
                  {(() => {
                    const prcpValues = weatherData.filter(d => d.datatype === 'PRCP').map(d => d.value);
                    if (prcpValues.length === 0) return 'N/A';
                    const totalPrcp = prcpValues.reduce((sum, val) => sum + val, 0);
                    const mm = (totalPrcp / 10).toFixed(1);
                    const inches = (totalPrcp / 254).toFixed(2);
                    return `${mm} mm / ${inches} in`;
                  })()}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <BarChart3 className="w-4 h-4 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-green-800">Avg. Min Temperature</p>
                </div>
                <p className="text-xl font-bold text-green-900">
                  {(() => {
                    const tminValues = weatherData.filter(d => d.datatype === 'TMIN').map(d => d.value);
                    if (tminValues.length === 0) return 'N/A';
                    const avgTmin = tminValues.reduce((sum, val) => sum + val, 0) / tminValues.length;
                    const celsius = (avgTmin / 10).toFixed(1);
                    const fahrenheit = ((avgTmin / 10) * 9/5 + 32).toFixed(1);
                    return `${celsius}°C / ${fahrenheit}°F`;
                  })()}
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Data Source:</strong> NOAA Climate Data Online (CDO) API - Global Historical Climatology Network Daily (GHCND)
              </p>
              <p className="text-xs text-gray-600 mt-1">
                <strong>Note:</strong> This is sample weather data for demonstration. In a production system, you would correlate this with your donor locations and donation dates.
              </p>
            </div>
          </div>
        ) : (
          !weatherLoading && !weatherError && (
            <div className="text-center py-8">
              <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No weather data loaded yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Fetch Weather Data" to load sample weather data from NOAA.
              </p>
            </div>
          )
        )}
      </div>

      {/* Selected Indicator Chart */}
      {selectedIndicator && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedIndicator.name} Trend
            </h3>
            <button
              onClick={loadEconomicData}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedIndicator.data.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => 
                    selectedIndicator.name.includes('S&P') ? formatNumber(value) : `${value.toFixed(1)}%`
                  }
                />
                <Tooltip 
                  formatter={(value: number) => [
                    selectedIndicator.name.includes('S&P') ? formatNumber(value) : `${value.toFixed(1)}%`,
                    selectedIndicator.name
                  ]}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Impact on Fundraising</p>
              <p className="text-sm text-gray-600 mt-1">{selectedIndicator.impact}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-700">Recommendation</p>
              <p className="text-sm text-blue-600 mt-1">{selectedIndicator.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Integration Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Data Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800">Federal Reserve Economic Data (FRED)</h4>
            <p className="text-sm text-green-600 mt-1">
              Consumer Confidence, S&P 500, Unemployment, GDP, Inflation, Federal Funds Rate
            </p>
            <div className="mt-2 text-xs text-green-700">
              <strong>Series IDs:</strong> UMCSENT, SP500, UNRATE, A191RL1Q225SBEA, CPIAUCSL, FEDFUNDS
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800">Bureau of Economic Analysis (BEA)</h4>
            <p className="text-sm text-blue-600 mt-1">
              Personal Income Growth, Corporate Profits, GDP Components
            </p>
            <div className="mt-2 text-xs text-blue-700">
              <strong>Tables:</strong> T20100 (Personal Income), T11200 (Corporate Profits)
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800">Bureau of Labor Statistics (BLS)</h4>
            <p className="text-sm text-purple-600 mt-1">
              Labor Force Participation, Average Hourly Earnings, Job Openings
            </p>
            <div className="mt-2 text-xs text-purple-700">
              <strong>Series IDs:</strong> LNS11300000, CES0500000003, JTS00000000JOL
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800">Data Refresh</h4>
            <p className="text-sm text-blue-600 mt-1">
              All economic indicators are updated automatically from official government sources
            </p>
            <button
              onClick={() => {
                testApiConnection();
                loadEconomicData();
              }}
              className="mt-2 text-xs text-blue-700 hover:text-blue-800 underline"
            >
              Test All API Connections
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800">Data Coverage</h4>
            <p className="text-sm text-gray-600 mt-1">
              11 comprehensive economic indicators covering monetary policy, employment, income, and market performance
            </p>
            <div className="mt-2 text-xs text-gray-700">
              <strong>Update Frequency:</strong> Monthly (FRED/BLS), Quarterly (BEA)
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Data Sources:</strong> All economic data is sourced directly from official U.S. government agencies: 
            Federal Reserve Bank of St. Louis (FRED), Bureau of Economic Analysis (BEA), and Bureau of Labor Statistics (BLS). 
            Data is updated monthly or quarterly depending on the indicator and provides the most current economic insights for fundraising strategy.
          </p>
        </div>
      </div>
    </div>
  );
};