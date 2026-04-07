# Lœgos Language Specification v1

**Date:** April 6, 2026
**Status:** Canonical language spec
**Purpose:** Define Lœgos as a visual language for coordination — not a
UI system, not a dashboard framework, but a language that renders human
text as typed, colored, weighted coordination code.

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
separated "your text" (left) from "the system's read" (right) as two
different things shown side by side.

### The translation insight

The breakthrough came from a simple comparison: in VS Code, a developer
doesn't see "code" on the left and "analysis" on the right. They see
one surface where the text IS the analysis. `function` is purple.
`OutcomeStep` is yellow. `async` is purple. `React.ChangeEvent` is
green. The color, the shape, the weight — they ARE the language. A
developer reads structure by scanning color patterns, not by reading
metadata panels.

Lœgos should work the same way. The user writes in natural language.
The system renders that same text in Lœgos language — where color
encodes signal, inline glyphs encode type, and weight encodes trust
and depth. The user doesn't study the language. They learn it by
watching their words change state as they write.

### The triangulation principle

The product's deepest document — "Triangulating Meaning" — says meaning
is not in any single representation. It lives in the space between
representations. Lœgos language is the second vertex of a triangle:

1. **Human language** — what the user wrote (prose, intention, assertion)
2. **Lœgos language** — what the system sees (typed, signaled, evidenced)
3. **Reality** — what the world returned (receipts, evidence, contact)

The product makes meaning visible by rendering the gap between vertex 1
and vertex 2, then closing it with vertex 3.

---

## The Language

Lœgos is a visual language with three simultaneous dimensions rendered
on every piece of text:

1. **Color** — what signal does this carry?
2. **Shape** — what role does this play?
3. **Weight** — how verified and deep is this?

These three dimensions are not metadata displayed beside the text. They
are properties of the text rendering itself, the same way syntax
highlighting is a property of code rendering.

---

## Dimension 1: Color (Signal)

Color encodes the evidence state of a text fragment. It answers:
**how grounded is this claim?**

### Signal states

| Signal | Color | Hex | Meaning | Can transition to |
|---|---|---|---|---|
| **Green** | Clear green | `#66d278` | Grounded. Local evidence supports this claim. | Amber or red if contradicted. Never back to neutral. |
| **Amber** | Warm amber | `#efb54e` | Partial. Evidence exists but is incomplete, or the claim is partially supported. | Green (with more evidence) or red (if contradicted). Never back to neutral. |
| **Red** | Alert red | `#ec5e54` | Unsupported or contradicted. No local evidence backs this claim, or evidence actively contradicts it. | Amber or green with new evidence. Never back to neutral. |
| **Neutral** | Muted gray | `#8a8d96` | Uninformed. The system has not yet evaluated this text. | Any signal. This is the only starting state. |
| **Attested** | Distinct cool gray | `#a0a4ae` | Human-asserted. The user overrides the system's read with an explicit attestation. Never masquerades as green. | Can be withdrawn. Returns to the underlying signal. |

### Irreversibility rule

Once a signal moves from neutral to any informed state (green, amber,
or red), it cannot return to neutral. The system has formed an opinion.
That opinion can change with new evidence, but the text can never go
back to "uninformed." This prevents silent regression of knowledge.

### Application

Signal color is applied to the **text itself**, not to a border, badge,
or background. On a dark background, colored text is immediately
scannable. Colored borders are nearly invisible. The color must be on
the words.

```
Green text:  "the core product problem is misalignment"
Amber text:  "I want to hack the code of reality"
Red text:    "no contact with anyone who isn't me"
Neutral text: (unevaluated passage)
Attested:    "Melih replied — the prototype was seen"
```

### Scanning behavior

An expert reads Lœgos text the way a developer reads code: by scanning
color patterns, not by reading every word.

| Pattern | Meaning at a glance |
|---|---|
| Wall of amber | Mostly ungrounded. Heavy on declaration. |
| Column of green with one red line | Mostly solid with one problem. |
| Mix of amber and red, no green | Aspiration without evidence. |
| Green turning to amber downward | Starts grounded, drifts into assertion. |
| Red block surrounded by green | One critical gap in an otherwise solid assembly. |

---

## Dimension 2: Shape (Type)

Shape encodes the structural role of a text fragment. It answers:
**what is this text doing in the coordination?**

### Shape types

| Shape | Glyph | Name | Role | In code terms |
|---|---|---|---|---|
| **Aim** | `△` | Triangle | Declaration of intent, direction, specification, target. What the user is trying to make real. | Function declaration, interface definition |
| **Reality** | `□` | Square | Evidence, observation, measurement, witness. What the world returned. | Data, input, test result |
| **Weld** | `œ` | OE ligature | Convergence, bridge, comparison. Where aim meets reality and produces a relation. | Function body, transformation, merge |
| **Seal** | `𒐛` | Cuneiform seal | Closure, commitment, proof action. The irreversible act of committing a proved relation. | Commit, publish, deploy |

### Rendering

Shape glyphs appear inline at the start of a text fragment, the same
way keywords appear at the start of a code statement. They are part of
the text, not badges beside it.

```
△ Build a workspace that shows where intention and evidence diverge.
□ UCSF documented 12 hospitalizations in 2025.
œ The system confronts rather than validates.
𒐛 Sealed receipt: share prototype for feedback.
```

### Shape as type system

Shapes are not categories or folders. They are types in a coordination
type system. A block typed as `□ Reality` has different rules than a
block typed as `△ Aim`:

| Property | △ Aim | □ Reality | œ Weld | 𒐛 Seal |
|---|---|---|---|---|
| Can exist without evidence | Yes | No — should carry provenance | Requires aim + reality | Requires weld + convergence + trust |
| Signal starts at | Neutral or amber | Neutral (awaiting check) | Neutral (awaiting comparison) | Only after preflight passes |
| Can be attested | Yes | Yes, but weakens trust | Yes, but weakens convergence | No — seal is system-verified |
| Precondition | None | None | At least one △ and one □ in scope | Weld exists, convergence ≥ threshold, trust ≥ L2 |

### Type inference

The system can infer shape from text content. When a user writes "I
want to build X," the system can suggest `△ Aim`. When a user pastes
an email or a screenshot description, the system can suggest `□ Reality`.
The user can accept or recast the shape. The system's inference is a
suggestion; the user is the type authority.

### Shape mismatch detection

If a block typed as `□ Reality` contains language that reads as pure
intention ("I want to...", "We should...", "The goal is..."), the
system flags a shape mismatch: "This block is typed as Reality but
reads as Aim." This is the equivalent of a type error in a programming
language.

---

## Dimension 3: Weight (Trust × Depth)

Weight encodes how verified and how worked a text fragment is. It
answers: **how much should I trust this, and how much work has gone
into it?**

### Trust levels

Trust measures provenance — where did this claim come from and how
verified is its source chain?

| Level | Name | Visual weight | Rule |
|---|---|---|---|
| **L1** | Unverified | Light / thin | Exists but has no provenance chain. Self-declared. |
| **L2** | Partial | Normal / regular | Has provenance or secondary confirmation. |
| **L3** | Verified | Bold / strong | Has provenance, ≥ 2 independent sources, and survived Operate. |

### Depth levels

Depth measures assembly history — how much work has this text been
through?

| Level | Name | Visual density | Rule |
|---|---|---|---|
| **1** | Collected | Sparse, light spacing | The text exists with content. Just entered the box. |
| **2** | Shaped | Normal spacing | The text was edited, contested, compared, or rewritten. |
| **3** | Proved | Dense, tighter spacing | The text survived Operate, gained support, or reached trust L2+. |
| **4** | Sealed | Solid, immutable feel | The text entered a valid seal operation. Depth never decreases. |

### Combined rendering

Trust and depth combine into a single visual weight property:

```
L1 + Depth 1: thin, light, sparse    — just pasted, unverified
L2 + Depth 2: normal, regular        — has provenance, been shaped
L3 + Depth 3: bold, dense            — verified, proved
L3 + Depth 4: bold, solid, immutable — sealed, permanent record
```

The visual progression from L1/D1 to L3/D4 should feel like text
gaining substance — going from a tentative whisper to a solid
declaration. Like the difference between a code comment and a tested
function signature.

### Weight never decreases

Like depth in the formal core, visual weight never decreases. Once a
block has been proved and rendered at L3 density, it stays there even
if the user views it in a different context. This prevents the visual
language from silently losing information.

---

## The Three Dimensions Together

A single line of Lœgos text carries all three dimensions simultaneously:

```
△ Build a workspace that shows where intention and evidence diverge.
│ │                                                                │
│ │                        amber text (signal)                     │
│ │                        normal weight (L2, depth 2)             │
│ shape glyph (aim)                                                │
```

Compare with:

```
□ UCSF documented 12 hospitalizations in 2025.
│ │                                            │
│ │              green text (signal)           │
│ │              bold weight (L2, depth 3)     │
│ shape glyph (reality)                        │
```

And:

```
œ The system confronts rather than validates.
│ │                                          │
│ │          amber text (signal)             │
│ │          light weight (L1, depth 1)      │
│ shape glyph (weld)                         │
```

A Lœgos-literate reader scans this the way a developer scans code:

- The shape glyphs tell you the type structure (all aim? aim + reality
  but no weld? weld without reality?)
- The colors tell you the evidence state (mostly green = solid, mostly
  amber = ungrounded, any red = problem)
- The weight tells you the maturity (thin light text = fresh and
  unverified, bold dense text = proved and trusted)

---

## The Live Translation

The product renders two views of the same content simultaneously:

### Left panel: Human language

The user's authored text. Natural prose. Editable. No system
annotations. This is what the user wrote in their own words.

### Right panel: Lœgos language

The same content, translated into typed, colored, weighted coordination
code. Each sentence or paragraph becomes a block with its shape glyph
prefix, signal color, and trust/depth weight. Inline annotations appear
as subtle marks — the equivalent of squiggly underlines in a code
editor.

### Live linking

When the user edits the left panel, the right panel recompiles. Change
a vague aim into a specific one, and watch the amber shift toward green.
Add evidence, and watch a red block gain a source witness. Rewrite a
claim to be testable, and watch the weight increase as the system finds
source support.

The user never has to learn Lœgos language explicitly. They learn it by
watching the translation change as they write. The same way a new
developer learns syntax highlighting by noticing what turns purple
(keyword), what turns yellow (function name), and what turns red
(error).

### Below the translation: Seed state

The bottom of the right panel shows the derived seed state — a live
computation of where the user's text stands:

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

This is not a form the user fills in. It is a live summary derived from
the translation. It updates as the text changes.

---

## The Explainability Layer

Every colored, shaped, weighted block in the Lœgos translation is
backed by an inspectable evidence chain. Click any block in the right
panel to see:

- **Signal rationale:** Why this color? What evidence was checked?
- **Shape rationale:** Why this type? What language pattern triggered it?
- **Trust chain:** Where did this come from? What provenance exists?
- **Depth history:** How many operations has this block been through?
- **Evidence:** Specific source passages that support or contradict
- **What would change the signal:** What evidence is missing

This is the "huge explainability layer in the back" — every rendering
decision is traceable, every signal is auditable, and the user can
drill into any block to understand why the system rendered it that way.

The explainability layer IS the workspace. When the user wants to go
deeper, they don't switch to a different product — they click into the
evidence behind the language. The translation is the front door. The
evidence chain is the room behind each word.

---

## The Chat Implication

If the language rendering is formally correct — if every block carries
its type, signal, trust, and depth as intrinsic visual properties —
then the primary interaction can become conversational:

**User writes natural language → system renders Lœgos translation →
user sees what's grounded and what's floating → user asks Seven about
specific blocks → Seven explains the evidence chain → user revises →
translation updates → loop continues**

The workspace becomes a chat with an AI that shows its work as a live
visual language. The Founder Shell collapses into:

1. **A text input** (write or paste your prose)
2. **A live translation** (your prose in Lœgos language)
3. **A chat** (ask Seven about any block)
4. **An explainability layer** (drill into evidence behind any rendering)

Everything else — source management, receipts, seal flow, box
coordination — lives in the explainability layer. You access it when
you need it by clicking into a block, not by navigating to a separate
surface.

---

## Formal Grammar Summary

| Dimension | What it encodes | Visual channel | States |
|---|---|---|---|
| **Color** | Signal (evidence state) | Text color | green, amber, red, neutral, attested |
| **Shape** | Type (coordination role) | Inline glyph prefix | △ aim, □ reality, œ weld, 𒐛 seal |
| **Weight** | Trust × Depth | Font weight + spacing density | L1-L3 trust × 1-4 depth = thin→bold, sparse→solid |

| Rule | Description |
|---|---|
| Signal irreversibility | Once informed, never returns to neutral |
| Color on text | Signal color goes on the text itself, never only on borders |
| Shape as type | Shapes are type annotations, not categories or folders |
| Weight never decreases | Trust and depth are monotonically non-decreasing |
| Type inference | System suggests shapes; user is the type authority |
| Shape mismatch | System flags when text reads differently than its declared type |
| Evidence enforcement | If LLM says green but evidence didn't survive validation, signal downgrades to amber |
| Coverage honesty | If not all blocks were evaluated, the system says so |
| Override separation | Attested blocks render distinctly; never masquerade as green |

---

## What This Enables

### For new users

They paste text. They see it rendered in color. They notice what's
green and what's red. They click a red block and see why. They rewrite
and watch the color change. They never read a manual. The language
teaches itself through visual feedback.

### For expert users

They scan the color pattern and immediately know the state of the
assembly. A wall of amber means "ungrounded." Green with one red
means "one problem to fix." They read the shape glyphs and know
the structural balance — all aims and no reality means "no evidence
yet." They feel the weight and know the maturity — thin text is
fresh, bold text is proved.

### For the product

The entire experience reduces to: write prose, see it translated,
understand the gap, close the gap with evidence, seal what's proved.
The workspace, the diagnostics, the receipts, the proof loop — all
of it becomes the explainability layer behind a visual language that
renders on every character of text the user writes.

---

## One-Line Position

Lœgos is not a dashboard language. It is not a metadata language.
It is a visual coordination language where every rendered character
carries its own type, signal, and trust — the same way every
character in source code carries its own syntax, scope, and
validity.

The product is a live translator between human intention and
structural truth. The language is the product.
