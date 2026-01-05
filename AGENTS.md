# AGENTS.md - Video Watchlist Project

This file contains guidelines and commands for coding agents working on the video watchlist application.

## Tools Available
- When you need to search docs, use `context7` tools.
- When you need to verify styling, use `playwriter` tools.
- When you need to use anything browser related, use `playwriter` tools.
- When you need to interact with the db directly, use `neon` tools.

## After feature development
- Periodically commit to git
- Update PLAN.md and STYLE.md for any changes
- Run `bun run lint` and `bun run build` to ensure code quality

## Build & Development Commands

### Development
```bash
# Start development server (runs on http://localhost:3000)
bun run dev

# Start development server with specific port
bun run dev --port 3001
```

### Build & Deployment
```bash
# Build for production
bun run build

# Start production server
bun run start
```

### Code Quality
```bash
# Run ESLint (includes TypeScript checking)
bun run lint

# Build also checks TypeScript types
bun run build
```

### Testing
No tests currently set up. When added:
```bash
# Run all tests (framework TBD - Vitest recommended)
bun run test

# Run single test file
bun run test -- file.test.ts
```

## Code Style Guidelines

### TypeScript
- **Strict mode**: Enabled for type safety (`"strict": true` in tsconfig.json)
- **Interface vs Type**: Use `interface` for extensible objects, `type` for unions/primitives
- **Explicit returns**: Required for function parameters and return types
- **Generics**: Use descriptive names (TVideo, TPlatform, TMetadata)
- **Path mapping**: Use `@/*` imports for clean relative paths

### React/Next.js
- **App Router**: Use exclusively (no pages router)
- **Server Components**: Default choice for data fetching and static content
- **Client Components**: Only for interactivity/browser APIs (`'use client'` directive)
- **Custom Hooks**: Extract shared logic into reusable hooks
- **Data Fetching**: Server Components for initial data, client for user interactions

### Database (Drizzle ORM + Neon)
- **Schema**: Define in `lib/db/schema.ts` with proper relations
- **Migrations**: Use Drizzle Kit for schema changes
- **Connection**: Use `DATABASE_URL` env var from `.env.local`
- **Queries**: Use prepared statements and relations for type safety

Schema example:
```typescript
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),
  platform: videoPlatformEnum('platform').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  isWatched: boolean('is_watched').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Styling (Tailwind CSS v4 + Shadcn/ui)
- **Component Library**: Use Shadcn/ui as base (components.json configured)
- **Composition**: Build UIs by composing components, avoid custom CSS
- **Responsive**: Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints
- **Dark Mode**: Support both themes using `next-themes`
- **Developer-focused**: Use monospace fonts (JetBrains Mono) for technical content

### Imports
Order: React → third-party → local utilities → components → types
```typescript
import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractMetadata } from '@/lib/utils/metadata-extractor';
import type { Video } from '@/types/video';
```

### Naming Conventions
- **Components**: PascalCase (VideoCard, AddVideoForm)
- **Functions/Variables**: camelCase (getVideos, videoList, handleSubmit)
- **Constants**: SCREAMING_SNAKE_CASE (API_TIMEOUT, MAX_RETRIES)
- **Files**: kebab-case (video-card.tsx, metadata-extractor.ts)
- **Database**: snake_case columns (is_watched, created_at)
- **Hooks**: camelCase with 'use' prefix (useVideoMetadata)

### Error Handling
- **API Routes**: Return proper HTTP status codes and JSON error responses
- **Client**: Use try/catch blocks, display user-friendly error messages
- **Database**: Wrap operations in transactions, handle connection errors
- **Loading States**: Show skeleton screens and loading indicators
- **Network Errors**: Graceful fallbacks for failed API calls

### File Structure
```
├── app/                    # Next.js App Router
│   ├── api/videos/         # API routes (GET, POST /api/videos)
│   ├── list/               # Video list page
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Home page (add video form)
├── components/
│   ├── ui/                 # Shadcn/ui components
│   ├── videos/             # Video-specific components
│   └── navigation-tabs.tsx # App navigation
├── lib/
│   ├── db/                 # Database schemas & connections
│   ├── api/                # API utilities (future)
│   └── utils/              # General utilities
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── app/                    # App-specific pages
```

### Mobile Optimization
- **Viewport**: Meta tag added in `app/layout.tsx` for proper mobile scaling
- **Touch Targets**: All buttons have 44px minimum height for accessibility
- **Responsive Navigation**: Hamburger menu with slide-out drawer for mobile screens
- **Card Layouts**: Preview cards stack vertically on mobile, thumbnails scale responsively while maintaining 16:9 aspect ratio
- **Dialogs**: Preferences dialog uses `max-w-80` with responsive grid layouts
- **Typography**: Page headings use `text-2xl sm:text-3xl` for mobile readability
- **Performance**: Lazy loading implemented for video thumbnails
- **Testing Focus**: Optimized for iPhone 13 Pro (390px width) and modern mobile devices

### ESLint Configuration
- **Base**: Next.js recommended rules with TypeScript support
- **Config**: `eslint.config.mjs` with flat config format
- **Rules**: No unused vars, consistent imports, no console in production
- **Integration**: Runs via `bun run lint`

### Database Migrations
```bash
# Generate migration from schema changes
bunx drizzle-kit generate

# Push schema changes to database
bunx drizzle-kit push

# Check migration status
bunx drizzle-kit check
```

### Environment Variables
- `DATABASE_URL`: Neon PostgreSQL connection string (required)

### Additional Notes
- No Cursor rules (.cursor/rules/ or .cursorrules) or Copilot rules found
- Platform support: YouTube, Netflix, Nebula, Twitch URL handling
- Deploy via Vercel or similar platforms
- Use Bun for all package management and scripts
- Follow developer-focused UI patterns from STYLE.md
- Always run `bun run lint` and `bun run build` after code changes</content>
<parameter name="filePath">AGENTS.md
