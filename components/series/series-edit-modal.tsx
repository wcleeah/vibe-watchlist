'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ScheduleProgressSection } from '@/components/series/schedule-progress-section'
import { TabSwitcher } from '@/components/shared/tab-switcher'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagList } from '@/components/ui/tag'
import { useTags } from '@/hooks/use-tags'
import { ScheduleService } from '@/lib/services/schedule-service'
import { SeasonService } from '@/lib/services/season-service'
import { SeriesService } from '@/lib/services/series-service'
import type {
    BulkSeasonData,
    ScheduleType,
    ScheduleValue,
    Season,
    SeriesWithTags,
} from '@/types/series'
import { getDefaultScheduleValue } from '@/types/series'

interface SeriesEditModalProps {
    series: SeriesWithTags | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const editSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    thumbnailUrl: z.string().optional(),
    tagIds: z.array(z.number()),
    isActive: z.boolean(),
    episodesAired: z.string().optional(),
    episodesRemaining: z.string().optional(),
    episodesWatched: z.string().optional(),
})

type EditFormData = z.infer<typeof editSchema>

// Local season state for inline editing
interface LocalSeason {
    /** Present for existing DB seasons, undefined for newly added */
    id?: number
    seasonNumber: number
    title: string
    url: string
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
        title: '',
        url: '',
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

function apiSeasonToLocal(s: Season): LocalSeason {
    return {
        id: s.id,
        seasonNumber: s.seasonNumber,
        title: s.title || '',
        url: s.url || '',
        scheduleType: s.scheduleType as ScheduleType,
        scheduleValue: s.scheduleValue,
        startDate: s.startDate?.split('T')[0] || '',
        endDate: s.endDate?.split('T')[0],
        isActive: s.isActive,
        episodesAired: String(s.episodesAired ?? 0),
        episodesRemaining:
            s.episodesRemaining != null ? String(s.episodesRemaining) : '',
        episodesWatched: String(s.episodesWatched ?? 0),
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
        id: s.id,
        seasonNumber: s.seasonNumber,
        title: s.title || undefined,
        url: s.url || undefined,
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

function getNowDateTimeLocal(): string {
    const now = new Date()
    now.setSeconds(0, 0)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}`
}

const MODE_TABS = [
    { id: 'single', label: 'Single' },
    { id: 'seasons', label: 'Seasons' },
]

export function SeriesEditModal({
    series,
    open,
    onOpenChange,
    onSuccess,
}: SeriesEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { tags: availableTags, addTag: addNewTag } = useTags()
    const [tagInput, setTagInput] = useState('')
    const [isLoadingTags, setIsLoadingTags] = useState(false)

    // Mode: 'single' or 'seasons'
    const [activeTab, setActiveTab] = useState<string>('single')

    // Seasons local state
    const [localSeasons, setLocalSeasons] = useState<LocalSeason[]>([])
    const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number>(0)
    const [isLoadingSeasons, setIsLoadingSeasons] = useState(false)

    // Schedule state (managed separately from form — used by Single tab)
    const [scheduleType, setScheduleType] = useState<ScheduleType>('weekly')
    const [scheduleValue, setScheduleValue] = useState<ScheduleValue>({
        days: ['friday'],
    })
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState<string | undefined>(undefined)
    const [resumeTrackingAt, setResumeTrackingAt] = useState<string>(
        getNowDateTimeLocal(),
    )

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<EditFormData>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            title: '',
            thumbnailUrl: '',
            tagIds: [],
            isActive: true,
            episodesAired: '0',
            episodesRemaining: '',
            episodesWatched: '0',
        },
    })

    const formTagIds = watch('tagIds') || []
    const selectedTags = availableTags.filter((tag) =>
        formTagIds.includes(tag.id),
    )

    // Reset form when series changes
    useEffect(() => {
        if (series && open) {
            // Set series-level fields
            reset({
                title: series.title || '',
                thumbnailUrl: series.thumbnailUrl || '',
                tagIds: series.tags?.map((t) => t.id) || [],
                isActive: series.isActive,
                episodesAired: String(series.episodesAired ?? 0),
                episodesRemaining:
                    series.episodesRemaining != null
                        ? String(series.episodesRemaining)
                        : '',
                episodesWatched: String(series.episodesWatched ?? 0),
            })
            setScheduleType(series.scheduleType as ScheduleType)
            setScheduleValue(series.scheduleValue)
            setStartDate(series.startDate?.split('T')[0])
            setEndDate(series.endDate?.split('T')[0])
            setResumeTrackingAt(getNowDateTimeLocal())
            setTagInput('')

            // Set active tab based on current series state
            setActiveTab(series.hasSeasons ? 'seasons' : 'single')

            // Load seasons if series has them
            if (series.hasSeasons) {
                setIsLoadingSeasons(true)
                SeasonService.getAll(series.id)
                    .then((fetched) => {
                        setLocalSeasons(fetched.map(apiSeasonToLocal))
                        setSelectedSeasonIdx(0)
                    })
                    .catch((err) => {
                        console.error('Failed to fetch seasons:', err)
                        setLocalSeasons([])
                        setSelectedSeasonIdx(0)
                    })
                    .finally(() => {
                        setIsLoadingSeasons(false)
                    })
            } else {
                setIsLoadingSeasons(false)
                setLocalSeasons([])
                setSelectedSeasonIdx(0)
            }
        }
    }, [series, open, reset])

    // --- Season inline editing helpers ---

    const selectedSeason =
        localSeasons.length > 0 ? localSeasons[selectedSeasonIdx] : null

    const updateSelectedSeason = useCallback(
        (updates: Partial<LocalSeason>) => {
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
        },
        [selectedSeasonIdx],
    )

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
        if (localSeasons.length === 0) return
        setLocalSeasons((prev) =>
            prev.filter((_, i) => i !== selectedSeasonIdx),
        )
        setSelectedSeasonIdx((prev) => Math.max(0, prev - 1))
    }

    // --- Tag helpers ---

    const addTag = async (tagName: string) => {
        if (!tagName) return

        if (
            selectedTags.some(
                (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
            )
        ) {
            toast.error('Tag already added')
            return
        }

        const existingTag = availableTags.find(
            (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
        )
        if (existingTag) {
            setValue('tagIds', [...formTagIds, existingTag.id])
            setTagInput('')
            return
        }

        setIsLoadingTags(true)
        try {
            const newTag = await addNewTag(tagName)
            if (newTag) {
                setValue('tagIds', [...formTagIds, newTag.id])
                setTagInput('')
            } else {
                toast.error('Failed to create tag')
            }
        } catch (error) {
            console.error('Error creating tag:', error)
            toast.error('Failed to create tag')
        } finally {
            setIsLoadingTags(false)
        }
    }

    const removeTag = (tagId: number) => {
        setValue(
            'tagIds',
            formTagIds.filter((id) => id !== tagId),
        )
    }

    const filteredSuggestions = availableTags
        .filter(
            (tag) =>
                tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                !selectedTags.some((selected) => selected.id === tag.id),
        )
        .slice(0, 5)

    // --- Submit ---

    const onSubmit = async (data: EditFormData) => {
        if (!series?.id) return

        setIsSubmitting(true)
        try {
            if (activeTab === 'single') {
                // Single mode: save everything to series, clear seasons
                const episodesAired = data.episodesAired
                    ? parseInt(data.episodesAired, 10)
                    : undefined
                const episodesRemaining = data.episodesRemaining
                    ? parseInt(data.episodesRemaining, 10)
                    : undefined
                const episodesWatched = data.episodesWatched
                    ? parseInt(data.episodesWatched, 10)
                    : undefined

                await SeriesService.update(series.id, {
                    title: data.title,
                    thumbnailUrl: data.thumbnailUrl || undefined,
                    scheduleType,
                    scheduleValue,
                    resumeTrackingAt: resumeTrackingAt
                        ? new Date(resumeTrackingAt).toISOString()
                        : undefined,
                    startDate,
                    endDate: endDate || null,
                    tagIds: data.tagIds,
                    isActive: data.isActive,
                    episodesAired:
                        episodesAired !== undefined &&
                        !Number.isNaN(episodesAired)
                            ? episodesAired
                            : undefined,
                    episodesRemaining:
                        episodesRemaining !== undefined &&
                        !Number.isNaN(episodesRemaining)
                            ? episodesRemaining
                            : null,
                    episodesWatched:
                        episodesWatched !== undefined &&
                        !Number.isNaN(episodesWatched)
                            ? episodesWatched
                            : undefined,
                    hasSeasons: false,
                })
            } else {
                // Seasons mode: save series-level fields + bulk seasons
                await SeriesService.update(series.id, {
                    title: data.title,
                    thumbnailUrl: data.thumbnailUrl || undefined,
                    tagIds: data.tagIds,
                    hasSeasons: localSeasons.length > 0,
                    seasons: localSeasons.map(localSeasonToBulk),
                })
            }

            toast.success('Series updated successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating series:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update series',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!series) return null

    const getSeasonSelectLabel = (season: LocalSeason) => {
        const scheduleText = ScheduleService.formatScheduleDisplay(
            season.scheduleType,
            season.scheduleValue,
        )
        const rangeText = season.startDate
            ? `${season.startDate}${season.endDate ? ` to ${season.endDate}` : ''}`
            : 'No start date'
        return `Season ${season.seasonNumber}${season.title ? ` — ${season.title}` : ''} · ${scheduleText} · ${rangeText}`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className='max-h-[92vh] overflow-y-auto'
                style={{ width: '96vw', maxWidth: '88rem' }}
            >
                <DialogHeader>
                    <DialogTitle>Edit Series</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    {/* Title */}
                    <div className='space-y-2'>
                        <Label htmlFor='title'>Title</Label>
                        <Input
                            id='title'
                            {...register('title')}
                            placeholder='Enter series title'
                            disabled={isSubmitting}
                        />
                        {errors.title && (
                            <p className='text-sm text-red-600'>
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    {/* Thumbnail URL */}
                    <div className='space-y-2'>
                        <Label htmlFor='thumbnailUrl'>Thumbnail URL</Label>
                        <Input
                            id='thumbnailUrl'
                            {...register('thumbnailUrl')}
                            placeholder='https://example.com/thumbnail.jpg'
                            disabled={isSubmitting}
                        />
                        {watch('thumbnailUrl') && (
                            <div className='mt-2'>
                                <div className='relative w-full max-w-xs aspect-video rounded overflow-hidden border'>
                                    <Image
                                        src={watch('thumbnailUrl') || ''}
                                        alt='Thumbnail preview'
                                        fill
                                        className='object-cover'
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mode switcher */}
                    <TabSwitcher
                        tabs={MODE_TABS}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    {/* ===== Single tab ===== */}
                    {activeTab === 'single' && (
                        <ScheduleProgressSection
                            disabled={isSubmitting}
                            scheduleType={scheduleType}
                            scheduleValue={scheduleValue}
                            onScheduleTypeChange={setScheduleType}
                            onScheduleValueChange={setScheduleValue}
                            onScheduleEndDateChange={setEndDate}
                            onScheduleTotalEpisodesChange={(value) =>
                                setValue('episodesRemaining', value)
                            }
                            startDateId='edit-start-date'
                            startDate={startDate}
                            onStartDateChange={setStartDate}
                            endDateId='edit-end-date'
                            endDateLabel={
                                scheduleType === 'dates'
                                    ? 'End Date (Auto)'
                                    : 'End Date (Optional)'
                            }
                            endDate={endDate}
                            onEndDateChange={setEndDate}
                            endDateDisabled={scheduleType === 'dates'}
                            resumeTracking={{
                                id: 'resume-tracking-at',
                                value: resumeTrackingAt,
                                onChange: setResumeTrackingAt,
                                helperText:
                                    'Used as the anchor when schedule changes. Default is now.',
                            }}
                            episodesAired={watch('episodesAired') || '0'}
                            onEpisodesAiredChange={(value) =>
                                setValue('episodesAired', value)
                            }
                            episodesWatched={watch('episodesWatched') || '0'}
                            onEpisodesWatchedChange={(value) =>
                                setValue('episodesWatched', value)
                            }
                            episodesRemaining={watch('episodesRemaining') || ''}
                            onEpisodesRemainingChange={(value) =>
                                setValue('episodesRemaining', value)
                            }
                            episodesRemainingLabel={
                                scheduleType === 'dates'
                                    ? 'Remaining (Auto)'
                                    : 'Remaining'
                            }
                            episodesRemainingDisabled={scheduleType === 'dates'}
                            activeControl={{
                                id: 'isActive',
                                checked: watch('isActive'),
                                onChange: (checked) =>
                                    setValue('isActive', checked),
                            }}
                        />
                    )}

                    {/* ===== Seasons tab — inline season editing ===== */}
                    {activeTab === 'seasons' && (
                        <div className='space-y-4'>
                            {/* Season selector row */}
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
                                        localSeasons.length === 0
                                    }
                                    className='flex-1 h-9 rounded-md border border-input bg-background pl-3 pr-10 text-sm'
                                >
                                    {isLoadingSeasons && (
                                        <option value={0}>
                                            Loading seasons...
                                        </option>
                                    )}
                                    {!isLoadingSeasons &&
                                        localSeasons.length === 0 && (
                                            <option value={0}>
                                                No seasons
                                            </option>
                                        )}
                                    {localSeasons.map((s, i) => (
                                        <option key={i} value={i}>
                                            {getSeasonSelectLabel(s)}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    type='button'
                                    variant='secondary'
                                    size='sm'
                                    onClick={addSeason}
                                    disabled={isSubmitting}
                                >
                                    <Plus className='h-4 w-4 mr-1' />
                                    Add
                                </Button>
                                <Button
                                    type='button'
                                    variant='secondary'
                                    size='sm'
                                    onClick={deleteSeason}
                                    disabled={
                                        isSubmitting ||
                                        localSeasons.length === 0
                                    }
                                >
                                    <Trash2 className='h-4 w-4 mr-1' />
                                    Delete
                                </Button>
                            </div>

                            {/* Season form fields (inline) */}
                            {isLoadingSeasons ? (
                                <div className='p-4 bg-muted/50 rounded-lg text-center'>
                                    <div className='inline-flex items-center gap-2 text-sm text-muted-foreground'>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Loading seasons...
                                    </div>
                                </div>
                            ) : selectedSeason ? (
                                <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
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
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <ScheduleProgressSection
                                        disabled={isSubmitting}
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
                                        startDateId={`season-start-${selectedSeasonIdx}`}
                                        startDate={selectedSeason.startDate}
                                        onStartDateChange={(d) =>
                                            updateSelectedSeason({
                                                startDate: d,
                                            })
                                        }
                                        endDateId={`season-end-${selectedSeasonIdx}`}
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
                                        episodesRemainingLabel='Remaining'
                                        activeControl={{
                                            id: `season-active-${selectedSeasonIdx}`,
                                            checked: selectedSeason.isActive,
                                            onChange: (checked) =>
                                                updateSelectedSeason({
                                                    isActive: checked,
                                                }),
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className='p-4 bg-muted/50 rounded-lg text-center'>
                                    <p className='text-sm text-muted-foreground'>
                                        No seasons yet. Click &quot;Add&quot; to
                                        create your first season.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    <div className='space-y-2'>
                        <Label>Tags</Label>

                        {selectedTags.length > 0 && (
                            <TagList
                                tags={selectedTags}
                                onRemove={removeTag}
                                size='sm'
                            />
                        )}

                        <div className='flex gap-2'>
                            <Input
                                type='text'
                                placeholder='Add a tag'
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault()
                                        addTag(tagInput.trim())
                                    }
                                }}
                                disabled={isSubmitting || isLoadingTags}
                                className='flex-1'
                            />
                            <Button
                                type='button'
                                onClick={() => addTag(tagInput.trim())}
                                disabled={
                                    !tagInput.trim() ||
                                    isSubmitting ||
                                    isLoadingTags
                                }
                                className='h-9 min-h-0'
                            >
                                Add
                            </Button>
                        </div>

                        {filteredSuggestions.length > 0 && tagInput && (
                            <div className='border rounded-md p-2 space-y-1'>
                                {filteredSuggestions.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type='button'
                                        onClick={() => {
                                            setValue('tagIds', [
                                                ...formTagIds,
                                                tag.id,
                                            ])
                                            setTagInput('')
                                        }}
                                        className='w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm'
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2 justify-end pt-4 border-t'>
                        <Button
                            type='button'
                            variant='secondary'
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type='submit' disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
