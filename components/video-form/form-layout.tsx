'use client';

import { useState } from 'react';
import { UrlInput } from './url-input';
import { TagInput } from './tag-input';
import { SubmitButton } from './submit-button';
import { useVideoForm } from '@/hooks/use-video-form';

interface FormLayoutProps {
  url: string;
  setUrl: (url: string) => void;
  parsedUrl?: { isValid: boolean; platform?: string } | null;
  onVideoAdded?: () => void;
  className?: string;
  showTags?: boolean;
}

export function FormLayout({ url, setUrl, parsedUrl, onVideoAdded, className, showTags = true }: FormLayoutProps) {
  const [isAdding, setIsAdding] = useState(false);

  const {
    selectedTags,
    setTagInput,
    tagInput,
    showTagSuggestions,
    filteredSuggestions,
    isLoadingTags,
    tagError,
    handleTagInputChange,
    handleTagKeyDown,
    removeTag,
    selectSuggestedTag,
  } = useVideoForm({ onVideoAdded });

  const hasValidUrl = parsedUrl?.isValid ?? false;
  const urlError = parsedUrl && !parsedUrl.isValid && url.trim()
    ? "Please enter a valid YouTube, Netflix, Nebula, or Twitch URL"
    : null;

  // Custom handleAddVideo that uses external URL state
  const handleAddVideo = async () => {
    if (!url.trim() || !parsedUrl?.isValid) return;

    setIsAdding(true);
    try {
      const videoData = {
        url: url.trim(),
        platform: parsedUrl.platform,
        tagIds: selectedTags.map(tag => tag.id),
      };

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData),
      });

      if (response.ok) {
        onVideoAdded?.();
        // Reset form
        setUrl('');
      } else {
        console.error('Failed to add video');
      }
    } catch (error) {
      console.error('Error adding video:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* URL Input */}
      <UrlInput
        value={url}
        onChange={setUrl}
        isValid={parsedUrl?.isValid}
        error={urlError || undefined}
      />

      {/* Tag Input - show only if showTags */}
      {showTags && (
        <TagInput
          value={tagInput}
          onChange={handleTagInputChange}
          onTagAdd={async (tagName) => {
            // Set the tag input value and trigger add
            handleTagInputChange(tagName);
            setTimeout(() => handleTagKeyDown({ key: 'Enter', preventDefault: () => {} } as React.KeyboardEvent), 0);
          }}
          onTagRemove={removeTag}
          selectedTags={selectedTags}
          suggestions={filteredSuggestions}
          showSuggestions={showTagSuggestions}
          onSelectSuggestion={selectSuggestedTag}
          isLoading={isLoadingTags}
          error={tagError}
        />
      )}

      {/* Submit Button - show only if showTags */}
      {showTags && (
        <SubmitButton
          onClick={handleAddVideo}
          isLoading={false}
          disabled={!hasValidUrl}
        />
      )}
    </div>
  );
}