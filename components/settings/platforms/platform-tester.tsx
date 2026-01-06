'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TestResult {
  platformId: string;
  displayName: string;
  matched: boolean;
  confidence: number;
  extractor: string;
}

export function PlatformTester() {
  const [testUrl, setTestUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState('');

  const handleTest = async () => {
    if (!testUrl.trim()) return;

    try {
      setTesting(true);
      setError('');
      setResults([]);

      const response = await fetch('/api/platforms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Test failed');
      }
    } catch (err) {
      console.error('Test error:', err);
      setError('Failed to test URL');
    } finally {
      setTesting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTest();
    }
  };

  const getResultIcon = (result: TestResult) => {
    if (result.matched) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Platform Pattern Tester
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Test URLs against platform patterns to see which platforms match and their confidence scores.
      </p>

      {/* Test Input */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <Label htmlFor="testUrl" className="text-sm font-medium sr-only">
            Test URL
          </Label>
          <Input
            id="testUrl"
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            className="font-mono text-sm"
          />
        </div>
        <Button onClick={handleTest} disabled={testing || !testUrl.trim()}>
          <Search className="w-4 h-4 mr-2" />
          {testing ? 'Testing...' : 'Test'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Test Results ({results.filter(r => r.matched).length} matches)
          </h4>

          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.platformId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.matched
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getResultIcon(result)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.displayName}
                      </span>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                        {result.platformId}
                      </code>
                    </div>
                    {result.matched && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                          {Math.round(result.confidence * 100)}% confidence
                        </span>
                        <span>Extractor: {result.extractor}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`text-sm px-2 py-1 rounded ${
                  result.matched
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {result.matched ? 'Matched' : 'No Match'}
                </div>
              </div>
            ))}
          </div>

          {results.filter(r => r.matched).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No platforms matched this URL</p>
              <p className="text-sm mt-1">Try adding a new platform with appropriate patterns</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          How It Works
        </h5>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Enter a URL to test against all configured platform patterns</li>
          <li>• Green results indicate successful matches with confidence scores</li>
          <li>• Patterns are tested in order of platform configuration</li>
          <li>• Use this to debug platform detection or validate new patterns</li>
        </ul>
      </div>
    </div>
  );
}