'use client';

import { useState } from 'react';
import { extractVideoMetadata, VideoMetadata } from '@/lib/utils/metadata-extractor';
import { VideoPlatform } from '@/lib/utils/url-parser';

interface UseVideoMetadataOptions {
  onSuccess?: (metadata: VideoMetadata) => void;
  onError?: (error: string) => void;
}

interface UseVideoMetadataReturn {
  metadata: VideoMetadata | null;
  isLoading: boolean;
  error: string | null;
  fetchMetadata: (url: string, platform: VideoPlatform) => Promise<void>;
  clearMetadata: () => void;
}

export function useVideoMetadata({
  onSuccess,
  onError
}: UseVideoMetadataOptions = {}): UseVideoMetadataReturn {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async (url: string, platform: VideoPlatform) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await extractVideoMetadata(url, platform);
      setMetadata(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata';
      setError(errorMessage);
      setMetadata(null);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMetadata = () => {
    setMetadata(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    metadata,
    isLoading,
    error,
    fetchMetadata,
    clearMetadata,
  };
}