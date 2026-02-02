'use client'

import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DateScheduleEntry } from '@/types/series'

interface DateEntryListProps {
    entries: DateScheduleEntry[]
    onUpdateEpisodes: (date: string, episodes: number) => void
    onRemove: (date: string) => void
    disabled?: boolean
}

/**
 * Component for displaying and managing date entries in dates-based schedule
 */
export function DateEntryList({
    entries,
    onUpdateEpisodes,
    onRemove,
    disabled = false,
}: DateEntryListProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    if (entries.length === 0) {
        return null
    }

    return (
        <div className='space-y-2 max-h-48 overflow-y-auto'>
            {entries.map((entry) => (
                <div
                    key={entry.date}
                    className='flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                >
                    <span className='flex-1 text-sm'>
                        {formatDate(entry.date)}
                    </span>
                    <Input
                        type='number'
                        min='1'
                        value={entry.episodes}
                        onChange={(e) =>
                            onUpdateEpisodes(
                                entry.date,
                                parseInt(e.target.value, 10) || 1,
                            )
                        }
                        disabled={disabled}
                        className='w-16 h-8 text-center'
                    />
                    <span className='text-xs text-muted-foreground'>ep</span>
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => onRemove(entry.date)}
                        disabled={disabled}
                        className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                    >
                        <Trash2 className='w-4 h-4' />
                    </Button>
                </div>
            ))}
        </div>
    )
}
