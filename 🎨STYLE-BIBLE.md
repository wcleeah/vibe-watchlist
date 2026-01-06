# STYLE.md - Video Watchlist Styling Guidelines

## Overview

This document outlines the visual design system and styling guidelines established for the Video Watchlist application. The design takes inspiration from modern developer tools like grep.app, combining clean aesthetics with functional, technical appeal.

## Design Philosophy

- **Developer-Focused**: Typography and layouts that appeal to developers
- **Minimal & Clean**: Reduce visual clutter, focus on functionality
- **Grep.app Inspired**: Clean search interfaces with syntax-highlighted results
- **Responsive First**: Mobile-optimized with progressive enhancement
- **Accessible**: High contrast ratios, keyboard navigation, screen reader support

## Color Palette

### Primary Colors
- **Background**: `white` / `black` (light/dark themes)
- **Foreground**: `gray-900` / `gray-100` (high contrast text)
- **Muted Text**: `gray-600` / `gray-400` (secondary text)
- **Borders**: `gray-200` / `gray-800` (subtle separation)

### Accent Colors (Syntax Highlighting)
- **Keywords**: `purple-600` / `purple-400` (platform, title labels)
- **Strings**: `green-600` / `green-400` (quoted values)
- **URLs**: `yellow-600` / `yellow-400` (link values)
- **Functions**: `cyan-600` / `cyan-400` (action functions)

### Platform Colors
- **YouTube**: `red-500` (brand consistency)
- **Netflix**: `red-600` (brand consistency)
- **Nebula**: `purple-500` (brand consistency)
- **Twitch**: `purple-600` (brand consistency)

## Typography

### Font Stack
```css
/* Primary: Developer-focused monospace */
font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

/* Fallback: Clean sans-serif for UI elements */
font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
```

### Font Sizes & Weights
- **Headings**: `text-2xl` (24px), `font-semibold` (600)
- **Body**: `text-sm` (14px), `font-normal` (400)
- **Code**: `text-xs` (12px), `font-mono`, `leading-relaxed`
- **Labels**: `text-xs` (12px), `font-medium` (500)

### Text Hierarchy
1. **H1**: Page titles, major sections
2. **Body**: Primary content, form inputs
3. **Small**: Metadata, secondary information, labels

## Layout System

### Grid & Spacing
- **Container**: `max-w-6xl` (1152px) for main content
- **Grid**: `grid-cols-1 lg:grid-cols-5` for split layouts
- **Spacing**: `space-y-6`, `gap-8` for consistent vertical/horizontal spacing
- **Padding**: `p-4`, `p-6` for component internals

### Breakpoints
- **Mobile**: `< 768px` - Single column, stacked actions
- **Desktop**: `≥ 768px` - Split layouts, side actions
- **Responsive**: Progressive enhancement approach

## Component Patterns

### Navigation
```jsx
// Tab-based navigation with active states
<nav className="border-b border-gray-200 dark:border-gray-800 mb-8">
  <div className="flex space-x-8">
    <Link className="border-b-2 border-transparent hover:border-gray-300">
      Tab Content
    </Link>
  </div>
</nav>
```

### Cards & Containers
```jsx
// Clean containers with subtle borders
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">

// Code-result style with file headers
<div className="border-b border-gray-200 dark:border-gray-800">
  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900">
    <span>📁</span>
    <span>platform/title.mp4</span>
  </div>
</div>
```

### Syntax Highlighting
```jsx
// Pre-formatted code blocks for metadata
<pre className="text-xs font-mono leading-relaxed">
  <span className="text-purple-600">├── platform:</span>
  <span className="text-green-600">"youtube"</span>
</pre>
```

### Buttons & Actions
```jsx
// Function-style action buttons
<Button className="h-7 text-xs">
  <ExternalLink className="w-3 h-3 mr-1" />
  watch()
</Button>

// Ghost buttons for secondary actions
<Button variant="ghost" className="h-7 text-xs text-gray-600">
  markWatched()
</Button>
```

## Animation & Transitions

### Transition Classes
- **Layout Changes**: `transition-all duration-500 ease-in-out`
- **Hover States**: `transition-colors duration-200`
- **Loading States**: `animate-pulse` for skeleton screens

### Loading States
```jsx
// Skeleton loading
<div className="animate-pulse">
  <div className="bg-gray-200 dark:bg-gray-800 rounded h-32"></div>
</div>

// Spinner for actions
<Loader2 className="w-4 h-4 animate-spin" />
```

## Dark Mode Implementation

### Theme Variables
- **Automatic**: `class` strategy with `next-themes`
- **System Preference**: `enableSystem` for OS-based switching
- **Smooth Transitions**: `disableTransitionOnChange: false`

### Dark Mode Colors
```css
/* Consistent contrast ratios */
--background: black;
--foreground: white;
--muted: gray-800;
--border: gray-700;
```

## Responsive Design

### Mobile Optimizations
- **Single Column**: `grid-cols-1` for all content
- **Bottom Actions**: Move buttons to card bottom on mobile
- **Touch Targets**: Minimum 44px touch targets
- **Readable Text**: Maintain legibility on small screens

### Desktop Enhancements
- **Split Layouts**: Form + preview side-by-side
- **Hover States**: Enhanced interactivity
- **Keyboard Shortcuts**: Full keyboard navigation

## Icon Usage

### Icon Library: Lucide React
- **Navigation**: `VideoIcon`, `ListVideo`
- **Actions**: `ExternalLink`, `CheckCircle`, `Trash2`, `Copy`
- **UI**: `Moon`, `Sun`, `Loader2`, `Plus`
- **Platform**: `Youtube`, `Tv`, `Gamepad2`

### Icon Sizing
- **Large**: `w-6 h-6` (24px) for primary actions
- **Medium**: `w-4 h-4` (16px) for buttons
- **Small**: `w-3 h-3` (12px) for metadata

## Error Handling & States

### Error Messages
```jsx
<div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
  <p className="text-red-800 dark:text-red-200">Error message</p>
</div>
```

### Success States
```jsx
<div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
  <p className="text-green-800 dark:text-green-200">Success message</p>
</div>
```

## Performance Considerations

### Image Optimization
- **Next.js Image**: Automatic optimization and lazy loading
- **Sizes**: Explicit width/height for layout stability
- **Formats**: WebP/AVIF support for modern browsers

### Bundle Optimization
- **Dynamic Imports**: Lazy load heavy components
- **Font Loading**: Self-hosted fonts with display swap
- **CSS**: Tailwind purging for minimal bundle size

## Accessibility Guidelines

### Color Contrast
- **Primary Text**: 4.5:1 minimum ratio
- **Large Text**: 3:1 minimum ratio
- **UI Elements**: 3:1 minimum ratio

### Keyboard Navigation
- **Tab Order**: Logical navigation flow
- **Focus Indicators**: Visible focus rings
- **Shortcuts**: Common keyboard patterns

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Descriptive labels for complex UI
- **Alt Text**: Meaningful image descriptions

## Implementation Checklist

- [x] Color palette defined and consistent
- [x] Typography system established
- [x] Layout grid system implemented
- [x] Component patterns documented
- [x] Responsive breakpoints defined
- [x] Dark mode fully implemented
- [x] Animation guidelines established
- [x] Accessibility requirements met
- [x] Performance optimizations applied

## Maintenance

### Adding New Components
1. Reference existing patterns in this document
2. Use established color/timing variables
3. Test across light/dark themes
4. Ensure responsive behavior
5. Add accessibility features

### Updating Styles
1. Update this document first
2. Test across all breakpoints
3. Verify accessibility compliance
4. Check performance impact
5. Update component documentation

This style guide ensures consistency and maintainability as the application evolves, while maintaining the developer-focused aesthetic that makes the video watchlist feel like a premium tool.</content>
<parameter name="filePath">STYLE.md