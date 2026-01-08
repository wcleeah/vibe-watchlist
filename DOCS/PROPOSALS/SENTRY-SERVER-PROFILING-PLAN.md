# Sentry Server Profiling Implementation Plan

## Overview
Implement Sentry Application Performance Monitoring (APM) for server-side profiling only. This will track hotpaths, identify performance bottlenecks, and monitor server-side operations in both development and production environments.

## Goals
- Comprehensive server-side performance monitoring
- Hotpath detection for slow operations
- Database query performance tracking
- API response time monitoring
- Configurable sampling rates for cost control
- No client-side tracking (server-side only)

## Implementation Phases

### Phase 1: Core Setup
- Install `@sentry/nextjs` package
- Update package.json with Sentry dependency
- Create single config file: `lib/sentry.ts` with basic environment variables
- Add `instrumentation.ts` for Next.js setup

### Phase 2: Basic Instrumentation
- Auto-trace all `app/api/*` routes
- Monitor Drizzle ORM queries
- Track external API calls (AI services, scraping)

### Phase 3: Alerts & Monitoring
- Set up alerts for slow APIs (>2s) and high error rates (>5%) in Sentry dashboard
- Access performance dashboard at https://sentry.io/performance/

## Environment Configuration
Add to `.env.local` and production environment:
```bash
# Core Sentry Configuration
SENTRY_DSN=your_project_dsn_here
SENTRY_ENVIRONMENT=development|production
SENTRY_TRACES_SAMPLE_RATE=0.1          # 10% of server requests
```

## Files to Create/Modify
### New Files
- `lib/sentry.ts` - Configuration management
- `instrumentation.ts` - Next.js instrumentation

### Modified Files
- `package.json` - Add Sentry dependency
- Environment files - Add Sentry variables

## Success Metrics
- ✅ API routes traced
- ✅ Database queries monitored
- ✅ External calls tracked
- ✅ Basic alerts configured
- ✅ Cost within free tier limits

## Prerequisites
- Sentry account creation
- Project setup in Sentry dashboard
- DSN key generation
- Environment variable configuration

## Progress Updates
- [x] Phase 1: Core Setup (package installed, config created, instrumentation added)
- [x] Phase 2: Basic Instrumentation (API routes auto-traced, DB queries monitored, external calls tracked)
- [x] Phase 3: Alerts & Monitoring (instructions provided for Sentry dashboard setup)
- [x] Testing & Verification (code quality checks passed, ready for DSN configuration)

## Next Steps
1. Set up Sentry project and get DSN
2. Add environment variables to `.env.local`
3. Test in development with `bun run dev`
4. Set up alerts in Sentry dashboard for slow APIs (>2s) and error rates (>5%)
5. Monitor performance data and adjust sampling rates as needed