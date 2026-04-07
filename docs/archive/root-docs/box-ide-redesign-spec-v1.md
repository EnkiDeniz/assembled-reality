# Box IDE Redesign Spec v1

**Date:** April 6, 2026
**Scope:** Desktop `/workspace` only. Not mobile. Not public site.
**Type:** Decision-complete redesign brief. Not implementation.

---

## Part 1: Diagnosis

### The IDE Test

Four questions. The current workspace fails three.

**Left rail — does it prove project context?**
PARTIAL PASS. `SourceRail` shows 13 sources with block counts, classification badges, and trust levels. It also shows a runtime section (convergence, trust, branches, receipts, settlement). The runtime section is useful but heavy — it adds ~120px of metrics before the scrollable source list. The source list itself is a real project tree.

**Center pane — does it make the active artifact visually dominant?**
FAIL. The center pane in the "assemble" or "rewrite" mode renders a block inside 4-5 layers of metadata above the content, plus 4-5 layers below. A single block has up to 40 non-content UI elements at maximum rendering. The authored text is a small textarea inside a card inside a section. The section has its own header ("EDITOR — Write the current block stack"), its own description, and its own metadata chips. The block stack is not the primary visual object. The framework is.

**Right rail — does it behave like diagnostics/debugging?**
PASS. `WorkspaceDiagnosticsRail` is well-structured: seal preflight → blocking contradictions → shape/parse issues → convergence + Operate → trust/depth/settlement → build output → Seven. It's ordered by urgency. It reads like compiler output. This is the strongest part of the current layout.

**Status layer — does it compress runtime/build truth without stealing focus?**
FAIL. `WorkspaceControlSurface` renders ~80px of chrome: brand mark, utilities toolbar, box title selector, ShapeNav (four shape buttons), root declaration, signal row, verb toolbar. The four shape buttons (AIM/REALITY/WELD/SEAL) render as prominent navigation cards. The verb toolbar adds a second row of mode selectors. Combined, the control surface and verb toolbar occupy more visual weight than the center content area.

### The Hierarchy Mistake

The current screen hierarchy is:

```
1. WorkspaceControlSurface (~80px)    — concept navigation
2. Section header (EDITOR, ~60px)     — explains what the editor does
3. Seed title + metadata (~40px)      — document identity + chips
4. Block metadata (~20px)             — block number + status
5. AUTHORED CONTENT (~54px)           — the actual work
6. Save instruction (~16px)           — how to save
7. Confirmation status (~24px)        — tag + status
8. Provenance (~24px)                 — where this block came from
9. Formal annotations (~40px)         — shape parse + warnings
10. Action buttons (~36px)            — 5 buttons per block
```

The authored content is at position 5 of 10 in the vertical hierarchy.
It occupies ~54px out of ~394px total per block (~14%).

In Cursor, the authored content is at position 1 and occupies ~95%.

### First Editable Character Audit

From the top of the center pane to the first editable character:

| Layer | Content | Height |
|---|---|---|
| Section header | "EDITOR — Write the current block stack" | ~28px |
| Section description | "The center stays for authored blocks..." | ~40px |
| Seed title | "Seed of seeds" | ~28px |
| Metadata chips | SEED · 1 BLOCK · 0% CONVERGENCE | ~28px |
| Delete button row | 🗑 | ~32px |
| Block number + status | 001 · ASSEMBLY IMPORTED | ~18px |
| **Total chrome above first word** | | **~174px** |

In Cursor: **0px**. The first line of code is at the top of the viewport.

### Visual Weight Breakdown

On the current desktop workspace with one block visible:

| Category | Approximate % of viewport |
|---|---|
| Left rail (SourceRail) | 20% |
| Right rail (Diagnostics) | 25% |
| Top chrome (ControlSurface) | 8% |
| Center chrome (headers, metadata, actions) | 33% |
| **Authored content** | **14%** |

In Cursor:

| Category | Approximate % of viewport |
|---|---|
| Left rail (file tree) | 15% |
| Right rail (none by default) | 0% |
| Top chrome (tabs + toolbar) | 4% |
| Center chrome (line numbers) | 3% |
| **Authored content** | **78%** |

### Component Responsibility Audit

| Component | Current Role | IDE Role | Gap |
|---|---|---|---|
| `WorkspaceShell` | Route host + composition root | Same | OK — but renders BoxHome as default |
| `WorkspaceControlSurface` | Concept-first chrome: shapes, verbs, brand | Compact status bar | Too heavy. Should be one row |
| `BoxHomeScreen` / `ProjectHome` | Overview-first default posture | Secondary overlay | Should not be the default entry |
| `RootEditor` | Modal/sheet for root text | Inline gutter element | Should be in-flow, not modal |
| `SourceRail` | Project tree + runtime metrics | Project tree only | Runtime should move to status bar |
| `WorkspaceDiagnosticsRail` | Diagnostics/build rail | Same | Already correct direction |

### Diagnosis Conclusion

**The exact hierarchy mistake:** The workspace foregrounds the product framework (shapes, verbs, modes, explanatory text) over the authored artifact (blocks). Every layer between the user and their content exists to explain the system rather than to show the work.

**The exact surfaces causing it:**
1. `WorkspaceControlSurface` — renders concept navigation (shape cards, verb toolbar) as primary chrome
2. Section headers — "EDITOR — Write the current block stack" describes the editor instead of showing content
3. Per-block metadata — renders 4-5 annotation layers per block, always visible
4. `BoxHomeScreen` — renders as the default entry, forcing the user through an orientation surface before they can edit

**The exact evidence:** The authored content is at position 5 of 10 in the vertical hierarchy, occupying 14% of viewport. In an IDE, it should be at position 1, occupying 70%+.

---

## Part 2: Solution — Target IDE Anatomy

### Default Desktop Entry

**Rule:** When a box has live material (sources, seed, or seed with blocks), desktop opens directly into the editor with the most recent artifact loaded. No Box Home as default.

Box Home becomes accessible from the left rail header (one click) or a keyboard shortcut, not the landing surface.

### The Three Regions

```
┌──────────────────────────────────────────────────────────────┐
│  STATUS BAR (one row, compact)                               │
├────────────┬──────────────────────────────┬───────────────────┤
│            │                              │                   │
│  PROJECT   │     EDITOR                   │   DIAGNOSTICS     │
│  TREE      │     (block stack)            │   RAIL            │
│            │                              │                   │
│  Sources   │  001 △ aim    | content...   │   Seal preflight  │
│  Seeds     │  002 □ reality| content...   │   Contradictions  │
│  Runtime   │  003 œ weld   | content...   │   Shape issues    │
│            │  004 □ reality| content...   │   Convergence     │
│            │                              │   Trust/depth     │
│            │                              │   Build output    │
│            │                              │   Seven           │
│            │                              │                   │
├────────────┴──────────────────────────────┴───────────────────┤
│  PLAYER BAR (compact, bottom)                                 │
└──────────────────────────────────────────────────────────────┘
```

### Status Bar Law

The top chrome compresses into one row containing:

```
LŒGOS | [Seed of seeds ▾] | △ □ œ 𒐛 | Collecting · 0% | ⊘ 12 | [Operate] [Seal]
```

- Brand mark (click → Box Home overlay)
- Active document tab with dropdown (click → switch documents)
- Shape mode indicators (compact glyphs, not cards)
- Protocol position + convergence (one chip)
- Unresolved count
- Primary action buttons

Total height: **36-40px**. Current: ~80px.

What moves out:
- Four large shape cards → compressed to glyph row
- Verb toolbar → compressed into shape mode or removed (the editor itself is the verb)
- Section descriptions → deleted
- "Navigate by shape. Act by verb." tagline → deleted from workspace chrome

### Center Pane Law

**Content starts at the top.** The first block begins at the top of the center pane. No section header. No description. No metadata chips above the stack.

**The block stack is a continuous vertical stream:**

```
001  △ aim · confirmed     The box shows how you actually think,
                           not how you believe you think.

002  □ reality · staged    UCSF documented 12 hospitalizations
                           in 2025 — patients with no prior
                           illness.

003  œ weld · open         The system confronts rather than
     ⚠ no reality block    validates. We believe this reduces
                           the risk.

004  □ reality · open      Email from Melih confirms Friday
                           availability.
     △ reads as aim
```

**Gutter column (left of content, ~120px):**
- Block number (001, 002, 003)
- Shape glyph + label (△ aim, □ reality, œ weld)
- Confirmation status (confirmed, staged, open)

**Content column (fills remaining width):**
- The authored text. Full width. No card wrapper. No bordered textarea in read mode.
- In edit mode: the text becomes a textarea inline, same width, no card border change.

**Inline annotations (below the block line, in the gutter):**
- Diagnostics: `⚠ no reality block` appears in the gutter, not in a separate section
- Shape parse: `△ reads as aim` appears as a quiet gutter note
- These are visible but secondary — gray, 11px, same as line numbers in a code editor

**What moves out of per-block rendering:**
- Save instruction ("BLUR OR CMD/CTRL+ENTER TO SAVE") → tooltip on first focus, or keyboard shortcut overlay
- Provenance line ("Authored here Seed of seeds") → available on block hover/inspect, not always visible
- Action buttons (Keep draft, Accept read, Recast tag, Stage into weld, Open witness) → appear on block selection as a floating toolbar or right-click context menu
- AI-GENERATED badge → gutter annotation, not a section
- Confirmation signal chip → gutter status (the word "confirmed" or "staged" in the gutter column)

**Per-block element count target:**
- Current maximum: ~40 non-content elements
- Target: ~6 (block number, shape glyph, status, content, 0-2 inline diagnostics)

### Shape Law

AIM / REALITY / WELD / SEAL stay as the four rooms. They become compact grammar elements:

- **Status bar:** Four glyph indicators (△ □ œ 𒐛) showing which shapes are present in the current document. Not large cards.
- **Gutter:** Each block shows its shape as a glyph (△, □, œ, 𒐛) in the gutter column.
- **Diagnostics rail:** Seal preflight uses shapes as categories: "Seal requires at least one □ reality block."
- **Context menu:** When selecting a block, shape recast options appear as a menu: "Recast as △ Aim / □ Reality / œ Weld"

Shapes are NOT:
- Hero cards on the default workspace
- Full-width navigation sections
- Verb card grids

### Diagnostics Rail Law

Keep `WorkspaceDiagnosticsRail` in its current direction. Adjustments:

- **Remove:** Seven's thread messages from the diagnostics rail. Seven gets its own collapsible panel at the bottom of the rail, or as a separate toggle panel (like Cursor's AI chat panel).
- **Compress:** Trust/depth/settlement section. The hex is good but the three BoxMetric cards below it are verbose. Compress to a single status line.
- **Keep:** Seal preflight, blocking contradictions, shape/parse issues, convergence + Operate, build output. These read like compiler output. This is correct.

### Density Law

| Element | Current | Target |
|---|---|---|
| Status bar height | ~80px | ~38px |
| Center section header | ~68px ("EDITOR — Write the current block stack") | 0px (removed) |
| Center metadata chips | ~28px per section | 0px (moved to gutter/status bar) |
| Per-block chrome | ~340px (meta + content + annotations + actions) | ~80px (gutter + content + 0-1 inline annotation) |
| Inter-block gap | ~16px | ~8px |

**Content density target:** The authored content should be readable as a continuous document, not as a stack of cards. Blocks flow like paragraphs with gutter annotations, not like isolated card components.

---

## Part 3: Screen Spec — Default Desktop Workspace

### Named Regions

| Region | Position | Width | Content |
|---|---|---|---|
| STATUS_BAR | Top, full width | 100% | Brand, document tab, shape indicators, protocol, convergence, actions |
| PROJECT_TREE | Left, below status | 240-280px fixed | Source list, seed list, runtime summary |
| EDITOR | Center, below status | Flexible (fills remaining) | Block stack with gutter |
| DIAGNOSTICS | Right, below status | 300-340px fixed | Seal preflight, contradictions, issues, convergence, build output, Seven |
| PLAYER | Bottom, full width | 100% | Audio playback controls |

### Region Priority

1. **EDITOR** — Primary. Largest area. Content starts at the top.
2. **DIAGNOSTICS** — Secondary. Visible by default but scrollable and collapsible.
3. **PROJECT_TREE** — Tertiary. Collapsible. Shows structural navigation.
4. **STATUS_BAR** — Ambient. One row. Compressed.
5. **PLAYER** — Ambient. Bottom row. Collapsible when not playing.

### Default Loaded State

When a user navigates to `/workspace` on desktop with a box that has content:

1. STATUS_BAR shows: active document name, shape indicators, protocol position, convergence, primary action
2. PROJECT_TREE shows: source list (collapsed groups), seed list, runtime summary (compressed)
3. EDITOR shows: the block stack of the most recent active document, starting at the first block, with gutter annotations
4. DIAGNOSTICS shows: seal preflight (always), blocking contradictions (if any), other sections collapsed
5. PLAYER shows: compact bar at bottom

### Above the Fold

| Element | Visible above the fold | Notes |
|---|---|---|
| Status bar | Yes | One row, always |
| First 3-5 blocks | Yes | The authored content |
| Gutter annotations | Yes | Beside each visible block |
| Seal preflight header | Yes | Top of diagnostics rail |
| Source list header | Yes | Top of project tree |
| Box Home | **No** | Accessible from brand mark click |
| Shape cards | **No** | Removed from default |
| Section headers | **No** | Removed from center |
| Verb toolbar | **No** | Removed; the editor IS the verb |

### What is Removed from Default Screen

| Element | Current | Decision |
|---|---|---|
| "EDITOR — Write the current block stack" header | Always visible | **REMOVE** |
| "The center stays for authored blocks..." description | Always visible | **REMOVE** |
| Seed metadata chips (SEED · 1 BLOCK · 0% CONVERGENCE) | Above block stack | **MOVE** to status bar |
| Delete button above blocks | Prominent | **MOVE** to context menu |
| Save instruction per block | Below every textarea | **REMOVE** (tooltip on first focus) |
| Five action buttons per block | Below every block | **MOVE** to selection context menu |
| Provenance line per block | Below every block | **MOVE** to hover/inspect |
| AI-GENERATED badge | Below AI blocks | **MOVE** to gutter annotation |
| Four shape hero cards | WorkspaceControlSurface | **REMOVE** from default (glyph row instead) |
| Verb toolbar | Below shape cards | **REMOVE** (editor is the verb) |
| Box Home as default entry | First screen on desktop | **DEMOTE** to overlay accessible from brand mark |

### What Becomes Contextual

| Element | Trigger |
|---|---|
| Block action buttons | Block selection/focus |
| Shape recast options | Block selection → context menu |
| Provenance details | Block hover |
| Save instruction | First focus on a textarea |
| Box Home | Click brand mark in status bar |
| Full runtime metrics | Click runtime summary in project tree |

### What Becomes Secondary

| Element | Placement |
|---|---|
| Runtime metrics (convergence, trust, branches, receipts) | Compressed in project tree, detail on click |
| Seven conversation | Bottom section of diagnostics rail, collapsible |
| Word layer | Collapsed section in diagnostics or separate toggle |
| Settlement hex | Compressed in diagnostics header or project tree |

---

## Part 4: Implementation Backlog

### Priority 1: Replace default desktop entry

**User-facing change:** Desktop no longer opens to Box Home. Opens to the editor with the most recent document loaded.

**Component:** `WorkspaceShell.jsx` — change `showLaunchpadInitially` logic for desktop to default to editor view.

**Move type:** REPLACE — Box Home default → editor default

### Priority 2: Compress top chrome

**User-facing change:** The control surface becomes a single compact status bar. Shape cards become glyphs. Verb toolbar removed.

**Component:** `WorkspaceControlSurface.jsx` — rewrite to single-row status bar. Remove `ShapeNav` card grid. Remove `VerbToolbar`.

**Move type:** COMPRESS — 80px concept chrome → 38px status bar

### Priority 3: Remove center section headers and metadata

**User-facing change:** The "EDITOR" header, description, seed metadata chips, and delete button above the block stack are removed. Content starts at the top.

**Component:** `WorkspaceShell.jsx` center pane rendering, `SeedSurface.jsx`, `CreateSurface.jsx`

**Move type:** REMOVE — headers, descriptions, metadata chips above content

### Priority 4: Refactor blocks to gutter + content

**User-facing change:** Each block renders as gutter (number + shape + status) + content, without per-block metadata sections, action buttons, or annotation sections always visible.

**Component:** Block rendering in `WorkspaceShell.jsx`, CSS for `.assembler-block`

**Move type:** REPLACE — card-wrapped blocks → gutter + content stream

### Priority 5: Move block actions to selection context

**User-facing change:** The five action buttons and recast options appear only on block selection, not permanently below every block.

**Component:** Block action rendering in `WorkspaceShell.jsx`

**Move type:** COMPRESS — always-visible actions → contextual on selection

### Priority 6: Tighten diagnostics rail

**User-facing change:** Diagnostics sections that are empty collapse. Trust/depth/settlement compresses. Seven moves to bottom/collapsible.

**Component:** `WorkspaceDiagnosticsRail.jsx`

**Move type:** COMPRESS — verbose sections → compact defaults, expand on click

### Priority 7: Separate receipts as build output

**User-facing change:** Sealed receipts render distinctly from draft workspace content. Build output section in diagnostics links to receipts.

**Component:** `ReceiptsScreen.jsx`, `WorkspaceDiagnosticsRail.jsx`

**Move type:** KEEP + COMPRESS — receipts stay but read as compiled artifacts, not editable cards

---

## Implementation Backlog Summary

| # | Change | Component | Type |
|---|---|---|---|
| 1 | Default to editor, not Box Home | WorkspaceShell | REPLACE |
| 2 | Compress control surface to status bar | WorkspaceControlSurface | COMPRESS |
| 3 | Remove center headers/descriptions | WorkspaceShell, SeedSurface, CreateSurface | REMOVE |
| 4 | Blocks → gutter + content stream | Block rendering, CSS | REPLACE |
| 5 | Actions → selection context | Block actions | COMPRESS |
| 6 | Tighten diagnostics rail | WorkspaceDiagnosticsRail | COMPRESS |
| 7 | Receipts as build output | ReceiptsScreen, Diagnostics | KEEP + COMPRESS |

---

## Validation Tests

### The 3-Second Test
Open the workspace. Can you tell within 3 seconds what is being edited?
- **Current:** No. You see chrome, shape cards, section headers, metadata.
- **Target:** Yes. You see the block stack immediately.

### The First Editable Character Test
Count layers before authored content.
- **Current:** 6 layers, ~174px
- **Target:** 0 layers, ~0px (content starts at top of center pane)

### The Artifact Dominance Test
What percentage of the center pane is authored content?
- **Current:** ~14%
- **Target:** ~70%+

### The Framework-vs-Work Test
Hide all labels and branding. Does the screen read as live authorship?
- **Current:** No. It reads as a data inspector with an embedded textarea.
- **Target:** Yes. It reads as a text editor with a diagnostic sidebar.

### The Cursor Comparison Test
Put Cursor and our workspace side by side. Ask which one is the editor.
- **Current:** Cursor wins immediately.
- **Target:** Both read as editors, with ours having a stronger diagnostic rail.
