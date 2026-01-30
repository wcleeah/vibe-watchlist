import type {
    CreateSeriesRequest,
    SeriesFilters,
    SeriesWithTags,
    UpdateProgressRequest,
    UpdateSeriesRequest,
} from '@/types/series'

/**
 * Client-side service for series CRUD operations
 */
export class SeriesService {
    private static readonly API_BASE = '/api/series'

    /**
     * Create a new series
     */
    static async create(data: CreateSeriesRequest): Promise<SeriesWithTags> {
        const response = await fetch(SeriesService.API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create series')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Get all series with optional filters
     */
    static async getAll(filters?: SeriesFilters): Promise<SeriesWithTags[]> {
        const params = new URLSearchParams()

        if (filters?.status) {
            params.set('status', filters.status)
        }
        if (filters?.platform) {
            params.set('platform', filters.platform)
        }
        if (filters?.search) {
            params.set('search', filters.search)
        }
        if (filters?.isWatched !== undefined) {
            params.set('isWatched', String(filters.isWatched))
        }

        const url = params.toString()
            ? `${SeriesService.API_BASE}?${params.toString()}`
            : SeriesService.API_BASE

        const response = await fetch(url)

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to fetch series')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Get a single series by ID
     */
    static async getById(id: number): Promise<SeriesWithTags> {
        const response = await fetch(`${SeriesService.API_BASE}/${id}`)

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to fetch series')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Update a series
     */
    static async update(
        id: number,
        data: UpdateSeriesRequest,
    ): Promise<SeriesWithTags> {
        const response = await fetch(`${SeriesService.API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update series')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Delete a series
     */
    static async delete(id: number): Promise<void> {
        const response = await fetch(`${SeriesService.API_BASE}/${id}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete series')
        }
    }

    /**
     * Catch up on a series (reset missed periods)
     * This resets the missed count and updates next episode date
     */
    static async catchUp(id: number): Promise<SeriesWithTags> {
        const response = await fetch(
            `${SeriesService.API_BASE}/${id}/catch-up`,
            {
                method: 'POST',
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to catch up on series')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Mark a series as watched (finished)
     * Sets isWatched: true
     */
    static async markWatched(id: number): Promise<SeriesWithTags> {
        const response = await fetch(
            `${SeriesService.API_BASE}/${id}/mark-watched`,
            {
                method: 'POST',
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to mark series as watched')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Unmark a series as watched (move back to active)
     * Sets isWatched: false
     */
    static async unmarkWatched(id: number): Promise<SeriesWithTags> {
        const response = await fetch(
            `${SeriesService.API_BASE}/${id}/unmark-watched`,
            {
                method: 'POST',
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to unmark series as watched')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Update episode progress for a series
     * Can set absolute value or increment
     */
    static async updateProgress(
        id: number,
        data: UpdateProgressRequest,
    ): Promise<SeriesWithTags> {
        const response = await fetch(
            `${SeriesService.API_BASE}/${id}/update-progress`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update progress')
        }

        const result = await response.json()
        return result.series
    }

    /**
     * Increment episode progress by 1
     * Convenience method for +1 button
     */
    static async incrementProgress(id: number): Promise<SeriesWithTags> {
        return SeriesService.updateProgress(id, { increment: 1 })
    }
}
