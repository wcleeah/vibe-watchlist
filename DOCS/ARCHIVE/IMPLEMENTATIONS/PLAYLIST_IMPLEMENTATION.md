# YouTube Playlist Implementation Plan

## Overview

Add YouTube playlist functionality allowing users to:
1. Add YouTube playlists and automatically import all video items
2. View playlists in a dedicated `/playlists` page
3. See all playlist items in a modal with individual watched status
4. Click "watch" to open YouTube at a specific playlist index
5. Manually re-sync playlists to check for updates

## Key Requirements

| Requirement | Implementation |
|-------------|----------------|
| Display playlist items | Modal with all videos, individual watched status |
| Mark items as watched | Click on item index N marks 0 to N as watched (cascade) |
| Watch playlist at index | Opens `youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID&index=N` |
| Third view in form | Add "Playlist" mode to ModeToggle (Video / Series / Playlist) |
| Isolation from watchlist | Playlist videos have `playlistId` set and are filtered out of `/list` |

## Implementation Progress

### Phase 1: Database Schema
- [ ] Add `playlists` table to schema
- [ ] Add playlist fields to `videos` table (playlistId, playlistIndex, youtubeVideoId)
- [ ] Add foreign key and relations
- [ ] Run database migrations

### Phase 2: YouTube API Service
- [ ] Create `lib/services/youtube-api-service.ts`
- [ ] Implement `getPlaylistInfo()` method
- [ ] Implement `getPlaylistItems()` method with pagination

### Phase 3: URL Parser Updates
- [ ] Update `ParsedUrl` interface with `isPlaylist` field
- [ ] Enable playlist ID extraction
- [ ] Update parsing logic to detect playlist URLs

### Phase 4: Types
- [ ] Create `types/playlist.ts` with playlist interfaces
- [ ] Update `types/series.ts` to add 'playlist' to ContentMode

### Phase 5: API Routes
- [ ] Create `app/api/playlists/route.ts` (GET list, POST create)
- [ ] Create `app/api/playlists/[id]/route.ts` (GET single, DELETE)
- [ ] Create `app/api/playlists/[id]/sync/route.ts` (POST sync)
- [ ] Create `app/api/playlists/[id]/videos/[videoId]/watched/route.ts` (POST cascade watched)

### Phase 6: Update Videos API
- [ ] Modify `app/api/videos/route.ts` to filter out playlist videos

### Phase 7: UI Components
- [ ] Create `components/playlists/playlist-card.tsx`
- [ ] Create `components/playlists/playlist-items-modal.tsx`
- [ ] Create `components/playlists/playlist-list.tsx`

### Phase 8: Playlists Page
- [ ] Create `app/playlists/page.tsx`

### Phase 9: Navigation Update
- [ ] Add Playlists link to `components/navigation-tabs.tsx`

### Phase 10: Video Form - Playlist Mode
- [ ] Update `components/video-form/mode-toggle.tsx` with Playlist option
- [ ] Update `components/video-form/form-layout.tsx` for playlist handling
- [ ] Update `app/page.tsx` for playlist submission

### Phase 11: Testing & Cleanup
- [ ] Test end-to-end playlist import
- [ ] Test cascade watched functionality
- [ ] Test sync functionality
- [ ] Run linting and formatting

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `lib/db/schema.ts` | Modify | Add playlists table, update videos table |
| `lib/services/youtube-api-service.ts` | Create | YouTube Data API integration |
| `lib/utils/url-parser.ts` | Modify | Enable playlist detection |
| `types/playlist.ts` | Create | Playlist TypeScript interfaces |
| `types/series.ts` | Modify | Add 'playlist' to ContentMode |
| `app/api/playlists/route.ts` | Create | GET/POST playlists |
| `app/api/playlists/[id]/route.ts` | Create | GET/DELETE single playlist |
| `app/api/playlists/[id]/sync/route.ts` | Create | POST sync |
| `app/api/playlists/[id]/videos/[videoId]/watched/route.ts` | Create | POST cascade watched |
| `app/api/videos/route.ts` | Modify | Filter out playlist videos |
| `components/playlists/playlist-card.tsx` | Create | Playlist display card |
| `components/playlists/playlist-items-modal.tsx` | Create | Items modal |
| `components/playlists/playlist-list.tsx` | Create | List wrapper |
| `app/playlists/page.tsx` | Create | Playlists page |
| `components/navigation-tabs.tsx` | Modify | Add Playlists nav link |
| `components/video-form/mode-toggle.tsx` | Modify | Add Playlist mode |
| `components/video-form/form-layout.tsx` | Modify | Handle playlist mode |
| `app/page.tsx` | Modify | Handle playlist submission |

## Environment Variables Required

```
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

## Watch URL Format

When clicking watch on a playlist item at index N:
```
https://www.youtube.com/watch?v={VIDEO_ID}&list={PLAYLIST_ID}&index={N+1}
```
(YouTube uses 1-based indexing for the `index` parameter)

## Notes

- Playlist videos are isolated from the main `/list` page
- Marking video at index N automatically marks indices 0 to N-1 as watched
- Deleting a playlist also deletes all its video items
- Sync checks for new/removed items and updates accordingly
