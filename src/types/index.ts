export interface DonorData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  donations: Donation[];
  totalAmount: number;
  donationCount: number;
  averageDonation: number;
  firstDonation: Date;
  lastDonation: Date;
  donationFrequency: 'one-time' | 'occasional' | 'regular' | 'frequent';
}

export interface Donation {
  id: string;
  amount: number;
  date: Date;
  month: string;
  year: number;
  donorId: string;
}

export interface AnalysisResult {
  totalDonors: number;
  totalAmount: number;
  averageDonation: number;
  donationCount: number;
  topDonors: DonorData[];
  monthlyTrends: MonthlyTrend[];
  donorRetention: RetentionData;
  forecast: ForecastData;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  amount: number;
  donorCount: number;
  averageDonation: number;
}

export interface RetentionData {
  newDonors: number;
  returningDonors: number;
  retentionRate: number;
  churnRate: number;
}

export interface ForecastData {
  nextMonth: {
    predictedAmount: number;
    confidence: number;
  };
  nextQuarter: {
    predictedAmount: number;
    confidence: number;
  };
  trendDirection: 'up' | 'down' | 'stable';
}

export interface FileUploadResult {
  success: boolean;
  data?: DonorData[];
  error?: string;
  recordsProcessed: number;
}

export interface ComparisonPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
  data: AnalysisResult;
}

export interface EconomicDataPoint {
  date: Date;
  value: number;
  indicator: string;
}

export interface EconomicIndicator {
  name: string;
  data: EconomicDataPoint[];
  impact: string;
  recommendation: string;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  correlation: number; // Correlation coefficient with donation patterns
}

export interface EnhancedForecastData extends ForecastData {
  economicFactors: {
    consumerConfidence: number;
    marketPerformance: number;
    unemploymentImpact: number;
    gdpGrowthImpact: number;
  };
  adjustedPredictions: {
    nextMonth: {
      baseAmount: number;
      economicAdjustment: number;
      finalAmount: number;
      confidence: number;
    };
    nextQuarter: {
      baseAmount: number;
      economicAdjustment: number;
      finalAmount: number;
      confidence: number;
    };
  };
}