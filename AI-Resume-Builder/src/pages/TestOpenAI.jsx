import { useState } from 'react';
import axios from 'axios';

export default function TestOpenAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use the same base URL configuration as GlobalApi
      const rawBase = (import.meta.env.VITE_API_BASE_URL || 'https://resume-builder-backend-gold.vercel.app').trim();
      const baseUrl = rawBase.replace(/\/+$/, '');
      
      console.log('Testing OpenAI API at:', `${baseUrl}/test/openai`);
      
      const response = await axios.get(`${baseUrl}/test/openai`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || data.message || 'API test failed');
      }
    } catch (err) {
      console.error('Test API Error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to connect to API';
      const statusCode = err.response?.status;
      setError(statusCode 
        ? `HTTP ${statusCode}: ${errorMessage}` 
        : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            OpenAI API Test Page
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Click the button below to test if the OpenAI Responses API is working correctly.
            </p>
            
            <button
              onClick={testAPI}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : 'Test OpenAI API'}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                ❌ Test Failed
              </h3>
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-red-500 mt-2">
                Check your Vercel environment variables:
                <br />
                - <code className="bg-red-100 px-1 rounded">OPENROUTER_API_KEY</code> (Backend)
                <br />
                - <code className="bg-red-100 px-1 rounded">VITE_OPENROUTER_API_KEY</code> (Frontend)
              </p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ✅ Test Successful!
              </h3>
              <div className="space-y-2">
                <p className="text-green-700">
                  <strong>Message:</strong> {result.message}
                </p>
                <p className="text-green-700">
                  <strong>Response:</strong> {result.response}
                </p>
                <p className="text-sm text-green-600">
                  <strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📋 API Endpoint Information
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                <strong>Backend URL:</strong>{' '}
                <code className="bg-blue-100 px-1 rounded">
                  {(import.meta.env.VITE_API_BASE_URL || 'https://resume-builder-backend-gold.vercel.app').replace(/\/+$/, '')}
                </code>
              </p>
              <p>
                <strong>Test Endpoint:</strong>{' '}
                <code className="bg-blue-100 px-1 rounded">/test/openai</code>
              </p>
              <p>
                <strong>Health Check:</strong>{' '}
                <code className="bg-blue-100 px-1 rounded">/test/health</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

