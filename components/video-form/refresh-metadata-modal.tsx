'use client'

import { Check, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import { cn } from '@/lib/utils'

/**
 * Generic media item interface for metadata refresh.
 * Any entity with a URL, title, and thumbnail can use this modal.
 */
export interface RefreshableMediaItem {
    url: string
    title?: string | null
    thumbnailUrl?: string | null
}

interface RefreshMetadataModalProps {
    item: RefreshableMediaItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdate: (title: string, thumbnailUrl: string | null) => Promise<void>
}

export function RefreshMetadataModal({
    item,
    open,
    onOpenChange,
    onUpdate,
}: RefreshMetadataModalProps) {
    const [suggestions, setSuggestions] = useState<MetadataSuggestion[]>([])
    const [selectedTitle, setSelectedTitle] = useState<string>('')
    const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(
        null,
    )
    const [loading, setLoading] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchMetadata = useCallback(async () => {
        if (!item) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/metadata/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: item.url,
                    force: true,
                }),
            })

            const result = await response.json()

            if (result.success) {
                setSuggestions(result.suggestions)
                if (result.suggestions.length > 0) {
                    // Try to match the current title, fallback to first suggestion
                    const currentTitle = item?.title?.trim().toLowerCase()
                    const matchingSuggestion = currentTitle
                        ? result.suggestions.find(
                              (s: MetadataSuggestion) =>
                                  s.title.trim().toLowerCase() === currentTitle,
                          )
                        : undefined
                    const defaultSuggestion =
                        matchingSuggestion || result.suggestions[0]
                    setSelectedTitle(defaultSuggestion.title)
                    setSelectedThumbnail(defaultSuggestion.thumbnailUrl || null)
                }
            } else {
                setError(result.error || 'Failed to fetch metadata')
            }
        } catch (err) {
            setError('Failed to fetch metadata')
        } finally {
            setLoading(false)
        }
    }, [item])

    useEffect(() => {
        if (open && item) {
            fetchMetadata()
        }
    }, [open, item, fetchMetadata])

    const handleUpdate = async () => {
        if (!selectedTitle) return

        setUpdating(true)
        try {
            await onUpdate(selectedTitle, selectedThumbnail)
            onOpenChange(false)
        } catch (err) {
            setError('Failed to update item')
        } finally {
            setUpdating(false)
        }
    }

    const handleSelect = (suggestion: MetadataSuggestion) => {
        setSelectedTitle(suggestion.title)
        setSelectedThumbnail(suggestion.thumbnailUrl || null)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-[700px]'>
                <DialogHeader>
                    <DialogTitle>Refresh Metadata</DialogTitle>
                    <DialogDescription>
                        Select a title version for &quot;
                        {item?.title || 'this item'}&quot;
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-8 w-8 animate-spin' />
                        <span className='ml-2'>
                            Fetching latest metadata...
                        </span>
                    </div>
                ) : error ? (
                    <div className='text-red-600 py-4'>{error}</div>
                ) : suggestions.length === 0 ? (
                    <div className='text-gray-600 py-4'>
                        No metadata options found
                    </div>
                ) : (
                    <div className='space-y-2'>
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                type='button'
                                onClick={() => handleSelect(suggestion)}
                                className={cn(
                                    'w-full p-3 text-left border rounded-lg flex items-center gap-4 hover:bg-gray-50 transition-colors',
                                    selectedTitle === suggestion.title
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200',
                                )}
                            >
                                <div className='flex-shrink-0'>
                                    {selectedTitle === suggestion.title ? (
                                        <Check className='w-4 h-4 text-blue-600' />
                                    ) : (
                                        <div className='w-4 h-4 rounded-full border-2 border-gray-300' />
                                    )}
                                </div>
                                {suggestion.thumbnailUrl && (
                                    <img
                                        src={suggestion.thumbnailUrl}
                                        alt='Thumbnail preview'
                                        className='w-24 h-14 object-cover rounded flex-shrink-0'
                                    />
                                )}
                                <div className='flex-1 min-w-0'>
                                    <div className='font-medium'>
                                        {suggestion.title}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={updating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={loading || updating || !selectedTitle}
                    >
                        {updating ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
