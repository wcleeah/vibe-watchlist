'use client';

import { useState, useCallback } from 'react';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';
import { PlatformSuggestion } from '@/lib/services/ai-service';

interface ParsedUrl {
  url: string;
  platform: VideoPlatform;
  videoId?: string;
  isValid: boolean;
}

interface UseUrlValidationReturn {
  url: string;
  setUrl: (url: string) => void;
  parsedUrl: ParsedUrl | null;
  isValid: boolean;
  platform: VideoPlatform | null;
  error: string | null;
  // AI Platform Discovery
  platformSuggestions: PlatformSuggestion[];
  isDetectingPlatform: boolean;
  detectPlatformForUrl: () => Promise<void>;
  clearPlatformSuggestions: () => void;
}

export function useUrlValidation(): UseUrlValidationReturn {
  const [url, setUrl] = useState('');
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);
  const [platformSuggestions, setPlatformSuggestions] = useState<PlatformSuggestion[]>([]);
  const [isDetectingPlatform, setIsDetectingPlatform] = useState(false);

  const handleUrlChange = useCallback(async (newUrl: string) => {
    setUrl(newUrl);

    if (!newUrl.trim()) {
      setParsedUrl(null);
      setPlatformSuggestions([]);
      return;
    }

    const parsed = await parseVideoUrl(newUrl.trim());
    setParsedUrl(parsed);

    // Clear platform suggestions when URL changes
    setPlatformSuggestions([]);
  }, []);

  const detectPlatformForUrl = useCallback(async () => {
    if (!url.trim() || isDetectingPlatform) return;

    setIsDetectingPlatform(true);
    try {
      console.log('🔍 Detecting platform for URL:', url);

      // Call the API instead of using aiService directly
      const response = await fetch('/api/platforms/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const suggestion: PlatformSuggestion = data.suggestion;

      // Show suggestions with decent confidence
      // Server-side API handles duplicate checking
      if (suggestion.confidence > 0.3) {
        setPlatformSuggestions([suggestion]);
        console.log('✅ Platform suggestion found:', suggestion);
      } else {
        console.log('⚠️ Low confidence platform suggestion:', suggestion);
      }
    } catch (error) {
      console.error('❌ Platform detection failed:', error);
    } finally {
      setIsDetectingPlatform(false);
    }
  }, [url, isDetectingPlatform]);

  const clearPlatformSuggestions = useCallback(() => {
    setPlatformSuggestions([]);
  }, []);

  const isValid = parsedUrl?.isValid ?? false;
  const platform = parsedUrl?.platform ?? null;



  const error = parsedUrl && !parsedUrl.isValid && url.trim()
    ? "Please enter a valid video URL"
    : null;

  return {
    url,
    setUrl: handleUrlChange,
    parsedUrl,
    isValid,
    platform,
    error,
    platformSuggestions,
    isDetectingPlatform,
    detectPlatformForUrl,
    clearPlatformSuggestions,
  };
}
