import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface AnthropicRequest {
  query: string;
  donorData: any[];
  context?: {
    timeframe?: string;
    focusArea?: string;
    comparisonData?: any;
  };
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Get API key from environment variables
    const anthropicApiKey = process.env.VITE_ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Anthropic API key not configured',
          content: 'The AI service is not properly configured. Please contact the administrator.',
          insights: [],
          recommendations: [],
          confidence: 0
        }),
      };
    }

    // Parse request body
    const requestBody: AnthropicRequest = JSON.parse(event.body || '{}');
    
    if (!requestBody.query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Query is required' }),
      };
    }

    // Prepare donor data summary for AI
    const dataSummary = prepareDonorDataSummary(requestBody.donorData || []);
    
    // Construct AI prompt
    const prompt = constructAnalysisPrompt(requestBody.query, dataSummary);

    // Make request to Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', anthropicResponse.status, errorText);
      
      return {
        statusCode: anthropicResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: `Anthropic API error: ${anthropicResponse.status}`,
          content: 'I apologize, but I encountered an error while processing your request. Please try again later.',
          insights: [],
          recommendations: [],
          confidence: 0
        }),
      };
    }

    const data = await anthropicResponse.json();
    const aiContent = data.content[0].text;
    
    // Try to parse JSON response from AI
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch {
      // Fallback if AI doesn't return valid JSON
      parsedResponse = {
        content: aiContent,
        insights: [],
        recommendations: [],
        confidence: 0.8
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedResponse),
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        content: 'I apologize, but I encountered an unexpected error. Please try again later.',
        insights: [],
        recommendations: [],
        confidence: 0
      }),
    };
  }
};

function prepareDonorDataSummary(donorData: any[]): any {
  if (!donorData || donorData.length === 0) {
    return {
      summary: {
        totalDonors: 0,
        totalAmount: 0,
        totalDonations: 0,
        averageDonation: 0,
        averageDonorValue: 0
      },
      segmentation: {
        frequent: 0,
        regular: 0,
        occasional: 0,
        oneTime: 0
      },
      monthlyTrends: [],
      topDonors: []
    };
  }

  const totalDonors = donorData.length;
  const totalAmount = donorData.reduce((sum, donor) => sum + (donor.totalAmount || 0), 0);
  const totalDonations = donorData.reduce((sum, donor) => sum + (donor.donationCount || 0), 0);
  
  // Calculate monthly trends
  const monthlyData = new Map<string, { amount: number; count: number }>();
  donorData.forEach(donor => {
    if (donor.donations && Array.isArray(donor.donations)) {
      donor.donations.forEach((donation: any) => {
        const date = new Date(donation.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { amount: 0, count: 0 });
        }
        const data = monthlyData.get(monthKey)!;
        data.amount += donation.amount || 0;
        data.count += 1;
      });
    }
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
      averageDonation: totalDonations > 0 ? totalAmount / totalDonations : 0,
      averageDonorValue: totalDonors > 0 ? totalAmount / totalDonors : 0
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
      average: data.count > 0 ? data.amount / data.count : 0
    })).sort((a, b) => a.month.localeCompare(b.month)),
    topDonors: donorData
      .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
      .slice(0, 10)
      .map(d => ({
        totalAmount: d.totalAmount || 0,
        donationCount: d.donationCount || 0,
        frequency: d.donationFrequency || 'unknown'
      }))
  };
}

function constructAnalysisPrompt(query: string, dataSummary: any): string {
  return `
You are an expert nonprofit fundraising analyst with access to donor data. 

DONOR DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

USER QUERY: "${query}"

Please provide a comprehensive analysis that includes:
1. Direct insights from the donor data
2. Actionable recommendations for fundraising strategy
3. Statistical observations and patterns
4. Confidence level in your analysis

Format your response as JSON with the following structure:
{
  "content": "Main analysis narrative",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "confidence": 0.85
}
`;
}

export { handler };