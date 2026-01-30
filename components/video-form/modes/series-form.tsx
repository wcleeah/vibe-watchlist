'use client'

import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTagManagement } from '@/hooks/use-tag-management'
import { SeriesService } from '@/lib/services/series-service'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import type { VideoFormData } from '@/types/form'
import type { ScheduleType, ScheduleValue } from '@/types/series'
import { DatePickerField } from '../date-picker-field'
import { MetadataSelector } from '../metadata-selector'
import { ScheduleSelector } from '../schedule-selector'
import { TagInput } from '../tag-input'

interface SeriesFormProps {
    suggestions: MetadataSuggestion[]
    error?: string | null
    onReset: () => void
    onCreated?: () => void
}

export function SeriesForm({
    suggestions,
    error,
    onReset,
    onCreated,
}: SeriesFormProps) {
    const { setValue, getValues, watch } = useFormContext<VideoFormData>()
    const [selectedSuggestion, setSelectedSuggestion] = useState(0)

    // Series-specific state
    const [scheduleType, setScheduleType] = useState<ScheduleType>('weekly')
    const [scheduleValue, setScheduleValue] = useState<ScheduleValue>({
        days: ['friday'],
    })
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    )
    const [endDate, setEndDate] = useState<string | undefined>(undefined)
    const [totalEpisodes, setTotalEpisodes] = useState<string>('')
    const [saveAsDefault, setSaveAsDefault] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [seriesError, setSeriesError] = useState<string | null>(null)

    const tagManagement = useTagManagement()
    const platform = watch('platform')

    // Sync tags to form
    useEffect(() => {
        setValue('tags', tagManagement.selectedTagIds)
        setValue(
            'tagStrs',
            tagManagement.selectedTagIds.map((id) => {
                const tag = tagManagement.availableTags.find((t) => t.id === id)
                return tag?.name || ''
            }),
        )
    }, [tagManagement.selectedTagIds, tagManagement.availableTags, setValue])

    // Handle suggestion selection
    const handleSuggestionSelect = (index: number) => {
        setSelectedSuggestion(index)
        const suggestion = suggestions[index]
        if (suggestion) {
            setValue('title', suggestion.title)
            setValue('thumbnailUrl', suggestion.thumbnailUrl || '')
            const currentPlatform = getValues('platform')
            if (currentPlatform === 'unknown') {
                setValue('platform', suggestion.platform)
            }
        }
    }

    // Handle series submission
    const handleSubmit = async () => {
        setSeriesError(null)
        setIsSubmitting(true)

        try {
            const formData = getValues()
            await SeriesService.create({
                url: formData.url,
                title: formData.title,
                platform: formData.platform || 'unknown',
                thumbnailUrl: formData.thumbnailUrl || undefined,
                scheduleType,
                scheduleValue,
                startDate,
                endDate,
                tagIds: tagManagement.selectedTagIds,
                totalEpisodes: totalEpisodes
                    ? parseInt(totalEpisodes, 10)
                    : undefined,
            })

            // Save as default mode for platform if checked
            if (saveAsDefault && platform) {
                try {
                    await fetch('/api/platforms/default-mode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            platformId: platform,
                            defaultMode: 'series',
                        }),
                    })
                } catch {
                    // Non-critical error
                }
            }

            onCreated?.()
            onReset()
        } catch (err) {
            setSeriesError(
                err instanceof Error ? err.message : 'Failed to create series',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='space-y-6'>
            <MetadataSelector
                suggestions={suggestions}
                selectedIndex={selectedSuggestion}
                onSelect={handleSuggestionSelect}
                error={error || undefined}
                disabled={isSubmitting}
            />

            {/* Schedule Section */}
            <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                <ScheduleSelector
                    scheduleType={scheduleType}
                    scheduleValue={scheduleValue}
                    onTypeChange={setScheduleType}
                    onValueChange={setScheduleValue}
                    onEndDateChange={setEndDate}
                    onTotalEpisodesChange={setTotalEpisodes}
                    disabled={isSubmitting}
                />

                <div className='grid grid-cols-2 gap-4'>
                    <DatePickerField
                        id='start-date'
                        label='Start Date'
                        value={startDate}
                        onChange={(date) =>
                            setStartDate(
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
                        onChange={setEndDate}
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
                        onChange={(e) => setTotalEpisodes(e.target.value)}
                        disabled={isSubmitting || scheduleType === 'dates'}
                    />
                </div>

                <div className='flex items-center space-x-2'>
                    <Checkbox
                        id='save-default'
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        disabled={isSubmitting}
                    />
                    <Label
                        htmlFor='save-default'
                        className='text-sm text-muted-foreground cursor-pointer'
                    >
                        Save as default mode for this platform
                    </Label>
                </div>
            </div>

            <TagInput
                value={tagManagement.tagInput}
                onChange={tagManagement.setTagInput}
                onTagAdd={tagManagement.addTag}
                onTagRemove={tagManagement.removeTag}
                selectedTags={tagManagement.availableTags.filter((t) =>
                    tagManagement.selectedTagIds.includes(t.id),
                )}
                suggestions={tagManagement.filteredSuggestions}
                showSuggestions={true}
                onSelectSuggestion={tagManagement.selectTag}
                isLoading={tagManagement.isLoading}
                error={tagManagement.error}
            />

            <div className='flex gap-2'>
                <Button
                    type='button'
                    variant='secondary'
                    className='flex-1 h-12'
                    onClick={onReset}
                    disabled={isSubmitting}
                >
                    Reset
                </Button>
                <Button
                    type='button'
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className='flex-1 h-12'
                >
                    {isSubmitting ? 'Adding...' : 'Add Series'}
                </Button>
            </div>

            {seriesError && (
                <p className='text-sm text-destructive text-center'>
                    {seriesError}
                </p>
            )}
        </div>
    )
}
