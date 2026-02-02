'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ScheduleType } from '@/types/series'

interface IntervalInputProps {
    scheduleType: ScheduleType
    interval: number
    onChange: (interval: number) => void
    disabled?: boolean
}

/**
 * Component for inputting interval value in daily/custom schedules
 */
export function IntervalInput({
    scheduleType,
    interval,
    onChange,
    disabled = false,
}: IntervalInputProps) {
    const getIntervalLabel = () => {
        if (scheduleType === 'daily') {
            return 'day(s)'
        }
        return 'days'
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, parseInt(e.target.value, 10) || 1)
        onChange(value)
    }

    return (
        <div className='space-y-2'>
            <Label htmlFor='interval'>
                Every{' '}
                <input
                    id='interval'
                    type='number'
                    min='1'
                    max='365'
                    value={interval}
                    onChange={handleChange}
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
    )
}
