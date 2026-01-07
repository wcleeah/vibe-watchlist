# Settings Management Implementation Plan

## Problem Statement
I need a central page to manage all application settings, configurations, cache, and platform management with a clean, developer-focused interface.

## High Level Requirements
- **Central Settings Page**: Single location for all configuration management
- **Cache Management**: View, invalidate, and manage cached metadata entries
- **Platform Management**: Add, rename, edit, and manage video platforms dynamically
- **Tags Integration**: Move existing tag management into settings tabs
- **Multi-Tab Navigation**: Organized settings by category
- **Mobile Responsive**: Optimized for all screen sizes

## Implementation Status
- [x] Phase 1: Foundation Setup (1-2 hours) - ✅ COMPLETED
- [x] Phase 2: Cache Management (2-3 hours) - ✅ COMPLETED
- [x] Phase 3: Platform Management (3-4 hours) - ✅ COMPLETED
- [x] Phase 4: Tags Integration (1-2 hours) - ✅ COMPLETED
- [x] Phase 5: Polish & Mobile (2-3 hours) - ✅ COMPLETED
- [x] Phase 6: Dynamic Platform Loading (3-4 hours) - ✅ COMPLETED
- [ ] Phase 7: Platform Discovery (3-5 hours) - 🔄 UPCOMING
- [ ] Phase 8: Testing Suite (15-20 hours) - 📋 FUTURE

---

## Detailed Implementation Plan

### Phase 1: Foundation Setup (1-2 hours)
**Goal:** Create the basic settings page structure with tab navigation.

#### 1.1 Create Settings Page Structure
```typescript
// app/settings/page.tsx
- Basic page layout with header and navigation
- Tab navigation component for different settings categories
- Placeholder content areas for each tab
- Consistent with existing page layouts and styling
```

#### 1.2 Add Navigation Integration
```typescript
// Update components/navigation-tabs.tsx
- Add "Settings" tab with Settings icon from Lucide React
- Position appropriately in navigation hierarchy
- Ensure responsive behavior on mobile
```

#### 1.3 Create Tabs Component
```typescript
// components/ui/tabs.tsx (minimal implementation)
- Simple button-based tab switching
- Clean, developer-focused styling
- Mobile-responsive with stacked layout on small screens
- Follow STYLE-BIBLE.md color palette and typography
```

---

### Phase 2: Cache Management (2-3 hours)
**Goal:** Implement cache viewing and management functionality.

#### 2.1 Cache Statistics Component
```typescript
// components/settings/cache-stats.tsx
- Display total cached entries count
- Show cache size estimation
- Indicate number of expired entries
- Last cleanup timestamp
- Real-time refresh capability
```

#### 2.2 Cache Entries Table
```typescript
// components/settings/cache-entries.tsx
- Paginated table of cached URL entries
- Columns: URL, Created Date, Expires Date, Confidence Score
- Search/filter functionality
- Individual entry deletion
- Bulk operations support
```

#### 2.3 Cache Actions Component
```typescript
// components/settings/cache-actions.tsx
- "Clear Expired" button with confirmation
- "Clear All Cache" button with confirmation
- Refresh statistics button
- Loading states and progress indicators
```

#### 2.4 Cache API Routes
```typescript
// app/api/cache/route.ts
- GET: Return paginated cache entries and statistics
- DELETE: Clear expired cache entries
- DELETE with ?all=true: Clear all cache entries

// app/api/cache/stats/route.ts
- GET: Return cache statistics only
- Optimized for dashboard widgets
```

---

### Phase 3: Platform Management (3-4 hours)
**Goal:** Build comprehensive platform configuration management.

#### 3.1 Platform List Component
```typescript
// components/settings/platform-list.tsx
- Display all platform configurations in a clean table
- Show: Name, Patterns, Icon, Color, Enabled status, Confidence
- Filter by enabled/disabled status
- Edit and delete buttons (with restrictions for preset platforms)
- Add new platform button
```

#### 3.2 Platform Form Component
```typescript
// components/settings/platform-form.tsx
- Modal/drawer form for adding new platforms
- Edit form for existing platforms
- Fields: platformId, name, displayName, patterns array, color, icon
- Pattern validation with regex testing
- Color picker and icon selector
- Confidence score input
- Form validation and error handling
```

#### 3.3 Platform Testing Component
```typescript
// components/settings/platform-test.tsx
- URL input field for testing platform matching
- Real-time pattern testing against entered URL
- Show which platform matches and confidence score
- Debug information for pattern matching
- Copy pattern examples
```

#### 3.4 Enhanced Platform API Routes
```typescript
// app/api/platforms/[id]/route.ts
- GET: Fetch single platform configuration
- PUT: Update platform configuration
- DELETE: Delete user-added platforms (protect presets)

// app/api/platforms/test/route.ts
- POST: Test URL against platform patterns
- Return matching platform and confidence
```

---

### Phase 4: Tags Integration (1-2 hours)
**Goal:** Move existing tags functionality into the settings page.

#### 4.1 Extract Tags Component
```typescript
// components/settings/tags-manager.tsx
- Copy existing tags CRUD functionality from /tags page
- Adapt for settings tab layout
- Maintain all existing features: add, edit, delete, color picker
- Consistent styling with settings page design
```

#### 4.2 Update Navigation
```typescript
// components/navigation-tabs.tsx
- Remove standalone Tags link
- Settings tab now encompasses tags management
- Maintain backward compatibility if needed
```

---

### Phase 5: Polish & Mobile Responsiveness (2-3 hours)
**Goal:** Ensure professional polish and mobile compatibility.

#### 5.1 Mobile Responsiveness
```typescript
// Update all components for mobile optimization
- Stack tabs vertically on mobile devices
- Optimize table layouts for small screens
- Ensure touch targets meet 44px minimum
- Progressive enhancement approach
- Test on various device sizes
```

#### 5.2 UI Polish & Consistency
```typescript
// Follow STYLE-BIBLE.md guidelines
- Consistent color palette usage
- Proper typography hierarchy
- Clean component spacing and layout
- Loading states and error handling
- Toast notifications for user feedback
```

#### 5.3 Accessibility & Performance
```typescript
// Ensure production readiness
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels for complex components
- Component lazy loading for performance
- Bundle size optimization
```

---

### Phase 6: Dynamic Platform Loading (3-4 hours)
**Goal:** Replace hardcoded platform references with dynamic loading.

#### 6.1 Create Platform Service
```typescript
// lib/services/platform-service.ts
export class PlatformService {
  // Cache platforms for performance with TTL
  private static cache: PlatformConfig[] | null = null;
  private static cacheExpiry = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getPlatforms(): Promise<PlatformConfig[]> {
    // Return cached platforms if valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    // Fetch from API and cache
    const response = await fetch('/api/platforms');
    if (response.ok) {
      const data = await response.json();
      this.cache = data;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      return data;
    }

    return [];
  }

  static async getPlatformMap(): Promise<Record<string, PlatformConfig>> {
    const platforms = await this.getPlatforms();
    return platforms.reduce((map, p) => {
      map[p.platformId] = p;
      return map;
    }, {} as Record<string, PlatformConfig>);
  }
}
```

#### 6.2 Update Page Components
**Replace hardcoded arrays in `app/watched/page.tsx` and `app/list/page.tsx`:**
```typescript
// Before (hardcoded)
const platforms = [
  { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'hover:bg-red-50...' },
  { key: 'nebula', label: 'Nebula', icon: Gamepad2, color: 'hover:bg-purple-50...' },
];

// After (dynamic)
const [platforms, setPlatforms] = useState<Platform[]>([]);

useEffect(() => {
  const loadPlatforms = async () => {
    const platformConfigs = await PlatformService.getPlatforms();
    const platformList = platformConfigs
      .filter(p => p.enabled)
      .map(config => ({
        key: config.platformId,
        label: config.displayName,
        icon: getIconComponent(config.icon),
        color: `hover:${config.color}50`,
      }));
    setPlatforms(platformList);
  };
  loadPlatforms();
}, []);
```

#### 6.3 Update Platform Components
**Modify `components/platform/index.tsx`:**
```typescript
// Replace hardcoded mappings with dynamic lookup
export function PlatformIcon({ platform, size = 'md', className }: PlatformIconProps) {
  const [iconMap, setIconMap] = useState<Record<string, React.ComponentType>>({});

  useEffect(() => {
    const loadIcons = async () => {
      const platforms = await PlatformService.getPlatforms();
      const map = platforms.reduce((acc, p) => {
        acc[p.platformId] = getIconComponent(p.icon);
        return acc;
      }, {} as Record<string, React.ComponentType>);
      setIconMap(map);
    };
    loadIcons();
  }, []);

  const IconComponent = iconMap[platform] || Globe;
  // ... rest of component
}
```

#### 6.4 Update AI Service
**Modify `lib/services/ai-service.ts`:**
```typescript
// Replace hardcoded enum with dynamic platform list
async function getDynamicPlatformList(): Promise<string[]> {
  try {
    const platforms = await PlatformService.getPlatforms();
    return platforms.map(p => p.platformId);
  } catch {
    // Fallback to hardcoded list
    return ["youtube", "twitch", "netflix", "nebula", "vimeo", "dailymotion", "bilibili", "unknown"];
  }
}

const platformSuggestionSchema = {
  // ...
  platform: {
    type: "string",
    enum: await getDynamicPlatformList(),
  },
  // ...
};
```

#### 6.5 Update Validation Services
**Replace hardcoded arrays in validation services:**
```typescript
// Before
const validPlatforms: VideoPlatform[] = ['youtube', 'netflix', 'nebula', 'twitch'];

// After
const validPlatforms = await PlatformService.getPlatforms()
  .then(platforms => platforms.map(p => p.platformId));
```

---

### Phase 7: Platform Discovery (3-5 hours)
**Goal:** Enable AI-powered platform detection and addition for unknown URLs.

#### 7.1 AI Platform Detection Integration
```typescript
// Integrate existing AIService.detectPlatform() into URL validation flow
// components/settings/platform-discovery.tsx
- Detect platforms for unknown URLs using AI
- Show platform suggestions with confidence scores
- Allow users to accept/reject suggestions
- One-click platform addition to database

// Update hooks/use-url-validation.ts
- Add AI platform detection for unknown URLs
- Return platform suggestions alongside validation results
- Integrate with existing form validation flow
```

#### 7.2 Platform Suggestion UI
```typescript
// components/video-form/platform-suggestions.tsx
- Display AI-detected platform suggestions
- Show confidence scores and platform details
- Accept/Reject buttons with loading states
- Preview of platform configuration (color, icon, patterns)

// components/video-form/platform-creator.tsx
- Quick platform creation form for user-defined platforms
- Pattern testing interface
- Color and icon selection
- Save to platformConfigs table
```

#### 7.3 Enhanced URL Parser
```typescript
// lib/utils/url-parser.ts - Complete dynamic loading
- Remove hardcoded platform references
- Use PlatformService for pattern matching
- Support runtime platform addition
- Fallback to AI detection for unknown URLs

// Update lib/services/platform-service.ts
- Add platform creation methods
- Pattern validation utilities
- AI integration for platform suggestions
```

#### 7.4 Platform Addition Workflow
```typescript
// app/api/platforms/discover/route.ts
- POST: AI platform detection endpoint
- Analyze URL and return platform suggestions
- Validate patterns and generate confidence scores

// app/api/platforms/create/route.ts
- POST: Create new platform from user input
- Validate platform configuration
- Prevent duplicate platform IDs
- Return created platform data
```

#### 7.5 User Experience Integration
```typescript
// Update video addition flow
- For unknown URLs: Show "Platform not recognized" with discovery options
- AI-powered suggestions appear automatically
- Quick platform creation for custom video sources
- Seamless integration with existing form validation
```

---

## Technical Architecture

### Database Schema
- **No changes needed**: Uses existing `aiMetadataCache`, `platformConfigs`, `tags` tables
- **Platform configs** table already supports dynamic platform management

### API Design
- **RESTful endpoints** for all operations
- **Consistent error handling** with proper HTTP status codes
- **JSON responses** with success/error structure
- **Pagination support** for large datasets

### State Management
- **Client-side state** for form data and UI interactions
- **Server state** via API calls for persisted data
- **Optimistic updates** for better user experience

### Performance Optimizations
- **Platform caching** with 5-minute TTL
- **Lazy loading** for heavy components
- **Pagination** for cache entries and platform lists
- **Debounced search** for filtering operations

---

## Style Guidelines (Following STYLE-BIBLE.md)

### Color Palette
- **Background**: `white` / `black` for light/dark themes
- **Foreground**: `gray-900` / `gray-100` for high contrast text
- **Borders**: `gray-200` / `gray-800` for subtle separation
- **Platform Colors**: Dynamic from platformConfigs table

### Typography
- **Headings**: `text-2xl`, `font-semibold` for major sections
- **Body**: `text-sm`, `font-normal` for content
- **Code**: `text-xs`, `font-mono` for metadata display
- **Labels**: `text-xs`, `font-medium` for form elements

### Layout System
- **Container**: `max-w-6xl` for main content
- **Grid**: Responsive grid layouts
- **Spacing**: `space-y-6`, `gap-8` for consistent spacing
- **Mobile First**: Progressive enhancement approach

### Component Patterns
- **Cards**: `bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg`
- **Buttons**: Function-style with icons: `watch()`, `edit()`, `delete()`
- **Tables**: Clean data presentation with proper spacing
- **Forms**: Consistent input styling with labels

---

## Development Workflow

### Git Strategy
- **Branch**: `feature/settings-page`
- **Commits**: Frequent commits with descriptive messages
- **Progress Updates**: Update this document after each phase completion

### Testing Strategy
- **Unit Tests**: Component functionality and API endpoints
- **Integration Tests**: End-to-end settings workflows
- **Responsive Testing**: Mobile and desktop layouts
- **Accessibility**: Keyboard navigation and screen reader support

### Quality Assurance
- **Code Style**: Follow STYLE-BIBLE.md guidelines
- **Performance**: Monitor bundle size and load times
- **Browser Testing**: Chrome, Firefox, Safari compatibility
- **Error Handling**: Comprehensive error states and recovery

---

## Success Criteria

### Phase 1-6 (Settings Management Core)
- [x] **Functional Requirements**: All settings management features working
- [x] **User Experience**: Clean, intuitive interface following design system
- [x] **Performance**: Fast loading and responsive interactions
- [x] **Mobile Compatibility**: Works seamlessly on all device sizes
- [x] **Maintainability**: Well-structured, documented code
- [x] **Extensibility**: Easy to add new settings categories

### Phase 7 (Platform Discovery)
- [ ] **AI Platform Detection**: Unknown URLs trigger platform discovery automatically
- [ ] **Platform Suggestions**: Users see AI-generated platform suggestions with confidence scores
- [ ] **One-Click Addition**: Users can save detected platforms with minimal friction
- [ ] **Dynamic URL Parser**: No hardcoded platform references remain
- [ ] **Fallback Handling**: Graceful degradation when AI services unavailable

### Phase 8 (Testing Suite)
- [ ] **Test Infrastructure**: Vitest + Playwright configured and running
- [ ] **Unit Test Coverage**: 80%+ coverage for core services and utilities
- [ ] **Integration Tests**: All API routes and service interactions tested
- [ ] **E2E Test Coverage**: Critical user workflows automated
- [ ] **CI/CD Integration**: Tests run automatically on commits
- [ ] **Performance Benchmarks**: Metadata extraction times monitored

---

### Phase 8: Testing Suite (15-20 hours)
**Goal:** Set up comprehensive testing infrastructure for reliability and maintainability.

#### 8.1 Testing Framework Setup
```typescript
// Install and configure testing stack
- Vitest for unit testing framework
- @testing-library/react for component testing
- @testing-library/jest-dom for DOM assertions
- Playwright for E2E testing
- Test scripts in package.json: yarn test, yarn test:e2e
```

#### 8.2 Unit Tests
```typescript
// Core service testing
- lib/utils/url-parser.ts - Platform detection accuracy
- lib/services/ai-service.ts - AI API integration
- lib/services/platform-service.ts - Dynamic platform loading
- lib/services/metascraper-service.ts - HTML parsing

// Component testing
- components/video-form/ - Form validation and submission
- components/settings/ - Settings management workflows
- components/platform/ - Dynamic platform rendering
```

#### 8.3 Integration Tests
```typescript
// API endpoint testing
- /api/videos - CRUD operations and filtering
- /api/platforms - Platform management
- /api/cache - Cache operations
- Database integration and error handling

// Service integration
- PlatformService with database operations
- AIMetadataService full pipeline
- VideoService business logic
```

#### 8.4 End-to-End Tests
```typescript
// Critical user workflows
- Adding videos with URL validation
- Platform discovery and addition
- Settings management (cache, platforms, tags)
- Filtering and searching videos
- Mobile responsiveness testing
```

#### 8.5 CI/CD Integration
```typescript
// GitHub Actions workflow
- Run tests on every push/PR
- Test coverage reporting
- E2E tests in headless browser
- Performance regression detection
```

---

## Timeline Estimate: 32-43 hours total
- **Phase 1**: 1-2 hours (Foundation) ✅
- **Phase 2**: 2-3 hours (Cache Management) ✅
- **Phase 3**: 3-4 hours (Platform Management) ✅
- **Phase 4**: 1-2 hours (Tags Integration) ✅
- **Phase 5**: 2-3 hours (Polish & Mobile) ✅
- **Phase 6**: 3-4 hours (Dynamic Platform Loading) ✅
- **Phase 7**: 3-5 hours (Platform Discovery)
- **Phase 8**: 15-20 hours (Testing Suite)

*Note: Timeline includes testing, debugging, and refinements. Actual time may vary based on complexity discovered during implementation.*
