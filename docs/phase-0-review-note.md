# Phase 0 Review Note

## What I was asked to do

Implement the Phase 0 hardening plan for the current `Document Assembler` product:

- make receipts truthful and document-scoped
- make saves trustworthy with visible conflict handling
- make `Device` voice real browser-native playback
- tighten the intro and launch flow without pretending the project model already exists

This was explicitly framed as an additive hardening pass before the later project-model work.

## Plan documents

The main on-branch planning document for this review is:

- [docs/AR Version 2 Build Plan.md](./AR%20Version%202%20Build%20Plan.md)

The shipped Phase 0 status is documented in the Phase 0 section of that build plan.

For implementation review, this note is meant to stand on its own. It does not require any uncommitted product-direction docs.

## What I implemented

### 1. Receipt truthfulness

- Replaced session-wide receipt usage in the workspace with document-scoped logs.
- `Draft receipt` and `Export log` now use only the active document's log entries.
- Assembly creation now produces canonical assembly log entries on the server.
- Assembly receipts use assembly-specific logs plus block lineage, not unrelated session activity.
- Receipt UI copy now distinguishes:
  - local draft
  - pushed to GetReceipts

Primary files:

- [src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx)
- [src/lib/workspace-documents.js](../src/lib/workspace-documents.js)
- [src/app/api/workspace/assemble/route.js](../src/app/api/workspace/assemble/route.js)
- [src/app/api/workspace/document/route.js](../src/app/api/workspace/document/route.js)

### 2. Save confidence

- Added optimistic concurrency using `updatedAt` as the revision token.
- `PUT /api/workspace/document` now accepts `baseUpdatedAt`.
- Stale saves now return `409` with server document metadata instead of silently overwriting.
- Added document-level workspace states:
  - `saving`
  - `saved`
  - `conflict`
  - `error`
- Added reload-latest handling in the toolbar.
- Editing the actively playing block stops playback and clears stale playback state.

Primary files:

- [src/lib/workspace-documents.js](../src/lib/workspace-documents.js)
- [src/app/api/workspace/document/route.js](../src/app/api/workspace/document/route.js)
- [src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx)
- [src/app/globals.css](../src/app/globals.css)

### 3. Listening trust

- `Device` voice now uses browser `speechSynthesis`.
- Unsupported browser/device voice is filtered out of the selectable catalog.
- Cloud playback still routes through the server audio path.
- Provider labeling now reflects the actual provider in use.
- Block-by-block playback behavior was preserved across cloud and device voice:
  - play
  - pause
  - resume
  - prev
  - next
  - rate change

Primary files:

- [src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx)

### 4. Entry and startup polish

- Shortened the intro into a tighter 4-step flow:
  - source
  - inspect
  - assemble
  - receipt
- Rewrote intro/auth copy to be outcome-first.
- Rewrote launchpad copy around source material, assemblies, and proof.
- Added clearer import/loading states on launchpad and shelf.

Primary files:

- [src/components/IntroLanding.jsx](../src/components/IntroLanding.jsx)
- [src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx)
- [src/app/globals.css](../src/app/globals.css)

## Reviewer heads-up

These changes are still within Phase 0 scope, but three technical shifts are big enough that they are worth calling out directly:

- `src/components/WorkspaceShell.jsx` grew substantially in this pass and now carries more cross-cutting state than before. If the Phase 0 behavior is accepted, Phase 1 should likely extract some of this surface into smaller units.
- The playback lifecycle is no longer just `active` vs not active. It now tracks playback kind and paused state so cloud audio and browser-native device speech can share the same controls.
- `src/components/IntroLanding.jsx` moved from effect-driven hydration state to `useSyncExternalStore` for intro-seen state. That is a correctness change, not just copy polish.

## What I did not implement

These were intentionally left out of this pass:

- project model migration
- delete redesign
- new sharing surfaces beyond existing document and receipt export

## Validation

Checks run on shipped app code:

- exact eslint command that passed:

```bash
npx eslint src/components/WorkspaceShell.jsx src/components/IntroLanding.jsx src/app/api/workspace/ai/route.js src/app/api/workspace/document/route.js src/app/api/workspace/assemble/route.js src/lib/workspace-documents.js
```

- `npm run build`: passed

Build caveat:

- `npm run build` still emits the existing Turbopack/NFT warning involving `next.config.mjs` and `src/app/api/reader/evidence/route.js`, but the production build completes successfully.

Current caveat:

- repo-wide `npm run lint` still fails in untouched prototype files under [prototype](../prototype)
- follow-up decision still needed:
  - keep `prototype/` and exclude it from lint
  - clean it up to pass lint
  - remove it

## Best review focus

Please review these areas first:

1. Receipt scoping
   - quick repro:
     - open `/workspace`
     - use the built-in source as document A
     - import another source or create an assembly as document B
     - perform distinct actions in A and B
     - switch back to A and draft/export the receipt
   - verify that A does not include B-only actions
   - verify assembly receipts only contain assembly-specific history plus lineage
2. Save conflicts
   - quick repro:
     - open the same editable source or assembly in two tabs
     - save an edit in tab A
     - save a different edit in tab B without reloading
   - verify tab B shows a visible conflict instead of overwriting
   - verify `Load latest` feels safe and understandable
3. Device voice behavior
   - quick repro:
     - use a browser with `speechSynthesis` support
     - select `Device` in the player
     - play a block while watching the network panel
   - verify `Device` never calls `/api/seven/audio`
   - verify pause/resume/next/rate behavior feels consistent with cloud playback
4. First-session clarity
   - quick repro:
     - open an incognito window or clear `document-assembler:intro-complete-v1`
     - visit `/intro`
     - step through the intro, then continue into `/workspace`
   - verify the intro and launchpad explain the first move quickly enough

## Git pointer

Primary implementation review target:

- branch: `codex/mobile-reader-overhaul`
- commit: `6f591eb` - `Implement phase 0 workspace hardening`

This note is a follow-up review aid layered on top of that implementation commit. If you are reviewing the shipped Phase 0 code itself, anchor on `6f591eb`.
