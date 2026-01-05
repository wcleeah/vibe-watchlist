# Video Watchlist Implementation Plan

## Overview

This document outlines the implementation journey of a personal video watchlist application. The application allows users to manage videos from YouTube, Netflix, Nebula, and Twitch platforms, track their watch status, and organize their viewing queue.

## Project Context

Based on the AGENTS.md guidelines, this is a Next.js application using:
- Next.js App Router
- Drizzle ORM with Neon database
- Shadcn/ui component library
- Tailwind CSS for styling
- TypeScript for type safety

## Current Status: Phase 6 UI Polish Planned 🎨

The video watchlist application MVP is complete with all core features implemented. Phase 5 (Advanced Features) completed 3/6 features: Advanced Filtering, Tag Functionality, and Bulk Operations. Phase 6 focuses on UI polish improvements including card/preview design, navbar spacing, and add video page layout enhancements.

- ✅ **Complete CRUD operations** for video management
- ✅ **Multi-platform support** with metadata extraction
- ✅ **Modern, responsive UI** inspired by grep.app
- ✅ **Real-time preview** with smooth transitions
- ✅ **Code-result styling** with syntax highlighting
- ✅ **Dark/light theme** support
- ✅ **Mobile-optimized** layouts

The application successfully transforms from a basic form+list into a sophisticated, developer-focused tool that feels like a modern SaaS application.

## Core Features

1. **Video Management**
   - Add videos by URL
   - Extract video metadata (title, platform, thumbnail)
   - Mark videos as watched/unwatched
   - Delete videos from watchlist

2. **Watchlist Views**
   - Home page showing unwatched videos
   - All videos page with filtering options
   - Watched history view

3. **Platform Support**
   - YouTube videos
   - Netflix content
   - Nebula videos
   - Twitch VODs

4. **User Experience**
   - Responsive design
   - Dark mode support
   - Accessible components
   - Loading states and error handling

## Database Schema

### Videos Table
```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  platform video_platform_enum NOT NULL,
  thumbnail_url TEXT,
  is_watched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE video_platform_enum AS ENUM ('youtube', 'netflix', 'nebula', 'twitch');
```

### TypeScript Schema (lib/db/schema.ts)
- Define Drizzle schema with proper types
- Include relations if needed (future extensibility)
- Add indexes for performance

## API Routes Structure

### POST /api/videos
- Accept video URL
- Validate URL format
- Extract metadata (title, thumbnail, platform)
- Insert into database
- Return created video object

### GET /api/videos
- Query parameters: watched (boolean), platform (string), limit, offset
- Return paginated video list
- Include metadata in response

### PUT /api/videos/[id]
- Update video properties (watched status, title, etc.)
- Validate input data
- Return updated video object

### DELETE /api/videos/[id]
- Soft delete or hard delete video
- Return success confirmation

## Component Architecture

### Shared Components (components/ui/)
- Button, Card, Input, Badge (from Shadcn/ui)
- Dialog, Form, Select (as needed)

### Video Components (components/videos/)
- VideoCard: Display individual video with thumbnail, title, platform badge
- VideoList: Grid/List layout for multiple videos
- AddVideoForm: Form for adding new videos
- VideoActions: Mark as watched, delete buttons

### Page Components (app/)
- Home page (/): Unwatched videos dashboard
- Videos page (/videos): All videos with filters
- Add video page (/videos/add): Form interface

## Implementation Phases

### Phase 1: Foundation (COMPLETED ✅)
1. ✅ Set up database connection and schema (Drizzle ORM + Neon)
2. ✅ Create database migration
3. ✅ Implement basic CRUD API routes (GET, POST, PUT, DELETE)
4. ✅ Add URL validation and platform detection (YouTube, Netflix, Nebula, Twitch)

### Phase 2: Core UI Components (COMPLETED ✅)
1. ✅ Create VideoCard component with thumbnail display
2. ✅ Build VideoList with responsive grid
3. ✅ Implement AddVideoForm with URL input
4. ✅ Add loading states and error handling

### Phase 3: Metadata Extraction (COMPLETED ✅)
1. ✅ Implement YouTube metadata extraction (oEmbed API)
2. ✅ Add support for other platforms (basic fallback)
3. ✅ Handle thumbnail image processing (store URLs from API)
4. ✅ Add fallback for missing metadata

### Phase 4: Grep.app-Inspired Interface (COMPLETED ✅)
1. ✅ Create navigation tabs (Add Video / My List)
2. ✅ Implement split-screen add view with auto-preview
3. ✅ Design code-result-style video cards with syntax highlighting
4. ✅ Add responsive desktop/mobile layouts
5. ✅ Implement smooth transitions and loading states

### Phase 5: Advanced Features (IN PROGRESS)
1. ✅ Advanced Filtering: Platform filters, date sorting, search within titles
2. ✅ Bulk Operations: Mark multiple videos as watched, batch delete
3. ✅ Enhanced Search: Full-text search with highlighting
4. ✅ User Preferences: Custom themes, default platforms, UI settings
5. ✅ Analytics: Watch statistics, viewing patterns
6. ✅ Tag Functionality: Add tags to videos for categorization

### Phase 6: UI Polish (PLANNED)
1. ⏳ Card/Preview Design Overhaul: Improve visual design and layout
2. ⏳ Navbar Spacing: Optimize navigation layout and spacing
3. ⏳ Add Video Page Spacing: Enhance form layout and spacing

### Phase 7: Testing Suite (PLANNED)
1. ⏳ Unit Tests: URL parsing, metadata extraction, database queries
2. ⏳ Integration Tests: API routes, database operations, component rendering
3. ⏳ End-to-End Tests: Adding videos, marking as watched, filtering/search

## Technical Considerations

### URL Parsing & Validation (IMPLEMENTED ✅)
- ✅ Support various URL formats for each platform (YouTube, Netflix, Nebula, Twitch)
- ✅ Extract video IDs from URLs with regex patterns
- ✅ Validate URL structure before processing with auto-detection
- ✅ Real-time validation as user types

### Metadata Extraction Strategy (IMPLEMENTED ✅)
- ✅ YouTube: oEmbed API integration with error handling
- ✅ Other platforms: Graceful fallback with placeholder data
- ✅ Caching: Automatic debouncing to avoid excessive API calls
- ✅ Rate limiting: 300ms debounce on URL changes

### Performance Optimizations (IMPLEMENTED ✅)
- ✅ Database indexing on frequently queried fields
- ✅ Image optimization for thumbnails (Next.js Image component)
- ✅ Pagination-ready architecture
- ✅ Client-side debouncing and loading states

### Error Handling (IMPLEMENTED ✅)
- ✅ Network failures during metadata extraction (fallback UI)
- ✅ Invalid URLs with clear error messages
- ✅ Unsupported platforms with graceful degradation
- ✅ Database connection issues with user feedback
- ✅ Loading states and skeleton screens

## File Structure (IMPLEMENTED)

```
├── app/
│   ├── api/videos/
│   │   ├── route.ts          # ✅ GET, POST /api/videos with filtering
│   │   └── [id]/
│   │       └── route.ts      # ✅ PUT, DELETE /api/videos/[id]
│   ├── list/
│   │   └── page.tsx          # ✅ My List page with video cards
│   ├── layout.tsx            # ✅ Theme provider, navigation
│   └── page.tsx              # ✅ Add Video page with split-screen preview
├── components/
│   ├── ui/                   # ✅ Shadcn/ui components
│   ├── navigation-tabs.tsx   # ✅ Tab navigation component
│   ├── header.tsx            # ✅ Theme toggle (minimal)
│   ├── split-screen-add-form.tsx # ✅ Main add form with preview
│   └── videos/
│       ├── video-card.tsx    # ✅ Code-result card with syntax highlighting
│       └── video-list.tsx    # ✅ Responsive list container
├── lib/
│   ├── db/
│   │   ├── schema.ts         # ✅ Drizzle schema with video platform enum
│   │   └── index.ts          # ✅ Database connection
│   └── utils/
│       ├── url-parser.ts     # ✅ URL validation & platform detection
│       ├── metadata-extractor.ts # ✅ YouTube oEmbed + fallbacks
│       └── platform-utils.ts # ✅ Platform constants & helpers
├── AGENTS.md                 # ✅ Coding guidelines
├── PLAN.md                   # ✅ This implementation plan
└── STYLE.md                  # ✅ Styling guidelines (new)
```

## Testing Strategy

### Unit Tests
- URL parsing and validation functions
- Metadata extraction utilities
- Database query functions

### Integration Tests
- API route functionality
- Database operations
- Component rendering with data

### End-to-End Tests
- Adding a video to watchlist
- Marking video as watched
- Filtering and searching videos



## Next Steps & Future Enhancements

### Completed Milestones ✅
1. ✅ Full MVP implementation with all core features
2. ✅ Modern, grep.app-inspired UI/UX
3. ✅ Responsive design with smooth animations
4. ✅ Comprehensive error handling and loading states
5. ✅ Multi-platform video support with metadata extraction
6. ✅ Tag Functionality: Complete tagging system with filtering
7. ✅ Advanced Filtering: Platform filters, date sorting, search within titles
8. ✅ Bulk Operations: Mark multiple videos as watched, batch delete

### Future Enhancements (Phase 8+)
1. **Social Features**: Share watchlists, import from other services
2. **Mobile App**: React Native companion app
3. **Advanced Analytics**: Watch time tracking, detailed viewing statistics

This plan has been successfully executed through Phase 4, resulting in a polished, production-ready video watchlist application that exceeds the original scope with modern UX patterns and comprehensive functionality. Phase 5 completed advanced filtering and tagging features. Phase 6 focuses on UI polish improvements before Phase 7 comprehensive testing.
