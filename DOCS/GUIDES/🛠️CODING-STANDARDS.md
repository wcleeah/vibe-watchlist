# AGENTS.md - Video Watchlist Project

This file contains guidelines and commands for coding agents working on the video watchlist application.

## Project Overview
- **Framework**: Next.js 15.5.9 with App Router, React 19.1.4, TypeScript, Tailwind CSS v4, Shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM and Neon
- **Deployment**: Cloudflare Pages with OpenNext.js
- **Package Manager**: Yarn (scripts use standard npm format)
- **Current State**: Core video watchlist functionality implemented with AI metadata integration

## Build & Development Commands

### Development Server
```bash
yarn dev          # Start dev server (http://localhost:3000)
yarn build        # Production build
yarn start        # Start production server
```

### Deployment
```bash
yarn preview      # Preview Cloudflare deployment locally
yarn deploy       # Deploy to Cloudflare Pages
yarn cf-typegen   # Generate Cloudflare environment types
```

### Database Management
```bash
yarn drizzle-kit generate  # Generate migration files from schema changes
yarn drizzle-kit migrate   # Apply pending migrations to database
yarn drizzle-kit push      # Push schema changes directly (for development)
yarn drizzle-kit studio    # Launch Drizzle Studio for database exploration
```

### Code Quality & Linting
```bash
yarn lint         # Run ESLint (includes TypeScript checking)
yarn lint --fix   # Fix auto-fixable issues (recommended before committing)
```

### Testing
- **Current State**: No test framework configured yet
- **Future**: Vitest for unit tests, Playwright for E2E tests
- **Single Test**: `yarn test path/to/test.file` (when implemented)
- **Note**: Always run linting before testing - tests will fail if linting fails

## Code Style Guidelines

### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety (`"strict": true`)
- **Target**: ES2017 for modern browser compatibility
- **Libraries**: DOM, DOM.Iterable, ESNext
- **Module Resolution**: Bundler resolution for optimal tree-shaking
- **Path Mapping**: `@/*` maps to project root
- **JSX**: `"preserve"` transform (handled by Next.js)
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
Current patterns observed in codebase (organize by logical grouping):
```typescript
// React/Next.js imports first
import type { Metadata } from "next";

// Local context/providers
import { PreferencesProvider } from "@/lib/preferences-context";

// Third-party libraries
import { Toaster } from 'sonner';

// CSS imports (fonts, styles)
import "@fontsource/inter/400.css";
import "./globals.css";

// Local imports grouped by type:
// - Components
import { Button } from "@/components/ui/button";
// - Hooks
import { useVideoMetadata } from "@/hooks/use-video-metadata";
// - Services
import { VideoService } from "@/lib/services/video-service";
// - Types
import type { VideoCreateRequest } from '@/types/api';
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

### Key Libraries & Technologies
- **UI**: Shadcn/ui components with Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Fonts**: Fontsource (Inter, JetBrains Mono)
- **Animations**: Tailwind CSS with custom components
- **Database**: Drizzle ORM with prepared statements for security

### Performance & Security
- **React**: Use `React.memo`, `useMemo`, `useCallback` for optimization
- **Database**: Parameterized queries (handled by Drizzle)
- **Validation**: Zod schemas for all inputs
- **Secrets**: Never commit environment variables or API keys
- **Errors**: Don't expose sensitive information in error messages
### Linting Configuration
- **ESLint Config**: Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` with flat config
- **Auto-fixable Issues**: Run `yarn lint --fix` before committing
- **TypeScript Checking**: Included in linting process

### IDE/Editor Integration
- **Cursor Rules**: No .cursor/rules/ or .cursorrules files found
- **Copilot Instructions**: No .github/copilot-instructions.md found

This guide ensures consistent, maintainable, and scalable code across the video watchlist application.</content>
<parameter name="filePath">AGENTS.md
