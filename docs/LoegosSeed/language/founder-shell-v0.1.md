# Founder Shell v0.2

Date: 2026-04-06
Status: Implementation-ready frontend brief
Purpose: Define the founder-facing shell that should sit in front of the existing Full Box workspace.

## Why This Exists

The backend spine is now credible enough:

- source intake works
- box and document persistence work
- source -> seed -> operate -> evidence -> receipt is real
- trust rules are materially stronger than before

The current bottleneck is no longer system capability.
It is front-end orientation.

The existing workspace is still trying to do too many jobs at once:

- artifact reading
- source and seed management
- compiler state
- diagnostics
- receipt state
- playback
- box coordination

That makes the first screen feel like a control room instead of a human work surface.

The right move is not to keep dieting `WorkspaceShell`.
The right move is to add a new composed front door that uses the same real backend and selected controllers, while leaving Full Box in place as the advanced surface.

## Product Position

Founder Shell should be governed by one simple contract:

- one active artifact
- one Lœgos read
- one next step
- one assistant popup
- one player
- minimal surrounding chrome

The strategic split is:

- **Founder Shell** = meaning first
- **Full Box** = coordination and debugging

Full Box remains real and valuable.
It just should not be the first thing the founder has to understand.

## Shell Contract

Founder Shell should not receive the full `WorkspaceShell` prop/state surface.

It should be mounted with a deliberately narrow context, for example a `FounderWorkspaceContext` or equivalent typed subset containing only:

- active project identity:
  - `projectKey`
  - `projectTitle`
- active artifact:
  - `documentKey`
  - `title`
  - `subtitle`
  - `documentKind`
  - `blocks`
  - `isEditable`
- source/seed relationship:
  - whether the artifact is a source or seed
  - current seed key/title when relevant
- selection state:
  - `selectedBlockId`
  - setter/callback
- Lœgos read state:
  - selected finding
  - finding list for current artifact
  - inspect payload for selected block
  - override state for selected block
- player state/actions:
  - play/pause
  - previous/next
  - rate
  - voice
  - progress
- assistant state/actions:
  - collapsed/open
  - current artifact context
  - send prompt
- next-step CTA model:
  - label
  - explanation
  - action callback
- shell navigation:
  - `openFullWorkspace`
  - `openBoxHome`
  - `openAccount`
  - `signOut`

The Founder Shell contract must intentionally exclude:

- source tree inventories
- seed queue state
- receipts list
- full compiler dashboard
- box-management forms
- deep assembly lane state

Those remain in Full Box.

## Screen Anatomy

Founder Shell should be composed from six slices plus one escape hatch.

### 1. Default Artifact View

Purpose:
show the active source or seed as language first

Rules:

- the artifact text is the dominant visual surface
- blocks hug the text closely
- no oversized heavy cards
- no persistent action clusters on every block
- structure is visible but secondary

Default block state:

- text first
- faint Lœgos tag or signal
- no inline action buttons

Block visual rule:

- Founder blocks should feel closer to text fragments with light structure around them
- Full Box blocks can stay heavier because they are coordination/debug surfaces

Desktop:

- compact variable-height blocks
- tight vertical rhythm
- light visual boundaries

Mobile:

- mostly a clean vertical stack
- still tightly fit to content
- not giant equal-height containers

### 2. Selected Block State

Purpose:
reveal actions only when the user intentionally focuses a block

Rules:

- click/tap selects a block
- selection is visually clear
- actions appear only on selection
- actions should be minimal and local

Preferred action presentation:

- small inline tray on desktop
- popover or bottom sheet on mobile

Initial action set should be minimal:

- inspect
- attested override
- copy / clipboard action if already supported

Do not show every control on every block by default.

### 3. Lœgos Read Panel

Purpose:
give the user the system’s read of the selected block

Desktop:

- right rail

Mobile:

- bottom sheet

Rules:

- one selected block at a time
- one clear signal
- rationale
- evidence
- uncertainty
- override state

The panel should answer:

- what is the read
- why did it get this read
- what evidence supports it
- what remains weak or missing

It should not behave like a generic dashboard.

### 4. Player

Purpose:
keep listen available without taking over the shell

Rules:

- always available
- visually quiet
- sticky
- no auto-play

Required controls:

- play/pause
- previous/next
- progress
- rate
- voice

The player is a capability layer, not a mode shift.

### 5. Assistant

Purpose:
keep Seven present but non-dominant

Rules:

- collapsed by default
- opened on demand
- scoped to the current artifact
- should feel like nearby intelligence, not the main canvas

Initial form:

- chat bubble or compact popup

It should never compete visually with the active artifact and selected Lœgos read.

### 6. Next-Step CTA

Purpose:
keep one next move visible at all times

Rules:

- one primary CTA only
- context-aware
- understandable without product theory

Examples:

- source -> `Next: Shape seed`
- seed with no operate run -> `Run Operate`
- operate complete with blockers resolved -> `Open receipt` or `Seal`

The CTA should explain the next move in one short line.

### 7. Escape Hatch

Purpose:
let advanced users graduate without trapping them

Rules:

- visible but quiet
- not equal in prominence to the primary CTA
- worded neutrally

Recommended wording:

- `Open full workspace`

This should be available from the shell header or footer.

## Interaction Model

This must be locked before implementation.

### Reading

- default state is reading
- the artifact is immediately legible
- no hidden meaning in chrome

### Selection

- click/tap a block to select it
- selected block drives the Lœgos read panel
- selected block reveals its local actions

### Editing

Selection and editing must be clearly separated.

Rules:

- source view is primarily read/listen
- seed view can edit
- selection styling must not look like text edit focus
- keyboard focus and pointer focus should stay understandable

### Keyboard / focus

Desktop acceptance should include:

- tab order reaches artifact, selected block actions, CTA, assistant, and escape hatch
- selected block remains obvious when navigated by keyboard
- focus does not disappear into hidden chrome

### Mobile

Rules:

- the selected block must still feel like the center of attention
- read panel becomes a bottom sheet instead of a cramped side region
- actions should not require tiny tap targets

## Routing And Mount Strategy

Founder Shell should be a parallel tree beside the legacy Full Box surface, not another branch of dense conditional rendering inside the same visual composition.

Recommended mount strategy:

- `/workspace` founder entry defaults to Founder Shell
- deep links and explicit advanced links can still open Full Box
- Full Box stays available via explicit hatch

Implementation rule:

- it is acceptable to touch `WorkspaceShell` or route-level code only to decide which shell mounts
- do not continue treating `WorkspaceShell` as the thing to simplify into onboarding

Recommended state shape:

- routing/page decides entry shell
- Founder Shell composes only the minimal context it needs
- Full Box continues to own the advanced state surface

## Journey Placement

Founder Shell is not the whole Foundermvp journey.
It is the calm artifact surface inside that journey.

The founder journey should remain:

- Start
- Add Source
- Founder Shell on the active source artifact
- Shape Seed
- Full Box as the advanced layer

Mount rules:

- `/workspace` still opens the starter by default
- starter-driven intake opens Founder Shell on the imported source
- `Next: Shape seed` leaves Founder Shell and enters the real seed flow
- explicit advanced links or the quiet hatch can open Full Box at any time

This keeps Founder Shell from becoming a second app or a substitute for journey logic.

## CTA Gating

Founder Shell should never light up every possible next move at once.

The primary CTA is stage-bound:

- starter: `Add source`
- source artifact in Founder Shell: `Next: Shape seed`
- early seed shaping: keep shaping or open the advanced workspace if needed
- only once a real seed exists: `Run Operate`
- receipts and sealing should stay downstream, not appear in the first founder shell slice

The rule is simple:

- one page
- one job
- one next move

## Graduation And Shared State

Opening Full Box must feel like zooming into the same artifact, not switching apps.

Rules:

- Founder Shell and Full Box read from the same underlying project, document, selection, Operate, and override state
- the quiet hatch should preserve the active artifact whenever possible
- returning from Full Box back into the founder path is allowed when the journey still makes sense
- no duplicated trees of truth, no parallel persistence rules, no fake founder-only objects

The transition should feel like:

- Founder Shell = less surface area on the same object
- Full Box = more surface area on the same object

## Reuse Map

This should be built by reusing existing machinery, not inventing a second backend story.

Reuse:

- source and document APIs
- project and box persistence
- listen/player infrastructure
- operate overlay state and findings
- override actions
- existing proof/receipt path
- Seven assistant plumbing
- design tokens and shared primitives

Likely reusable components/controllers:

- current starter and intake actions
- `ListenSurface` primitives
- operate/override controllers
- player controls
- Seven thread plumbing
- selected-block workbench rendering logic

Likely new composition:

- `FounderShell`
- `FounderArtifactView`
- `FounderReadPanel`
- `FounderPlayerDock`
- `FounderAssistantPopup`
- `FounderNextStepBar`

These can wrap existing internals rather than rewriting system logic.

## What Founder Shell Must Not Show By Default

On first use, Founder Shell should not foreground:

- source tree
- seed queue
- receipt inventory
- compiler dashboard
- blocked seal stack
- assembly lane
- diagnostics summary cards
- box-management controls
- large persistent block buttons

Those belong in Full Box.

## Build Order

Implementation should happen in this order:

### Slice 1. Founder artifact view

- new shell with one active artifact
- tighter text-first blocks
- quiet player
- visible next-step CTA
- escape hatch

### Slice 2. Selected block + read panel

- selected block state
- read rail/sheet
- inspect payload integration
- minimal block-local actions

### Slice 3. Assistant popup

- collapsed Seven surface
- artifact-scoped prompts
- no takeover behavior

### Slice 4. Seed-specific founder pass

- founder seed view
- clean edit/selection model
- next-step progression toward Operate

Only after those slices are stable should more founder-shell depth be added.

## Test And Acceptance Criteria

### Mechanical

- `npm run lint`
- `npm run build`
- `npm run test:smoke`
- existing APIs and persistence remain unchanged

### Founder-shell manual acceptance

On desktop and mobile:

- the first screen clearly centers one artifact
- the user can tell where they are
- the user can tell whether they are looking at a source or seed
- the user can select a block and see the corresponding Lœgos read
- the user can listen without the screen changing conceptual modes
- the user can see one next step without guessing
- the user can open Full Box explicitly if they want more system

### Product acceptance

Founder Shell is successful when the user feels:

- this is my text
- this is the system’s read
- this is what I do next

and does **not** feel:

- I am inside a dashboard
- I need to understand the whole box machine first
- the system is showing me five levels of state at once

## Default Decisions

- Founder Shell is the default founder/front-door surface.
- Full Box remains the advanced surface.
- Founder Shell uses a narrow typed context, not the full `WorkspaceShell` prop/state surface.
- Blocks are text-first and compact.
- Actions appear on selection, not all the time.
- Lœgos read is one selected-block panel, not a broad dashboard.
- Assistant is collapsed by default.
- Player is sticky and quiet.
- Escape hatch is visible but secondary.

## One-Line Position

Founder Shell is not a diet version of WorkspaceShell.
It is a new composed front door that reuses the real backend spine and lets the product finally present meaning before machinery.
