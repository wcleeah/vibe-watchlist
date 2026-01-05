'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';
import { extractVideoMetadata, VideoMetadata } from '@/lib/utils/metadata-extractor';
import { usePreferences } from '@/lib/preferences-context';

interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

interface ParsedUrl {
  url: string;
  platform: VideoPlatform;
  videoId?: string;
  isValid: boolean;
}

interface UseVideoFormOptions {
  onVideoAdded?: () => void;
}

interface UseVideoFormReturn {
  // Form state
  url: string;
  setUrl: (url: string) => void;
  isAdding: boolean;

  // URL validation state
  parsedUrl: ParsedUrl | null;

   // Metadata state
   metadata: VideoMetadata | null;
   isLoadingMetadata: boolean;
   previewError: string | null;

   // Manual metadata state
   manualMode: boolean;
   setManualMode: (mode: boolean) => void;
   manualTitle: string;
   setManualTitle: (title: string) => void;
   manualThumbnailUrl: string;
   setManualThumbnailUrl: (url: string) => void;

  // Tag state
  selectedTags: Tag[];
  availableTags: Tag[];
  tagInput: string;
  setTagInput: (value: string) => void;
  showTagSuggestions: boolean;
  filteredSuggestions: Tag[];
  isLoadingTags: boolean;
  tagError: string | null;

  // Actions
  handleAddVideo: () => Promise<void>;
  handleTagInputChange: (value: string) => void;
  handleTagKeyDown: (e: React.KeyboardEvent) => Promise<void>;
  removeTag: (tagId: number) => void;
  selectSuggestedTag: (tag: Tag) => void;
  addTag: (tagName: string) => Promise<void>;
}

export function useVideoForm({ onVideoAdded }: UseVideoFormOptions = {}): UseVideoFormReturn {
  const { preferences } = usePreferences();

  // Form state
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // URL validation state
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);

   // Metadata state
   const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
   const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
   const [previewError, setPreviewError] = useState<string | null>(null);

   // Manual metadata state
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

  // Fetch available tags on mount
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

  // Auto-detect URL and fetch metadata on URL change
  useEffect(() => {
    // Synchronous URL validation and loading state
    if (!url.trim()) {
      setParsedUrl(null);
      setMetadata(null);
      setIsLoadingMetadata(false);
      setPreviewError(null);
      return;
    }

    const parsed = parseVideoUrl(url);
    setParsedUrl(parsed);

    // Accept any valid URL
    if (!parsed.isValid) {
      setIsLoadingMetadata(false);
      setMetadata(null);
      setPreviewError(null);
      return;
    }

    // Valid URL - set loading synchronously
    setIsLoadingMetadata(true);

    const timeoutId = setTimeout(async () => {
      if (preferences.autoPreview) {
        setPreviewError(null);
        try {
          const meta = await extractVideoMetadata(url, parsed.platform);
          setMetadata(meta);
        } catch (error) {
          console.error('Failed to fetch metadata:', error);
          setPreviewError('Failed to load preview');
          setMetadata(null);
        } finally {
          setIsLoadingMetadata(false);
        }
      } else {
        setIsLoadingMetadata(false);
        setMetadata(null);
        setPreviewError(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [url, preferences.autoPreview]);

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
  ).slice(0, 5); // Limit to 5 suggestions

  const handleAddVideo = useCallback(async () => {
    if (!url.trim() || !parsedUrl?.isValid) return;

    setIsAdding(true);
    try {
      const videoData = {
        url: url.trim(),
        title: manualMode ? manualTitle : metadata?.title,
        platform: parsedUrl.platform,
        thumbnailUrl: manualMode ? manualThumbnailUrl : metadata?.thumbnailUrl,
        tagIds: selectedTags.map(tag => tag.id),
      };

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          setPreviewError(errorData.error || 'Video already exists');
        } else {
          setPreviewError('Failed to add video');
        }
      } else {
        // Reset form on success
        setUrl('');
        setParsedUrl(null);
        setMetadata(null);
        setSelectedTags([]);
        setTagInput('');
        setPreviewError(null);
        setManualMode(false);
        setManualTitle('');
        setManualThumbnailUrl('');
        onVideoAdded?.();
      }
    } catch (error) {
      console.error('Error adding video:', error);
      setPreviewError('Failed to add video');
    } finally {
      setIsAdding(false);
    }
  }, [url, parsedUrl, metadata, selectedTags, onVideoAdded]);

  return {
    // Form state
    url,
    setUrl,
    isAdding,

    // URL validation state
    parsedUrl,

    // Metadata state
    metadata,
    isLoadingMetadata,
    previewError,

    // Manual metadata state
    manualMode,
    setManualMode,
    manualTitle,
    setManualTitle,
    manualThumbnailUrl,
    setManualThumbnailUrl,

    // Tag state
    selectedTags,
    availableTags,
    tagInput,
    setTagInput,
    showTagSuggestions,
    filteredSuggestions,
    isLoadingTags,
    tagError,

    // Actions
    handleAddVideo,
    handleTagInputChange,
    handleTagKeyDown,
    removeTag,
    selectSuggestedTag,
    addTag,
  };
}