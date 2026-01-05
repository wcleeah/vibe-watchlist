'use client';

import { NavigationTabs } from '@/components/navigation-tabs';
import { LayoutManager } from '@/components/layout/layout-manager';
import { FormLayout } from '@/components/video-form';
import { PreviewCard } from '@/components/video-preview';
import { useVideoForm } from '@/hooks/use-video-form';
import { toast } from 'sonner';

export default function Home() {
  const {
    url,
    setUrl,
    parsedUrl,
    metadata,
    selectedTags,
    isLoadingMetadata,
    previewError,
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
  } = useVideoForm({
    onVideoAdded: () => {
      toast.success('Video added successfully!');
    }
  });

  const hasContent = url.trim().length > 0 && parsedUrl?.isValid === true;
  const shouldShowLoading = hasContent && (isLoadingMetadata || !metadata);

  // Show full-page loading during metadata fetch
  if (shouldShowLoading) {
    return (
      <div className="bg-background text-foreground">
        <NavigationTabs />
        <main className="min-h-screen pt-16 pb-20 container mx-auto px-4 max-w-6xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  const header = hasContent ? null : (
    <div className="text-center mb-4">
      <h1 className="text-3xl font-bold mb-4">Add New Video</h1>
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
              onVideoAdded={() => {}}
              showTags={hasContent}
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
              onReset={() => setUrl('')}
            />
          }
          preview={hasContent ? (
            <PreviewCard
              video={{
                id: 0,
                url,
                title: metadata?.title || null,
                platform: parsedUrl?.platform || 'youtube',
                thumbnailUrl: metadata?.thumbnailUrl || null,
                isWatched: false,
                tags: selectedTags,
                metadata,
                isLoading: isLoadingMetadata,
                error: previewError || undefined,
              }}
              showActions={false}
            />
          ) : null}
        />
      </main>
    </div>
  );
}