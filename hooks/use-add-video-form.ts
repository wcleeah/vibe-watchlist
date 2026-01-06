'use client';

import { useVideoFormState } from './use-video-form-state';
import { useMetadataFetching } from './use-metadata-fetching';
import { useAIMetadataFetching } from './use-ai-metadata-fetching';
import { useUrlValidation } from './use-url-validation';
import { usePreferences } from '@/lib/preferences-context';

interface UseAddVideoFormOptions {
  onVideoAdded?: () => void;
}

interface UseAddVideoFormReturn {
  // URL state
  url: string;
  setUrl: (url: string) => void;
  parsedUrl: { url: string; platform: string; videoId?: string; isValid: boolean } | null;
  isValidUrl: boolean;
  urlError: string | null;

  // AI Metadata state
  aiSuggestions: Array<{ title: string; thumbnailUrl?: string; platform: string; confidence: number; reasoning?: string }>;
  selectedSuggestion: { title: string; thumbnailUrl?: string; platform: string; confidence: number; reasoning?: string } | undefined;
  isLoadingAIMetadata: boolean;
  aiMetadataError: string | null;
  setSelectedSuggestion: (suggestion: { title: string; thumbnailUrl?: string; platform: string; confidence: number; reasoning?: string } | undefined) => void;

  // Legacy metadata state (for backwards compatibility)
  metadata: { title: string; thumbnailUrl: string | null; authorName?: string; authorUrl?: string } | null;
  isLoadingMetadata: boolean;
  metadataError: string | null;
  refetchMetadata: () => Promise<void>;
  cancelMetadataFetch: () => void;

  // Manual mode
  manualMode: boolean;
  setManualMode: (mode: boolean) => void;
  manualTitle: string;
  setManualTitle: (title: string) => void;
  manualThumbnailUrl: string;
  setManualThumbnailUrl: (url: string) => void;

  // Tags
  selectedTags: Array<{ id: number; name: string; color?: string | null }>;
  availableTags: Array<{ id: number; name: string; color?: string | null }>;
  tagInput: string;
  setTagInput: (value: string) => void;
  showTagSuggestions: boolean;
  filteredSuggestions: Array<{ id: number; name: string; color?: string | null }>;
  isLoadingTags: boolean;
  tagError: string | null;
  handleTagInputChange: (value: string) => void;
  handleTagKeyDown: (e: React.KeyboardEvent) => Promise<void>;
  removeTag: (tagId: number) => void;
  selectSuggestedTag: (tag: { id: number; name: string; color?: string | null }) => void;
  addTag: (tagName: string) => Promise<void>;

  // Submission
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: () => Promise<void>;

  // Validation
  validationErrors: Record<string, string>;

  // Reset
  reset: () => void;
}

/**
 * Orchestrator hook that combines URL validation, metadata fetching, and form state
 * Maintains backwards compatibility with the original useVideoForm API
 */
export function useAddVideoForm({
  onVideoAdded
}: UseAddVideoFormOptions = {}): UseAddVideoFormReturn {
  const { preferences } = usePreferences();

  // URL validation hook
  const urlValidation = useUrlValidation();

  // AI Metadata fetching hook
  const aiMetadata = useAIMetadataFetching({
    url: urlValidation.url,
    platform: urlValidation.platform || 'unknown',
    enabled: urlValidation.isValid,
  });

  // Legacy metadata fetching hook (depends on URL validation)
  const metadata = useMetadataFetching({
    url: urlValidation.url,
    platform: urlValidation.platform || 'unknown',
    enabled: urlValidation.isValid && preferences.autoPreview,
  });

  // Enhanced reset function that resets all hooks
  const reset = () => {
    urlValidation.setUrl('');
    metadata.cancel();
    aiMetadata.cancel();
    formState.reset();
  };

  // Form state hook (depends on URL validation and metadata)
  const formState = useVideoFormState({
    parsedUrl: urlValidation.parsedUrl,
    metadata: metadata.metadata,
    selectedSuggestion: aiMetadata.selectedSuggestion,
    onVideoAdded,
    onReset: reset,
  });

  // Return unified interface matching original useVideoForm
  return {
    // URL state
    url: urlValidation.url,
    setUrl: urlValidation.setUrl,
    parsedUrl: urlValidation.parsedUrl,
    isValidUrl: urlValidation.isValid,
    urlError: urlValidation.error,

    // AI Metadata state
    aiSuggestions: aiMetadata.suggestions,
    selectedSuggestion: aiMetadata.selectedSuggestion,
    isLoadingAIMetadata: aiMetadata.isLoading,
    aiMetadataError: aiMetadata.error,
    setSelectedSuggestion: aiMetadata.setSelectedSuggestion,

    // Legacy metadata state
    metadata: metadata.metadata,
    isLoadingMetadata: metadata.isLoading,
    metadataError: metadata.error,
    refetchMetadata: metadata.refetch,
    cancelMetadataFetch: metadata.cancel,

    // Manual mode (from form state)
    manualMode: formState.manualMode,
    setManualMode: formState.setManualMode,
    manualTitle: formState.manualTitle,
    setManualTitle: formState.setManualTitle,
    manualThumbnailUrl: formState.manualThumbnailUrl,
    setManualThumbnailUrl: formState.setManualThumbnailUrl,

    // Tags (from form state)
    selectedTags: formState.selectedTags,
    availableTags: formState.availableTags,
    tagInput: formState.tagInput,
    setTagInput: formState.setTagInput,
    showTagSuggestions: formState.showTagSuggestions,
    filteredSuggestions: formState.filteredSuggestions,
    isLoadingTags: formState.isLoadingTags,
    tagError: formState.tagError,
    handleTagInputChange: formState.handleTagInputChange,
    handleTagKeyDown: formState.handleTagKeyDown,
    removeTag: formState.removeTag,
    selectSuggestedTag: formState.selectSuggestedTag,
    addTag: formState.addTag,

    // Submission (from form state)
    isSubmitting: formState.isSubmitting,
    submitError: formState.submitError,
    handleSubmit: formState.handleSubmit,

    // Validation (from form state)
    validationErrors: formState.validationErrors,

    // Reset (enhanced to reset all hooks)
    reset,
  };
}
