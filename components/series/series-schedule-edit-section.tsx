'use client'

import { DatePickerField } from '@/components/video-form/date-picker-field'
import { ScheduleSelector } from '@/components/video-form/schedule-selector'
import type { ScheduleType, ScheduleValue } from '@/types/series'

interface SeriesScheduleEditSectionProps {
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    startDate: string
    endDate?: string
    disabled?: boolean
    onScheduleTypeChange: (type: ScheduleType) => void
    onScheduleValueChange: (value: ScheduleValue) => void
    onStartDateChange: (date: string) => void
    onEndDateChange: (date: string | undefined) => void
    onTotalEpisodesChange?: (value: string) => void
}

/**
 * Schedule editing section for series edit modal
 */
export function SeriesScheduleEditSection({
    scheduleType,
    scheduleValue,
    startDate,
    endDate,
    disabled = false,
    onScheduleTypeChange,
    onScheduleValueChange,
    onStartDateChange,
    onEndDateChange,
    onTotalEpisodesChange,
}: SeriesScheduleEditSectionProps) {
    return (
        <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
            <h3 className='font-medium'>Schedule</h3>
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
                    id='edit-start-date'
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
                    id='edit-end-date'
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
        </div>
    )
}
