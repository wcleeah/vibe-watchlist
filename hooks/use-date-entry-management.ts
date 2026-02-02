'use client'

import { useCallback, useState } from 'react'

import type {
    DateScheduleEntry,
    DatesSchedule,
    ScheduleValue,
} from '@/types/series'

interface UseDateEntryManagementOptions {
    onValueChange: (value: ScheduleValue) => void
    onEndDateChange?: (endDate: string | undefined) => void
    onTotalEpisodesChange?: (totalEpisodes: string) => void
}

interface UseDateEntryManagementReturn {
    newDate: string
    newEpisodes: string
    setNewDate: (date: string) => void
    setNewEpisodes: (episodes: string) => void
    addEntry: (scheduleValue: ScheduleValue) => void
    removeEntry: (date: string, scheduleValue: ScheduleValue) => void
    updateEpisodes: (
        date: string,
        episodes: number,
        scheduleValue: ScheduleValue,
    ) => void
}

/**
 * Hook for managing date entries in a dates-based schedule
 */
export function useDateEntryManagement(
    options: UseDateEntryManagementOptions,
): UseDateEntryManagementReturn {
    const { onValueChange, onEndDateChange, onTotalEpisodesChange } = options

    const [newDate, setNewDate] = useState('')
    const [newEpisodes, setNewEpisodes] = useState('1')

    const updateDerivedFieldsFromEntries = useCallback(
        (entries: DateScheduleEntry[]) => {
            if (entries.length > 0) {
                const sortedEntries = [...entries].sort(
                    (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime(),
                )
                onEndDateChange?.(sortedEntries[sortedEntries.length - 1].date)
                const totalEpisodes = entries.reduce(
                    (sum, e) => sum + e.episodes,
                    0,
                )
                onTotalEpisodesChange?.(totalEpisodes.toString())
            } else {
                onEndDateChange?.(undefined)
                onTotalEpisodesChange?.('')
            }
        },
        [onEndDateChange, onTotalEpisodesChange],
    )

    const addEntry = useCallback(
        (scheduleValue: ScheduleValue) => {
            if (!newDate) return

            const entries = (scheduleValue as DatesSchedule).entries || []
            const episodeCount = Math.max(1, parseInt(newEpisodes, 10) || 1)

            let newEntries: DateScheduleEntry[]

            const existingIndex = entries.findIndex((e) => e.date === newDate)
            if (existingIndex >= 0) {
                newEntries = [...entries]
                newEntries[existingIndex] = {
                    date: newDate,
                    episodes: episodeCount,
                }
            } else {
                const newEntry: DateScheduleEntry = {
                    date: newDate,
                    episodes: episodeCount,
                }
                newEntries = [...entries, newEntry].sort(
                    (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime(),
                )
            }

            onValueChange({ entries: newEntries })
            updateDerivedFieldsFromEntries(newEntries)
            setNewDate('')
            setNewEpisodes('1')
        },
        [newDate, newEpisodes, onValueChange, updateDerivedFieldsFromEntries],
    )

    const removeEntry = useCallback(
        (date: string, scheduleValue: ScheduleValue) => {
            const entries = (scheduleValue as DatesSchedule).entries || []
            const newEntries = entries.filter((e) => e.date !== date)
            onValueChange({ entries: newEntries })
            updateDerivedFieldsFromEntries(newEntries)
        },
        [onValueChange, updateDerivedFieldsFromEntries],
    )

    const updateEpisodes = useCallback(
        (date: string, episodes: number, scheduleValue: ScheduleValue) => {
            const entries = (scheduleValue as DatesSchedule).entries || []
            const newEntries = entries.map((e) =>
                e.date === date ? { ...e, episodes: Math.max(1, episodes) } : e,
            )
            onValueChange({ entries: newEntries })
            updateDerivedFieldsFromEntries(newEntries)
        },
        [onValueChange, updateDerivedFieldsFromEntries],
    )

    return {
        newDate,
        newEpisodes,
        setNewDate,
        setNewEpisodes,
        addEntry,
        removeEntry,
        updateEpisodes,
    }
}
