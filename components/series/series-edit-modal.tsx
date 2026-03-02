'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { DatePickerField } from '@/components/video-form/date-picker-field'
import { ScheduleSelector } from '@/components/video-form/schedule-selector'
import { useTags } from '@/hooks/use-tags'
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
    description: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    tagIds: z.array(z.number()),
    isActive: z.boolean(),
    totalEpisodes: z.string().optional(),
    watchedEpisodes: z.string().optional(),
    missedPeriods: z.string().optional(),
    autoAdvanceTotalEpisodes: z.boolean(),
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
    totalEpisodes: string
    watchedEpisodes: string
    missedPeriods: string
    autoAdvanceTotalEpisodes: boolean
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
        totalEpisodes: '',
        watchedEpisodes: '0',
        missedPeriods: '0',
        autoAdvanceTotalEpisodes: false,
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
        totalEpisodes: s.totalEpisodes != null ? String(s.totalEpisodes) : '',
        watchedEpisodes: String(s.watchedEpisodes ?? 0),
        missedPeriods: String(s.missedPeriods ?? 0),
        autoAdvanceTotalEpisodes: s.autoAdvanceTotalEpisodes ?? false,
    }
}

function localSeasonToBulk(s: LocalSeason): BulkSeasonData {
    const totalEpisodes = s.totalEpisodes
        ? parseInt(s.totalEpisodes, 10)
        : undefined
    const watchedEpisodes = s.watchedEpisodes
        ? parseInt(s.watchedEpisodes, 10)
        : undefined
    const missedPeriods = s.missedPeriods
        ? parseInt(s.missedPeriods, 10)
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
        totalEpisodes:
            totalEpisodes !== undefined && !Number.isNaN(totalEpisodes)
                ? totalEpisodes
                : null,
        watchedEpisodes:
            watchedEpisodes !== undefined && !Number.isNaN(watchedEpisodes)
                ? watchedEpisodes
                : 0,
        missedPeriods:
            missedPeriods !== undefined && !Number.isNaN(missedPeriods)
                ? missedPeriods
                : 0,
        autoAdvanceTotalEpisodes: s.autoAdvanceTotalEpisodes,
    }
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

    // Schedule state (managed separately from form — used by Single tab)
    const [scheduleType, setScheduleType] = useState<ScheduleType>('weekly')
    const [scheduleValue, setScheduleValue] = useState<ScheduleValue>({
        days: ['friday'],
    })
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState<string | undefined>(undefined)

    // Store original values when modal opens (baseline for auto-advance calculations)
    const [originalTotal, setOriginalTotal] = useState<number>(0)
    const [originalWatched, setOriginalWatched] = useState<number>(0)
    const [originalMissed, setOriginalMissed] = useState<number>(0)

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
            description: '',
            thumbnailUrl: '',
            tagIds: [],
            isActive: true,
            totalEpisodes: '',
            watchedEpisodes: '',
            missedPeriods: '0',
            autoAdvanceTotalEpisodes: false,
        },
    })

    const formTagIds = watch('tagIds') || []
    const selectedTags = availableTags.filter((tag) =>
        formTagIds.includes(tag.id),
    )

    // Handle missed periods change - updates total and watched episodes
    const handleMissedPeriodsChange = (value: string) => {
        if (!series) return

        const newMissed = parseInt(value || '0', 10)

        // Always update the missed periods value
        setValue('missedPeriods', value)

        // Update total episodes (only when above original)
        if (newMissed > originalMissed) {
            const newTotal = originalTotal + (newMissed - originalMissed)
            setValue('totalEpisodes', String(newTotal))
        } else {
            setValue('totalEpisodes', String(originalTotal))
        }

        // Update watched episodes (only when below original)
        if (newMissed < originalMissed) {
            const newWatched = originalWatched + (originalMissed - newMissed)
            setValue('watchedEpisodes', String(newWatched))
        } else {
            setValue('watchedEpisodes', String(originalWatched))
        }
    }

    // Reset form when series changes
    useEffect(() => {
        if (series && open) {
            // Set series-level fields
            reset({
                title: series.title || '',
                description: series.description || '',
                thumbnailUrl: series.thumbnailUrl || '',
                tagIds: series.tags?.map((t) => t.id) || [],
                isActive: series.isActive,
                totalEpisodes:
                    series.totalEpisodes != null
                        ? String(series.totalEpisodes)
                        : '',
                watchedEpisodes:
                    series.watchedEpisodes != null
                        ? String(series.watchedEpisodes)
                        : '',
                missedPeriods: String(series.missedPeriods ?? 0),
                autoAdvanceTotalEpisodes:
                    series.autoAdvanceTotalEpisodes ?? false,
            })
            setScheduleType(series.scheduleType as ScheduleType)
            setScheduleValue(series.scheduleValue)
            setStartDate(series.startDate?.split('T')[0])
            setEndDate(series.endDate?.split('T')[0])
            setTagInput('')
            setOriginalTotal(series.totalEpisodes ?? 0)
            setOriginalWatched(series.watchedEpisodes ?? 0)
            setOriginalMissed(series.missedPeriods ?? 0)

            // Set active tab based on current series state
            setActiveTab(series.hasSeasons ? 'seasons' : 'single')

            // Load seasons if series has them
            if (series.hasSeasons) {
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
            } else {
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
                const totalEpisodes = data.totalEpisodes
                    ? parseInt(data.totalEpisodes, 10)
                    : null
                const watchedEpisodes = data.watchedEpisodes
                    ? parseInt(data.watchedEpisodes, 10)
                    : null
                const missedPeriods = data.missedPeriods
                    ? parseInt(data.missedPeriods, 10)
                    : null

                await SeriesService.update(series.id, {
                    title: data.title,
                    description: data.description || undefined,
                    thumbnailUrl: data.thumbnailUrl || undefined,
                    scheduleType,
                    scheduleValue,
                    startDate,
                    endDate: endDate || null,
                    tagIds: data.tagIds,
                    isActive: data.isActive,
                    totalEpisodes:
                        totalEpisodes !== null && !Number.isNaN(totalEpisodes)
                            ? totalEpisodes
                            : undefined,
                    watchedEpisodes:
                        watchedEpisodes !== null &&
                        !Number.isNaN(watchedEpisodes)
                            ? watchedEpisodes
                            : undefined,
                    missedPeriods:
                        missedPeriods !== null && !Number.isNaN(missedPeriods)
                            ? missedPeriods
                            : undefined,
                    autoAdvanceTotalEpisodes: data.autoAdvanceTotalEpisodes,
                    hasSeasons: false,
                })
            } else {
                // Seasons mode: save series-level fields + bulk seasons
                await SeriesService.update(series.id, {
                    title: data.title,
                    description: data.description || undefined,
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
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

                    {/* Description */}
                    <div className='space-y-2'>
                        <Label htmlFor='description'>Description</Label>
                        <Input
                            id='description'
                            {...register('description')}
                            placeholder='Enter series description (optional)'
                            disabled={isSubmitting}
                        />
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

                    {/* ===== Single tab — existing form, untouched ===== */}
                    {activeTab === 'single' && (
                        <>
                            <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                                <h3 className='font-medium'>Schedule</h3>
                                <ScheduleSelector
                                    scheduleType={scheduleType}
                                    scheduleValue={scheduleValue}
                                    onTypeChange={setScheduleType}
                                    onValueChange={setScheduleValue}
                                    onEndDateChange={setEndDate}
                                    onTotalEpisodesChange={(value) =>
                                        setValue('totalEpisodes', value)
                                    }
                                    disabled={isSubmitting}
                                />

                                <div className='grid grid-cols-2 gap-4'>
                                    <DatePickerField
                                        id='edit-start-date'
                                        label='Start Date'
                                        value={startDate}
                                        onChange={(date) =>
                                            setStartDate(
                                                date ||
                                                    new Date()
                                                        .toISOString()
                                                        .split('T')[0],
                                            )
                                        }
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <DatePickerField
                                        id='edit-end-date'
                                        label={
                                            scheduleType === 'dates'
                                                ? 'End Date (Auto)'
                                                : 'End Date (Optional)'
                                        }
                                        value={endDate}
                                        onChange={setEndDate}
                                        disabled={
                                            isSubmitting ||
                                            scheduleType === 'dates'
                                        }
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className='flex items-center space-x-2'>
                                <input
                                    type='checkbox'
                                    id='isActive'
                                    {...register('isActive')}
                                    disabled={isSubmitting}
                                    className='h-4 w-4 rounded border-gray-300'
                                />
                                <Label
                                    htmlFor='isActive'
                                    className='cursor-pointer'
                                >
                                    Active (continue tracking new episodes)
                                </Label>
                            </div>

                            {/* Episode Progress */}
                            <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                                <h3 className='font-medium'>
                                    Episode Progress
                                </h3>
                                <p className='text-sm text-muted-foreground'>
                                    Track your progress through the series
                                    (optional)
                                </p>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='watchedEpisodes'>
                                            Watched Episodes
                                        </Label>
                                        <Input
                                            id='watchedEpisodes'
                                            type='number'
                                            min='0'
                                            {...register('watchedEpisodes')}
                                            placeholder='0'
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='totalEpisodes'>
                                            {scheduleType === 'dates'
                                                ? 'Total Episodes (Auto)'
                                                : 'Total Episodes'}
                                        </Label>
                                        <Input
                                            id='totalEpisodes'
                                            type='number'
                                            min='0'
                                            {...register('totalEpisodes')}
                                            placeholder={
                                                scheduleType === 'dates'
                                                    ? 'Calculated from dates'
                                                    : 'Unknown'
                                            }
                                            disabled={
                                                isSubmitting ||
                                                scheduleType === 'dates'
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Missed Periods - only for scheduled series */}
                                {scheduleType !== 'none' && (
                                    <div className='space-y-2'>
                                        <Label htmlFor='missedPeriods'>
                                            Missed Episodes
                                        </Label>
                                        <Input
                                            id='missedPeriods'
                                            type='number'
                                            min='0'
                                            value={watch('missedPeriods')}
                                            onChange={(e) =>
                                                handleMissedPeriodsChange(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder='0'
                                            disabled={isSubmitting}
                                        />
                                        <p className='text-xs text-muted-foreground'>
                                            Number of episodes behind schedule
                                        </p>
                                        <p className='text-xs text-amber-600 dark:text-amber-400'>
                                            Changing this will override Total
                                            and Watched episodes
                                        </p>
                                    </div>
                                )}

                                {/* Auto Advance Total Episodes */}
                                <div className='flex items-start space-x-2 pt-2'>
                                    <input
                                        type='checkbox'
                                        id='autoAdvanceTotalEpisodes'
                                        {...register(
                                            'autoAdvanceTotalEpisodes',
                                        )}
                                        disabled={isSubmitting}
                                        className='h-4 w-4 rounded border-gray-300 mt-1'
                                    />
                                    <div className='space-y-1'>
                                        <Label
                                            htmlFor='autoAdvanceTotalEpisodes'
                                            className='cursor-pointer'
                                        >
                                            Auto-advance total episodes
                                        </Label>
                                        <p className='text-xs text-muted-foreground'>
                                            Automatically increase total
                                            episodes when new episodes are
                                            released
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
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
                                    className='flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm'
                                >
                                    {localSeasons.length === 0 && (
                                        <option value={0}>No seasons</option>
                                    )}
                                    {localSeasons.map((s, i) => (
                                        <option key={i} value={i}>
                                            Season {s.seasonNumber}
                                            {s.title ? ` — ${s.title}` : ''}
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
                            {selectedSeason ? (
                                <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                                    {/* Season Number + Title */}
                                    <div className='grid grid-cols-3 gap-3'>
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
                                        <div className='col-span-2 space-y-2'>
                                            <Label>
                                                Title{' '}
                                                <span className='text-muted-foreground'>
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                value={selectedSeason.title}
                                                onChange={(e) =>
                                                    updateSelectedSeason({
                                                        title: e.target.value,
                                                    })
                                                }
                                                placeholder='e.g. The Finals'
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* URL Override */}
                                    <div className='space-y-2'>
                                        <Label>
                                            URL Override{' '}
                                            <span className='text-muted-foreground'>
                                                (optional)
                                            </span>
                                        </Label>
                                        <Input
                                            value={selectedSeason.url}
                                            onChange={(e) =>
                                                updateSelectedSeason({
                                                    url: e.target.value,
                                                })
                                            }
                                            placeholder='https://...'
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Schedule */}
                                    <ScheduleSelector
                                        scheduleType={
                                            selectedSeason.scheduleType
                                        }
                                        scheduleValue={
                                            selectedSeason.scheduleValue
                                        }
                                        onTypeChange={(type) =>
                                            updateSelectedSeason({
                                                scheduleType: type,
                                                scheduleValue:
                                                    getDefaultScheduleValue(
                                                        type,
                                                    ),
                                            })
                                        }
                                        onValueChange={(val) =>
                                            updateSelectedSeason({
                                                scheduleValue: val,
                                            })
                                        }
                                        onEndDateChange={(d) =>
                                            updateSelectedSeason({
                                                endDate: d,
                                            })
                                        }
                                        onTotalEpisodesChange={(val) =>
                                            updateSelectedSeason({
                                                totalEpisodes: val,
                                            })
                                        }
                                        disabled={isSubmitting}
                                    />

                                    {/* Dates */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <DatePickerField
                                            id={`season-start-${selectedSeasonIdx}`}
                                            label='Start Date'
                                            value={selectedSeason.startDate}
                                            onChange={(d) =>
                                                updateSelectedSeason({
                                                    startDate:
                                                        d ||
                                                        new Date()
                                                            .toISOString()
                                                            .split('T')[0],
                                                })
                                            }
                                            required
                                            disabled={isSubmitting}
                                        />
                                        <DatePickerField
                                            id={`season-end-${selectedSeasonIdx}`}
                                            label='End Date (optional)'
                                            value={selectedSeason.endDate}
                                            onChange={(d) =>
                                                updateSelectedSeason({
                                                    endDate: d,
                                                })
                                            }
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Active */}
                                    <div className='flex items-center space-x-2'>
                                        <input
                                            type='checkbox'
                                            id={`season-active-${selectedSeasonIdx}`}
                                            checked={selectedSeason.isActive}
                                            onChange={(e) =>
                                                updateSelectedSeason({
                                                    isActive: e.target.checked,
                                                })
                                            }
                                            disabled={isSubmitting}
                                            className='h-4 w-4 rounded border-gray-300'
                                        />
                                        <Label
                                            htmlFor={`season-active-${selectedSeasonIdx}`}
                                            className='cursor-pointer'
                                        >
                                            Active (continue tracking new
                                            episodes)
                                        </Label>
                                    </div>

                                    {/* Episode Progress */}
                                    <div className='grid grid-cols-2 gap-3'>
                                        <div className='space-y-2'>
                                            <Label>Total Episodes</Label>
                                            <Input
                                                type='number'
                                                min='0'
                                                value={
                                                    selectedSeason.totalEpisodes
                                                }
                                                onChange={(e) =>
                                                    updateSelectedSeason({
                                                        totalEpisodes:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <Label>Watched Episodes</Label>
                                            <Input
                                                type='number'
                                                min='0'
                                                value={
                                                    selectedSeason.watchedEpisodes
                                                }
                                                onChange={(e) =>
                                                    updateSelectedSeason({
                                                        watchedEpisodes:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Missed Periods */}
                                    {selectedSeason.scheduleType !== 'none' && (
                                        <div className='space-y-2'>
                                            <Label>Missed Episodes</Label>
                                            <Input
                                                type='number'
                                                min='0'
                                                value={
                                                    selectedSeason.missedPeriods
                                                }
                                                onChange={(e) =>
                                                    updateSelectedSeason({
                                                        missedPeriods:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    )}

                                    {/* Auto Advance */}
                                    <div className='flex items-start space-x-2 pt-2'>
                                        <input
                                            type='checkbox'
                                            id={`season-autoadvance-${selectedSeasonIdx}`}
                                            checked={
                                                selectedSeason.autoAdvanceTotalEpisodes
                                            }
                                            onChange={(e) =>
                                                updateSelectedSeason({
                                                    autoAdvanceTotalEpisodes:
                                                        e.target.checked,
                                                })
                                            }
                                            disabled={isSubmitting}
                                            className='h-4 w-4 rounded border-gray-300 mt-1'
                                        />
                                        <div className='space-y-1'>
                                            <Label
                                                htmlFor={`season-autoadvance-${selectedSeasonIdx}`}
                                                className='cursor-pointer'
                                            >
                                                Auto-advance total episodes
                                            </Label>
                                            <p className='text-xs text-muted-foreground'>
                                                Automatically increase total
                                                episodes when new episodes are
                                                released
                                            </p>
                                        </div>
                                    </div>
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
