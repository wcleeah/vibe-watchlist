'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePlatforms } from '@/hooks/use-platforms'
import { useTags } from '@/hooks/use-tags'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import { SeriesService } from '@/lib/services/series-service'
import type { VideoFormData, VideoSuggestions } from '@/types/form'
import type { PlaylistImportPreview } from '@/types/playlist'
import type { ContentMode, ScheduleType, ScheduleValue } from '@/types/series'
import type { Tag } from '@/types/tag'
import { DatePickerField } from './date-picker-field'
import { MetadataSelector } from './metadata-selector'
import { ModeToggle } from './mode-toggle'
import { PlatformSuggestions } from './platform-suggestions'
import { ScheduleSelector } from './schedule-selector'
import { SubmitButton } from './submit-button'
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
    const [autoAdvanceTotalEpisodes, setAutoAdvanceTotalEpisodes] =
        useState(false)
    const [seriesError, setSeriesError] = useState<string | null>(null)
    const [isSubmittingSeries, setIsSubmittingSeries] = useState(false)

    // Playlist mode state
    const [playlistPreview, setPlaylistPreview] =
        useState<PlaylistImportPreview | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isImportingPlaylist, setIsImportingPlaylist] = useState(false)
    const [playlistError, setPlaylistError] = useState<string | null>(null)

    // Update mode when defaultMode changes
    useEffect(() => {
        setMode(defaultMode)
    }, [defaultMode])

    // Platform suggestion handlers
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
                console.log('✅ Platform created successfully:', newPlatform)
                setValue('platform', newPlatform.platformId)
            } else {
                console.error('❌ Failed to create platform')
            }
        } catch (error) {
            console.error('❌ Platform creation error:', error)
        }
    }

    // Get current selected tags from form
    const selectedTagIds = watch('tags') || []
    const selectedTags = useMemo(
        () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
        [availableTags, selectedTagIds],
    )

    const addTag = useCallback(
        async (tagName: string) => {
            if (!tagName) return

            // Check if tag is already selected
            if (
                selectedTags.some(
                    (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
                )
            ) {
                setTagError('Tag already added')
                return
            }

            // Check if tag exists in available tags
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

            // Create new tag using the hook
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

    // Filter suggestions based on input
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
        setSeriesError(null)
        setIsSubmittingSeries(true)

        try {
            await SeriesService.create({
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
                autoAdvanceTotalEpisodes,
            })

            // Save as default mode for platform if checked
            if (saveAsDefault && formData.platform) {
                try {
                    await fetch('/api/platforms/default-mode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            platformId: formData.platform,
                            defaultMode: 'series',
                        }),
                    })
                } catch (error) {
                    console.error('Failed to save default mode:', error)
                }
            }

            toast.success('Series created successfully!')
            onSeriesCreated?.()
            onReset()
        } catch (error) {
            console.error('Failed to create series:', error)
            setSeriesError(
                error instanceof Error
                    ? error.message
                    : 'Failed to create series',
            )
        } finally {
            setIsSubmittingSeries(false)
        }
    }

    // Playlist preview handler
    const handlePlaylistPreview = useCallback(async () => {
        const formData = getValues()
        if (!formData.url) {
            setPlaylistError('Please enter a playlist URL')
            return
        }

        setPlaylistError(null)
        setIsLoadingPreview(true)

        try {
            const response = await fetch('/api/playlists/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formData.url }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to fetch playlist info')
            }

            const data = await response.json()
            setPlaylistPreview(data.preview)
        } catch (error) {
            console.error('Failed to preview playlist:', error)
            setPlaylistError(
                error instanceof Error
                    ? error.message
                    : 'Failed to fetch playlist info',
            )
        } finally {
            setIsLoadingPreview(false)
        }
    }, [getValues])

    // Auto-fetch playlist preview when in playlist mode
    useEffect(() => {
        if (
            defaultMode === 'playlist' &&
            !playlistPreview &&
            !isLoadingPreview
        ) {
            const url = getValues('url')
            if (url) {
                handlePlaylistPreview()
            }
        }
    }, [
        defaultMode,
        playlistPreview,
        isLoadingPreview,
        getValues,
        handlePlaylistPreview,
    ])

    // Playlist import handler
    const handlePlaylistImport = async () => {
        const formData = getValues()
        if (!formData.url) {
            setPlaylistError('Please enter a playlist URL')
            return
        }

        setPlaylistError(null)
        setIsImportingPlaylist(true)

        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: formData.url,
                    tagIds: selectedTagIds,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to import playlist')
            }

            toast.success('Playlist imported successfully!')
            setPlaylistPreview(null)
            onPlaylistImported?.()
            onReset()
        } catch (error) {
            console.error('Failed to import playlist:', error)
            setPlaylistError(
                error instanceof Error
                    ? error.message
                    : 'Failed to import playlist',
            )
        } finally {
            setIsImportingPlaylist(false)
        }
    }

    // Cancel playlist preview
    const handleCancelPlaylistPreview = () => {
        setPlaylistPreview(null)
        setPlaylistError(null)
    }

    return (
        <div className={`space-y-6`}>
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

            {/* Mode Toggle - Video/Series/Playlist */}
            <ModeToggle
                mode={mode}
                onChange={(newMode) => {
                    setMode(newMode)
                    // Reset playlist preview when switching modes
                    if (newMode !== 'playlist') {
                        setPlaylistPreview(null)
                        setPlaylistError(null)
                    }
                }}
                disabled={
                    isSubmitting || isSubmittingSeries || isImportingPlaylist
                }
            />

            {/* Platform Suggestions - Only for video/series modes */}
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

            {/* Metadata Selector - Only for video/series modes */}
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

            {/* Playlist Preview - Only shown in playlist mode */}
            {mode === 'playlist' && (
                <div className='space-y-4'>
                    {playlistPreview ? (
                        <div className='p-4 bg-muted/50 rounded-lg space-y-4'>
                            <h3 className='font-medium'>Playlist Preview</h3>
                            <div className='flex gap-4'>
                                {playlistPreview.thumbnailUrl && (
                                    <img
                                        src={playlistPreview.thumbnailUrl}
                                        alt={playlistPreview.title}
                                        className='w-32 h-20 object-cover rounded'
                                    />
                                )}
                                <div className='flex-1 min-w-0'>
                                    <p className='font-semibold truncate'>
                                        {playlistPreview.title}
                                    </p>
                                    <p className='text-sm text-muted-foreground'>
                                        {playlistPreview.channelTitle}
                                    </p>
                                    <p className='text-sm text-muted-foreground'>
                                        {playlistPreview.itemCount} videos
                                    </p>
                                </div>
                            </div>
                            {playlistPreview.description && (
                                <p className='text-sm text-muted-foreground line-clamp-2'>
                                    {playlistPreview.description}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className='p-4 bg-muted/50 rounded-lg'>
                            <p className='text-sm text-muted-foreground text-center'>
                                Enter a YouTube playlist URL above and click
                                &quot;Preview&quot; to see playlist details
                                before importing.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Schedule Fields - Only shown in Series mode */}
            {mode === 'series' && (
                <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                    <ScheduleSelector
                        scheduleType={scheduleType}
                        scheduleValue={scheduleValue}
                        onTypeChange={setScheduleType}
                        onValueChange={setScheduleValue}
                        onEndDateChange={setEndDate}
                        onTotalEpisodesChange={setTotalEpisodes}
                        disabled={isSubmitting || isSubmittingSeries}
                    />

                    <div className='grid grid-cols-2 gap-4'>
                        <DatePickerField
                            id='start-date'
                            label='Start Date'
                            value={startDate}
                            onChange={(date) =>
                                setStartDate(
                                    date ||
                                        new Date().toISOString().split('T')[0],
                                )
                            }
                            required
                            disabled={isSubmitting || isSubmittingSeries}
                        />
                        <DatePickerField
                            id='end-date'
                            label={
                                scheduleType === 'dates'
                                    ? 'End Date (Auto)'
                                    : 'End Date (Optional)'
                            }
                            value={endDate}
                            onChange={setEndDate}
                            disabled={
                                isSubmitting ||
                                isSubmittingSeries ||
                                scheduleType === 'dates'
                            }
                        />
                    </div>

                    {/* Episode Count */}
                    <div className='space-y-1.5'>
                        <Label
                            htmlFor='series-total-episodes'
                            className='text-sm'
                        >
                            {scheduleType === 'dates'
                                ? 'Total Episodes (Auto)'
                                : 'Total Episodes (Optional)'}
                        </Label>
                        <Input
                            id='series-total-episodes'
                            type='number'
                            min='1'
                            placeholder={
                                scheduleType === 'dates'
                                    ? 'Calculated from dates'
                                    : 'e.g., 12 - leave empty if unknown'
                            }
                            value={totalEpisodes}
                            onChange={(e) => setTotalEpisodes(e.target.value)}
                            disabled={
                                isSubmitting ||
                                isSubmittingSeries ||
                                scheduleType === 'dates'
                            }
                        />
                    </div>

                    {/* Auto-advance total episodes checkbox */}
                    <div className='flex items-start space-x-2'>
                        <Checkbox
                            id='auto-advance-episodes'
                            checked={autoAdvanceTotalEpisodes}
                            onChange={(e) =>
                                setAutoAdvanceTotalEpisodes(e.target.checked)
                            }
                            disabled={isSubmitting || isSubmittingSeries}
                        />
                        <div className='space-y-1'>
                            <Label
                                htmlFor='auto-advance-episodes'
                                className='text-sm cursor-pointer'
                            >
                                Auto-advance total episodes
                            </Label>
                            <p className='text-xs text-muted-foreground'>
                                Automatically increase total episodes when new
                                episodes are released
                            </p>
                        </div>
                    </div>

                    {/* Save as default mode checkbox */}
                    <div className='flex items-center space-x-2'>
                        <Checkbox
                            id='save-default'
                            checked={saveAsDefault}
                            onChange={(e) => setSaveAsDefault(e.target.checked)}
                            disabled={isSubmitting || isSubmittingSeries}
                        />
                        <Label
                            htmlFor='save-default'
                            className='text-sm text-muted-foreground cursor-pointer'
                        >
                            Save as default mode for this platform
                        </Label>
                    </div>
                </div>
            )}

            {/* Tags - For all modes */}
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

            {/* Action Buttons */}
            <div className='flex gap-2'>
                <Button
                    type='button'
                    variant='secondary'
                    className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    onClick={() => {
                        if (mode === 'playlist') {
                            handleCancelPlaylistPreview()
                        }
                        onReset()
                    }}
                    disabled={
                        isSubmitting ||
                        isSubmittingSeries ||
                        isImportingPlaylist
                    }
                >
                    Reset
                </Button>
                {mode === 'video' ? (
                    <SubmitButton
                        isLoading={isSubmitting}
                        disabled={isSubmitting || isSubmittingSeries}
                        className='flex-1'
                    />
                ) : mode === 'series' ? (
                    <Button
                        type='button'
                        onClick={handleSeriesSubmit}
                        disabled={isSubmitting || isSubmittingSeries}
                        className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    >
                        {isSubmittingSeries ? 'Adding...' : 'Add Series'}
                    </Button>
                ) : playlistPreview ? (
                    <Button
                        type='button'
                        onClick={handlePlaylistImport}
                        disabled={isImportingPlaylist}
                        className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    >
                        {isImportingPlaylist
                            ? 'Importing...'
                            : `Import ${playlistPreview.itemCount} Videos`}
                    </Button>
                ) : (
                    <Button
                        type='button'
                        onClick={handlePlaylistPreview}
                        disabled={isLoadingPreview}
                        className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    >
                        {isLoadingPreview ? 'Loading...' : 'Preview Playlist'}
                    </Button>
                )}
            </div>

            {/* Error Messages */}
            {submitError && mode === 'video' && (
                <p className='text-sm text-destructive text-center'>
                    {submitError}
                </p>
            )}
            {seriesError && mode === 'series' && (
                <p className='text-sm text-destructive text-center'>
                    {seriesError}
                </p>
            )}
            {playlistError && mode === 'playlist' && (
                <p className='text-sm text-destructive text-center'>
                    {playlistError}
                </p>
            )}
        </div>
    )
}
