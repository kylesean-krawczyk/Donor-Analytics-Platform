import React from 'react';
import { saveAs } from 'file-saver';
import { DataStorage } from '../utils/dataStorage';
import { DonorData } from '../types';
import { Database, Download, Trash2, Upload, Calendar } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { formatNumber } from '../utils/helpers';

interface DataManagementProps {
  donorData: DonorData[];
  onDataCleared: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ donorData, onDataCleared }) => {
  const uploadHistory = DataStorage.getUploadHistory();

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all donor data? This action cannot be undone.')) {
      DataStorage.clearData();
      onDataCleared();
    }
  };

  const handleExportData = () => {
    // Export as CSV for better compatibility
    const csvHeader = 'First Name,Last Name,Email,Phone,Total Amount,Donation Count,Average Donation,First Donation,Last Donation,Frequency\n';
    const csvData = donorData.map(donor => [
      donor.firstName,
      donor.lastName,
      donor.email || '',
      donor.phone || '',
      donor.totalAmount,
      donor.donationCount,
      donor.averageDonation.toFixed(2),
      formatDate(donor.firstDonation, 'yyyy-MM-dd'),
      formatDate(donor.lastDonation, 'yyyy-MM-dd'),
      donor.donationFrequency
    ].join(',')).join('\n');
    
    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `donor-data-export-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Overview</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Total Donors</p>
            <p className="text-2xl font-bold text-blue-900">{formatNumber(donorData.length)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Total Donations</p>
            <p className="text-2xl font-bold text-green-900">
              {formatNumber(donorData.reduce((sum, donor) => sum + donor.donationCount, 0))}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-800">Data Uploads</p>
            <p className="text-2xl font-bold text-purple-900">{formatNumber(uploadHistory.length)}</p>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upload History</h3>
          </div>
        </div>

        {uploadHistory.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadHistory.slice().reverse().map((upload, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(upload.date, 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Added {formatNumber(upload.recordsAdded)} records
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">
                    Total: {formatNumber(upload.totalRecords)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No upload history available</p>
        )}
      </div>

      {/* Data Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          
          <button
            onClick={handleClearData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Data is stored locally in your browser and encrypted for security. 
            Regular exports are recommended for backup purposes.
          </p>
        </div>
      </div>
    </div>
  );
};