'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MetadataExtractionResponse, MetadataSuggestion } from '@/lib/types/ai-metadata';

interface UseAIMetadataFetchingOptions {
  url: string;
  platform: string;
  enabled?: boolean;
}

interface UseAIMetadataFetchingReturn {
  suggestions: MetadataSuggestion[];
  fallback: { title?: string; thumbnailUrl?: string } | null;
  isLoading: boolean;
  error: string | null;
  selectedSuggestion?: MetadataSuggestion;
  setSelectedSuggestion: (suggestion: MetadataSuggestion | undefined) => void;
  refetch: () => Promise<void>;
  cancel: () => void;
}

export function useAIMetadataFetching({
  url,
  platform,
  enabled = true
}: UseAIMetadataFetchingOptions): UseAIMetadataFetchingReturn {
  const [suggestions, setSuggestions] = useState<MetadataSuggestion[]>([]);
  const [fallback, setFallback] = useState<{ title?: string; thumbnailUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MetadataSuggestion | undefined>();

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

  const fetchAIMetadata = useCallback(async () => {
    if (!url || !enabledRef.current) {
      setSuggestions([]);
      setFallback(null);
      setError(null);
      setIsLoading(false);
      setSelectedSuggestion(undefined);
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

      const response = await fetch('/api/metadata/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, platform }),
        signal: controller.signal,
      });

      // Check if request was cancelled after fetch
      if (controller.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to extract metadata: ${response.status}`);
      }

      const result: MetadataExtractionResponse = await response.json();

      // Check if request was cancelled after parsing
      if (controller.signal.aborted) {
        return;
      }

      if (result.success) {
        setSuggestions(result.suggestions);
        setFallback(result.fallback ? {
          title: result.fallback.title,
          thumbnailUrl: result.fallback.thumbnailUrl || undefined,
        } : null);
        setError(null);

        // Auto-select the highest confidence suggestion if available
        if (result.suggestions.length > 0) {
          const bestSuggestion = result.suggestions.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          );
          setSelectedSuggestion(bestSuggestion);
        } else {
          setSelectedSuggestion(undefined);
        }
      } else {
        throw new Error(result.error || 'Failed to extract metadata');
      }
    } catch (err) {
      // Don't set error if request was cancelled
      if (controller.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch AI metadata';
      setError(errorMessage);
      setSuggestions([]);
      setFallback(null);
      setSelectedSuggestion(undefined);
      console.error('AI metadata fetch failed:', err);
    } finally {
      // Only clear loading if this is still the current request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [url, platform, cancel]);

  const refetch = useCallback(async () => {
    await fetchAIMetadata();
  }, [fetchAIMetadata]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchAIMetadata();

    // Cleanup on unmount or dependency change
    return () => {
      cancel();
    };
  }, [fetchAIMetadata, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    suggestions,
    fallback,
    isLoading,
    error,
    selectedSuggestion,
    setSelectedSuggestion,
    refetch,
    cancel,
  };
}