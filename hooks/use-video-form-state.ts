'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { VideoMetadata } from '@/lib/utils/metadata-extractor';
import { ParsedUrl } from '@/lib/utils/url-parser';
import { MetadataSuggestion } from '@/lib/types/ai-metadata';

interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

interface UseVideoFormStateOptions {
  parsedUrl: ParsedUrl | null;
  metadata: VideoMetadata | null;
  selectedSuggestion?: MetadataSuggestion; // AI-selected metadata
  onVideoAdded?: () => void;
  onReset?: () => void;
}

interface UseVideoFormStateReturn {
  // Manual mode
  manualMode: boolean;
  setManualMode: (mode: boolean) => void;
  manualTitle: string;
  setManualTitle: (title: string) => void;
  manualThumbnailUrl: string;
  setManualThumbnailUrl: (url: string) => void;

  // Tags
  selectedTags: Tag[];
  availableTags: Tag[];
  tagInput: string;
  setTagInput: (value: string) => void;
  showTagSuggestions: boolean;
  filteredSuggestions: Tag[];
  isLoadingTags: boolean;
  tagError: string | null;
  handleTagInputChange: (value: string) => void;
  handleTagKeyDown: (e: React.KeyboardEvent) => Promise<void>;
  removeTag: (tagId: number) => void;
  selectSuggestedTag: (tag: Tag) => void;
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

export function useVideoFormState({
  parsedUrl,
  metadata,
  selectedSuggestion,
  onVideoAdded,
  onReset,
}: UseVideoFormStateOptions): UseVideoFormStateReturn {
  // Manual mode state
  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualThumbnailUrl, setManualThumbnailUrl] = useState('');

  // Tag state
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const tags = await response.json();
          setAvailableTags(tags);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Smart mode transitions
  const handleSetManualMode = useCallback((mode: boolean) => {
    setManualMode(mode);

    if (mode) {
      // Switching to manual: preserve current inputs
      setManualTitle(prev => prev || (metadata?.title || ''));
      setManualThumbnailUrl(prev => prev || (metadata?.thumbnailUrl || ''));
    } else {
      // Switching to auto: clear manual inputs if they match metadata
      if (manualTitle === metadata?.title) setManualTitle('');
      if (manualThumbnailUrl === metadata?.thumbnailUrl) setManualThumbnailUrl('');
    }

    setValidationErrors({});
    setSubmitError(null);
  }, [metadata]);

  // Tag management functions
  const handleTagInputChange = useCallback((value: string) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
    setTagError(null);
  }, []);

  const handleTagKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      await addTag(tagInput.trim());
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  }, [tagInput]);

  const addTag = useCallback(async (tagName: string) => {
    if (!tagName) return;

    // Check if tag is already selected
    if (selectedTags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setTagError('Tag already added');
      return;
    }

    // Check if tag exists in available tags
    const existingTag = availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    if (existingTag) {
      setSelectedTags(prev => [...prev, existingTag]);
      setTagInput('');
      setShowTagSuggestions(false);
      return;
    }

    // Create new tag
    setIsLoadingTags(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setAvailableTags(prev => [...prev, newTag]);
        setSelectedTags(prev => [...prev, newTag]);
        setTagInput('');
        setShowTagSuggestions(false);
      } else if (response.status === 409) {
        // Tag already exists, fetch it
        const existingTag = availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
        if (existingTag) {
          setSelectedTags(prev => [...prev, existingTag]);
        }
        setTagError('Tag already exists');
      } else {
        setTagError('Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setTagError('Failed to create tag');
    } finally {
      setIsLoadingTags(false);
    }
  }, [selectedTags, availableTags]);

  const removeTag = useCallback((tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const selectSuggestedTag = useCallback((tag: Tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  }, [selectedTags]);

  // Filter suggestions based on input
  const filteredSuggestions = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  ).slice(0, 5);

  // Validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!parsedUrl?.isValid) {
      errors.url = 'Invalid URL';
    }

    if (manualMode) {
      if (!manualTitle.trim()) {
        errors.title = 'Title is required in manual mode';
      }
      if (manualThumbnailUrl && !isValidUrl(manualThumbnailUrl)) {
        errors.thumbnail = 'Thumbnail URL must be valid';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [parsedUrl, manualMode, manualTitle, manualThumbnailUrl]);

  // Submission
  const handleSubmit = useCallback(async () => {
    if (!parsedUrl?.isValid || !validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const videoData = {
        url: parsedUrl.url,
        title: manualMode ? manualTitle : (selectedSuggestion?.title || metadata?.title),
        platform: selectedSuggestion?.platform || parsedUrl.platform,
        thumbnailUrl: manualMode ? manualThumbnailUrl : (selectedSuggestion?.thumbnailUrl || metadata?.thumbnailUrl),
        tagIds: selectedTags.map(tag => tag.id),
      };

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData),
      });

      console.log('📥 API Response:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          setSubmitError(errorData.error || 'Video already exists');
        } else {
          setSubmitError('Failed to add video');
        }
      } else {
        resetFormState(); // Reset internal form state
        onReset?.(); // Reset URL and global state
        onVideoAdded?.();
      }
    } catch (error) {
      console.error('Error adding video:', error);
      setSubmitError('Failed to add video');
    } finally {
      setIsSubmitting(false);
    }
  }, [parsedUrl, metadata, selectedSuggestion, selectedTags, manualMode, manualTitle, manualThumbnailUrl, validateForm, onVideoAdded]);

  // Reset internal form state (manual mode, tags, etc.)
  const resetFormState = useCallback(() => {
    setManualMode(false);
    setManualTitle('');
    setManualThumbnailUrl('');
    setSelectedTags([]);
    setTagInput('');
    setShowTagSuggestions(false);
    setTagError(null);
    setSubmitError(null);
    setValidationErrors({});
  }, []);

  return {
    // Manual mode
    manualMode,
    setManualMode: handleSetManualMode,
    manualTitle,
    setManualTitle,
    manualThumbnailUrl,
    setManualThumbnailUrl,

    // Tags
    selectedTags,
    availableTags,
    tagInput,
    setTagInput,
    showTagSuggestions,
    filteredSuggestions,
    isLoadingTags,
    tagError,
    handleTagInputChange,
    handleTagKeyDown,
    removeTag,
    selectSuggestedTag,
    addTag,

    // Submission
    isSubmitting,
    submitError,
    handleSubmit,

    // Validation
    validationErrors,

    // Reset
    reset: resetFormState,
  };
}

// Utility function for URL validation
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}