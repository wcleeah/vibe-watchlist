import { eq, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tags, videos, videoTags } from '@/lib/db/schema'

// GET /api/videos/[id] - Get a specific video with tags
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = parseInt((await params).id, 10)
        if (Number.isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid video ID' },
                { status: 400 },
            )
        }

        const result = await db
            .select({
                id: videos.id,
                url: videos.url,
                title: videos.title,
                platform: videos.platform,
                thumbnailUrl: videos.thumbnailUrl,
                isWatched: videos.isWatched,
                createdAt: videos.createdAt,
                updatedAt: videos.updatedAt,
                tags: sql`COALESCE(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`,
            })
            .from(videos)
            .leftJoin(videoTags, eq(videos.id, videoTags.videoId))
            .leftJoin(tags, eq(videoTags.tagId, tags.id))
            .where(eq(videos.id, id))
            .groupBy(videos.id)
            .limit(1)

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Video not found' },
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
            console.error('Error parsing tags for video:', result[0].id, error)
            parsedTags = []
        }

        const videoWithTags = {
            ...result[0],
            tags: parsedTags,
        }

        return NextResponse.json(videoWithTags)
    } catch (error) {
        console.error('Error fetching video:', error)
        return NextResponse.json(
            { error: 'Failed to fetch video' },
            { status: 500 },
        )
    }
}

// PUT /api/videos/[id] - Update a video
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = parseInt((await params).id, 10)
        if (Number.isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid video ID' },
                { status: 400 },
            )
        }

        const body = await request.json()
        const { isWatched, title, thumbnailUrl, tagIds } = body

        const updateData: {
            isWatched?: boolean
            title?: string
            thumbnailUrl?: string | null
            updatedAt: Date
        } = {
            updatedAt: new Date(),
        }

        if (typeof isWatched === 'boolean') {
            updateData.isWatched = isWatched
        }

        if (title !== undefined) {
            updateData.title = title
        }

        if (thumbnailUrl !== undefined) {
            updateData.thumbnailUrl = thumbnailUrl
        }

        const result = await db
            .update(videos)
            .set(updateData)
            .where(eq(videos.id, id))
            .returning()

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 },
            )
        }

        const videoWithTags = {
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

            await db.delete(videoTags).where(eq(videoTags.videoId, id))

            if (tagIds.length > 0) {
                const tagPromises = tagIds.map((tagId) =>
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

                const videoTagInserts = validTags.map((tag) => ({
                    videoId: id,
                    tagId: tag.id,
                }))

                await db.insert(videoTags).values(videoTagInserts)
                videoWithTags.tags = validTags
            }
        } else {
            const existingTags = await db
                .select({
                    id: tags.id,
                    name: tags.name,
                    color: tags.color,
                })
                .from(tags)
                .innerJoin(videoTags, eq(tags.id, videoTags.tagId))
                .where(eq(videoTags.videoId, id))

            videoWithTags.tags = existingTags
        }

        return NextResponse.json(videoWithTags)
    } catch (error) {
        console.error('Error updating video:', error)
        return NextResponse.json(
            { error: 'Failed to update video' },
            { status: 500 },
        )
    }
}

// DELETE /api/videos/[id] - Delete a video
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const id = parseInt((await params).id, 10)
        if (Number.isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid video ID' },
                { status: 400 },
            )
        }

        const result = await db
            .delete(videos)
            .where(eq(videos.id, id))
            .returning()

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting video:', error)
        return NextResponse.json(
            { error: 'Failed to delete video' },
            { status: 500 },
        )
    }
}
