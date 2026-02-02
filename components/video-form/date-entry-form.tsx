'use client'

import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateEntryFormProps {
    newDate: string
    newEpisodes: string
    onDateChange: (date: string) => void
    onEpisodesChange: (episodes: string) => void
    onAdd: () => void
    disabled?: boolean
}

/**
 * Form for adding a new date entry in dates-based schedule
 */
export function DateEntryForm({
    newDate,
    newEpisodes,
    onDateChange,
    onEpisodesChange,
    onAdd,
    disabled = false,
}: DateEntryFormProps) {
    return (
        <div className='flex gap-2 items-end'>
            <div className='flex-1'>
                <Label htmlFor='new-date' className='text-xs'>
                    Date
                </Label>
                <Input
                    id='new-date'
                    type='date'
                    value={newDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    disabled={disabled}
                    className='h-9'
                />
            </div>
            <div className='w-24'>
                <Label htmlFor='new-episodes' className='text-xs'>
                    Episodes
                </Label>
                <Input
                    id='new-episodes'
                    type='number'
                    min='1'
                    value={newEpisodes}
                    onChange={(e) => onEpisodesChange(e.target.value)}
                    disabled={disabled}
                    className='h-9'
                />
            </div>
            <Button
                type='button'
                size='sm'
                onClick={onAdd}
                disabled={disabled || !newDate}
                className='h-9'
            >
                <Plus className='w-4 h-4' />
            </Button>
        </div>
    )
}
