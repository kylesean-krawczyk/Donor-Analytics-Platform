import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, AlertCircle, ExternalLink, Brain } from 'lucide-react';
import { AIService } from '../services/aiService';

export const AIServiceSetup: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('openai');

  const availableServices = AIService.getAvailableServices();

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const status = await AIService.testConnection();
      setConnectionStatus(status);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Failed to test AI service connection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Service Configuration</h3>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-gray-800">Connection Status</h4>
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        
        {connectionStatus && (
          <div className={`p-3 rounded-lg border ${
            connectionStatus.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {connectionStatus.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${
                connectionStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionStatus.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Available Services */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">Available AI Services</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableServices.map((service, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{service.name}</h5>
                {service.freeOption && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Free Option
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
              <p className="text-xs text-gray-500">{service.costStructure}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Setup Instructions</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>For Anthropic Claude (Recommended):</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Create an account at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a></li>
                <li>Get $5 free credit monthly for new accounts</li>
                <li>Generate an API key in your dashboard</li>
                <li>Add <code className="bg-blue-100 px-1 rounded">VITE_ANTHROPIC_API_KEY=your_key_here</code> to your .env file</li>
                <li>Restart your development server</li>
              </ol>
              
              <p className="mt-3"><strong>Cost Estimate:</strong> Free tier covers most nonprofit usage, then $5-20/month</p>
              
              <div className="mt-3 p-2 bg-blue-100 rounded">
                <p className="text-xs"><strong>Free Alternatives:</strong></p>
                <ul className="text-xs list-disc list-inside ml-2">
                  <li>Anthropic Claude: $5 monthly free credit</li>
                  <li>Google Gemini: Generous free tier</li>
                  <li>OpenAI: $5 one-time free credit</li>
                  <li>Hugging Face: Completely free models</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">AI Features Available</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <h5 className="font-medium text-purple-800">Custom Analysis</h5>
            <p className="text-sm text-purple-600 mt-1">
              Ask any question about your donor data and get intelligent insights
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <h5 className="font-medium text-green-800">External Data Integration</h5>
            <p className="text-sm text-green-600 mt-1">
              Correlate donations with economic, demographic, and market data
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800">Smart Recommendations</h5>
            <p className="text-sm text-blue-600 mt-1">
              Get personalized fundraising strategies based on your data patterns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};