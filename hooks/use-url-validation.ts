'use client';

import { useState, useCallback } from 'react';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';

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
}

export function useUrlValidation(): UseUrlValidationReturn {
  const [url, setUrl] = useState('');
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);

    if (!newUrl.trim()) {
      setParsedUrl(null);
      return;
    }

    const parsed = parseVideoUrl(newUrl.trim());
    setParsedUrl(parsed);
  }, []);

  const isValid = parsedUrl?.isValid ?? false;
  const platform = parsedUrl?.platform ?? null;
  const error = parsedUrl && !parsedUrl.isValid && url.trim()
    ? "Please enter a valid YouTube, Netflix, Nebula, or Twitch URL"
    : null;

  return {
    url,
    setUrl: handleUrlChange,
    parsedUrl,
    isValid,
    platform,
    error,
  };
}