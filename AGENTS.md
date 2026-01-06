# AGENTS.md - Video Watchlist Project

This file contains guidelines and commands for coding agents working on the video watchlist application.

## Project Overview
- **Framework**: Next.js 16 with App Router, TypeScript, Tailwind CSS v4, Shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM and Neon
- **Package Manager**: Bun
- **Current State**: Core video watchlist functionality implemented

## Build & Development Commands

### Development Server
```bash
bun run dev          # Start dev server (http://localhost:3000)
bun run build        # Production build
bun run start        # Start production server
```

### Code Quality & Linting
```bash
bun run lint         # Run ESLint (includes TypeScript checking)
bun run lint --fix   # Fix auto-fixable issues
```

### Testing
- **Current State**: No test framework configured yet
- **Future**: Vitest for unit tests, Playwright for E2E tests
- **Single Test**: `bun run test path/to/test.file` (when implemented)

## Code Style Guidelines

### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety (`"strict": true`)
- **Target**: ES2017 for modern browser compatibility
- **Module Resolution**: Bundler resolution for optimal tree-shaking
- **Path Mapping**: `@/*` for clean imports (maps to project root)
- **JSX**: `"react-jsx"` transform for modern React
- **Incremental Builds**: Enabled for faster compilation

### React/Next.js Patterns

#### Component Architecture
- **Server Components**: Default choice for data fetching and static content
- **Client Components**: Use `'use client'` directive only when needed for:
  - Browser APIs (`localStorage`, `window`, etc.)
  - Event handlers and interactivity
  - Third-party libraries requiring client-side rendering
- **Component Composition**: Build complex UIs by composing smaller components

#### Custom Hooks
- **Naming**: `camelCase` with `use` prefix (e.g., `useVideoMetadata`)
- **Single Responsibility**: Each hook should focus on one concern
- **Proper Dependencies**: Use correct dependency arrays in `useEffect`, `useMemo`, `useCallback`

#### Data Fetching Strategy
```typescript
// Server Component (preferred for initial data)
async function VideoList() {
  const videos = await getVideos(); // Server-side data fetching
  return <VideoGrid videos={videos} />;
}

// Client Component (for user interactions)
'use client';
function VideoActions({ videoId }: { videoId: number }) {
  const [isWatched, setIsWatched] = useState(false);

  const toggleWatched = async () => {
    await updateVideoStatus(videoId, !isWatched);
    setIsWatched(!isWatched);
  };

  return <button onClick={toggleWatched}>Toggle Watched</button>;
}
```

### Database (Drizzle ORM + Neon)

#### Schema Design
- **Naming**: `snake_case` for tables and columns (`videos`, `video_tags`, `is_watched`)
- **Enums**: `snake_case` with descriptive names (`video_platform`)
- **Relations**: Use proper foreign key constraints with cascading deletes
- **Timestamps**: Include `createdAt` and `updatedAt` for audit trails

#### Query Patterns
```typescript
// Use relations for efficient queries
const videosWithTags = await db.query.videos.findMany({
  with: {
    videoTags: {
      with: {
        tag: true
      }
    }
  }
});

// Use prepared statements for performance
const getVideoById = db.select().from(videos).where(eq(videos.id, placeholder('id'))).prepare();
```

### Styling (Tailwind CSS v4 + Shadcn/ui)

#### Component Library
- **Base Components**: Use Shadcn/ui components from `@/components/ui/*`
- **Composition**: Build complex components by combining base components
- **Custom Styling**: Avoid custom CSS, extend with Tailwind utilities
- **Utility Function**: Use `cn()` helper for conditional classes

#### Responsive Design
- **Mobile-First**: Start with mobile styles, enhance for larger screens
- **Breakpoint Order**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Touch Targets**: Minimum 44px height for interactive elements

#### Dark Mode
- **Theme Provider**: `next-themes` handles theme switching
- **CSS Variables**: Shadcn/ui uses CSS variables for theme consistency
- **Class Strategy**: Use `class` strategy for SSR compatibility

### Import Organization
Order imports consistently:
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries (alphabetical)
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// 3. Local utilities and hooks
import { parseVideoUrl } from '@/lib/utils/url-parser';
import { useVideos } from '@/hooks/use-videos';

// 4. UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 5. Local components
import { VideoCard } from '@/components/videos/video-card';

// 6. Type imports (at end)
import type { Video } from '@/lib/db/schema';
import type { VideoFormData } from '@/types/forms';
```

### Naming Conventions

#### Files and Directories
- **Components**: `pascal-case` (e.g., `VideoCard.tsx`, `AddVideoForm.tsx`)
- **Utilities**: `kebab-case` (e.g., `url-parser.ts`, `platform-utils.ts`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useVideoMetadata.ts`)
- **Directories**: `kebab-case` for grouping (e.g., `video-preview/`, `video-form/`)

#### Code Elements
- **Variables/Functions**: `camelCase` (`getVideos`, `parseUrl`, `videoList`)
- **Constants**: `SCREAMING_SNAKE_CASE` (`API_TIMEOUT`, `MAX_RETRY_ATTEMPTS`)
- **Components**: `PascalCase` (`VideoCard`, `NavigationTabs`)
- **Types/Interfaces**: `PascalCase` (`Video`, `ApiResponse`, `TVideoData`)
- **Enums**: `PascalCase` with descriptive names (`VideoPlatform`, `UserRole`)

### Error Handling

#### API Routes
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validation logic
    const result = await createVideo(body);
    return Response.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Video creation failed:', error);

    if (error instanceof ValidationError) {
      return Response.json(
        { error: 'Validation failed', details: error.details },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Client-Side Error Handling
```typescript
function VideoForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: VideoFormData) => {
    setLoading(true);
    setError(null);

    try {
      await createVideo(data);
      // Success handling
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
}
```

### Performance Considerations
- **React Optimization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Database**: Use prepared statements and proper indexing
- **Bundle**: Leverage Next.js production optimizations
- **Images**: Use Next.js Image component for automatic optimization

### Security Best Practices
- **Input Validation**: Use Zod schemas for all user inputs
- **SQL Injection**: Use parameterized queries (Drizzle handles this)
- **Secrets**: Never commit environment variables or API keys
- **Error Messages**: Don't expose sensitive information in error responses

### File Structure
```
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── videos/               # Video CRUD operations
│   │   └── metadata/             # Metadata extraction
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   ├── list/                     # Video list page
│   ├── watched/                  # Watched videos page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Shadcn/ui base components
│   ├── videos/                   # Video-specific components
│   ├── video-form/               # Form-related components
│   ├── video-preview/            # Preview and metadata components
│   ├── layout/                   # Layout components
│   └── animations/               # Animation utilities
├── lib/                          # Utility libraries
│   ├── db/                       # Database configuration and schemas
│   └── utils/                    # General utilities
├── hooks/                        # Custom React hooks
│   ├── use-video-metadata.ts     # Video metadata management
│   └── use-video-form.ts         # Form state management
├── types/                        # TypeScript type definitions
└── public/                       # Static assets
```

### ESLint Configuration
- **Configuration**: `eslint.config.mjs` using flat config format
- **Base Rules**: Next.js recommended rules with TypeScript support
- **Auto-fix**: Supports `--fix` flag for auto-fixable issues
- **Integration**: Runs via `bun run lint`

### Environment Variables
- **Required**: `DATABASE_URL` for Neon PostgreSQL connection
- **Optional**: Public variables prefixed with `NEXT_PUBLIC_`

This guide ensures consistent, maintainable, and scalable code across the video watchlist application.</content>
<parameter name="filePath">AGENTS.md
