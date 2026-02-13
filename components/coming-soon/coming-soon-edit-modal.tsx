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
import { TagList } from '@/components/ui/tag'
import { DatePickerField } from '@/components/video-form/date-picker-field'
import { useTags } from '@/hooks/use-tags'
import { formatDateToHKTString } from '@/lib/utils/hkt-date'

import type { ComingSoonWithTags } from '@/types/coming-soon'

interface ComingSoonEditModalProps {
    item: ComingSoonWithTags | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const editSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    thumbnailUrl: z.string().optional(),
    releaseDate: z.string().min(1, 'Release date is required'),
    tagIds: z.array(z.number()),
})

type EditFormData = z.infer<typeof editSchema>

export function ComingSoonEditModal({
    item,
    open,
    onOpenChange,
    onSuccess,
}: ComingSoonEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { tags: availableTags, addTag: addNewTag } = useTags()
    const [tagInput, setTagInput] = useState('')
    const [isLoadingTags, setIsLoadingTags] = useState(false)
    const [releaseTime, setReleaseTime] = useState<string | undefined>(
        undefined,
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
            releaseDate: '',
            tagIds: [],
        },
    })

    const formTagIds = watch('tagIds') || []
    const selectedTags = availableTags.filter((tag) =>
        formTagIds.includes(tag.id),
    )

    useEffect(() => {
        if (item && open) {
            reset({
                title: item.title || '',
                thumbnailUrl: item.thumbnailUrl || '',
                releaseDate: formatDateToHKTString(item.releaseDate) || '',
                tagIds: item.tags?.map((t) => t.id) || [],
            })
            setTagInput('')

            // Extract time from release date if not midnight HKT
            if (item.releaseDate) {
                const d = new Date(
                    typeof item.releaseDate === 'string'
                        ? item.releaseDate
                        : item.releaseDate,
                )
                const hktTime = d.toLocaleString('en-US', {
                    timeZone: 'Asia/Hong_Kong',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                })
                // Only set time if it's not midnight
                if (hktTime !== '00:00') {
                    setReleaseTime(hktTime)
                } else {
                    setReleaseTime(undefined)
                }
            } else {
                setReleaseTime(undefined)
            }
        }
    }, [item, open, reset])

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
        if (!item?.id) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/coming-soon/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    thumbnailUrl: data.thumbnailUrl || null,
                    releaseDate: data.releaseDate,
                    releaseTime: releaseTime || undefined,
                    tagIds: data.tagIds,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(
                    error.error || 'Failed to update coming soon item',
                )
            }

            toast.success('Coming soon item updated')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating coming soon item:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update coming soon item',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!item) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>Edit Coming Soon Item</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='cs-title'
                            className='text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Title
                        </label>
                        <Input
                            id='cs-title'
                            {...register('title')}
                            placeholder='Enter title'
                            disabled={isSubmitting}
                        />
                        {errors.title && (
                            <p className='text-sm text-red-600'>
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <label
                            htmlFor='cs-thumbnailUrl'
                            className='text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Thumbnail URL
                        </label>
                        <Input
                            id='cs-thumbnailUrl'
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

                    <div className='space-y-2'>
                        <DatePickerField
                            id='cs-releaseDate'
                            label='Release Date (HKT)'
                            value={watch('releaseDate')}
                            onChange={(date) =>
                                setValue('releaseDate', date || '')
                            }
                            required
                            disabled={isSubmitting}
                            showTimePicker
                            timeValue={releaseTime}
                            onTimeChange={setReleaseTime}
                        />
                        {errors.releaseDate && (
                            <p className='text-sm text-red-600'>
                                {errors.releaseDate.message}
                            </p>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Tags
                        </span>

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
