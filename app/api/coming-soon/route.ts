import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comingSoon, comingSoonTags, tags } from '@/lib/db/schema'
import { PlatformDataService } from '@/lib/services/platform-data-service'
import { nowHKT, parseToHKT } from '@/lib/utils/hkt-date'
import {
    parseVideoUrlWithPlatforms,
    type VideoPlatform,
} from '@/lib/utils/url-parser'

// GET /api/coming-soon - Get coming soon items with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const transformed = searchParams.get('transformed')
        const platforms = searchParams.get('platforms')
        const search = searchParams.get('search')
        const sortBy = searchParams.get('sortBy')
        const sortOrder = searchParams.get('sortOrder') || 'desc'
        const limit = parseInt(searchParams.get('limit') || '50', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)

        const whereConditions = []
        const now = nowHKT()

        // Filter by transformed status
        if (transformed === 'true') {
            whereConditions.push(isNotNull(comingSoon.transformedAt))
        } else if (transformed === 'false') {
            whereConditions.push(isNull(comingSoon.transformedAt))
        }

        // Platform filter
        if (platforms) {
            const enabledPlatforms = await PlatformDataService.getPlatforms()
            const validPlatformIds = enabledPlatforms.map((p) => p.platformId)
            const platformList = platforms
                .split(',')
                .filter((p) =>
                    validPlatformIds.includes(p.trim()),
                ) as VideoPlatform[]
            if (platformList.length > 0) {
                whereConditions.push(inArray(comingSoon.platform, platformList))
            }
        }

        // Search in titles and tags
        if (search?.trim()) {
            whereConditions.push(sql`(
                ${comingSoon.title} ILIKE ${`%${search.trim()}%`} OR
                EXISTS (
                    SELECT 1 FROM ${comingSoonTags}
                    JOIN ${tags} ON ${comingSoonTags.tagId} = ${tags.id}
                    WHERE ${comingSoonTags.comingSoonId} = ${comingSoon.id} AND ${tags.name} ILIKE ${`%${search.trim()}%`}
                )
            )`)
        }

        // Build order clause
        const useCustomOrder = !sortBy || sortBy === 'sortOrder'
        const isNotTransformedTab = transformed === 'false'

        let orderBySql: ReturnType<typeof sql>
        if (useCustomOrder) {
            if (isNotTransformedTab) {
                // For "not transformed" tab: released items first, then by sort order
                orderBySql = sql`CASE WHEN ${comingSoon.releaseDate} <= ${now} THEN 0 ELSE 1 END ASC, ${comingSoon.sortOrder} ASC, ${comingSoon.releaseDate} ASC`
            } else {
                orderBySql = sql`${comingSoon.sortOrder} ASC, ${comingSoon.releaseDate} ASC`
            }
        } else {
            const orderDirection = sortOrder === 'asc' ? sql`ASC` : sql`DESC`
            const baseOrder = (() => {
                switch (sortBy) {
                    case 'updatedAt':
                        return sql`${comingSoon.updatedAt} ${orderDirection}`
                    case 'title':
                        return sql`${comingSoon.title} ${orderDirection}`
                    case 'releaseDate':
                        return sql`${comingSoon.releaseDate} ${orderDirection}`
                    default:
                        return sql`${comingSoon.createdAt} ${orderDirection}`
                }
            })()
            if (isNotTransformedTab) {
                // For "not transformed" tab: released items first, then by chosen sort
                orderBySql = sql`CASE WHEN ${comingSoon.releaseDate} <= ${now} THEN 0 ELSE 1 END ASC, ${baseOrder}`
            } else {
                orderBySql = baseOrder
            }
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
                isReleased: sql<boolean>`${comingSoon.releaseDate} <= ${now}`,
                tags: sql`COALESCE(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`,
            })
            .from(comingSoon)
            .leftJoin(
                comingSoonTags,
                eq(comingSoon.id, comingSoonTags.comingSoonId),
            )
            .leftJoin(tags, eq(comingSoonTags.tagId, tags.id))
            .where(
                whereConditions.length > 0
                    ? and(...whereConditions)
                    : undefined,
            )
            .groupBy(comingSoon.id)
            .orderBy(orderBySql)
            .limit(limit)
            .offset(offset)

        // Parse tags and add highlighting
        const itemsWithTags = result.map(
            (item: {
                id: number
                title: string | null
                tags: unknown
                [key: string]: unknown
            }) => {
                let parsedTags: Array<Record<string, unknown>> = []

                try {
                    if (typeof item.tags === 'string') {
                        parsedTags = JSON.parse(item.tags)
                    } else if (Array.isArray(item.tags)) {
                        parsedTags = item.tags
                    }
                } catch {
                    parsedTags = []
                }

                let highlightedTitle = item.title
                let highlightedTags = parsedTags

                if (search?.trim()) {
                    const searchTerm = search.trim().toLowerCase()
                    const searchRegex = new RegExp(
                        `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
                        'gi',
                    )

                    if (item.title) {
                        highlightedTitle = item.title.replace(
                            searchRegex,
                            '<mark>$1</mark>',
                        )
                    }

                    highlightedTags = parsedTags.map((tag: unknown) => {
                        const tagObj = tag as {
                            name: string
                            [key: string]: unknown
                        }
                        return {
                            ...tagObj,
                            name: tagObj.name.replace(
                                searchRegex,
                                '<mark>$1</mark>',
                            ),
                        }
                    })
                }

                return {
                    ...item,
                    title: item.title,
                    tags: parsedTags,
                    highlightedTitle,
                    highlightedTags,
                }
            },
        )

        return NextResponse.json(itemsWithTags)
    } catch (error) {
        console.error('Error fetching coming soon items:', error)
        return NextResponse.json(
            { error: 'Failed to fetch coming soon items' },
            { status: 500 },
        )
    }
}

// POST /api/coming-soon - Add a new coming soon item
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { url, title, platform, thumbnailUrl, releaseDate, tagIds } = body

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 },
            )
        }

        if (!releaseDate) {
            return NextResponse.json(
                { error: 'Release date is required' },
                { status: 400 },
            )
        }

        // Parse and validate URL
        const allPlatforms = await PlatformDataService.getPlatforms()
        const parsedUrl = parseVideoUrlWithPlatforms(url, allPlatforms)
        if (!parsedUrl.isValid) {
            return NextResponse.json(
                { error: 'Invalid or unsupported URL' },
                { status: 400 },
            )
        }

        // Check for duplicates
        const existing = await db
            .select()
            .from(comingSoon)
            .where(eq(comingSoon.url, url))
            .limit(1)

        if (existing.length > 0) {
            return NextResponse.json(
                {
                    error: 'An item with this URL already exists in coming soon',
                },
                { status: 409 },
            )
        }

        const finalPlatform = platform || parsedUrl.platform
        const parsedReleaseDate = parseToHKT(releaseDate)

        const [inserted] = await db
            .insert(comingSoon)
            .values({
                url,
                platform: finalPlatform,
                title: title || `Upcoming from ${parsedUrl.platform}`,
                thumbnailUrl: thumbnailUrl || null,
                releaseDate: parsedReleaseDate,
            })
            .returning()

        const itemWithTags = {
            ...inserted,
            tags: [] as Array<{
                id: number
                name: string
                color: string | null
            }>,
        }

        // Handle tag associations
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
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
                comingSoonId: inserted.id,
                tagId: tag.id,
            }))

            await db.insert(comingSoonTags).values(tagInserts)
            itemWithTags.tags = validTags
        }

        return NextResponse.json(itemWithTags, { status: 201 })
    } catch (error) {
        console.error('Error creating coming soon item:', error)
        return NextResponse.json(
            { error: 'Failed to create coming soon item' },
            { status: 500 },
        )
    }
}
