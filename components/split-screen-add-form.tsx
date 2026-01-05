'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, Youtube, Tv, Gamepad2, FileText, ExternalLink } from 'lucide-react';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';
import { extractVideoMetadata, VideoMetadata } from '@/lib/utils/metadata-extractor';
import { PLATFORM_NAMES } from '@/lib/utils/platform-utils';

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

  const handleAddVideo = async () => {
    if (!url.trim() || !parsedUrl?.isValid) return;

    setIsAdding(true);
    try {
      const videoData = {
        url: url.trim(),
        title: metadata?.title,
        platform: parsedUrl.platform,
        thumbnailUrl: metadata?.thumbnailUrl,
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

      {/* Split-screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
        {/* Left side: Form inputs (2/5 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`w-full h-12 text-base ${
                  url.trim() && parsedUrl
                    ? parsedUrl.isValid
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-orange-500 focus:border-orange-500'
                    : ''
                }`}
              />
              {url.trim() && parsedUrl && !parsedUrl.isValid && (
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Please enter a valid YouTube, Netflix, Nebula, or Twitch URL
                </div>
              )}
            </div>

            <Button
              onClick={handleAddVideo}
              disabled={!url.trim() || !parsedUrl?.isValid || isAdding}
              className="w-full h-12"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right side: Live preview (3/5 width on desktop) */}
        <div className="lg:col-span-3">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 min-h-[400px]">
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
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = platformIcons[parsedUrl.platform];
                      return <Icon className={`w-5 h-5 ${platformColors[parsedUrl.platform]}`} />;
                    })()}
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                      {PLATFORM_NAMES[parsedUrl.platform]} Video
                    </span>
                  </div>
                  {parsedUrl.videoId && (
                    <span className="text-xs text-gray-400 font-mono ml-auto">
                      ID: {parsedUrl.videoId}
                    </span>
                  )}
                </div>

                {/* Metadata display */}
                {isLoadingMetadata ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 dark:text-red-400 mb-2">⚠️ {previewError}</div>
                    <div className="text-sm text-gray-500">The video may still be added to your watchlist</div>
                  </div>
                ) : metadata ? (
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="font-mono text-sm">
                      <span className="text-purple-600 dark:text-purple-400">title:</span>{' '}
                      <span className="text-green-600 dark:text-green-400">&ldquo;{metadata.title}&rdquo;</span>
                    </div>

                    {/* Platform */}
                    <div className="font-mono text-sm">
                      <span className="text-purple-600 dark:text-purple-400">platform:</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400">&ldquo;{parsedUrl.platform}&rdquo;</span>
                    </div>

                    {/* URL */}
                    <div className="font-mono text-sm">
                      <span className="text-purple-600 dark:text-purple-400">url:</span>{' '}
                      <span className="text-yellow-600 dark:text-yellow-400">&ldquo;{url}&rdquo;</span>
                    </div>

                    {/* Author (YouTube only) */}
                    {metadata.authorName && (
                      <div className="font-mono text-sm">
                        <span className="text-purple-600 dark:text-purple-400">author:</span>{' '}
                        <span className="text-cyan-600 dark:text-cyan-400">&ldquo;{metadata.authorName}&rdquo;</span>
                      </div>
                    )}

                    {/* Thumbnail */}
                    {metadata.thumbnailUrl && (
                      <div className="mt-6">
                        <div className="font-mono text-sm text-purple-600 dark:text-purple-400 mb-2">thumbnail:</div>
                        <div className="relative w-full max-w-sm mx-auto">
                          <Image
                            src={metadata.thumbnailUrl}
                            alt={metadata.title}
                            width={320}
                            height={180}
                            className="w-full h-auto rounded border border-gray-200 dark:border-gray-700"
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