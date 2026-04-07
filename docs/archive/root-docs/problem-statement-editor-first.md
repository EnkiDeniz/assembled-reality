# Problem Statement: The Center Pane Is Not an Editor

**Date:** April 6, 2026
**Context:** The product claims to be an IDE. The center pane renders like a dashboard.

---

## The Problem from First Principles

Start with what an editor is. Not what features it has. What it *is*.

An editor is a surface where the authored object fills the available space and everything else exists to serve it. The authored object is the primary visual element. The user's eyes go to their content first, metadata second, tools third.

This is true for every editor humans have used for decades:
- A text editor: the text starts at line 1, fills the screen
- A code editor: the code is the center, line numbers are the gutter
- A word processor: the document is the page, toolbars are above
- A spreadsheet: the cells fill the viewport
- A music DAW: the timeline fills the center

The authored object is always the biggest, most visually prominent thing on screen. Everything else is smaller, quieter, and peripheral.

Now look at what happens in our center pane for a single block:

```
EDITOR                                    SEED OF SEEDS
Write the current block stack.
The center stays for authored blocks.
Diagnostics, compile state, and seal readiness stay beside it.

                    Seed of seeds

              SEED  0 BLOCKS  SEED OF SEEDS
              SEED  1 BLOCK   0% CONVERGENCE
                                          🗑

001  1 · ASSEMBLY IMPORTED
  ┌─────────────────────────────────┐
  │ No content yet.                 │
  └─────────────────────────────────┘
  BLUR OR CMD/CTRL+ENTER TO SAVE
  STORY CONFIRMED  working tag · story
  Authored here  Seed of seeds

  △ READS AS AIM  GREEN
  ⚠ WARN  Operator sentence length is outside...
  ⚠ WARN  Sentence is semantically ungrounded...

  Keep draft  Accept read  Recast tag  Stage into weld  Open witness
```

Count the layers above the first editable character:
1. Section header ("EDITOR / Write the current block stack")
2. Section description ("The center stays for authored blocks...")
3. Seed title ("Seed of seeds")
4. Metadata chips (SEED · 1 BLOCK · 0% CONVERGENCE)
5. Delete button
6. Block number + status label (001 · ASSEMBLY IMPORTED)

Six layers of chrome before the user's first word.

Then below the content:
7. Save instruction
8. Confirmation status + tag
9. Authorship attribution
10. Shape parse result
11. Two warnings
12. Five action buttons

Twelve layers of metadata wrapping a single textarea.

**The content is 5% of the visual weight. The chrome is 95%.**

In Cursor, the code starts at line 1 and fills the viewport. In VS Code, the code starts at line 1 and fills the viewport. In every real editor, the authored content is the main character.

In our center pane, the authored content is a supporting actor buried under six layers of context.

---

## Why This Happened

It happened because we built the product from the inside out.

We started with the data model (blocks, tags, domains, confirmation status, provenance, shape parsing). Then we built the view model (badges, chips, metadata lines). Then we put the view model on screen. Every piece of data we tracked became a visible element.

This is a natural engineering progression: the system knows things, so it shows things. But it violates the editor principle: **the authored object must be the primary visual element, and metadata must be subordinate to it.**

We built a data inspector that contains an editor, instead of an editor that can inspect data.

---

## What the First Principle Actually Says

The Assembled Reality first principle is: "People do not mainly lack information. They lack position."

The center pane gives the user maximum information and minimum position. Every block is surrounded by so much context that the user can't feel where they are in their own authored work. They can see the metadata about their content, but they can't see their content clearly.

The editor should give the user position first — "here is your authored stack, here is where you are in it" — and information on demand.

---

## The Solution Shape

The solution is not "remove metadata." The metadata is real and useful. Shape parsing, inline diagnostics, confirmation status — these matter. The diagnostics rail on the right is correct.

The solution is **hierarchy inversion**: make the authored content the primary visual element and make everything else secondary.

### Principle 1: Content starts at the top

The first thing the user sees in the center pane should be their first block. Not a header. Not an explanation. Not metadata chips. The block stack starts at the top of the center pane and fills vertically downward.

If the seed has a title, it can appear as a quiet line above the stack — like a filename tab in Cursor. Not as a section header with description and chips.

### Principle 2: Block metadata goes in the gutter, not above or below

The block number, shape parse, confirmation status, and tag — these are gutter information. They sit beside the block, not above it and below it. Like line numbers in a code editor: always visible, never competing with the content.

```
001  △ aim · confirmed     | The box shows how you actually think,
                           | not how you believe you think.
002  □ reality · staged    | UCSF documented 12 hospitalizations
                           | in 2025.
003  œ weld · open         | The system confronts rather than
                           | validates.
```

The shape glyph, the status, and the tag compress into a gutter line. The content fills the remaining width.

### Principle 3: Diagnostics appear inline as gutter annotations, not as card sections

Warnings and parse results sit in the gutter next to the block they refer to, not in a section below the block. Like compiler warnings in a code editor — they appear as subtle inline markers, expandable on hover or click.

```
001  △ aim · confirmed     | The box shows how you actually think,
                           | not how you believe you think.
     ⚠ length outside 5-9 |
002  □ reality · staged    | UCSF documented 12 hospitalizations
                           | in 2025.
```

### Principle 4: Actions are contextual, not always visible

The five action buttons (Keep draft, Accept read, Recast tag, Stage into weld, Open witness) should not be visible on every block at all times. They appear when a block is selected or focused. Like a right-click context menu or a hover toolbar in Notion — the actions exist but don't take space until needed.

### Principle 5: The section header becomes a file tab

"EDITOR — Write the current block stack" is a description of what the editor does. An editor doesn't need to describe itself. The user knows they're editing.

Replace the header with a compact tab bar showing the active document name, like Cursor's file tabs:

```
 Seed of seeds ×  |  Assembled Reality  |  Operator Sentences
```

The tab tells you what you're editing. The tab doesn't explain what editing means.

### Principle 6: The save instruction is implicit

"BLUR OR CMD/CTRL+ENTER TO SAVE" — this is tooltip-level information. It should not be visible on every block. Show it once on first use, or on hover, or in a keyboard shortcut overlay. Not as persistent UI below every textarea.

---

## What This Means Concretely

**Before (current):**
- 6 layers of chrome above the first block
- 6 layers of metadata below each block
- ~5% content, ~95% chrome
- Feels like a dashboard that contains an editor

**After:**
- Block stack starts at the top of the center pane
- Gutter column holds block number + shape + status
- Content fills the remaining width
- Diagnostics are inline gutter annotations
- Actions appear on block selection
- Feels like an editor that can compile

The diagnostics rail on the right stays. The source tree on the left stays. Only the center pane changes — from a dashboard view of blocks to an authored block stack.

---

## The Test

Open Cursor. Open our workspace. Put them side by side. Ask: "Which one is the editor?"

If the answer isn't immediately obvious, the center pane isn't done.

---

## Closing

The product sentence says: "An IDE for turning promises, evidence, and decisions into receipts."

An IDE's center pane is an editor. Ours isn't yet. The diagnostics rail is a real compiler output panel. The source tree is a real project tree. But the center is still a decorated card view.

The authored block stack is the code. The gutter is the line numbers. The diagnostics rail is the build output. The seal is the commit.

Make the center pane behave like the editor it claims to be.
