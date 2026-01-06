# 🚀 AI-INTEGRATION-MANIFEST.md 
## Problem Statement 
Right now there are no ways for us to auto detect video metadata except for twitch and youtube, these two platform has official api we can make use of, but most of them do not.

## High Level Solution
We will make use of Google Custom Search API and Open Router to solve this exact problem, as follows:
- The user will paste the link as usual
- We "google" the link for the search result
- We get all the metadata from simply fetching the site for an html
- We then feed all of these information to an ai model via Open Router, and ask them to return a list of possible titles, thumbnails urls, platform and the confidence level
- We show all the options via a dropdown, allow the user to choose

## Details to be handled
- Parsing the result html -> how?
- Google custom search available tuning -> what is available?
- Prompt design
- We do not have a dropdown selection system in place for preview card, title, thumbnail, and platform should now be selectable
  - Platform should be saved into the db so for same domain we can maintain the same platform name

---

## 📋 Revised Implementation Plan (Based on Codebase Exploration)

### Phase 1: Enhanced AI Pipeline (Week 1-2)

#### 1.1 Upgrade AI Service Architecture
**Current State**: Basic AIService with isolated functions
**Changes Needed**:
- Integrate Metascraper for better HTML parsing
- Create unified metadata extraction pipeline
- Add confidence scoring and fallback logic
- Implement metadata caching in database

**New Service Structure**:
```
lib/services/
├── ai-metadata-service.ts      # NEW: Main orchestration service
├── google-search-service.ts    # NEW: Enhanced Google Custom Search client
├── openrouter-service.ts       # NEW: Expanded AI analysis client
├── html-scraper-service.ts     # NEW: Metascraper wrapper
└── platform-mapping-service.ts # NEW: Domain-to-platform persistence
```

#### 1.2 Database Schema Extensions
**Current State**: `platformConfigs` table exists but unused
**Additions Needed**:
```sql
-- Platform domain mappings (builds on existing platformConfigs)
ALTER TABLE platform_configs ADD COLUMN domain VARCHAR(255) UNIQUE;
CREATE INDEX idx_platform_configs_domain ON platform_configs(domain);

-- AI metadata cache
CREATE TABLE ai_metadata_cache (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  search_results JSONB,
  html_content TEXT,
  ai_analysis JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

-- Metadata suggestions tracking
CREATE TABLE metadata_suggestions (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  suggestions JSONB NOT NULL, -- Array of {title, thumbnail_url, platform, confidence}
  selected_index INTEGER,
  user_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 2: Metadata Selection UI (Week 3-4)

#### 2.1 Create Metadata Selector Components
**Current State**: Manual mode exists but no AI suggestions UI
**New Components Needed**:
```
components/video-form/
├── metadata-selector.tsx       # NEW: Main dropdown component
├── metadata-option.tsx         # NEW: Individual suggestion display
├── confidence-indicator.tsx    # NEW: Visual confidence meter
├── platform-badge.tsx          # NEW: Platform identification

components/video-preview/
├── metadata-suggestions.tsx    # NEW: Alternative to manual mode
```

**UI Flow Changes**:
1. User pastes URL → Show loading state
2. Fetch basic metadata → Show initial preview
3. Run AI analysis → Show dropdown with suggestions
4. User selects option or enters manual data
5. Create video with selected metadata

#### 2.2 Integrate with Existing Form Layout
**Current State**: `FormLayout` component handles URL input and tags
**Changes Needed**:
- Add metadata preview section between URL and tags
- Replace simple manual mode with AI-powered selection
- Maintain existing tag functionality

### Phase 3: Enhanced Backend APIs (Week 5-6)

#### 3.1 Upgrade Metadata API
**Current State**: `/api/metadata` returns single metadata object
**New Endpoint Structure**:
```
POST /api/metadata/extract     # Enhanced extraction with AI analysis
GET  /api/platforms/domains    # Platform mapping lookup
POST /api/platforms/map        # Update platform mappings
GET  /api/metadata/suggestions/:url  # Get cached AI suggestions
POST /api/metadata/feedback    # Track user selections
```

**Response Format Change**:
```typescript
// Current: single metadata object
{ success: true, metadata: { title, thumbnailUrl } }

// New: AI suggestions array
{
  success: true,
  suggestions: [
    { title: "...", thumbnailUrl: "...", platform: "...", confidence: 0.95 },
    { title: "...", thumbnailUrl: "...", platform: "...", confidence: 0.85 }
  ],
  fallback: { title, thumbnailUrl } // Basic extraction
}
```

#### 3.2 AI Pipeline Orchestration
**Enhanced Flow**:
1. **Input**: URL from user
2. **Platform Detection**: Use existing + AI-enhanced detection
3. **Search Phase**: Query Google Custom Search with smart queries
4. **Fetch Phase**: Get HTML content with proper headers
5. **Extract Phase**: Metascraper + OpenGraph parsing
6. **AI Analysis**: Send combined data to OpenRouter for suggestions
7. **Cache**: Store results in database
8. **Return**: Structured suggestions with confidence scores

### Phase 4: Platform Intelligence (Week 7-8)

#### 4.1 Domain Learning System
**Current State**: Static platform detection
**New Features**:
- Learn platform patterns from user selections
- Store domain-to-platform mappings in database
- Improve detection accuracy over time
- Support custom platform addition

#### 4.2 Confidence-Based Fallbacks
**Fallback Hierarchy**:
1. **High Confidence AI** (0.9+): Auto-select best suggestion
2. **Medium Confidence AI** (0.7-0.9): Show dropdown, highlight best
3. **Low Confidence AI** (0.3-0.7): Show all options equally
4. **No AI Available**: Use basic HTML extraction
5. **Extraction Failed**: Manual input mode

## 🔧 Technical Adjustments

### Dependencies to Add
```json
{
  "metascraper": "^5.14.0",
  "metascraper-title": "^5.14.0",
  "metascraper-description": "^5.14.0",
  "metascraper-image": "^5.14.0",
  "cheerio": "^1.0.0", // Alternative HTML parser
  "got": "^11.8.5"     // Better HTTP client
}
```

### Environment Variables (Additional)
```env
# Already exists
OPENROUTER_API_KEY=your_key

# New additions
GOOGLE_SEARCH_API_KEY=your_key
GOOGLE_SEARCH_ENGINE_ID=your_engine_id
METADATA_CACHE_TTL=604800000  # 7 days in ms
AI_ANALYSIS_TIMEOUT=15000     # 15 seconds
```

## 📊 Updated Cost Analysis

### Enhanced Monthly Estimates
- **Google Custom Search**: $25/month (5,000 queries for AI analysis)
- **OpenRouter**: $25-75/month (more intensive AI analysis)
- **Total**: $50-100/month (vs. original $25-65 estimate)

### Caching Benefits
- **Database Caching**: Reduces API calls by 60-80%
- **Browser Caching**: Instant results for repeated URLs
- **Platform Learning**: Better accuracy reduces manual corrections

## 🚀 Implementation Priority

### Immediate Changes (Week 1):
1. Create AI metadata service orchestration
2. Add database schema for caching and mappings
3. Implement Metascraper HTML parsing

### UI Integration (Week 2):
1. Build metadata selector dropdown component
2. Integrate with existing form layout
3. Update preview card to show AI suggestions

### Enhancement Phase (Week 3-4):
1. Add platform learning system
2. Implement confidence-based UX flows
3. Add analytics for AI performance tracking

This revised plan leverages the existing solid foundation while focusing on the missing UI and enhanced AI integration pieces. The core AI services are already there - we just need to connect them properly and build the user selection interface.
