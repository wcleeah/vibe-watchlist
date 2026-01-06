# AGENTS.md - Video Watchlist Project

This file contains comprehensive guidelines and commands for coding agents working on the video watchlist application. It serves as the definitive reference for development practices, tooling, and code standards.

## Development Workflow

### Tools Available
- **Context7**: Use for searching documentation and code examples from libraries/frameworks
- **Playwright**: Use for browser automation, UI testing, and visual verification
- **Neon Tools**: Use for direct database interactions and schema management

### After Feature Development
- Run `bun run lint` and `bun run build` to ensure code quality
- Update `PLAN.md` and `STYLE.md` for any architectural or design changes
- Commit changes with descriptive messages following conventional commit format
- Test on mobile devices (iPhone 13 Pro baseline: 390px width)

## Build & Development Commands

### Development Server
```bash
# Start development server (default: http://localhost:3000)
bun run dev

# Start with custom port
bun run dev --port 3001

# Start with specific hostname
bun run dev --hostname 0.0.0.0
```

### Production Build & Deployment
```bash
# Build for production
bun run build

# Start production server
bun run start

# Preview production build locally
bun run build && bun run start
```

### Code Quality & Linting
```bash
# Run ESLint (includes TypeScript checking)
bun run lint

# Fix auto-fixable ESLint issues
bun run lint --fix

# Type-check only (runs during build)
bun run build
```

### Testing
```bash
# Run all tests (when implemented)
bun run test

# Run tests in watch mode
bun run test --watch

# Run single test file
bun run test path/to/test.file

# Run tests with coverage
bun run test --coverage

# Run e2e tests with Playwright (when implemented)
bun run test:e2e
```

## Code Style Guidelines

### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety (`"strict": true`)
- **Target**: ES2017 for modern browser compatibility
- **Module Resolution**: Bundler resolution for optimal tree-shaking
- **Path Mapping**: `@/*` for clean imports (maps to project root)

### TypeScript Best Practices
- **Interface vs Type**: Use `interface` for object shapes, `type` for unions/aliases
- **Explicit Types**: Always specify return types for functions and parameters
- **Generic Naming**: Use descriptive names (`TVideo`, `TApiResponse`, `TError`)
- **Type Assertions**: Use sparingly, prefer type guards and proper typing
- **Utility Types**: Leverage built-in types (`Partial<T>`, `Omit<T>`, `Pick<T>`)

### React/Next.js Patterns

#### Component Architecture
- **Server Components**: Default choice for data fetching and static content
- **Client Components**: Use `'use client'` directive only when needed for:
  - Browser APIs (`localStorage`, `window`, etc.)
  - Event handlers and interactivity
  - Third-party libraries requiring client-side rendering
- **Component Composition**: Build complex UIs by composing smaller components

#### Custom Hooks
- Extract reusable logic into custom hooks prefixed with `use`
- Hooks should follow single responsibility principle
- Use proper dependency arrays in `useEffect`, `useMemo`, `useCallback`

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
- Define schemas in `lib/db/schema.ts` with proper relations
- Use enums for constrained values (`videoPlatformEnum`)
- Include created/updated timestamps for audit trails
- Use cascading deletes for referential integrity

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

#### Migration Workflow
```bash
# After schema changes in schema.ts
bunx drizzle-kit generate  # Generate migration files
bunx drizzle-kit push      # Apply to database (development)
bunx drizzle-kit check     # Validate migration integrity
```

### Styling (Tailwind CSS v4 + Shadcn/ui)

#### Component Library
- **Base Components**: Use Shadcn/ui components from `@/components/ui/*`
- **Composition**: Build complex components by combining base components
- **Custom Styling**: Avoid custom CSS, extend with Tailwind utilities

#### Responsive Design
- **Mobile-First**: Start with mobile styles, enhance for larger screens
- **Breakpoint Order**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Container Queries**: Use `@container` for component-based responsive design

#### Dark Mode
- **Theme Provider**: `next-themes` handles theme switching
- **CSS Variables**: Shadcn/ui uses CSS variables for theme consistency
- **Class Strategy**: Use `class` strategy for SSR compatibility

#### Developer-Focused Design
- **Typography**: Use JetBrains Mono for code elements and technical content
- **Color Coding**: Use semantic colors (gray for neutral, blue for primary actions)
- **Spacing**: Consistent spacing scale using Tailwind's spacing utilities

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
- **Types**: `kebab-case` (e.g., `video-types.ts`)
- **Directories**: `kebab-case` for grouping (e.g., `video-preview/`, `video-form/`)

#### Code Elements
- **Variables/Functions**: `camelCase` (`getVideos`, `parseUrl`, `videoList`)
- **Constants**: `SCREAMING_SNAKE_CASE` (`API_TIMEOUT`, `MAX_RETRY_ATTEMPTS`)
- **Components**: `PascalCase` (`VideoCard`, `NavigationTabs`)
- **Types/Interfaces**: `PascalCase` (`Video`, `ApiResponse`, `TVideoData`)
- **Enums**: `PascalCase` with descriptive names (`VideoPlatform`, `UserRole`)

#### Database
- **Tables**: `snake_case` (`videos`, `video_tags`, `user_sessions`)
- **Columns**: `snake_case` (`is_watched`, `created_at`, `video_id`)
- **Enums**: `snake_case` (`video_platform`)

### Error Handling

#### API Routes
```typescript
// Consistent error response format
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
// Use error boundaries for React components
'use client';
class ErrorBoundary extends Component {
  // Implementation
}

// Handle async operations with proper error states
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

#### Database Error Handling
- Wrap database operations in transactions for consistency
- Handle connection errors gracefully with retry logic
- Log errors for debugging while exposing user-friendly messages

### Performance Considerations

#### React Optimization
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Lazy Loading**: Use `React.lazy` for route-based code splitting
- **Virtual Scrolling**: Implement for large video lists (future enhancement)

#### Database Optimization
- **Prepared Statements**: Use for repeated queries
- **Proper Indexing**: Index frequently queried columns
- **Pagination**: Implement cursor-based pagination for large datasets
- **Connection Pooling**: Neon handles this automatically

#### Bundle Optimization
- **Tree Shaking**: Leverage ES modules for dead code elimination
- **Image Optimization**: Use Next.js Image component for automatic optimization
- **Font Loading**: Preload critical fonts, use `font-display: swap`

### Security Best Practices

#### Input Validation
- **Zod Schemas**: Validate all user inputs on both client and server
- **SQL Injection**: Use parameterized queries (Drizzle handles this)
- **XSS Prevention**: Sanitize user-generated content

#### Authentication & Authorization
- **API Security**: Implement proper authentication for sensitive operations
- **Rate Limiting**: Protect against abuse (future implementation)
- **CORS**: Configure appropriate CORS policies

#### Data Protection
- **Environment Variables**: Never commit secrets or API keys
- **Error Messages**: Don't expose sensitive information in error responses
- **Logging**: Log security events without exposing sensitive data

### File Structure
```
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── videos/               # Video CRUD operations
│   │   └── tags/                 # Tag management
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   ├── list/                     # Video list page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Shadcn/ui base components
│   ├── videos/                   # Video-specific components
│   │   ├── video-list.tsx        # Video list display
│   │   ├── add-video-form.tsx    # Video creation form
│   │   └── video-card.tsx        # Individual video card
│   ├── video-form/               # Form-related components
│   ├── video-preview/            # Preview and metadata components
│   ├── layout/                   # Layout components
│   └── animations/               # Animation utilities
├── lib/                          # Utility libraries
│   ├── db/                       # Database configuration and schemas
│   ├── utils/                    # General utilities
│   │   ├── url-parser.ts         # URL parsing logic
│   │   ├── platform-utils.ts     # Platform detection
│   │   └── metadata-extractor.ts # Video metadata extraction
│   └── api/                      # API client utilities
├── hooks/                        # Custom React hooks
│   ├── use-videos.ts             # Video data management
│   └── use-theme.ts              # Theme management
├── types/                        # TypeScript type definitions
│   ├── video.ts                  # Video-related types
│   ├── form.ts                   # Form data types
│   └── api.ts                    # API response types
├── drizzle/                      # Database migrations
├── public/                       # Static assets
└── styles/                       # Additional stylesheets
```

### Mobile Optimization
- **Viewport Configuration**: Proper meta tags in `app/layout.tsx`
- **Touch Targets**: Minimum 44px height for all interactive elements
- **Responsive Navigation**: Slide-out drawer for mobile navigation
- **Card Layouts**: Vertical stacking on mobile, maintain 16:9 aspect ratios
- **Typography Scaling**: Responsive text sizes (`text-2xl sm:text-3xl`)
- **Performance**: Lazy loading for video thumbnails
- **Testing Baseline**: iPhone 13 Pro (390px width) and modern mobile devices

### ESLint Configuration
- **Configuration**: `eslint.config.mjs` using flat config format
- **Base Rules**: Next.js recommended rules with TypeScript support
- **Custom Rules**: No unused variables, consistent import ordering
- **Integration**: Runs via `bun run lint`, includes in CI pipeline

### Environment Variables
Required environment variables:
- `DATABASE_URL`: Neon PostgreSQL connection string (required for database operations)

Optional environment variables:
- `NEXT_PUBLIC_*`: Public variables accessible in browser
- `NODE_ENV`: Development/production environment detection

### Additional Guidelines

#### Git Workflow
- **Commit Messages**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Branch Naming**: `feature/`, `bugfix/`, `hotfix/` prefixes
- **Pull Requests**: Include description, link related issues, request reviews

#### Documentation
- **Code Comments**: Explain complex business logic, not obvious code
- **README Updates**: Keep setup and usage instructions current
- **API Documentation**: Document API endpoints with examples

#### Testing Strategy (Future Implementation)
- **Unit Tests**: Component and utility function testing with Vitest
- **Integration Tests**: API route testing
- **E2E Tests**: Critical user flows with Playwright
- **Visual Regression**: Component appearance testing

#### Deployment
- **Platform**: Vercel or similar serverless platform
- **Build Optimization**: Leverage Next.js production optimizations
- **CDN**: Automatic static asset optimization
- **Environment**: Separate staging and production environments

### Tool-Specific Usage

#### Context7 Integration
- Use for library documentation and code examples
- Search with specific queries: "React useState hook examples"
- Prefer for API documentation and framework guides

#### Playwright Integration
- Use for UI verification and browser automation
- Test responsive design across different viewports
- Validate accessibility features

#### Neon Database Tools
- Use for direct database queries during development
- Validate schema changes before migration
- Monitor query performance and optimization

This comprehensive guide ensures consistent, maintainable, and scalable code across the video watchlist application. Always refer to this document before implementing new features or modifying existing code.</content>
<parameter name="filePath">AGENTS.md
