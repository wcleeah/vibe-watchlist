import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { videos, tags, videoTags } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { parseVideoUrl, VideoPlatform } from '@/lib/utils/url-parser';



// GET /api/videos - Get videos with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const watched = searchParams.get('watched');
    const platforms = searchParams.get('platforms'); // comma-separated list
    const search = searchParams.get('search'); // title search
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, updatedAt, title
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereConditions = [];

    if (watched !== null) {
      whereConditions.push(eq(videos.isWatched, watched === 'true'));
    }

    // Support multiple platforms (comma-separated)
    if (platforms) {
      const platformList = platforms.split(',').filter(p =>
        ['youtube', 'netflix', 'nebula', 'twitch'].includes(p.trim())
      ) as VideoPlatform[];
      if (platformList.length > 0) {
        whereConditions.push(inArray(videos.platform, platformList));
      }
    }

    // Enhanced search: titles and tags with case-insensitive matching
    if (search && search.trim()) {
      whereConditions.push(sql`(
        ${videos.title} ILIKE ${sql.placeholder('search')} OR
        EXISTS (
          SELECT 1 FROM ${videoTags}
          JOIN ${tags} ON ${videoTags.tagId} = ${tags.id}
          WHERE ${videoTags.videoId} = ${videos.id} AND ${tags.name} ILIKE ${sql.placeholder('search')}
        )
      )`);
    }

    // Build dynamic order by clause
    let orderByColumn;
    switch (sortBy) {
      case 'updatedAt':
        orderByColumn = videos.updatedAt;
        break;
      case 'title':
        orderByColumn = videos.title;
        break;
      case 'createdAt':
      default:
        orderByColumn = videos.createdAt;
        break;
    }

    const orderDirection = sortOrder === 'asc' ? sql`ASC` : sql`DESC`;

    // Prepare query parameters
    const queryParams: Record<string, string | string[]> = {};

    // Add platforms parameter if filtering by multiple platforms
    if (platforms) {
      const platformList = platforms.split(',').filter(p =>
        ['youtube', 'netflix', 'nebula', 'twitch'].includes(p.trim())
      );
      if (platformList.length > 0) {
        queryParams.platforms = platformList;
      }
    }

    // Add search parameter if searching (used in both title and tag searches)
    if (search && search.trim()) {
      queryParams.search = `%${search.trim()}%`;
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(videos.id)
      .orderBy(orderDirection === sql`ASC` ? sql`${orderByColumn} ASC` : sql`${orderByColumn} DESC`)
      .limit(limit)
      .offset(offset);

    // Parse the tags JSON string back to array and add highlighting
    const videosWithTags = result.map((video: { id: number; title: string | null; tags: unknown; [key: string]: unknown }) => {
      let parsedTags: Array<Record<string, unknown>> = [];

      try {
        if (typeof video.tags === 'string') {
          parsedTags = JSON.parse(video.tags);
        } else if (Array.isArray(video.tags)) {
          parsedTags = video.tags;
        }
      } catch {
        parsedTags = [];
      }

      // Add highlighting if search term is provided
      let highlightedTitle = video.title;
      let highlightedTags = parsedTags;

      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

        // Highlight in title
        if (video.title) {
          highlightedTitle = video.title.replace(searchRegex, '<mark>$1</mark>');
        }

        // Highlight in tags
        highlightedTags = parsedTags.map((tag: unknown) => {
          const tagObj = tag as { name: string; [key: string]: unknown };
          return {
            ...tagObj,
            name: tagObj.name.replace(searchRegex, '<mark>$1</mark>')
          };
        });
      }

      return {
        ...video,
        title: video.title,
        tags: parsedTags,
        highlightedTitle,
        highlightedTags
      };
    });

    return NextResponse.json(videosWithTags);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// POST /api/videos - Add a new video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title, platform, thumbnailUrl, tagIds } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Parse and validate URL
    const parsedUrl = await parseVideoUrl(url);
    if (!parsedUrl.isValid) {
      return NextResponse.json(
        { error: 'Invalid or unsupported video URL' },
        { status: 400 }
      );
    }

    // Use client-provided metadata if available, otherwise extract server-side
    let finalTitle = title;
    let finalThumbnailUrl = thumbnailUrl;

    // Check if video already exists
    const existingVideo = await db
      .select()
      .from(videos)
      .where(eq(videos.url, url))
      .limit(1);

    if (existingVideo.length > 0) {
      return NextResponse.json(
        { error: 'A video with this URL already exists in your watchlist' },
        { status: 409 }
      );
    }

    // Use the final metadata (client + server fallback)
    const finalPlatform = platform || parsedUrl.platform;

    let newVideo;
    try {
      newVideo = await db
        .insert(videos)
        .values({
          url,
          platform: finalPlatform,
          title: finalTitle || `Video from ${parsedUrl.platform}`,
          thumbnailUrl: finalThumbnailUrl,
        })
        .returning();
    } catch (error: unknown) {
      // Handle duplicate URL error (check both direct error and cause)
      const err = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string }; message?: string };
      const isDuplicateError = err?.code === '23505' ||
                              err?.constraint === 'videos_url_unique' ||
                              err?.cause?.code === '23505' ||
                              err?.cause?.constraint === 'videos_url_unique' ||
                              err?.message?.includes('duplicate') ||
                              err?.message?.includes('unique');

      if (isDuplicateError) {
        console.log('✅ Duplicate URL detected, returning 409');
        return NextResponse.json(
          { error: 'A video with this URL already exists in your watchlist' },
          { status: 409 }
        );
      }

      // Re-throw other errors
      throw error;
    }

    const videoWithTags = { ...newVideo[0], tags: [] as Array<{ id: number; name: string; color: string | null }> };

    // Handle tag associations if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      // Validate that all tagIds exist and get the tags
      const tagPromises = tagIds.map(tagId =>
        db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
      );

      const tagResults = await Promise.all(tagPromises);
      const validTags = tagResults
        .map(result => result[0])
        .filter(tag => tag !== undefined);

      if (validTags.length !== tagIds.length) {
        // Some tags don't exist, return error
        return NextResponse.json(
          { error: 'One or more tag IDs do not exist' },
          { status: 400 }
        );
      }

      // Create video-tag associations
      const videoTagInserts = validTags.map(tag => ({
        videoId: newVideo[0].id,
        tagId: tag.id,
      }));

      await db.insert(videoTags).values(videoTagInserts);

      videoWithTags.tags = validTags;
    }

    return NextResponse.json(videoWithTags, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}

