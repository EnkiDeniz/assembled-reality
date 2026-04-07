# Lœgos IDE Object-Model Solution Brief

**Date:** April 6, 2026  
**Status:** Canonical desktop solution brief derived from the IDE object model  
**Reference:** [loegos-ide-object-model-v0.1.md](/Users/denizsengun/Projects/AR/docs/loegos-ide-object-model-v0.1.md)

## Summary

The desktop workspace should be redesigned from the object model outward, not from prior shell experiments inward.

The core rule is:

**The center pane shows the `Artifact`.**

Everything else serves that fact.

This solution keeps the existing runtime semantics, receipt flow, provenance model, and diagnostics logic. It only changes hierarchy and desktop surface ownership.

## Target Desktop IDE Anatomy

### Left rail = project tree

The left rail becomes the Box tree.

It shows:

- active `Box`
- `Artifact` as the primary editable file-equivalent object
- `Sources` as read-only reference files
- `Receipts` as build output
- compact runtime/build summary at the bottom

Rules:

- the `Artifact` is pinned or clearly elevated above other documents
- `Sources` remain read-only in tree posture
- `Receipts` are explicit output, not hidden behind generic actions
- runtime summary stays compact and never becomes hero UI

### Center = Artifact editor

The center pane becomes a continuous `Artifact` block stream.

It shows:

- the open `Artifact`
- block gutter
- block content
- inline diagnostics
- contextual actions only when focused or selected

Rules:

- content starts at the top
- no explanatory editor hero above the file
- no large concept cards above the file
- metadata moves into gutter, tabs, or compact header
- save behavior stays lightweight and separate from sealing

### Right rail = compiler / debugger

The right rail keeps the current structural direction and becomes stricter.

Order:

1. seal preflight
2. blocking contradictions
3. shape parse / shadow types
4. Operate
5. trust / depth / settlement
6. build output
7. Seven input

Rules:

- rail language stays inferential, not interpretive
- Seven sits under diagnostics, not beside authorship as an equal panel
- receipt output remains visually distinct from the editable file world

### Status layer = compact runtime

Runtime/build truth stays visible, but compressed.

It carries:

- settlement hex
- convergence
- trust floor
- blocker count
- commit readiness

Rules:

- compact strip or compact header cluster
- never a hero band
- never a replacement for the editor

## Locked Decisions

The following decisions are now fixed for the redesign:

- desktop default entry opens the `Artifact`
- `Box home` becomes a secondary overview surface
- the first meaningful object on screen is authored content
- shapes appear as types, not primary navigation destinations
- sources remain read-only references in the project tree
- receipts remain build output, never ordinary editable cards
- the desktop workspace should feel anatomy-first, not philosophy-first

## Keep / Compress / Remove / Replace Table

| Surface | Decision | New role |
|---|---|---|
| `SourceRail` | `Keep` | Refine into a true project tree with clear `Artifact`, `Sources`, `Receipts`, and compact runtime summary |
| `WorkspaceDiagnosticsRail` | `Keep` | Refine into the canonical compiler/debugger rail |
| `BoxHomeScreen` | `Compress` | Secondary overview surface reachable from the tree or Box menu, not default entry |
| `WorkspaceControlSurface` | `Compress` | Compact header/status/navigation strip; remove hero-level concept emphasis |
| `RootEditor` | `Replace` | Root editing becomes part of the main `Artifact` editor flow rather than a separate sheet-first experience |
| desktop shape navigation | `Remove` from default hero path | Recast as type grammar in gutter, block labels, diagnostics categories, and compact status |
| default status/runtime display | `Compress` | Persistent but quiet runtime/build status strip |
| current center-pane block rendering | `Replace` | Continuous editor-first block stream with gutter, inline diagnostics, and contextual actions |

## Surface-Specific Solution Notes

### `BoxHomeScreen`

New role:

- overview and orientation only

Rules:

- no longer the default authenticated desktop posture
- accessible from Box menu or tree
- used when the user explicitly wants overview, not when they are resuming work

### `WorkspaceControlSurface`

New role:

- compact file/status/header chrome

Rules:

- brand and Box identity can stay
- root/current-object status can stay in compact form
- shape nav as major control should be removed from the default editor-first reading
- utility actions stay, but subordinate to the open file

### `SourceRail`

New role:

- project tree

Rules:

- pin the `Artifact`
- group `Sources`
- group `Receipts`
- show compact runtime summary at bottom
- reduce calls to `Box home`

### `RootEditor`

New role:

- absorbed into the `Artifact` editing experience

Rules:

- no special modal-first posture in the default desktop path
- root content should behave like editable file content with structured semantics layered on top

### Center-pane block rendering

New role:

- the file itself

Rules:

- first visible authored block appears at the top
- gutter shows block number, shape tag, confirmation state, and lightweight diagnostics
- warnings appear inline/gutter style
- contextual actions appear on focus or selection
- asset/source context becomes a secondary side reference or compact file header detail, not a dominant preamble

## First-Pass Execution Brief

The first implementation pass should be structural and desktop-only.

### Ranked order

1. Make the `Artifact` the default desktop entry object.
2. Replace overview-first center content with a continuous `Artifact` block stream.
3. Move block metadata into gutter and inline annotations.
4. Remove or compress shape-first hero UI from the default workspace.
5. Keep and tighten the left project tree.
6. Keep and tighten the right diagnostics/build rail.
7. Demote `Box home` to a secondary overview surface.
8. Keep receipts clearly outside the editable file world.

### Success criteria

The first pass succeeds only if:

- a reviewer can instantly identify the file-equivalent object that is open
- the first meaningful thing on screen is authored content
- sources read as references, not peer editable objects
- diagnostics stay visibly beside the artifact
- sealing reads as commit, not save
- receipts read as build artifacts
- shapes remain present as types without becoming the default desktop navigation frame

## Explicit Non-Goals

This redesign pass should not:

- introduce new persisted object types
- change runtime semantics
- change route structure
- create a new primary navigation model based on shapes
- redesign mobile in parallel
- reinvent Operate, provenance, receipt, or formal-core logic

## Final Rule

When desktop workspace decisions are ambiguous, choose the option that makes the object model more legible:

- `Box` as repo
- `Artifact` as file
- `Source` as reference
- `Block` as line
- `Seven` as debugger
- `Operate + preflight` as compiler
- `Seal` as commit
- `Receipt` as build artifact

If a screen weakens that correspondence, it is the wrong screen.
