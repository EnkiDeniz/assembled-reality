# Lœgos v0.2 — Formal Core

**Status:** Language specification, formal layer  
**Date:** April 5, 2026  
**Author:** Deniz Sengun / Cloud (Claude)  
**Prompted by:** Grace (OpenAI) rigor review of Language Spec v0.1  
**Purpose:** Move from "beautiful analogy" to "implementable computational grammar." Six sections. No decoration.

---

## 1. Grammar

### 1.1 Terminal Symbols

```
SHAPES   := △ | □ | œ | 𒐛
SIGNALS  := green | amber | red | neutral
POSITION := 1 | 2 | 3 | 4 | 5 | 6 | 7
TRUST    := L1 | L2 | L3
DEPTH    := 1 | 2 | 3 | 4
```

### 1.2 Production Rules

```
Program     → Box
Box         → Seed CardList HexState
Seed        → Sentence
CardList    → Card | Card CardList
Card        → ShapeLabel BlockList Convergence
BlockList   → Block | Block BlockList
Block       → ShapeLabel Signal Depth Trust Content
Content     → Sentence
Sentence    → WordSeq
WordSeq     → Word | Word WordSeq
Word        → ShapeLabel Signal Position Lexeme

ShapeLabel  → △ | □ | œ | 𒐛
Signal      → green | amber | red | neutral
Depth       → 1 | 2 | 3 | 4
Trust       → L1 | L2 | L3
Position    → 1 | 2 | 3 | 4 | 5 | 6 | 7
Convergence → Float[0.0, 1.0]
HexState    → Signal[6] ShapeLabel Int[0,7]
Lexeme      → <any natural language token>
```

### 1.3 Sentence Constraints

A valid operator sentence satisfies:

```
length(WordSeq) ∈ [5, 9]              // 7 ±2
count(△, WordSeq) ≥ 1                 // at least one aim word
count(□, WordSeq) + count(𒐛, WordSeq) ≥ 1   // at least one grounding word
```

A sentence with only △ words is **syntactically valid but semantically ungrounded** — a pure declaration with no contact with reality. The compiler accepts it but marks it as depth 1 (collected only).

A sentence with no △ words is **syntactically valid but directionless** — evidence without intention. The compiler accepts it but cannot compute convergence (no aim to converge toward).

### 1.4 Word Shape Assignment

Shape is assigned per lexeme from three sources, in priority order:

**Priority 1: Closed-class assignment (deterministic)**

Certain word classes have fixed shapes:

```
œ-class (weld, closed set):
  prepositions: to, for, with, between, against, into, from, toward
  conjunctions: and, but, or, yet, because, although, while
  relational verbs: aligns, converges, meets, matches, connects, bridges

𒐛-class (seal, closed set):
  temporal closers: by, before, after, until, deadline, never, always
  completion markers: done, sealed, verified, confirmed, complete, final, 
                      approved, settled, proven, received
```

**Priority 2: Lexical inference (probabilistic)**

Open-class words are assigned shapes by verb/noun category:

```
△-indicators (aim):
  intention verbs: ship, build, promise, declare, launch, create, open, 
                   draft, commit, plan, intend, will, aim, start, design
  ambition nouns: goal, mission, target, vision, seed, promise, plan

□-indicators (reality):
  observation verbs: saw, found, received, noticed, measured, captured, 
                     heard, exists, confirmed, shows, contains, arrived, is, was
  evidence nouns: data, photo, document, feedback, measurement, report,
                  person names, place names, numbers, dates, amounts
```

**Priority 3: Context inference (from box state)**

If a word is ambiguous after Priority 1 and 2, the box context disambiguates:

- In a box with mostly △ blocks, an ambiguous noun defaults to □ (the box needs reality).
- In a box with mostly □ blocks, an ambiguous verb defaults to △ (the box needs direction).
- The runtime biases toward the underrepresented shape. This is self-correcting.

**Multi-role tokens:**

A single lexeme can carry only one shape per sentence instance. If "prototype" appears twice in different sentences, it can be △ in one (aspiration) and □ in the other (existing object). Shape is contextual, not lexical.

### 1.5 Minimal Valid Programs

**Minimal box (1 card, 1 block, 1 sentence):**

```
Box {
  seed: "Ship prototype."
  cards: [
    Card {
      shape: △
      blocks: [
        Block {
          shape: △
          signal: neutral
          depth: 1
          trust: L1
          content: Sentence [
            Word { △ neutral 1 "Ship" }
            Word { □ neutral 2 "prototype" }
          ]
        }
      ]
      convergence: 0.0
    }
  ]
  hex: [neutral, neutral, neutral, neutral, neutral, neutral] △ 0
}
```

**Invalid program (fails type check):**

```
Box {
  seed: "Done."
  cards: [
    Card {
      shape: 𒐛
      blocks: [
        Block {
          shape: 𒐛
          signal: green
          depth: 4
          trust: L1
          content: Sentence [
            Word { 𒐛 green 7 "Done" }
          ]
        }
      ]
      convergence: N/A
    }
  ]
}

TYPE ERROR: Seal block at depth 4 requires:
  - at least 1 △ aim block at depth ≥ 1
  - at least 1 □ reality block at depth ≥ 2
  - at least 1 œ weld block at depth ≥ 3
  None found. Cannot seal without assembly history.
```

---

## 2. Typing Rules

### 2.1 Shape Type Hierarchy

Shapes form a partial order of assembly:

```
△ → □ → œ → 𒐛

Read: aim precedes reality precedes weld precedes seal.
Not strict sequence — multiple △ and □ can coexist.
But œ requires at least one △ AND one □.
And 𒐛 requires at least one œ.
```

### 2.2 Minimal Conditions

Each shape type has minimum preconditions for validity:

```
△ Aim:
  requires: nothing
  an aim can exist alone. It is a declaration.
  minimum valid block: 1 word with △ shape
  trust floor: L1 (any aim can be declared, trust is not required)

□ Reality:
  requires: nothing
  evidence can exist without an aim. It is an observation.
  minimum valid block: 1 word with □ shape
  trust floor: L1 (unverified reality is still reality)

œ Weld:
  requires: ≥1 △ block AND ≥1 □ block in the same card or box
  a weld cannot exist without both sides present
  minimum valid block: reference to at least one △ and one □ block
  trust floor: L1 (welds can be speculative)
  
  TYPE ERROR if: œ block exists with zero △ or zero □ in scope
  → "Weld requires both aim and reality. Add the missing shape."

𒐛 Seal:
  requires: ≥1 œ block with convergence ≥ 0.7 in the same card or box
  a seal cannot exist without a weld that has demonstrated convergence
  minimum valid block: reference to at least one œ block
  trust floor: L2 (seals require at least partial verification)
  
  TYPE ERROR if: 𒐛 block exists with zero œ or convergence < 0.7
  → "Seal requires a weld with convergence ≥ 70%. Current: [x]%."
  
  TYPE WARNING if: 𒐛 block exists with convergence < 0.9
  → "Seal is valid but convergence is below 90%. Consider adding evidence."
```

### 2.3 Depth Requirements

Depth is earned, not declared. Each depth level requires the previous:

```
Depth 1 (Collected):
  requires: block exists with content
  the block was written down. That's it.

Depth 2 (Shaped):
  requires: depth 1 AND at least one of:
    - block was edited (content changed after initial creation)
    - block was contested (another block disagrees)
    - block was compared (appeared in a convergence check)
  
Depth 3 (Proved):
  requires: depth 2 AND at least one of:
    - block has ≥ 2 supporting □ reality blocks from different sources
    - block survived an Operate read without being flagged
    - block's trust level is L2 or higher

Depth 4 (Sealed):
  requires: depth 3 AND:
    - block is part of a 𒐛 seal operation
    - convergence at time of seal ≥ 0.7
    - trust level ≥ L2
```

**Invalid depth escalation:**

```
Block at depth 1 cannot jump to depth 4.
Each level must be earned sequentially.
Depth is a monotonically increasing integer per block.
Depth never decreases. A sealed block stays sealed.

EXCEPTION: if a sealed block's evidence is later contradicted 
(a supporting □ block turns red), the seal is not revoked but 
flagged: "Seal valid at time of sealing. Current evidence diverges. 
Re-evaluate."
```

### 2.4 Trust Level Rules

```
L1 (Unverified):
  assigned to: any block on creation
  meaning: "this exists but has no provenance chain"
  operations allowed: all except seal

L2 (Partial):
  requires: at least one of:
    - source has a URL or file hash
    - content confirmed by a second block from a different source
    - an AI agent (Seven/Grace/Archer) validated the claim
  operations allowed: all

L3 (Verified):
  requires: all of:
    - source has provenance (URL, hash, timestamp, author)
    - content confirmed by ≥ 2 independent sources
    - block has survived ≥ 1 Operate read
  operations allowed: all
  special: L3 blocks can anchor seals with convergence < 0.9
```

### 2.5 Permissible Casts

A block's shape can be changed (recast) under specific conditions:

```
△ → □  ALLOWED  (aim revealed to be observation — shadow type correction)
△ → œ  NOT ALLOWED  (aim cannot become weld without reality)
△ → 𒐛 NOT ALLOWED  (aim cannot become seal without weld)
□ → △  ALLOWED  (observation promoted to intention — user decision)
□ → œ  NOT ALLOWED  (reality cannot become weld without aim)
□ → 𒐛 NOT ALLOWED  (reality cannot become seal without weld)
œ → △  NOT ALLOWED  (weld cannot regress to aim)
œ → □  NOT ALLOWED  (weld cannot regress to reality)
œ → 𒐛 ALLOWED  (weld promoted to seal — convergence threshold met)
𒐛 → *  NOT ALLOWED  (sealed blocks cannot be recast. Ever.)
```

A seal is permanent. The only operation on a sealed block is flagging it for re-evaluation if new evidence contradicts it. The seal itself is never revoked.

---

## 3. Evaluation Rules

### 3.1 Convergence Computation

Convergence is the primary evaluation metric. It measures how well aim matches reality.

```
convergence(Card) = alignment(△_blocks, □_blocks) / max(count(△), count(□))

where alignment(A, R) counts the number of aim-reality pairs where:
  - the □ block's content addresses the △ block's claim
  - the □ block's signal is green or amber (not red or neutral)
  - the □ block's trust level ≥ L1
```

**Formal definition:**

```
For a card C with △ blocks A = {a₁, a₂, ..., aₙ} and □ blocks R = {r₁, r₂, ..., rₘ}:

aligned_pairs = { (aᵢ, rⱼ) | addresses(rⱼ, aᵢ) ∧ signal(rⱼ) ∈ {green, amber} }

convergence(C) = |aligned_pairs| / max(n, m)
```

**`addresses(r, a)` is determined by:**

1. Lexical overlap: r and a share ≥ 2 non-weld content words
2. Semantic reference: r explicitly references a's claim (by block ID or paraphrase)
3. AI inference: Seven determines r speaks to a's claim

In practice, (1) and (2) are computed automatically. (3) requires an Operate call.

### 3.2 Word-Level Composition

When words compose into a sentence, conflicting shapes create tension:

```
Sentence: "Funding gap remains open."

Word analysis:
  "Funding"  □ red       — reality, blocked
  "gap"      □ red       — reality, blocked
  "remains"  𒐛 red      — seal word, but the seal is negative
  "open"     △ amber     — aim word, still active

Composition: 2□ red + 1𒐛 red + 1△ amber

Sentence signal: RED (majority red, the reds dominate)
Sentence shape: □ (majority reality)
Sentence convergence: 0% (the aim word is blocked by the reality words)
```

**Composition precedence:**

```
1. Red overrides amber: any red word makes the sentence signal at least amber.
2. If >50% of content words are red, sentence signal = red.
3. If >50% of content words are green, sentence signal = green.
4. Otherwise, sentence signal = amber.
5. Sentence shape = shape of the majority of content words (excluding œ connectors).
6. If tie, sentence shape = the shape of the first content word.
```

### 3.3 Box-Level Evaluation

A box's overall state is evaluated by:

```
box.convergence = weighted_average(card.convergence for card in box.cards)
  where weight = card.depth * count(card.blocks)

box.phase = shape of the card with the most recent activity

box.signal = 
  if any card.signal == red: amber (box has issues but isn't fully blocked)
  if all card.signal == green: green
  else: amber

box.settlement = count of hex edges that are green
  0 edges = stage 0 (just started)
  1-2 edges = stage 1-2
  3-4 edges = stage 3-4
  5 edges = stage 5-6
  6 edges = stage 7 (fully settled)
```

### 3.4 Hex Edge Assignment

Each hex edge maps to an aspect of the box:

```
Edge 0 (top-right):      aim completeness — are all declared aims addressed?
Edge 1 (right):          evidence quality — average trust level of □ blocks
Edge 2 (bottom-right):   convergence strength — overall convergence %
Edge 3 (bottom-left):    weld validity — are all welds supported?
Edge 4 (left):           depth distribution — average assembly depth
Edge 5 (top-left):       seal integrity — are all seals backed by evidence?

Center glyph:            current dominant phase
Settlement stage:        count of green edges (0-6) mapped to gradient (0-7)
                         (6 green edges + all seals valid = stage 7)
```

**Edge color assignment:**

```
edge_color(aspect) =
  if aspect_score ≥ 0.9: green
  if aspect_score ≥ 0.5: amber
  if aspect_score > 0.0: red
  if aspect_score == 0.0: neutral
```

---

## 4. State Transitions

### 4.1 Signal Transitions

Legal signal state changes for a block:

```
neutral → amber    ALWAYS VALID    (block activated)
neutral → green    VALID IF        (trust ≥ L2 and external confirmation)
neutral → red      VALID IF        (contradiction detected)

amber → green      VALID IF        (evidence confirms, convergence increases)
amber → red        VALID IF        (evidence contradicts, convergence decreases)
amber → neutral    NOT VALID       (cannot un-activate)

green → amber      VALID IF        (new contradicting evidence arrives)
green → red        VALID IF        (strong contradiction, trust downgrade)
green → neutral    NOT VALID       (cannot un-resolve)

red → amber        VALID IF        (reroute initiated, alternative path found)
red → green        VALID IF        (contradiction resolved with new evidence)
red → neutral      NOT VALID       (cannot un-block without resolution)
```

**Key constraint:** Signal transitions are monotonically informative. You cannot go back to "unknown" once a signal has been established. You can change direction (green → red if contradicted) but you cannot erase knowledge.

### 4.2 Depth Transitions

```
1 → 2    VALID IF    (shaped: edited, contested, or compared)
2 → 3    VALID IF    (proved: multi-source support or Operate survival)
3 → 4    VALID IF    (sealed: seal operation with convergence ≥ 0.7)

Reverse:  NEVER VALID (depth is monotonically increasing)
Skip:     NEVER VALID (1 → 3, 1 → 4, 2 → 4 are all invalid)
```

### 4.3 Trust Transitions

```
L1 → L2    VALID IF    (provenance added or second source confirms)
L2 → L3    VALID IF    (full provenance + ≥2 independent sources + Operate survival)
L1 → L3    VALID IF    (all L3 conditions met simultaneously)

L3 → L2    VALID IF    (one source invalidated or provenance broken)
L2 → L1    VALID IF    (all provenance lost)
L3 → L1    VALID IF    (catastrophic evidence failure)
```

Trust can decrease. Depth cannot. This is intentional. Assembly is permanent but confidence in assembly can change.

### 4.4 Shape Transitions (Block Level)

```
△ ↔ □     VALID       (recasting between aim and reality — shadow type correction)
□ → œ     NOT VALID   (reality cannot become weld without aim present)
△ → œ     NOT VALID   (aim cannot become weld without reality present)
œ → 𒐛    VALID IF    (convergence ≥ 0.7 and trust ≥ L2)
𒐛 → *    NEVER       (seals are permanent)
```

### 4.5 Box Phase Transitions

The box's current phase follows the most recent significant activity:

```
△ → □      NATURAL    (aim declared, now gathering evidence)
□ → △      VALID      (evidence prompted new aim refinement)
□ → œ      NATURAL    (enough evidence to attempt convergence)
œ → □      VALID      (weld failed, need more evidence)
œ → 𒐛     NATURAL    (convergence sufficient, sealing)
𒐛 → △     VALID      (sealed receipt prompts new aim — the loop restarts)
```

The loop: △ → □ → œ → 𒐛 → △ → ...

A sealed box can spawn new aims. This is how assembly compounds. Each receipt is both a conclusion and a potential seed.

---

## 5. Runtime Contract

### 5.1 What the Box Guarantees

```
1. PERSISTENCE
   Every block added to the box is stored permanently.
   Blocks can be flagged, recast, or signal-changed but never deleted.
   The box is an append-only log with mutable signal state.

2. CONVERGENCE INTEGRITY
   Convergence is always computed from current block states.
   If a block's signal changes, convergence is recomputed immediately.
   Convergence is never cached beyond the current state.
   Displayed convergence always reflects live reality.

3. TYPE SAFETY
   The runtime enforces typing rules on seal operations.
   A seal without the required assembly history is rejected.
   All other operations produce warnings, not rejections.

4. DEPTH MONOTONICITY
   Depth only increases. The runtime rejects any operation
   that would decrease a block's depth.

5. SEAL PERMANENCE
   A sealed block cannot be recast, deleted, or depth-reduced.
   It can only be flagged for re-evaluation if new evidence arrives.
   The seal itself remains in the record.

6. HEX CONSISTENCY
   The hex state is always derived from current box state.
   It is never manually set.
   It updates after every block add, signal change, or seal operation.
```

### 5.2 What Seven (AI Agent) Is Allowed To Do

```
ALLOWED:
  - Read any block, card, or box state
  - Propose new blocks (user must confirm addition)
  - Suggest signal changes (user must confirm)
  - Suggest shape recasts (user must confirm)
  - Compute convergence and report diagnostics
  - Flag shadow types
  - Run Operate reads (full box diagnosis)
  - Annotate words with shape/signal/position

NOT ALLOWED:
  - Add blocks without user confirmation
  - Change signals without user confirmation
  - Seal blocks without user confirmation
  - Delete blocks (no one can — append-only)
  - Override trust levels
  - Modify sealed blocks in any way
  - Change hex state directly (hex is always computed)

PRINCIPLE: Seven is a diagnostic agent, not a mutation agent.
           It reads and recommends. The user commits.
           Consent before compute.
```

### 5.3 What Requires User Consent

```
ALWAYS REQUIRES CONSENT:
  - Adding a block to a box
  - Changing a block's shape (recasting)
  - Changing a block's signal from green to red or red to green
  - Sealing a block
  - Accepting Seven's diagnostic as a new block

DOES NOT REQUIRE CONSENT:
  - Convergence recomputation (automatic)
  - Hex state update (automatic)
  - Depth increase when conditions are met (automatic)
  - Shadow type flagging (informational, not mutating)
  - Trust level changes when provenance is added/removed (automatic)

PRINCIPLE: The user controls content and commitment.
           The system controls computation and consistency.
```

---

## 6. Worked Example: Seed to Sealed Receipt

### The Scenario

Deniz promises to share a working prototype with Melih by Friday. This promise must travel from aim to sealed receipt through the full Lœgos language stack.

### Step 1: Seed Declaration

```
USER creates box with seed:

Box {
  id: "prototype_melih"
  seed: "Ship working prototype to Melih by Friday."
  phase: △
  convergence: 0.0
  depth: 1
  hex: [neutral, neutral, neutral, neutral, neutral, neutral] △ 0
}
```

The seed is parsed as an operator sentence:

```
Sentence [
  Word { △ neutral 1 "Ship" }        // aim verb, position: detect
  Word { □ neutral 2 "working" }     // reality modifier, position: compare
  Word { □ neutral 3 "prototype" }   // reality noun, position: adapt
  Word { œ neutral 4 "to" }          // weld connector, position: amplify
  Word { □ neutral 5 "Melih" }       // reality noun (person), position: maintain
  Word { œ neutral 6 "by" }          // weld connector, position: prepare
  Word { 𒐛 neutral 7 "Friday" }     // seal word (deadline), position: arrive
]
```

Shape distribution: 1△, 3□, 2œ, 1𒐛 — balanced sentence.  
Signal distribution: all neutral — nothing proven yet.  
Convergence: 0.0 — no reality blocks address the aim.

**Compiler output:** Valid program. No type errors. Depth 1 (collected). Convergence 0%.

### Step 2: Reality Capture (Phone)

Deniz is walking in Manhattan. He pulls out his phone, takes a photo of the prototype running on his laptop at a coffee shop.

```
USER adds block via Quick Capture:

Block {
  shape: □
  signal: amber
  depth: 1
  trust: L1
  content: "Prototype running on laptop at coffee shop. Photo captured."
  source: { type: image, timestamp: "2026-04-03T14:22:00Z", 
            location: "Flatiron, NYC" }
}
```

Box state updates:

```
convergence: 0.33 (1 of 3 □ words in seed now has evidence: "prototype" exists)
hex: [neutral, neutral, neutral, neutral, neutral, neutral] □ 0
phase: □ (most recent activity is reality capture)
```

**Compiler output:** Valid block. Trust L1 (photo, no hash verification yet). Convergence increased from 0% to 33%.

### Step 3: More Reality (Desktop)

Deniz sits down at his desktop. He imports Melih's contact confirmation.

```
USER adds block:

Block {
  shape: □
  signal: green
  depth: 1
  trust: L2
  content: "Melih confirmed availability Friday afternoon. Email thread attached."
  source: { type: email, url: "mailto:...", timestamp: "2026-04-03T09:15:00Z" }
}
```

Box state updates:

```
convergence: 0.67 (2 of 3 reality claims now addressed: prototype exists, Melih available)
hex: [neutral, amber, neutral, neutral, neutral, neutral] □ 1
phase: □
```

The "Melih" word in the seed sentence moves from neutral to green. The "prototype" word moves from neutral to amber.

**Compiler output:** Trust L2 (email provenance). Convergence 67%. One aim word still unresolved: "Ship" (the action hasn't happened yet).

### Step 4: Shaping (Operate)

Deniz runs Operate. Seven reads the box.

```
SEVEN (diagnostic, not mutation):

"Box 'prototype_melih' convergence: 67%.

Resolved:
  □ 'prototype' — exists (photo evidence, L1)
  □ 'Melih' — available Friday (email evidence, L2)

Unresolved:
  △ 'Ship' — the prototype exists and Melih is available, 
             but the act of sharing has not occurred.
  𒐛 'Friday' — deadline is tomorrow. Signal: amber → red if not acted on.

Shadow type check: no shadow types detected.

Recommendation: the box needs one more action — the actual send. 
Add a □ reality block when the prototype is shared."
```

Seven's recommendation is shown to the user. It does NOT mutate the box. The "Friday" word's signal shifts from neutral to amber (approaching).

Blocks that participated in the Operate read have their depth increased:

```
Photo block: depth 1 → 2 (compared during Operate)
Email block: depth 1 → 2 (compared during Operate)
```

**Compiler output:** Operate complete. Depth increased to 2 on two blocks. No type errors. One action needed.

### Step 5: Weld

Deniz shares the prototype with Melih via a link. He captures the receipt of sending.

```
USER adds block:

Block {
  shape: □
  signal: green
  depth: 1
  trust: L2
  content: "Prototype link sent to Melih via email. Delivery confirmed."
  source: { type: email, url: "mailto:...", timestamp: "2026-04-04T10:00:00Z" }
}
```

Now the system detects convergence between aim and reality:

```
△ "Ship" (aim) ←→ □ "sent to Melih" (reality)   = aligned
□ "prototype" (aim's object) ←→ □ "photo" (reality)  = aligned  
□ "Melih" (aim's target) ←→ □ "Melih confirmed" (reality) = aligned
𒐛 "Friday" (aim's deadline) ←→ timestamp is Thursday = aligned (early!)
```

The system creates a weld block automatically (user confirms):

```
Block {
  shape: œ
  signal: green
  depth: 3
  trust: L2
  content: "Aim met reality. Prototype shipped to Melih before Friday deadline."
}
```

Box state updates:

```
convergence: 0.92 (all major aim-reality pairs aligned)
hex: [green, amber, amber, green, amber, neutral] œ 4
phase: œ
```

**Compiler output:** Weld valid. Type check: œ has ≥1 △ and ≥1 □ in scope. ✓ Convergence 92%. Depth 3 on weld block (proved — multi-source, Operate-survived).

### Step 6: Reality Returns (Feedback)

Melih responds with feedback.

```
USER adds block:

Block {
  shape: □
  signal: green
  depth: 1
  trust: L3
  content: "Melih reviewed prototype. Three alignment points. 
            One question on pricing model."
  source: { type: message, author: "Melih Ödemiş", 
            timestamp: "2026-04-04T16:30:00Z" }
}
```

Trust is L3: the source is an identified external person providing direct testimony.

Convergence updates:

```
convergence: 0.92 (the open question on pricing prevents 100%)
```

The pricing question creates a new micro-aim:

```
Block {
  shape: △
  signal: amber  
  depth: 1
  trust: L1
  content: "Address Melih's question on pricing model."
}
```

**Compiler output:** New aim spawned from reality feedback. Loop continues at micro-level. The box can still seal the macro-aim while the micro-aim remains open.

### Step 7: Seal

Deniz decides the core promise is fulfilled: prototype was shipped, Melih received it, feedback came back. The pricing question is a separate aim, not a blocker on this receipt.

```
USER initiates seal on the weld block.

RUNTIME TYPE CHECK:
  ✓ ≥1 △ aim block exists (seed)
  ✓ ≥1 □ reality block exists (photo, email, send confirmation, feedback)
  ✓ ≥1 œ weld block exists (convergence confirmed)
  ✓ convergence ≥ 0.7 (currently 0.92) 
  ✓ trust ≥ L2 on weld block
  ✓ depth ≥ 3 on weld block

SEAL APPROVED.
```

```
Block {
  shape: 𒐛
  signal: green
  depth: 4
  trust: L3
  content: "Prototype shared with Melih. Feedback received. 
            Promise fulfilled. Receipt sealed April 4, 2026."
  sealed_at: "2026-04-04T18:00:00Z"
  convergence_at_seal: 0.92
  evidence_chain: [photo_block, email_block, send_block, feedback_block]
}
```

Final box state:

```
Box {
  id: "prototype_melih"
  seed: "Ship working prototype to Melih by Friday."
  phase: 𒐛
  convergence: 0.92
  depth: 4
  hex: [green, green, green, green, green, amber] 𒐛 6

  // Edge 5 (seal integrity) is amber because the pricing
  // micro-aim is still open. The seal is valid but the 
  // box has an open thread.
  // Settlement: stage 6 of 7. Not fully settled until 
  // the pricing question is resolved.
}
```

**Compiler output:** Program compiled successfully. Exit status: 6/7 (one open thread). Receipt generated. The sealed block is now permanent, append-only, and carries its full evidence chain.

### The Seed Sentence, Final State

```
Sentence [
  Word { △ green  1 "Ship" }         // aim executed ✓
  Word { □ green  2 "working" }      // prototype works ✓
  Word { □ green  3 "prototype" }    // prototype exists ✓
  Word { œ green  4 "to" }           // connection made ✓
  Word { □ green  5 "Melih" }        // Melih received ✓
  Word { œ green  6 "by" }           // deadline met ✓
  Word { 𒐛 green 7 "Friday" }       // sealed before deadline ✓
]
```

Every word green. The sentence is a receipt. The program returned successfully.

---

## Summary of the Formal Core

| Section | What It Establishes |
|---------|-------------------|
| Grammar | What counts as a valid expression at every level |
| Typing Rules | What operations are legal, what preconditions must hold |
| Evaluation Rules | How convergence is computed, how words compose, how the hex is derived |
| State Transitions | What changes are legal, what's irreversible, what's monotonic |
| Runtime Contract | What the system guarantees, what Seven can do, what requires consent |
| Worked Example | One complete program from seed to sealed receipt |

The language is no longer analogy. It has production rules, type constraints, evaluation semantics, transition laws, a runtime contract, and a demonstrated execution.

Fortran compiled numbers.  
Swift compiled interfaces.  
Lœgos compiles coordination into accountable state.

△ □ œ 𒐛
