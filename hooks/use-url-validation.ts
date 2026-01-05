'use client';

import { useState, useEffect } from 'react';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';

interface ParsedUrl {
  url: string;
  platform: VideoPlatform;
  videoId?: string;
  isValid: boolean;
}

interface UseUrlValidationOptions {
  debounceMs?: number;
}

interface UseUrlValidationReturn {
  parsedUrl: ParsedUrl | null;
  isValidating: boolean;
  validationError: string | null;
  validateUrl: (url: string) => ParsedUrl | null;
}

export function useUrlValidation({
  debounceMs = 300
}: UseUrlValidationOptions = {}): UseUrlValidationReturn {
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateUrl = (url: string): ParsedUrl | null => {
    if (!url || typeof url !== 'string') {
      return { url, platform: 'youtube' as VideoPlatform, isValid: false };
    }

    try {
      const result = parseVideoUrl(url);
      return result;
    } catch (error) {
      console.error('URL validation error:', error);
      return { url, platform: 'youtube' as VideoPlatform, isValid: false };
    }
  };

  useEffect(() => {
    setValidationError(null);
  }, [parsedUrl]);

  return {
    parsedUrl,
    isValidating,
    validationError,
    validateUrl,
  };
}