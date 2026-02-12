'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import type { ComingSoonWithTags } from '@/types/coming-soon'

interface TransformDialogProps {
    item: ComingSoonWithTags | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TransformDialog({
    item,
    open,
    onOpenChange,
}: TransformDialogProps) {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleConfirm = () => {
        if (!item) return

        const trimmedUrl = url.trim()
        if (!trimmedUrl) {
            setError('URL is required')
            return
        }

        try {
            new URL(trimmedUrl)
        } catch {
            setError('Please enter a valid URL')
            return
        }

        // Navigate to homepage with comingSoonId and url params
        const params = new URLSearchParams({
            comingSoonId: item.id.toString(),
            url: trimmedUrl,
        })
        router.push(`/?${params.toString()}`)
        onOpenChange(false)
        setUrl('')
        setError(null)
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setUrl('')
            setError(null)
        }
        onOpenChange(newOpen)
    }

    if (!item) return null

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className='max-w-lg'>
                <DialogHeader>
                    <DialogTitle>Transform to Video/Series</DialogTitle>
                    <DialogDescription>
                        Enter the URL of the released content for &quot;
                        {item.title || 'Untitled'}&quot;. You&apos;ll be
                        redirected to the homepage to complete the process.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='transform-url'
                            className='text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Released Content URL
                        </label>
                        <Input
                            id='transform-url'
                            type='url'
                            placeholder='https://youtube.com/watch?v=...'
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value)
                                setError(null)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleConfirm()
                                }
                            }}
                        />
                        {error && (
                            <p className='text-sm text-red-600'>{error}</p>
                        )}
                    </div>

                    <div className='flex gap-2 justify-end pt-2'>
                        <Button
                            type='button'
                            variant='secondary'
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type='button' onClick={handleConfirm}>
                            Continue
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
