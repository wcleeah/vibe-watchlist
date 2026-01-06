'use client';

import { useState } from 'react';
import { UrlInput } from './url-input';
import { MetadataSelector } from './metadata-selector';
import { TagInput } from './tag-input';
import { SubmitButton } from './submit-button';
import { Button } from '@/components/ui/button';
import { Tag } from '@/types/tag';
import { MetadataSuggestion } from '@/lib/types/ai-metadata';

interface FormLayoutProps {
  url: string;
  setUrl: (url: string) => void;
  parsedUrl?: { isValid: boolean; platform?: string } | null;
  onVideoAdded?: () => void;
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  className?: string;
  showTags?: boolean;
  // AI Metadata props
  aiSuggestions?: MetadataSuggestion[];
  selectedSuggestion?: MetadataSuggestion;
  onSuggestionSelect?: (suggestion: MetadataSuggestion | undefined) => void;
  isLoadingAIMetadata?: boolean;
  aiMetadataError?: string | null;
  onManualEdit?: () => void;
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
  handleSubmit,
  isSubmitting,
  submitError,
  onVideoAdded,
  className,
  showTags = true,
  // AI Metadata props
  aiSuggestions = [],
  selectedSuggestion,
  onSuggestionSelect,
  isLoadingAIMetadata = false,
  aiMetadataError,
  onManualEdit,
  // Tag props
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
  const hasValidUrl = parsedUrl?.isValid ?? false;
  const urlError = parsedUrl && !parsedUrl.isValid && url.trim()
    ? "Please enter a valid YouTube, Netflix, Nebula, or Twitch URL"
    : null;

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

      {/* AI Metadata Selector - show when URL is valid */}
      {hasValidUrl && (
        <MetadataSelector
          suggestions={aiSuggestions}
          selectedIndex={selectedSuggestion ? aiSuggestions.findIndex(s => s === selectedSuggestion) : undefined}
          onSelect={(index) => {
            const suggestion = aiSuggestions[index];
            onSuggestionSelect?.(suggestion);
          }}
          onManualEdit={onManualEdit}
          isLoading={isLoadingAIMetadata}
          error={aiMetadataError || undefined}
          disabled={isSubmitting}
        />
      )}

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
              onClick={handleSubmit}
             isLoading={isSubmitting}
             disabled={!hasValidUrl || isSubmitting}
             className="flex-1"
           />
         </div>
       )}
    </div>
  );
}