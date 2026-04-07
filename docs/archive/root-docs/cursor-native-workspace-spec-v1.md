# Cursor-Native Workspace Spec v1.1

**Date:** April 6, 2026
**Updated:** April 6, 2026 — added split editor, icon sidebar, tree-left convention
**Status:** Target anatomy spec for the desktop workspace
**Benchmark:** Cursor + VS Code + Xcode — the universal IDE anatomy
**Scope:** Desktop `/workspace` only

---

## The Rule

Take the universal IDE anatomy that Cursor, VS Code, and Xcode all
share. Replace code objects with coordination objects. Add one element
they don't have: a voice player bar at the bottom.

Do not invent a new layout. Do not add philosophy chrome.
Do not explain the product in the workspace. The layout IS
the explanation.

**Invariants (non-negotiable):**
1. The active Artifact tab is always open and always anchor-primary.
   It never closes, never scrolls off, never hides behind source tabs.
2. Seal preflight state is always visible — in the status bar when
   diagnostics is collapsed, in the diagnostics panel when expanded.
3. Content starts at the first block. Zero explanation chrome above it.

---

## The Universal IDE Anatomy

Every modern IDE agrees on this layout:

```
┌────┬─────────────────────────────────────────────────────────┐
│ICON│ FILE TABS                                               │
│BAR │ BREADCRUMB                                              │
│    ├────────────┬────────────────────────────────────────────┤
│    │            │                                            │
│ 40 │  PROJECT   │  EDITOR                                    │
│ px │  TREE      │  (content starts at line 1)                │
│    │            │                                            │
│    │  left      │  center, fills remaining space             │
│    │  ~250px    │                                            │
│    │            │                                            │
│    ├────────────┴────────────────────────────────────────────┤
│    │ STATUS BAR                                         22px │
└────┴─────────────────────────────────────────────────────────┘
```

Every deviation from this pattern costs the user recognition time.
The goal is zero deviation on the structural level.

---

## The Layout

```
┌────┬──────────────────────────────────────────────────────────────┐
│    │ FILE TABS                                               30px │
│    │ Seed of seeds × │ Assembled Reality │ + │                    │
│ I  ├──────────────────────────────────────────────────────────────┤
│ C  │ BREADCRUMB                                              24px │
│ O  │ How Lœgos Assembled Itself > Seed of seeds > Aim            │
│ N  ├────────────┬─────────────────────────────────────────────────┤
│    │            │                                                 │
│ B  │ PROJECT    │  EDITOR                                         │
│ A  │ TREE       │                                                 │
│ R  │            │  001  △  The box shows how you actually think,  │
│    │ ▾ Artifact │       not how you believe you think.            │
│ 40 │   ● Seed   │                                                 │
│ px │            │  002  □  UCSF documented 12 hospitalizations    │
│    │ ▾ Sources  │       in 2025 — patients with no prior          │
│    │   Assemb…  │       illness.                                  │
│    │   Operato… │                                                 │
│    │   Echo Ca… │  003  œ  The system confronts rather than       │
│    │   words a… │       validates.                                │
│    │   We Buil… │       ⚠ no reality in scope                     │
│    │   ...      │                                                 │
│    │            │  004  □  Email from Melih confirms Friday.      │
│    │ ▾ Receipts │                                                 │
│    │   Build    │  005  △  Ship working prototype to Melih        │
│    │   output   │       by Friday.                                │
│    │            │       △ reads as aim · green                     │
│    │ ─────────  │                                                 │
│    │ OUTLINE    │                                                 │
│    │ TIMELINE   │                                                 │
│    ├────────────┴─────────────────────────────────────────────────┤
│    │ PLAYER BAR (toggle, like terminal)                      40px │
│    │ ⏮ ⏪ ▶ ⏩ ⏭ │ 3/42 ━━━━━━━━━━━━━━━━━ │ 1x │ Seven ▾        │
│    ├──────────────────────────────────────────────────────────────┤
│    │ STATUS BAR                                              22px │
│    │ How Lœgos Assembled Itself │ Collecting │ 0% │ L1 │ ⊘ 12    │
└────┴──────────────────────────────────────────────────────────────┘
```

---

## Component Map

### Icon Sidebar — far left, 40px, full height

**Universal equivalent:** VS Code left icon column, Xcode navigator
selector.

Every IDE has a narrow icon column on the far left that toggles
panel views. Ours:

```
📁  Project tree (toggle left panel)
🔍  Search across box
⟐   Diagnostics / Seven (not △ — avoid shape-type overlap)
⏵   Player (toggle bottom panel)
⚙   Box management / settings
```

Five icons. Each toggles a panel. The editor never moves.

**Rules:**
- 40px wide, full viewport height
- Icons only, no labels
- Active panel icon is highlighted
- Clicking the active icon collapses that panel
- The editor always fills the remaining center space

### File Tabs — 30px

**Universal equivalent:** File tabs in Cursor, VS Code, Xcode.

**What it shows:** Open documents as tabs. The active Artifact tab
is visually distinct. Source documents open for reference appear as
secondary tabs. `+` to open a new source.

**What it replaces:** The current mode tabs, seed status line,
artifact metadata chips. All compress into one tab label.

**Rules:**
- Artifact tab always present when an artifact exists
- Source tabs have subtle read-only styling
- Tab shows document title only — no descriptions, no chips
- Maximum ~5 visible, overflow as dropdown

### Breadcrumb — 24px

**Universal equivalent:** VS Code breadcrumb, Xcode path bar.

**What it shows:** `Box name > Document name > Current section or block`

Example: `How Lœgos Assembled Itself > Seed of seeds > Aim`

**What it replaces:** Section headers, the "EDITOR" header, "Seed /
0 BLOCKS" labels.

**Rules:**
- One line, clickable segments
- No descriptions or explanatory text

### Project Tree — left, ~250px

**Universal equivalent:** VS Code Explorer, Xcode Project Navigator,
Cursor file tree. **All three put it on the left.**

**What it shows:**

```
▾ Artifact
  ● Seed of seeds (active, pinned)

▾ Sources                          13
  Assembled Reality
  Operator Sentences
  The Ghost Operator
  Echo Canon
  A monolith does not move.
  words are lœgos
  Loegos Git history export
  We Built Lœgos by Hand...
  ...

▾ Receipts                          1
  Build output
  └ Share prototype for feedback (sealed)

─────────────
OUTLINE (collapsible)
  → Aim
  → What's here
  → The gap
  → Sealed

TIMELINE (collapsible)
  → Recent events
```

**Why left, not right:** Every major IDE puts the project tree on the
left. Users expect it there. The right side is for secondary panels
(diagnostics, debug, preview). Fighting this convention costs recognition.

**Rules:**
- Artifact section always at top, visually elevated
- Sources are clearly read-only
- Receipts are clearly build output
- OUTLINE shows the Artifact's section structure (like VS Code Outline)
- TIMELINE shows recent assembly events (like VS Code Timeline)
- Collapsible — icon sidebar toggle hides the whole panel

### Editor — center, fills remaining space

**Universal equivalent:** The code editor in every IDE.

**What it shows:** The block stream of the active document. Each block
is a line (or multi-line paragraph) with a gutter on the left.

**Block anatomy:**

```
┌─────────┬────────────────────────────────────────────┐
│ GUTTER  │ CONTENT                                    │
│         │                                            │
│ 001     │ The box shows how you actually think,      │
│ △ aim   │ not how you believe you think.             │
│ ● conf  │                                            │
└─────────┴────────────────────────────────────────────┘
```

**Gutter column (~80-100px):**
- Block number (001, 002, 003) — like line numbers
- Shape glyph + label (△ aim, □ reality, œ weld, 𒐛 seal) — like type annotations
- Confirmation dot (● green = confirmed, ○ gray = open, ✕ red = discarded)

**Content column (fills remaining width):**
- The authored text, full width, no card wrapper
- Read mode: plain text, no border
- Edit mode: inline textarea, subtle bottom border
- Multi-line blocks flow naturally

**Inline diagnostics (in gutter, below block):**
- `⚠ no reality in scope` — like ESLint warnings
- `△ reads as aim · green` — like type inference
- Gray, 11px, inline

**Block actions (on selection only):**
- Floating toolbar on selected block
- Keep draft, Accept read, Recast, Stage into weld, Open witness
- Disappears when focus leaves

**Rules:**
- Content starts at 0px from top of editor area
- No section headers between blocks
- No metadata chips above the stream
- No save instruction visible
- No always-visible action buttons
- Inter-block gap: 4-8px
- Continuous document, not card stack

### Split Editor — side by side

**Universal equivalent:** VS Code split editor, Xcode assistant editor.

The editor can split into two panes. This is the WELD operation
made visual:

```
┌─────────────────────────┬─────────────────────────┐
│ ARTIFACT (left pane)    │ SOURCE (right pane)      │
│                         │                          │
│ 001  △  Ship working    │ 001  □  Email from       │
│      prototype to       │      Melih confirms      │
│      Melih by Friday.   │      Friday avail.       │
│                         │                          │
│ 002  œ  The system      │ 002  □  Prototype        │
│      confronts rather   │      screenshot attached  │
│      than validates.    │      as evidence.         │
│                         │                          │
└─────────────────────────┴─────────────────────────┘
```

**What it does:** The user opens the Artifact in the left pane and a
Source in the right pane. They can compare aim against evidence,
pull blocks from source into artifact, and see the comparison that
constitutes a weld.

**This replaces the need for a separate "weld mode."** The split
editor IS the weld. You don't weld in a special surface — you weld
by looking at both documents side by side, the same way a developer
compares two files in a diff view.

**Rules:**
- Split is user-triggered (drag tab to edge, or keyboard shortcut)
- Left pane stays the Artifact by default
- Right pane is read-only if it's a Source
- Each pane has its own breadcrumb
- Block actions only appear in the Artifact pane (left)

### Diagnostics Panel — toggle, right or bottom

**Universal equivalent:** VS Code Problems panel, Xcode Issue Navigator.

In VS Code, diagnostics are a bottom panel (toggle). In Xcode, they're
in the left navigator. We should follow VS Code's pattern: **a toggle
panel that can appear on the right side or the bottom**, controlled by
the icon sidebar △ button.

**What it shows (when expanded):**

```
DIAGNOSTICS                              Stage 0
─────────────────────────────────────────────────
SEAL PREFLIGHT
  ✕ BLOCKED  Weld exists
  ✕ BLOCKED  Convergence ≥ 70%
  ✕ BLOCKED  Trust floor L2
  ✕ BLOCKED  Depth requirement
  ✕ BLOCKED  Evidence chain

BLOCKING CONTRADICTIONS                     4
  ERROR  SEAL-NEEDS-REALITY
         Seal requires at least one □ reality block.
  ERROR  SEAL-NEEDS-WELD
         Seal requires a weld with both aim and reality.

CONVERGENCE
  0% │ Trust L1 │ Stage 0

[Run Operate]  [Open receipts]
```

**When collapsed, seal preflight state stays visible in the status bar:**
`4 blockers · 0% · L1` or `✓ seal ready · 92% · L2`

This is non-negotiable. Seal preflight is the equivalent of "build
errors" in a code IDE. The user must always know whether they can
seal without opening the diagnostics panel. The status bar carries
this truth at all times.

**Rules:**
- Toggle from icon sidebar or keyboard shortcut
- Does not steal center editor space when hidden
- When visible, sits as a right panel or bottom panel (user choice)
- Seven can also appear here as a collapsible section

### Seven Panel — toggle, collapsible

**Universal equivalent:** Cursor AI chat panel, VS Code Copilot panel.

**What it shows:** Seven's conversation thread. Input prompt at bottom.
History above.

**Position:** Can appear in the diagnostics panel as a tab, or as a
separate panel toggled from the icon sidebar. Like how Cursor's AI
chat can be a sidebar or an inline panel.

**Rules:**
- Collapsible — hidden by default for experienced users
- Does not compete with editor
- Input at bottom, history above
- Infers, does not interpret

### Player Bar — bottom, 40px, toggle

**Universal equivalent:** Terminal panel in VS Code/Cursor.

```
⏮ ⏪ ▶ ⏩ ⏭ │ 3/42 ━━━━━━━━━━━━━━━━━━ │ 1x │ Seven ▾
```

**Rules:**
- Always available when a document is open
- Toggle with keyboard shortcut (like Cmd+` for terminal)
- Resting state: thin line or single icon (~8px) — present but quiet
- Active/expanded state: 40px with full transport controls
- Can further expand to show current block text being read
- Should not be a permanent visual tax when not in use

### Status Bar — bottom, 22px

**Universal equivalent:** Status bar in VS Code, Xcode, Cursor.

```
How Lœgos Assembled Itself │ Collecting │ 0% │ L1 │ ⊘ 12 │ 𒐛 0
```

**Rules:**
- One row, 22px, always visible
- Click segments to open relevant detail
- Ambient information only

---

## What Is Removed

| Current element | Decision |
|---|---|
| "EDITOR — Write the current block stack" header | **REMOVE** |
| Seed metadata chips above content | **REMOVE** — moves to status bar and tabs |
| REALITY / NAME BOX mode tabs | **REMOVE** — replaced by file tabs |
| Section headers in center pane | **REMOVE** — replaced by breadcrumb |
| "Declare root" prominent button | **MOVE** to Box menu |
| Per-block save instruction | **REMOVE** — tooltip on first focus |
| Per-block always-visible actions | **MOVE** to selection context toolbar |
| Per-block confirmation badge below content | **MOVE** to gutter dot |
| Per-block provenance line | **MOVE** to gutter or hover |
| Per-block formal annotations as section | **MOVE** to inline gutter |
| Shape hero cards | Already removed — stays removed |
| Verb toolbar | Already removed — stays removed |
| Separate full-width diagnostics rail | **COMPRESS** to toggleable panel |

---

## Measurements

| Element | Universal IDE | Our target | Current |
|---|---|---|---|
| Chrome above first line | 54px | 54px | ~220px |
| Editor % of viewport | 75-80% | 75%+ | ~40% |
| Status bar | 22px | 22px | ~76px |
| Icon sidebar | 40px | 40px | N/A |
| Project tree (left) | 250px | 250px | 280px (right) |
| Bottom bar | 0-40px (terminal toggle) | 40px (player) | ~56px |
| Per-block chrome | 0px (line number only) | ~20px (gutter) | ~280px |

---

## The Side-by-Side Test

Open VS Code. Open our workspace. Put them side by side.

**What should be identical:**
- Icon sidebar on the far left
- Project tree on the left
- File tabs at the top
- Breadcrumb below tabs
- Content starts at the same vertical position
- Line numbers in the gutter
- Status bar at the bottom

**What should be different:**
- Our gutter has shape glyphs (△ □ œ 𒐛)
- Our blocks are natural language paragraphs
- Our tree has Artifact / Sources / Receipts (not folders)
- Our diagnostics show seal preflight (not lint errors)
- Our bottom has a voice player (not a terminal)
- Our split editor shows Artifact vs Source (not code diff)

**What someone should say:**
"That's a code editor, and that's a coordination editor."

---

## Implementation Priority

| # | Change | Component affected |
|---|---|---|
| 1 | Add icon sidebar (40px, far left) | New component |
| 2 | Move project tree to left | SourceRail → left position |
| 3 | Replace top chrome with file tabs + breadcrumb | WorkspaceControlSurface → tabs |
| 4 | Remove all center headers/metadata above block stream | WorkspaceShell center pane |
| 5 | Refactor blocks into gutter + content stream | Block rendering, CSS |
| 6 | Make block actions contextual on selection | Block actions |
| 7 | Add split editor support | New component |
| 8 | Make diagnostics a toggleable panel | WorkspaceDiagnosticsRail |
| 9 | Add status bar (22px, bottom) | New component |
| 10 | Compress player bar to 40px toggle | PlayerBar |
