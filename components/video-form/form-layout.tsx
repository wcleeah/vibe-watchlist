'use client';

import { UrlInput } from './url-input';
import { TagInput } from './tag-input';
import { SubmitButton } from './submit-button';
import { useVideoForm } from '@/hooks/use-video-form';

interface FormLayoutProps {
  onVideoAdded?: () => void;
  className?: string;
}

export function FormLayout({ onVideoAdded, className }: FormLayoutProps) {
  const {
    url,
    setUrl,
    parsedUrl,
    selectedTags,
    setTagInput,
    tagInput,
    showTagSuggestions,
    filteredSuggestions,
    isLoadingTags,
    tagError,
    isAdding,
    handleAddVideo,
    handleTagInputChange,
    handleTagKeyDown,
    removeTag,
    selectSuggestedTag,
  } = useVideoForm({ onVideoAdded });

  const hasValidUrl = parsedUrl?.isValid ?? false;
  const urlError = parsedUrl && !parsedUrl.isValid && url.trim()
    ? "Please enter a valid YouTube, Netflix, Nebula, or Twitch URL"
    : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* URL Input */}
      <UrlInput
        value={url}
        onChange={setUrl}
        isValid={parsedUrl?.isValid}
        error={urlError || undefined}
      />

      {/* Tag Input */}
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

      {/* Submit Button */}
      <SubmitButton
        onClick={handleAddVideo}
        isLoading={isAdding}
        disabled={!hasValidUrl}
      />
    </div>
  );
}