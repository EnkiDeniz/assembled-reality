# Solution Architecture v0.1

Date: 2026-04-06
Status: Decision-ready planning gate
Purpose: Convert the current-state assessment and reviewer syntheses into one architectural position that is stable enough to enter planning.

## Inputs

- [Current State Assessment](../../current-state-assessment.md)
- [The De-obfuscation Experience](../The%20De-obfuscation%20Experience/The%20De-obfuscation%20Experience.md)
- [Inference Authority Rules v0.1](../Inference%20Authority%20Rules%20v0.1/Inference%20Authority%20Rules%20v0.1.md)
- [Feedback Synthesis 01](../feedback-syntheses/01-developer-2-synthesis.md)
- [Feedback Synthesis 02](../feedback-syntheses/02-developer-3-synthesis.md)
- [Feedback Synthesis 03](../feedback-syntheses/03-developer-4-synthesis.md)
- [Feedback Synthesis 04](../feedback-syntheses/04-developer-5-synthesis.md)
- [Feedback Synthesis 05](../feedback-syntheses/05-developer-6-synthesis.md)
- [Feedback Synthesis 06](../feedback-syntheses/06-developer-7-synthesis.md)
- [Feedback Synthesis 07](../feedback-syntheses/07-phase-1-plan-combined-feedback.md)
- [Feedback Synthesis 08](../feedback-syntheses/08-phase-1-acceptance-combined-feedback.md)
- [Phase 1 Proof Runbook](../Phase%201%20Proof%20Runbook/Phase%201%20Proof%20Runbook.md)

## Executive Position

The product direction is now clear enough to stop debating identity and move into solution framing.

Three things should be treated as settled:

- the current product truth is `source -> seed -> operate -> evidence -> receipt`
- the right experience direction is de-obfuscation
- the right governance direction is inference authority

The key architectural conclusion is:

**We should not build the full future inference system first. We should rebuild the workspace around a narrower, honest, Layer-1-first de-obfuscation loop.**

That means:

- local box sources only
- inline Operate on top of the current document experience
- block-level reveal first
- deeper word-level inspectability second
- attested human override with provenance
- no hidden fallback that pretends to be real AI

## Current Acceptance Target

For the current branch stage, solution quality should no longer be judged only by architectural readiness.

Phase 1 should now be treated as accepted only when three proof layers are true at the same time:

- mechanical proof: `lint`, `build`, `test:smoke`, and `test:e2e:local` green on a real machine
- human proof: one non-author local sign-off and one non-author preview sign-off when auth is available
- founder wow proof: one real file produces a visible de-obfuscation moment on the text itself

This means the next milestone is not more explanation or more internal cleanup.

It is proof that the experience actually feels real.

## The Problem We Are Actually Solving

The repo does not primarily suffer from missing features.

It suffers from a mismatch between:

- product truth
- surface truth
- code architecture

The product truth is concrete and strong.
The current surface over-explains and over-symbolizes that truth.
The current shell makes safe simplification difficult.

So the architecture must solve all three at once:

- present the real loop more simply
- ground inference more explicitly
- decompose the shell enough that iteration becomes safe

## Architectural Stance

### 1. Preserve the load-bearing spine

The following are not negotiable:

- source intake
- project/box persistence
- evidence and confirmation flows
- receipt and seal flows
- existing user/session boundary

These are real foundations already present in the codebase.

### 2. Treat vocabulary as negotiable

We should preserve product truth, not every historical term.

Working rule:

- keep the concepts that improve grounding and trust
- defer or soften metaphor that increases cognitive load
- let the experience teach the product before the language system explains it

### 3. Make Operate a reveal, not a room

This is the central product architecture change.

Operate should stop behaving like a separate destination and start behaving like a view transformation on the user's current document.

The user should feel:

- I wrote something
- I pressed Operate
- the system revealed what is grounded, weak, missing, or inferred

not:

- I left my document
- I went to another phase
- I read a separate analysis panel

### 4. Build trust from source grounding outward

The inference system should become more powerful only after it becomes more legible.

The order matters:

1. local-source grounding
2. inspectable receipts
3. attested overrides
4. deeper word-level reasoning
5. additional authority layers

Not the reverse.

## Phase-1 Product Architecture

### Target user loop

The first buildable target should be:

`Write -> Operate -> Inspect -> Fix -> Seal`

This is close enough to the de-obfuscation vision to change the product experience, but narrow enough to build on the current system.

### Phase-1 scope

Phase 1 should include:

- writing in the existing workspace document context
- an inline Operate toggle
- Layer 1 inference only using local box sources
- block-level signal first
- flagged spans where confidence is high enough
- inspectable receipts for any flagged block or span
- manual attested override with note and provenance trail
- desktop-first execution, with mobile limited to non-regression protection
- explicit availability/error states when AI services are unavailable

Phase 1 should also lock one hard reliability rule:

- if OpenAI is unavailable, Operate fails visibly
- it must not silently degrade into heuristic or "close enough" output while presenting itself as normal Operate behavior

Phase 1 should not include:

- Layer 2 history-based conviction
- domain-library enforcement
- canon-derived findings
- shape-library authority
- full always-on lexical compilation across every word
- a second philosophy-heavy teaching surface
- new metaphor-heavy navigation
- new top-level modes

## Experience Architecture

### Primary surfaces

The logged-in product should collapse toward a simpler workspace structure with four practical layers:

1. Document surface
2. Operate overlay
3. Inspect panel
4. Receipt/seal surface

These are not four separate rooms.
They are four depths of interaction around the same artifact.

### Document surface

This remains the main canvas.

Responsibilities:

- show the source-derived or user-authored working text
- support normal reading/writing/editing
- remain useful even when Operate is off

### Operate overlay

This is the first major change.

Responsibilities:

- render grounded diagnostic state directly on top of the document
- show block-level signals first
- optionally show flagged spans where evidence is confident enough
- let the user toggle the reveal on and off without leaving context

### Inspect panel

This is the trust surface.

Responsibilities:

- explain why a block or span received its signal
- show evidence chain from local sources
- distinguish grounded evidence from inference
- show uncertainty
- expose override actions and resulting provenance

### Receipt/seal surface

This should stay aligned with existing receipt flows, but become downstream of the new reveal loop instead of feeling like a detached terminal stage.

Responsibilities:

- summarize what is ready to seal
- show unresolved red or amber issues
- preserve auditability

## Inference Architecture

### Phase-1 inference contract

Phase 1 inference should be explicitly narrower than the long-term authority model.

Allowed inputs:

- the current document or selected working artifact
- local box sources
- existing confirmed evidence
- user-attested overrides

Disallowed inputs for signal determination in phase 1:

- project-history pattern inference
- domain library judgment
- canon posture material
- shape-library statistical heuristics acting as authority

### Phase-1 inference flow

The system should follow a deterministic order of operations:

1. identify candidate blocks
2. classify block intent and grounding need
3. retrieve relevant local source excerpts
4. assign preliminary block signal
5. identify high-confidence flagged spans within the block
6. produce inspectable receipt payloads
7. allow user confirmation, revision, or attested override

This keeps the system honest by grounding the broad claim first and only then narrowing to spans.

### Phase-1 inference engine constraint

Planning must choose an explicit engine for candidate generation and signal production.

The acceptable phase-1 paths are narrow:

- LLM-assisted candidate generation with explicit availability/error states and receipt-backed output
- narrowly scoped rules or heuristics only where they do not imply precision the system cannot justify

The architecture does not permit:

- silent degraded behavior presented as normal Operate output
- broad lexical certainty without receipt support
- engine ambiguity that makes a signal impossible to explain later

This should be resolved in planning, not left implicit in implementation.

### Signal model

The phase-1 signal model should be simple and interpretable:

- green = grounded by local source evidence
- amber = plausible but incomplete, indirect, or insufficiently grounded
- red = contradicted, unsupported, or structurally missing

Signals should be attached first at the block level.

Word or span-level signal should only appear when the system can explain it with a receipt.

### Receipt model

Every visible signal should be inspectable.

Each receipt should answer:

- what was evaluated
- what signal was assigned
- what source evidence supports it
- what inference step connected evidence to claim
- what uncertainty remains
- whether a human override exists

If the system cannot produce a receipt, it should not present confident visual signal.

For planning purposes, an inspectable receipt must be one of two things:

- persisted directly
- reproducible from a stored Operate payload or inference artifact

It should not depend on ephemeral in-memory state that disappears after the surface changes.

## Authority Architecture

### Long-term authority model

The authority model described in [Inference Authority Rules v0.1](../Inference%20Authority%20Rules%20v0.1/Inference%20Authority%20Rules%20v0.1.md) remains the target constitution.

That means the long-term system may eventually include:

- Layer 1 local box evidence
- Layer 2 project history annotation
- Layer 3 applicability-gated domain validation
- Layer 4 canon as posture
- Layer 5 advisory pattern/statistical material

### Phase-1 authority decision

For planning purposes, phase 1 should lock one architectural rule:

**Only Layer 1 may determine visible grounding signal.**

Other layers may exist later, but they are not part of the first implementation contract.

This avoids building governance complexity before the core reveal loop exists.

### Override model

The current reviews converged that "force-green" is the wrong concept label.

The phase-1 architecture should use:

`Attested Override`

Responsibilities:

- let a human assert a claim despite missing or partial evidence
- require an explanatory note
- lower trust relative to source-grounded evidence
- preserve provenance in the receipt chain
- remain clearly distinct from source-grounded green

Attested overrides must also surface explicitly in seal preflight.

Minimum phase-1 requirement:

- the seal surface must show where overrides exist
- overrides must remain distinguishable from source-grounded green
- override counts or affected claims must be auditable at seal time

Whether override accumulation becomes a seal blocker remains a planning question and should not be left implicit.

## Application Architecture

### Main structural change

The largest technical bottleneck remains [WorkspaceShell.jsx](../../../src/components/WorkspaceShell.jsx).

Phase-1 architecture should assume decomposition as part of the solution, not as optional cleanup.

At minimum, the workspace should separate into responsibilities close to:

- workspace frame and routing state
- document presentation and editing
- operate overlay rendering
- inspect/receipt panel state
- evidence/confirmation orchestration
- audio/listening concerns
- receipt sealing concerns

The exact component names can change, but the responsibilities must split.

Preferred early extraction order:

- document presentation and editing
- operate overlay rendering
- inspect/receipt panel state

These three seams are closest to the phase-1 product shift and should take priority over peripheral concerns.

### Backend posture

The existing backend routes and data model are strong enough to support an incremental transition.

Working rule:

- reuse current auth/session/project/evidence/receipt substrate
- prefer evolving the current Operate path where possible
- allow targeted replacement if the current Operate route cannot support phase-1 receipt and grounding requirements cleanly
- add new payload shapes where necessary for receipts and overlays
- do not require the full multi-layer inference engine before phase 1 ships

### Data posture

The current schema already supports much of the load-bearing product.

Phase 1 should prefer minimal, explicit additions over broad model churn.

Likely architectural additions:

- operate run metadata
- inspectable receipt payload storage or reproducible receipt artifacts
- attested override records
- optional block/span inference artifacts

These can be implemented as new models or carefully scoped structured payloads, but the architecture should preserve auditability either way.

## UX and Trust Rules

The reviews converged on several rules that should be architectural, not cosmetic:

- do not silently degrade AI behavior without telling the user
- do not allow Operate to masquerade as available when its required model path is unavailable
- do not present heuristics as grounded evidence
- do not let history alone convict a claim
- do not let canon appear as cited evidence
- do not force users through conceptual mode-switching to understand what changed
- do not show fine-grained lexical certainty unless the system can explain it
- do not add new metaphor-heavy navigation or new top-level modes in phase 1

These are product rules, trust rules, and architecture rules at the same time.

## Sequencing Architecture

### Stage A: Stabilize the surface for change

Before or while building the new reveal loop:

- isolate workspace responsibilities from the giant shell
- expose service availability clearly
- remove silent fallback behavior where it affects trust
- preserve current core flows during refactor

Stage A should have an explicit definition of done before Stage B is allowed to begin in earnest:

- [WorkspaceShell.jsx](../../../src/components/WorkspaceShell.jsx) is materially reduced and core responsibilities are extracted to named modules
- lint passes
- silent AI fallback is removed or clearly surfaced to the user
- Operate and receipt flows still function after decomposition
- a smoke test exists for the core `source -> seed -> operate -> receipt` pipeline

Stage A should also prefer extraction order that stabilizes the future phase-1 seam first:

- document
- Operate overlay
- inspect/receipt state

This reduces the risk of parallelizing multiple large refactors before the main loop is under control.

### Stage B: Build the Layer-1 reveal loop

This is the first true product shift:

- inline Operate toggle
- block-level reveal
- flagged spans only where justified
- inspectable receipts
- attested override
- desktop-first implementation, mobile non-regression only

### Stage C: Deepen inspectability

Only after the Layer-1 loop feels coherent:

- improve span-level reasoning
- improve evidence retrieval quality
- improve receipt clarity and provenance display

### Stage D: Add additional authority layers

Only after the Layer-1 system is trusted:

- history annotation
- applicability-gated domain checks
- canon posture layer
- advisory pattern layers

This order should be preserved.

## What This Architecture Deliberately Does Not Do

This architecture is not:

- a feature checklist
- a UI polish brief
- a full implementation plan
- a claim that the current code already does this
- a commitment to full word-level compilation in phase 1

It is a constraint document for the next planning step.

## Ready-for-Plan Decisions

The following should be treated as decision-ready unless new evidence changes them:

- this document is ready to gate entry into planning
- the first move is de-obfuscation-oriented, not phase-preserving
- phase 1 is Layer 1 only
- Operate becomes inline, not separate-surface first
- block-level reveal comes before universal word-level reveal
- attested override is included in the architecture
- phase 1 is desktop-first, with mobile held to non-regression
- no silent fallback for Operate when required AI is unavailable
- no new metaphor-heavy navigation or new top-level modes in phase 1
- authority complexity is deferred until the core loop works
- workspace decomposition is part of the solution, not background cleanup

## Planning-Critical Questions

The following questions are not ordinary detail work.
They are load-bearing planning decisions that may change scope, sequencing, and implementation shape:

### 1. What becomes the primary editable surface?

Phase 1 must resolve whether the user is primarily operating on:

- a source-derived working document
- a seed-like synthesis surface
- a new unified writing surface

This question determines whether phase 1 is primarily:

- a refactor of the current create/think flow
- an overlay on top of existing artifacts
- a replacement of the current main writing surface

### 2. Can the current Operate route be evolved, or must it be partially replaced?

The current Operate implementation is oriented around whole-box structured output.
Phase 1 de-obfuscation needs more grounded block/span reasoning and inspectable receipts.

Planning must decide whether the existing route is:

- sufficient with payload evolution
- sufficient only as one stage inside a new pipeline
- too mismatched and in need of targeted replacement

### 2a. What engine produces phase-1 candidates and signals?

Planning must decide what produces candidate blocks, flagged spans, and receipt-backed signal in phase 1.

At minimum, the decision must answer:

- what is LLM-assisted versus deterministic
- what happens when the model path is unavailable
- where narrow heuristics are allowed
- how the chosen engine preserves explainability

### 3. Which current modes and phases are retired, bridged, or preserved?

The current workspace contains multiple modes, phases, and navigation surfaces.
Phase 1 must explicitly decide the fate of at least:

- listen mode
- assembly lane
- launchpad/box home style surfaces
- mobile-specific navigation forks

Without this decision, the new overlay risks becoming an addition on top of the old maze instead of a simplification of it.

## Open Questions for the Planning Phase

These should be resolved in planning, not here:

- what exact artifact becomes the primary editable surface in phase 1
- whether phase 1 uses block-only reveal first or block plus tightly scoped flagged spans
- whether receipts should be persisted directly or reproduced from stored payload artifacts
- how much of the current Operate route can be evolved versus replaced
- what phase-1 inference engine produces candidates and receipt-backed signal
- what the smallest safe shell decomposition boundary is
- which current modes/phases can be retired immediately versus temporarily bridged
- what minimum mobile non-regression contract phase 1 must preserve
- whether override accumulation affects seal blocking or only seal disclosure

## Closing Position

The right move is now visible.

We do not need more product philosophy before planning.
We need a disciplined architecture that respects the current code, preserves the working spine, and sequences the shift toward de-obfuscation without pretending the full future inference engine already exists.

The architecture in one sentence:

**Rebuild the logged-in workspace around an inline, Layer-1-first de-obfuscation loop that preserves the existing source/evidence/receipt spine, makes inference inspectable, and decomposes the shell enough to plan and ship safely.**
