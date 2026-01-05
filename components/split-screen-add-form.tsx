'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, Youtube, Tv, Gamepad2, FileText, ExternalLink, Tag as TagIcon } from 'lucide-react';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';
import { extractVideoMetadata, VideoMetadata } from '@/lib/utils/metadata-extractor';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';
import { TagList } from '@/components/ui/tag';

const platformIcons = {
  youtube: Youtube,
  netflix: Tv,
  nebula: Tv,
  twitch: Gamepad2,
};

const platformColors = {
  youtube: 'text-red-500',
  netflix: 'text-red-600',
  nebula: 'text-purple-500',
  twitch: 'text-purple-600',
};

const platformBackgrounds = {
  youtube: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  netflix: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  nebula: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  twitch: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
};

const platformAccentColors = {
  youtube: 'text-red-600 dark:text-red-400',
  netflix: 'text-red-600 dark:text-red-400',
  nebula: 'text-purple-600 dark:text-purple-400',
  twitch: 'text-purple-600 dark:text-purple-400',
};

interface SplitScreenAddFormProps {
  onVideoAdded?: () => void;
}

export function SplitScreenAddForm({ onVideoAdded }: SplitScreenAddFormProps) {
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Auto-preview state
  const [parsedUrl, setParsedUrl] = useState<{ url: string; platform: VideoPlatform; videoId?: string; isValid: boolean } | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Tag functionality state
  const [selectedTags, setSelectedTags] = useState<Array<{ id: number; name: string; color?: string | null }>>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: number; name: string; color?: string | null }>>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  // Fetch available tags on component mount
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
    const timeoutId = setTimeout(async () => {
      if (!url.trim()) {
        setParsedUrl(null);
        setMetadata(null);
        setPreviewError(null);
        return;
      }

      const parsed = parseVideoUrl(url);
      setParsedUrl(parsed);

      if (parsed.isValid) {
        setIsLoadingMetadata(true);
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
        setMetadata(null);
        setPreviewError(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [url]);

  // Tag management functions
  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
    setTagError(null);
  };

  const handleTagKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      await addTag(tagInput.trim());
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  const addTag = async (tagName: string) => {
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
  };

  const removeTag = (tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const selectSuggestedTag = (tag: { id: number; name: string; color?: string | null }) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // Filter suggestions based on input
  const filteredSuggestions = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  ).slice(0, 5); // Limit to 5 suggestions

  const handleAddVideo = async () => {
    if (!url.trim() || !parsedUrl?.isValid) return;

    setIsAdding(true);
    try {
      const videoData = {
        url: url.trim(),
        title: metadata?.title,
        platform: parsedUrl.platform,
        thumbnailUrl: metadata?.thumbnailUrl,
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
        setUrl('');
        setParsedUrl(null);
        setMetadata(null);
        setSelectedTags([]);
        setTagInput('');
        setPreviewError(null);
        onVideoAdded?.();
      }
    } catch (error) {
      console.error('Error adding video:', error);
      setPreviewError('Failed to add video');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)]">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Add New Video</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Paste a video URL from YouTube, Netflix, Nebula, or Twitch
        </p>
      </div>

      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Skip to main content
      </a>

      {/* Split-screen layout */}
      <div id="main-content" className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 h-full" role="main" aria-label="Add video form">
        {/* Left side: Form inputs (2/5 width on desktop) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-2 lg:order-1">
          <div className="space-y-4">
            <div className="space-y-4">
              {/* URL Input */}
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`w-full h-12 lg:h-12 text-base text-base ${
                    url.trim() && parsedUrl
                      ? parsedUrl.isValid
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-orange-500 focus:border-orange-500'
                      : ''
                  }`}
                  aria-label="Video URL input"
                  aria-describedby={url.trim() && parsedUrl && !parsedUrl.isValid ? "url-validation-message" : undefined}
                  aria-invalid={url.trim() && parsedUrl ? !parsedUrl.isValid : undefined}
                />
                {url.trim() && parsedUrl && !parsedUrl.isValid && (
                  <div
                    id="url-validation-message"
                    className="animate-in fade-in-0 slide-in-from-top-1 duration-300 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800"
                    role="alert"
                    aria-live="polite"
                  >
                    Please enter a valid YouTube, Netflix, Nebula, or Twitch URL
                  </div>
                )}
              </div>

              {/* Tag Input */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Add tags (press Enter or comma to add)..."
                      value={tagInput}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="w-full h-12 lg:h-12 text-base pr-10"
                      disabled={isLoadingTags}
                      aria-label="Tag input"
                      aria-describedby={tagError ? "tag-error-message" : selectedTags.length > 0 ? "selected-tags" : undefined}
                      aria-expanded={showTagSuggestions}
                      aria-haspopup="listbox"
                      role="combobox"
                      aria-autocomplete="list"
                    />
                    {isLoadingTags && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  {tagInput && showTagSuggestions && filteredSuggestions.length > 0 && (
                    <div
                      className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
                      role="listbox"
                      aria-label="Tag suggestions"
                    >
                      {filteredSuggestions.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => selectSuggestedTag(tag)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                          role="option"
                          aria-selected={false}
                        >
                          <TagIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          <span>{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {tagError && (
                  <div
                    id="tag-error-message"
                    className="animate-in fade-in-0 slide-in-from-top-1 duration-300 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800"
                    role="alert"
                    aria-live="polite"
                  >
                    {tagError}
                  </div>
                )}
                {selectedTags.length > 0 && (
                  <div
                    id="selected-tags"
                    className="animate-in fade-in-0 slide-in-from-left-2 duration-300"
                    aria-label={`Selected tags: ${selectedTags.map(tag => tag.name).join(', ')}`}
                  >
                    <TagList
                      tags={selectedTags}
                      onRemove={removeTag}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleAddVideo}
              disabled={!url.trim() || !parsedUrl?.isValid || isAdding}
              className="w-full h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              aria-describedby={previewError ? "preview-error" : undefined}
            >
              {isAdding ? (
                <div className="animate-in fade-in-0 duration-200">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </div>
              ) : (
                <div className="animate-in fade-in-0 duration-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Right side: Live preview (3/5 width on desktop) */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className={`rounded-lg border min-h-[300px] lg:min-h-[400px] ${
            parsedUrl?.isValid ? platformBackgrounds[parsedUrl.platform] : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          }`}>
            {!url.trim() ? (
              // Empty state
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 min-h-[400px] flex items-center justify-center">
                <div className="space-y-4">
                  <FileText className="w-12 h-12 mx-auto opacity-50" />
                  <div className="text-lg font-medium">Live Preview</div>
                  <div className="text-sm">Enter a video URL to see the preview</div>
                </div>
              </div>
            ) : !parsedUrl?.isValid ? (
              // Invalid URL state
              <div className="p-8 text-center text-orange-600 dark:text-orange-400 min-h-[400px] flex items-center justify-center">
                <div className="space-y-4">
                  <ExternalLink className="w-12 h-12 mx-auto opacity-50" />
                  <div className="text-lg font-medium">Invalid URL</div>
                  <div className="text-sm">Please enter a valid YouTube, Netflix, Nebula, or Twitch URL</div>
                </div>
              </div>
            ) : (
              // Valid URL - Show preview
              <div className="p-6">
                {/* File header */}
                <div className="animate-in fade-in-0 slide-in-from-left-4 duration-400 flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <FileText className={`w-5 h-5 ${platformAccentColors[parsedUrl.platform]} animate-in fade-in-0 zoom-in-95 duration-300 delay-100`} />
                  <div className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-right-4 duration-400 delay-200">
                    {(() => {
                      const Icon = platformIcons[parsedUrl.platform];
                      return <Icon className={`w-5 h-5 ${platformColors[parsedUrl.platform]} animate-in fade-in-0 zoom-in-95 duration-300 delay-300`} />;
                    })()}
                    <span className={`text-sm font-mono font-semibold ${platformAccentColors[parsedUrl.platform]} animate-in fade-in-0 duration-400 delay-400`}>
                      {PLATFORM_NAMES[parsedUrl.platform]} Video
                    </span>
                  </div>
                  {parsedUrl.videoId && (
                    <span className={`text-xs font-mono ml-auto ${platformAccentColors[parsedUrl.platform]} opacity-75 animate-in fade-in-0 slide-in-from-right-4 duration-400 delay-500`}>
                      ID: {parsedUrl.videoId}
                    </span>
                  )}
                </div>

                {/* Metadata display */}
                {isLoadingMetadata ? (
                  <div className="space-y-6 animate-in fade-in-0 duration-300">
                    {/* File header skeleton */}
                    <div className="flex items-center gap-3">
                      <div className="animate-pulse">
                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>

                    {/* Metadata skeleton */}
                    <div className="space-y-3">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>

                    {/* Thumbnail skeleton */}
                    <div className="animate-pulse">
                      <div className="w-full max-w-sm mx-auto h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ) : previewError ? (
                  <div
                    className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 text-center py-8 space-y-4"
                    role="alert"
                    aria-live="assertive"
                  >
                    <div className="text-red-600 dark:text-red-400 text-lg" aria-label="Error">⚠️ {previewError}</div>
                    <div
                      id="preview-error"
                      className="text-sm text-gray-500 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800"
                    >
                      The video may still be added to your watchlist
                    </div>
                  </div>
                ) : metadata ? (
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                    {/* Title */}
                    <div className="animate-in fade-in-0 slide-in-from-left-2 duration-300 delay-600 font-mono text-sm">
                      <span className="text-purple-600 dark:text-purple-400">title:</span>{' '}
                      <span className="text-green-600 dark:text-green-400">&ldquo;{metadata.title}&rdquo;</span>
                    </div>

                    {/* Platform */}
                    <div className="animate-in fade-in-0 slide-in-from-left-2 duration-300 delay-700 font-mono text-sm">
                      <span className="text-purple-600 dark:text-purple-400">platform:</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400">&ldquo;{parsedUrl.platform}&rdquo;</span>
                    </div>

                    {/* URL */}
                    <div className="animate-in fade-in-0 slide-in-from-left-2 duration-300 delay-800 font-mono text-sm">
                      <span className="text-purple-600 dark:text-purple-400">url:</span>{' '}
                      <span className="text-yellow-600 dark:text-yellow-400">&ldquo;{url}&rdquo;</span>
                    </div>

                    {/* Author (YouTube only) */}
                    {metadata.authorName && (
                      <div className="animate-in fade-in-0 slide-in-from-left-2 duration-300 delay-900 font-mono text-sm">
                        <span className="text-purple-600 dark:text-purple-400">author:</span>{' '}
                        <span className="text-cyan-600 dark:text-cyan-400">&ldquo;{metadata.authorName}&rdquo;</span>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedTags.length > 0 && (
                      <div className="animate-in fade-in-0 slide-in-from-left-2 duration-300 delay-1000 font-mono text-sm">
                        <span className="text-purple-600 dark:text-purple-400">tags:</span>{' '}
                        <span className="text-pink-600 dark:text-pink-400">
                          [{selectedTags.map(tag => `"${tag.name}"`).join(', ')}]
                        </span>
                      </div>
                    )}

                    {/* Thumbnail */}
                    {metadata.thumbnailUrl && (
                      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-1100 mt-6">
                        <div className="font-mono text-sm text-purple-600 dark:text-purple-400 mb-2">thumbnail:</div>
                        <div className="relative w-full max-w-xs lg:max-w-sm mx-auto">
                          <Image
                            src={metadata.thumbnailUrl}
                            alt={metadata.title}
                            width={320}
                            height={180}
                            className="w-full h-auto rounded border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-500 delay-1200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}