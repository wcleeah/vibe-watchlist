'use client';

import { NavigationTabs } from '@/components/navigation-tabs';
import { LayoutManager } from '@/components/layout/layout-manager';
import { FormLayout } from '@/components/video-form';
import { PreviewCard } from '@/components/video-preview';
import { useAddVideoForm } from '@/hooks/use-add-video-form';
import { toast } from 'sonner';

export default function Home() {
  const {
    url,
    setUrl,
    parsedUrl,
    selectedTags,
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
    manualMode,
    setManualMode,
    manualTitle,
    setManualTitle,
    manualThumbnailUrl,
    setManualThumbnailUrl,
    isSubmitting,
    handleSubmit,
    submitError,
    reset,
    aiMetadata
  } = useAddVideoForm({
    onVideoAdded: () => {
      toast.success('Video added successfully!');
    }
  });

  const hasContent = url.trim().length > 0 && parsedUrl?.isValid === true;
  // Only show full-page loading when actually fetching AI metadata (not just typing URLs)
  const shouldShowLoading = hasContent && aiMetadata.isLoading;

  // Show full-page loading during metadata fetch
  if (shouldShowLoading) {
    return (
      <div className="bg-background text-foreground">
        <NavigationTabs />
      <main className="min-h-screen pt-4 sm:pt-16 pb-20 container mx-auto px-4 max-w-6xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  const header = hasContent ? null : (
    <div className="text-center mb-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Add New Video</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Paste a video URL from YouTube, Netflix, Nebula, or Twitch
      </p>
    </div>
  );

  return (
    <div className="bg-background text-foreground">
      <NavigationTabs />

      <main className="min-h-screen pt-16 pb-20 container mx-auto px-4 max-w-6xl flex items-center justify-center">
        <LayoutManager
          hasContent={hasContent}
          header={header}
          form={
            <FormLayout
              url={url}
              setUrl={setUrl}
              parsedUrl={parsedUrl}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onVideoAdded={() => {}}
              showTags={hasContent}
              // AI Metadata props
              aiSuggestions={aiMetadata.suggestions}
              selectedSuggestion={aiMetadata.selectedSuggestion}
              onSuggestionSelect={aiMetadata.setSelectedSuggestion}
              isLoadingAIMetadata={aiMetadata.isLoading}
              aiMetadataError={aiMetadata.error}
              onManualEdit={() => setManualMode(!manualMode)}
              // Tag props
              selectedTags={selectedTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              handleTagInputChange={handleTagInputChange}
              handleTagKeyDown={handleTagKeyDown}
              removeTag={removeTag}
              selectSuggestedTag={selectSuggestedTag}
              filteredSuggestions={filteredSuggestions}
              showTagSuggestions={showTagSuggestions}
              isLoadingTags={isLoadingTags}
              tagError={tagError}
              onAddTag={addTag}
              onReset={reset}
            />
          }
          preview={hasContent ? (
            <PreviewCard
              video={{
                id: 0,
                url,
                title: manualMode ? manualTitle : (aiMetadata.selectedSuggestion?.title || null),
                platform: aiMetadata.selectedSuggestion?.platform || parsedUrl?.platform || 'unknown',
                thumbnailUrl: manualMode ? manualThumbnailUrl : (aiMetadata.selectedSuggestion?.thumbnailUrl || null),
                isWatched: false,
                tags: selectedTags,
                metadata: aiMetadata.selectedSuggestion ? {
                  title: aiMetadata.selectedSuggestion.title,
                  thumbnailUrl: aiMetadata.selectedSuggestion.thumbnailUrl || null,
                } : null,
                isLoading: aiMetadata.isLoading,
                error: aiMetadata.error || undefined,
              }}
              showActions={false}
              onToggleManual={() => setManualMode(!manualMode)}
              manualMode={manualMode}
              manualTitle={manualTitle}
              onManualTitleChange={setManualTitle}
              manualThumbnailUrl={manualThumbnailUrl}
              onManualThumbnailChange={setManualThumbnailUrl}
            />
          ) : null}
        />
      </main>
    </div>
  );
}
