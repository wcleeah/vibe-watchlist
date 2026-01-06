import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { metadataSuggestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { url, selectedIndex, feedback } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Find existing suggestion record
    const existing = await db
      .select()
      .from(metadataSuggestions)
      .where(eq(metadataSuggestions.url, url))
      .orderBy(metadataSuggestions.createdAt)
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'No suggestions found for this URL' },
        { status: 404 }
      );
    }

    // Update the record with user feedback
    await db
      .update(metadataSuggestions)
      .set({
        selectedIndex: selectedIndex ?? existing[0].selectedIndex,
        userFeedback: feedback || existing[0].userFeedback,
      })
      .where(eq(metadataSuggestions.id, existing[0].id));

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    });

  } catch (error) {
    console.error('Feedback recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

// GET endpoint for analytics (admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    const results = await db
      .select()
      .from(metadataSuggestions)
      .orderBy(metadataSuggestions.createdAt)
      .limit(limit)
      .offset(offset);

    // Calculate some basic analytics
    const totalSuggestions = results.length;
    const withSelections = results.filter(r => r.selectedIndex !== null).length;
    const withFeedback = results.filter(r => r.userFeedback).length;
    const avgSelectionIndex = results
      .filter(r => r.selectedIndex !== null)
      .reduce((sum, r) => sum + (r.selectedIndex || 0), 0) / Math.max(withSelections, 1);

    return NextResponse.json({
      analytics: {
        totalSuggestions,
        withSelections,
        withFeedback,
        selectionRate: totalSuggestions > 0 ? (withSelections / totalSuggestions * 100).toFixed(1) : 0,
        avgSelectionIndex: avgSelectionIndex.toFixed(1),
      },
      suggestions: results,
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}