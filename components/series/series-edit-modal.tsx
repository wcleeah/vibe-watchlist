'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { SeriesService } from '@/lib/services/series-service'
import type {
    ScheduleType,
    ScheduleValue,
    SeriesWithTags,
} from '@/types/series'

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

    // Schedule state (managed separately from form)
    const [scheduleType, setScheduleType] = useState<ScheduleType>('weekly')
    const [scheduleValue, setScheduleValue] = useState<ScheduleValue>({
        days: ['friday'],
    })
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState<string | undefined>(undefined)

    // Store original missed periods for auto-advance calculation
    const [originalMissedPeriods, setOriginalMissedPeriods] =
        useState<number>(0)

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

    // Watch missedPeriods and autoAdvanceTotalEpisodes for optimistic updates
    const watchedMissedPeriods = watch('missedPeriods')
    const watchedAutoAdvance = watch('autoAdvanceTotalEpisodes')
    const watchedTotalEpisodes = watch('totalEpisodes')
    const watchedWatchedEpisodes = watch('watchedEpisodes')

    useEffect(() => {
        if (!series) return

        const currentMissed = parseInt(watchedMissedPeriods || '0', 10)
        const isAutoAdvance = watchedAutoAdvance

        if (!isAutoAdvance) {
            // Still update original so we track changes relative to current value
            setOriginalMissedPeriods(currentMissed)
            return
        }

        const delta = currentMissed - originalMissedPeriods

        if (delta !== 0) {
            const currentTotal = parseInt(watchedTotalEpisodes || '0', 10) || 0
            const newTotal = Math.max(0, currentTotal + delta)
            setValue('totalEpisodes', String(newTotal))

            // If missed periods decreased, increment watched episodes
            if (delta < 0) {
                const currentWatched =
                    parseInt(watchedWatchedEpisodes || '0', 10) || 0
                const newWatched = Math.max(0, currentWatched - delta) // -delta because delta is negative
                setValue('watchedEpisodes', String(newWatched))
            }

            // Update original to track from new baseline
            setOriginalMissedPeriods(currentMissed)
        }
    }, [
        watchedMissedPeriods,
        watchedAutoAdvance,
        series,
        watchedTotalEpisodes,
        watchedWatchedEpisodes,
        setValue,
        originalMissedPeriods,
    ])

    // Reset form when series changes
    useEffect(() => {
        if (series && open) {
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
            setStartDate(series.startDate)
            setEndDate(series.endDate || undefined)
            setTagInput('')
            setOriginalMissedPeriods(series.missedPeriods ?? 0)
        }
    }, [series, open, reset])

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

    const onSubmit = async (data: EditFormData) => {
        if (!series?.id) return

        setIsSubmitting(true)
        try {
            // Parse episode counts from strings
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
                    watchedEpisodes !== null && !Number.isNaN(watchedEpisodes)
                        ? watchedEpisodes
                        : undefined,
                missedPeriods:
                    missedPeriods !== null && !Number.isNaN(missedPeriods)
                        ? missedPeriods
                        : undefined,
                autoAdvanceTotalEpisodes: data.autoAdvanceTotalEpisodes,
            })

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

                    {/* Schedule */}
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
                                    isSubmitting || scheduleType === 'dates'
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
                        <Label htmlFor='isActive' className='cursor-pointer'>
                            Active (continue tracking new episodes)
                        </Label>
                    </div>

                    {/* Episode Progress */}
                    <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                        <h3 className='font-medium'>Episode Progress</h3>
                        <p className='text-sm text-muted-foreground'>
                            Track your progress through the series (optional)
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
                                        isSubmitting || scheduleType === 'dates'
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
                                    {...register('missedPeriods')}
                                    placeholder='0'
                                    disabled={isSubmitting}
                                />
                                <p className='text-xs text-muted-foreground'>
                                    Number of episodes behind schedule
                                </p>
                            </div>
                        )}

                        {/* Auto Advance Total Episodes */}
                        <div className='flex items-start space-x-2 pt-2'>
                            <input
                                type='checkbox'
                                id='autoAdvanceTotalEpisodes'
                                {...register('autoAdvanceTotalEpisodes')}
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
                                    Automatically increase total episodes when
                                    new episodes are released
                                </p>
                            </div>
                        </div>
                    </div>

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
