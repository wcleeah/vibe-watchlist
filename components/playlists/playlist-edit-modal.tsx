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
import { useTags } from '@/hooks/use-tags'
import type { PlaylistSummary } from '@/types/playlist'

interface PlaylistEditModalProps {
    playlist: PlaylistSummary | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const editSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    tagIds: z.array(z.number()),
    cascadeWatched: z.boolean(),
    autoComplete: z.boolean(),
})

type EditFormData = z.infer<typeof editSchema>

export function PlaylistEditModal({
    playlist,
    open,
    onOpenChange,
    onSuccess,
}: PlaylistEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { tags: availableTags, addTag: addNewTag } = useTags()
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
        resolver: zodResolver(editSchema),
        defaultValues: {
            title: '',
            tagIds: [],
            cascadeWatched: true,
            autoComplete: true,
        },
    })

    const formTagIds = watch('tagIds') || []
    const selectedTags = availableTags.filter((tag) =>
        formTagIds.includes(tag.id),
    )

    // Reset form when playlist changes
    useEffect(() => {
        if (playlist && open) {
            reset({
                title: playlist.title || '',
                tagIds: playlist.tags?.map((t) => t.id) || [],
                cascadeWatched: playlist.cascadeWatched ?? true,
                autoComplete: playlist.autoComplete ?? true,
            })
            setTagInput('')
        }
    }, [playlist, open, reset])

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
        if (!playlist?.id) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/playlists/${playlist.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    tagIds: data.tagIds,
                    cascadeWatched: data.cascadeWatched,
                    autoComplete: data.autoComplete,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update playlist')
            }

            toast.success('Playlist updated successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating playlist:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update playlist',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!playlist) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>Edit Playlist</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    {/* Title */}
                    <div className='space-y-2'>
                        <Label htmlFor='title'>Title</Label>
                        <Input
                            id='title'
                            {...register('title')}
                            placeholder='Enter playlist title'
                            disabled={isSubmitting}
                        />
                        {errors.title && (
                            <p className='text-sm text-red-600'>
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    {/* Thumbnail Preview (read-only) */}
                    {playlist.thumbnailUrl && (
                        <div className='space-y-2'>
                            <Label>Thumbnail</Label>
                            <div className='relative w-full max-w-xs aspect-video rounded overflow-hidden border'>
                                <Image
                                    src={playlist.thumbnailUrl}
                                    alt={playlist.title || 'Playlist thumbnail'}
                                    fill
                                    className='object-cover'
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Playlist Info (read-only) */}
                    <div className='p-4 bg-muted/50 rounded-lg space-y-2'>
                        <p className='text-sm text-muted-foreground'>
                            <span className='font-medium'>Channel:</span>{' '}
                            {playlist.channelTitle || 'Unknown'}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                            <span className='font-medium'>Videos:</span>{' '}
                            {playlist.itemCount} ({playlist.watchedCount}{' '}
                            watched)
                        </p>
                    </div>

                    {/* Cascade Watched Setting */}
                    <div className='space-y-2'>
                        <Label>Watch Behavior</Label>
                        <div className='flex items-start space-x-2 p-3 bg-muted/50 rounded-lg'>
                            <input
                                type='checkbox'
                                id='edit-cascade-watched'
                                checked={watch('cascadeWatched')}
                                onChange={(e) =>
                                    setValue('cascadeWatched', e.target.checked)
                                }
                                disabled={isSubmitting}
                                className='h-4 w-4 rounded border-gray-300 mt-1'
                            />
                            <div className='space-y-1'>
                                <Label
                                    htmlFor='edit-cascade-watched'
                                    className='cursor-pointer'
                                >
                                    Mark previous videos as watched
                                </Label>
                                <p className='text-xs text-muted-foreground'>
                                    When marking a video as watched, also mark
                                    all earlier videos in the playlist
                                </p>
                            </div>
                        </div>
                        <div className='flex items-start space-x-2 p-3 bg-muted/50 rounded-lg'>
                            <input
                                type='checkbox'
                                id='edit-auto-complete'
                                checked={watch('autoComplete')}
                                onChange={(e) =>
                                    setValue('autoComplete', e.target.checked)
                                }
                                disabled={isSubmitting}
                                className='h-4 w-4 rounded border-gray-300 mt-1'
                            />
                            <div className='space-y-1'>
                                <Label
                                    htmlFor='edit-auto-complete'
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
