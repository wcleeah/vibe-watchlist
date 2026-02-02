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
import { useTags } from '@/hooks/use-tags'
import { SeriesService } from '@/lib/services/series-service'
import type {
    ScheduleType,
    ScheduleValue,
    SeriesWithTags,
} from '@/types/series'
import { EpisodeProgressSection } from './episode-progress-section'
import { SeriesScheduleEditSection } from './series-schedule-edit-section'
import { TagEditSection } from './tag-edit-section'

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
        },
    })

    const formTagIds = watch('tagIds') || []
    const selectedTags = availableTags.filter((tag) =>
        formTagIds.includes(tag.id),
    )

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
            })
            setScheduleType(series.scheduleType as ScheduleType)
            setScheduleValue(series.scheduleValue)
            setStartDate(series.startDate)
            setEndDate(series.endDate || undefined)
            setTagInput('')
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
            const totalEpisodes = data.totalEpisodes
                ? parseInt(data.totalEpisodes, 10)
                : null
            const watchedEpisodes = data.watchedEpisodes
                ? parseInt(data.watchedEpisodes, 10)
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
                    <SeriesScheduleEditSection
                        scheduleType={scheduleType}
                        scheduleValue={scheduleValue}
                        startDate={startDate}
                        endDate={endDate}
                        disabled={isSubmitting}
                        onScheduleTypeChange={setScheduleType}
                        onScheduleValueChange={setScheduleValue}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onTotalEpisodesChange={(value) =>
                            setValue('totalEpisodes', value)
                        }
                    />

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
                    <EpisodeProgressSection
                        watchedEpisodes={watch('watchedEpisodes') || ''}
                        totalEpisodes={watch('totalEpisodes') || ''}
                        scheduleType={scheduleType}
                        disabled={isSubmitting}
                        onWatchedEpisodesChange={(value) =>
                            setValue('watchedEpisodes', value)
                        }
                        onTotalEpisodesChange={(value) =>
                            setValue('totalEpisodes', value)
                        }
                    />

                    {/* Tags */}
                    <TagEditSection
                        selectedTags={selectedTags}
                        tagInput={tagInput}
                        filteredSuggestions={filteredSuggestions}
                        isSubmitting={isSubmitting}
                        isLoadingTags={isLoadingTags}
                        onTagInputChange={setTagInput}
                        onAddTag={addTag}
                        onRemoveTag={removeTag}
                        onSelectSuggestion={(tagId) => {
                            setValue('tagIds', [...formTagIds, tagId])
                            setTagInput('')
                        }}
                    />

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
