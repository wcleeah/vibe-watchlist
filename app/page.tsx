'use client';

import { NavigationTabs } from '@/components/navigation-tabs';
import { LayoutManager } from '@/components/layout/layout-manager';
import { FormLayout } from '@/components/video-form';
import { PreviewCard } from '@/components/video-preview';
import { useVideoForm } from '@/hooks/use-video-form';

export default function Home() {
  const {
    url,
    parsedUrl,
    metadata,
    selectedTags,
    isLoadingMetadata,
    previewError
  } = useVideoForm({
    onVideoAdded: () => {
      // Could add toast notification or redirect to list
      console.log('Video added successfully');
    }
  });

  const hasContent = url.trim().length > 0;

  const header = (
    <div className="text-center mb-4">
      <h1 className="text-3xl font-bold mb-4">Add New Video</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Paste a video URL from YouTube, Netflix, Nebula, or Twitch
      </p>
    </div>
  );

  const form = <FormLayout onVideoAdded={() => {}} showTags={true} />;

  const preview = hasContent ? (
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
  ) : null;

  return (
    <div className="bg-background text-foreground">
      <NavigationTabs />

      <main className="min-h-screen pt-16 pb-20 container mx-auto px-4 max-w-6xl flex items-center justify-center">
        <LayoutManager
          hasContent={hasContent}
          header={header}
          form={form}
          preview={preview}
        />
      </main>
    </div>
  );
}