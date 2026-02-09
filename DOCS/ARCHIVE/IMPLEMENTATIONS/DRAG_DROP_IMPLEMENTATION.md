# Drag & Drop Implementation Plan

## Overview

Add drag-and-drop reordering to videos, series, and playlists lists using **@dnd-kit**. Order will persist to the database.

## Decisions

| Aspect | Decision |
|--------|----------|
| **Library** | @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities |
| **Drag handle** | Always visible (grip icon on left of each card) |
| **UI behavior** | Optimistic update on drop → API call with toast → disable drag during call → revert on error |
| **Sort scope** | Global (same order regardless of filters) |

## UX Flow

```
User drags item
      │
      ▼
User drops item
      │
      ▼
┌─────────────────────────┐
│ UI updates immediately  │ (optimistic)
│ Drag handles disabled   │
│ Toast: "Saving order..."│
└───────────┬─────────────┘
            │
            ▼
      API PUT /reorder
            │
      ┌─────┴─────┐
      │           │
   Success      Error
      │           │
      ▼           ▼
Toast: ✓      Toast: ✗
"Saved"       "Failed"
              Revert UI
      │           │
      └─────┬─────┘
            │
            ▼
   Re-enable drag handles
```

## Accessibility Features

- **Keyboard support**: Arrow keys to move items, Enter/Space to pick up, Escape to cancel
- **Screen reader announcements**: Position-based announcements (e.g., "Moved to position 3 of 10")
- **Focus management**: Visible focus ring on drag handles
- **Auto-scroll**: Automatic scrolling when dragging near viewport/container edges

---

## Implementation Progress

### Phase 1: Dependencies & Database

- [ ] **Task 1**: Install @dnd-kit packages
- [ ] **Task 2**: Add `sortOrder` column to videos, series, playlists tables
- [ ] **Task 3**: Generate database migration (DO NOT PUSH)

### Phase 2: API Endpoints

- [ ] **Task 4**: Create `PUT /api/videos/reorder` endpoint
- [ ] **Task 5**: Create `PUT /api/series/reorder` endpoint
- [ ] **Task 6**: Create `PUT /api/playlists/reorder` endpoint

### Phase 3: UI Components

- [ ] **Task 7**: Create `SortableItem` component with drag handle
- [ ] **Task 8**: Create `SortableMediaList` component
- [ ] **Task 9**: Export new components from `components/shared/index.ts`

### Phase 4: Hook Updates

- [ ] **Task 10**: Add `reorderVideos` to `useVideos` hook
- [ ] **Task 11**: Add `reorderSeries` to `useSeries` hook
- [ ] **Task 12**: Add `reorderPlaylists` to `usePlaylists` hook

### Phase 5: List Component Updates

- [ ] **Task 13**: Update `VideoList` to use `SortableMediaList`
- [ ] **Task 14**: Update `SeriesList` to use `SortableMediaList`
- [ ] **Task 15**: Update `PlaylistList` to use `SortableMediaList`

### Phase 6: API Query Updates

- [ ] **Task 16**: Update `GET /api/videos` to order by `sortOrder`
- [ ] **Task 17**: Update `GET /api/series` to order by `sortOrder`
- [ ] **Task 18**: Update `GET /api/playlists` to order by `sortOrder`

### Phase 7: Integration

- [ ] **Task 19**: Connect reorder handlers in page components
- [ ] **Task 20**: Run lint/format checks and fix issues

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/api/videos/reorder/route.ts` | Reorder videos endpoint |
| `app/api/series/reorder/route.ts` | Reorder series endpoint |
| `app/api/playlists/reorder/route.ts` | Reorder playlists endpoint |
| `components/shared/sortable-item.tsx` | Sortable wrapper with drag handle |
| `components/shared/sortable-media-list.tsx` | DnD-enabled list component |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add @dnd-kit dependencies |
| `lib/db/schema.ts` | Add `sortOrder` column to 3 tables |
| `components/shared/index.ts` | Export new components |
| `hooks/use-videos.ts` | Add `reorderVideos` method |
| `hooks/use-series.ts` | Add `reorderSeries` method |
| `hooks/use-playlists.ts` | Add `reorderPlaylists` method |
| `components/videos/video-list.tsx` | Support `onReorder` prop |
| `components/series/series-list.tsx` | Support `onReorder` prop |
| `components/playlists/playlist-list.tsx` | Support `onReorder` prop |
| `app/api/videos/route.ts` | Order by `sortOrder` |
| `app/api/series/route.ts` | Order by `sortOrder` |
| `app/api/playlists/route.ts` | Order by `sortOrder` |

---

## Database Schema Changes

```sql
-- Add sortOrder column to videos table
ALTER TABLE videos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Add sortOrder column to series table
ALTER TABLE series ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Add sortOrder column to playlists table
ALTER TABLE playlists ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
```

## API Request/Response Format

### PUT /api/{entity}/reorder

**Request:**
```json
{
  "orderedIds": [5, 2, 8, 1, 3]
}
```

**Response (success):**
```json
{
  "success": true
}
```

**Response (error):**
```json
{
  "error": "Failed to reorder items"
}
```

---

*Last updated: January 2026*
