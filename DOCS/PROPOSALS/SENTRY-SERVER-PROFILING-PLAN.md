# Sentry Server-Side Profiling Implementation Plan

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

### Phase 1: Core Sentry Setup (High Priority)

#### 1.1 Package Installation
- Install `@sentry/nextjs` package
- Update package.json with Sentry dependency

#### 1.2 Configuration Files Creation
- **`lib/config/sentry.ts`**: Centralized configuration management with environment variables
- **`sentry.server.config.js`**: Server-side profiling configuration for Node.js runtime
- **`sentry.edge.config.js`**: Edge runtime configuration for Cloudflare Workers
- **`instrumentation.ts`**: Next.js instrumentation setup

#### 1.3 Environment Configuration
Add to `.env.local` and production environment:
```bash
# Core Sentry Configuration
SENTRY_DSN=your_project_dsn_here
SENTRY_ENVIRONMENT=development|production
SENTRY_RELEASE=1.0.0

# Performance Monitoring Controls (Server-Side Only)
SENTRY_TRACES_SAMPLE_RATE=0.1          # 10% of server requests
SENTRY_PROFILES_SAMPLE_RATE=0.1        # 10% CPU profiling
SENTRY_ENABLE_MEMORY_PROFILING=false   # Memory profiling (dev only)

# Custom Performance Thresholds
SENTRY_SLOW_API_THRESHOLD=2000         # Alert on APIs >2s (ms)
SENTRY_SLOW_DB_THRESHOLD=500           # Alert on queries >500ms (ms)
SENTRY_ERROR_RATE_THRESHOLD=0.05       # Alert on error rates >5%

# Feature Flags
SENTRY_ENABLE_DB_PROFILING=true        # Database query tracing
SENTRY_ENABLE_EXTERNAL_CALLS=true      # External API monitoring
```

### Phase 2: Server-Side Instrumentation (High Priority)

#### 2.1 API Route Profiling
- Automatic tracing for all `app/api/*` routes
- Custom operation tags for categorization:
  - `video_management`: Video CRUD operations
  - `analytics`: Analytics processing
  - `metadata_extraction`: AI metadata operations
  - `bulk_operations`: Bulk processing

#### 2.2 Database Query Monitoring
- Drizzle ORM query instrumentation
- Slow query detection and alerting
- Query performance categorization
- Connection pooling insights

#### 2.3 External Service Calls
- AI API calls (OpenRouter) tracing
- Metadata scraping operation monitoring
- Cache operation performance
- Third-party service response times

#### 2.4 Analytics Worker Profiling
- Processing time measurement
- Performance bottleneck identification
- Memory usage tracking during aggregation

### Phase 3: Performance Monitoring & Alerts (Medium Priority)

#### 3.1 Custom Performance Metrics
- API response time distributions
- Database query performance patterns
- Error rate monitoring by endpoint
- Analytics processing performance

#### 3.2 Alert Configuration
- Slow API response alerts (>2s)
- High error rate alerts (>5%)
- Database performance degradation alerts
- Custom performance budget monitoring

#### 3.3 Performance Dashboards
- Sentry performance dashboard access
- Custom performance metrics visualization
- Trend analysis and anomaly detection

## Configuration Details

### Sentry Configuration Structure
```typescript
export const sentryConfig = {
  // Core settings
  dsn: process.env.SENTRY_DSN!,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: process.env.SENTRY_RELEASE || '1.0.0',

  // Sampling controls
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

  // Custom thresholds
  slowApiThreshold: parseInt(process.env.SENTRY_SLOW_API_THRESHOLD || '2000'),
  slowDbThreshold: parseInt(process.env.SENTRY_SLOW_DB_THRESHOLD || '500'),
  errorRateThreshold: parseFloat(process.env.SENTRY_ERROR_RATE_THRESHOLD || '0.05'),

  // Feature toggles
  enableDbProfiling: process.env.SENTRY_ENABLE_DB_PROFILING !== 'false',
  enableExternalCalls: process.env.SENTRY_ENABLE_EXTERNAL_CALLS !== 'false',
  enableMemoryProfiling: process.env.SENTRY_ENABLE_MEMORY_PROFILING === 'true',
}
```

### Server-Side Configuration
```javascript
Sentry.init({
  ...sentryConfig,

  integrations: [
    // Database operations
    sentryConfig.enableDbProfiling && Sentry.mongoIntegration(),
    sentryConfig.enableMemoryProfiling && Sentry.nodeProfilingIntegration(),

    // HTTP integrations
    Sentry.httpIntegration({ tracing: true }),
    Sentry.nativeNodeFetchIntegration(),
  ].filter(Boolean),

  // Performance filtering
  beforeSendTransaction(event) {
    // Filter fast transactions in production
    const duration = event.contexts?.trace?.data?.['duration']
    if (sentryConfig.environment === 'production' && duration && duration < 100) {
      return null
    }
    return event
  },
})
```

### Edge Runtime Configuration
```javascript
Sentry.init({
  ...sentryConfig,

  integrations: [
    Sentry.httpIntegration({ tracing: true }),
  ],

  // Edge-specific filtering
  beforeSend(event) {
    event.tags = { ...event.tags, runtime: 'edge' }
    return event
  },
})
```

## Environment-Specific Behavior

### Development Environment
```bash
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0          # 100% tracing for debugging
SENTRY_PROFILES_SAMPLE_RATE=0.5        # 50% profiling
SENTRY_ENABLE_MEMORY_PROFILING=true    # Memory tracking in dev
```

### Production Environment
```bash
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1          # 10% to stay within free tier
SENTRY_PROFILES_SAMPLE_RATE=0.05       # 5% profiling to reduce overhead
SENTRY_ENABLE_MEMORY_PROFILING=false   # Avoid production overhead
```

## Cost Management Strategy

### Free Tier Optimization (50K events/month)
- Configurable sampling rates per environment
- Feature flags to disable expensive profiling
- Production filtering to reduce noise
- Monthly usage monitoring

### Scaling Considerations
- Dynamic sampling based on system load
- Graduated sampling rates (dev: high, prod: low)
- Alert thresholds for cost monitoring

## Files to Create/Modify

### New Files
- `lib/config/sentry.ts` - Configuration management
- `sentry.server.config.js` - Server-side setup
- `sentry.edge.config.js` - Edge runtime setup
- `instrumentation.ts` - Next.js instrumentation

### Modified Files
- `package.json` - Add Sentry dependency
- Environment files - Add Sentry variables

## Success Metrics
- ✅ API routes automatically traced
- ✅ Database queries monitored
- ✅ External calls tracked
- ✅ Performance alerts configured
- ✅ Hotpaths identified
- ✅ Cost within free tier limits

## Next Steps After Implementation
- Monitor initial performance data
- Identify and optimize hotpaths
- Adjust sampling rates based on usage
- Configure additional alerts as needed

## Prerequisites
- Sentry account creation
- Project setup in Sentry dashboard
- DSN key generation
- Environment variable configuration

## Risk Mitigation
- Graceful degradation if Sentry unavailable
- Configurable overhead control
- Development vs production separation
- Free tier limit monitoring</content>
<parameter name="filePath">DOCS/PROPOSALS/SENTRY-SERVER-PROFILING-PLAN.md