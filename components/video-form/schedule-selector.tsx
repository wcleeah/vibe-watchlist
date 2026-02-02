'use client'

import { Label } from '@/components/ui/label'
import { useDateEntryManagement } from '@/hooks/use-date-entry-management'
import { ScheduleService } from '@/lib/services/schedule-service'
import { cn } from '@/lib/utils'
import type {
    DailySchedule,
    DatesSchedule,
    DayOfWeek,
    ScheduleType,
    ScheduleValue,
    WeeklySchedule,
} from '@/types/series'
import { DateEntryForm } from './date-entry-form'
import { DateEntryList } from './date-entry-list'
import { DayOfWeekSelector } from './day-of-week-selector'
import { IntervalInput } from './interval-input'
import { ScheduleInfoBanner } from './schedule-info-banner'

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
    const {
        newDate,
        newEpisodes,
        setNewDate,
        setNewEpisodes,
        addEntry,
        removeEntry,
        updateEpisodes,
    } = useDateEntryManagement({
        onValueChange,
        onEndDateChange,
        onTotalEpisodesChange,
    })

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as ScheduleType
        onTypeChange(newType)
        onValueChange(ScheduleService.getDefaultScheduleValue(newType))
    }

    const handleDayToggle = (day: DayOfWeek) => {
        const currentDays = (scheduleValue as WeeklySchedule).days || []
        let newDays: DayOfWeek[]

        if (currentDays.includes(day)) {
            newDays = currentDays.filter((d) => d !== day)
            if (newDays.length === 0) {
                newDays = [day]
            }
        } else {
            newDays = [...currentDays, day]
        }

        onValueChange({ days: newDays })
    }

    const handleIntervalChange = (interval: number) => {
        onValueChange({ interval })
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Schedule Type Selector */}
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

            {/* Backlog Info Banner */}
            {scheduleType === 'none' && <ScheduleInfoBanner type='backlog' />}

            {/* Daily/Custom Interval Input */}
            {(scheduleType === 'daily' || scheduleType === 'custom') && (
                <IntervalInput
                    scheduleType={scheduleType}
                    interval={(scheduleValue as DailySchedule).interval || 1}
                    onChange={handleIntervalChange}
                    disabled={disabled}
                />
            )}

            {/* Weekly Day Selector */}
            {scheduleType === 'weekly' && (
                <DayOfWeekSelector
                    selectedDays={(scheduleValue as WeeklySchedule).days || []}
                    onDayToggle={handleDayToggle}
                    disabled={disabled}
                />
            )}

            {/* Dates Schedule Section */}
            {scheduleType === 'dates' && (
                <div className='space-y-3'>
                    <ScheduleInfoBanner type='dates' />

                    <DateEntryForm
                        newDate={newDate}
                        newEpisodes={newEpisodes}
                        onDateChange={setNewDate}
                        onEpisodesChange={setNewEpisodes}
                        onAdd={() => addEntry(scheduleValue)}
                        disabled={disabled}
                    />

                    <DateEntryList
                        entries={(scheduleValue as DatesSchedule).entries || []}
                        onUpdateEpisodes={(date, episodes) =>
                            updateEpisodes(date, episodes, scheduleValue)
                        }
                        onRemove={(date) => removeEntry(date, scheduleValue)}
                        disabled={disabled}
                    />
                </div>
            )}

            {/* Schedule Preview */}
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
