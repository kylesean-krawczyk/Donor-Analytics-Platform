import { DonorData, AnalysisResult } from '../types';

export interface AIAnalysisRequest {
  query: string;
  donorData: DonorData[];
  context?: {
    timeframe?: string;
    focusArea?: string;
    comparisonData?: any;
  };
}

export interface AIAnalysisResponse {
  content: string;
  insights: string[];
  recommendations: string[];
  data?: any[];
  confidence: number;
  sources?: string[];
}

export interface ExternalDataSource {
  name: string;
  type: 'economic' | 'demographic' | 'market' | 'social';
  endpoint: string;
  description: string;
}

export class AIService {
  private static readonly API_ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  };

  private static readonly EXTERNAL_DATA_SOURCES: ExternalDataSource[] = [
    {
      name: 'Federal Reserve Economic Data (FRED)',
      type: 'economic',
      endpoint: 'https://api.stlouisfed.org/fred',
      description: 'Economic indicators like GDP, unemployment, inflation'
    },
    {
      name: 'Census Bureau',
      type: 'demographic',
      endpoint: 'https://api.census.gov/data',
      description: 'Population, income, and demographic data'
    },
    {
      name: 'Bureau of Labor Statistics',
      type: 'economic',
      endpoint: 'https://api.bls.gov/publicAPI/v2',
      description: 'Employment and wage statistics'
    },
    {
      name: 'Yahoo Finance',
      type: 'market',
      endpoint: 'https://query1.finance.yahoo.com/v8/finance/chart',
      description: 'Stock market and financial data'
    }
  ];

  static async analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      // Call Netlify Function directly
      const aiResponse = await this.callNetlifyFunction(request);
      
      return {
        content: aiResponse.content,
        insights: aiResponse.insights || [],
        recommendations: aiResponse.recommendations || [],
        data: [],
        confidence: aiResponse.confidence || 0.8,
        sources: ['Internal Donor Database']
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to complete AI analysis. Please try again.');
    }
  }

  private static async callNetlifyFunction(request: AIAnalysisRequest): Promise<any> {
    try {
      const response = await fetch('/.netlify/functions/anthropic-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: request.query,
          donorData: request.donorData,
          context: request.context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Netlify Function error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Netlify Function Error:', error);
      throw error;
    }
  }

  private static prepareDonorDataSummary(donorData: DonorData[]): any {
    const totalDonors = donorData.length;
    const totalAmount = donorData.reduce((sum, donor) => sum + donor.totalAmount, 0);
    const totalDonations = donorData.reduce((sum, donor) => sum + donor.donationCount, 0);
    
    // Calculate monthly trends
    const monthlyData = new Map<string, { amount: number; count: number }>();
    donorData.forEach(donor => {
      donor.donations.forEach(donation => {
        const monthKey = `${donation.date.getFullYear()}-${donation.date.getMonth() + 1}`;
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { amount: 0, count: 0 });
        }
        const data = monthlyData.get(monthKey)!;
        data.amount += donation.amount;
        data.count += 1;
      });
    });

    // Donor segmentation
    const frequentDonors = donorData.filter(d => d.donationFrequency === 'frequent').length;
    const regularDonors = donorData.filter(d => d.donationFrequency === 'regular').length;
    const occasionalDonors = donorData.filter(d => d.donationFrequency === 'occasional').length;
    const oneTimeDonors = donorData.filter(d => d.donationFrequency === 'one-time').length;

    return {
      summary: {
        totalDonors,
        totalAmount,
        totalDonations,
        averageDonation: totalAmount / totalDonations,
        averageDonorValue: totalAmount / totalDonors
      },
      segmentation: {
        frequent: frequentDonors,
        regular: regularDonors,
        occasional: occasionalDonors,
        oneTime: oneTimeDonors
      },
      monthlyTrends: Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
        average: data.amount / data.count
      })).sort((a, b) => a.month.localeCompare(b.month)),
      topDonors: donorData
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10)
        .map(d => ({
          totalAmount: d.totalAmount,
          donationCount: d.donationCount,
          frequency: d.donationFrequency
        }))
    };
  }

  private static async fetchRelevantExternalData(query: string): Promise<any[]> {
    const relevantSources: string[] = [];
    
    // Determine which external data sources are relevant
    if (query.toLowerCase().includes('economic') || query.toLowerCase().includes('gdp') || query.toLowerCase().includes('unemployment')) {
      relevantSources.push('economic');
    }
    if (query.toLowerCase().includes('demographic') || query.toLowerCase().includes('population') || query.toLowerCase().includes('income')) {
      relevantSources.push('demographic');
    }
    if (query.toLowerCase().includes('market') || query.toLowerCase().includes('stock') || query.toLowerCase().includes('financial')) {
      relevantSources.push('market');
    }

    // In a real implementation, you would fetch actual data here
    // For now, return mock data structure
    return [
      {
        source: 'FRED',
        indicator: 'Consumer Confidence Index',
        currentValue: 98.5,
        trend: 'increasing',
        correlation: 0.73
      },
      {
        source: 'BLS',
        indicator: 'Unemployment Rate',
        currentValue: 3.7,
        trend: 'stable',
        correlation: -0.62
      }
    ];
  }

  private static constructAnalysisPrompt(query: string, dataSummary: any, externalData: any[]): string {
    return `
You are an expert nonprofit fundraising analyst with access to donor data and external economic/demographic data. 

DONOR DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

EXTERNAL DATA:
${JSON.stringify(externalData, null, 2)}

USER QUERY: "${query}"

Please provide a comprehensive analysis that includes:
1. Direct insights from the donor data
2. Correlations with external data where relevant
3. Actionable recommendations for fundraising strategy
4. Statistical observations and patterns
5. Confidence level in your analysis

Format your response as JSON with the following structure:
{
  "content": "Main analysis narrative",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "confidence": 0.85
}
`;
  }

  private static async callAIService(prompt: string): Promise<any> {
    // Use Anthropic Claude as the primary AI service
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (anthropicKey) {
      return this.callAnthropicClaude(prompt, anthropicKey);
    }
    
    // Fallback to OpenAI if Anthropic not configured
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiKey) {
      return this.callOpenAI(prompt, openaiKey);
    }
    
    // If no API keys, return mock response for demo
    return this.getMockAIResponse(prompt);
  }

  private static async callAnthropicClaude(prompt: string, apiKey: string): Promise<any> {
    try {
      // Use Netlify Function instead of direct API call
      const response = await fetch('/.netlify/functions/anthropic-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: request.query,
          donorData: request.donorData,
          context: request.context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Netlify Function error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Netlify Function Error:', error);
      throw error;
    }
  }

  private static async callOpenAI(prompt: string, apiKey: string): Promise<any> {
    try {
      const response = await fetch(this.API_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert nonprofit fundraising analyst. Provide data-driven insights and actionable recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content;
      
      // Parse JSON response from AI
      try {
        return JSON.parse(aiContent);
      } catch {
        // Fallback if AI doesn't return valid JSON
        return {
          content: aiContent,
          insights: [],
          recommendations: [],
          confidence: 0.7
        };
      }
    } catch (error) {
      console.error('OpenAI Error:', error);
      throw error;
    }
  }

  private static getMockAIResponse(prompt: string): any {
    // Demo response when no API keys are configured
    return {
      content: "This is a demo response. To enable full AI capabilities, please configure your Anthropic Claude API key in the environment variables.",
      insights: [
        "Demo mode is active - configure VITE_ANTHROPIC_API_KEY for full functionality",
        "Your donor data shows interesting patterns that AI can help analyze",
        "Real AI integration will provide much deeper insights"
      ],
      recommendations: [
        "Set up your Anthropic Claude API key for full AI analysis",
        "Try asking specific questions about donor patterns",
        "Use AI to correlate your data with external economic factors"
      ],
      confidence: 0.5
    };
  }

  // Method to test AI service connection
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.API_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert nonprofit fundraising analyst. Provide data-driven insights and actionable recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content;
      
      // Parse JSON response from AI
      try {
        return JSON.parse(aiContent);
      } catch {
        // Fallback if AI doesn't return valid JSON
        return {
          content: aiContent,
          insights: [],
          recommendations: [],
          confidence: 0.7
        };
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  private static getDataSources(query: string): string[] {
    const sources = ['Internal Donor Database'];
    
    if (query.toLowerCase().includes('economic')) {
      sources.push('Federal Reserve Economic Data (FRED)');
    }
    if (query.toLowerCase().includes('demographic')) {
      sources.push('U.S. Census Bureau');
    }
    if (query.toLowerCase().includes('market')) {
      sources.push('Financial Market Data');
    }
    
    return sources;
  }

  // Method to test AI service connection
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          message: 'AI service not configured. Please add VITE_OPENAI_API_KEY to your environment variables.'
        };
      }

      const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (anthropicKey) {
        return this.testAnthropicConnection(anthropicKey);
      }
      
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (openaiKey) {
        return this.testOpenAIConnection(openaiKey);
      }
      
      return {
        success: false,
        message: 'No AI service configured. Please add VITE_ANTHROPIC_API_KEY or VITE_OPENAI_API_KEY to your environment variables.'
      };
    } catch (error) {
      return {
        success: false,
        message: `AI service connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async testAnthropicConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.API_ENDPOINTS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Test connection'
            }
          ]
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Anthropic Claude connected successfully!'
        };
      } else {
        return {
          success: false,
          message: `Anthropic Claude connection failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Anthropic Claude connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async testOpenAIConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.API_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'OpenAI connected successfully!'
        };
      } else {
        return {
          success: false,
          message: `OpenAI connection failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `OpenAI connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get available AI models/services
  static getAvailableServices(): Array<{
    name: string;
    description: string;
    costStructure: string;
    freeOption: boolean;
  }> {
    return [
      {
        name: 'Anthropic Claude 3 Haiku',
        description: 'Fast, intelligent analysis with generous free tier',
        costStructure: 'Free tier: $5 credit monthly, then $0.25 per 1M tokens',
        freeOption: true
      },
      {
        name: 'Google Gemini Pro',
        description: 'Fast and efficient for most analyses',
        costStructure: 'Free tier: 15 requests/minute',
        freeOption: true
      },
      {
        name: 'OpenAI GPT-3.5',
        description: 'Reliable and well-tested for analysis tasks',
        costStructure: '$5 free credit, then $0.002 per 1K tokens',
        freeOption: true
      },
      {
        name: 'Hugging Face',
        description: 'Open source models, completely free',
        costStructure: 'Free (may require more technical setup)',
        freeOption: true
      }
    ];
  }
}