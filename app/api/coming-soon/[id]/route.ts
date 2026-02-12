import { eq, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comingSoon, comingSoonTags, tags } from '@/lib/db/schema'
import { parseToHKT } from '@/lib/utils/hkt-date'

// GET /api/coming-soon/[id] - Get a specific coming soon item with tags
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = parseInt((await params).id, 10)
        if (Number.isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        const result = await db
            .select({
                id: comingSoon.id,
                url: comingSoon.url,
                title: comingSoon.title,
                platform: comingSoon.platform,
                thumbnailUrl: comingSoon.thumbnailUrl,
                releaseDate: comingSoon.releaseDate,
                transformedAt: comingSoon.transformedAt,
                sortOrder: comingSoon.sortOrder,
                createdAt: comingSoon.createdAt,
                updatedAt: comingSoon.updatedAt,
                tags: sql`COALESCE(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`,
            })
            .from(comingSoon)
            .leftJoin(
                comingSoonTags,
                eq(comingSoon.id, comingSoonTags.comingSoonId),
            )
            .leftJoin(tags, eq(comingSoonTags.tagId, tags.id))
            .where(eq(comingSoon.id, id))
            .groupBy(comingSoon.id)
            .limit(1)

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Coming soon item not found' },
                { status: 404 },
            )
        }

        let parsedTags = []
        try {
            if (Array.isArray(result[0].tags)) {
                parsedTags = result[0].tags
            } else if (typeof result[0].tags === 'string') {
                parsedTags =
                    result[0].tags && result[0].tags.trim() !== ''
                        ? JSON.parse(result[0].tags)
                        : []
            } else {
                parsedTags = []
            }
        } catch (error) {
            console.error(
                'Error parsing tags for coming soon item:',
                result[0].id,
                error,
            )
            parsedTags = []
        }

        return NextResponse.json({
            ...result[0],
            tags: parsedTags,
        })
    } catch (error) {
        console.error('Error fetching coming soon item:', error)
        return NextResponse.json(
            { error: 'Failed to fetch coming soon item' },
            { status: 500 },
        )
    }
}

// PUT /api/coming-soon/[id] - Update a coming soon item
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = parseInt((await params).id, 10)
        if (Number.isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        const body = await request.json()
        const { title, thumbnailUrl, releaseDate, tagIds, transformedAt } = body

        const updateData: {
            title?: string
            thumbnailUrl?: string | null
            releaseDate?: Date
            transformedAt?: Date | null
            updatedAt: Date
        } = {
            updatedAt: new Date(),
        }

        if (title !== undefined) {
            updateData.title = title
        }

        if (thumbnailUrl !== undefined) {
            updateData.thumbnailUrl = thumbnailUrl
        }

        if (releaseDate !== undefined) {
            updateData.releaseDate = parseToHKT(releaseDate)
        }

        if (transformedAt !== undefined) {
            updateData.transformedAt = transformedAt
                ? new Date(transformedAt)
                : null
        }

        const result = await db
            .update(comingSoon)
            .set(updateData)
            .where(eq(comingSoon.id, id))
            .returning()

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Coming soon item not found' },
                { status: 404 },
            )
        }

        const itemWithTags = {
            ...result[0],
            tags: [] as Array<{
                id: number
                name: string
                color: string | null
            }>,
        }

        if (tagIds !== undefined) {
            if (!Array.isArray(tagIds)) {
                return NextResponse.json(
                    { error: 'tagIds must be an array' },
                    { status: 400 },
                )
            }

            await db
                .delete(comingSoonTags)
                .where(eq(comingSoonTags.comingSoonId, id))

            if (tagIds.length > 0) {
                const tagPromises = tagIds.map((tagId: number) =>
                    db.select().from(tags).where(eq(tags.id, tagId)).limit(1),
                )

                const tagResults = await Promise.all(tagPromises)
                const validTags = tagResults
                    .map((result) => result[0])
                    .filter((tag) => tag !== undefined)

                if (validTags.length !== tagIds.length) {
                    return NextResponse.json(
                        { error: 'One or more tag IDs do not exist' },
                        { status: 400 },
                    )
                }

                const tagInserts = validTags.map((tag) => ({
                    comingSoonId: id,
                    tagId: tag.id,
                }))

                await db.insert(comingSoonTags).values(tagInserts)
                itemWithTags.tags = validTags
            }
        } else {
            const existingTags = await db
                .select({
                    id: tags.id,
                    name: tags.name,
                    color: tags.color,
                })
                .from(tags)
                .innerJoin(comingSoonTags, eq(tags.id, comingSoonTags.tagId))
                .where(eq(comingSoonTags.comingSoonId, id))

            itemWithTags.tags = existingTags
        }

        return NextResponse.json(itemWithTags)
    } catch (error) {
        console.error('Error updating coming soon item:', error)
        return NextResponse.json(
            { error: 'Failed to update coming soon item' },
            { status: 500 },
        )
    }
}

// DELETE /api/coming-soon/[id] - Delete a coming soon item
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = parseInt((await params).id, 10)
        if (Number.isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        const result = await db
            .delete(comingSoon)
            .where(eq(comingSoon.id, id))
            .returning()

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Coming soon item not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting coming soon item:', error)
        return NextResponse.json(
            { error: 'Failed to delete coming soon item' },
            { status: 500 },
        )
    }
}
