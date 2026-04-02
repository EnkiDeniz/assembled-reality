# Reader V2 Reference Spec

Date: April 2, 2026

## Summary

This spec captures the v2 direction for the authenticated reading product after reviewing stronger reference patterns for reader, contents, and library flows.

The core shift is:

- `Library` should feel like the app.
- `Reader` should feel like the document.
- `Contents` and `Tools` should be sheets, not permanent bars.
- `Seven` should be the one privileged action.

## Product Modes

The product should operate in three clear modes:

1. `Library`
2. `Reader`
3. `Account`

`Library` is the app home.  
`Reader` is an immersive document mode.  
`Account` is secondary and should not live in primary reader chrome.

## Reader V2

### Principle

The reading surface should dominate. Persistent controls should be minimal. Most actions should be summoned only when needed.

### Mobile Reader

Top bar:

- `Back to Library`
- document title
- section or progress context

Persistent actions:

- one primary floating `Seven` action
- one secondary `Contents` or `Tools` trigger

Everything else should live in a sheet.

### Desktop Reader

Top bar:

- `Back to Library`
- document title
- active section
- progress
- optional `Contents`
- optional `Tools`

Desktop can expose slightly more navigation in the header, but it should still preserve the same IA as mobile.

### What Should Not Stay

- no permanent multi-button dock with every reader tool visible
- no second control band under the header
- no duplicated controls across header, floating actions, and sheets
- no account button in primary reader chrome

## Seven

`Seven` should be the one privileged action in the reader.

Rules:

- `Seven` stays persistent as a floating action
- it should feel visually more important than notebook, display, or bookmark
- it should open cleanly above the reading surface
- it should not compete with a second large control strip

## Reader Tools Sheet

The reader should use a summoned tools sheet rather than a persistent toolbar.

Recommended contents:

- `Search`
- `Listen`
- `Notebook`
- `Bookmark`
- `Display`
- `Account`

Recommended structure:

- document card at top
- current title and section
- quick actions first
- lower-priority settings below

The tools sheet should feel like a lightweight command sheet, not a settings panel.

## Contents V2

### Mobile

`Contents` should be a full-height bottom sheet.

Requirements:

- drag handle
- close affordance
- clear active section state
- `Back to current` action
- scrollable chapter list
- optional duration or read-time metadata
- tap jumps and closes

### Desktop

`Contents` should be a left-side panel or anchored sheet, not a full takeover unless the viewport is narrow.

### Contents Principle

`Contents` is document navigation, not admin UI.

It should feel like a chapter navigator:

- current position
- where to jump next
- how the document is structured

## Library V2

### Principle

`Library` should feel like the app shell and reading home, not a raw file browser.

### Header

- large page title
- search
- overflow

### Filters

Suggested high-level filters:

- `Continue`
- `Recent`
- `Collections`
- `Archive`

### Recommended Section Order

1. `Continue reading`
2. `Recent imports`
3. `Canonical collection`
4. `Your collections`
5. `Import actions`

### Not Recommended As The First Screen

- taxonomy-first browsing like `By type`
- storage-management-first layouts
- empty category architecture that delays reading choices

### App Navigation

Library can support richer app navigation than the reader, including a bottom navigation pattern if needed.

## Account

`Account` remains a separate route. It should be reachable from the library and from the reader tools sheet, but it should not appear as a primary reader action.

## Final IA

### Library

- search
- filters
- import
- continue reading
- collections
- archive

### Reader

- top bar with back, title, section, progress
- persistent `Seven`
- `Contents` sheet
- `Tools` sheet

### Account

- separate route
- secondary access

## Implementation Order

1. Replace the current reader dock with a sheet-driven reader model.
2. Promote `Seven` to the single persistent primary action.
3. Convert `Contents` into a mobile-first bottom sheet.
4. Move reader utilities into a single tools sheet.
5. Redesign `Library` as a reading home rather than a storage taxonomy.
6. Keep `Account` secondary and reachable through library or tools.

## Decision Standard

Any future reader UI should be judged against one question:

Does this make the document feel more central, or does it make the interface feel more operated?

If it makes the reader feel more operated, it belongs in a sheet, not in the permanent shell.
