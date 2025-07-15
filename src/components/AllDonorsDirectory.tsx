import React, { useState, useMemo } from 'react';
import { DonorData } from '../types';
import { formatCurrency, formatNumber } from '../utils/helpers';
import { formatDate } from '../utils/dateUtils';
import { Search, Filter, Mail, Phone, Calendar, DollarSign, Gift, User } from 'lucide-react';

interface AllDonorsDirectoryProps {
  donors: DonorData[];
}

export const AllDonorsDirectory: React.FC<AllDonorsDirectoryProps> = ({ donors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalAmount' | 'donationCount' | 'averageDonation' | 'lastDonation' | 'name'>('totalAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'frequent' | 'regular' | 'occasional' | 'one-time'>('all');

  const filteredAndSortedDonors = useMemo(() => {
    let filtered = donors.filter(donor => {
      const matchesSearch = searchTerm === '' || 
        `${donor.firstName} ${donor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' || donor.donationFrequency === filterBy;
      
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'donationCount':
          aValue = a.donationCount;
          bValue = b.donationCount;
          break;
        case 'averageDonation':
          aValue = a.averageDonation;
          bValue = b.averageDonation;
          break;
        case 'lastDonation':
          aValue = a.lastDonation.getTime();
          bValue = b.lastDonation.getTime();
          break;
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        default:
          aValue = a.totalAmount;
          bValue = b.totalAmount;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [donors, searchTerm, sortBy, sortOrder, filterBy]);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'frequent': return 'bg-green-100 text-green-800';
      case 'regular': return 'bg-blue-100 text-blue-800';
      case 'occasional': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search donors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="totalAmount">Total Amount</option>
              <option value="donationCount">Number of Gifts</option>
              <option value="averageDonation">Average Gift</option>
              <option value="lastDonation">Last Donation</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Filter By Frequency */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Donors</option>
            <option value="frequent">Frequent</option>
            <option value="regular">Regular</option>
            <option value="occasional">Occasional</option>
            <option value="one-time">One-time</option>
          </select>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredAndSortedDonors.length} of {donors.length} donors
          </span>
          <span>
            Total: {formatCurrency(filteredAndSortedDonors.reduce((sum, donor) => sum + donor.totalAmount, 0))}
          </span>
        </div>
      </div>

      {/* Donors Grid */}
      <div className="p-6">
        {filteredAndSortedDonors.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No donors found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedDonors.map((donor, index) => (
              <div key={donor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Donor Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                      {donor.firstName.charAt(0)}{donor.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {donor.firstName} {donor.lastName}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(donor.donationFrequency)}`}>
                        {donor.donationFrequency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {donor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="truncate">{donor.email}</span>
                    </div>
                  )}
                  {donor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{donor.phone}</span>
                    </div>
                  )}
                </div>

                {/* Giving Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-900">
                      {formatCurrency(donor.totalAmount)}
                    </p>
                    <p className="text-xs text-green-600">Total Given</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Gift className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-blue-900">
                      {formatNumber(donor.donationCount)}
                    </p>
                    <p className="text-xs text-blue-600">Gifts</p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Gift:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(donor.averageDonation)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Gift:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(donor.firstDonation, 'MMM yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Gift:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(donor.lastDonation, 'MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};