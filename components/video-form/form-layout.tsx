'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { usePlatforms } from '@/hooks/use-platforms'
import { usePlaylistManagement } from '@/hooks/use-playlist-management'
import { useSeriesSubmission } from '@/hooks/use-series-submission'
import { useTags } from '@/hooks/use-tags'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import type { VideoFormData, VideoSuggestions } from '@/types/form'
import type { ContentMode, ScheduleType, ScheduleValue } from '@/types/series'
import type { Tag } from '@/types/tag'
import { FormActionButtons } from './form-action-buttons'
import { FormError } from './form-error'
import { MetadataSelector } from './metadata-selector'
import { ModeToggle } from './mode-toggle'
import { PlatformSuggestions } from './platform-suggestions'
import { PlaylistPreviewCard } from './playlist-preview-card'
import { SeriesScheduleSection } from './series-schedule-section'
import { TagInput } from './tag-input'

interface FormLayoutProps {
    isSubmitting: boolean
    submitError: string | null
    suggestions?: VideoSuggestions
    aiMetadataError?: string | null
    onReset: () => void
    onPlatformSuggestionsDismiss?: () => void
    defaultMode?: ContentMode
    onSeriesCreated?: () => void
    onPlaylistImported?: () => void
}

export function FormLayout({
    isSubmitting,
    submitError,
    suggestions = { ai: [], platform: [] },
    aiMetadataError,
    onReset,
    onPlatformSuggestionsDismiss,
    defaultMode = 'video',
    onSeriesCreated,
    onPlaylistImported,
}: FormLayoutProps) {
    const { setValue, getValues, watch } = useFormContext<VideoFormData>()
    const [selectedSuggestion, setSelectedSuggestion] = useState<
        number | undefined
    >(0)
    const { tags: availableTags, addTag: addNewTag } = useTags()
    const { addPlatform } = usePlatforms({ fetchOnMount: false })
    const [tagInput, setTagInput] = useState('')
    const [isLoadingTags, setIsLoadingTags] = useState(false)
    const [tagError, setTagError] = useState<string | null>(null)

    // Series mode state
    const [mode, setMode] = useState<ContentMode>(defaultMode)
    const [scheduleType, setScheduleType] = useState<ScheduleType>('weekly')
    const [scheduleValue, setScheduleValue] = useState<ScheduleValue>({
        days: ['friday'],
    })
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState<string | undefined>(undefined)
    const [totalEpisodes, setTotalEpisodes] = useState<string>('')
    const [saveAsDefault, setSaveAsDefault] = useState(false)

    // Use extracted hooks
    const {
        isSubmitting: isSubmittingSeries,
        error: seriesError,
        submit: submitSeries,
    } = useSeriesSubmission({
        onSuccess: onSeriesCreated,
        onReset,
    })

    const {
        preview: playlistPreview,
        loading: isLoadingPreview,
        importing: isImportingPlaylist,
        error: playlistError,
        fetchPreview: fetchPlaylistPreview,
        importPlaylist,
        cancelPreview: cancelPlaylistPreview,
    } = usePlaylistManagement({
        onSuccess: onPlaylistImported,
        onReset,
    })

    // Get current selected tags from form
    const selectedTagIds = watch('tags') || []
    const selectedTags = useMemo(
        () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
        [availableTags, selectedTagIds],
    )

    // Update mode when defaultMode changes
    useEffect(() => {
        setMode(defaultMode)
    }, [defaultMode])

    // Auto-fetch playlist preview when in playlist mode
    useEffect(() => {
        if (
            defaultMode === 'playlist' &&
            !playlistPreview &&
            !isLoadingPreview
        ) {
            const url = getValues('url')
            if (url) {
                fetchPlaylistPreview(url)
            }
        }
    }, [
        defaultMode,
        playlistPreview,
        isLoadingPreview,
        getValues,
        fetchPlaylistPreview,
    ])

    // Platform suggestion handler
    const acceptPlatformSuggestion = async (suggestion: PlatformSuggestion) => {
        try {
            const newPlatform = await addPlatform({
                platformId: suggestion.platform,
                name: suggestion.platform,
                displayName:
                    suggestion.platform.charAt(0).toUpperCase() +
                    suggestion.platform.slice(1),
                patterns: suggestion.patterns,
                color: suggestion.color,
                icon: suggestion.icon,
                confidenceScore: suggestion.confidence,
            })

            if (newPlatform) {
                setValue('platform', newPlatform.platformId)
            }
        } catch (error) {
            console.error('Platform creation error:', error)
        }
    }

    // Tag handlers
    const addTag = useCallback(
        async (tagName: string) => {
            if (!tagName) return

            if (
                selectedTags.some(
                    (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
                )
            ) {
                setTagError('Tag already added')
                return
            }

            const existingTag = availableTags.find(
                (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
            )
            if (existingTag) {
                setValue('tags', [...selectedTagIds, existingTag.id])
                setValue('tagStrs', [
                    ...(selectedTags ? selectedTags.map((t) => t.name) : []),
                    existingTag.name,
                ])
                setTagInput('')
                return
            }

            setIsLoadingTags(true)
            try {
                const newTag = await addNewTag(tagName)
                if (newTag) {
                    setValue('tags', [...selectedTagIds, newTag.id])
                    setValue('tagStrs', [
                        ...(selectedTags
                            ? selectedTags.map((t) => t.name)
                            : []),
                        newTag.name,
                    ])
                    setTagInput('')
                } else {
                    setTagError('Failed to create tag')
                }
            } catch (error) {
                console.error('Error creating tag:', error)
                setTagError('Failed to create tag')
            } finally {
                setIsLoadingTags(false)
            }
        },
        [selectedTagIds, setValue, availableTags, selectedTags, addNewTag],
    )

    const removeTag = useCallback(
        (tagId: number) => {
            const ids = selectedTagIds.filter((id: number) => id !== tagId)
            setValue('tags', ids)
            setValue(
                'tagStrs',
                ids.map((id) => availableTags[id].name),
            )
        },
        [selectedTagIds, setValue, availableTags],
    )

    const selectSuggestedTag = useCallback(
        (tag: Tag) => {
            if (!selectedTagIds.includes(tag.id)) {
                setValue('tags', [...selectedTagIds, tag.id])
            }
            setTagInput('')
        },
        [selectedTagIds, setValue],
    )

    const filteredTags = availableTags
        .filter(
            (tag) =>
                tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                !selectedTags.some((selected) => selected.id === tag.id),
        )
        .slice(0, 5)

    // Series submission handler
    const handleSeriesSubmit = async () => {
        const formData = getValues()
        await submitSeries(
            {
                url: formData.url,
                title: formData.title,
                platform: formData.platform || 'unknown',
                thumbnailUrl: formData.thumbnailUrl || undefined,
                scheduleType,
                scheduleValue,
                startDate,
                endDate,
                tagIds: selectedTagIds,
                totalEpisodes: totalEpisodes
                    ? parseInt(totalEpisodes, 10)
                    : undefined,
            },
            saveAsDefault,
        )
    }

    // Playlist handlers
    const handlePlaylistPreview = () => {
        const url = getValues('url')
        fetchPlaylistPreview(url)
    }

    const handlePlaylistImport = () => {
        const url = getValues('url')
        importPlaylist(url, selectedTagIds)
    }

    const handleReset = () => {
        if (mode === 'playlist') {
            cancelPlaylistPreview()
        }
        onReset()
    }

    const handleModeChange = (newMode: ContentMode) => {
        setMode(newMode)
        if (newMode !== 'playlist') {
            cancelPlaylistPreview()
        }
    }

    // Determine which error to show based on mode
    const currentError =
        mode === 'video'
            ? submitError
            : mode === 'series'
              ? seriesError
              : playlistError

    return (
        <div className='space-y-6'>
            <div className='text-center mb-4'>
                <h2 className='text-xl font-semibold'>
                    Add{' '}
                    {mode === 'video'
                        ? 'Video'
                        : mode === 'series'
                          ? 'Series'
                          : 'Playlist'}
                </h2>
            </div>

            <ModeToggle
                mode={mode}
                onChange={handleModeChange}
                disabled={
                    isSubmitting || isSubmittingSeries || isImportingPlaylist
                }
            />

            {mode !== 'playlist' && suggestions.platform.length > 0 && (
                <PlatformSuggestions
                    suggestions={suggestions.platform}
                    onAccept={acceptPlatformSuggestion}
                    onReject={() => setValue('platform', 'unknown')}
                    onDismiss={onPlatformSuggestionsDismiss}
                    onPlatformCreated={(platform) =>
                        setValue('platform', platform)
                    }
                />
            )}

            {mode !== 'playlist' && (
                <MetadataSelector
                    suggestions={suggestions.ai}
                    selectedIndex={selectedSuggestion}
                    onSelect={(index) => {
                        setSelectedSuggestion(index)
                        const suggestion = suggestions.ai[index]
                        setValue('title', suggestion.title)
                        setValue('thumbnailUrl', suggestion.thumbnailUrl || '')
                        const platform: string = getValues('platform')
                        if (platform === 'unknown') {
                            setValue('platform', suggestion.platform || '')
                        }
                    }}
                    error={aiMetadataError || undefined}
                    disabled={isSubmitting || isSubmittingSeries}
                />
            )}

            {mode === 'playlist' && (
                <div className='space-y-4'>
                    <PlaylistPreviewCard preview={playlistPreview} />
                </div>
            )}

            {mode === 'series' && (
                <SeriesScheduleSection
                    scheduleType={scheduleType}
                    scheduleValue={scheduleValue}
                    startDate={startDate}
                    endDate={endDate}
                    totalEpisodes={totalEpisodes}
                    saveAsDefault={saveAsDefault}
                    disabled={isSubmitting || isSubmittingSeries}
                    onScheduleTypeChange={setScheduleType}
                    onScheduleValueChange={setScheduleValue}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onTotalEpisodesChange={setTotalEpisodes}
                    onSaveAsDefaultChange={setSaveAsDefault}
                />
            )}

            <TagInput
                value={tagInput}
                onChange={(tag) => setTagInput(tag)}
                onTagAdd={addTag}
                onTagRemove={removeTag}
                selectedTags={selectedTags}
                suggestions={filteredTags}
                showSuggestions={true}
                onSelectSuggestion={selectSuggestedTag}
                isLoading={
                    isLoadingTags ||
                    isSubmitting ||
                    isSubmittingSeries ||
                    isImportingPlaylist
                }
                error={tagError}
            />

            <FormActionButtons
                mode={mode}
                isSubmitting={isSubmitting}
                isSubmittingSeries={isSubmittingSeries}
                isImportingPlaylist={isImportingPlaylist}
                isLoadingPreview={isLoadingPreview}
                playlistPreview={playlistPreview}
                onReset={handleReset}
                onSeriesSubmit={handleSeriesSubmit}
                onPlaylistPreview={handlePlaylistPreview}
                onPlaylistImport={handlePlaylistImport}
            />

            <FormError error={currentError} />
        </div>
    )
}
