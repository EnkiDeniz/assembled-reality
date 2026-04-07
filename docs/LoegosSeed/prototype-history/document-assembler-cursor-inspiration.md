# Document Assembler — UX Inspiration Spec

**Reference: Cursor IDE patterns applied to Document Assembler**
**April 3, 2026**

This document identifies specific UX patterns from Cursor that should inform the Document Assembler's interface. It is not about copying Cursor — it is about recognizing that Cursor solved many of the same structural problems (multiple sources, AI assistance, staging before committing, work history) and did it well.

Each section names the Cursor pattern, explains why it matters for us, and describes how to adapt it.

---

## 1. The Home Screen — Calm Entry

**What Cursor does:**
After launch, you see a centered screen with three action cards (Open project, Clone repo, Connect via SSH), a recent projects list (name + path, nothing else), and massive negative space. The screen is 70% empty. No sidebar. No panels. One job: get you into a project.

**Why it matters for us:**
The current build drops the user into the full workspace with every feature visible. That's like opening Cursor and seeing three panels, a terminal, and five tabs immediately. The entry point should be the simplest possible screen.

**How to adapt:**

After login, show a centered home screen:

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│          DOCUMENT ASSEMBLER              │
│                                          │
│   [ Upload a file ]  [ Start fresh ]     │
│                                          │
│   ─────────────────────────────────      │
│                                          │
│   RECENT                                 │
│   Project Plan              2 hours ago  │
│   Sarah's Research Notes    yesterday    │
│   Q1 Assembly               3 days ago   │
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

- Two action cards: "Upload a file" and "Start fresh" (empty document)
- Recent documents below: just title and relative time. No metadata, no block count, no file type icons
- Click a recent doc → opens the workspace with that doc loaded
- The workspace is never the landing page. The home screen is.

---

## 2. The Command Input — One Field, Multiple Powers

**What Cursor does:**
The bottom input bar reads: "Plan, @ for context, / for commands." One field does three things depending on how you start typing. `@` references a file for context. `/` triggers a specific command. Plain text starts a conversation with the AI.

**Why it matters for us:**
We currently have an AI prompt bar with separate operation chips (extract, summarize, synthesize, evidence search). The chips are good as suggestions, but the real power is a single input that understands context references and operation triggers.

**How to adapt:**

The AI bar should accept:

| Input | What happens |
|---|---|
| plain text | AI interprets freely, responds with blocks |
| `@Doc A` | References a specific document as context |
| `@all` | References all loaded documents |
| `/summarize` | Triggers a summary of the current doc |
| `/extract [topic]` | Pulls passages about a topic |
| `/compare` | Compares documents in context |
| `/synthesize` | Produces a new block combining sources |

**Examples of combined usage:**
- `@Project Plan summarize section 3`
- `@all find where both documents agree on deadlines`
- `/compare @Doc A @Doc B on coordination`
- `what's the main argument here?` (plain text, uses current doc as context)

**The operation chips** (extract, summarize, synthesize, evidence search) become autocomplete suggestions that appear when the user types `/`. They are shortcuts, not the only way in.

**Placeholder text:** `Ask something, @ to reference a doc, / for operations`

---

## 3. The Outline Panel — Document Navigation

**What Cursor does:**
The right panel shows an OUTLINE: a collapsible tree of all headings in the current file. Each heading is clickable — it jumps the editor to that section. The tree shows hierarchy (H1 > H2 > H3) with indentation.

**Why it matters for us:**
Long documents are hard to navigate, especially while listening. If a user is listening to a 40-block document and wants to jump to a specific section, they currently have to scroll. An outline lets them see the whole structure at a glance and tap to jump — both the view and the playback.

**How to adapt:**

Add a collapsible outline panel. Not always visible — toggled by a small button or keyboard shortcut (`o` for outline).

```
OUTLINE
├─ The Thesis
│  ├─ GitHub as coordination dataset
│  └─ The fossil record metaphor
├─ Assembly Index
│  └─ Measuring coordination complexity
└─ Implications
   └─ Receipts as biology
```

**Behavior:**
- Shows all headings from the current document as a tree
- Click any heading → document view scrolls to that section
- If audio is playing, clicking a heading also jumps playback to that section
- The currently-playing section is highlighted in the outline
- Collapsible: user can expand/collapse any branch
- Dismissible: user can hide the whole panel

**Position:** Right side of the screen, overlaying or pushing the document view. Only visible when toggled. Not permanent.

---

## 4. The Staged Changes Pattern — Review Before Commit

**What Cursor does:**
At the bottom of the editor, a small bar shows "2 Files · Review." It's the staging area — changes are collected, then reviewed and committed together. The bar is unobtrusive until you have staged changes, then it becomes visible with a count.

**Why it matters for us:**
This is exactly our clipboard. The clipboard should behave the same way: invisible when empty, visible when you've selected blocks, and expandable to review before assembling.

**How to adapt:**

The clipboard bar should follow this lifecycle:

1. **Empty:** completely hidden. No "Clipboard · 0 blocks" wasting space.
2. **First block selected:** bar appears at the bottom with `1 block · Assemble`. Subtle animation on first appearance.
3. **More blocks added:** count updates. `3 blocks from 2 docs · Assemble`.
4. **Click to expand:** shows the full list with reorder/remove controls.
5. **After assembly:** bar disappears again.

**Visual treatment:** Same position and weight as Cursor's "2 Files · Review" — a slim bar, bottom of the document area (above the player), not a whole panel.

---

## 5. The Agent History — Sessions as Collapsible Logs

**What Cursor does:**
The left sidebar shows past agent conversations as a list. Each entry has a title derived from what was done ("Project functionality overview", "User interface review"), a brief description, and a time marker (21d). Click to expand and see the step-by-step: "Thought briefly" → "Check git status" → "Stage changes" → "Push branch."

**Why it matters for us:**
This is our receipt history across sessions. Each time a user works with documents — listening, selecting, assembling — that session has a receipt. Over time, the user accumulates a history of what they've read, built, and proven.

**How to adapt:**

Add a session history view, accessible from the home screen or a sidebar toggle:

```
SESSIONS
─────────────────────────────────
Project Plan Review              2h ago
  LISTENED   Project Plan (12 min)
  SELECTED   3 blocks
  ASSEMBLED  "Key Takeaways"

Research Merge                   yesterday
  LISTENED   Doc A, Doc B
  AI_QUERY   "compare conclusions"
  ASSEMBLED  "Research Synthesis"

First Upload                     3 days ago
  UPLOADED   Project Plan
  LISTENED   full doc (18 min)
─────────────────────────────────
```

**Behavior:**
- Each session shows title + time (collapsed)
- Expand to see key receipt entries (not the full log — a summary)
- Click a session → opens the associated document with its full receipt log
- Sessions older than 30 days move to an "Archived" section, like Cursor does

This is not a priority for v0.2, but the data model should support it now so we can build it later.

---

## 6. The Status Bar — System Info in One Line

**What Cursor does:**
The very bottom of the screen shows one line: branch name, cursor position, language, encoding. All system info. Always visible but never attention-grabbing. Small text, low contrast.

**Why it matters for us:**
The current build shows AUTH · ACTIVE, VOICE · SEVEN, GETRECEIPTS · CONNECTED, and block count in the header area. That is system telemetry competing with user-facing content. It should live in a status bar.

**How to adapt:**

One line at the very bottom of the screen, below the player:

```
ELEVEN · CONNECTED   │   499 blocks   │   GETRECEIPTS · ACTIVE
```

- Small monospace text, dim color (30-40% opacity)
- Only shows what's relevant: voice engine, block count, receipt connection
- If something goes wrong (ElevenLabs quota exceeded, GetReceipts disconnected), the relevant indicator turns amber or red — that's how the user learns something changed, not through a modal
- Auth status is never shown here. If you're logged in, you're logged in.

---

## 7. Tab Bar for Multiple Documents

**What Cursor does:**
Multiple files open as tabs at the top of the editor. Active tab is highlighted. Tabs can be closed. New tabs open from the file tree or search.

**Why it matters for us:**
The current shelf pills serve this function but could be stronger as a proper tab bar. Tabs are a universally understood pattern for "I have multiple things open."

**How to adapt:**

Replace the shelf pills with a tab bar:

```
[ Project Plan ✕ ]  [ Sarah's Notes ✕ ]  [ ● Key Takeaways ✕ ]  [ + ]
```

- Active tab has a bottom border highlight
- Assembly documents get a green dot (●) prefix
- `✕` to close a document (not delete — just remove from workspace)
- `+` opens the upload dialog or creates a blank document
- Tabs are reorderable by drag (optional, low priority)
- If too many tabs, they scroll horizontally with overflow arrows

This is the standard tab bar pattern. No invention needed. Just adopt it.

---

## 8. Preview / Raw Toggle

**What Cursor does:**
A "Preview" / "Markdown" toggle in the editor header lets you switch between rendered and raw views of the same file.

**Why it matters for us:**
We have DOC / LOG. Adding a RAW view would let users see and edit the actual markdown source, which is useful for power users who want to fine-tune formatting.

**How to adapt:**

Three view modes toggled in the toolbar:

| Mode | What it shows |
|---|---|
| DOC | Rendered markdown with block stripes, playback sync, `+`/`−` selectors |
| LOG | Receipt log — timestamped action list |
| RAW | Raw markdown source — editable as plain text |

**Priority:** Low. DOC and LOG are the core views. RAW is a power-user addition for later.

---

## Summary — Steal List, Ranked by Impact

| Priority | Pattern | What to build |
|---|---|---|
| 1 | Home screen | Calm entry with Upload / Start fresh / Recent docs |
| 2 | Staged changes | Clipboard hidden when empty, appears on first selection |
| 3 | Status bar | System info in one dim line at the bottom |
| 4 | Command input | `@doc` references and `/operation` triggers in the AI bar |
| 5 | Tab bar | Replace shelf pills with standard tab bar |
| 6 | Outline panel | Collapsible heading tree for navigation and playback jump |
| 7 | Session history | Past sessions as collapsible receipt summaries |
| 8 | Raw toggle | Add RAW markdown view alongside DOC and LOG |

Items 1-3 should ship in v0.2. Items 4-6 in v0.3. Items 7-8 are nice-to-haves.

---

## Reference

- Concept doc: `document-assembler-concept.md`
- Full spec: `document-assembler-spec-v1.md`
- Add-on spec: `document-assembler-addon-spec.md`
- v0.1 Feedback: `document-assembler-v01-feedback.md`
- Intro prototype: `document-assembler-intro.jsx`
