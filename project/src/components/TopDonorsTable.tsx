import React from 'react';
import { DonorData } from '../types';
import { formatCurrency, formatNumber } from '../utils/helpers';

interface TopDonorsTableProps {
  donors: DonorData[];
}

export const TopDonorsTable: React.FC<TopDonorsTableProps> = ({ donors }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Donor</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Total Amount</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Donations</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Gift</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Frequency</th>
          </tr>
        </thead>
        <tbody>
          {donors.map((donor, index) => (
            <tr key={donor.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {donor.firstName} {donor.lastName}
                    </p>
                    {donor.email && (
                      <p className="text-sm text-gray-500">{donor.email}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-medium text-gray-900">
                {formatCurrency(donor.totalAmount)}
              </td>
              <td className="py-3 px-4 text-right text-gray-700">
                {formatNumber(donor.donationCount)}
              </td>
              <td className="py-3 px-4 text-right text-gray-700">
                {formatCurrency(donor.averageDonation)}
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  donor.donationFrequency === 'frequent' ? 'bg-green-100 text-green-800' :
                  donor.donationFrequency === 'regular' ? 'bg-blue-100 text-blue-800' :
                  donor.donationFrequency === 'occasional' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {donor.donationFrequency}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};