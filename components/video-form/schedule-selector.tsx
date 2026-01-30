'use client'

import { Archive } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { ScheduleService } from '@/lib/services/schedule-service'
import { cn } from '@/lib/utils'

import type {
    DailySchedule,
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
    disabled?: boolean
    className?: string
}

export function ScheduleSelector({
    scheduleType,
    scheduleValue,
    onTypeChange,
    onValueChange,
    disabled = false,
    className,
}: ScheduleSelectorProps) {
    const days = ScheduleService.getAllDays()

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as ScheduleType
        onTypeChange(newType)
        // Reset value to default for new type
        onValueChange(ScheduleService.getDefaultScheduleValue(newType))
    }

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const interval = Math.max(1, parseInt(e.target.value, 10) || 1)
        onValueChange({ interval })
    }

    const handleDayToggle = (day: DayOfWeek) => {
        const currentDays = (scheduleValue as WeeklySchedule).days || []
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

        onValueChange({ days: newDays })
    }

    const getIntervalLabel = () => {
        if (scheduleType === 'daily') {
            return 'day(s)'
        }
        return 'days'
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
