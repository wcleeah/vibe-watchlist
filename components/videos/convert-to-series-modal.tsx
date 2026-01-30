'use client'

import { CalendarDays, Hash, Loader2, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScheduleSection } from '@/components/video-form/schedule-section'
import type { ScheduleType, ScheduleValue } from '@/types/series'
import { getDefaultScheduleValue } from '@/types/series'
import type { VideoData } from './types'

interface ConvertToSeriesModalProps {
    video: VideoData | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ConvertToSeriesModal({
    video,
    open,
    onOpenChange,
    onSuccess,
}: ConvertToSeriesModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Schedule state
    const [scheduleType, setScheduleType] = useState<ScheduleType>('weekly')
    const [scheduleValue, setScheduleValue] = useState<ScheduleValue>(
        getDefaultScheduleValue('weekly'),
    )
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState<string | undefined>(undefined)
    const [totalEpisodes, setTotalEpisodes] = useState<string>('')

    const handleScheduleTypeChange = (type: ScheduleType) => {
        setScheduleType(type)
        setScheduleValue(getDefaultScheduleValue(type))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!video?.id) return

        setIsSubmitting(true)
        try {
            const response = await fetch(
                `/api/videos/${video.id}/convert-to-series`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scheduleType,
                        scheduleValue,
                        startDate,
                        endDate: endDate || null,
                        totalEpisodes: totalEpisodes
                            ? parseInt(totalEpisodes, 10)
                            : null,
                    }),
                },
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to convert to series')
            }

            toast.success('Video converted to series successfully!')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error converting to series:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to convert to series',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!video) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-lg'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <RefreshCw className='w-5 h-5' />
                        Convert to Series
                    </DialogTitle>
                    <DialogDescription>
                        Convert this video into a recurring series. The original
                        video will be deleted.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* Video Preview */}
                    <div className='p-4 bg-muted/50 rounded-lg space-y-3'>
                        <div className='flex gap-4'>
                            {video.thumbnailUrl && (
                                <div className='relative w-24 h-14 flex-shrink-0 rounded overflow-hidden'>
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={video.title || 'Video thumbnail'}
                                        fill
                                        className='object-cover'
                                    />
                                </div>
                            )}
                            <div className='flex-1 min-w-0'>
                                <h4 className='font-medium line-clamp-2 break-words'>
                                    {video.title || 'Untitled Video'}
                                </h4>
                                <p className='text-sm text-muted-foreground'>
                                    {video.platform}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Configuration */}
                    <div className='space-y-4'>
                        <div className='flex items-center gap-2 text-sm font-medium'>
                            <CalendarDays className='w-4 h-4' />
                            Schedule Configuration
                        </div>

                        <ScheduleSection
                            scheduleType={scheduleType}
                            scheduleValue={scheduleValue}
                            startDate={startDate}
                            endDate={endDate}
                            totalEpisodes={totalEpisodes}
                            isSubmitting={isSubmitting}
                            onScheduleTypeChange={handleScheduleTypeChange}
                            onScheduleValueChange={setScheduleValue}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                            onTotalEpisodesChange={setTotalEpisodes}
                        />
                    </div>

                    {/* Warning */}
                    <div className='p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
                        <p className='text-sm text-amber-700 dark:text-amber-400'>
                            The original video will be deleted after conversion.
                            Tags will be preserved.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2 justify-end'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type='submit' disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                    Converting...
                                </>
                            ) : (
                                'Convert to Series'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
