'use client'

import { Archive, CalendarDays, Clock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScheduleService } from '@/lib/services/schedule-service'
import { cn } from '@/lib/utils'

import type {
    DailySchedule,
    DateScheduleEntry,
    DatesSchedule,
    DayOfWeek,
    ScheduleType,
    ScheduleValue,
    WeeklySchedule,
} from '@/types/series'

interface ScheduleSelectorProps {
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    onTypeChange: (type: ScheduleType) => void
    onValueChange: (value: ScheduleValue) => void
    onEndDateChange?: (endDate: string | undefined) => void
    onTotalEpisodesChange?: (totalEpisodes: string) => void
    disabled?: boolean
    className?: string
}

export function ScheduleSelector({
    scheduleType,
    scheduleValue,
    onTypeChange,
    onValueChange,
    onEndDateChange,
    onTotalEpisodesChange,
    disabled = false,
    className,
}: ScheduleSelectorProps) {
    const days = ScheduleService.getAllDays()

    // State for adding new date entry
    const [newDate, setNewDate] = useState('')
    const [newEpisodes, setNewEpisodes] = useState('1')

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as ScheduleType
        onTypeChange(newType)
        // Reset value to default for new type
        onValueChange(ScheduleService.getDefaultScheduleValue(newType))
    }

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const interval = Math.max(1, parseInt(e.target.value, 10) || 1)
        const currentTime = (scheduleValue as { time?: string }).time
        onValueChange({
            interval,
            ...(currentTime ? { time: currentTime } : {}),
        })
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value // "HH:MM" or ""
        if (time) {
            // Spread current value and add time — safe because this is only
            // shown for non-backlog types (DailySchedule | WeeklySchedule | etc.)
            const updated = { ...scheduleValue, time } as ScheduleValue
            onValueChange(updated)
        } else {
            // Remove time field
            const { time: _removed, ...rest } = scheduleValue as Record<
                string,
                unknown
            >
            onValueChange(rest as ScheduleValue)
        }
    }

    const currentScheduleTime = (scheduleValue as { time?: string }).time || ''

    const handleDayToggle = (day: DayOfWeek) => {
        const currentDays = (scheduleValue as WeeklySchedule).days || []
        const currentTime = (scheduleValue as { time?: string }).time
        let newDays: DayOfWeek[]

        if (currentDays.includes(day)) {
            // Remove day (but keep at least one)
            newDays = currentDays.filter((d) => d !== day)
            if (newDays.length === 0) {
                newDays = [day] // Keep at least one day
            }
        } else {
            // Add day
            newDays = [...currentDays, day]
        }

        onValueChange({
            days: newDays,
            ...(currentTime ? { time: currentTime } : {}),
        })
    }

    // Handlers for dates schedule
    const updateDerivedFieldsFromEntries = (entries: DateScheduleEntry[]) => {
        if (entries.length > 0) {
            // Sort and get the last date
            const sortedEntries = [...entries].sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
            // Update end date to the last date
            if (onEndDateChange) {
                onEndDateChange(sortedEntries[sortedEntries.length - 1].date)
            }
            // Update total episodes to the sum of all episodes
            if (onTotalEpisodesChange) {
                const totalEpisodes = entries.reduce(
                    (sum, e) => sum + e.episodes,
                    0,
                )
                onTotalEpisodesChange(totalEpisodes.toString())
            }
        } else {
            if (onEndDateChange) {
                onEndDateChange(undefined)
            }
            if (onTotalEpisodesChange) {
                onTotalEpisodesChange('')
            }
        }
    }

    const handleAddDateEntry = () => {
        if (!newDate) return

        const entries = (scheduleValue as DatesSchedule).entries || []
        const episodeCount = Math.max(1, parseInt(newEpisodes, 10) || 1)
        const currentTime = (scheduleValue as { time?: string }).time

        let newEntries: DateScheduleEntry[]

        // Check if date already exists
        const existingIndex = entries.findIndex((e) => e.date === newDate)
        if (existingIndex >= 0) {
            // Update existing entry
            newEntries = [...entries]
            newEntries[existingIndex] = {
                date: newDate,
                episodes: episodeCount,
            }
        } else {
            // Add new entry
            const newEntry: DateScheduleEntry = {
                date: newDate,
                episodes: episodeCount,
            }
            newEntries = [...entries, newEntry].sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
        }

        onValueChange({
            entries: newEntries,
            ...(currentTime ? { time: currentTime } : {}),
        })
        updateDerivedFieldsFromEntries(newEntries)

        // Reset input
        setNewDate('')
        setNewEpisodes('1')
    }

    const handleRemoveDateEntry = (date: string) => {
        const entries = (scheduleValue as DatesSchedule).entries || []
        const currentTime = (scheduleValue as { time?: string }).time
        const newEntries = entries.filter((e) => e.date !== date)
        onValueChange({
            entries: newEntries,
            ...(currentTime ? { time: currentTime } : {}),
        })
        updateDerivedFieldsFromEntries(newEntries)
    }

    const handleUpdateEpisodes = (date: string, episodes: number) => {
        const entries = (scheduleValue as DatesSchedule).entries || []
        const currentTime = (scheduleValue as { time?: string }).time
        const newEntries = entries.map((e) =>
            e.date === date ? { ...e, episodes: Math.max(1, episodes) } : e,
        )
        onValueChange({
            entries: newEntries,
            ...(currentTime ? { time: currentTime } : {}),
        })
        updateDerivedFieldsFromEntries(newEntries)
    }

    const getIntervalLabel = () => {
        if (scheduleType === 'daily') {
            return 'day(s)'
        }
        return 'days'
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <div className={cn('space-y-4', className)}>
            <div className='space-y-2'>
                <Label htmlFor='schedule-type'>Schedule Type</Label>
                <select
                    id='schedule-type'
                    value={scheduleType}
                    onChange={handleTypeChange}
                    disabled={disabled}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm',
                        'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300',
                    )}
                >
                    <option value='none'>No Schedule (Backlog)</option>
                    <option value='daily'>Daily</option>
                    <option value='weekly'>Weekly</option>
                    <option value='custom'>Custom Interval</option>
                    <option value='dates'>Specific Dates</option>
                </select>
            </div>

            {scheduleType === 'none' && (
                <div className='flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'>
                    <Archive className='w-4 h-4 text-amber-600 dark:text-amber-400' />
                    <span className='text-sm text-amber-700 dark:text-amber-300'>
                        Backlog series have no release schedule. Track your
                        progress manually.
                    </span>
                </div>
            )}

            {(scheduleType === 'daily' || scheduleType === 'custom') && (
                <div className='space-y-2'>
                    <Label htmlFor='interval'>
                        Every{' '}
                        <input
                            id='interval'
                            type='number'
                            min='1'
                            max='365'
                            value={
                                (scheduleValue as DailySchedule).interval || 1
                            }
                            onChange={handleIntervalChange}
                            disabled={disabled}
                            className={cn(
                                'inline-flex h-8 w-16 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-center mx-1',
                                'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2',
                                'disabled:cursor-not-allowed disabled:opacity-50',
                                'dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300',
                            )}
                        />{' '}
                        {getIntervalLabel()}
                    </Label>
                </div>
            )}

            {scheduleType === 'weekly' && (
                <div className='space-y-2'>
                    <Label>Days of the Week</Label>
                    <div className='flex flex-wrap gap-2'>
                        {days.map(({ value, label }) => {
                            const isSelected = (
                                (scheduleValue as WeeklySchedule).days || []
                            ).includes(value)
                            return (
                                <button
                                    type='button'
                                    key={value}
                                    onClick={() => handleDayToggle(value)}
                                    disabled={disabled}
                                    className={cn(
                                        'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
                                        isSelected
                                            ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-900',
                                        disabled &&
                                            'opacity-50 cursor-not-allowed',
                                    )}
                                >
                                    {label.slice(0, 3)}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {scheduleType === 'dates' && (
                <div className='space-y-3'>
                    <div className='flex items-center gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'>
                        <CalendarDays className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                        <span className='text-sm text-blue-700 dark:text-blue-300'>
                            Add specific release dates with episode counts.
                        </span>
                    </div>

                    {/* Add new date entry */}
                    <div className='flex gap-2 items-end'>
                        <div className='flex-1'>
                            <Label htmlFor='new-date' className='text-xs'>
                                Date
                            </Label>
                            <Input
                                id='new-date'
                                type='date'
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                disabled={disabled}
                                className='h-9'
                            />
                        </div>
                        <div className='w-40'>
                            <Label
                                htmlFor='new-date-time'
                                className='text-xs flex items-center gap-1'
                            >
                                <Clock className='w-3 h-3' />
                                Air Time
                            </Label>
                            <Input
                                id='new-date-time'
                                type='time'
                                value={currentScheduleTime}
                                onChange={handleTimeChange}
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
                                onChange={(e) => setNewEpisodes(e.target.value)}
                                disabled={disabled}
                                className='h-9'
                            />
                        </div>
                        <Button
                            type='button'
                            size='sm'
                            onClick={handleAddDateEntry}
                            disabled={disabled || !newDate}
                            className='h-9'
                        >
                            <Plus className='w-4 h-4' />
                        </Button>
                    </div>

                    {/* List of date entries */}
                    {((scheduleValue as DatesSchedule).entries || []).length >
                        0 && (
                        <div className='space-y-2 max-h-48 overflow-y-auto'>
                            {(
                                (scheduleValue as DatesSchedule).entries || []
                            ).map((entry) => (
                                <div
                                    key={entry.date}
                                    className='flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                                >
                                    <span className='flex-1 text-sm'>
                                        {formatDate(entry.date)}
                                    </span>
                                    {currentScheduleTime && (
                                        <span className='text-xs text-muted-foreground font-mono'>
                                            {currentScheduleTime} HKT
                                        </span>
                                    )}
                                    <Input
                                        type='number'
                                        min='1'
                                        value={entry.episodes}
                                        onChange={(e) =>
                                            handleUpdateEpisodes(
                                                entry.date,
                                                parseInt(e.target.value, 10) ||
                                                    1,
                                            )
                                        }
                                        disabled={disabled}
                                        className='w-16 h-8 text-center'
                                    />
                                    <span className='text-xs text-muted-foreground'>
                                        ep
                                    </span>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={() =>
                                            handleRemoveDateEntry(entry.date)
                                        }
                                        disabled={disabled}
                                        className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                                    >
                                        <Trash2 className='w-4 h-4' />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Time of day picker - shown for non-backlog, non-dates schedule types */}
            {scheduleType !== 'none' && scheduleType !== 'dates' && (
                <div className='space-y-2'>
                    <Label
                        htmlFor='schedule-time'
                        className='flex items-center gap-1.5 text-muted-foreground'
                    >
                        <Clock className='w-3.5 h-3.5' />
                        Air time (HKT)
                    </Label>
                    <div className='flex items-center gap-2 rounded-md border border-border bg-background px-2 py-2 w-fit'>
                        <Input
                            id='schedule-time'
                            type='time'
                            value={currentScheduleTime}
                            onChange={handleTimeChange}
                            disabled={disabled}
                            className='w-36 h-9 border-border/70 bg-transparent'
                        />
                        {(scheduleValue as { time?: string }).time && (
                            <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                    handleTimeChange({
                                        target: { value: '' },
                                    } as React.ChangeEvent<HTMLInputElement>)
                                }
                                disabled={disabled}
                                className='h-9 px-2 text-xs text-muted-foreground'
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                        Optional. When set, episodes count as aired at this
                        specific time.
                    </p>
                </div>
            )}

            {/* Preview - only show for recurring schedules */}
            {scheduleType !== 'none' && (
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                    Schedule:{' '}
                    <span className='font-medium text-gray-900 dark:text-gray-100'>
                        {ScheduleService.formatScheduleDisplay(
                            scheduleType,
                            scheduleValue,
                        )}
                    </span>
                </div>
            )}
        </div>
    )
}
