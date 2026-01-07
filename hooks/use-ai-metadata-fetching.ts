'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MetadataExtractionResponse, MetadataSuggestion } from '@/lib/types/ai-metadata';

interface UseAIMetadataFetchingOptions {
  url: string;
  platform: string | undefined;
  enabled?: boolean;
}

export interface UseAIMetadataFetchingReturn {
  suggestions: MetadataSuggestion[];
  fallback: { title?: string; thumbnailUrl?: string } | null;
  isLoading: boolean;
  error: string | null;
  selectedSuggestion?: MetadataSuggestion;
  setSelectedSuggestion: (suggestion: MetadataSuggestion | undefined) => void;
  refetch: () => Promise<void>;
}

export function useAIMetadataFetching({
  url,
  platform = undefined,
  enabled = true
}: UseAIMetadataFetchingOptions): UseAIMetadataFetchingReturn {
  const [suggestions, setSuggestions] = useState<MetadataSuggestion[]>([]);
  const [fallback, setFallback] = useState<{ title?: string; thumbnailUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MetadataSuggestion | undefined>();

  const enabledRef = useRef(enabled);

  // Update enabled ref when it changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const fetchAIMetadata = useCallback(async () => {
    if (!url || !enabledRef.current || !platform) {
      setSuggestions([]);
      setFallback(null);
      setError(null);
      setIsLoading(false);
      setSelectedSuggestion(undefined);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {

      const response = await fetch('/api/metadata/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, platform }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract metadata: ${response.status}`);
      }

      const result: MetadataExtractionResponse = await response.json();

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

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch AI metadata';
      setError(errorMessage);
      setSuggestions([]);
      setFallback(null);
      setSelectedSuggestion(undefined);
      console.error('AI metadata fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [url, platform]);

  const refetch = useCallback(async () => {
    await fetchAIMetadata();
  }, [fetchAIMetadata]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchAIMetadata();

  }, [fetchAIMetadata]);
  return {
    suggestions,
    fallback,
    isLoading,
    error,
    selectedSuggestion,
    setSelectedSuggestion,
    refetch
  };
}
