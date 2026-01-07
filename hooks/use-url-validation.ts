'use client';

import { useState, useCallback } from 'react';
import { parseVideoUrlClient, VideoPlatform } from '@/lib/utils/url-parser';

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
}

export function useUrlValidation(): UseUrlValidationReturn {
  const [url, setUrl] = useState('');
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);

  const handleUrlChange = useCallback(async (newUrl: string) => {
    setUrl(newUrl);

    if (!newUrl.trim()) {
      setParsedUrl(null);
      return;
    }

    const parsed = await parseVideoUrlClient(newUrl.trim());
    setParsedUrl(parsed);
  }, []);

  return {
    url,
    setUrl: handleUrlChange,
    parsedUrl,
  };
}
