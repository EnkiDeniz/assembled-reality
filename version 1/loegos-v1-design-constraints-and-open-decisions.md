# Lœgos v1
## Design Constraints and Open Decisions

**Purpose:** bridge the aim brief and the language spec into a planning-ready document for implementation  
**Source documents:**
- `version 1/loegos-aim-brief-final-v1.0.md`
- `version 1/loegos-language-spec-final-v1.0.md`

This document does not redefine the product.  
It isolates:

1. what appears fixed across both source documents
2. what still needs an explicit implementation decision before planning and build kickoff

---

## 1. Working understanding

Lœgos is trying to become a real coordination language and a real coordination instrument.

At the product level, it exists to help a human move from aim, through reality, into action, receipt, and honest update without mistaking coherence, visibility, pressure, or polished language for truth.

At the language level, it is meant to feel like a typed, inspectable, compiler-like environment for coordination, not like a note app, word processor, or generic AI editor.

The two source documents are aligned:

- the aim brief defines the purpose and the non-negotiables
- the language spec defines the user-facing language workbench that should make that purpose tangible

---

## 2. Fixed design constraints

These look settled enough that implementation should treat them as constraints, not as open ideation.

### 2.1 Core product aim

The system exists to help the user:

1. clarify the aim
2. clarify reality
3. connect aim and reality
4. contact reality
5. update honestly

The real loop is:

`Aim -> Reality -> Move -> Receipt -> Update`

or

`declare -> observe -> connect -> act -> test -> receive -> update`

### 2.2 The product is not a normal editor

The product should not feel like:

1. a note app
2. a word processor
3. a chat thread
4. a generic AI writing surface

It should feel closer to:

1. a code editor
2. a compiler surface
3. a structured notebook
4. a block-and-text language workbench

### 2.3 The system is not replacing human interpretation

The AI may help type, compare, infer, compress, flag, and project.  
The human still chooses, acts, and bears reality contact.

Any build that quietly collapses human authorship into model output would violate the aim.

### 2.4 Reality must remain outside the system

Proof cannot be self-generated in a way that lets the system seal itself from internal coherence alone.

This means:

1. receipts matter because something outside the system answered
2. compile-time strength and runtime proof must remain distinguishable
3. beautiful closure without real contact is a failure mode

### 2.5 State must be legible

Both documents insist that state boundaries matter.

The user must be able to distinguish states such as:

1. source or witness material
2. staged or provisional material
3. active structure
4. committed structure
5. unsupported or weakly supported structure
6. attested structure
7. stale or contradicted structure
8. receipt-bearing or sealed structure

If those states blur, honesty degrades.

### 2.6 The middle act is the load-bearing problem

The hardest and most important boundary is not intake and not final proof.  
It is the transition where witnessed material becomes active structure and then a reality-testable move.

This appears in both documents as the real commitment boundary.

### 2.7 The language must feel typed

The editor should make it obvious that not all lines are the same kind.

At minimum, the language spec treats these semantic types as the core set:

1. `Aim`
2. `Reality`
3. `Weld`
4. `Seal`

The user should feel that units have type, structure matters, and invalid or weak constructions can be inspected.

### 2.8 Type and stage are separate dimensions

The language surface must preserve the difference between:

1. semantic type
2. execution stage

At minimum, the stage model is:

1. `Declare`
2. `Observe`
3. `Weld`
4. `Move`
5. `Test`
6. `Receipt`
7. `Seal`

This distinction appears central, not optional.

### 2.9 The line is the primary editing unit

The language spec is clear that the line is the closest analog to a real statement in the language.

Spans, blocks, documents, and box context all matter, but the first-class editing object is the line.

### 2.10 The system should behave enough like a compiler to feel real

The system should read along, classify, flag weakness, and help the user inspect and revise structure.

Compiler-like behavior is not an aesthetic layer.  
It is part of the product claim.

### 2.11 Listening is part of the interpretation model

Listening is not a cosmetic media feature.  
It belongs to sensing and inspection.

The system should support at least:

1. quick play of the current unit
2. playback by larger grouping
3. replay after rewrite
4. stable return to the same place

### 2.12 Evidence and support must remain near the language

Meaningful state cannot live only in a side rail.

The language itself should visibly carry:

1. type
2. stage
3. support or weakness
4. attestation or contradiction where relevant

Side surfaces can support the language, but should not be the only place where the language becomes intelligible.

### 2.13 Attested human override is not optional

The language spec and the aim brief both depend on a mode where human judgment can outrun current machine support without pretending that support exists.

That means:

1. override must be explicit
2. override must remain inspectable
3. override must not silently convert into strong proof

### 2.14 The first proving experience is a language proof

The immediate target is not the entire eventual operating system.

The first strong proof should likely be:

1. start from an ordinary human-written document
2. compile or convert it into Lœgos structure
3. compare original vs Lœgos form
4. inspect why lines changed in role, stage, support, or clarity
5. manipulate the Lœgos version directly

That is the first clear test that the language is real.

---

## 3. Minimum v1 commitments implied by the documents

If planning begins now, the following appear to be the minimum believable v1 target:

1. a dedicated language surface
2. line-addressable editing
3. visible type rendering
4. visible stage rendering
5. visible support or weakness rendering
6. compiler-like findings
7. inspectable evidence links
8. split, merge, and compress operations
9. attested human override
10. quick listening
11. a clear staged vs committed boundary

This does not define the full product.  
It defines the minimum shape of the first convincing language experience.

---

## 4. Open decisions that need explicit resolution

These are the main decisions still left open by the brief and the spec.

### 4.1 Where the first proving surface lives

We need to decide whether the first language proof should be:

1. a dedicated standalone language workbench
2. a mode inside the current box workspace
3. a source-to-language compare surface layered onto the existing product

This is not a cosmetic decision.  
It determines how much of the current box runtime gets reused versus bypassed in the first proof.

### 4.2 Whether the user primarily writes Lœgos directly or compiles prose first

The documents strongly support a first proving flow where ordinary prose is compiled into Lœgos.

What is still open is whether v1 should primarily optimize for:

1. prose in -> Lœgos out
2. direct Lœgos authoring
3. a hybrid where compilation is the entry and direct manipulation is the main working mode

### 4.3 How visible the type and stage systems should be

The semantic model appears fixed, but the UI presentation is still open.

We need to settle:

1. whether type names are always visible or partly symbolic
2. whether stage is always visible or shown on demand
3. whether both dimensions render inline, in gutter, or in a mixed model

### 4.4 How much line-vs-block compromise is acceptable in v1

The current product is more block-oriented.  
The language spec is line-first.

We need to decide:

1. whether v1 truly promotes line as the working unit
2. whether blocks remain the runtime storage unit while lines become the visible editing abstraction
3. how much span-level support is needed in the first build

### 4.5 Which compiler checks are mandatory for the first proof

The spec lists many possible checks.  
The first implementation needs a mandatory subset.

The main unresolved question is which checks are required to produce a convincing first proof of the language.

The likely candidates are:

1. missing reality
2. weak or rhetorical weld
3. move without test
4. overclaimed closure
5. unsupported support
6. direct contradiction
7. bloated or compressible line
8. stage confusion

### 4.6 How much authorship or stance is in scope for v1

The aim brief says pressure and authorship must not be flattened.  
The language spec says stance may eventually need its own dimension.

What remains open is whether v1 should:

1. simply avoid flattening stance in architecture
2. expose a minimal stance model in the UI
3. make stance part of the first language proof itself

### 4.7 What exactly counts as the commitment boundary in v1

Several adjacent boundaries matter:

1. source to staged
2. staged to active language
3. active language to move or test
4. test to receipt
5. receipt to seal

The documents make clear that commitment boundary honesty is central, but they do not settle which of these boundaries is the first one v1 must make unmistakable.

### 4.8 How far the first build should go into runtime proof

The language proof and the full reality-contact loop are related but not identical.

We need to decide whether v1 is primarily:

1. a language workbench proof
2. a language workbench plus lightweight runtime receipt path
3. a more complete end-to-end loop including explicit move, test, receipt, and seal behavior

### 4.9 What the minimum side surfaces are

The spec allows diagnostics, evidence, rationale, rewrites, receipt history, listening controls, and file or box status in side surfaces.

We still need to settle which of those are required for the first version and which can remain out of scope.

### 4.10 How the box context should affect the first language workbench

The language document and the larger box context must stay distinguishable.

The unresolved question is how much of the surrounding box should be visible in the first language experience:

1. source corpus
2. prior receipts
3. current box aim
4. support conditions
5. project-level status

### 4.11 What the user compares against in the proving experience

The spec strongly implies comparison between:

1. original prose
2. compiled Lœgos form

What is still open is whether comparison should be:

1. side-by-side
2. inline diff
3. toggle view
4. source pane plus compiled pane

### 4.12 How much listening granularity is needed for the first release

The spec names line, block, and selected-range playback.

We need to decide which of those are required in the first language proof versus which can follow later without weakening the claim.

---

## 5. Planning implications

Before implementation planning starts, the team should explicitly answer:

1. What is the first proving surface?
2. Is the first working mode compile-first, author-first, or hybrid?
3. What is the primary visible unit: line, block, or line-on-block?
4. Which compiler checks are mandatory for the first proof?
5. Which commitment boundary must become unmistakable first?
6. What stance or authorship handling is required now versus merely preserved for later?
7. How much runtime proof is part of v1 versus part of the next layer?

If those decisions are made clearly, the aim brief and the language spec become planning-ready.

If those decisions remain blurred, the team risks building something that is interesting, expressive, and even elegant, but still ambiguous at the exact boundary the product exists to clarify.

---

## 6. Short version

The aim brief says:

- build an honest coordination instrument
- protect the boundary between coherence and truth
- help a human commit the right structure before reality answers back

The language spec says:

- make that instrument feel like a real language
- give it typed units, visible stages, compiler-like checks, inspectable evidence, and manipulable structure

The implementation challenge is therefore:

**build the first language workbench that makes Lœgos unmistakably real without losing the honesty constraints that give the language its point.**
