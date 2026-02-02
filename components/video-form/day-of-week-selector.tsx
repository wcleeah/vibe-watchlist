'use client'

import { Label } from '@/components/ui/label'
import { ScheduleService } from '@/lib/services/schedule-service'
import { cn } from '@/lib/utils'
import type { DayOfWeek, WeeklySchedule } from '@/types/series'

interface DayOfWeekSelectorProps {
    selectedDays: DayOfWeek[]
    onDayToggle: (day: DayOfWeek) => void
    disabled?: boolean
}

/**
 * Component for selecting days of the week in a weekly schedule
 */
export function DayOfWeekSelector({
    selectedDays,
    onDayToggle,
    disabled = false,
}: DayOfWeekSelectorProps) {
    const days = ScheduleService.getAllDays()

    return (
        <div className='space-y-2'>
            <Label>Days of the Week</Label>
            <div className='flex flex-wrap gap-2'>
                {days.map(({ value, label }) => {
                    const isSelected = selectedDays.includes(value)
                    return (
                        <button
                            type='button'
                            key={value}
                            onClick={() => onDayToggle(value)}
                            disabled={disabled}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
                                isSelected
                                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-900',
                                disabled && 'opacity-50 cursor-not-allowed',
                            )}
                        >
                            {label.slice(0, 3)}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
