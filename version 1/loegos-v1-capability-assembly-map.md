# Lœgos v1
## Capability Assembly Map
### Rebuild foundation

## 1. Why this document exists

The current product is no longer failing mainly because it lacks features. It is failing because the shell and navigation still express an older product shape, while the center of gravity has shifted toward a visible reality-assembly system with a teachable language layer.

That means the next step should not be "fix the screen." It should be:

1. identify the load-bearing capabilities the system must actually have
2. verify which ones already exist in the product and backend
3. separate what is real from what is only cosmetically present
4. rebuild the shell around those capabilities instead of continuing to patch legacy flows

This document is the new foundation for that rebuild.

## 2. Core rule

A screen is not a product truth. A capability is a product truth.

So the right question is not "what should the workspace look like?" The right question is:

- what object exists?
- what can the human do to it?
- what changes when they act?
- what remains immutable?
- what can be listened to, compared, inspected, attested, or sealed?

The shell should be assembled only after these answers are clear.

## 3. Current overall read

The strongest current reality is this:

- the backend and object substrate are ahead of the shell
- source intake is stronger than the current workspace makes it feel
- listening exists as real infrastructure, not just decoration
- seed, assemble, operate, override, and receipt all exist as real persisted flows
- the current shell is the main source of confusion
- the next rebuild should follow the atomic ladder:
  `source object -> witness -> block -> marked block -> compiled Lœgos structure -> move/test -> receipt`

So the rebuild should preserve the substrate and replace the container.

## 4. Capability ladder

### 4.1 Infrastructure basics

Current status: `present`

What exists now:

- authentication and session flow
- account surface and profile plumbing
- project / box persistence
- document persistence
- route structure for seed, assemble, operate, receipt, and overrides
- settings and disclaimer layers

Current judgment:

- this is not the bottleneck
- the infrastructure base is sufficient for a v1 rebuild

Acceptance test:

- a user can sign in, enter the workspace, open a box, and return later without losing the box or its documents

Shell consequence:

- the next shell should assume infrastructure is already there and should not redesign around auth or settings

### 4.2 Box container

Current status: `present but conceptually muddy in the UI`

What exists now:

- a box / project object with sources, working documents, receipts, logs, and runtime state
- a notion of one current active assembly/seed while still allowing multiple documents inside the box

Current judgment:

- the object is real
- the UI does not yet make the box feel like a stable, legible container

Acceptance test:

- a user can answer: "what box am I in, what sources belong to it, what active language object belongs to it, and what receipts came out of it?"

Shell consequence:

- the new shell should make the box itself legible before it tries to expose every subsystem

### 4.3 Source intake and normalization

Current status: `present and stronger than the current UI suggests`

What exists now:

- upload of `txt`, `md`, `markdown`, `docx`, and `pdf`
- paste of text and image content
- link import
- image intake with derivation modes
- audio upload with transcript derivation
- normalization into workspace documents with markdown-backed content

Current judgment:

- source intake is one of the strongest parts of the system
- the product already behaves like a source normalization engine
- the UI still makes this feel more fragmented than it really is

Acceptance test:

- a user can bring text, file, image, audio, or link material into the box and end with a readable markdown-backed witness object

Shell consequence:

- "bring one real source into the box" should remain a first-class entrance into the system

### 4.4 Source as a readable object

Current status: `present`

What exists now:

- normalized documents render as readable workspace objects
- source metadata, provenance hints, and document summaries exist
- the system distinguishes source documents from built-in or derived objects

Current judgment:

- reading exists
- it is not yet presented with enough calm or clarity

Acceptance test:

- a user can open any source and immediately understand that it is witness material rather than active structure

Shell consequence:

- witness reading should be simple, stable, and calm

### 4.5 Source editing at notes-app level

Current status: `partial`

What exists now:

- document save/update routes
- editable workbench surfaces and textareas
- direct document persistence

What is not yet true enough:

- the editing experience does not yet feel as simple and trustworthy as a notes app
- there is too much shell complexity around the editable object
- it is not always clear whether the user is editing witness, active structure, or a draft derivative

Acceptance test:

- a user can open a text object, edit it directly, save it, return to it, and trust what changed

Boundary question:

- witness editing and Lœgos editing must be treated as distinct capabilities, not the same action with different labels

Shell consequence:

- the new shell should expose editing only when the object boundary is clear

### 4.6 Listening to content

Current status: `present but uneven in experience`

What exists now:

- player controls
- persisted listening session substrate
- block/document playback logic
- speech and transcript-related infrastructure
- a product assumption that listening is part of interpretation

What is not yet true enough:

- the current shell does not make listening feel native to the working object
- it is not yet consistently obvious what is being played: witness, language, or another derived layer

Acceptance test:

- a user can play a document, pause, seek, resume later, and know exactly what object is being heard

Shell consequence:

- listening should be attached to the current object, not treated as a floating side feature

### 4.7 Listening with text-follow

Current status: `partial`

What exists now:

- block-level playback and selection state
- enough substrate to bind playback to reading context

What is not yet true enough:

- full-text following is not yet calm, obvious, or uniformly reliable across the product
- section-level or line-level follow behavior is still uneven

Acceptance test:

- while audio plays, the corresponding text remains visibly anchored without the user wondering what part of the object is active

Shell consequence:

- this should become one of the main reasons the reading surface exists, not an afterthought

### 4.8 Converting witness into Lœgos

Current status: `present but not yet trustworthy as a simple user journey`

What exists now:

- source-first seed generation
- staged assembly flow
- founder/workbench rendering of Lœgos structure
- a real distinction between witness material and compiled/active structure

What is not yet true enough:

- the crossing into Lœgos is still too dependent on shell state and journey wiring
- it appears in the product, but not yet with the inevitability or simplicity that the language claim requires

Acceptance test:

- a user can bring witness text into the box and deliberately convert it into active Lœgos structure without ambiguity about what just happened

Shell consequence:

- the witness-to-Lœgos crossing should be one of the most explicit transitions in the whole product

### 4.9 Side-by-side compare

Current status: `partial`

What exists now:

- a founder compare surface
- witness-left and active-structure-right model
- inspect-side rationale for what changed

What is not yet true enough:

- compare currently exists, but the journey is brittle
- it does not yet feel like the natural center of the product
- the shell still allows too many ways to fall out of the compare truth into older mixed surfaces

Acceptance test:

- a user can see the witness and the active Lœgos object side by side, select corresponding material, and understand why the active form is more operable

Shell consequence:

- compare should be treated as a primary proving capability, not a special case

### 4.10 Editing active Lœgos structure

Current status: `partial but real`

What exists now:

- line-level or block-backed line operations in the founder workbench
- rewrite, compress, split, merge, accept, draft, recast, and stage actions
- direct mutation of the active language document

What is not yet true enough:

- the shell still makes this feel more experimental than authoritative
- the object boundary between active structure and surrounding workspace state is not yet calm enough

Acceptance test:

- a user can edit the active Lœgos object directly and trust that they are editing the real working structure, not a transient view

Shell consequence:

- once the shell is rebuilt, this should feel closer to editing code or notes than pressing app buttons on a card

### 4.11 Seeing how edits change the Lœgos version

Current status: `partial and requires explicit boundary rules`

What exists now:

- direct editing of active structure
- operations that reshape the structure itself
- inspect/diagnostic surfaces that reflect current block or line state

What is still ambiguous:

- whether witness edits should automatically affect Lœgos, trigger recompilation, or remain separate until an explicit conversion step
- whether the user is editing source truth or active structure truth at a given moment

Acceptance test:

- after an edit, the user can say exactly which object changed and why the visible Lœgos state changed

Critical rule:

- editing witness and editing Lœgos cannot be collapsed into one blurred experience

### 4.12 Operate as analytical read

Current status: `present`

What exists now:

- persisted operate runs
- overlay findings
- convergence/trust/depth or equivalent signal surfaces
- receipt audit integration
- explicit distinction between Operate and chat

Current judgment:

- Operate is real and more than summarization
- it already functions as a system read of the active object

Acceptance test:

- a user can run Operate on the active structure and receive a bounded, inspectable analytical result that is clearly not just open-ended chat

Shell consequence:

- Operate should remain downstream of active structure, not blended into source reading

### 4.13 Human attested override

Current status: `present and constitutionally important`

What exists now:

- persisted `ReaderAttestedOverride`
- override creation and deletion routes
- inspect UI for attesting a line
- override-aware operate and receipt audit flows

Current judgment:

- this is one of the strongest product truths in the whole system
- it must survive any rebuild

Acceptance test:

- a user can say "the machine read is not final here" and leave a durable attested human judgment on the active object

Shell consequence:

- override must remain first-class and visible enough to protect the product from drifting into machine sovereignty

### 4.14 Receipt draft and seal

Current status: `present`

What exists now:

- receipt drafting
- seal audit
- override acknowledgment
- remote sync substrate
- outward proof transport

Current judgment:

- receipts are already a real product layer, not just a placeholder
- the shell still does not make the path to receipt feel as coherent as the backend makes it possible to be

Acceptance test:

- a user can draft a receipt from the current box state, inspect seal readiness, acknowledge overrides if necessary, and seal when ready

Shell consequence:

- receipts should appear as outputs of the same working object tree, not as a separate subsystem

### 4.15 Return to a box and resume work

Current status: `partial`

What exists now:

- box persistence
- project/document reload
- current document and current box recovery

What is not yet true enough:

- return-to-box state is not presented as a coherent "where things stand now" experience
- the user often lands in shell state rather than box state

Acceptance test:

- after returning days later, the user can immediately understand the box's current witness set, active structure, current blocked state, and likely next move

Shell consequence:

- the rebuilt box home should summarize state, not just restore whichever surface happened to be last open

## 5. Capability status summary

### 5.1 Present and worth preserving

- infrastructure basics
- source intake and normalization
- readable witness objects
- operate substrate
- attested override
- receipt draft and seal

### 5.2 Present but shell-confused

- box container legibility
- listening experience
- witness-to-Lœgos conversion
- compare
- return/resume state

### 5.3 Partial and needing explicit product decisions

- notes-app-grade editing
- text-follow during listening
- active Lœgos editing as a stable primary workflow
- how witness edits relate to Lœgos updates

## 6. The most important boundary to protect

The single most important capability boundary is still:

`witness material -> active Lœgos structure`

That boundary must answer all of these clearly:

- what remains immutable
- what becomes editable
- what can now be staged, inspected, or operated on
- what compare is actually comparing
- what human override attaches to

If this boundary is blurry, the whole product feels blurry.

## 7. Rebuild rule for the next shell

The next shell should be assembled only from capabilities that can pass their acceptance test.

That means:

- do not begin with navigation
- do not begin with tabs
- do not begin with pane composition
- begin with the capability ladder
- choose the smallest coherent set of capabilities that forms a trustworthy user loop
- make the shell express that loop and nothing more

## 8. The likely first assembled loop

If the rebuild starts from the current strongest substrate, the first complete loop is likely:

1. enter a box
2. add one real source
3. read it as witness
4. listen to it
5. convert it into active Lœgos structure
6. compare witness and active structure
7. edit the active structure
8. run Operate
9. attest disagreement if needed
10. draft and seal a receipt

That loop is already partially real in the system.

The main problem is not that the loop does not exist.

The main problem is that the current shell does not yet make that loop feel inevitable, calm, or trustworthy.

## 9. Short version

The product does not need more patched screens right now. It needs a capability-first rebuild.

The backend and object substrate already provide enough real material to do that:

- bring in witness
- normalize it
- read it
- listen to it
- convert it
- compare it
- edit active structure
- operate on it
- attest disagreement
- receipt what survived

The next shell should be assembled around those truths and should discard anything that makes those truths harder to perceive.
