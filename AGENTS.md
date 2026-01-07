# Agent Development Guidelines

This document provides essential information for AI coding agents working on the Vibe Watchlist project.

## 🚀 Build & Development Commands

### Core Development
```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Check code (lint + format check)
bun run check

# Fix auto-fixable issues
bun run fix

# Format code manually
bun run format
```

### Deployment & Cloudflare
```bash
# Generate Cloudflare types
bun run cf-typegen

# Preview deployment
bun run preview

# Deploy to Cloudflare
bun run deploy
```

### Database
```bash
# Generate Drizzle types/migrations
bun run db:generate
bun run db:push
bun run db:migrate
```

## 📝 Code Style Guidelines

### Formatting Rules
- 4-space indentation
- Single quotes for strings and imports
- Trailing commas in multi-line structures
- Semicolons required
- 80 character line width
- LF line endings

### Imports
- Use single quotes for all imports
- Group imports by category with blank lines:
  1. React/Next.js imports
  2. External libraries (alphabetized)
  3. Internal imports (@/ paths, alphabetized)
  4. Type imports (use `import type`)

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';

import { VideoService } from '@/lib/services/video-service';
import { useUrlValidation } from '@/hooks/use-url-validation';

import type { Video } from '@/types/video';
import type { ApiResponse } from '@/types/api';
```

### Naming Conventions

**Components:**
- PascalCase: `VideoCard`, `NavigationTabs`
- File names: kebab-case: `video-card.tsx`, `navigation-tabs.tsx`

**Hooks:**
- camelCase with `use` prefix: `useUrlValidation`, `useVideoForm`
- Return descriptive objects with clear property names

**Services:**
- PascalCase class names: `VideoService`, `ApiService`
- camelCase method names: `createVideo()`, `fetchVideos()`

**Types & Interfaces:**
- PascalCase: `Video`, `VideoWithTags`, `ApiResponse`
- Suffix with purpose: `CreateRequest`, `UpdateRequest`, `ApiResponse`

**Variables & Functions:**
- camelCase: `videoData`, `handleSubmit`, `isLoading`
- Boolean prefixes: `isValid`, `hasError`, `canSubmit`

**Constants:**
- UPPER_SNAKE_CASE: `API_BASE_URL`, `DEFAULT_TIMEOUT`

### TypeScript Guidelines

**Strict typing required:**
```typescript
// ✅ Good
interface VideoProps {
  video: Video;
  onUpdate: (video: Video) => void;
}

// ❌ Bad
interface VideoProps {
  video: any;
  onUpdate: (video) => void;
}
```

**Use union types for state:**
```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Prefer enums for complex state
enum VideoStatus {
  Unwatched = 'unwatched',
  Watched = 'watched',
  Watching = 'watching'
}
```

**Generic constraints:**
```typescript
function updateEntity<T extends { id: number }>(entity: T): Promise<T> {
  // Implementation
}
```

### Error Handling

**API Routes:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // Validation
    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Client-side:**
```typescript
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  console.error('API call failed:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
}
```

### Component Patterns

**Functional Components:**
```typescript
'use client';

interface VideoCardProps {
  video: Video;
  onToggleWatched: (id: number) => void;
}

export function VideoCard({ video, onToggleWatched }: VideoCardProps) {
  // Component logic
  return (
    <div className="video-card">
      {/* JSX */}
    </div>
  );
}
```

**Custom Hooks:**
```typescript
interface UseVideoFormReturn {
  form: UseFormReturn<VideoFormData>;
  onSubmit: (data: VideoFormData) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export function useVideoForm(): UseVideoFormReturn {
  // Hook implementation
}
```

### Service Layer Patterns

**Class-based Services:**
```typescript
export class VideoService {
  private static readonly API_BASE = '/api/videos';

  static async create(data: VideoCreateRequest): Promise<Video> {
    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create video');
    }

    return response.json();
  }
}
```

### Database & Data Patterns

**Zod Schemas:**
```typescript
export const videoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid URL"),
  platform: z.enum(['youtube', 'vimeo', 'unknown']),
  tags: z.array(z.number()).optional(),
});

export type VideoFormData = z.infer<typeof videoSchema>;
```

**Drizzle Queries:**
```typescript
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  platform: videoPlatformEnum('platform').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## 🛠️ Development Workflow

### File Organization
```
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                 # Utilities & services
│   ├── services/        # API services
│   └── utils/          # Helper functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── drizzle/            # Database schema & migrations
└── public/             # Static assets
```

### Git Workflow
- Use descriptive commit messages
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Keep commits focused and atomic

### Code Review Checklist
- [ ] TypeScript types are explicit and correct
- [ ] Error handling implemented
- [ ] Imports properly grouped and sorted
- [ ] Components use proper TypeScript interfaces
- [ ] Database queries are efficient
- [ ] API responses validated
- [ ] Code passes Biome checks

## 🔧 Tooling & Dependencies

### Key Libraries
- **UI**: shadcn/ui, Tailwind CSS, Lucide icons
- **Forms**: React Hook Form, Zod validation
- **Database**: Drizzle ORM, PostgreSQL
- **Styling**: Tailwind CSS with CSS variables
- **Code Quality**: Biome (linting & formatting)
- **Deployment**: Cloudflare Workers, OpenNext.js

### Path Aliases
```typescript
// Use @/ for all internal imports
import { VideoService } from '@/lib/services/video-service';
import { useAuth } from '@/hooks/use-auth';
import type { Video } from '@/types/video';
```

## 🚨 Important Notes

- **Bun Required**: This project uses Bun, not npm/yarn
- **Biome Only**: Use Biome for both linting and formatting, not ESLint
- **4-Space Indentation**: All code should use 4 spaces for indentation
- **Strict TypeScript**: All code must pass strict TypeScript checks
- **shadcn/ui**: Follow existing component patterns
- **Database**: Use Drizzle for all database operations
- **Error Boundaries**: Implement proper error boundaries for production
- **Performance**: Optimize bundle size and runtime performance

---

*This document should be updated as the project evolves. Last updated: January 2026*