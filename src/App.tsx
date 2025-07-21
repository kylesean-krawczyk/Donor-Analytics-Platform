import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { SecurityInfo } from './components/SecurityInfo';
import { EconomicIndicators } from './components/EconomicIndicators';
import { DataManagement } from './components/DataManagement';
import { AllDonorsDirectory } from './components/AllDonorsDirectory';
import { DataStorage } from './utils/dataStorage';
import { DonorAnalytics } from './utils/analytics';
import { DonorData, AnalysisResult } from './types';
import { BarChart3, Shield, TrendingUp, Upload, Database, Users } from 'lucide-react';

function App() {
  const [donorData, setDonorData] = useState<DonorData[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'security' | 'economic' | 'data'>('upload');
  const [isLoading, setIsLoading] = useState(false);

  // Load existing data on component mount
  React.useEffect(() => {
    const existingData = DataStorage.loadData();
    if (existingData.length > 0) {
      setDonorData(existingData);
      const analysisResult = DonorAnalytics.analyzeData(existingData);
      setAnalysis(analysisResult);
      setActiveTab('dashboard');
    }
  }, []);

  const handleDataLoaded = (data: DonorData[]) => {
    setIsLoading(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      // Merge new data with existing data
      const existingData = DataStorage.loadData();
      const mergedData = DataStorage.mergeNewData(existingData, data);
      
      // Save merged data
      DataStorage.saveData(mergedData);
      DataStorage.saveUploadHistory(data.length, mergedData.length);
      
      // Update state
      setDonorData(mergedData);
      const analysisResult = DonorAnalytics.analyzeData(mergedData);
      setAnalysis(analysisResult);
      setActiveTab('dashboard');
      setIsLoading(false);
    }, 1000);
  };

  const handleDataCleared = () => {
    setDonorData([]);
    setAnalysis(null);
    setActiveTab('upload');
  };

  const tabs = [
    { id: 'upload', label: 'Upload Data', icon: <Upload className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'donors', label: 'All Donors', icon: <Users className="w-4 h-4" /> },
    { id: 'data', label: 'Data Management', icon: <Database className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'economic', label: 'Economic Insights', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Donor Analytics Platform
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Production-Ready Fundraising Intelligence
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Analyzing donor data...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {activeTab === 'upload' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {donorData.length > 0 ? 'Add More Donor Data' : 'Upload Your Donor Data'}
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    {donorData.length > 0 
                      ? `Add new donation records to your existing database of ${donorData.length} donors. New data will be merged with existing records.`
                      : 'Import your donor database to unlock powerful insights about giving patterns, retention rates, and future fundraising opportunities.'
                    }
                  </p>
                </div>
                <FileUpload onDataLoaded={handleDataLoaded} isLoading={isLoading} />
                
                {donorData.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800 text-center">
                      <strong>Current Database:</strong> {donorData.length} donors with{' '}
                      {donorData.reduce((sum, donor) => sum + donor.donationCount, 0)} total donations
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dashboard' && analysis && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Donor Analytics Dashboard
                  </h2>
                  <p className="text-lg text-gray-600">
                    Comprehensive insights from {donorData.length} donor records
                  </p>
                </div>
                <Dashboard analysis={analysis} donorData={donorData} />
              </div>
            )}

            {activeTab === 'donors' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    All Donors Directory
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Complete directory of all {donorData.length} donors, organized by total giving amount. 
                    View detailed donor profiles and giving history.
                  </p>
                </div>
                <AllDonorsDirectory donors={donorData} />
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Data Management
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Manage your donor database, view upload history, and export data for backup or analysis.
                  </p>
                </div>
                <DataManagement donorData={donorData} onDataCleared={handleDataCleared} />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Security & Compliance
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Essential security measures and compliance requirements for protecting 
                    sensitive donor information.
                  </p>
                </div>
                <SecurityInfo />
              </div>
            )}

            {activeTab === 'economic' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Economic Market Insights
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Leverage economic indicators to optimize fundraising timing and 
                    improve donation forecasting accuracy.
                  </p>
                </div>
                <EconomicIndicators />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;