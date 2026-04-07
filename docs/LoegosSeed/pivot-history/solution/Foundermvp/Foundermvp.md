# FounderMVP

Date: 2026-04-06
Status: Replan brief
Purpose: Reset the product conversation around the simplest truthful founder experience we can ship next.

## Why This Brief Exists

We have made real progress on trust, persistence, proof, and workspace architecture.

That progress is valuable, but it does not yet produce a clean founder-facing experience.

The current branch can:

- create and persist boxes
- import sources
- open documents
- listen to text
- shape seeds
- run Operate
- inspect findings
- acknowledge overrides
- draft and seal receipts

But the first-run experience still exposes too much of the machine too early.

The result is a product that is technically more honest, but still hard to enter.

This brief exists to define the actual founder MVP:

**a calm source-first experience that lets a user add one file, read it, listen to it, and know the one next move into the Loegos flow.**

## Current State

### What is working

- `/workspace` now has a calmer starter entry rather than always dropping directly into the dense unified shell.
- The system can create a new box automatically for source intake.
- Source import works through real upload, paste, link, and voice paths.
- The imported source can open in listen mode and preserve the real text.
- The trust spine is much stronger than before:
  - fail-closed AI
  - persisted operate runs
  - attested overrides
  - coverage honesty
  - seal acknowledgment

### What is not working

The early experience is still mixing too many product layers at once.

In the current flow:

1. the user starts correctly at `Start with a source`
2. source intake opens
3. after adding content, the user sees the raw text
4. but the surrounding surface still feels like the old box machine
5. `listen` feels like a mode stack rather than a simple capability
6. the next transition lands on an empty `Seed` page with weak narrative

This makes the experience feel half-calm and half-trapped.

### The actual symptom

The user does not feel:

- “I added a source”
- “I can see it clearly”
- “I can listen to it”
- “I know what to do next”

Instead, the user feels:

- “I am already inside a system”
- “I can see source, seed, and future compiler logic at once”
- “I pressed listen and now I am stuck in an empty seed screen”

That is the gap this brief is trying to close.

## Problem Statement

The product is still introducing Loegos in the wrong order.

It is exposing:

- box structure
- source structure
- seed structure
- mode structure
- future compiler/seal structure

before the user has completed the most basic act:

**add one thing, experience it as a source, and understand the one next step.**

The first pages of the product are currently trying to teach the entire system.

They should instead do one simpler job:

**help the user move from raw source to first seed with clarity and confidence.**

## FounderMVP Product Thesis

The founder MVP should feel closer to:

**Apple Notes + listen + one clear next step into Loegos**

than to:

**a compiler IDE with multiple internal surfaces already visible**

This is not a fake demo path.
It is the truthful first layer of the real product.

The heavy workspace still matters.
It simply belongs later in the journey.

## Experience Goal

The ideal founder experience is:

1. open workspace
2. tap `Add source`
3. paste or upload one real file
4. see the source text clearly
5. optionally listen to it
6. understand what Loegos wants next
7. move into seed shaping
8. only then enter the fuller box/runtime if needed

The key test is simple:

**Can the user tell where they are, what object they are looking at, what they can do here, and what happens next?**

## The Target Flow

The founder MVP should use five surfaces.

### 1. Start

Purpose:
give the user a clean way to begin

What the user sees:

- `Add source`
- `Open box`
- `Start fresh`
- `Account`
- `Sign out`

What the user can do:

- start from zero
- return to an existing box
- create a blank new box

What happens next:

- `Add source` opens source intake
- `Open box` opens the box list
- `Start fresh` creates a box and keeps the user in a calm state

What should not appear here:

- compiler state
- diagnostics
- receipts
- seed state
- mode stacks
- metaphor-heavy guidance

### 2. Add Source

Purpose:
capture one source in the simplest possible way

What the user sees:

- upload
- paste text
- paste link
- photo
- speak note
- done or cancel

What the user can do:

- add one source through a real intake path

What happens next:

- on success, the app opens the imported source itself

What should not appear here:

- source inventory
- seed inventory
- “no visible sources”
- “no seed yet”
- compiler or seal messaging

This surface should be an intake screen, not a mini control room.

### 3. Source View

Purpose:
let the user experience the source as-is before any transformation

What the user sees:

- source title
- raw text
- listen controls
- one short explanation:
  - `This is the source as captured.`
- one primary CTA:
  - `Next: Shape seed`
- one secondary CTA:
  - `Open box`

What the user can do:

- read the text
- listen to the text
- remain in the raw source view
- move to seed shaping when ready

What happens next:

- `Next: Shape seed` opens the first seed-writing surface
- `Open box` enters the fuller box home

What should not appear here:

- source tabs
- seed tabs
- aim / reality / weld mode cards
- diagnostics rail
- compiler panel
- seal panel
- Seven as a dominant frame

Listen should be a capability on this page, not a separate worldview or destination.

### 4. Shape Seed

Purpose:
convert raw source into the first Loegos-authored object

What the user sees:

- a seed editor
- a lightweight reminder of the source
- plain language about what a seed is
- one primary authoring action
- one return path back to source

What the user can do:

- write or shape the first seed
- refer back to the source
- continue forward only after something meaningful exists

What happens next:

- once a real seed exists, the fuller Loegos workflow becomes relevant

What should not appear too early:

- seal blockers
- empty advanced panels
- compiler language that outruns the user’s current state

The current empty seed page is where the narrative breaks.
It needs to become a guided shaping page, not a blank advanced mode.

### 5. Full Box

Purpose:
support deeper work after source and seed are both real

What the user sees:

- source inventory
- seed/workbench
- Operate
- inspect
- diagnostics
- receipts
- deeper runtime tools

This remains important, but it is not the right first page.

## Page-by-Page Product Rules

Each surface should answer four questions immediately:

1. Where am I?
2. What is this object?
3. What can I do here?
4. What happens next?

If any page cannot answer those four questions in one screen, it is too complicated for the founder MVP.

## Component Direction

This brief does not require a rewrite.
It requires cleaner separation of existing parts.

### Reuse

- `WorkspaceStarter` for start
- existing intake surfaces for add source
- `ListenSurface` for source view
- existing seed/open-create logic for shape seed
- existing box home and unified shell for full box

### What likely needs to change

- intake should become a dedicated source-capture surface, not a surface with box inventory attached
- source view should become a source-first screen, not a thin layer over the old mode stack
- seed shaping should become a guided authoring surface with a clearer explanation of what the user should do next

### What should not drive the next slice

- new inference layers
- new metaphor systems
- shell dieting for its own sake
- more proof plumbing as a substitute for experience clarity

## Current Product Diagnosis

### What the current branch proves

The current branch proves that:

- trust architecture can be honest
- proof architecture can be structured
- workspace state can support a real source-to-seed-to-operate pipeline

### What it does not yet prove

It does not yet prove that:

- a first-time user can move through the early product without confusion
- the source experience is clearly distinct from the seed experience
- the next move feels obvious and motivated

That is why this is now primarily an experience problem, not a trust or architecture problem.

## Design Principles For The Replan

### 1. One page, one job

Do not let one page do intake, reading, listening, shaping, and diagnosis all at once.

### 2. One next move

Every early surface should have one clear primary action.

### 3. Raw source before system interpretation

Let the user see and hear what they added before introducing Loegos structure.

### 4. Teach through progression, not explanation

The product should reveal its logic step by step.
The user should not need to understand the whole theory before they can begin.

### 5. No fake demo path

The flow must remain real:

- real box
- real source
- real listen
- real seed
- real next step

## Non-Goals

This brief does not propose:

- removing the existing deep workspace
- redesigning the entire product language
- adding Layer 2+ authority
- changing the persistence model
- inventing a mock founder-only shortcut

## Recommended Next Planning Frame

The next planning pass should not begin with implementation details.

It should begin with a surface map:

1. Start
2. Add Source
3. Source View
4. Shape Seed
5. Full Box

For each surface, planning should specify:

- route or entry condition
- purpose
- visible components
- allowed actions
- primary CTA
- secondary CTA
- exit condition
- mobile behavior
- desktop behavior

Only after that should we decide what to build next.

## Proposed Success Criteria

The founder MVP is working when, on phone and desktop, a user can:

- start from scratch without seeing compiler or seal noise
- add a source without confusion
- see the raw text clearly
- listen to it without feeling they changed modes
- understand the next step without guessing
- move into seed shaping with confidence

And the moment of truth is:

**the product feels like a calm source-first notebook at the beginning, and only becomes a Loegos machine when the user is ready for it.**

## Decision

This brief should be circulated as the reset point for the next replan.

The next planning cycle should treat the current branch as:

- technically stronger than before
- directionally correct
- still too mixed in its early experience

The next goal is not to refine the existing mixed screen.

The next goal is to clearly separate:

- start
- intake
- source
- seed
- advanced box

That is the founder MVP.
