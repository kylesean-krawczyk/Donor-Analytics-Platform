import Papa from 'papaparse';
import { DonorData, Donation, FileUploadResult } from '../types';
import { formatDate, parseDate } from './dateUtils';
import { generateId } from './helpers';

interface RawDataRow {
  [key: string]: string | number;
}

export class DataParser {
  private static readonly COMMON_FIELD_MAPPINGS = {
    firstName: ['first_name', 'firstname', 'fname', 'first', 'given_name', 'givenname', 'name'],
    lastName: ['last_name', 'lastname', 'lname', 'last', 'surname', 'family_name', 'familyname'],
    amount: ['amount', 'donation', 'gift', 'contribution', 'value', 'total', 'sum', 'dollars', 'money'],
    date: ['date', 'donation_date', 'gift_date', 'received_date', 'received_on', 'receivedon', 'createdon', 'created_on', 'timestamp', 'when', 'time'],
    month: ['month', 'donation_month', 'gift_month', 'period'],
    email: ['email', 'email_address', 'e_mail', 'mail', 'emailaddress'],
    phone: ['phone', 'phone_number', 'telephone', 'mobile', 'phonenumber', 'tel', 'mobilenumber', 'mobile_number']
  };

  static async parseFile(file: File): Promise<FileUploadResult> {
    try {
      const fileType = this.getFileType(file);
      let rawData: RawDataRow[] = [];

      switch (fileType) {
        case 'csv':
          rawData = await this.parseCSV(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}. Please use CSV format.`);
      }

      const processedData = this.processRawData(rawData);
      const donorData = this.groupByDonor(processedData);

      return {
        success: true,
        data: donorData,
        recordsProcessed: rawData.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        recordsProcessed: 0
      };
    }
  }

  private static getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') return 'csv';
    
    throw new Error('Unsupported file format. Please use CSV files.');
  }

  private static parseCSV(file: File): Promise<RawDataRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        dynamicTyping: false,
        complete: (results) => {
          // Filter out critical errors, allow minor ones
          const criticalErrors = results.errors.filter(error => 
            error.type === 'Delimiter' || error.type === 'Quotes'
          );
          
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`));
          } else if (results.data.length === 0) {
            reject(new Error('No data found in the CSV file'));
          } else {
            // Filter out empty rows
            const validData = (results.data as RawDataRow[]).filter(row => {
              return Object.values(row).some(value => 
                value !== null && value !== undefined && String(value).trim() !== ''
              );
            });
            resolve(validData);
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  private static processRawData(rawData: RawDataRow[]): Donation[] {
    return rawData.map((row, index) => {
      const mappedRow = this.mapFields(row);
      
      // Skip rows that don't have minimum required data or are completely empty
      if ((!mappedRow.firstName && !mappedRow.lastName) || !mappedRow.amount || mappedRow.amount === 0) {
        return null;
      }
      
      // Handle cases where names might be in a single field or missing
      let firstName = mappedRow.firstName || '';
      let lastName = mappedRow.lastName || '';
      
      // If we only have one name field, try to split it
      if (!firstName && !lastName && mappedRow.name) {
        const nameParts = String(mappedRow.name).trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // If still no names, skip this record
      if (!firstName && !lastName) {
        return null;
      }
      
      const donation = {
        id: generateId(),
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        amount: this.parseAmount(mappedRow.amount),
        date: this.parseDate(mappedRow.date, mappedRow.month),
        month: this.extractMonth(mappedRow.date, mappedRow.month),
        year: this.extractYear(mappedRow.date),
        email: mappedRow.email ? String(mappedRow.email).trim() : undefined,
        phone: mappedRow.phone ? String(mappedRow.phone).trim() : undefined,
        donorId: '' // Will be set during grouping
      };
      
      return donation;
    }).filter((donation): donation is Donation => 
      donation !== null &&
      (donation.firstName || donation.lastName) && 
      donation.amount > 0 && 
      donation.date
    );
  }

  private static mapFields(row: RawDataRow): any {
    const mapped: any = {};
    const normalizedRow: { [key: string]: any } = {};
    
    // Normalize keys
    Object.keys(row).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
      normalizedRow[normalizedKey] = row[key];
    });

    // Map fields based on common patterns
    Object.entries(this.COMMON_FIELD_MAPPINGS).forEach(([fieldName, patterns]) => {
      for (const pattern of patterns) {
        const normalizedPattern = pattern.replace(/[^\w]/g, '');
        if (normalizedRow[normalizedPattern] !== undefined || normalizedRow[pattern] !== undefined) {
          mapped[fieldName] = normalizedRow[normalizedPattern] || normalizedRow[pattern];
          break;
        }
      }
      
      // If no exact match found, try partial matching
      if (mapped[fieldName] === undefined) {
        for (const [key, value] of Object.entries(normalizedRow)) {
          for (const pattern of patterns) {
            if (key.includes(pattern.replace(/[^\w]/g, '')) || pattern.replace(/[^\w]/g, '').includes(key)) {
              mapped[fieldName] = value;
              break;
            }
          }
          if (mapped[fieldName] !== undefined) break;
        }
      }
    });

    // Additional fallback: try to detect columns by content and handle edge cases
    if (!mapped.firstName || !mapped.lastName) {
      Object.entries(normalizedRow).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          if (!mapped.firstName && (key.includes('name') || key.includes('first'))) {
            mapped.firstName = value;
          } else if (!mapped.lastName && (key.includes('last') || key.includes('surname'))) {
            mapped.lastName = value;
          }
        }
      });
    }

    if (!mapped.amount) {
      Object.entries(normalizedRow).forEach(([key, value]) => {
        if ((typeof value === 'number' || (typeof value === 'string' && /[\d.,$]/.test(value))) && 
            (key.includes('amount') || key.includes('donation') || key.includes('gift') || key.includes('total'))) {
          mapped.amount = value;
        }
      });
    }

    // Handle the case where we might have a full name in one field
    if (!mapped.firstName && !mapped.lastName) {
      Object.entries(normalizedRow).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() && key.includes('name') && !key.includes('fund') && !key.includes('batch')) {
          mapped.name = value;
        }
      });
    }
    
    return mapped;
  }

  private static parseAmount(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle currency formatting like " $700.00 ", "USD", "$1,234.56", etc.
      const cleaned = value.replace(/[^0-9.-]/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private static parseDate(dateValue: any, monthValue?: any): Date {
    if (dateValue) {
      const parsed = parseDate(String(dateValue));
      if (parsed) {
        return parsed;
      }
    }
    
    if (monthValue) {
      const month = this.parseMonth(monthValue);
      if (month) {
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, month - 1, 1);
      }
    }
    
    // Use current date as fallback
    return new Date();
  }

  private static parseMonth(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const normalized = value.toLowerCase();
      const monthIndex = monthNames.findIndex(month => month.startsWith(normalized));
      return monthIndex !== -1 ? monthIndex + 1 : null;
    }
    return null;
  }

  private static extractMonth(dateValue: any, monthValue?: any): string {
    const date = this.parseDate(dateValue, monthValue);
    return formatDate(date, 'MMMM yyyy');
  }

  private static extractYear(dateValue: any): number {
    const date = this.parseDate(dateValue);
    return date.getFullYear();
  }

  private static groupByDonor(donations: Donation[]): DonorData[] {
    const donorMap = new Map<string, DonorData>();

    donations.forEach(donation => {
      const key = `${donation.firstName.toLowerCase()}_${donation.lastName.toLowerCase()}`;
      
      if (!donorMap.has(key)) {
        const donorId = generateId();
        donorMap.set(key, {
          id: donorId,
          firstName: donation.firstName,
          lastName: donation.lastName,
          email: donation.email,
          phone: donation.phone,
          donations: [],
          totalAmount: 0,
          donationCount: 0,
          averageDonation: 0,
          firstDonation: donation.date,
          lastDonation: donation.date,
          donationFrequency: 'one-time'
        });
      }

      const donor = donorMap.get(key)!;
      donation.donorId = donor.id;
      donor.donations.push(donation);
      donor.totalAmount += donation.amount;
      donor.donationCount++;
      
      if (donation.date < donor.firstDonation) {
        donor.firstDonation = donation.date;
      }
      if (donation.date > donor.lastDonation) {
        donor.lastDonation = donation.date;
      }
    });

    // Calculate derived fields
    donorMap.forEach(donor => {
      donor.averageDonation = donor.totalAmount / donor.donationCount;
      donor.donationFrequency = this.calculateDonationFrequency(donor.donationCount);
    });

    return Array.from(donorMap.values());
  }

  private static calculateDonationFrequency(count: number): DonorData['donationFrequency'] {
    if (count === 1) return 'one-time';
    if (count <= 3) return 'occasional';
    if (count <= 6) return 'regular';
    return 'frequent';
  }
}