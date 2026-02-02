'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EpisodeProgressSectionProps {
    watchedEpisodes: string
    totalEpisodes: string
    scheduleType: string
    disabled?: boolean
    onWatchedEpisodesChange: (value: string) => void
    onTotalEpisodesChange: (value: string) => void
}

/**
 * Episode progress tracking section for series forms
 */
export function EpisodeProgressSection({
    watchedEpisodes,
    totalEpisodes,
    scheduleType,
    disabled = false,
    onWatchedEpisodesChange,
    onTotalEpisodesChange,
}: EpisodeProgressSectionProps) {
    const isDateSchedule = scheduleType === 'dates'

    return (
        <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
            <h3 className='font-medium'>Episode Progress</h3>
            <p className='text-sm text-muted-foreground'>
                Track your progress through the series (optional)
            </p>
            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label htmlFor='watchedEpisodes'>Watched Episodes</Label>
                    <Input
                        id='watchedEpisodes'
                        type='number'
                        min='0'
                        value={watchedEpisodes}
                        onChange={(e) =>
                            onWatchedEpisodesChange(e.target.value)
                        }
                        placeholder='0'
                        disabled={disabled}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='totalEpisodes'>
                        {isDateSchedule
                            ? 'Total Episodes (Auto)'
                            : 'Total Episodes'}
                    </Label>
                    <Input
                        id='totalEpisodes'
                        type='number'
                        min='0'
                        value={totalEpisodes}
                        onChange={(e) => onTotalEpisodesChange(e.target.value)}
                        placeholder={
                            isDateSchedule ? 'Calculated from dates' : 'Unknown'
                        }
                        disabled={disabled || isDateSchedule}
                    />
                </div>
            </div>
        </div>
    )
}
