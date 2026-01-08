import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/analytics/events'
import { db } from '@/lib/db'
import { tags } from '@/lib/db/schema'

// GET /api/tags - Get all tags
export async function GET() {
    try {
        const allTags = await db.select().from(tags).orderBy(tags.name)
        return NextResponse.json(allTags)
    } catch (error) {
        console.error('Error fetching tags:', error)
        logEvent('error_occurred', {
            operation: 'tag_fetch',
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: 'tags',
        })
        return NextResponse.json(
            { error: 'Failed to fetch tags' },
            { status: 500 },
        )
    }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, color } = body

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                {
                    error: 'Tag name is required and must be a non-empty string',
                },
                { status: 400 },
            )
        }

        // Check if tag already exists
        const existingTag = await db
            .select()
            .from(tags)
            .where(eq(tags.name, name.trim()))
            .limit(1)

        if (existingTag.length > 0) {
            return NextResponse.json(
                { error: 'Tag with this name already exists' },
                { status: 409 },
            )
        }

        const newTag = await db
            .insert(tags)
            .values({
                name: name.trim(),
                color: color || '#6b7280', // Default gray
            })
            .returning()

        // Log tag creation event
        logEvent('tag_created', {
            tagId: newTag[0].id,
            name: newTag[0].name,
            color: newTag[0].color,
        })

        return NextResponse.json(newTag[0], { status: 201 })
    } catch (error) {
        console.error('Error creating tag:', error)
        logEvent('error_occurred', {
            operation: 'tag_create',
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: 'tags',
        })
        return NextResponse.json(
            { error: 'Failed to create tag' },
            { status: 500 },
        )
    }
}
