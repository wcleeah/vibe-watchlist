'use client';

import { useState, useEffect } from 'react';
import { UrlInput } from './url-input';
import { MetadataSelector } from './metadata-selector';
import { TagInput } from './tag-input';
import { SubmitButton } from './submit-button';
import { Button } from '@/components/ui/button';
import { Tag } from '@/types/tag';
import { MetadataSuggestion } from '@/lib/types/ai-metadata';
import { PlatformSuggestion } from '@/lib/services/ai-service';
import { PlatformSuggestions } from './platform-suggestions';
import { Loader2 } from 'lucide-react';
import { usePlatforms } from '@/hooks/use-platforms';

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
  // Platform Discovery props
  platformSuggestions?: PlatformSuggestion[];
  isDetectingPlatform?: boolean;
  onAcceptPlatformSuggestion?: (suggestion: PlatformSuggestion) => void;
  onRejectPlatformSuggestions?: () => void;
  onPlatformCreated?: (platform: any) => void;
  onDetectPlatform?: () => void;
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
  // Platform Discovery props
  platformSuggestions = [],
  isDetectingPlatform = false,
  onAcceptPlatformSuggestion,
  onRejectPlatformSuggestions,
  onPlatformCreated,
  onDetectPlatform,
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
  const { platforms } = usePlatforms();
  const platformNames = platforms.length > 0
    ? platforms.map(p => p.displayName).join(', ')
    : 'YouTube, Netflix, Nebula, or Twitch';

  const hasValidUrl = parsedUrl?.isValid ?? false;
  const urlError = parsedUrl && !parsedUrl.isValid && url.trim()
    ? `Please enter a valid video URL from supported platforms: ${platformNames}`
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
        placeholder={`https://example.com/video`}
        isValid={parsedUrl?.isValid}
        error={urlError || undefined}
        disabled={isSubmitting}
      />

      {/* Platform Discovery - show when URL is invalid and no suggestions yet */}
      {!hasValidUrl && url.trim() && platformSuggestions.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            This URL isn't recognized. Would you like to detect the platform automatically?
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={onDetectPlatform}
            disabled={isDetectingPlatform}
            className="text-xs"
          >
            {isDetectingPlatform ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Detecting...
              </>
            ) : (
              <>
                🔍 Detect Platform
              </>
            )}
          </Button>
        </div>
      )}

      {/* Platform Suggestions - show when URL is invalid but we have suggestions */}
      {platformSuggestions.length > 0 && (
        <PlatformSuggestions
          suggestions={platformSuggestions}
          onAccept={onAcceptPlatformSuggestion || (() => {})}
          onReject={onRejectPlatformSuggestions || (() => {})}
          onPlatformCreated={onPlatformCreated}
          isLoading={isDetectingPlatform}
        />
      )}

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
