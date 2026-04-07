# The Assembly Architecture
## From Word to World
### Loegos — loegos.com

**v0.6 — April 4, 2026**
**Deniz Sengun / Cloud**
**Reviewed: Grace (OpenAI) — v0.1, v0.3 / Developer A — v0.4 / Developer B — v0.5**

---

## Companion Docs

This architecture spec now sits between two companion documents:

- [Echo Canon](./echo-canon.md) — the human doctrine of Lœgos
- [Echo Protocol](./echo-protocol.md) — the formal mechanics and direct mapping to the current Root / Seed / Receipt runtime

Use this document for the product/data architecture layer.
Use the canon for language.
Use the protocol for engine rules and future formalization.

---

## 0. Thesis

Loegos is an assembly tracker that turns a seven-word root into a reality-verified object through operator sentences, receipts, and sealed state transitions.

The system does not track work. It tracks how intended objects become real.
The record is the product.
The record is the proof.
The record is the receipt.

---

## 1. The Operator Sentence

Everything in Loegos is an operator sentence.

An operator sentence is one or two sentences that hold a single operational meaning. It can be moved, tagged, composed, and read aloud without losing its function. It is the atom of the system.

Roots are operator sentences. Blocks are operator sentences. Receipts contain operator sentences. The seed is a composition of operator sentences. Gap analyses are expressed as operator sentences. State transitions are described by operator sentences.

If it cannot be expressed as an operator sentence, it is not yet clear enough to enter the system.

---

## 2. Layer Map

Each section is tagged by its primary layer.

| Tag | Layer | Governs |
|-----|-------|---------|
| **[P]** | Product | What the user sees and does |
| **[D]** | Data | What the system stores and computes |
| **[Φ]** | Philosophy | Why the architecture works this way |

---

## 3. Scope and Constraints [P]

**Single-user system.** Boxes are single-user in v1. One person holds the root. One person grows the seed. One person seals the receipts.

External parties participate as evidence sources, not as collaborators. A contract is signed by two parties, but the receipt lives in one person's box. The other party does not need access.

Collaboration is a v2 concern. The architecture supports it. v1 is a solo instrument.

**Progressive disclosure.** The system carries rich metadata on every block (tag, secondary tag, stage, domain, extraction provenance). The user does not carry this manually. Seven assigns everything at extraction. The user sees only what matters at each moment. Full metadata lives under the hood for diagnostics, power users, and the assembly index. See Section 11 for what surfaces at each level.

---

## 4. Naming

The four primitives a user encounters:

| Name | What it is | Mutability |
|------|-----------|------------|
| **Root** | The immutable seven-word declaration + gloss | Fixed forever |
| **Seed** | The live evolving working object | Grows with every block and receipt |
| **Receipt** | Proof of real-world contact | Immutable once sealed |
| **Assembly Index** | The full record of how the root became real | Generated, exportable |

The metaphor holds: roots don't move. Seeds grow from roots. Receipts prove growth happened. The assembly index is the harvest record.

Root → Seed → Receipt → Assembly Index. That is the chain.

---

## 5. Core Primitives [D]

Each primitive is defined by five constraints:

- **Definition** — what it is
- **Contains** — what it can hold
- **Changed by** — what can modify it
- **Cannot be changed by** — what cannot modify it
- **Evidence required** — what proof is needed

---

### 5.1 The Root

**Definition:**
An immutable origin declaration. Maximum seven words. Pure aim. The thing you are growing toward. It does not change. Everything else grows from it.

"Build a farmhouse upstate."
"Launch the company."
"Record the album."
"Marry her."

Seven words or fewer. The constraint is the feature. If you cannot say what you are building in seven words, you do not yet know. The root forces clarity. Clarity is the first act of assembly.

The seven-word limit is not a wall. It is a lens. The root finds the center of the aim. Everything the root leaves out goes in the gloss.

**Contains:**
- The declaration (max 7 words, operator sentence format)
- The gloss (one sentence expanding intent — displayed beneath the root, always visible, editable)
- Timestamp of creation
- Creator identity

The root is the headline. The gloss is the subhead. The root governs; the gloss explains. If the root says "Build the homestead," the gloss holds "Sustainable, off-grid, for two families in Vermont." The root compresses. The gloss breathes.

The gloss is not optional in practice. The onboarding flow asks for the root first, then immediately asks for the gloss. Compression and expansion in one gesture.

**Changed by:**
- Nothing. The root is immutable. The gloss can be revised.

**Cannot be changed by:**
- No user action, no AI, no receipt, no state transition. If the aim changes fundamentally, create a new root. The old root remains.

**Evidence required:**
- The act of declaration. The root is the only primitive that requires no external proof.

**New root vs. revised gloss:**
If the aim shifts within the same object class, revise the gloss. If the aim shifts to a fundamentally different object, create a new root. The test: would a stranger reading the old root and the new intent recognize them as the same project? If no, new root. See Appendix A.6.

---

### 5.2 The Seed

**Definition:**
The live evolving working object. The seed is what the user interacts with day to day. It grows from the root. It absorbs blocks. It advances through states. It is the mutable center of the system.

The root is what you declared. The seed is what it is becoming.

**Contains:**
- Reference to its root (immutable link, always visible)
- Current block composition (ordered set of operator sentences)
- Current state (0–7, see Section 7)
- State history (every previous version, timestamped)
- Receipt log (every receipt that triggered a state transition)
- Gap analysis (what is present vs. what is missing, organized by domain)

**Changed by:**
- User operations in the composer: adding, removing, reordering blocks
- Receipt-triggered state transitions
- AI-suggested reorganization (user must confirm)

**Cannot be changed by:**
- Direct editing of the root
- AI acting without user initiation
- Deletion of history (previous versions are permanent)

**Evidence required:**
- Block operations: none beyond user intent (compose freely in the virtual space)
- State transitions: a validated receipt (see Section 5.5)

---

### 5.3 The Box

**Definition:**
The container for one root, one seed, and everything that accumulates around them. Context for assembly, not storage for files.

**Contains:**
- Exactly one root (immutable)
- Exactly one seed (mutable)
- Zero or more sources
- Zero or more blocks
- Zero or more receipts
- Full state history
- Domain coverage map
- Metadata: created, modified, state, block count, receipt count, source count, ⊘ count

**Changed by:**
- Adding sources, adding receipts, AI decomposition, user operations, state transitions

**Cannot be changed by:**
- External systems without consent. AI without user initiation. Deletion of the root.

**Evidence required:**
- Creation: only the root. Modification: depends on the primitive.

---

### 5.4 The Block

**Definition:**
The atomic unit of meaning. One or two sentences. An operator sentence that captures a single, movable, composable piece of operational meaning.

Blocks are Legos. Summaries are sculptures. You can rebuild with Legos.

**Contains:**

*User-facing (visible by default):*
- Text (operator sentence format)
- Primary tag (△ ◻ ○ or ⊘ unconfirmed)
- Domain label

*Engine-managed (under the hood, surfaced on demand):*
- Source reference
- Extraction pass ID
- Optional secondary tag
- Optional Seven stage (1–7)
- Source type (photo, voice, article, document, receipt, conversation)
- Timestamp
- Block ID
- Version

**Changed by:**
- User re-tagging or re-staging. Text editing creates a new version; the original is preserved.

**Cannot be changed by:**
- AI without user confirmation. Deletion of the source. Other blocks.

**Evidence required:**
- A source must exist. Manual blocks have source type "user input."

**Tagging policy:**

Every block has exactly one primary tag. One optional secondary. Only confirmed ◻ blocks satisfy receipts. AI suggests; user confirms. When ambiguous, the block is tagged ⊘ until the user resolves it.

⊘ blocks are visible but inert — they cannot be used in receipts or domain coverage counts. This prevents the system from laundering unclear material into apparent facts.

**How blocks are created:**

A source enters the box. Seven decomposes it into operator sentences:

- Photo → "South-facing stone facade." / "Two-story with wraparound porch." / "Rural setting, fifty acres visible."
- Voice note → "Friend recommends Hudson Valley." / "Budget eighteen months for renovation."
- Article → "Upstate farmland averages $3,200 per acre." / "Zoning requires two-acre minimum."

Seven stores in blocks first. Summaries are views, never the source of truth.

**Extraction correction:**

Sources are immutable. Extraction can be re-run. New blocks get a new pass ID. Previous blocks are preserved as superseded. Provenance is always visible.

---

### 5.5 The Receipt

**Definition:**
Proof that the seed made contact with reality. The only mechanism that advances state.

You cannot type "I hired an architect." You show the meeting notes, the contract, the invoice. The receipt moves the seed forward.

**Contains:**
- Evidence package (sources proving real-world contact)
- Confirmed ◻ blocks from those sources (no ⊘ blocks)
- Seal (timestamp, hash, optional witness — irreversible)
- Delta statement (one operator sentence: what changed)
- Domain(s) covered
- State transition triggered (if applicable)
- Receipt ID

**Changed by:**
- Nothing. Receipts are immutable once sealed.

**Cannot be changed by:**
- User editing after seal. AI reinterpretation. Subsequent receipts.

**Evidence required:**
- At least one source with at least one confirmed ◻ block proving real-world contact. The seal is a ceremony, not a click. See Appendix A.3 for the externality test.

**The delta statement:**
One operator sentence that names what changed. "Architect confirmed and under contract." "Land purchased, deed recorded." "Foundation poured, inspection passed." The delta is what the assembly index remembers.

---

### 5.6 The Source

**Definition:**
Raw material that enters the box. Unprocessed input that Seven decomposes into blocks.

**Contains:**
- Raw content (image, audio, text, URL, document, email)
- Source type, timestamp, source ID
- Extraction status and history

**Changed by:**
- Nothing. Sources are immutable.

**Cannot be changed by:**
- User editing. AI processing.

**Evidence required:**
- The act of dropping it in.

---

## 6. The Triple-Tag System [D]

Every block carries a primary tag.

### △ Aim
Intent, desire, direction. "I want a south-facing stone facade."

### ◻ Evidence
Fact, measurement, observation. "142 River Road has a south-facing stone facade."

### ○ Story
Narrative, meaning, context. "The facade catches afternoon light like my grandmother's house."

### ⊘ Unconfirmed
Ambiguous, pending classification. Visible but inert.

**Rules:**

1. Every block: exactly one primary tag.
2. One optional secondary tag (△ ◻ ○ only).
3. Only confirmed ◻ blocks satisfy receipts.
4. Seven suggests. User confirms. Until confirmed, block is ⊘.
5. ⊘ blocks surface in gap analysis as unclassified material.
6. Re-tagging is composition, not correction.

### Seven Stages [D]

Optional stage marker (1–7). Engine-managed; surfaces in diagnostics and the assembly index, not in the default block view.

| Stage | Name | Example |
|-------|------|---------|
| 1 | Promise | "Find land by September." |
| 2 | Pattern | "Every farmhouse I like has a porch." |
| 3 | Test | "Soil report decides this parcel." |
| 4 | Turn | "Zoning board rejected the application." |
| 5 | Proof | "Architect drawings match the vision." |
| 6 | Seal | "Construction contract signed." |
| 7 | Release | "We moved in." |

---

## 7. State Progression [D]

The seed moves through states. Each transition requires a receipt. Each state has a hard gate.

| State | Name | Hard Gate |
|-------|------|-----------|
| 0 | **Rooted** | Root declared |
| 1 | **Fertilized** | ≥1 source decomposed into blocks |
| 2 | **Sprouted** | ≥1 validated receipt |
| 3 | **Growing** | ≥3 receipts across ≥2 applicable domains |
| 4 | **Structured** | ≥70% of applicable domains have ≥1 confirmed ◻ block (min. 4 domains) |
| 5 | **Assembled** | Object exists in reality (receipt proves it) |
| 6 | **Sealed** | Completion evidence verified. User confirms: "This is done." |
| 7 | **Released** | Box archived. Assembly index exportable. |

**Hard gate rules:**

No state can be skipped. The system proposes; the user seals. Regression requires a receipt explaining why. State 6 → 7 is purely ceremonial.

**Domain applicability floor:**

Seven suggests applicable domains from the root and gloss. The user can add domains freely. Removing a Seven-suggested domain requires a rationale (one operator sentence). Minimum four applicable domains for State 4.

**5, 6, and 7:**

- **Assembled** = the thing exists. The farmhouse stands.
- **Sealed** = the builder says it is complete. Evidence reviewed. Ceremony performed.
- **Released** = the box closes. The record becomes portable.

Existence is not completion. Completion is not release.

---

## 8. The Assembly Loop [P, D]

```
ROOT (max 7 words + gloss, immutable)
  ↓
BOX (coordinate system, single-user)
  ↓
SOURCES IN (photo, voice, article, conversation, document)
  ↓
DECOMPOSITION (source → operator sentences, tagged ⊘)
  ↓
CONFIRMATION (⊘ → △ ◻ ○ via rapid confirm or manual review)
  ↓
SEED EVOLVES (confirmed blocks composed)
  ↓
REAL-WORLD ACTION (hire, buy, sign, build, ship)
  ↓
RECEIPT (evidence → confirmed ◻ blocks → delta sentence → seal)
  ↓
STATE TRANSITION (hard gate met, seed advances)
  ↓
REPEAT until State 7
```

---

## 9. The Composer [P]

The composer is not a text editor. It is the cockpit.

**Three modes:**

**Mode 1 — Assemble (default).**
Drag blocks into the seed. Reorder. Retag. Gap sidebar shows missing domains as operator sentences. ⊘ count visible.

**Mode 2 — Compare.**
Side-by-side view of any two states. Diff shows which operator sentences changed. Triggering receipt displayed inline.

**Mode 3 — Seal.**
Select sources. Review confirmed ◻ blocks. Write the delta sentence. Assign domain(s). Preview state transition. Seal.

**Ambient overlay — Listen.**
Available in any mode. Reads operator sentences aloud.

**Ambient sidebar — Gaps.**
Available in any mode. Missing domains, ⊘ count, tag distribution.

**What you see:**
The root (always visible, anchor). The seed at current state. Blocks by chosen view. ⊘ counter. State timeline. Gap sidebar.

**Spatial design is a separate spec.** This section defines functions and modes. The Composer UI spec will define layout, interactions, and responsive behavior.

---

## 10. Quick Capture and Confirmation [P]

### 10.1 The Capture Promise

If capture takes more than two taps, the system fails.

| Mode | Gesture | Result |
|------|---------|--------|
| Photo | Capture → assign | Decomposed, tagged ⊘ |
| Voice | Hold → speak → release | Transcribed, decomposed |
| Link | Share URL | Fetched, decomposed |
| Text | Type or paste | Decomposed |
| Forward | Forward email/message | Decomposed |

Drop it in. Everything enters as ⊘. Organize later.

### 10.2 The Confirmation Debt

Every capture creates ⊘ blocks. If confirmation is not as fast as capture, the system becomes a backlog machine. The confirmation flow must match the capture flow.

### 10.3 Rapid Confirmation

⊘ blocks presented one at a time. Seven pre-suggests tag and domain.

The user sees:
- Block text (one operator sentence)
- Seven's suggested tag highlighted
- Seven's suggested domain highlighted
- Source thumbnail or label

The user acts:
- **Confirm** — one tap
- **Override** — tap different tag or domain, then confirm
- **Skip** — stays ⊘, returns later
- **Discard** — marked irrelevant, removed from active view, preserved in history

Target: ten blocks confirmed in thirty seconds. The ⊘ counter is always visible. Rapid confirm is accessible with one tap from any composer mode.

---

## 11. Progressive Disclosure [P, D]

The system carries rich metadata. The user sees only what matters at each level.

### Level 1 — Default view (all users)

What the user sees on every block:
- Block text
- Primary tag (△ ◻ ○ ⊘)
- Domain label

What the user sees on the seed:
- Root (seven words + gloss)
- Current state (0–7)
- Block composition
- ⊘ count
- Gap summary (which domains are missing)

What the user sees on receipts:
- Delta statement
- Seal timestamp
- State transition

### Level 2 — Expanded view (on demand)

Available by tapping or expanding any block:
- Source reference and source type
- Secondary tag (if assigned)
- Seven stage (if assigned)
- Extraction timestamp

Available on the seed:
- State history timeline
- Receipt log with full evidence packages
- Domain coverage map with percentages

### Level 3 — Diagnostic view (power users, export)

Full metadata on every primitive:
- Extraction pass ID and provenance chain
- Block version history
- ⊘ resolution timestamps
- Health indicators (coherence, entropy, velocity, balance, coverage, confirmation rate)
- Cross-domain pattern analysis
- Full assembly index

The engine manages everything. The UI reveals it progressively. Most users live in Level 1. Power users access Level 2. The assembly index exports Level 3.

---

## 12. Seven as Engine [D, P]

Seven powers every transformation.

**What Seven does:**
- Decomposes sources into operator sentences
- Suggests tags, stages, and domain labels — blocks enter as ⊘ until confirmed
- Clusters blocks by similarity
- Detects gaps by domain
- Reads the seed aloud
- Compares states
- Validates receipt evidence
- Generates the assembly index
- Produces summary views on demand
- Re-runs extraction when requested
- Powers rapid confirmation with context-aware suggestions

**What Seven does not do:**
- Decide what the root should become. The human holds the aim.
- Create receipts. Only evidence creates receipts.
- Advance state without a receipt.
- Alter sources.
- Confirm tags without user action. Consent before compute.
- Promote ⊘ to ◻ without user confirmation.

**On summaries:**
Seven stores in blocks first. Summaries are computed views, never the source of truth.

---

## 13. The Assembly Index [D]

The complete record of how a root became real. The product's unique data asset.

**Contains:**
- Original root and gloss
- Every source with extraction history
- Every block with full metadata (Level 3)
- Every state transition with triggering receipt
- Every delta sentence
- Seed at each historical state
- Final object at terminal state
- Domain coverage map at each state

**What it reveals:**
- How long does it take to build X?
- What sources matter most?
- Where do assemblies stall?
- What patterns repeat across assemblies?
- Is this assembly coherent?
- Which domains get neglected?
- How fast does the user resolve ambiguity?

**Health indicators:**

| Indicator | Healthy | Unhealthy |
|-----------|---------|-----------|
| Coherence | △ and ◻ converge | △ and ◻ diverge |
| Entropy | Possible next-states decrease | Options stay flat or grow |
| Irreversibility | Each receipt seals real change | Transitions are hypothetical |
| Compressibility | Fewer blocks in final than entered | No compression |
| Velocity | Receipt intervals stable or decreasing | Intervals increasing |
| Balance | Blocks across △ ◻ ○ | Heavy skew |
| Coverage | All applicable domains have ◻ blocks | Domains missing |
| Confirmation | Low ⊘ backlog | Growing unconfirmed queue |

---

## 14. The Data Opportunity [D]

Every assembly produces structured data no other platform generates:

1. **Intent** — roots, glosses, △ blocks
2. **Source** — what they look at, listen to, read
3. **Assembly** — state transitions, receipt sequences, block operations
4. **Meaning** — ○ blocks, tags, choices
5. **Outcome** — final objects, assembly indices
6. **Domain patterns** — which domains predict success, which predict stalling

The assembly authored its own manual. You just haven't read it yet.

---

## 15. What Loegos Is

Loegos is an assembly tracker for intended objects.

Not a project management tool. Loegos tracks objects, not tasks.
Not a note-taking app. Blocks are composable. Notes are not.
Not a mood board. Mood boards are static. Seeds grow.
Not a wiki. Wikis describe what is. Loegos tracks what is becoming.
Not a CRM. But a seed could be a relationship.
Not a journal. But a seed could be a life.

---

## 16. First Principles

1. A word is a root. Every real thing starts as language.
2. A root is seven words or fewer. The constraint is the feature. The gloss breathes.
3. A root is immutable. The seed evolves from it.
4. A block is an operator sentence. The smallest unit that preserves operational meaning.
5. Everything enters and exits as operator sentences.
6. Ambiguity is ⊘, not ◻. Nothing unclear becomes evidence.
7. Capture in two taps. Confirm in one gesture. Both must be fast.
8. A box is a coordinate system. Single-user. Context for assembly.
9. A receipt is proof of assembly. Only confirmed ◻ blocks satisfy it.
10. A seal is irreversible. The system remembers without blame.
11. The engine manages metadata. The UI reveals it progressively.
12. Consent before compute. Human holds aim. AI holds engine.
13. Blocks first, summaries second.
14. Reality speaks in receipts. Everything else is hope.

---

## Appendix A — System Invariants

---

### A.1 Domains

| Domain | Covers |
|--------|--------|
| **Vision** | What the object should look, feel, and function like |
| **Financial** | Cost, funding, budget, transactions |
| **Legal** | Contracts, permits, regulations, compliance |
| **People** | Who is involved — hires, partners, advisors, collaborators |
| **Physical** | Material reality — land, construction, hardware, space |
| **Technical** | Engineering, software, systems, tools |
| **Temporal** | Timeline, milestones, deadlines, sequencing |
| **Relational** | Stakeholder alignment, communication, trust |
| **Risk** | What could go wrong and what mitigates it |
| **Completion** | What evidence proves the object exists and is done |

Seven suggests applicable domains from root and gloss. User confirms. Removing a suggested domain requires a rationale. Minimum four for State 4.

---

### A.2 Gap Categories

A gap is a domain with no confirmed ◻ blocks. Domains with only △ or ○ blocks are gaps. Coverage means reality has been contacted at least once in that domain.

---

### A.3 Real-World Contact

A ◻ block qualifies if a neutral third party could review the source and agree a real-world event occurred.

**Passes:** signed contracts, meeting notes with named participants, photos of sites/objects, official correspondence, government filings, financial records, recorded conversations with external participants.

**Does not pass:** self-written narrative without verification, calendar invites, internal notes without external evidence, AI-generated content without referent, screenshots of the user's own system.

The test is externality.

---

### A.4 ◻ Block Sufficiency

Sufficient when: (1) source passes externality test, (2) user confirmed (not ⊘), (3) contains factual claim, (4) traceable to source with extraction pass ID.

---

### A.5 Ambiguity Resolution

⊘ is a holding state, not a failure state. Resolved via rapid confirmation or manual review. Cannot participate in receipts or domain coverage. Why not default to ◻: false grounding.

---

### A.6 New Root vs. Revised Gloss

Revise the gloss when aim shifts within the same object class. Create a new root when the object class changes or a stranger would not recognize continuity. Old root and box remain. New root can reference old as predecessor.

---

### A.7 Extraction Provenance

Source immutable. Re-extraction creates new block versions with new pass ID. Previous blocks preserved as superseded. User confirms active version. Both remain for provenance.

---

### A.8 Single-User Constraint

Boxes are single-user in v1. External parties appear as evidence, not users. Solo-first. The architecture supports future collaboration. v1 is a solo instrument.

---

*Seven words or fewer. That is a root. The rest is assembly.*
