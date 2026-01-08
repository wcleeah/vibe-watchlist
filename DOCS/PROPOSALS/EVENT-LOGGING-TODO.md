# 📋 Event Logging Implementation TODO

## Overview
Only 4/17 events are currently implemented. This document lists all remaining events that need to be added for complete analytics coverage.

## ✅ Currently Implemented (4 events)
- `search_performed` - GET `/api/videos` (search queries)
- `add_video` - POST `/api/videos` (video creation)
- `error_occurred` - POST `/api/videos` (creation errors)
- `error_occurred` - GET `/api/videos` (query errors) - **Note: This is logged via dynamic import**

## ❌ Missing Implementation (13 events)

### 1. Video Management Events (6 missing)

#### `watch_video` Event
**Location:** `app/api/videos/[id]/route.ts` - PUT handler
**Trigger:** When `isWatched` changes from `false` to `true`
**Payload:** `{ videoId: number }`
**Code:**
```typescript
// After successful update, check if watch status changed
const wasWatchedBefore = result[0].isWatched === true
if (updateData.isWatched && !wasWatchedBefore) {
    logEvent('watch_video', { videoId: id })
}
```

#### `unwatch_video` Event
**Location:** `app/api/videos/[id]/route.ts` - PUT handler
**Trigger:** When `isWatched` changes from `true` to `false`
**Payload:** `{ videoId: number }`
**Code:**
```typescript
const wasWatchedBefore = result[0].isWatched === true
if (!updateData.isWatched && wasWatchedBefore) {
    logEvent('unwatch_video', { videoId: id })
}
```

#### `delete_video` Event
**Location:** `app/api/videos/[id]/route.ts` - DELETE handler
**Trigger:** After successful video deletion
**Payload:** `{ videoId: number }`
**Code:**
```typescript
// After successful deletion
logEvent('delete_video', { videoId: id })
```

#### `bulk_watch` Event
**Location:** `app/api/videos/bulk/route.ts` - POST handler
**Trigger:** When operation is `'markWatched'`
**Payload:** `{ count: number, videoIds: number[] }`
**Code:**
```typescript
const eventType = operation === 'markWatched' ? 'bulk_watch' :
                 operation === 'markUnwatched' ? 'bulk_unwatch' : 'bulk_delete'
logEvent(eventType, {
    count: result.length,
    videoIds: result.map((r) => r.id),
})
```

#### `bulk_unwatch` Event
**Location:** `app/api/videos/bulk/route.ts` - POST handler
**Trigger:** When operation is `'markUnwatched'`
**Payload:** `{ count: number, videoIds: number[] }`
**Code:** (Same as above, handled by conditional)

#### `bulk_delete` Event
**Location:** `app/api/videos/bulk/route.ts` - POST handler
**Trigger:** When operation is `'delete'`
**Payload:** `{ count: number, videoIds: number[] }`
**Code:** (Same as above, handled by conditional)

### 2. AI & Metadata Events (5 missing)

#### `metadata_extract_success` Event
**Location:** `app/api/metadata/extract/route.ts` - POST handler
**Trigger:** After successful metadata extraction
**Payload:** `{ url: string, platform: string, tokens: number, accuracy: number }`
**Code:**
```typescript
// After successful extraction
logEvent('metadata_extract_success', {
    url,
    platform,
    tokens: result.tokensUsed || 0,
    accuracy: result.confidence || 0
})
```

#### `metadata_extract_failure` Event
**Location:** `app/api/metadata/extract/route.ts` - POST handler
**Trigger:** When metadata extraction fails
**Payload:** `{ url: string, platform: string, error: string }`
**Code:**
```typescript
// After failed extraction
logEvent('metadata_extract_failure', {
    url,
    platform,
    error: result.error
})
```

#### `token_used` Event
**Location:** `app/api/metadata/extract/route.ts` - POST handler
**Trigger:** Alongside successful metadata extraction
**Payload:** `{ tokens: number, operation: 'metadata_extraction' }`
**Code:**
```typescript
logEvent('token_used', {
    tokens: result.tokensUsed || 0,
    operation: 'metadata_extraction'
})
```

#### `cache_hit` Event
**Location:** `lib/services/ai-metadata-service.ts` - checkCache method
**Trigger:** When cached result is found and returned
**Payload:** `{ url: string }`
**Code:**
```typescript
if (cached) {
    logEvent('cache_hit', { url })
    return cached
}
```

#### `cache_miss` Event
**Location:** `lib/services/ai-metadata-service.ts` - checkCache method
**Trigger:** When no cached result exists
**Payload:** `{ url: string }`
**Code:**
```typescript
} else {
    logEvent('cache_miss', { url })
    // Continue with extraction...
}
```

### 3. Configuration Events (3 missing)

#### `platform_configured` Event
**Location:** `app/api/platforms/route.ts` - POST handler
**Trigger:** After successful platform creation
**Payload:** `{ platformId: string, displayName: string }`
**Code:**
```typescript
// After successful platform creation
logEvent('platform_configured', {
    platformId,
    displayName: config.displayName
})
```

#### `tag_created` Event
**Location:** `app/api/tags/route.ts` - POST handler
**Trigger:** After successful tag creation
**Payload:** `{ tagId: number, name: string, color: string }`
**Code:**
```typescript
// After successful tag creation
logEvent('tag_created', {
    tagId: newTag[0].id,
    name: newTag[0].name,
    color: newTag[0].color
})
```

#### `tag_deleted` Event
**Location:** `app/api/tags/[id]/route.ts` - DELETE handler
**Trigger:** After successful tag deletion
**Payload:** `{ tagId: number }`
**Code:**
```typescript
// After successful tag deletion
logEvent('tag_deleted', { tagId: id })
```

### 4. System Events (Additional Error Logging)

#### `error_occurred` Events - Multiple Locations
**Locations:** All API route catch blocks
**Trigger:** When any API operation throws an error
**Payload:** `{ operation: string, error: string, endpoint: string, [additional context] }`

**Files to update:**
- `app/api/videos/[id]/route.ts` (PUT/DELETE operations)
- `app/api/videos/bulk/route.ts`
- `app/api/metadata/extract/route.ts`
- `app/api/tags/route.ts`
- `app/api/platforms/route.ts`

**Example Code:**
```typescript
} catch (error) {
    console.error('Error in [operation]:', error)
    logEvent('error_occurred', {
        operation: '[operation_name]',
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '[endpoint_path]',
        // Add operation-specific context
    })
    return NextResponse.json({ error: '...' }, { status: 500 })
}
```

## 🔧 Pre-Implementation Tasks

### 1. Update Event Type Definitions
**File:** `lib/analytics/events.ts`
**Task:** Change event names to match the plan:
```typescript
export type EventType =
  | 'add_video'        // currently: video_added
  | 'watch_video'      // currently: video_watched
  | 'unwatch_video'    // currently: video_unwatched
  | 'delete_video'     // currently: video_deleted
  | 'bulk_watch'       // new
  | 'bulk_unwatch'     // new
  | 'bulk_delete'      // new
  | 'metadata_extract_success'  // currently: metadata_extracted
  | 'metadata_extract_failure'  // new
  | 'token_used'
  | 'cache_hit'
  | 'cache_miss'
  | 'platform_configured'
  | 'tag_created'
  | 'tag_deleted'
  | 'search_performed'
  | 'error_occurred'
```

### 2. Add Missing Imports
**Files:** All API route files listed above
**Task:** Add `import { logEvent } from '@/lib/analytics/events'` to each file

## 📊 Expected Results

After implementation:
- **17 total events** properly logged from backend
- **Event Analytics dashboard** shows comprehensive user behavior data
- **Real-time event feed** displays all operations
- **Time-range filtering** works for all event types
- **Error monitoring** provides system health insights

## ✅ Completion Checklist

- [ ] Update event type definitions in `events.ts`
- [ ] Add imports to all API route files
- [ ] Implement 6 video management events
- [ ] Implement 5 AI/metadata events
- [ ] Implement 3 configuration events
- [ ] Add error logging to all API routes
- [ ] Test event generation (add/watch/delete videos, etc.)
- [ ] Verify events appear in analytics dashboard
- [ ] Confirm no performance impact on API responses

## 🚨 Critical Notes

1. **Backend Only**: All events must be logged from API routes, never from frontend
2. **Fire-and-Forget**: Use `logEvent()` which doesn't await, ensuring no performance impact
3. **Error Handling**: Event logging failures should not crash API operations
4. **Testing**: Test each event type individually to ensure proper data capture

---

**Current Status:** 4/17 events implemented (23% complete)
**Remaining:** 13 events across 8 files</content>
<parameter name="filePath">/Users/leewingcheung/Documents/vibe-watchlist/DOCS/PROPOSALS/EVENT-LOGGING-TODO.md
