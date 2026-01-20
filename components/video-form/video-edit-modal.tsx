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
import type { Tag } from '@/types/tag'
import type { VideoWithTags } from '@/types/video'

interface VideoEditModalProps {
    video: VideoWithTags | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const editSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    thumbnailUrl: z.string().optional(),
    tagIds: z.array(z.number()),
})

type EditFormData = z.infer<typeof editSchema>

export function VideoEditModal({
    video,
    open,
    onOpenChange,
    onSuccess,
}: VideoEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [tagInput, setTagInput] = useState('')
    const [isLoadingTags, setIsLoadingTags] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<EditFormData>({
        resolver: zodResolver(
            z.object({
                title: z.string().min(1, 'Title is required'),
                thumbnailUrl: z.string().optional(),
                tagIds: z.array(z.number()),
            }),
        ),
        defaultValues: {
            title: '',
            thumbnailUrl: '',
            tagIds: [],
        },
    })

    const formTagIds = watch('tagIds') || []
    const selectedTags = availableTags.filter((tag) =>
        formTagIds.includes(tag.id),
    )

    useEffect(() => {
        if (video && open) {
            reset({
                title: video.title || '',
                thumbnailUrl: video.thumbnailUrl || '',
                tagIds: video.tags?.map((t) => t.id) || [],
            })
            setTagInput('')
        }
    }, [video, open, reset])

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch('/api/tags')
                if (response.ok) {
                    const tags = await response.json()
                    setAvailableTags(tags)
                }
            } catch (error) {
                console.error('Failed to fetch tags:', error)
            }
        }
        fetchTags()
    }, [])

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
            const response = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tagName }),
            })

            if (response.ok) {
                const newTag = await response.json()
                setAvailableTags((prev) => [...prev, newTag])
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
        if (!video?.id) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/videos/${video.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    thumbnailUrl: data.thumbnailUrl || null,
                    tagIds: data.tagIds,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update video')
            }

            toast.success('Video updated successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating video:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update video',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!video) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>Edit Video</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='title'
                            className='text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Title
                        </label>
                        <Input
                            id='title'
                            {...register('title')}
                            placeholder='Enter video title'
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
                            htmlFor='thumbnailUrl'
                            className='text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Thumbnail URL
                        </label>
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
