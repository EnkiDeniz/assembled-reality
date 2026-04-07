# First Seed Assembly Walkthrough v1.1

**Date:** April 6, 2026
**Updated:** April 6, 2026 — tightened against IDE object model after review
**Purpose:** Map the First Seed corpus through the IDE object model.
Prove that the product can reconstruct its own assembly path.

---

## What This Exercise Is

The First Seed corpus is 13 items in `docs/LoegosSeed/`. One is the
root declaration. Twelve are source documents. Together they trace how
Loegos went from one line on a black screen to a shipped product.

If the product works, you should be able to set the root, load the
twelve sources into a box, and the box — through its full IDE anatomy
(project tree, artifact editor, assembly lane, diagnostics rail, and
Operate) — should reconstruct how "words are loegos" became this.

This is not a demo script. It is a structural verification that the
product can read its own construction history.

**Governing rules (from the IDE object model):**
- Sources are reference files. Shapes are block-level types, not
  file-level labels.
- Each source below lists its **dominant assembly role** and **expected
  dominant block shapes** — not a file-level type assignment.
- The assembly path is shown by the full IDE anatomy, not by Operate
  alone. Operate is the compiler. The lane is the history. The project
  tree is the structure. The diagnostics rail is the debugger.
- The center pane shows the Artifact (seed), not the lane.

---

## The Root

### `words are loegos`

**Content:** One line. "words are loegos." Nothing else.

**Object model role:** ROOT DECLARATION — not a source document.

This is the root text of the box — the declared fixed origin. It is
set as the box's root, not imported as a source. The twelve source
documents below assemble around this root.

**What the box should show:** The root line in the project tree and
status bar. The earliest timestamp. The anchor of the assembly lane.

---

## The Twelve Sources

### Source 1: `Assembled Reality`

**Content:** The founding manifesto. Defines the human protocol:
human declares, AI assists, reality returns, receipt closes.

**Object model role:** Theory source (reference file)
**Dominant assembly role:** Declares what the product is trying to be
**Expected dominant block shapes:** △ aim blocks (declarations,
principles, protocol definitions)
**Trust:** L2 (direct text, authored by the founder)
**Depth:** 2 (Shaped — edited and compared across versions)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Load-bearing

**What the box should show:** Blocks from this source referenced in
the seed's Aim section. The word layer should show "receipt," "seal,"
"coherence," "assembly" as invariant structural terms originating here.

---

### Source 2: `Operator Sentences`

**Content:** Defines the operator sentence as "the smallest
human-readable unit that still runs." Settlement logic, chemotaxis
analogy, operator chains and libraries.

**Object model role:** Theory source (reference file)
**Dominant assembly role:** Defines the grammar layer
**Expected dominant block shapes:** △ aim blocks (definitions,
compression rules, settlement logic)
**Trust:** L2
**Depth:** 2 (Shaped)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Load-bearing

---

### Source 3: `The Ghost Operator`

**Content:** Defines ghost operators — patterns that emerge from
receipt chains but were never explicitly declared.

**Object model role:** Theory source (reference file)
**Dominant assembly role:** Theoretical foundation for word layer
and Lakin moments
**Expected dominant block shapes:** △ aim blocks
**Trust:** L2
**Depth:** 1 (Collected)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Latent — not directly load-bearing yet

---

### Source 4: `The Law of the Echo`

**Content:** Defines echo as "what returns when you listen."

**Object model role:** Theory source (reference file)
**Dominant assembly role:** Informs the Listen surface
**Expected dominant block shapes:** △ aim blocks
**Trust:** L2
**Depth:** 1 (Collected)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Carried indirectly

---

### Source 5: `The Meaning Operator`

**Content:** Defines meaning as an assembled object.

**Object model role:** Theory source (reference file)
**Dominant assembly role:** Philosophical grounding
**Expected dominant block shapes:** △ aim blocks
**Trust:** L2
**Depth:** 1 (Collected)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Carried indirectly

---

### Source 6: `A monolith does not move.`

**Content:** Defines polarity as the prerequisite for movement.

**Object model role:** Theory source (reference file)
**Dominant assembly role:** Philosophical grounding
**Expected dominant block shapes:** △ aim blocks
**Trust:** L2
**Depth:** 1 (Collected)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Latent

---

### Source 7: `Echo Canon`

**Content:** Defines the canonical symbol system. Triangle, Square,
Circle, and Seal as structural primitives.

**Object model role:** Theory source (reference file)
**Dominant assembly role:** Origin of the shape type system
**Expected dominant block shapes:** △ aim blocks (definitions of
each symbol's meaning and structural role)
**Trust:** L2
**Depth:** 2 (Shaped — the symbols were contested and refined)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Latent — but its output (the type system △ □ œ 𒐛)
is now load-bearing everywhere

**Note:** The Echo Canon uses an older framing (four rooms, ○ story).
The current IDE object model settles shapes as block-level type
annotations (△ □ œ 𒐛), not navigation rooms. This source documents
the origin of the type system; the current product uses the evolved
version.

---

### Source 8: `Loegos Self-Assembly Seed Spec`

**Content:** The spec for the self-assembly demo. Defines how the
product should reconstruct its own assembly history.

**Object model role:** Product spec source (reference file)
**Dominant assembly role:** Testable implementation target
**Expected dominant block shapes:** Mixed — △ aim blocks (what the
spec declares), □ reality blocks (what currently exists), œ weld
blocks (where spec meets implementation)
**Trust:** L2
**Depth:** 2 (Shaped)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Carried indirectly

---

### Source 9: `What's In The Box`

**Content:** The word layer thesis. Vocabulary as behavioral data.

**Object model role:** Product spec source (reference file)
**Dominant assembly role:** Direct implementation blueprint for
the word layer
**Expected dominant block shapes:** Mixed — △ aim blocks (thesis),
□ reality blocks (evidence from existing boxes)
**Trust:** L2
**Depth:** 2 (Shaped)
**Evidence basis:** Direct text
**Chronology:** Contextual
**Classification:** Load-bearing — directly implemented

---

### Source 10: `Loegos — Origin, Evolution, Feedback, and Receipt`

**Content:** Seven images described in markdown. Traces the product
from naming through building, evolving, sharing, and proving.

**Object model role:** Evidence spine (proof witness)
**Dominant assembly role:** Primary chronological evidence of what
happened. The strongest evidence source in the box.
**Expected dominant block shapes:** □ reality blocks (observations,
evidence descriptions, documented events)
**Trust:** L1 (image-derived markdown — weaker than raw screenshots)
**Depth:** 3 (Proved — survived comparison and Operate)
**Evidence basis:** Image-derived markdown
**Chronology:** PRIMARY — the main chronological spine

**What the box should show:** Seven lane entries tracing the assembly
arc. Images 5-7 (WhatsApp share, GetReceipts ledger, sealed receipt)
are the proof that the assembly touched reality.

**Critical:** This is where the box transitions from collecting/shaping
to proving. Without this source, the box has theory but no evidence.

---

### Source 11: `Loegos Git history export`

**Content:** 188 Git commits clustered into 5 architectural phases.

**Object model role:** Platform history (corroborating witness)
**Dominant assembly role:** Corroborating chronology that strengthens
the evidence spine
**Expected dominant block shapes:** □ reality blocks (commit
descriptions, change summaries)
**Trust:** L2 (platform export — strong for chronology)
**Depth:** 2 (Shaped — clustered and normalized)
**Evidence basis:** Platform export
**Chronology:** Corroborating

---

### Source 12: `We Built Loegos by Hand Before the Tool Existed`

**Content:** The founding session receipt. Three AI threads, eight
hours, every primitive improvised by hand.

**Object model role:** Founding receipt (proof witness)
**Dominant assembly role:** Behavioral validation that the product's
primitives are grounded in real need
**Expected dominant block shapes:** □ reality blocks (what was done),
𒐛 seal blocks (what this proves)
**Trust:** L2 (direct text, first-person, verifiable against Git
history and the formal core output)
**Depth:** 3 (Proved — the session produced the formal core proposal)
**Evidence basis:** Direct text
**Chronology:** Primary — dated April 6, 2026
**Classification:** Proof witness

---

## The Assembly Arc

If the root is set and these twelve sources are loaded, the IDE
should reconstruct this path across its full anatomy:

```
STAGE 1 — NAMING (Collecting)
  Shown in: Project tree (root line), Status bar
  Root declared: "words are loegos"

STAGE 2 — THEORY (Collecting → Shaping)
  Shown in: Project tree (7 theory sources), Artifact editor
  Sources 1-7 enter the box.
  Invariant terms emerge in word layer:
  "receipt," "seal," "assembly," "operator," "coherence."

STAGE 3 — SPECIFICATION (Shaping)
  Shown in: Project tree (2 spec sources), Artifact editor
  Sources 8-9 enter the box.
  Theory becomes testable. Welds form between theory and spec.
  Diagnostics rail shows shape coverage improving.

STAGE 4 — EVIDENCE (Shaping → Proving)
  Shown in: Assembly lane (7 entries), Project tree, Diagnostics
  Source 10 enters the box.
  The seven-image chronology. Visual proof of what was built.
  Diagnostics rail shows evidence quality rising.

STAGE 5 — CORROBORATION (Proving)
  Shown in: Assembly lane (corroborating entries), Word layer
  Source 11 enters the box.
  188 commits aligned with the narrative arc.
  Word layer shows technical terms stabilizing.

STAGE 6 — CONTACT (Proving)
  Shown in: Assembly lane, Diagnostics rail (seal preflight)
  Within Source 10, Images 5-7:
  WhatsApp share (external contact), GetReceipts sealed receipt
  (proof closure), AI-verified evidence (cryptographic seal).
  Seal preflight edges begin turning green.

STAGE 7 — FOUNDING RECEIPT (Sealed)
  Shown in: Assembly lane (final entry), Build output, Receipts
  Source 12 enters the box.
  The founding session receipt.
  The box proves itself by proving its own construction.
```

---

## What the Box Should Prove

These seven questions are an acceptance test. Each question is
answered by a specific part of the IDE anatomy, not by Operate alone.

| Question | Answered by | Evidence source |
|---|---|---|
| 1. Where did this start? | Project tree (root), Status bar | Root: "words are loegos" |
| 2. What theory supports it? | Project tree (7 sources), Word layer | Sources 1-7 |
| 3. What spec makes it testable? | Project tree (2 sources), Diagnostics | Sources 8-9 |
| 4. What evidence exists? | Assembly lane (7 entries), Project tree | Source 10 |
| 5. Is the chronology supported? | Assembly lane (corroborating), Word layer | Source 11 |
| 6. Did it touch reality? | Diagnostics (seal preflight), Receipts | Source 10 Images 5-7 |
| 7. Are the primitives grounded? | Assembly lane (final entry), Build output | Source 12 |

**Operate's role:** Operate reads the box structurally and returns a
convergence/trust/gradient diagnosis. It does NOT answer all seven
questions by itself. It answers: "how convergent is this box right now?"
The other questions are answered by the lane, the project tree, the
word layer, and the diagnostics rail.

---

## The Hex at Completion

If all twelve sources are loaded, the root is set, and the assembly
is complete, the hex edges should be computable:

| Edge | Aspect | Expected state | Computed from |
|---|---|---|---|
| 0 | Aim completeness | Green | Root declared + theory sources address it |
| 1 | Evidence quality | Green | Source 10 (evidence spine) + Source 11 (Git) |
| 2 | Convergence strength | Green | Operate result across all sources |
| 3 | Weld validity | Green | Spec sources (8-9) weld theory to evidence |
| 4 | Depth distribution | Green | Sources at depth 1-3, founding receipt at 3 |
| 5 | Seal integrity | Amber or Green | Depends on whether the box's own seal mechanism produces a valid seal, not just the historical GetReceipts receipt in the corpus |

**Honest note on Edge 5:** The sealed receipt in Source 10 (Images 6-7)
is a GetReceipts receipt, not a seal produced by the product's own seal
mechanism on this box. For Edge 5 to reach Green through the product's
own runtime, the user would need to run Operate on this box, pass
preflight, and seal a receipt using the product's seal flow. The
historical receipt is evidence that contact happened, but it is not a
seal computed by this box's runtime.

**Settlement: Stage 6 or 7** depending on whether a native seal is
produced. Stage 7 requires the box's own seal mechanism to close the
loop, not just historical evidence of closure.

---

## Why This Matters

This exercise is the product's own acceptance test applied to the
product's own assembly.

If the full IDE anatomy — project tree, artifact editor, assembly
lane, diagnostics rail, word layer, Operate, and seal — can
reconstruct this path from twelve sources and a root, then any box
can reconstruct any path.

If it can't, the product's promise — "the box can prove how it got
here" — is not yet real.

The First Seed corpus is the canonical test case. It always was.
