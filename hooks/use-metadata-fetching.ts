'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MetadataService } from '@/lib/services/metadata-service';
import { VideoPlatform } from '@/lib/utils/url-parser';
import { VideoMetadata } from '@/lib/utils/metadata-extractor';

interface UseMetadataFetchingOptions {
  url: string;
  platform: VideoPlatform;
  enabled?: boolean;
}

interface UseMetadataFetchingReturn {
  metadata: VideoMetadata | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancel: () => void;
}

export function useMetadataFetching({
  url,
  platform,
  enabled = true
}: UseMetadataFetchingOptions): UseMetadataFetchingReturn {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const enabledRef = useRef(enabled);

  // Update enabled ref when it changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    if (!url || !platform || !enabledRef.current) {
      setMetadata(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Cancel any existing request
    cancel();

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Check if request was cancelled before starting
      if (controller.signal.aborted) {
        return;
      }

      const result = await MetadataService.fetchMetadata(url, platform);

      // Check if request was cancelled after completion
      if (controller.signal.aborted) {
        return;
      }

      setMetadata(result);
      setError(null);
    } catch (err) {
      // Don't set error if request was cancelled
      if (controller.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata';
      setError(errorMessage);
      setMetadata(null);
      console.error('Metadata fetch failed:', err);
    } finally {
      // Only clear loading if this is still the current request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [url, platform, cancel]);

  const refetch = useCallback(async () => {
    await fetchMetadata();
  }, [fetchMetadata]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchMetadata();

    // Cleanup on unmount or dependency change
    return () => {
      cancel();
    };
  }, [fetchMetadata, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    metadata,
    isLoading,
    error,
    refetch,
    cancel,
  };
}