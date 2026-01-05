'use client';

import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';

interface ParsedUrl {
  url: string;
  platform: VideoPlatform;
  videoId?: string;
  isValid: boolean;
}

interface UseUrlValidationReturn {
  validateUrl: (url: string) => ParsedUrl | null;
}

export function useUrlValidation(): UseUrlValidationReturn {
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

  return {
    validateUrl,
  };
}