# UI Refactor Plan: Vibe Watchlist

## Overview

This plan aligns the Videos, Series, and Playlists pages at both UI and code level. Currently there are significant inconsistencies across these three content types that this refactor will standardize.

## Current State Analysis

### Identified Inconsistencies

| Aspect | Videos | Series | Playlists |
|--------|--------|--------|-----------|
| **Action Buttons** | shadcn Button | Raw `<button>` elements | Raw `<button>` elements |
| **Data Fetching** | Page component fetches | Custom hook (`use-series.ts`) | List component fetches |
| **Filtering** | Full filtering | Full filtering | **None** |
| **Navigation Pattern** | Separate `/list` and `/watched` pages | Tabs on one page | Single page |
| **Expandable Actions** | Has `more()` toggle | No expansion | No expansion |
| **Progress Bar** | None | None | Has progress bar |
| **Bulk Operations** | Full toolbar | None | None |

### Code-Level Issues

1. **Thumbnail Display**: Duplicated across all 3 card components
2. **Action Button Styling**: Inconsistent (shadcn vs inline styles)
3. **Filter Bar**: Implemented differently in each page
4. **Empty States**: Different styles and patterns
5. **Error Handling**: Inconsistent error display patterns

## User Decisions

Based on discussion, the following decisions have been made:

1. **Playlist Filtering**: Add full filtering (search, status, tags, platforms) to Playlists
2. **Navigation Pattern**: Use tabs (Active/Watched) on same page for **all** content types
3. **Bulk Operations**: **Remove entirely** from Videos page
4. **Progress Bar**: Add to Series cards (for backlog series with episode tracking)
5. **Expandable Actions**: Add `more()` toggle to Series and Playlist cards
6. **Watched Page**: Convert `/watched` to redirect to `/list?tab=watched`
7. **Playlist Modal**: Keep `PlaylistItemsModal` as-is (it's specific functionality)
8. **Error Handling**: Standardize with shared `ErrorDisplay` component
9. **Shared Components Location**: `components/shared/`

## New Files to Create (11 total)

### Shared Components (`components/shared/`)

1. **`thumbnail-display.tsx`** (~50 lines)
2. **`action-button.tsx`** (~80 lines)
3. **`progress-bar.tsx`** (~40 lines)
4. **`media-card.tsx`** (~150 lines)
5. **`media-list.tsx`** (~80 lines)
6. **`filter-bar.tsx`** (~200 lines)
7. **`tab-switcher.tsx`** (~60 lines)
8. **`error-display.tsx`** (~40 lines)
9. **`index.ts`** (~15 lines) - barrel export

### New Hooks (`hooks/`)

10. **`use-videos.ts`** (~150 lines)
11. **`use-playlists.ts`** (~150 lines)

## Files to Modify (12 total)

### Card Components

1. **`components/videos/video-card.tsx`** - Use shared `MediaCard`
2. **`components/series/series-card.tsx`** - Use shared `MediaCard`
3. **`components/playlists/playlist-card.tsx`** - Use shared `MediaCard`

### List Components

4. **`components/videos/video-list.tsx`** - Use shared `MediaList`
5. **`components/series/series-list.tsx`** - Use shared `MediaList`
6. **`components/playlists/playlist-list.tsx`** - Use shared `MediaList`

### Page Components

7. **`app/list/page.tsx`** - Add tabs (Active/Watched), use `useVideos` hook, use `FilterBar`
8. **`app/series/page.tsx`** - Use shared `FilterBar`, `TabSwitcher`
9. **`app/playlists/page.tsx`** - Add tabs, filtering, use `usePlaylists` hook
10. **`app/watched/page.tsx`** - Convert to redirect component

### Navigation & Types

11. **`components/navigation-tabs.tsx`** - Remove "Watched" nav item
12. **`types/video.ts`** and **`types/playlist.ts`** - Add filter interfaces

---

## Component Specifications

### 1. ThumbnailDisplay

**File**: `components/shared/thumbnail-display.tsx`

```typescript
interface ThumbnailDisplayProps {
    src: string | null;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
}
```

**Purpose**: Display thumbnail with fallback

### 2. ActionButton

**File**: `components/shared/action-button.tsx`

```typescript
type ActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ActionSize = 'sm' | 'md';

interface ActionButtonProps {
    label: string;
    onClick?: () => void | Promise<void>;
    href?: string;
    variant?: ActionVariant;
    size?: ActionSize;
    icon?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}
```

**Purpose**: Consistent action button across all cards

### 3. ProgressBar

**File**: `components/shared/progress-bar.tsx`

```typescript
interface ProgressBarProps {
    current: number;
    total: number;
    showLabel?: boolean;
    className?: string;
}
```

**Purpose**: Show progress (videos watched, episodes watched)

### 4. MediaCard

**File**: `components/shared/media-card.tsx`

```typescript
interface MediaCardProps<T> {
    item: T;
    title: string;
    thumbnailUrl: string | null;
    platform: string;
    tags?: Array<{ id: number; name: string; color?: string | null }>;
    metadata: MediaMetadataItem[];
    primaryActions: ActionConfig[];
    secondaryActions?: ActionConfig[];
    showProgress?: boolean;
    progressCurrent?: number;
    progressTotal?: number;
    statusBadge?: StatusBadgeConfig;
    error?: string | null;
    className?: string;
}

interface MediaMetadataItem {
    key: string;
    value: string | number;
    color?: 'cyan' | 'purple' | 'green' | 'yellow' | 'blue' | 'red' | 'orange';
}

interface ActionConfig {
    id: string;
    label: string;
    onClick?: () => void | Promise<void>;
    href?: string;
    icon?: React.ReactNode;
    variant?: ActionVariant;
    condition?: boolean;
}

interface StatusBadgeConfig {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}
```

**Purpose**: Universal card component for all content types

### 5. MediaList

**File**: `components/shared/media-list.tsx`

```typescript
interface MediaListProps<T> {
    items: T[];
    renderCard: (item: T) => React.ReactNode;
    loading?: boolean;
    emptyState?: {
        title: string;
        description: string;
        icon?: React.ReactNode;
    };
    className?: string;
}
```

**Purpose**: Universal list container with loading/empty states

### 6. FilterBar

**File**: `components/shared/filter-bar.tsx`

```typescript
interface FilterBarProps {
    // Search
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchPlaceholder?: string;
    
    // Platform filters
    platforms: PlatformOption[];
    selectedPlatforms: string[];
    onPlatformToggle: (platform: string) => void;
    
    // Tag filters
    tags: TagOption[];
    selectedTagIds: number[];
    onTagToggle: (tagId: number) => void;
    
    // Status filters (for Series/Playlists)
    statusOptions?: StatusOption[];
    selectedStatus?: string;
    onStatusChange?: (status: string) => void;
    
    // Sort
    sortOptions: SortOption[];
    sortValue: string;
    onSortChange: (value: string) => void;
    
    // Active filters display
    activeFilters: FilterChip[];
    onClearFilter?: (filterId: string) => void;
    onClearAll?: () => void;
    
    className?: string;
}

interface PlatformOption {
    key: string;
    label: string;
    icon: string;
    color: string;
}

interface TagOption {
    id: number;
    name: string;
    color?: string;
}

interface StatusOption {
    key: string;
    label: string;
    count?: number;
}

interface SortOption {
    value: string;
    label: string;
}

interface FilterChip {
    id: string;
    label: string;
    type: 'search' | 'platform' | 'tag' | 'status';
}
```

**Purpose**: Universal filter bar with all filtering options

### 7. TabSwitcher

**File**: `components/shared/tab-switcher.tsx`

```typescript
interface TabSwitcherProps {
    tabs: TabConfig[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    className?: string;
}

interface TabConfig {
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
}
```

**Purpose**: Active/Watched tab switching

### 8. ErrorDisplay

**File**: `components/shared/error-display.tsx`

```typescript
interface ErrorDisplayProps {
    error: string;
    onRetry?: () => void;
    className?: string;
}
```

**Purpose**: Consistent error display across all pages

---

## Action Button Mappings

### Video Card Actions

**Primary Actions** (always visible):
1. `watch()` - Open URL
2. `markWatched()` / `unwatch()` - Toggle watched status

**Secondary Actions** (expandable via `more()`):
1. `copyUrl()` - Copy URL to clipboard
2. `edit()` - Open edit modal
3. `toSeries()` - Convert to series
4. `toPlaylist()` - Convert to playlist (only for YouTube playlist URLs)

**Danger Action** (always visible, at bottom):
1. `delete()` - Delete video

### Series Card Actions

**Primary Actions** (always visible):
1. `watch()` - Open URL
2. `markWatched()` / `unmarkWatched()` - Toggle watched status
3. `+1 Episode` - Increment progress (backlog series only)

**Secondary Actions** (expandable via `more()`):
1. `copyUrl()` - Copy URL to clipboard
2. `edit()` - Open edit modal
3. `catchUp()` - Reset missed periods (recurring series only, if behind)

**Danger Action** (always visible, at bottom):
1. `delete()` - Delete series

### Playlist Card Actions

**Primary Actions** (always visible):
1. `viewItems()` - Open playlist items modal
2. `openYouTube()` - Open on YouTube

**Secondary Actions** (expandable via `more()`):
1. `sync()` - Sync from YouTube

**Danger Action** (always visible, at bottom):
1. `delete()` - Delete playlist

---

## Data Hooks Specification

### useVideos Hook

**File**: `hooks/use-videos.ts`

```typescript
interface UseVideosOptions {
    filters?: VideoFilters;
    autoFetch?: boolean;
}

interface UseVideosReturn {
    videos: VideoWithTags[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    markWatched: (id: number) => Promise<void>;
    markUnwatched: (id: number) => Promise<void>;
    deleteVideo: (id: number) => Promise<void>;
}

interface VideoFilters {
    isWatched?: boolean;
    search?: string;
    platforms?: string[];
    tagIds?: number[];
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
}

function useVideos(options?: UseVideosOptions): UseVideosReturn;
```

### usePlaylists Hook

**File**: `hooks/use-playlists.ts`

```typescript
interface UsePlaylistsOptions {
    filters?: PlaylistFilters;
    autoFetch?: boolean;
}

interface UsePlaylistsReturn {
    playlists: PlaylistSummary[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    sync: (id: number) => Promise<void>;
    deletePlaylist: (id: number) => Promise<void>;
}

interface PlaylistFilters {
    status?: 'all' | 'has-unwatched' | 'completed';
    search?: string;
}

function usePlaylists(options?: UsePlaylistsOptions): UsePlaylistsReturn;
```

---

## Page Structure After Refactor

### Videos Page (`app/list/page.tsx`)

```
NavigationTabs
└── Main Container
    ├── Header
    │   ├── Title: "My Watchlist"
    │   └── Count: "X videos"
    ├── ErrorDisplay (if error)
    ├── TabSwitcher
    │   ├── Active (count)
    │   └── Watched (count)
    ├── FilterBar
    │   ├── Search input
    │   ├── Platform filters
    │   ├── Tag filters
    │   └── Sort dropdown
    └── MediaList
        └── VideoCard[]
            ├── ThumbnailDisplay
            ├── Metadata (ID, Platform, Tags)
            ├── ActionButtons
            │   ├── Primary: watch(), markWatched()
            │   ├── Expandable: more()
            │   │   ├── copyUrl()
            │   │   ├── edit()
            │   │   ├── toSeries()
            │   │   └── toPlaylist()
            │   └── Danger: delete()
            └── Modals (Edit, ConvertToSeries, ConvertToPlaylist)
```

### Series Page (`app/series/page.tsx`)

```
NavigationTabs
└── Main Container
    ├── Header
    │   ├── Title: "Series"
    │   └── Count: "X series tracked"
    ├── ErrorDisplay (if error)
    ├── FilterBar
    │   ├── Search input
    │   ├── Status filters (All, Behind, Caught Up, Backlog)
    │   ├── Platform filters
    │   └── Tag filters
    ├── TabSwitcher
    │   ├── Active (count)
    │   └── Watched (count)
    └── MediaList
        └── SeriesCard[]
            ├── ThumbnailDisplay
            ├── StatusBadge
            ├── Metadata (ID, Platform, Schedule, Missed, Progress)
            ├── ProgressBar (for backlog with episodes)
            ├── ActionButtons
            │   ├── Primary: watch(), markWatched(), +1 Episode
            │   ├── Expandable: more()
            │   │   ├── copyUrl()
            │   │   ├── edit()
            │   │   └── catchUp()
            │   └── Danger: delete()
            └── SeriesEditModal
```

### Playlists Page (`app/playlists/page.tsx`)

```
NavigationTabs
└── Main Container
    ├── Header
    │   ├── Title: "My Playlists"
    │   └── Count: "X playlists"
    ├── ErrorDisplay (if error)
    ├── FilterBar
    │   ├── Search input
    │   └── Status filters (All, Has Unwatched, Completed)
    ├── TabSwitcher
    │   ├── Active (has unwatched)
    │   └── Watched (completed)
    └── MediaList
        └── PlaylistCard[]
            ├── ThumbnailDisplay
            ├── Metadata (ID, Items, Watched, Progress%)
            ├── ProgressBar
            ├── ActionButtons
            │   ├── Primary: viewItems(), openYouTube()
            │   ├── Expandable: more()
            │   │   └── sync()
            │   └── Danger: delete()
            └── PlaylistItemsModal
```

### Watched Page (`app/watched/page.tsx`)

```
Redirect to /list?tab=watched
```

---

## TypeScript Type Updates

### Update `types/video.ts`

Add:
```typescript
export interface VideoFilters {
    isWatched?: boolean;
    search?: string;
    platforms?: string[];
    tagIds?: number[];
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
}
```

### Update `types/playlist.ts`

Add:
```typescript
export interface PlaylistFilters {
    status?: 'all' | 'has-unwatched' | 'completed';
    search?: string;
}
```

---

## Implementation Order

1. **Create shared components** (without integration)
   - `thumbnail-display.tsx`
   - `action-button.tsx`
   - `progress-bar.tsx`
   - `error-display.tsx`
   - `tab-switcher.tsx`

2. **Create complex shared components**
   - `media-card.tsx`
   - `media-list.tsx`
   - `filter-bar.tsx`

3. **Create barrel export**
   - `components/shared/index.ts`

4. **Create data hooks**
   - `hooks/use-videos.ts`
   - `hooks/use-playlists.ts`

5. **Update type definitions**
   - `types/video.ts` - Add `VideoFilters`
   - `types/playlist.ts` - Add `PlaylistFilters`

6. **Refactor Video Card**
   - Update `components/videos/video-card.tsx` to use `MediaCard`
   - Remove old ThumbnailDisplay component

7. **Refactor Series Card**
   - Update `components/series/series-card.tsx` to use `MediaCard`
   - Add progress bar for backlog series
   - Add expandable actions (`more()`)

8. **Refactor Playlist Card**
   - Update `components/playlists/playlist-card.tsx` to use `MediaCard`
   - Add expandable actions (`more()`)

9. **Refactor Video List**
   - Update `components/videos/video-list.tsx` to use `MediaList`

10. **Refactor Series List**
    - Update `components/series/series-list.tsx` to use `MediaList`

11. **Refactor Playlist List**
    - Update `components/playlists/playlist-list.tsx` to use `MediaList`
    - Remove internal data fetching

12. **Refactor Videos Page**
    - Update `app/list/page.tsx`
    - Add tabs (Active/Watched)
    - Use `useVideos` hook
    - Use `FilterBar` component
    - Remove bulk operations

13. **Refactor Series Page**
    - Update `app/series/page.tsx`
    - Use `FilterBar` component
    - Use `TabSwitcher` component

14. **Refactor Playlists Page**
    - Update `app/playlists/page.tsx`
    - Add tabs (Active/Watched)
    - Use `usePlaylists` hook
    - Use `FilterBar` component
    - Add filtering logic

15. **Convert Watched Page**
    - Update `app/watched/page.tsx` to redirect to `/list?tab=watched`

16. **Update Navigation**
    - Remove "Watched" from `components/navigation-tabs.tsx`

17. **Clean up**
    - Remove unused imports
    - Delete old ThumbnailDisplay from video-card.tsx
    - Verify all components work

18. **Test and validate**
    - Test all three pages
    - Test filtering on all pages
    - Test tab switching
    - Test card actions

---

## Estimated Line Count Changes

| File | Current | After | Change |
|------|---------|-------|--------|
| **New Files** | | | |
| `thumbnail-display.tsx` | 0 | ~50 | +50 |
| `action-button.tsx` | 0 | ~80 | +80 |
| `progress-bar.tsx` | 0 | ~40 | +40 |
| `media-card.tsx` | 0 | ~150 | +150 |
| `media-list.tsx` | 0 | ~80 | +80 |
| `filter-bar.tsx` | 0 | ~200 | +200 |
| `tab-switcher.tsx` | 0 | ~60 | +60 |
| `error-display.tsx` | 0 | ~40 | +40 |
| `index.ts` | 0 | ~15 | +15 |
| `use-videos.ts` | 0 | ~150 | +150 |
| `use-playlists.ts` | 0 | ~150 | +150 |
| **Modified Files** | | | |
| `video-card.tsx` | 451 | ~120 | -331 |
| `series-card.tsx` | 496 | ~140 | -356 |
| `playlist-card.tsx` | 235 | ~100 | -135 |
| `video-list.tsx` | 91 | ~40 | -51 |
| `series-list.tsx` | ~100 | ~40 | -60 |
| `playlist-list.tsx` | 143 | ~30 | -113 |
| `list/page.tsx` | 649 | ~180 | -469 |
| `series/page.tsx` | 441 | ~150 | -291 |
| `playlists/page.tsx` | 28 | ~120 | +92 |
| `watched/page.tsx` | 355 | ~10 | -345 |
| `navigation-tabs.tsx` | 125 | ~115 | -10 |
| **Total** | **~2,884** | **~1,730** | **-1,154** (~40% reduction) |

---

## Key Design Principles

1. **Single Source of Truth**: Each UI pattern exists in exactly one shared component
2. **Composition over Inheritance**: Components accept configuration rather than extending base classes
3. **Type Safety**: Full TypeScript interfaces for all props
4. **Consistency**: Same patterns across all content types
5. **Accessibility**: Maintain ARIA labels and keyboard navigation
6. **Performance**: Lazy load thumbnails, memoize expensive computations
7. **Error Boundaries**: Each page has consistent error handling

## Post-Refactor Architecture

```
app/
├── list/page.tsx          # Videos with tabs (Active/Watched)
├── series/page.tsx        # Series with tabs (Active/Watched)
├── playlists/page.tsx     # Playlists with tabs (Active/Watched)
├── watched/page.tsx       # Redirects to /list?tab=watched

components/
├── shared/
│   ├── thumbnail-display.tsx   # Universal thumbnail
│   ├── action-button.tsx       # Universal button
│   ├── progress-bar.tsx        # Universal progress
│   ├── media-card.tsx          # Universal card (used by all 3)
│   ├── media-list.tsx          # Universal list
│   ├── filter-bar.tsx          # Universal filters
│   ├── tab-switcher.tsx        # Universal tabs
│   ├── error-display.tsx       # Universal errors
│   └── index.ts                # Barrel exports
├── videos/
│   ├── video-card.tsx          # Thin wrapper around MediaCard
│   └── video-list.tsx          # Thin wrapper around MediaList
├── series/
│   ├── series-card.tsx         # Thin wrapper around MediaCard
│   └── series-list.tsx         # Thin wrapper around MediaList
└── playlists/
    ├── playlist-card.tsx       # Thin wrapper around MediaCard
    ├── playlist-list.tsx       # Thin wrapper around MediaList
    └── playlist-items-modal.tsx # Unchanged

hooks/
├── use-series.ts               # Existing
├── use-videos.ts               # New
└── use-playlists.ts            # New

types/
├── video.ts                    # Add VideoFilters
├── series.ts                   # Existing (no changes needed)
└── playlist.ts                 # Add PlaylistFilters
```

---

## Success Criteria

After implementation, verify:

1. ✅ All three pages (Videos, Series, Playlists) use tabs for Active/Watched
2. ✅ All cards show consistent button styling (via `ActionButton`)
3. ✅ All cards have expandable `more()` actions
4. ✅ Series cards show progress bar for backlog series
5. ✅ Videos page no longer has bulk operations
6. ✅ `/watched` redirects to `/list?tab=watched`
7. ✅ Navigation no longer shows separate "Watched" tab
8. ✅ All pages have consistent filter bars
9. ✅ All pages have consistent error display
10. ✅ TypeScript compiles without errors
11. ✅ All existing functionality preserved
12. ✅ Playlist filtering works (search, status)

---

## Notes

- Keep `PlaylistItemsModal` unchanged - it's specific playlist functionality
- Bulk API endpoints can remain but won't be called from UI
- Series-specific modals (Edit) stay in `components/series/`
- Video-specific modals (Edit, Convert) stay in `components/videos/`
- The refactor is purely frontend; no API changes needed
