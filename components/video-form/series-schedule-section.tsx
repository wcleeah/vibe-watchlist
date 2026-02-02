'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ScheduleType, ScheduleValue } from '@/types/series'
import { DatePickerField } from './date-picker-field'
import { ScheduleSelector } from './schedule-selector'

interface SeriesScheduleSectionProps {
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate?: string
    totalEpisodes: string
    saveAsDefault: boolean
    disabled?: boolean
    onScheduleTypeChange: (type: ScheduleType) => void
    onScheduleValueChange: (value: ScheduleValue) => void
    onStartDateChange: (date: string) => void
    onEndDateChange: (date: string | undefined) => void
    onTotalEpisodesChange: (value: string) => void
    onSaveAsDefaultChange: (checked: boolean) => void
}

/**
 * Series schedule configuration section for the video form
 */
export function SeriesScheduleSection({
    scheduleType,
    scheduleValue,
    startDate,
    endDate,
    totalEpisodes,
    saveAsDefault,
    disabled = false,
    onScheduleTypeChange,
    onScheduleValueChange,
    onStartDateChange,
    onEndDateChange,
    onTotalEpisodesChange,
    onSaveAsDefaultChange,
}: SeriesScheduleSectionProps) {
    return (
        <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
            <ScheduleSelector
                scheduleType={scheduleType}
                scheduleValue={scheduleValue}
                onTypeChange={onScheduleTypeChange}
                onValueChange={onScheduleValueChange}
                onEndDateChange={onEndDateChange}
                onTotalEpisodesChange={onTotalEpisodesChange}
                disabled={disabled}
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
                    disabled={disabled}
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
                    disabled={disabled || scheduleType === 'dates'}
                />
            </div>

            {/* Episode Count */}
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
                    disabled={disabled || scheduleType === 'dates'}
                />
            </div>

            {/* Save as default mode checkbox */}
            <div className='flex items-center space-x-2'>
                <Checkbox
                    id='save-default'
                    checked={saveAsDefault}
                    onChange={(e) => onSaveAsDefaultChange(e.target.checked)}
                    disabled={disabled}
                />
                <Label
                    htmlFor='save-default'
                    className='text-sm text-muted-foreground cursor-pointer'
                >
                    Save as default mode for this platform
                </Label>
            </div>
        </div>
    )
}
