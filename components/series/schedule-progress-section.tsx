'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ScheduleType, ScheduleValue } from '@/types/series'
import { computeEpisodeFields } from '@/types/series'
import { DatePickerField } from '../video-form/date-picker-field'
import { ScheduleSelector } from '../video-form/schedule-selector'

interface ActiveControl {
    id: string
    checked: boolean
    onChange: (checked: boolean) => void
}

interface ResumeTrackingControl {
    id: string
    value: string
    onChange: (value: string) => void
    helperText?: string
}

interface ScheduleProgressSectionProps {
    disabled: boolean
    scheduleType: ScheduleType
    scheduleValue: ScheduleValue
    onScheduleTypeChange: (type: ScheduleType) => void
    onScheduleValueChange: (value: ScheduleValue) => void
    onScheduleEndDateChange?: (endDate: string | undefined) => void
    onScheduleTotalEpisodesChange?: (totalEpisodes: string) => void
    startDateId: string
    startDate: string
    onStartDateChange: (value: string) => void
    endDateId: string
    endDateLabel: string
    endDate: string | undefined
    onEndDateChange: (value: string | undefined) => void
    endDateDisabled?: boolean
    resumeTracking?: ResumeTrackingControl
    episodesAired: string
    onEpisodesAiredChange: (value: string) => void
    episodesWatched: string
    onEpisodesWatchedChange: (value: string) => void
    episodesRemaining: string
    onEpisodesRemainingChange: (value: string) => void
    episodesRemainingLabel: string
    episodesRemainingPlaceholder?: string
    episodesRemainingDisabled?: boolean
    activeControl?: ActiveControl
}

export function ScheduleProgressSection({
    disabled,
    scheduleType,
    scheduleValue,
    onScheduleTypeChange,
    onScheduleValueChange,
    onScheduleEndDateChange,
    onScheduleTotalEpisodesChange,
    startDateId,
    startDate,
    onStartDateChange,
    endDateId,
    endDateLabel,
    endDate,
    onEndDateChange,
    endDateDisabled = false,
    resumeTracking,
    episodesAired,
    onEpisodesAiredChange,
    episodesWatched,
    onEpisodesWatchedChange,
    episodesRemaining,
    onEpisodesRemainingChange,
    episodesRemainingLabel,
    episodesRemainingPlaceholder = 'Unknown',
    episodesRemainingDisabled = false,
    activeControl,
}: ScheduleProgressSectionProps) {
    const computed = computeEpisodeFields({
        episodesAired: parseInt(episodesAired, 10) || 0,
        episodesRemaining:
            episodesRemaining !== '' &&
            !Number.isNaN(parseInt(episodesRemaining, 10))
                ? parseInt(episodesRemaining, 10)
                : null,
        episodesWatched: parseInt(episodesWatched, 10) || 0,
    })

    return (
        <div className='space-y-4 rounded-lg bg-muted/50 p-4'>
            <h3 className='font-medium'>Schedule & Episode Progress</h3>

            <ScheduleSelector
                scheduleType={scheduleType}
                scheduleValue={scheduleValue}
                onTypeChange={onScheduleTypeChange}
                onValueChange={onScheduleValueChange}
                onEndDateChange={onScheduleEndDateChange}
                onTotalEpisodesChange={onScheduleTotalEpisodesChange}
                disabled={disabled}
            />

            <div className='border-t border-border pt-4'>
                <div className='grid grid-cols-2 gap-4'>
                    <DatePickerField
                        id={startDateId}
                        label='Start Date'
                        value={startDate}
                        onChange={(d) =>
                            onStartDateChange(
                                d || new Date().toISOString().split('T')[0],
                            )
                        }
                        required
                        disabled={disabled}
                    />
                    <DatePickerField
                        id={endDateId}
                        label={endDateLabel}
                        value={endDate}
                        onChange={onEndDateChange}
                        disabled={disabled || endDateDisabled}
                    />
                </div>
            </div>

            {resumeTracking ? (
                <div className='space-y-2'>
                    <Label htmlFor={resumeTracking.id}>
                        Resume Tracking From
                    </Label>
                    <Input
                        id={resumeTracking.id}
                        type='datetime-local'
                        value={resumeTracking.value}
                        onChange={(e) =>
                            resumeTracking.onChange(e.target.value)
                        }
                        disabled={disabled}
                    />
                    {resumeTracking.helperText ? (
                        <p className='text-xs text-muted-foreground'>
                            {resumeTracking.helperText}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className='space-y-4 border-t-2 border-foreground/30 pt-4'>
                <h4 className='font-medium'>Episode Progress</h4>
                <div className='grid grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                        <Label>Episodes Aired</Label>
                        <Input
                            type='number'
                            min='0'
                            value={episodesAired}
                            onChange={(e) =>
                                onEpisodesAiredChange(e.target.value)
                            }
                            disabled={disabled}
                            placeholder='0'
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label>Episodes Watched</Label>
                        <Input
                            type='number'
                            min='0'
                            value={episodesWatched}
                            onChange={(e) =>
                                onEpisodesWatchedChange(e.target.value)
                            }
                            disabled={disabled}
                            placeholder='0'
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label>{episodesRemainingLabel}</Label>
                        <Input
                            type='number'
                            min='0'
                            value={episodesRemaining}
                            onChange={(e) =>
                                onEpisodesRemainingChange(e.target.value)
                            }
                            placeholder={episodesRemainingPlaceholder}
                            disabled={disabled || episodesRemainingDisabled}
                        />
                    </div>
                </div>
                <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                        <Label className='text-xs text-muted-foreground'>
                            Total (computed)
                        </Label>
                        <p className='font-medium'>{computed.episodesTotal}</p>
                    </div>
                    <div>
                        <Label className='text-xs text-muted-foreground'>
                            Unwatched (computed)
                        </Label>
                        <p className='font-medium'>
                            {computed.episodesUnwatched}
                        </p>
                    </div>
                    <div>
                        <Label className='text-xs text-muted-foreground'>
                            Behind (computed)
                        </Label>
                        <p className='font-medium'>{computed.episodesBehind}</p>
                    </div>
                </div>

                {activeControl ? (
                    <div className='flex items-center space-x-2 pt-1'>
                        <input
                            type='checkbox'
                            id={activeControl.id}
                            checked={activeControl.checked}
                            onChange={(e) =>
                                activeControl.onChange(e.target.checked)
                            }
                            disabled={disabled}
                            className='h-4 w-4 rounded border-gray-300'
                        />
                        <Label
                            htmlFor={activeControl.id}
                            className='cursor-pointer'
                        >
                            Active (continue tracking new episodes)
                        </Label>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
