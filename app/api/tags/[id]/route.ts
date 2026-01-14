import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tags } from '@/lib/db/schema'

// PUT /api/tags/[id] - Update a tag
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const tagId = parseInt(id, 10)
        if (Number.isNaN(tagId)) {
            return NextResponse.json(
                { error: 'Invalid tag ID' },
                { status: 400 },
            )
        }

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

        // Check if tag exists
        const existingTag = await db
            .select()
            .from(tags)
            .where(eq(tags.id, tagId))
            .limit(1)

        if (existingTag.length === 0) {
            return NextResponse.json(
                { error: 'Tag not found' },
                { status: 404 },
            )
        }

        // Check if another tag with the same name exists
        const duplicateTag = await db
            .select()
            .from(tags)
            .where(eq(tags.name, name.trim()))
            .limit(1)

        if (duplicateTag.length > 0 && duplicateTag[0].id !== tagId) {
            return NextResponse.json(
                { error: 'Tag with this name already exists' },
                { status: 409 },
            )
        }

        const updatedTag = await db
            .update(tags)
            .set({
                name: name.trim(),
                color: color || existingTag[0].color,
            })
            .where(eq(tags.id, tagId))
            .returning()

        return NextResponse.json(updatedTag[0])
    } catch (error) {
        console.error('Error updating tag:', error)
        return NextResponse.json(
            { error: 'Failed to update tag' },
            { status: 500 },
        )
    }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const tagId = parseInt(id, 10)
        if (Number.isNaN(tagId)) {
            return NextResponse.json(
                { error: 'Invalid tag ID' },
                { status: 400 },
            )
        }

        // Check if tag exists
        const existingTag = await db
            .select()
            .from(tags)
            .where(eq(tags.id, tagId))
            .limit(1)

        if (existingTag.length === 0) {
            return NextResponse.json(
                { error: 'Tag not found' },
                { status: 404 },
            )
        }

        await db.delete(tags).where(eq(tags.id, tagId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting tag:', error)
        return NextResponse.json(
            { error: 'Failed to delete tag' },
            { status: 500 },
        )
    }
}
