import type {
    CreateSeasonRequest,
    Season,
    UpdateProgressRequest,
    UpdateSeasonRequest,
} from '@/types/series'

/**
 * Client-side service for season CRUD operations
 * All season endpoints are nested under /api/series/[seriesId]/seasons
 */
export class SeasonService {
    private static seasonUrl(seriesId: number, seasonId?: number): string {
        const base = `/api/series/${seriesId}/seasons`
        return seasonId ? `${base}/${seasonId}` : base
    }

    /**
     * Get all seasons for a series
     */
    static async getAll(seriesId: number): Promise<Season[]> {
        const response = await fetch(SeasonService.seasonUrl(seriesId))

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to fetch seasons')
        }

        const result = await response.json()
        return result.seasons
    }

    /**
     * Create a new season for a series
     * Automatically sets hasSeasons=true on the parent series
     */
    static async create(
        seriesId: number,
        data: CreateSeasonRequest,
    ): Promise<Season> {
        const response = await fetch(SeasonService.seasonUrl(seriesId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create season')
        }

        const result = await response.json()
        return result.season
    }

    /**
     * Update a season
     */
    static async update(
        seriesId: number,
        seasonId: number,
        data: UpdateSeasonRequest,
    ): Promise<Season> {
        const response = await fetch(
            SeasonService.seasonUrl(seriesId, seasonId),
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update season')
        }

        const result = await response.json()
        return result.season
    }

    /**
     * Delete a season
     * If this is the last season, hasSeasons is reset to false on the parent
     */
    static async delete(seriesId: number, seasonId: number): Promise<void> {
        const response = await fetch(
            SeasonService.seasonUrl(seriesId, seasonId),
            {
                method: 'DELETE',
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete season')
        }
    }

    /**
     * Catch up on a season (reset missed periods)
     */
    static async catchUp(seriesId: number, seasonId: number): Promise<Season> {
        const response = await fetch(
            `${SeasonService.seasonUrl(seriesId, seasonId)}/catch-up`,
            {
                method: 'POST',
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to catch up on season')
        }

        const result = await response.json()
        return result.season
    }

    /**
     * Mark a season as watched
     */
    static async markWatched(
        seriesId: number,
        seasonId: number,
    ): Promise<Season> {
        const response = await fetch(
            `${SeasonService.seasonUrl(seriesId, seasonId)}/mark-watched`,
            {
                method: 'POST',
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to mark season as watched')
        }

        const result = await response.json()
        return result.season
    }

    /**
     * Unmark a season as watched
     */
    static async unmarkWatched(
        seriesId: number,
        seasonId: number,
    ): Promise<Season> {
        const response = await fetch(
            `${SeasonService.seasonUrl(seriesId, seasonId)}/unmark-watched`,
            {
                method: 'POST',
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to unmark season as watched')
        }

        const result = await response.json()
        return result.season
    }

    /**
     * Update episode progress for a season
     */
    static async updateProgress(
        seriesId: number,
        seasonId: number,
        data: UpdateProgressRequest,
    ): Promise<Season> {
        const response = await fetch(
            `${SeasonService.seasonUrl(seriesId, seasonId)}/update-progress`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            },
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update season progress')
        }

        const result = await response.json()
        return result.season
    }

    /**
     * Increment episode progress by 1
     */
    static async incrementProgress(
        seriesId: number,
        seasonId: number,
    ): Promise<Season> {
        return SeasonService.updateProgress(seriesId, seasonId, {
            increment: 1,
        })
    }
}
