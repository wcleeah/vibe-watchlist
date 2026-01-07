"use client";

import { useVideoFormState } from "./use-video-form-state";
// Removed: import { useMetadataFetching } from './use-metadata-fetching';
import { useAIMetadataFetching, UseAIMetadataFetchingReturn } from "./use-ai-metadata-fetching";
import { useUrlValidation } from "./use-url-validation";
import { PlatformSuggestion } from "@/lib/services/ai-service";
import { toast } from "sonner";

interface UseAddVideoFormOptions {
    onVideoAdded?: () => void;
}

interface UseAddVideoFormReturn {
    // URL state
    url: string;
    setUrl: (url: string) => void;
    parsedUrl: {
        url: string;
        platform: string;
        videoId?: string;
        isValid: boolean;
    } | null;
    isValidUrl: boolean;
    urlError: string | null;

    // Platform Discovery
    platformSuggestions: PlatformSuggestion[];
    isDetectingPlatform: boolean;
    detectPlatformForUrl: () => Promise<void>;
    acceptPlatformSuggestion: (suggestion: PlatformSuggestion) => Promise<void>;
    rejectPlatformSuggestions: () => void;
    createCustomPlatform: () => void;

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
    filteredSuggestions: Array<{
        id: number;
        name: string;
        color?: string | null;
    }>;
    isLoadingTags: boolean;
    tagError: string | null;
    handleTagInputChange: (value: string) => void;
    handleTagKeyDown: (e: React.KeyboardEvent) => Promise<void>;
    removeTag: (tagId: number) => void;
    selectSuggestedTag: (tag: {
        id: number;
        name: string;
        color?: string | null;
    }) => void;
    addTag: (tagName: string) => Promise<void>;

    // Submission
    isSubmitting: boolean;
    submitError: string | null;
    handleSubmit: () => Promise<void>;

    // Validation
    validationErrors: Record<string, string>;

    // Reset
    reset: () => void;

    aiMetadata: UseAIMetadataFetchingReturn,
}

/**
 * Orchestrator hook that combines URL validation, metadata fetching, and form state
 * Maintains backwards compatibility with the original useVideoForm API
 */
export function useAddVideoForm({
    onVideoAdded,
}: UseAddVideoFormOptions = {}): UseAddVideoFormReturn {
    // URL validation hook
    const urlValidation = useUrlValidation();

    // AI Metadata fetching hook
    const aiMetadata = useAIMetadataFetching({
        url: urlValidation.url,
        platform: urlValidation.platform || "unknown",
        enabled: urlValidation.isValid,
    });

    // Removed: Legacy metadata fetching hook

    // Enhanced reset function that resets all hooks
    const reset = () => {
        urlValidation.setUrl("");
    };

    // Form state hook (depends on URL validation and AI metadata)
    const formState = useVideoFormState({
        parsedUrl: urlValidation.parsedUrl,
        selectedSuggestion: aiMetadata.selectedSuggestion,
        onVideoAdded,
        onReset: reset,
    });

    // Platform suggestion handlers
    const acceptPlatformSuggestion = async (suggestion: PlatformSuggestion) => {
        try {
            console.log('🔧 Creating platform from suggestion:', suggestion);

            const response = await fetch('/api/platforms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    platformId: suggestion.platform,
                    name: suggestion.platform,
                    displayName: suggestion.platform.charAt(0).toUpperCase() + suggestion.platform.slice(1),
                    patterns: suggestion.patterns,
                    color: suggestion.color,
                    icon: suggestion.icon,
                    confidenceScore: suggestion.confidence,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Platform created successfully:', result.platform);
                toast.success(`Platform "${suggestion.platform}" added successfully!`);
                urlValidation.clearPlatformSuggestions();

                // Clear platform cache to refresh UI
                // Note: This will be handled by PlatformService cache invalidation
            } else {
                const error = await response.json();
                console.error('❌ Failed to create platform:', error);
                toast.error(`Failed to add platform: ${error.error}`);
            }
        } catch (error) {
            console.error('❌ Platform creation error:', error);
            toast.error('Failed to add platform');
        }
    };

    const rejectPlatformSuggestions = () => {
        urlValidation.clearPlatformSuggestions();
    };

    const createCustomPlatform = () => {
        // TODO: Open custom platform creation modal
        console.log('Creating custom platform');
        urlValidation.clearPlatformSuggestions();
    };

    // Return unified interface matching original useVideoForm
    return {
        // URL state
        url: urlValidation.url,
        setUrl: urlValidation.setUrl,
        parsedUrl: urlValidation.parsedUrl,
        isValidUrl: urlValidation.isValid,
        urlError: urlValidation.error,

        // Platform Discovery
        platformSuggestions: urlValidation.platformSuggestions,
        isDetectingPlatform: urlValidation.isDetectingPlatform,
        detectPlatformForUrl: urlValidation.detectPlatformForUrl,
        acceptPlatformSuggestion,
        rejectPlatformSuggestions,
        createCustomPlatform,

        // AI Metadata state
        aiMetadata,

        // Removed: Legacy metadata state (now using AI metadata only)

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
