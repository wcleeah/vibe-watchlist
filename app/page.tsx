'use client';

import { NavigationTabs } from '@/components/navigation-tabs';
import { LayoutManager } from '@/components/layout/layout-manager';
import { FormLayout } from '@/components/video-form';
import { PreviewCard } from '@/components/video-preview';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUrlValidation } from '@/hooks/use-url-validation';
import { useAIMetadataFetching } from '@/hooks/use-ai-metadata-fetching';
import { Tag } from '@/types/tag';
import { PlatformSuggestion } from '@/lib/services/ai-service';
import { toast } from 'sonner';

export default function Home() {
  // URL validation hook
  const urlValidation = useUrlValidation();

  // AI Metadata fetching hook
  const aiMetadata = useAIMetadataFetching({
    url: urlValidation.url,
    platform: urlValidation.parsedUrl?.platform,
    enabled: urlValidation.parsedUrl?.isValid,
  });



  // Global reset function
  const reset = () => {
    urlValidation.setUrl("");
  };

  // Manual mode state
  const [manualMode, setManualModeRaw] = useState(false);

  // Selected tags state (managed via callback from FormLayout)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form schema
  const videoSchema = z.object({
    title: z.string().min(1, "Title is required"),
    thumbnailUrl: z.string().optional(),
    tags: z.array(z.number()),
  });

  type VideoFormData = z.infer<typeof videoSchema>;

  // Initialize RHF form
  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      thumbnailUrl: "",
      tags: [],
    },
  });

  // Mode state for two-mode architecture
  const [mode, setMode] = useState<'input' | 'form'>('input');

  // Platform detection state (moved from FormLayout)
  const [platformSuggestions, setPlatformSuggestions] = useState<PlatformSuggestion[]>([]);
  const [isDetectingPlatform, setIsDetectingPlatform] = useState(false);

  // Platform detection (moved from FormLayout)
  useEffect(() => {
    const parsed = urlValidation.parsedUrl;
    if (!parsed?.isValid || parsed.platform !== 'unknown' || isDetectingPlatform) return;

    setIsDetectingPlatform(true);

    fetch('/api/platforms/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: parsed.url }),
    })
      .then(response => {
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const suggestion: PlatformSuggestion = data.suggestion;
        if (suggestion.confidence > 0.3) {
          setPlatformSuggestions([suggestion]);
        }
      })
      .catch(error => {
        console.error('Platform detection error:', error);
      })
      .finally(() => {
        setIsDetectingPlatform(false);
      });
  }, [urlValidation.parsedUrl, isDetectingPlatform]);

  // Full loading condition for mode transition
  const isReadyForForm = urlValidation.parsedUrl?.isValid &&
    !aiMetadata.isLoading &&
    (urlValidation.parsedUrl.platform !== 'unknown' || platformSuggestions.length > 0);

  // Mode transition: Input → Form when all async operations complete
  useEffect(() => {
    if (isReadyForForm && mode === 'input') {
      setMode('form');
    }
  }, [isReadyForForm, mode]);

  // Reset mode to input when URL becomes invalid
  useEffect(() => {
    if (!urlValidation.parsedUrl?.isValid && mode === 'form') {
      setMode('input');
    }
  }, [urlValidation.parsedUrl?.isValid, mode]);

  // Update form when AI metadata changes (only if not in manual mode)
  useEffect(() => {
    if (!manualMode && aiMetadata.selectedSuggestion) {
      form.setValue("title", aiMetadata.selectedSuggestion.title);
      form.setValue("thumbnailUrl", aiMetadata.selectedSuggestion.thumbnailUrl || "");
    }
  }, [aiMetadata.selectedSuggestion, manualMode, form]);

  // Watch form values
  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedThumbnailUrl = useWatch({ control: form.control, name: "thumbnailUrl" });

  // Smart mode transitions for manual mode
  const setManualMode = useCallback((mode: boolean) => {
    setManualModeRaw(mode);

    if (mode) {
      // Switching to manual: preserve current inputs (AI values if not set)
      const currentTitle = watchedTitle || aiMetadata.selectedSuggestion?.title || '';
      const currentThumbnail = watchedThumbnailUrl || aiMetadata.selectedSuggestion?.thumbnailUrl || '';
      form.setValue("title", currentTitle);
      form.setValue("thumbnailUrl", currentThumbnail);
    } else {
      // Switching to auto: clear manual inputs if they match AI suggestion
      if (watchedTitle === aiMetadata.selectedSuggestion?.title) form.setValue("title", '');
      if (watchedThumbnailUrl === aiMetadata.selectedSuggestion?.thumbnailUrl) form.setValue("thumbnailUrl", '');
    }

    setSubmitError(null);
  }, [aiMetadata.selectedSuggestion, watchedTitle, watchedThumbnailUrl, form]);

  // Submission handler using RHF
  const onSubmit = form.handleSubmit(async (data: VideoFormData) => {
    if (!urlValidation.parsedUrl?.isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const videoData = {
        url: urlValidation.parsedUrl.url,
        title: data.title,
        platform: aiMetadata.selectedSuggestion?.platform || urlValidation.parsedUrl.platform,
        thumbnailUrl: data.thumbnailUrl || null,
        tagIds: data.tags,
      };

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData),
      });

      console.log('📥 API Response:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          setSubmitError(errorData.error || 'Video already exists');
        } else {
          setSubmitError('Failed to add video');
        }
      } else {
        reset(); // Reset URL and global state
        form.reset(); // Reset form
        toast.success('Video added successfully!');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      setSubmitError('Failed to add video');
    } finally {
      setIsSubmitting(false);
    }
  });

  const hasContent = urlValidation.url.trim().length > 0 && urlValidation.parsedUrl?.isValid === true;

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
        Paste a video URL to start the extraction
      </p>
    </div>
  );

  return (
    <FormProvider {...form}>
      <div className="bg-background text-foreground">
        <NavigationTabs />

        <main className="min-h-screen pt-16 pb-20 container mx-auto px-4 max-w-6xl flex items-center justify-center">
        <LayoutManager
          hasContent={hasContent}
          header={header}
            form={
              <FormLayout
                handleSubmit={onSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onVideoAdded={() => {}}
                showTags={hasContent}
                isUrlValid={urlValidation.parsedUrl?.isValid}
                // AI Metadata props
                aiSuggestions={aiMetadata.suggestions}
                selectedSuggestion={aiMetadata.selectedSuggestion}
                onSuggestionSelect={aiMetadata.setSelectedSuggestion}
                isLoadingAIMetadata={aiMetadata.isLoading}
                aiMetadataError={aiMetadata.error}
                onManualEdit={() => setManualMode(!manualMode)}
                // Tag props
                onSelectedTagsChange={setSelectedTags}
                onReset={reset}
              />
            }
          preview={hasContent ? (
            <PreviewCard
              video={{
                id: 0,
                url: urlValidation.url,
                title: manualMode ? (watchedTitle || null) : (aiMetadata.selectedSuggestion?.title || null),
                platform: aiMetadata.selectedSuggestion?.platform || urlValidation.parsedUrl?.platform || 'unknown',
                thumbnailUrl: manualMode ? (watchedThumbnailUrl || null) : (aiMetadata.selectedSuggestion?.thumbnailUrl || null),
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
            />
          ) : null}
        />
        </main>
      </div>
    </FormProvider>
  );
}
