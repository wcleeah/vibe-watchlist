# AGENTS.md - Video Watchlist Project

This file contains guidelines and commands for coding agents working on the video watchlist application.

## Tools Available
- When you need to search docs, use `context7` tools.
- When you need to verify styling, use `playwriter` tools.
- When you need to use anything browser related, use `playwriter` tools.
- When you need to interact with the db directly, use `neon` tools.

## After feature development
- Periordically commit to git
- Update PLAN.md and STYLE.md for any changes

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
# Run ESLint
bun run lint

# Check TypeScript types (via Next.js build)
bun run build
```

### Testing
No tests are currently set up. When added:
```bash
# Run all tests (using Vitest or similar)
bun run test

# Run single test file
bun run test -- file.test.ts
```

## Code Style Guidelines

### TypeScript
- **Strict mode**: Enabled for type safety
- **Interface vs Type**: Use `interface` for extensible objects, `type` for unions/primitives
- **Explicit returns**: Required for function parameters and return types
- **Generics**: Use descriptive names (TVideo, TPlatform)

### React/Next.js
- **App Router**: Use exclusively
- **Server Components**: Default choice
- **Client Components**: Only for interactivity/browser APIs
- **Custom Hooks**: Extract shared logic
- **Data Fetching**: Server Components for initial data

### Database (Drizzle ORM + Neon)
- **Schema**: Define in `lib/db/schema.ts`
- **Migrations**: Use Drizzle Kit
- **Connection**: Use `DATABASE_URL` env var
- **Queries**: Use prepared statements

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
- **Component Library**: Use Shadcn/ui as base
- **Composition**: Build UIs by composing components
- **Responsive**: Mobile-first
- **Dark Mode**: Support both themes

### Imports
Order: React, third-party, local (utilities, components, types)

### Naming Conventions
- **Components**: PascalCase (VideoCard)
- **Functions/Variables**: camelCase (getVideos, videoList)
- **Constants**: SCREAMING_SNAKE_CASE (API_TIMEOUT)
- **Files**: kebab-case (video-card.tsx)
- **Database**: snake_case (is_watched)

### Error Handling
- **API Routes**: Return proper HTTP status codes
- **Client**: Use error boundaries
- **Database**: Wrap operations in transactions

### File Structure
```
├── app/                    # Next.js App Router
│   ├── api/videos/         # API routes
│   ├── videos/             # Video-related pages
│   └── layout.tsx
├── components/
│   ├── ui/                 # Shadcn/ui components
│   └── videos/             # Video-specific components
├── lib/
│   ├── db/                 # Database schemas & connections
│   ├── api/                # API utilities
│   └── utils/              # General utilities
└── types/                  # TypeScript type definitions
```

### ESLint Configuration
- **Base**: Next.js recommended rules
- **Tab Width**: 4 spaces
- **Rules**: No unused vars, consistent imports, no console in prod

### Prettier Configuration
- **Tab Width**: 4 spaces
- **Quotes**: Double for JSX, single for JS
- **Trailing Commas**: ES5 style

### Database Migrations
```bash
# Generate migration
bunx drizzle-kit generate

# Push schema changes
bunx drizzle-kit push

# Check status
bunx drizzle-kit check
```

### Environment Variables
- `DATABASE_URL`: Neon connection string

### Additional Notes
- No Cursor rules (.cursor/rules/ or .cursorrules) or Copilot rules (.github/copilot-instructions.md) found.
- Focus on clean code for YouTube, Netflix, Nebula, Twitch URL handling.
- Deploy via Vercel or similar platforms.
- After code changes, always run `bun run lint` and `bun run build` to check quality.</content>
<parameter name="filePath">AGENTS.md
