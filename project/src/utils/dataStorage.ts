import { DonorData, Donation } from '../types';
import { encryptData, decryptData, generateId } from './helpers';

const STORAGE_KEY = 'donor_analytics_data';
const ENCRYPTION_KEY = 'donor_data_key_2024'; // In production, this should be user-specific

export class DataStorage {
  static saveData(donors: DonorData[]): void {
    try {
      const dataString = JSON.stringify(donors);
      const encryptedData = encryptData(dataString, ENCRYPTION_KEY);
      localStorage.setItem(STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to save donor data:', error);
    }
  }

  static loadData(): DonorData[] {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) return [];

      const dataString = decryptData(encryptedData, ENCRYPTION_KEY);
      const data = JSON.parse(dataString);
      
      // Convert date strings back to Date objects
      return data.map((donor: any) => ({
        ...donor,
        firstDonation: new Date(donor.firstDonation),
        lastDonation: new Date(donor.lastDonation),
        donations: donor.donations.map((donation: any) => ({
          ...donation,
          date: new Date(donation.date)
        }))
      }));
    } catch (error) {
      console.error('Failed to load donor data:', error);
      return [];
    }
  }

  static clearData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static mergeNewData(existingDonors: DonorData[], newDonors: DonorData[]): DonorData[] {
    const donorMap = new Map<string, DonorData>();

    // Add existing donors to map
    existingDonors.forEach(donor => {
      const key = this.getDonorKey(donor.firstName, donor.lastName);
      donorMap.set(key, { ...donor });
    });

    // Merge new donors
    newDonors.forEach(newDonor => {
      const key = this.getDonorKey(newDonor.firstName, newDonor.lastName);
      
      if (donorMap.has(key)) {
        const existingDonor = donorMap.get(key)!;
        
        // Merge donations, avoiding duplicates
        const existingDonationIds = new Set(existingDonor.donations.map(d => d.id));
        const newDonations = newDonor.donations.filter(d => !existingDonationIds.has(d.id));
        
        // Check for potential duplicates by date and amount
        const filteredNewDonations = newDonations.filter(newDonation => {
          return !existingDonor.donations.some(existingDonation => 
            existingDonation.date.getTime() === newDonation.date.getTime() &&
            existingDonation.amount === newDonation.amount
          );
        });

        if (filteredNewDonations.length > 0) {
          existingDonor.donations.push(...filteredNewDonations);
          this.recalculateDonorMetrics(existingDonor);
        }

        // Update contact info if new data has it and existing doesn't
        if (!existingDonor.email && newDonor.email) {
          existingDonor.email = newDonor.email;
        }
        if (!existingDonor.phone && newDonor.phone) {
          existingDonor.phone = newDonor.phone;
        }
      } else {
        donorMap.set(key, newDonor);
      }
    });

    return Array.from(donorMap.values());
  }

  private static getDonorKey(firstName: string, lastName: string): string {
    return `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}`;
  }

  private static recalculateDonorMetrics(donor: DonorData): void {
    // Sort donations by date
    donor.donations.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Recalculate metrics
    donor.totalAmount = donor.donations.reduce((sum, d) => sum + d.amount, 0);
    donor.donationCount = donor.donations.length;
    donor.averageDonation = donor.totalAmount / donor.donationCount;
    donor.firstDonation = donor.donations[0].date;
    donor.lastDonation = donor.donations[donor.donations.length - 1].date;
    donor.donationFrequency = this.calculateDonationFrequency(donor.donationCount);
  }

  private static calculateDonationFrequency(count: number): DonorData['donationFrequency'] {
    if (count === 1) return 'one-time';
    if (count <= 3) return 'occasional';
    if (count <= 6) return 'regular';
    return 'frequent';
  }

  static getUploadHistory(): Array<{ date: Date; recordsAdded: number; totalRecords: number }> {
    try {
      const historyData = localStorage.getItem(`${STORAGE_KEY}_history`);
      if (!historyData) return [];
      
      const history = JSON.parse(historyData);
      return history.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      }));
    } catch {
      return [];
    }
  }

  static saveUploadHistory(recordsAdded: number, totalRecords: number): void {
    try {
      const history = this.getUploadHistory();
      history.push({
        date: new Date(),
        recordsAdded,
        totalRecords
      });
      
      // Keep only last 50 uploads
      const recentHistory = history.slice(-50);
      localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to save upload history:', error);
    }
  }
}