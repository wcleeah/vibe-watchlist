'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ScheduleType, ScheduleValue } from '@/types/series'
import { DatePickerField } from './date-picker-field'
import { ScheduleSelector } from './schedule-selector'

interface ScheduleSectionProps {
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate?: string
    totalEpisodes?: string
    isSubmitting?: boolean
    onScheduleTypeChange: (type: ScheduleType) => void
    onScheduleValueChange: (value: ScheduleValue) => void
    onStartDateChange: (date: string) => void
    onEndDateChange: (date?: string) => void
    onTotalEpisodesChange: (episodes: string) => void
}

export function ScheduleSection({
    scheduleType,
    scheduleValue,
    startDate,
    endDate,
    totalEpisodes,
    isSubmitting = false,
    onScheduleTypeChange,
    onScheduleValueChange,
    onStartDateChange,
    onEndDateChange,
    onTotalEpisodesChange,
}: ScheduleSectionProps) {
    return (
        <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
            <ScheduleSelector
                scheduleType={scheduleType}
                scheduleValue={scheduleValue}
                onTypeChange={onScheduleTypeChange}
                onValueChange={onScheduleValueChange}
                onEndDateChange={onEndDateChange}
                onTotalEpisodesChange={onTotalEpisodesChange}
                disabled={isSubmitting}
            />

            <div className='grid grid-cols-2 gap-4'>
                <DatePickerField
                    id='start-date'
                    label='Start Date'
                    value={startDate}
                    onChange={(date) =>
                        onStartDateChange(
                            date || new Date().toISOString().split('T')[0],
                        )
                    }
                    required
                    disabled={isSubmitting}
                />
                <DatePickerField
                    id='end-date'
                    label={
                        scheduleType === 'dates'
                            ? 'End Date (Auto)'
                            : 'End Date (Optional)'
                    }
                    value={endDate}
                    onChange={onEndDateChange}
                    disabled={isSubmitting || scheduleType === 'dates'}
                />
            </div>

            <div className='space-y-1.5'>
                <Label htmlFor='series-total-episodes' className='text-sm'>
                    {scheduleType === 'dates'
                        ? 'Total Episodes (Auto)'
                        : 'Total Episodes (Optional)'}
                </Label>
                <Input
                    id='series-total-episodes'
                    type='number'
                    min='1'
                    placeholder={
                        scheduleType === 'dates'
                            ? 'Calculated from dates'
                            : 'e.g., 12 - leave empty if unknown'
                    }
                    value={totalEpisodes}
                    onChange={(e) => onTotalEpisodesChange(e.target.value)}
                    disabled={isSubmitting || scheduleType === 'dates'}
                />
            </div>
        </div>
    )
}
