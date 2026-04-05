# Lœgos Polish Pass

## Fix Rendering Bugs, Strip TMI Copy, Compress Mobile Chrome

**v0.1 — April 5, 2026**
**Deniz Sengun / Cloud**

---

## 0. The Rule

Every piece of visible text must pass two tests:

1. **Is it absolutely necessary every time the user sees it?** If the user will learn it in 4 tries, remove it. The first time is the only time explanatory text has value — and even then, it should be one sentence.

2. **Does it explain a feature?** If yes, remove it. Features explain themselves through use. The only text that survives is: labels, values, and operator sentences for guidance that can't be inferred from context.

---

## 1. Rendering Bugs

### 1.1 Escaped markdown in titles

**Problem:** Source titles display as `\# The Meaning Operator` instead of `The Meaning Operator`. The `\` escape character and `#` markdown syntax are visible to the user.

**Where:** Lane source cards, Listen surface header, nav bar document title pill, source picker, confirmation queue source labels.

**Root cause:** The source intake stores document titles with markdown syntax included. The display layer does not strip leading `#` characters or escape sequences.

**Fix:** In the title normalization path (likely `document-blocks.js` or the document import layer), strip leading markdown heading markers (`# `, `## `, `### `) and backslash escapes (`\#`, `\*`) from display titles. The raw content keeps the markdown — only the `title` field used for display gets cleaned.

**File:** `src/lib/document-blocks.js` — add a `normalizeDisplayTitle()` function. Apply it in `buildWorkspaceBlocksFromDocument()` and wherever document titles are rendered in view models.

### 1.2 Player scrolls with content

**Problem:** On the Listen surface, the PREV/PLAY/NEXT controls and progress bar sometimes scroll up with the block content instead of staying pinned at the bottom.

**Fix:** The player controls container needs `position: sticky; bottom: 0` relative to the listen surface viewport, not relative to the scrollable block list. If it's currently inside the scroll container, move it outside.

**File:** `src/app/globals.css` — player positioning rules. Check the listen surface layout in `WorkspaceShell.jsx`.

### 1.3 Italic markdown placeholder rendered literally

**Problem:** The seed block view shows `_No content yet._` with underscores visible instead of rendering as italic text or using a plain empty state string.

**Fix:** Replace the markdown placeholder `_No content yet._` with a plain string `No content yet.` styled with CSS italic via a class, not markdown formatting.

**File:** `src/lib/seed-model.js` — the `buildSeedMarkdown()` function uses `_No content yet._` as the fallback for empty sections.

### 1.4 Duplicate "LOCAL ONLY" badges

**Problem:** The receipt surface hero shows two "LOCAL ONLY" pills side by side — one for draft status, one for courthouse status. When both are "Local only", they're identical and redundant.

**Fix:** When draft status and courthouse status would show the same label, show only one pill. The view model computation should deduplicate:

```js
const showSecondPill = summary.courthouseStatusLine !== summary.latestDraftStatusLabel;
```

**File:** `src/components/ReceiptSurface.jsx` — hero meta section, or `src/lib/box-view-models.js` in the receipt summary builder.

---

## 2. TMI Copy — Text That Must Be Removed

Every line below is currently visible on a working surface. None passes the two tests (necessary every time + doesn't explain a feature).

### Receipt Surface

| Current text | Action |
|---|---|
| "Preserve the current workspace state as a draft receipt for later review and export." | **Remove entirely.** "Draft receipt" is the button label. The user knows what drafting does after one use. |
| "The box is accumulating without sealing. Confirm some blocks or seal a receipt to close the loop." | **Compress to:** "Accumulating without sealing." — that's the signal. The instruction ("confirm blocks or seal") is what the button does. |
| "ASSEMBLED REALITY receipt" in large bold | **Use the receipt title only**, not the product name. If the receipt has a title, show it in normal weight. |

### Seven Panel

| Current text | Action |
|---|---|
| "Start a thread about this document. Seven keeps the conversation tied to what you are reading." | **Remove entirely.** The suggestion chips are self-explanatory. |

### Source Cards (Lane)

| Current text | Action |
|---|---|
| "Source text preserved in the box. Normalization is separate from verification." (on every card) | **Remove entirely.** This is documentation, not a per-card label. |
| PRESENT / OPEN / DIRECT EVIDENCE / ORDER INFERRED (4 badges per card) | **Reduce to 1 badge.** Show the source type (DOCUMENT, MARKDOWN, GUIDE) or trust level — not four parallel labels. |

### Root Bar (mobile)

| Current text | Action |
|---|---|
| "BOX" eyebrow on its own line | **Remove on mobile.** The user knows they're in a box. |

### Reality Instrument

| Current text | Action |
|---|---|
| Any multi-sentence guidance text | **Max one operator sentence.** If the instrument needs to explain itself, the design is wrong. |

---

## 3. Mobile Chrome Compression

### 3.1 RootBar — three lines to one

**Current (3 lines, ~80px):**
```
BOX                    (eyebrow)
Name box               (title)
⊘ 1099                 (badge on its own line)
```

**Target (1 line, ~36px):**
```
Name box · ⊘ 1099
```

Or merge into the mobile top nav entirely — the RootBar data (root text + ⊘ count) could appear as part of the LANE tab's badge area, eliminating the separate row completely.

**File:** `src/components/RootBar.jsx` — add a `compact` layout that renders as a single flex row. Or: modify the mobile layout in `WorkspaceShell.jsx` to not render the RootBar separately and instead pass root data to the MobileBottomNav.

### 3.2 Mobile top nav — too many elements

**Current:** `LŒGOS · [UNTITLED BOX] · [\# THE MEANING OPERATOR] · [SEVEN] · [account icon]`

Five elements across a narrow screen. The document title takes up most of the space.

**Target:** On mobile, the top nav shows only `LŒGOS · [BOX NAME ▾]`. The document title appears in the content area. The Seven button is accessible via the bottom nav or a gesture.

**File:** `WorkspaceShell.jsx` — the mobile header rendering section. The top bar component should receive an `isMobileLayout` prop and hide the document title and Seven button on mobile.

---

## 4. Component-Level Fixes

### 4.1 Confirmation queue — oversized controls

**Tag buttons (△ Aim / ◻ Evidence / ○ Story):** Currently ~80px tall tiles. Reduce to standard chip height (28-36px). Same row, same gap as domain chips.

**Domain chips:** Show only applicable domains (from root), not all 10. If root has 5 domains, show 5. The rest are hidden or behind "More".

**Action buttons (Confirm / Skip / Discard):** Standard terminal-button height (36px). Confirm is primary, others are secondary.

**File:** `src/components/ConfirmationQueueDialog.jsx` and `globals.css` confirmation styles.

### 4.2 Listen controls — text to icons

**Current:** ◁10 / PLAY / 10▷ / PREV / NEXT — five text buttons, oversized.

**Target:** Five icon-only buttons using Lucide: `SkipBack`, `Rewind`, `Play` or `Pause`, `FastForward`, `SkipForward`. 32px each, matching the instrument bar icon buttons.

**File:** The listen player component in `WorkspaceShell.jsx` and its CSS in `globals.css`.

### 4.3 Receipt surface — stacked full-width buttons

**Current:** "Draft receipt" and "Seal receipt" as full-width stacked buttons.

**Target:** Inline row, standard height. Draft (primary), Seal (secondary). Same height, side by side.

**File:** `src/components/ReceiptSurface.jsx` — hero actions section.

### 4.4 Receipt title casing

**Current:** "ASSEMBLED REALITY receipt" in large bold.

**Target:** Use the actual receipt title in normal title weight. Not the product name in caps.

**File:** `src/components/ReceiptSurface.jsx` — hero title rendering.

---

## 5. Missed Interaction Opportunities

### 5.1 Document title pill as a document picker

The top nav's document title pill should open a popover listing all sources in the current box, sorted by last accessed. Tap to switch documents without going back to the Lane surface.

### 5.2 Swipe between surfaces

On mobile, swiping left/right should navigate between adjacent surfaces (Lane ↔ Listen ↔ Seed ↔ Receipts). This is a standard mobile pattern.

### 5.3 Pull-to-refresh

Pulling down should reload the current box data.

### 5.4 Root bar edit affordance

"Name box" doesn't look tappable. Add a visual hint: dashed underline, pencil icon, or subtle pulse on empty state.

---

## 6. Remaining Color Issues

| Element | Current | Fix |
|---|---|---|
| Seven suggestion chips | Purple/blue hardcoded | `--assembly-step-1-soft` + `--assembly-step-1-border` |
| Progress bar dot (Listen) | Old blue accent | Assembly tone (current state color) |
| "Add link" button | Dark blue fill | `--assembly-step-1-soft` background |
| Seed card highlight (source rail) | Blue tint | Assembly tone |

---

## 7. Implementation Priority

### Batch 1: Fix what's broken (bugs + TMI)
1. Strip `\#` / `\*` from display titles
2. Fix player scroll position
3. Remove duplicate "LOCAL ONLY" badge
4. Fix `_No content yet._` rendering
5. Remove all TMI copy listed in Section 2
6. Compress looping warning to one sentence

### Batch 2: Compress mobile chrome
7. RootBar to one line on mobile
8. Compress mobile top nav
9. Resize confirmation tag/domain/action buttons

### Batch 3: Component fixes
10. Listen controls → Lucide icon buttons
11. Receipt buttons → inline row
12. Source card badges → 1 per card
13. Remove trust sentence from source cards
14. Receipt title → normal casing

### Batch 4: Interactions (can be separate PR)
15. Document title picker popover
16. Swipe between surfaces
17. Root bar edit affordance

### Batch 5: Color sweep
18. Seven chips → assembly tokens
19. Progress bar → assembly tone
20. Add link button → assembly tokens
21. Seed card → assembly tone

---

*Strip until the road is visible. Then drive.*
