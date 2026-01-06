# AGENTS.md - Video Watchlist Project

This file contains guidelines and commands for coding agents working on the video watchlist application.

## Project Overview
- **Framework**: Next.js 16 with App Router, React 19, TypeScript, Tailwind CSS v4, Shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM and Neon
- **Package Manager**: Bun (scripts use standard npm format)
- **Current State**: Core video watchlist functionality implemented with AI metadata integration

## Build & Development Commands

### Development Server
```bash
bun run dev          # Start dev server (http://localhost:3000)
bun run build        # Production build
bun run start        # Start production server
```

### Database Management
```bash
bun run drizzle-kit generate  # Generate migration files from schema changes
bun run drizzle-kit migrate   # Apply pending migrations to database
bun run drizzle-kit push      # Push schema changes directly (for development)
bun run drizzle-kit studio    # Launch Drizzle Studio for database exploration
```

### Code Quality & Linting
```bash
bun run lint         # Run ESLint (includes TypeScript checking)
bun run lint --fix   # Fix auto-fixable issues (recommended before committing)
```

### Testing
- **Current State**: No test framework configured yet
- **Future**: Vitest for unit tests, Playwright for E2E tests
- **Single Test**: `bun run test path/to/test.file` (when implemented)
- **Note**: Always run linting before testing - tests will fail if linting fails

## Code Style Guidelines

### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety (`"strict": true`)
- **Target**: ES2017 for modern browser compatibility
- **Libraries**: DOM, DOM.Iterable, ESNext
- **Module Resolution**: Bundler resolution for optimal tree-shaking
- **Path Mapping**: `@/*` maps to project root
- **JSX**: `"react-jsx"` transform for modern React
- **Incremental Builds**: Enabled for faster compilation
- **ES Modules**: Enabled with isolated modules checking

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
- **Server Components**: Preferred for initial data fetching
- **Client Components**: Use for user interactions and browser APIs

### Database (Drizzle ORM + Neon)

#### Schema Design
- **Naming**: `snake_case` for tables and columns (`videos`, `video_tags`, `is_watched`)
- **Enums**: `snake_case` with descriptive names (`video_platform`)
- **Relations**: Use proper foreign key constraints with cascading deletes
- **Timestamps**: Include `createdAt` and `updatedAt` for audit trails
- **JSON**: Use `jsonb` for flexible metadata storage (ai_metadata_cache, user_config)
- **Arrays**: Use `text().array()` for pattern matching (platform_configs.patterns)

#### Query Patterns
- **Relations**: Use `with` for efficient queries with related data
- **Prepared Statements**: Use for performance-critical queries
- **Caching**: Implement AI metadata caching with expiration (aiMetadataCache.expiresAt)

### Styling (Tailwind CSS v4 + Shadcn/ui)
- **Base Components**: Use Shadcn/ui components from `@/components/ui/*`
- **Utility Function**: Use `cn()` helper for conditional classes (clsx + tailwind-merge)
- **Component Variants**: Use `class-variance-authority` (cva) for component variants
- **Dark Mode**: Use `next-themes` with `class` strategy for SSR compatibility
- **Mobile-First**: Start with mobile styles, enhance for larger screens
- **Data Attributes**: Use data-slot, data-variant, data-size for component styling hooks

### Import Organization
Order imports consistently:
```typescript
// 1. React/Next.js imports
import type { Metadata } from "next";

// 2. Third-party libraries (alphabetical, before local imports)
import { Toaster } from 'sonner';
import "@fontsource/inter/400.css";

// 3. Local imports (by type, then alphabetical)
// Context/providers first
import { PreferencesProvider } from "@/lib/preferences-context";

// Components (UI components before feature components)
import { Button } from "@/components/ui/button";
import { VideoList } from "@/components/videos/video-list";

// Services and utilities
import { VideoService } from "@/lib/services/video-service";

// Types and schemas
import type { VideoCreateRequest } from '@/types/api';
import { Video } from '@/lib/db/schema';

// Styles last
import "./globals.css";
```

### Naming Conventions
- **Files**: `pascal-case` for components, `kebab-case` for utilities, `camelCase` for hooks
- **Variables/Functions**: `camelCase` (`getVideos`, `parseUrl`)
- **Constants**: `SCREAMING_SNAKE_CASE` (`API_TIMEOUT`)
- **Components/Types**: `PascalCase` (`VideoCard`, `Video`, `ApiResponse`)
- **Enums**: `PascalCase` with descriptive names (`VideoPlatform`)

### Error Handling
- **API Routes**: Use try-catch blocks, return proper HTTP status codes, log errors
- **Client-Side**: Handle loading states, display user-friendly error messages
- **Validation**: Use Zod schemas for input validation on both client and server
- **Service Layer**: Throw descriptive Error objects with user-friendly messages
- **Network Requests**: Check `response.ok` and parse error responses from API

### API Patterns
- **Service Classes**: Use static methods for API calls (e.g., `VideoService.create()`)
- **Response Handling**: Always check `response.ok` before parsing JSON
- **Error Propagation**: Extract error messages from API responses (`error.error`)
- **URL Building**: Use template literals for dynamic API endpoints
- **Query Parameters**: Use `URLSearchParams` for complex query building

### Additional Technologies & Libraries
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Hookform Resolvers for form management
- **Notifications**: Sonner for toast notifications
- **Fonts**: Fontsource for self-hosted fonts (Inter, JetBrains Mono)
- **Validation**: Zod for runtime type validation
- **Animations**: Custom animation components with Tailwind CSS

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
│   │   ├── metadata/             # Metadata extraction
│   │   ├── platforms/            # Platform management
│   │   ├── tags/                 # Tag management
│   │   └── config/               # User configuration
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   ├── watched/                  # Watched videos page
│   ├── list/                     # Video list page
│   ├── tags/                     # Tags management page
│   ├── analytics/                # Analytics dashboard
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Shadcn/ui base components
│   ├── videos/                   # Video-specific components
│   ├── video-form/               # Form-related components
│   ├── video-preview/            # Preview and metadata components
│   ├── layout/                   # Layout components
│   ├── platform/                 # Platform components
│   └── animations/               # Animation components
├── lib/                          # Utility libraries
│   ├── db/                       # Database configuration and schemas
│   ├── services/                 # Business logic services
│   ├── utils/                    # General utilities
│   ├── platforms/                # Platform detection utilities
│   └── types/                    # Local type definitions
├── hooks/                        # Custom React hooks
├── types/                        # Global TypeScript type definitions
├── drizzle/                      # Database migrations
└── public/                       # Static assets
```


### Linting Configuration
- **ESLint Config**: Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- **Auto-fixable Issues**: Run `bun run lint --fix` before committing
- **TypeScript Checking**: Included in linting process

### IDE/Editor Integration
- **Cursor Rules**: No .cursor/rules/ or .cursorrules files found
- **Copilot Instructions**: No .github/copilot-instructions.md found

This guide ensures consistent, maintainable, and scalable code across the video watchlist application.</content>
<parameter name="filePath">AGENTS.md
