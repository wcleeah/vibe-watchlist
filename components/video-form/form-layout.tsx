'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { ScheduleProgressSection } from '@/components/series/schedule-progress-section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePlatforms } from '@/hooks/use-platforms'
import { useTags } from '@/hooks/use-tags'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import { SeriesService } from '@/lib/services/series-service'
import type { VideoFormData, VideoSuggestions } from '@/types/form'
import type { PlaylistImportPreview } from '@/types/playlist'
import type {
    BulkSeasonData,
    ContentMode,
    ScheduleType,
    ScheduleValue,
} from '@/types/series'
import { getDefaultScheduleValue } from '@/types/series'
import type { Tag } from '@/types/tag'
import { DatePickerField } from './date-picker-field'
import { MetadataSelector } from './metadata-selector'
import { ModeToggle } from './mode-toggle'
import { PlatformSuggestions } from './platform-suggestions'
import { SubmitButton } from './submit-button'
import { TagInput } from './tag-input'

interface LocalSeason {
    seasonNumber: number
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate: string | undefined
    isActive: boolean
    episodesAired: string
    episodesRemaining: string
    episodesWatched: string
}

function makeBlankSeason(seasonNumber: number): LocalSeason {
    return {
        seasonNumber,
        scheduleType: 'none',
        scheduleValue: {},
        startDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
        isActive: true,
        episodesAired: '0',
        episodesRemaining: '',
        episodesWatched: '0',
    }
}

function localSeasonToBulk(s: LocalSeason): BulkSeasonData {
    const episodesAired = s.episodesAired
        ? parseInt(s.episodesAired, 10)
        : undefined
    const episodesRemaining = s.episodesRemaining
        ? parseInt(s.episodesRemaining, 10)
        : undefined
    const episodesWatched = s.episodesWatched
        ? parseInt(s.episodesWatched, 10)
        : undefined

    return {
        seasonNumber: s.seasonNumber,
        scheduleType: s.scheduleType,
        scheduleValue: s.scheduleValue,
        startDate: s.startDate,
        endDate: s.endDate || null,
        isActive: s.isActive,
        episodesAired:
            episodesAired !== undefined && !Number.isNaN(episodesAired)
                ? episodesAired
                : 0,
        episodesRemaining:
            episodesRemaining !== undefined && !Number.isNaN(episodesRemaining)
                ? episodesRemaining
                : null,
        episodesWatched:
            episodesWatched !== undefined && !Number.isNaN(episodesWatched)
                ? episodesWatched
                : 0,
    }
}

interface FormLayoutProps {
    isSubmitting: boolean
    submitError: string | null
    suggestions?: VideoSuggestions
    aiMetadataError?: string | null
    onReset: () => void
    onPlatformSuggestionsDismiss?: () => void
    defaultMode?: ContentMode
    comingSoonId?: string | null
    onSeriesCreated?: () => void
    onPlaylistImported?: () => void
    onComingSoonCreated?: () => void
}

export function FormLayout({
    isSubmitting,
    submitError,
    suggestions = { ai: [], platform: [] },
    aiMetadataError,
    onReset,
    onPlatformSuggestionsDismiss,
    defaultMode = 'video',
    comingSoonId,
    onSeriesCreated,
    onPlaylistImported,
    onComingSoonCreated,
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
    const [seriesTypeTab, setSeriesTypeTab] = useState<'single' | 'seasons'>(
        'single',
    )
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState<string | undefined>(undefined)
    const [episodesAired, setEpisodesAired] = useState<string>('0')
    const [episodesRemaining, setEpisodesRemaining] = useState<string>('')
    const [episodesWatched, setEpisodesWatched] = useState<string>('0')
    const [localSeasons, setLocalSeasons] = useState<LocalSeason[]>([
        makeBlankSeason(1),
    ])
    const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number>(0)
    const [saveAsDefault, setSaveAsDefault] = useState(false)
    const [seriesError, setSeriesError] = useState<string | null>(null)
    const [isSubmittingSeries, setIsSubmittingSeries] = useState(false)

    // Playlist mode state
    const [playlistPreview, setPlaylistPreview] =
        useState<PlaylistImportPreview | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isImportingPlaylist, setIsImportingPlaylist] = useState(false)
    const [playlistError, setPlaylistError] = useState<string | null>(null)
    const [cascadeWatched, setCascadeWatched] = useState(true)
    const [autoComplete, setAutoComplete] = useState(true)

    // Coming Soon mode state
    const [comingSoonReleaseDate, setComingSoonReleaseDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [comingSoonReleaseTime, setComingSoonReleaseTime] = useState<
        string | undefined
    >(undefined)
    const [comingSoonError, setComingSoonError] = useState<string | null>(null)
    const [isSubmittingComingSoon, setIsSubmittingComingSoon] = useState(false)

    // Update mode when defaultMode changes
    useEffect(() => {
        setMode(defaultMode)
    }, [defaultMode])

    // Mark coming soon item as transformed
    const markComingSoonTransformed = async () => {
        if (!comingSoonId) return
        try {
            await fetch(`/api/coming-soon/${comingSoonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transformedAt: new Date().toISOString(),
                }),
            })
        } catch (err) {
            console.error(
                'Failed to mark coming soon item as transformed:',
                err,
            )
        }
    }

    // Platform suggestion handlers
    const acceptPlatformSuggestion = async (suggestion: PlatformSuggestion) => {
        try {
            const normalizedPlatformId = suggestion.platform.toLowerCase()
            const newPlatform = await addPlatform({
                platformId: normalizedPlatformId,
                name: normalizedPlatformId,
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

    const selectedSeason =
        localSeasons.length > 0 ? localSeasons[selectedSeasonIdx] : null

    const updateSelectedSeason = (updates: Partial<LocalSeason>) => {
        setLocalSeasons((prev) => {
            const next = [...prev]
            if (next[selectedSeasonIdx]) {
                next[selectedSeasonIdx] = {
                    ...next[selectedSeasonIdx],
                    ...updates,
                }
            }
            return next
        })
    }

    const addSeason = () => {
        const maxNum = localSeasons.reduce(
            (max, s) => Math.max(max, s.seasonNumber),
            0,
        )
        const newSeason = makeBlankSeason(maxNum + 1)
        setLocalSeasons((prev) => [...prev, newSeason])
        setSelectedSeasonIdx(localSeasons.length)
    }

    const deleteSeason = () => {
        if (localSeasons.length <= 1) return
        setLocalSeasons((prev) =>
            prev.filter((_, i) => i !== selectedSeasonIdx),
        )
        setSelectedSeasonIdx((prev) => Math.max(0, prev - 1))
    }

    // Series submission handler
    const handleSeriesSubmit = async () => {
        const formData = getValues()
        setSeriesError(null)
        setIsSubmittingSeries(true)

        try {
            if (seriesTypeTab === 'seasons') {
                await SeriesService.create({
                    url: formData.url,
                    title: formData.title,
                    platform: formData.platform || 'unknown',
                    thumbnailUrl: formData.thumbnailUrl || undefined,
                    tagIds: selectedTagIds,
                    hasSeasons: true,
                    seasons: localSeasons.map(localSeasonToBulk),
                })
            } else {
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
                    episodesAired: episodesAired
                        ? parseInt(episodesAired, 10)
                        : undefined,
                    episodesRemaining: episodesRemaining
                        ? parseInt(episodesRemaining, 10)
                        : undefined,
                    episodesWatched: episodesWatched
                        ? parseInt(episodesWatched, 10)
                        : undefined,
                    hasSeasons: false,
                })
            }

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
            await markComingSoonTransformed()
            setSeriesTypeTab('single')
            setScheduleType('weekly')
            setScheduleValue({ days: ['friday'] })
            setStartDate(new Date().toISOString().split('T')[0])
            setEndDate(undefined)
            setEpisodesAired('0')
            setEpisodesRemaining('')
            setEpisodesWatched('0')
            setLocalSeasons([makeBlankSeason(1)])
            setSelectedSeasonIdx(0)
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
                    cascadeWatched,
                    autoComplete,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to import playlist')
            }

            toast.success('Playlist imported successfully!')
            await markComingSoonTransformed()
            setPlaylistPreview(null)
            setCascadeWatched(true)
            setAutoComplete(true)
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
        setCascadeWatched(true)
        setAutoComplete(true)
    }

    // Coming Soon submission handler
    const handleComingSoonSubmit = async () => {
        const formData = getValues()
        setComingSoonError(null)
        setIsSubmittingComingSoon(true)

        try {
            const response = await fetch('/api/coming-soon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: formData.url,
                    title: formData.title,
                    platform: formData.platform || 'unknown',
                    thumbnailUrl: formData.thumbnailUrl || undefined,
                    releaseDate: comingSoonReleaseDate,
                    releaseTime: comingSoonReleaseTime || undefined,
                    tagIds: selectedTagIds,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to add coming soon item')
            }

            toast.success('Coming soon item added!')
            onComingSoonCreated?.()
            onReset()
        } catch (error) {
            console.error('Failed to add coming soon item:', error)
            setComingSoonError(
                error instanceof Error
                    ? error.message
                    : 'Failed to add coming soon item',
            )
        } finally {
            setIsSubmittingComingSoon(false)
        }
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
                          : mode === 'coming-soon'
                            ? 'Coming Soon'
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
                    // Reset coming soon error when switching modes
                    if (newMode !== 'coming-soon') {
                        setComingSoonError(null)
                    }
                }}
                disabled={
                    isSubmitting ||
                    isSubmittingSeries ||
                    isImportingPlaylist ||
                    isSubmittingComingSoon
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
                    disabled={
                        isSubmitting ||
                        isSubmittingSeries ||
                        isSubmittingComingSoon
                    }
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
                            {/* Cascade watched setting */}
                            <div className='flex items-start space-x-2 pt-2 border-t border-muted'>
                                <input
                                    type='checkbox'
                                    id='cascade-watched'
                                    checked={cascadeWatched}
                                    onChange={(e) =>
                                        setCascadeWatched(e.target.checked)
                                    }
                                    disabled={isImportingPlaylist}
                                    className='h-4 w-4 rounded border-gray-300 mt-1'
                                />
                                <div className='space-y-1'>
                                    <Label
                                        htmlFor='cascade-watched'
                                        className='cursor-pointer'
                                    >
                                        Mark previous videos as watched
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>
                                        When marking a video as watched, also
                                        mark all earlier videos in the playlist
                                    </p>
                                </div>
                            </div>
                            {/* Auto-complete setting */}
                            <div className='flex items-start space-x-2'>
                                <input
                                    type='checkbox'
                                    id='auto-complete'
                                    checked={autoComplete}
                                    onChange={(e) =>
                                        setAutoComplete(e.target.checked)
                                    }
                                    disabled={isImportingPlaylist}
                                    className='h-4 w-4 rounded border-gray-300 mt-1'
                                />
                                <div className='space-y-1'>
                                    <Label
                                        htmlFor='auto-complete'
                                        className='cursor-pointer'
                                    >
                                        Auto-mark as completed
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>
                                        Automatically mark playlist as completed
                                        when all videos are watched
                                    </p>
                                </div>
                            </div>
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
                    <div className='space-y-2'>
                        <Label>Series Type</Label>
                        <div className='inline-flex rounded-md border border-border p-1 bg-background'>
                            <button
                                type='button'
                                onClick={() => setSeriesTypeTab('single')}
                                disabled={isSubmitting || isSubmittingSeries}
                                className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                                    seriesTypeTab === 'single'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Single
                            </button>
                            <button
                                type='button'
                                onClick={() => setSeriesTypeTab('seasons')}
                                disabled={isSubmitting || isSubmittingSeries}
                                className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                                    seriesTypeTab === 'seasons'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Seasons
                            </button>
                        </div>
                    </div>

                    {seriesTypeTab === 'single' ? (
                        <ScheduleProgressSection
                            disabled={isSubmitting || isSubmittingSeries}
                            scheduleType={scheduleType}
                            scheduleValue={scheduleValue}
                            onScheduleTypeChange={setScheduleType}
                            onScheduleValueChange={setScheduleValue}
                            onScheduleEndDateChange={setEndDate}
                            onScheduleTotalEpisodesChange={setEpisodesRemaining}
                            startDateId='start-date'
                            startDate={startDate}
                            onStartDateChange={setStartDate}
                            endDateId='end-date'
                            endDateLabel={
                                scheduleType === 'dates'
                                    ? 'End Date (Auto)'
                                    : 'End Date (Optional)'
                            }
                            endDate={endDate}
                            onEndDateChange={setEndDate}
                            endDateDisabled={scheduleType === 'dates'}
                            episodesAired={episodesAired}
                            onEpisodesAiredChange={setEpisodesAired}
                            episodesWatched={episodesWatched}
                            onEpisodesWatchedChange={setEpisodesWatched}
                            episodesRemaining={episodesRemaining}
                            onEpisodesRemainingChange={setEpisodesRemaining}
                            episodesRemainingLabel={
                                scheduleType === 'dates'
                                    ? 'Episodes Remaining (Auto)'
                                    : 'Episodes Remaining (Optional)'
                            }
                            episodesRemainingPlaceholder={
                                scheduleType === 'dates'
                                    ? 'Calculated from dates'
                                    : 'e.g., 12 - leave empty if unknown'
                            }
                            episodesRemainingDisabled={scheduleType === 'dates'}
                        />
                    ) : (
                        <div className='space-y-4'>
                            <div className='flex items-center gap-2'>
                                <select
                                    value={selectedSeasonIdx}
                                    onChange={(e) =>
                                        setSelectedSeasonIdx(
                                            Number(e.target.value),
                                        )
                                    }
                                    disabled={
                                        isSubmitting ||
                                        isSubmittingSeries ||
                                        localSeasons.length === 0
                                    }
                                    className='flex-1 h-9 rounded-md border border-input bg-background pl-3 pr-10 text-sm'
                                >
                                    {localSeasons.map((s, i) => (
                                        <option
                                            key={`${s.seasonNumber}-${i}`}
                                            value={i}
                                        >
                                            Season {s.seasonNumber}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    type='button'
                                    variant='secondary'
                                    size='sm'
                                    onClick={addSeason}
                                    disabled={
                                        isSubmitting || isSubmittingSeries
                                    }
                                >
                                    Add
                                </Button>
                                <Button
                                    type='button'
                                    variant='secondary'
                                    size='sm'
                                    onClick={deleteSeason}
                                    disabled={
                                        isSubmitting ||
                                        isSubmittingSeries ||
                                        localSeasons.length <= 1
                                    }
                                >
                                    Delete
                                </Button>
                            </div>

                            {selectedSeason && (
                                <div className='space-y-4 rounded-lg bg-background p-4 border border-border'>
                                    <div className='grid grid-cols-1 gap-3'>
                                        <div className='space-y-2'>
                                            <Label>Season #</Label>
                                            <Input
                                                type='number'
                                                min='1'
                                                value={
                                                    selectedSeason.seasonNumber
                                                }
                                                onChange={(e) =>
                                                    updateSelectedSeason({
                                                        seasonNumber:
                                                            parseInt(
                                                                e.target.value,
                                                                10,
                                                            ) || 1,
                                                    })
                                                }
                                                disabled={
                                                    isSubmitting ||
                                                    isSubmittingSeries
                                                }
                                            />
                                        </div>
                                    </div>

                                    <ScheduleProgressSection
                                        disabled={
                                            isSubmitting || isSubmittingSeries
                                        }
                                        scheduleType={
                                            selectedSeason.scheduleType
                                        }
                                        scheduleValue={
                                            selectedSeason.scheduleValue
                                        }
                                        onScheduleTypeChange={(type) =>
                                            updateSelectedSeason({
                                                scheduleType: type,
                                                scheduleValue:
                                                    getDefaultScheduleValue(
                                                        type,
                                                    ),
                                            })
                                        }
                                        onScheduleValueChange={(val) =>
                                            updateSelectedSeason({
                                                scheduleValue: val,
                                            })
                                        }
                                        onScheduleEndDateChange={(d) =>
                                            updateSelectedSeason({ endDate: d })
                                        }
                                        onScheduleTotalEpisodesChange={(val) =>
                                            updateSelectedSeason({
                                                episodesRemaining: val,
                                            })
                                        }
                                        startDateId={`new-series-season-start-${selectedSeasonIdx}`}
                                        startDate={selectedSeason.startDate}
                                        onStartDateChange={(d) =>
                                            updateSelectedSeason({
                                                startDate: d,
                                            })
                                        }
                                        endDateId={`new-series-season-end-${selectedSeasonIdx}`}
                                        endDateLabel='End Date (optional)'
                                        endDate={selectedSeason.endDate}
                                        onEndDateChange={(d) =>
                                            updateSelectedSeason({ endDate: d })
                                        }
                                        episodesAired={
                                            selectedSeason.episodesAired
                                        }
                                        onEpisodesAiredChange={(value) =>
                                            updateSelectedSeason({
                                                episodesAired: value,
                                            })
                                        }
                                        episodesWatched={
                                            selectedSeason.episodesWatched
                                        }
                                        onEpisodesWatchedChange={(value) =>
                                            updateSelectedSeason({
                                                episodesWatched: value,
                                            })
                                        }
                                        episodesRemaining={
                                            selectedSeason.episodesRemaining
                                        }
                                        onEpisodesRemainingChange={(value) =>
                                            updateSelectedSeason({
                                                episodesRemaining: value,
                                            })
                                        }
                                        episodesRemainingLabel='Episodes Remaining'
                                        activeControl={{
                                            id: `new-series-season-active-${selectedSeasonIdx}`,
                                            checked: selectedSeason.isActive,
                                            onChange: (checked) =>
                                                updateSelectedSeason({
                                                    isActive: checked,
                                                }),
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save as default mode checkbox */}
                    <div className='flex items-center space-x-2'>
                        <input
                            type='checkbox'
                            id='save-default'
                            checked={saveAsDefault}
                            onChange={(e) => setSaveAsDefault(e.target.checked)}
                            disabled={isSubmitting || isSubmittingSeries}
                            className='h-4 w-4 rounded border-gray-300'
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

            {/* Coming Soon Fields - Only shown in Coming Soon mode */}
            {mode === 'coming-soon' && (
                <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                    <DatePickerField
                        id='coming-soon-release-date'
                        label='Release Date'
                        value={comingSoonReleaseDate}
                        onChange={(date) =>
                            setComingSoonReleaseDate(
                                date || new Date().toISOString().split('T')[0],
                            )
                        }
                        required
                        disabled={isSubmitting || isSubmittingComingSoon}
                        showTimePicker
                        timeValue={comingSoonReleaseTime}
                        onTimeChange={setComingSoonReleaseTime}
                    />
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
                    isImportingPlaylist ||
                    isSubmittingComingSoon
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
                        isImportingPlaylist ||
                        isSubmittingComingSoon
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
                ) : mode === 'coming-soon' ? (
                    <Button
                        type='button'
                        onClick={handleComingSoonSubmit}
                        disabled={isSubmitting || isSubmittingComingSoon}
                        className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    >
                        {isSubmittingComingSoon
                            ? 'Adding...'
                            : 'Add Coming Soon'}
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
            {comingSoonError && mode === 'coming-soon' && (
                <p className='text-sm text-destructive text-center'>
                    {comingSoonError}
                </p>
            )}
        </div>
    )
}
