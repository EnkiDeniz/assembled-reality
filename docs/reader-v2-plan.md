# Assembled Reality Reader v2

This document captures an older local-first marks plan. The current product is a multi-user, server-backed reader with open sign-in on `/`, an authenticated reader app on `/read`, and an account surface on `/account`.

## Goal

Extend the locked reader with personal reading tools:
- bookmarks
- highlights
- notes attached to selections
- a side panel for reviewing saved marks

This phase is local-only and reader-only. It does not add collaboration, sharing, or backend sync.

## Core Model

Do not make every sentence an object.

Anchor reading marks to:
- `sectionSlug`
- `blockId`
- `startOffset`
- `endOffset`
- `quote`

For notes, also store:
- `noteText`

For bookmarks, store:
- `sectionSlug`
- `label`
- optional excerpt

## Scope

### In
- personal bookmarks
- personal highlights
- personal notes
- local persistence in `localStorage`
- inline highlight rendering
- marks review panel
- jump-to-source behavior

### Out
- shared annotations
- replies / threads
- backend sync
- export
- sentence-level modeling

## UX

### Top bar
- contents
- current title / section context
- bookmark toggle
- marks panel
- appearance

### Selection
Selecting text inside a single block should show a floating menu with:
- `Highlight`
- `Add note`

Selections across multiple blocks should not create marks.

### Marks panel
Desktop:
- right-side slide-over

Mobile:
- bottom sheet / full-height sheet

Sections:
- bookmarks
- highlights
- notes

Each item should:
- show section reference
- show excerpt
- jump back to the source passage

## Implementation

### Data / utilities
- `src/lib/annotations.js`
- `src/lib/selection.js`

### UI
- extend `ReaderShell.jsx`
- extend `MarkdownRenderer.jsx`
- add `SelectionMenu.jsx`
- add `ReaderMarksPanel.jsx`

### Persistence
- one new `localStorage` key for reader marks

## Test Focus

- create bookmark / highlight / note
- refresh and verify persistence
- jump from saved marks back into the document
- confirm highlights render correctly after reload
- confirm existing sign-in and reader behavior still works
