# Document Assembler — Add-On Spec

**Addendum to v1.0 Spec**
**April 2026**

This document addresses the gaps between the current implemented shell and the prototype. It does not replace anything. It tells the developer exactly what to add and where.

---

## 1. Replace Left Pane → Top Shelf

Remove the left-side source panel. Replace with a horizontal shelf bar docked at the top of the screen.

**What it shows:**
- One pill per loaded document (imported or assembled)
- Active document is highlighted
- Assembled documents get a small green dot on their pill
- A `+ Upload` button at the end (accepts PDF, DOCX, MD)

**What it does:**
- Click a pill → that document fills the main view
- Playback pauses on doc switch, resumes if you return
- Order is chronological, newest right

**What it does NOT do:**
- No folders, no hierarchy, no drag-to-reorder
- No file metadata display — just the title

---

## 2. Replace Right Context Pane → Bottom Clipboard Tray

Remove the right-side inspector/context pane. Replace with a collapsible tray docked between the document view and the player.

**Collapsed (default):**
One line: `CLIPBOARD · 3 blocks from 2 docs` with `ASSEMBLE` and `CLEAR` buttons.

**Expanded (click to expand):**
Ordered list of selected blocks. Each row shows:
- Index number
- Source document name (truncated)
- First ~60 characters of block text
- `↑` `↓` reorder buttons
- `−` remove button

**ASSEMBLE button:**
Creates a new document from clipboard contents in current order. New doc appears on the shelf and opens automatically. Clipboard clears.

**How blocks get here:**
Each block in the document view has a `+` button on its left margin. Press it, block goes to clipboard. If already selected, button shows `−` to remove. AI-produced blocks also land here.

---

## 3. Add AI Operation Bar

A single-line text input docked below the document view (above the clipboard tray). Terminal-style with a `>` prompt character.

**What it accepts:**
Free-form natural language. Examples:
- `summarize section 3`
- `find evidence about X in all docs`
- `compare Doc A and Doc B on topic Y`
- `rewrite this block as a formal paragraph`

**What it produces:**
New blocks that appear in the clipboard, tagged as `author: ai` with their operation type (extracted, summarized, synthesized). The user decides whether to keep, discard, edit, or reorder them before assembling.

**What it does NOT do:**
- Does not insert anything directly into any document
- Does not open a chat history panel
- Does not replace the document view

**Behavior:**
- Enter or `RUN` button submits
- Brief loading state ("thinking...")
- Results appear in clipboard immediately
- The prompt used is logged in the receipt

---

## 4. Add DOC | LOG Toggle

A small toggle in the toolbar area, top-right of the document view.

**DOC mode (default):**
Shows the document content — blocks rendered as styled markdown.

**LOG mode:**
Shows the receipt log for the current document. Plain-text chronological list. Each line:

```
timestamp    ACTION_TYPE    detail
```

Action types: `UPLOADED`, `LISTENED`, `EDITED`, `SELECTED`, `AI_QUERY`, `AI_RESULT`, `ASSEMBLED`, `DISCARDED`

No graphics. No charts. Just the log. This is the receipt made visible.

---

## 5. Add Block Visual Treatment

Each block in the document view gets a thin left-side color stripe indicating its type:

| Block Type | Stripe Color |
|---|---|
| Heading | White |
| Paragraph | Gray |
| List | Light blue |
| Quote | Amber |
| AI-generated | Green |
| Human-edited | Cyan |

**Currently playing block** gets a subtle full-width background highlight (low-opacity green). The view auto-scrolls to keep the playing block visible.

**Selected blocks** (in clipboard) get a green left border in addition to their type stripe.

---

## 6. Add Inline Edit Mode

A toggle button in the toolbar: `EDIT`.

**When active:**
- Blocks become editable in place (click to type)
- New blocks can be added (Enter at end of a block)
- Empty blocks can be deleted
- Edited blocks get their operation updated to `edited` and their stripe changes to cyan
- Edit events are logged in the receipt

**When inactive:**
- Blocks are read-only
- Click on a block jumps playback to that block

---

## 7. Player Sync Requirement

This is not a new component — the player already exists. But this behavior is critical:

- Playback must track which block is currently being spoken
- The corresponding block must be visually highlighted
- The document view must auto-scroll to keep the active block visible
- Clicking any block during playback jumps to that block
- If a block is edited, its cached audio is invalidated

The highlight-follows-reading pattern is what makes this a listening tool. Without it, it is just an editor with a play button.

---

## 8. What NOT to Build Yet

- No drag-and-drop (use `+` / `−` / `↑` / `↓` buttons)
- No file preview thumbnails
- No sidebar or multi-pane layout
- No chat history for AI interactions (just the input bar)
- No settings screen
- No user accounts or auth (keep existing if present)
- No export UI (keep for later, the data model supports it)

---

## 9. Layout Summary

```
┌──────────────────────────────────────┐
│  SHELF  [Doc A] [Doc B] [+ Upload]   │
├───────────────────────────────┬──────┤
│                               │ DOC  │
│  DOCUMENT VIEW                │ LOG  │
│  (blocks with stripes,        │      │
│   + / − selectors,            │ EDIT │
│   highlight on play)          │      │
│                               │      │
├──────────────────────────────────────┤
│  > AI prompt bar                     │
├──────────────────────────────────────┤
│  CLIPBOARD  3 blocks  [ASSEMBLE]     │
├──────────────────────────────────────┤
│  PLAYER  ◄15  ▶  30►  ━━●━━  1x  🔊│
└──────────────────────────────────────┘
```

One screen. Vertical stack. No side panels. The document is the interface.

---

## 10. Priority Order

1. Shelf (changes layout skeleton)
2. Clipboard tray (enables assembly — the core mechanic)
3. Block `+` / `−` selectors (feeds the clipboard)
4. AI bar (produces blocks into clipboard)
5. DOC / LOG toggle (makes receipts visible)
6. Block stripe colors (visual language)
7. Inline edit mode (enables modification)
8. Player sync polish (highlight + auto-scroll)

Items 1–3 are structural. Items 4–8 are additive. Ship 1–3 first and the tool is usable. Then layer the rest.
