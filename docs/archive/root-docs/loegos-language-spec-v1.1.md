# Lœgos Language Specification v1.1

**Date:** April 6, 2026
**Updated:** April 6, 2026 — reconciled with Founder Shell, single-buffer
default, accessibility baseline, weight simplification, chat as north star
**Status:** Canonical language spec
**Purpose:** Define Lœgos as a visual language for coordination that
renders directly on the user's text — not beside it, not beneath it, not
in a separate panel.

---

## How We Arrived Here

This spec did not start as a language design exercise. It started as a
product that kept building the wrong surface.

### The dashboard phase

The first workspace rendered coordination state as a dashboard: cards,
badges, chips, panels, mode selectors, metadata sections. Every piece
of data the system knew became a visible UI element. The result was
powerful and illegible — a control room where the user could see
everything but understand nothing at a glance.

### The IDE phase

The next attempt reframed the workspace as an IDE. The object model was
settled: Box = repo, Artifact = file, Block = line, Operate = compiler,
Seal = commit, Receipt = build artifact. The layout followed Cursor and
VS Code: file tabs, breadcrumb, project tree, editor, diagnostics rail,
status bar. This was structurally correct but still treated Lœgos
concepts as metadata displayed alongside text, not as properties of the
text itself.

### The founder shell phase

The next attempt stripped the IDE chrome for first-time users. The
Founder Shell showed one artifact, one read panel, one player, one
assistant, one next step. This was experientially calmer but still
separated "your text" from "the system's read" as two different things.

### The translation insight

The breakthrough came from a simple comparison: in VS Code, a developer
doesn't see "code" on the left and "analysis" on the right. They see
one surface where the text IS the analysis. `function` is purple.
`OutcomeStep` is yellow. `async` is purple. The color, the shape, the
weight — they ARE the language.

### The correction (v1 → v1.1)

v1 of this spec described a dual-pane layout: human language on the
left, Lœgos language on the right. Three reviewers independently
flagged this as contradicting the VS Code analogy. In VS Code there
is one editor, not two. The syntax highlighting is on the code itself.

v1.1 corrects this. The default rendering is a **single buffer** where
Lœgos properties (color, shape, weight) apply directly to the user's
text. The dual-pane "translator view" becomes an optional advanced mode,
not the default experience.

### The triangulation principle

Meaning is not in any single representation. It lives in the space
between representations:

1. **Human language** — what the user wrote
2. **Lœgos language** — what the system sees (rendered inline on the same text)
3. **Reality** — what the world returned

The product makes meaning visible by rendering the gap between 1 and 2
on a single surface, then closing it with 3.

---

## The Language

Lœgos is a visual language with three simultaneous dimensions rendered
on the user's own text:

1. **Color** — what signal does this carry?
2. **Shape** — what role does this play?
3. **Weight** — how verified and deep is this?

These are not metadata displayed beside the text. They are rendering
properties of the text itself.

---

## Dimension 1: Color (Signal)

Color encodes the evidence state of a text fragment. It answers:
**how grounded is this claim?**

### Signal states

| Signal | Color | Hex | Meaning |
|---|---|---|---|
| **Green** | Clear green | `#66d278` | Grounded. Local evidence supports this claim. |
| **Amber** | Warm amber | `#efb54e` | Partial. Evidence exists but incomplete. |
| **Red** | Alert red | `#ec5e54` | Unsupported or contradicted. |
| **Neutral** | Muted gray | `#8a8d96` | Uninformed. Not yet evaluated. |
| **Attested** | Cool gray | `#a0a4ae` | Human-asserted. Never masquerades as green. |

### Transition rules

- Once informed (green/amber/red), never returns to neutral.
- Attested is a distinct state, not a color override.
- Signals change only when evidence changes.

### Accessibility baseline (v1 requirement, not v2)

Color alone is not sufficient. Every signal state must also be
distinguishable through a non-hue channel:

| Signal | Primary (color on text) | Secondary (non-hue) |
|---|---|---|
| Green | Green text | Solid left-rule (2px) |
| Amber | Amber text | Dashed left-rule (2px) |
| Red | Red text | Dotted left-rule (2px) + subtle underline |
| Neutral | Gray text | No rule |
| Attested | Cool gray text | Dash-dot left-rule (2px) |

The secondary channel must ship in v1. It is not optional polish.
Color-blind users, low-contrast displays, and screen readers must be
able to distinguish signal states without relying on hue alone.

Additionally, each signal state must be available as an explicit text
label on focus or hover: "Grounded," "Partial," "Unsupported,"
"Uninformed," "Attested." This serves screen readers and users who
prefer explicit labels.

### Application

Signal color is applied to the **text itself**. On a dark background,
colored text is immediately scannable. This is the primary channel.
The secondary non-hue channel (left rules, underline patterns) runs
alongside for accessibility.

---

## Dimension 2: Shape (Type)

Shape encodes the structural role of a text fragment. It answers:
**what is this text doing in the coordination?**

### Shape types

| Shape | Glyph | Name | Role |
|---|---|---|---|
| **Aim** | `△` | Triangle | Declaration of intent, direction, target |
| **Reality** | `□` | Square | Evidence, observation, measurement, witness |
| **Weld** | `œ` | OE ligature | Convergence, bridge between aim and reality |
| **Seal** | `𒐛` | Cuneiform seal | Closure, commitment, proof action |

### Rendering

Shape glyphs appear inline at the start of a block, like keywords in
code:

```
△ Build a workspace that shows where intention and evidence diverge.
□ UCSF documented 12 hospitalizations in 2025.
œ The system confronts rather than validates.
𒐛 Sealed receipt: share prototype for feedback.
```

### Glyph fallback (v1 requirement)

Not all fonts, platforms, or screen readers handle these glyphs cleanly.
v1 must include a fallback presentation:

| Glyph | Fallback label | When used |
|---|---|---|
| `△` | `Aim·` | Font missing, screen reader, learner mode |
| `□` | `Re·` | Font missing, screen reader, learner mode |
| `œ` | `Weld·` | Font missing, screen reader, learner mode |
| `𒐛` | `Seal·` | Font missing, screen reader, learner mode |

A `learner mode` toggle replaces glyphs with plain labels everywhere.
Expert users see glyphs. New users see words. Both are always available.

### Shape as type system

Shapes are types, not categories. A `□ Reality` block has different
rules than a `△ Aim` block:

| Property | △ Aim | □ Reality | œ Weld | 𒐛 Seal |
|---|---|---|---|---|
| Can exist without evidence | Yes | No | Requires △ + □ | Requires œ + convergence + trust |
| Can be attested | Yes | Yes (weakens trust) | Yes (weakens convergence) | No |
| Precondition | None | None | ≥1 △ and ≥1 □ in scope | Weld + convergence ≥ threshold + trust ≥ L2 |

### Type inference and mismatch

The system infers shape from content. The user is the type authority
and can recast. If a `□ Reality` block reads as pure intention, the
system flags: "This block is typed as Reality but reads as Aim."

---

## Dimension 3: Weight (Trust × Depth)

Weight encodes how verified and how worked a text fragment is. It
answers: **how much should I trust this?**

### v1 simplified weight (3 states, not 12)

v1 renders three perceptible weight states. The full 3×4 grid
(3 trust × 4 depth) is the formal model, but the visual rendering
collapses it into three steps for v1:

| Weight | Visual | When | Formal range |
|---|---|---|---|
| **Light** | Thin font, wider spacing | Unverified and/or just collected | L1 × D1-2 |
| **Normal** | Regular font, standard spacing | Has provenance and/or has been shaped | L2 × D1-3, L1 × D3 |
| **Strong** | Bold font, tighter spacing | Proved and/or sealed | L3 × any, or any × D4 |

The full 12-state grid remains in the formal model for future
expansion. If user testing shows people can distinguish more than
three weight levels, the grid expands. Until then, three steps.

### Weight never decreases

Once a block reaches Normal, it never goes back to Light. Once it
reaches Strong, it never goes back to Normal. This creates a visual
ratchet: text gains substance over time.

---

## The Single Buffer

### Default: one surface, inline rendering

The primary Lœgos experience is a **single text surface** where the
user's own words carry color, shape, and weight directly.

There is no separate "human language" panel and "Lœgos language" panel.
There is one editor. The text in that editor is rendered in Lœgos
language. This is exactly how syntax highlighting works in every code
editor: one buffer, properties on the text.

```
△ I want to hack the code of reality               [amber, light]
  ⚠ High aspiration, low specificity

□ The core product problem is misalignment          [green, normal]
  between thought-shape and reality-shape.
  ✓ Witness: Assembled Reality

œ The echo teaches that reality speaks in           [amber, light]
  receipts, not in agreement.
  ⚠ Canon reference, not yet tested in this box

□ Melih replied "ok, bakicam" — prototype seen.     [green, normal]
  ✓ WhatsApp evidence attached
```

The shape glyph is inline. The signal color is on the text. The weight
determines font rendering. Inline annotations (⚠, ✓) appear below the
block like compiler warnings in a code editor — visible but secondary.

### Toggle: plain mode

The user can toggle to plain mode (like disabling syntax highlighting).
In plain mode, text renders without color, without shape glyphs, without
weight variation. Just their words. Almost nobody will use this, but it
must exist for the same reason VS Code lets you turn off highlighting.

### Advanced: translator view (split pane)

Power users can split the editor into two panes:

- Left: plain text (their prose, editable)
- Right: Lœgos rendering (same text, inline properties, read-only mirror)

This is the "diff view" or "translator view." It's useful for learning
the language (watch the right side change as you edit the left) and for
comparing intention vs structural truth. But it is not the default. The
default is one buffer.

### Mobile

On mobile, the single buffer is the only view. No split pane. The user
taps a block to see the explainability detail in a bottom sheet. Glyph
+ color + weight render inline. The bottom sheet shows: signal, shape,
rationale, evidence, what's missing.

---

## The Explainability Layer

Every rendered block is backed by an inspectable evidence chain. Click
or tap any block to see:

- **Signal rationale:** Why this color? What evidence was checked?
- **Shape rationale:** Why this type? What language pattern triggered it?
- **Trust chain:** What provenance exists?
- **Depth history:** How many operations has this block been through?
- **Evidence:** Specific source passages that support or contradict
- **What would change the signal:** What's missing

This is not a separate app. It is the room behind each word. On
desktop, it opens as a side panel or popover. On mobile, it opens as
a bottom sheet.

The explainability layer IS the workspace. When the user wants deeper
tools — source management, receipt history, seal flow, box coordination
— they access them through the evidence chain behind a block, not
through a separate navigation system.

---

## Seed State Summary

Below the rendered text (or at the bottom of the explainability panel),
the system shows a live-computed seed state:

```
────────────────────────
SEED STATE
  Aim:     declared, partially grounded
  Here:    3 sources, 1 external contact
  Gap:     no sealed receipt, 1 red block
  Sealed:  nothing yet
  Next:    resolve the red block or attest it
────────────────────────
```

This is not a form. It is a live derivation from the rendered blocks.
It updates as the text changes. It tells the user where they stand and
what comes next.

---

## How This Layers With Founder Shell

The language spec and the Founder Shell spec are not competing. They
layer:

| Layer | What it defines | What it doesn't define |
|---|---|---|
| **Founder Shell** | The container: one artifact, one read panel, one player, one assistant, one CTA, one escape hatch | How text renders inside the container |
| **Language Spec** | How text renders: color, shape, weight, inline annotations, explainability | The container, the journey, the routing |

### Explicit merge rules

1. **The Founder Shell journey remains:** Start → Source View → Seed →
   Full Box. The language rendering applies inside every surface. It
   does not replace the journey.

2. **Source View renders in Lœgos language.** When the user views a
   source, the text carries shape glyphs, signal colors, and weight.
   The user sees their pasted text with Lœgos properties inline. This
   replaces the previous "calm plain text" approach — but the surface
   is still calm because there's no dashboard chrome, just colored text.

3. **Seed View renders in Lœgos language.** The seed editor shows blocks
   with inline color, shape, and weight. Editing a block triggers
   recompilation of its properties.

4. **The read panel becomes the explainability layer.** The Founder
   Shell's right rail / bottom sheet shows the evidence chain for the
   selected block. This is the same content the language spec calls
   "the explainability layer."

5. **The next-step CTA derives from the seed state summary.** Same as
   Founder Shell spec. Same source: the live computation of aim/here/
   gap/sealed from the rendered blocks.

6. **Full Box is the explainability layer opened fully.** When the user
   needs source trees, receipt history, assembly lane, diagnostics
   depth — they hit the escape hatch and enter Full Box. Full Box shows
   the same language rendering but with the full workspace chrome.

---

## Minimum Addressable Unit

The language renders at the **block** level, not the character level.

A block is the smallest unit that carries shape, signal, and weight.
Within a block, the system may highlight **spans** (specific phrases)
with different signals — but spans inherit their block's shape and
weight. Spans are subordinate to blocks.

This matches the current implementation: Operate evaluates blocks,
the overlay attaches findings to blocks, and overrides target blocks
(with optional span offsets).

The spec's earlier statement "every rendered character carries type,
signal, and trust" is the north star. The v1 implementation unit is
the block.

---

## North Star: Conversational Mode

If the language rendering is formally correct, the primary interaction
can eventually become conversational:

**User writes → text renders in Lœgos → user asks Seven about a block →
Seven explains the evidence → user revises → rendering updates**

This collapses the workspace into: one text input, one rendered surface,
one assistant, one explainability layer. Everything else lives behind
drill-in.

**This is a north star, not a v1 deliverable.** v1 ships the renderer.
The conversational mode becomes possible once the renderer is proven
legible. Building both simultaneously risks over-investing in chat
before the language works visually.

---

## Formal Grammar Summary

| Dimension | Encodes | Visual channel | v1 states |
|---|---|---|---|
| **Color** | Signal | Text color + left-rule pattern | green, amber, red, neutral, attested |
| **Shape** | Type | Inline glyph prefix (or fallback label) | △ aim, □ reality, œ weld, 𒐛 seal |
| **Weight** | Trust × Depth | Font weight + spacing | light, normal, strong |

| Rule | Description |
|---|---|
| Single buffer default | Lœgos renders on the user's text, not beside it |
| Signal irreversibility | Once informed, never returns to neutral |
| Color on text | Signal color on the words, secondary non-hue channel alongside |
| A11y baseline | Left-rule patterns + hover/focus labels ship in v1 |
| Shape as type | Glyphs are type annotations with fallback labels |
| Learner mode | Toggle glyphs → plain labels |
| Weight simplified | 3 visual steps (light/normal/strong) for v1 |
| Weight monotonic | Weight never decreases |
| Shape mismatch | System flags when text reads differently than declared type |
| Evidence enforcement | LLM green without surviving evidence → downgrade to amber |
| Coverage honesty | Partial evaluation is disclosed |
| Override separation | Attested ≠ green, visually and structurally |
| Block as unit | Block is the minimum addressable unit; spans are subordinate |
| Chat as north star | Conversational mode is future; renderer ships first |

---

## The Five-Second Test

Show a non-author a screenshot of Lœgos-rendered text. Can they tell,
in five seconds, which lines are strong and which are weak?

If yes: the language works. Ship it.
If no: simplify the rendering until it does.

The backend is done. The trust rules are enforced. The language is
defined. The only remaining question is whether a human can read it
at a glance.

---

## Implementation Path

### v0.1: Shape + Signal only

- Inline shape glyphs on blocks
- Signal color on text
- Left-rule accessibility patterns
- Learner mode toggle
- Tap/click block → explainability panel
- No weight rendering yet
- Mount inside Founder Shell center pane

### v0.2: Add weight

- Three-step weight rendering (light / normal / strong)
- Visual ratchet behavior
- Seed state summary below the text

### v0.3: Recompilation

- Live re-rendering when user edits text
- Operate triggered by edit with debounce
- Signal transitions visible in real time

### v0.4: Translator view (advanced)

- Optional split pane for power users
- Plain text left, Lœgos rendering right
- Linked editing

### Future: Conversational mode

- Chat-first interaction with inline rendering
- Seven as primary interface with explainability behind every response

---

## One-Line Position

Lœgos is not a dashboard language and not a metadata language. It is a
visual coordination language that renders directly on the user's own
text — color for signal, shape for type, weight for trust — the same
way syntax highlighting renders directly on source code. One buffer.
The text IS the analysis.
