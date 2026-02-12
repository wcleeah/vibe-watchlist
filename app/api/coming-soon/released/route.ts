import { and, eq, isNull, lte, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comingSoon, comingSoonTags, tags } from '@/lib/db/schema'
import { nowHKT } from '@/lib/utils/hkt-date'

// GET /api/coming-soon/released - Get released coming soon items (for homepage toast)
export async function GET() {
    try {
        const now = nowHKT()

        const result = await db
            .select({
                id: comingSoon.id,
                url: comingSoon.url,
                title: comingSoon.title,
                platform: comingSoon.platform,
                thumbnailUrl: comingSoon.thumbnailUrl,
                releaseDate: comingSoon.releaseDate,
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
            .where(
                and(
                    lte(comingSoon.releaseDate, now),
                    isNull(comingSoon.transformedAt),
                ),
            )
            .groupBy(comingSoon.id)
            .orderBy(sql`${comingSoon.releaseDate} DESC`)

        // Parse tags
        const items = result.map((item) => {
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

            return {
                ...item,
                tags: parsedTags,
            }
        })

        return NextResponse.json(items)
    } catch (error) {
        console.error('Error fetching released coming soon items:', error)
        return NextResponse.json(
            { error: 'Failed to fetch released items' },
            { status: 500 },
        )
    }
}
