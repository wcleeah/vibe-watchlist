'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
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
import { toast } from 'sonner';

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
  onDetectPlatform?: (url: string) => Promise<void>;
  onPlatformCreated?: (platform: any) => void;
  // Tag props to sync with preview
  onSelectedTagsChange: (tags: Tag[]) => void;
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
  onDetectPlatform,
  onPlatformCreated,
  // Tag props
  onSelectedTagsChange,
  onReset,
}: FormLayoutProps) {
  const { setValue } = useFormContext();

  // Tag state
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  // Platform state
  const [platformSuggestions, setPlatformSuggestions] = useState<PlatformSuggestion[]>([]);
  const [isDetectingPlatform, setIsDetectingPlatform] = useState(false);

  const { platforms } = usePlatforms();
  const platformNames = platforms.length > 0
    ? platforms.map(p => p.displayName).join(', ')
    : 'YouTube, Netflix, Nebula, or Twitch';

  const hasValidUrl = parsedUrl?.isValid ?? false;
  const urlError = parsedUrl && !parsedUrl.isValid && url.trim()
    ? `Please enter a valid video URL from supported platforms: ${platformNames}`
    : null;

  // Load available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const tags = await response.json();
          setAvailableTags(tags);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Notify parent and update form when selectedTags changes
  useEffect(() => {
    onSelectedTagsChange(selectedTags);
    setValue("tags", selectedTags.map(tag => tag.id));
  }, [selectedTags, onSelectedTagsChange, setValue]);

  // Tag management functions
  const handleTagInputChange = useCallback((value: string) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
    setTagError(null);
  }, []);

  const handleTagKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      await addTag(tagInput.trim());
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  }, [tagInput]);

  const addTag = useCallback(async (tagName: string) => {
    if (!tagName) return;

    // Check if tag is already selected
    if (selectedTags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setTagError('Tag already added');
      return;
    }

    // Check if tag exists in available tags
    const existingTag = availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    if (existingTag) {
      setSelectedTags(prev => [...prev, existingTag]);
      setTagInput('');
      setShowTagSuggestions(false);
      return;
    }

    // Create new tag
    setIsLoadingTags(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setAvailableTags(prev => [...prev, newTag]);
        setSelectedTags(prev => [...prev, newTag]);
        setTagInput('');
        setShowTagSuggestions(false);
      } else if (response.status === 409) {
        // Tag already exists, fetch it
        const existingTag = availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
        if (existingTag) {
          setSelectedTags(prev => [...prev, existingTag]);
        }
        setTagError('Tag already exists');
      } else {
        setTagError('Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setTagError('Failed to create tag');
    } finally {
      setIsLoadingTags(false);
    }
  }, [selectedTags, availableTags]);

  const removeTag = useCallback((tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const selectSuggestedTag = useCallback((tag: Tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  }, [selectedTags]);

  // Filter suggestions based on input
  const filteredSuggestions = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  ).slice(0, 5);

  // Platform discovery functions
  const detectPlatform = useCallback(async () => {
    if (!url.trim() || isDetectingPlatform) return;

    setIsDetectingPlatform(true);
    try {
      console.log('🔍 Detecting platform for URL:', url);

      // Call the API directly
      const response = await fetch('/api/platforms/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const suggestion: PlatformSuggestion = data.suggestion;

      // Show suggestions with decent confidence
      if (suggestion.confidence > 0.3) {
        setPlatformSuggestions([suggestion]);
        console.log('✅ Platform suggestion found:', suggestion);
      } else {
        console.log('⚠️ Low confidence platform suggestion:', suggestion);
      }
    } catch (error) {
      console.error('❌ Platform detection failed:', error);
    } finally {
      setIsDetectingPlatform(false);
    }
  }, [url, isDetectingPlatform]);

  const acceptPlatformSuggestion = async (suggestion: PlatformSuggestion) => {
    try {
      console.log('🔧 Creating platform from suggestion:', suggestion);

      const response = await fetch('/api/platforms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformId: suggestion.platform,
          name: suggestion.platform,
          displayName: suggestion.platform.charAt(0).toUpperCase() + suggestion.platform.slice(1),
          patterns: suggestion.patterns,
          color: suggestion.color,
          icon: suggestion.icon,
          confidenceScore: suggestion.confidence,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Platform created successfully:', result.platform);
        toast.success(`Platform "${suggestion.platform}" added successfully!`);
        setPlatformSuggestions([]);
        onPlatformCreated?.(result.platform);
      } else {
        const error = await response.json();
        console.error('❌ Failed to create platform:', error);
        toast.error(`Failed to add platform: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Platform creation error:', error);
      toast.error('Failed to add platform');
    }
  };

  const rejectPlatformSuggestions = () => {
    setPlatformSuggestions([]);
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
             onClick={detectPlatform}
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
          onAccept={acceptPlatformSuggestion}
          onReject={rejectPlatformSuggestions}
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
          onTagAdd={addTag}
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
