import type { TagCreateRequest } from '@/types/api'
import type { Tag } from '@/types/tag'

export class TagService {
    private static readonly API_BASE = '/api/tags'

    static async create(data: TagCreateRequest): Promise<Tag> {
        const response = await fetch(TagService.API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create tag')
        }

        return response.json()
    }

    static async update(
        id: number,
        data: Partial<TagCreateRequest>,
    ): Promise<Tag> {
        const response = await fetch(`${TagService.API_BASE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update tag')
        }

        return response.json()
    }

    static async delete(id: number): Promise<void> {
        const response = await fetch(`${TagService.API_BASE}/${id}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete tag')
        }
    }

    static async getAll(): Promise<Tag[]> {
        const response = await fetch(TagService.API_BASE)

        if (!response.ok) {
            throw new Error('Failed to fetch tags')
        }

        return response.json()
    }

    static async getById(id: number): Promise<Tag> {
        const response = await fetch(`${TagService.API_BASE}/${id}`)

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to fetch tag')
        }

        return response.json()
    }

    static async search(query: string): Promise<Tag[]> {
        const response = await fetch(
            `${TagService.API_BASE}?search=${encodeURIComponent(query)}`,
        )

        if (!response.ok) {
            throw new Error('Failed to search tags')
        }

        return response.json()
    }
}
