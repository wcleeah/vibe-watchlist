# Playlist Tag Support Implementation Plan

## Overview
Enable tag support for playlists - both when importing new playlists and when editing existing playlists.

## Tasks

### 1. Enable Tags in Playlist Import Form
- [ ] **File:** `components/video-form/form-layout.tsx`
  - Remove `mode !== 'playlist'` condition to show `TagInput` for all modes
  - Pass `tagIds` to playlist import API call in `handlePlaylistImport()`

### 2. Update Playlist Import API to Accept Tags
- [ ] **File:** `app/api/playlists/route.ts`
  - Accept `tagIds` array in POST request body
  - Insert playlist tags after creating the playlist

### 3. Create Playlist Edit Modal
- [ ] **New File:** `components/playlists/playlist-edit-modal.tsx`
  - Similar structure to `VideoEditModal`
  - Allow editing title and tags
  - Use existing `PATCH /api/playlists/[id]` endpoint

### 4. Add Edit Action to PlaylistCard
- [ ] **File:** `components/playlists/playlist-card.tsx`
  - Add `onEdit` prop
  - Add `edit()` action to `secondaryActions` (more() button pattern)
  - Pass `secondaryActions` to `MediaCard`

### 5. Update PlaylistList Component
- [ ] **File:** `components/playlists/playlist-list.tsx`
  - Add `onEdit` prop
  - Pass it down to `PlaylistCard`

### 6. Wire Up Edit Modal in Playlists Page
- [ ] **File:** `app/playlists/page.tsx`
  - Import `PlaylistEditModal`
  - Add state for edit modal
  - Add `handleEdit` handler
  - Pass `onEdit` prop to `PlaylistList`
  - Render `PlaylistEditModal` component

## Progress
- Started: 2026-02-01
- Branch: `feature/playlist-tag-support`
