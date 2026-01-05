'use client';

import { useState } from 'react';
import { UrlInput } from './url-input';
import { TagInput } from './tag-input';
import { SubmitButton } from './submit-button';
import { Button } from '@/components/ui/button';
import { Tag } from '@/types/tag';

interface FormLayoutProps {
  url: string;
  setUrl: (url: string) => void;
  parsedUrl?: { isValid: boolean; platform?: string } | null;
  onVideoAdded?: () => void;
  className?: string;
  showTags?: boolean;
  // Tag props to sync with preview
  selectedTags: Tag[];
  tagInput: string;
  setTagInput: (value: string) => void;
  handleTagInputChange: (value: string) => void;
  handleTagKeyDown: (e: React.KeyboardEvent) => Promise<void>;
  removeTag: (tagId: number) => void;
  selectSuggestedTag: (tag: Tag) => void;
  filteredSuggestions: Tag[];
  showTagSuggestions: boolean;
  isLoadingTags: boolean;
  tagError: string | null;
  onAddTag: (tagName: string) => Promise<void>;
  onReset?: () => void;
}

export function FormLayout({
  url,
  setUrl,
  parsedUrl,
  onVideoAdded,
  className,
  showTags = true,
  selectedTags,
  tagInput,
  setTagInput,
  handleTagInputChange,
  handleTagKeyDown,
  removeTag,
  selectSuggestedTag,
  filteredSuggestions,
  showTagSuggestions,
  isLoadingTags,
  tagError,
  onAddTag,
  onReset,
}: FormLayoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasValidUrl = parsedUrl?.isValid ?? false;
  const urlError = parsedUrl && !parsedUrl.isValid && url.trim()
    ? "Please enter a valid YouTube, Netflix, Nebula, or Twitch URL"
    : null;

  // Custom handleAddVideo that uses external URL state
  const handleAddVideo = async () => {
    if (!url.trim() || !parsedUrl?.isValid) return;

    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Heading */}
      {showTags && (
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold">Add Tags</h2>
        </div>
      )}

      {/* URL Input */}
      <UrlInput
        value={url}
        onChange={setUrl}
        isValid={parsedUrl?.isValid}
        error={urlError || undefined}
        disabled={isSubmitting}
      />

      {/* Tag Input - show only if showTags */}
      {showTags && (
        <TagInput
          value={tagInput}
          onChange={handleTagInputChange}
          onTagAdd={onAddTag}
          onTagRemove={removeTag}
          selectedTags={selectedTags}
          suggestions={filteredSuggestions}
          showSuggestions={showTagSuggestions}
          onSelectSuggestion={selectSuggestedTag}
          isLoading={isLoadingTags || isSubmitting}
          error={tagError}
        />
      )}

       {/* Buttons - show only if showTags */}
       {showTags && (
         <div className="flex gap-2">
           <Button
             variant="secondary"
             className="flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
             onClick={onReset}
             disabled={isSubmitting}
           >
             Reset
           </Button>
           <SubmitButton
             onClick={handleAddVideo}
             isLoading={isSubmitting}
             disabled={!hasValidUrl || isSubmitting}
             className="flex-1"
           />
         </div>
       )}
    </div>
  );
}