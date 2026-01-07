'use client';

import { useState, useCallback } from 'react';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';
import { aiService, PlatformSuggestion } from '@/lib/services/ai-service';
import { PlatformService } from '@/lib/services/platform-service';

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

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);

    if (!newUrl.trim()) {
      setParsedUrl(null);
      setPlatformSuggestions([]);
      return;
    }

    const parsed = parseVideoUrl(newUrl.trim());
    setParsedUrl(parsed);

    // Clear platform suggestions when URL changes
    setPlatformSuggestions([]);
  }, []);

  const detectPlatformForUrl = useCallback(async () => {
    if (!url.trim() || isDetectingPlatform) return;

    setIsDetectingPlatform(true);
    try {
      console.log('🔍 Detecting platform for URL:', url);
      const suggestion = await aiService.detectPlatform(url);

      // Get existing platforms to check for duplicates
      const existingPlatforms = await PlatformService.getPlatforms();
      const platformExists = existingPlatforms.some(p => p.platformId === suggestion.platform);

      if (!platformExists && suggestion.confidence > 0.3) { // Only show suggestions with decent confidence
        setPlatformSuggestions([suggestion]);
        console.log('✅ Platform suggestion found:', suggestion);
      } else if (platformExists) {
        console.log('ℹ️ Platform already exists:', suggestion.platform);
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

  // Get dynamic platform names for error message
  const getDynamicErrorMessage = useCallback(async () => {
    try {
      const platforms = await PlatformService.getPlatforms();
      const platformNames = platforms.map(p => p.displayName).join(', ');
      return `Please enter a valid ${platformNames} URL`;
    } catch {
      return "Please enter a valid video URL";
    }
  }, []);

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
