# Implementation Guide

Date: April 6, 2026
Purpose: Map the language spec to the current codebase and define the build path.

## The strategic position

The backend is done. The trust rules are enforced. The language is defined. The remaining work is rendering.

This guide tells you what to build, in what order, and what existing infrastructure to reuse.

## What already exists

### Backend (complete, no changes needed)

| Component | Status | Location |
|---|---|---|
| Operate overlay route (GET/POST) | Done | `src/app/api/workspace/operate/route.js` |
| Override CRUD route | Done | `src/app/api/workspace/operate/overrides/route.js` |
| Receipt seal route with override acknowledgment | Done | `src/app/api/workspace/receipt/route.js` |
| Fail-closed AI (503 when unavailable) | Done | `src/app/api/workspace/ai/route.js` |
| Operate run persistence | Done | `ReaderOperateRun` in schema |
| Override persistence with excerpt snapshot | Done | `ReaderAttestedOverride` in schema |
| Source fingerprinting and stale detection | Done | `src/lib/operate-overlay.js` |
| Evidence-enforced trust downgrades | Done | `buildEvidenceEnforcedFinding` in operate-overlay |
| Coverage truth (truncation disclosure) | Done | `buildOperateOverlayCoverage` in operate-overlay |
| Deterministic finding selection | Done | `pickPreferredOperateFindingId` in operate-overlay |
| Override merge with active/stale/orphaned status | Done | `mergeOperateOverlayWithOverrides` in operate-overlay |
| Source intake (upload, paste, link, image, audio) | Done | `src/lib/source-intake.js` and siblings |
| Document persistence and block model | Done | Prisma schema, reader-documents, workspace-documents |
| Auth, session, profile | Done | auth.js, server-session.js |

### Controllers (extracted, reusable)

| Controller | What it encapsulates | Location |
|---|---|---|
| `useOperateOverlayController` | Load, run, sync, override CRUD, finding selection, request ordering | `src/components/workspace/useOperateOverlayController.js` |
| `useReceiptSealController` | Seal dialog, audit polling, override acknowledgment, seal submission | `src/components/workspace/useReceiptSealController.js` |

### Design system (reusable)

| Component | What it does | Location |
|---|---|---|
| `SignalChip` | Renders a colored chip with tone | `src/components/LoegosSystem.jsx` |
| `ShapeGlyph` | Renders a shape glyph | `src/components/LoegosSystem.jsx` |
| Design tokens | Colors, spacing, radius, typography | `src/lib/design-tokens.js`, `src/app/styles/tokens.css` |

### Existing rendering (to be replaced, not reused)

| Component | What it does | Why it doesn't fit |
|---|---|---|
| `WorkspaceDocumentWorkbench` | Renders blocks as cards with inline findings | Blocks are heavy cards, not text-first |
| `WorkspaceOperateOverlayRail` | Renders findings in a side rail | Analysis beside text, not on text |
| `WorkspaceDiagnosticsRail` | Full diagnostics panel | Dashboard, not language rendering |
| `WorkspaceShell` | 12.5k-line orchestration shell | Everything-at-once, not single-buffer |

## What to build

### The renderer

The core new component is a Loegos text renderer that takes blocks + findings + overrides and renders them as typed, colored, weighted text in a single buffer.

**Input:**
- `blocks[]` — the document's block model (id, text, kind, position)
- `findings[]` — from `useOperateOverlayController` (signal, displaySignal, trustLevel, rationale, evidence, spans, overrides)
- `overrides[]` — from the merged overlay payload (active/stale/orphaned status)
- `seedState` — derived summary (aim/here/gap/sealed/next)

**Output:**
- A rendered text surface where each block carries:
  - Shape glyph prefix (△ □ œ 𒐛) inline with the text
  - Signal color on the text characters (green/amber/red/neutral/attested)
  - Accessibility left-rule pattern (solid/dashed/dotted/none/dash-dot)
  - Weight variation (light/normal/strong via font-weight and letter-spacing)
  - Inline annotation below the block (⚠ warning, ✓ clear) — secondary, not primary
- Click/tap a block → opens explainability panel (side panel on desktop, bottom sheet on mobile)
- Seed state summary at the bottom

**What it does NOT render:**
- Source tree
- Project management
- Receipt inventory
- Compiler dashboard
- Assembly lane
- Mode selectors

### The explainability panel

Replaces the current diagnostics rail for the language rendering context. Opens when a block is selected.

**Shows:**
- Signal rationale (why this color)
- Shape rationale (why this type)
- Trust chain (provenance)
- Evidence excerpts (specific source passages)
- What would change the signal
- Override state (if attested, shows the note and underlying machine read)

**Reuses:**
- The same data from `useOperateOverlayController` — findings, evidence, overrides
- The same inspect payload structure the current overlay rail uses

### The Founder Shell container

Wraps the renderer. Provides:
- One artifact (the renderer)
- Player dock (reuse existing audio/listen infrastructure)
- Assistant popup (reuse Seven thread plumbing)
- Next-step CTA (derived from seed state)
- Escape hatch to Full Box

This is the `FounderShell` component from the Founder Shell spec. The language spec defines what renders INSIDE it. The shell defines what surrounds it.

## Build order

### v0.1: Shape + Signal

Build the renderer with shape glyphs and signal color only. No weight rendering yet.

1. New component: `LoegosRenderer` (or `FounderArtifactView`)
   - Takes blocks + findings
   - Renders each block as: `[glyph] [colored text]`
   - Shape glyph inline at block start
   - Signal color on the text characters
   - Left-rule accessibility pattern on the block container
   - Inline annotation below block (rationale summary, one line)
   - Learner mode toggle (glyphs → plain labels)

2. New component: `LoegosExplainPanel`
   - Opens on block selection
   - Shows signal rationale, shape rationale, evidence, uncertainty, override state
   - Desktop: side panel. Mobile: bottom sheet.
   - Reuses data from `useOperateOverlayController`

3. Mount inside a new `FounderShell` component
   - Center: `LoegosRenderer`
   - Right (desktop) / bottom (mobile): `LoegosExplainPanel`
   - Bottom sticky: player dock
   - Header: next-step CTA + escape hatch

4. Route: `/workspace` defaults to `FounderShell` for founder entry
   - Full Box remains accessible via escape hatch
   - No changes to existing Full Box routes

### v0.2: Weight

Add the three-step weight rendering:
- Light (thin, wider spacing) for L1/D1-2
- Normal (regular) for L2/D1-3
- Strong (bold, tighter spacing) for L3 or D4
- Weight monotonic: never decreases visually

### v0.3: Live recompilation

- Operate re-triggers on edit with debounce
- Signal transitions visible in real time (color changes on the text)
- Stale detection clears and re-renders

### v0.4: Translator view

- Optional split pane for power users
- Left: plain text (editable)
- Right: Loegos rendering (read-only mirror)
- Linked: edit left, right recompiles

## CSS approach

The renderer needs new CSS that puts color on text, not on badges:

```css
.loegos-block--green .loegos-block__text { color: #66d278; }
.loegos-block--amber .loegos-block__text { color: #efb54e; }
.loegos-block--red .loegos-block__text { color: #ec5e54; }
.loegos-block--neutral .loegos-block__text { color: #8a8d96; }
.loegos-block--attested .loegos-block__text { color: #a0a4ae; }

.loegos-block--green { border-left: 2px solid #66d278; }
.loegos-block--amber { border-left: 2px dashed #efb54e; }
.loegos-block--red { border-left: 2px dotted #ec5e54; }
.loegos-block--attested { border-left: 2px dash-dot #a0a4ae; }

.loegos-block--light .loegos-block__text { font-weight: 300; letter-spacing: 0.02em; }
.loegos-block--normal .loegos-block__text { font-weight: 400; }
.loegos-block--strong .loegos-block__text { font-weight: 600; letter-spacing: -0.01em; }
```

The existing design tokens (font families, spacing scale, radius) remain unchanged.

## Testing

### The five-second test

Show a non-author a screenshot of Loegos-rendered text. Can they tell which lines are strong and which are weak in five seconds? If yes, ship. If no, simplify.

### Mechanical

- `npm run lint`
- `npm run build`
- `npm run test:smoke`
- Existing API routes unchanged

### Behavioral

- The existing E2E test (`tests/e2e/phase1-inline-operate.spec.mjs`) should be adapted for the new renderer
- The proof runbook golden path should work through the Founder Shell with language rendering

## What NOT to build

- No new backend routes
- No schema changes
- No new inference layers (Layer 2+)
- No word-level rendering in v0.1 (blocks are the unit)
- No chat-first mode in v0.1 (north star, not v1)
- No changes to Full Box — it stays as-is behind the escape hatch
