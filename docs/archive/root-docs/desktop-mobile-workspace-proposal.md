# Loegos Desktop/Mobile Workspace Proposal

**Status:** Proposal  
**Purpose:** Define a device-aware workspace strategy that makes assembly work feel intentional instead of crowded.  
**Context:** The product already has strong primitives, but too many of them compete on the same screen. This proposal assigns clear jobs to desktop and mobile, then maps the current components into a cleaner product architecture.

---

## 1. Core Decision

Loegos should not aim for strict desktop/mobile parity.

The right product move is:

- desktop is the primary assembly workspace
- mobile is the primary source workspace
- both share the same Box model
- both preserve continuity across the same Box, source, seed, Operate, and receipt system

This is not a compromise in quality. It is a better product contract.

The current problem is not that the app lacks capability. The problem is that too many valid capabilities are treated as equal visual peers at the same time:

- source navigation
- source reading
- seed editing
- staging
- Seven
- playback
- Operate
- receipts

The redesign goal is to stop making all of these fight for the same screen at once.

---

## 2. Product Thesis

### Shared thesis

Loegos is one Box-based system with one durable loop:

`source -> seed -> operate -> proof`

### Device thesis

Desktop is where the user synthesizes.

Mobile is where the user captures, reads, listens, and interprets.

### Resulting product contract

- Desktop should optimize for comparison, assembly, editing, and diagnosis.
- Mobile should optimize for intake, reading, listening, light editing, and conversation with Seven.
- The Box remains the same object on both devices.
- The user should feel that work started on mobile becomes stronger on desktop, not blocked by desktop.

---

## 3. Shared Invariants

These rules should hold across all devices.

### Shared nouns

The live nouns remain:

- `Boxes`
- `Box`
- `Sources`
- `Seed`
- `Seven`
- `Operate`
- `Receipts`

`Assembly` should remain the domain concept, but in the live product shell the user-facing object should mostly be described as the `Seed` when it is the active working position of a Box.

### Shared continuity rules

- A source added on mobile must be immediately usable on desktop.
- A seed edited on desktop must remain reviewable and lightly editable on mobile.
- Seven threads stay document-scoped across devices.
- Receipts remain local-first across devices.
- Operate remains box-scoped across devices.

### Shared truth rules

- The built-in guide is never the hero object.
- Remote proof is optional.
- Provenance should become more visible, not less, as the product matures.
- Deep analysis stays inside Operate, not the core navigation.

---

## 4. Device Roles

## 4.1 Desktop Role

Desktop is the primary place to:

- compare multiple sources
- move between source and seed rapidly
- stage and reorder material
- edit the seed in sustained sessions
- run Operate
- review proof in context

Desktop is **not** just a larger reading screen. It is the main synthesis surface of the product.

## 4.2 Mobile Role

Mobile is the primary place to:

- add a source
- capture a speak note
- paste or import a link
- read and listen to sources
- lightly edit sources
- ask Seven about the active source
- save useful material for later assembly
- review the latest proof

Mobile is **not** the primary place for:

- multi-source comparison
- deep staging and reorder work
- long-form seed editing
- dense Operate review

These actions can still exist on mobile, but they should be secondary, simplified, and clearly not the main promise.

---

## 5. Desktop Proposal

## 5.1 Desktop Product Goal

Desktop should feel like one serious assembly workspace, not a collection of adjacent utilities.

The main user question on desktop is:

`How do I turn what is in this box into a working seed I can trust enough to act on?`

## 5.2 Desktop Entry Strategy

### First-time desktop

First-time desktop users should land in the first-box flow.

That flow should remain direct:

- write
- paste
- upload
- link
- speak

Current `FirstBoxComposer` is the right foundation for this.

### Returning desktop

Returning desktop users should cold-open into the most recent `Box home`, not directly into the last raw document.

Reason:

- `Box home` provides orientation
- `Resume` can still be one click away
- this matches the product's own IA doctrine
- it avoids dropping the user into an overly specific view without context

### Power desktop

Power users should still land in `Box home`, but the `Resume` action should be more assertive and more visible.

Power does not require a different route. It requires faster access to:

- current seed
- latest source
- Seven
- Operate history
- receipt history

## 5.3 Desktop Screen Model

Desktop should use five screen types:

1. `Boxes`
2. `Box home`
3. `Assembly workspace`
4. `Operate`
5. `Receipts`

The key proposal is:

`Think` and `Create` remain conceptual phases, but on desktop they should live inside one unified `Assembly workspace`.

This matters because the current desktop shell splits source reading and seed building into separate visual regimes, even though real synthesis requires both at once.

## 5.4 Desktop Layout Model

### Proposed default desktop layout

- thin top header
- left rail for box/source navigation
- center dominant canvas
- one right sidecar
- compact persistent player at bottom

### Region jobs

#### Left rail

Owns:

- box switch
- source list
- seed list
- import shortcuts

Should be persistent on desktop, but visually quiet.

#### Center canvas

Owns the dominant working object.

This is the most important region in the product.

Depending on context it shows:

- active source in reader mode
- active seed in editor mode
- box home
- Operate result
- Receipts proof surface

#### Right sidecar

Owns exactly one support context at a time.

Allowed sidecar modes:

- `Seven`
- `Stage`
- `Details`

The important rule is:

**Seven and Stage should not both be fully open at the same time on desktop.**

They can both be available, but only one gets real panel ownership at once.

#### Bottom player

Owns:

- play/pause
- prev/next
- rate
- voice
- current block progress

The player should remain stable, compact, and always reachable.

## 5.5 Desktop Workspace Modes

### Mode A: Source-led assembly

Use when the user is reading source material and pulling from it into the seed.

Center:

- source reader

Right sidecar:

- Seven or Stage

This is the current `Think` posture, but inside a unified workspace rather than a separate conceptual island.

### Mode B: Seed-led assembly

Use when the user is actively shaping the seed.

Center:

- seed editor

Right sidecar:

- Stage or Seven

This is the current `Create` posture, but again inside the same workspace shell.

### Mode C: Operate

Use when the user wants diagnosis.

Center:

- dedicated Operate result surface

Right sidecar:

- optional Seven audit panel only after result exists

Operate should feel like a mode shift, not just another crowded tab.

### Mode D: Proof

Use when the user wants receipt review and export.

Center:

- receipt-first proof surface

Right sidecar:

- none by default

Receipts should be calm and readable, not another sub-pane fighting with assembly.

## 5.6 Desktop Interaction Rules

### Rule 1

Only one support panel may be open at full width at a time.

### Rule 2

Phase labels may stay in the UI, but the user should experience one workspace, not four unrelated screens.

### Rule 3

`Operate` and `Receipts` should be takeover moments.

They can share shell chrome, but should not visually compete with source/staging/Seven at the same time.

### Rule 4

Stage should feel like active working memory, not a temporary tray.

### Rule 5

Seven should feel embedded and document-aware, not like a separate app.

## 5.7 Desktop Recommended Layout Changes

### Recommended change: unify Think/Create shell

Current problem:

- `Think` and `Create` are structurally separate enough that the user keeps shifting workspace posture
- the real work often requires simultaneous source reading and seed shaping

Proposal:

- one `AssemblyWorkspace` shell
- phase changes modify emphasis, not the entire screen logic

### Recommended change: sidecar tabs instead of stacked panels

Current problem:

- `AiUtilityRail` and `StagingPanel` are both valid, but together they make the right side too heavy

Proposal:

- a single sidecar shell with tabs:
  - `7`
  - `Stage`
  - `Details`

### Recommended change: stage count becomes a signal, not always a panel

Current problem:

- stage is important but visually bulky

Proposal:

- show count in toolbar/header
- open sidecar when needed
- keep drag/reorder behavior inside dedicated `Stage` mode

### Recommended change: source rail becomes calmer

Current problem:

- sources, seeds, upload, and box switching are all mixed at similar visual weight

Proposal:

- keep the left rail persistent
- visually prioritize active source and active seed
- demote low-frequency actions like box management

---

## 6. Mobile Proposal

## 6.1 Mobile Product Goal

Mobile should feel like a strong Box companion, not a compressed desktop.

The main user question on mobile is:

`How do I get signal into the box and understand it while I am away from the desktop workspace?`

## 6.2 Mobile Entry Strategy

### First-time mobile

Use the first-box flow, but bias the action order toward:

- speak
- paste
- upload
- link

The writing experience can remain present, but should not be the dominant first move on mobile.

### Returning mobile

Returning mobile users should default to the last active source or seed in a source-friendly mode.

That means:

- if they were listening to a source, reopen there
- if they were reviewing a seed, reopen there in light-edit/read mode
- if the box has no obvious resume target, go to Box home

The mobile default should favor continuity of reading/listening over workspace complexity.

## 6.2A Mobile Quick Actions

This is the most important mobile UX addition.

The mobile product needs an explicit quick-actions layer because mobile usage is often interrupt-driven:

- in transit
- between meetings
- during errands
- while noticing something in the real world
- when the user needs to capture or revisit signal fast

The current problem is that the user often arrives on mobile wanting one immediate action:

- paste a source
- add a picture
- speak a note
- import a link
- listen to the latest source
- ask Seven about the current source or current Box

But the current screen model makes those actions too diffuse.

### Mobile quick-actions principle

When the app opens on mobile, the user should be able to perform one meaningful action within 1 to 2 taps.

### Proposed mobile quick-actions cluster

The mobile home and mobile source surfaces should expose a persistent quick-actions group with:

- `Paste`
- `Photo`
- `Speak`
- `Link`
- `Listen latest`
- `Ask Seven`

These are not all equally frequent, but together they cover the most natural in-the-day flow.

### Proposed mobile quick-actions hierarchy

#### Primary actions

These should be visible immediately:

- `Paste`
- `Photo`
- `Speak`

These map most directly to mobile reality.

#### Secondary actions

These can remain one level down or context-sensitive:

- `Link`
- `Listen latest`
- `Ask Seven`

### Dedicated image action

This should become a first-class mobile action.

The user observation is correct:

- generic file upload is not the right mental model for mobile image capture
- on mobile, `Add image` should not feel like `open the Files app and hunt`

Recommended mobile image actions:

- `Photo library`
- `Take photo`

If technical constraints require a simpler first pass, then at minimum:

- a dedicated `Photo` action using `accept="image/*"`
- a separate document/file action for PDF, DOCX, Markdown, and TXT

The product rule should be:

**Image capture is a mobile-native source action, not a hidden beta import path.**

### Quick-actions placement

Recommended placement:

- on mobile Box home: quick-actions strip near the top
- on mobile source reader: quick-actions row in the dock or header
- on mobile empty states: primary call-to-action cluster

Not recommended:

- hiding capture inside an overflow menu
- forcing users to open a large general-purpose sheet before they can add a source

### Context-sensitive behavior

Mobile quick actions should adapt to the current state.

#### If the user is on Box home

Show:

- `Paste`
- `Photo`
- `Speak`
- `Link`
- `Listen latest`

#### If the user is inside a source

Show:

- `Listen`
- `Ask Seven`
- `Stage`
- `Edit`
- `Add source`

#### If the user is inside the seed

Show:

- `Edit`
- `Ask Seven`
- `Draft receipt`
- `Add source`

### Recommended mobile home card

Returning mobile users should see one compact home card above the quick actions:

- current Box
- latest active source or seed
- one-sentence resume context
- one primary resume button

This card should answer:

- `Where was I?`
- `What can I do right now?`

The quick-actions row then answers:

- `What can I capture right now?`

## 6.3 Mobile Screen Model

Mobile should use four primary screen types:

1. `Box home`
2. `Source reader/listener`
3. `Seven sheet`
4. `Receipts`

The seed should be reachable as a document, but not presented as a full assembly workstation.

## 6.4 Mobile Layout Model

### Default mobile structure

- one dominant content surface
- one bottom utility dock
- one bottom sheet at a time

### Mobile sheet types

- source picker
- staging queue
- Seven conversation
- capture/import

Important rule:

**Only one mobile sheet should own attention at a time.**

## 6.5 Mobile Primary Jobs

### Job A: Capture

The user should be able to:

- speak note
- upload
- paste
- import link

This should be the most obvious mobile power.

### Job B: Read and listen

The user should be able to:

- open a source
- listen block by block
- navigate blocks easily
- move useful content toward staging

### Job C: Ask Seven

The user should be able to:

- ask about the current source
- get contextual interpretation
- save useful replies for later assembly

### Job D: Light edit

The user should be able to:

- correct a source
- lightly revise the seed
- clean obvious issues

But not be expected to run long assembly sessions.

### Job E: Review proof

The user should be able to:

- see latest receipt state
- draft a receipt
- connect GetReceipts

This should remain simple and proof-first.

## 6.6 Mobile Secondary Jobs

These can exist, but should not be primary promises:

- deep stage reorder
- long seed writing sessions
- detailed Operate interpretation
- dense cross-source comparison

## 6.6A Mobile Quick-Actions Recommendation

If only one mobile change happens first, it should be this:

**Ship a real quick-actions layer with dedicated `Photo`, `Paste`, and `Speak` entry points.**

That will likely improve mobile usability more than any abstract layout polishing because it aligns the app with the user's actual moment-of-use behavior.

## 6.7 Mobile Interaction Rules

### Rule 1

The active source or seed gets the whole screen.

### Rule 2

Seven opens as a sheet, not a permanent side region.

### Rule 3

Stage is a queue, not a workspace.

### Rule 4

Operate should be callable on mobile, but the result should be simplified and easy to scan.

### Rule 5

If a workflow feels better on desktop, mobile should say so honestly instead of pretending parity.

Example:

"For deeper seed shaping, continue on desktop."

That is acceptable if framed as product clarity, not failure.

---

## 7. Component Architecture Proposal

This proposal uses the current components as the starting point rather than throwing them away.

## 7.1 Keep As Is

These components are already aligned enough to keep:

- `BoxesIndex`
- `ProjectHome`
- `FirstBoxComposer`
- `OperateSurface`
- `ReceiptSurface`

## 7.2 Refactor Into Desktop Assembly Workspace

### New owner: `AssemblyWorkspace`

Create a dedicated desktop owner component that replaces the current wide shell responsibilities for in-box work.

It should orchestrate:

- active document
- current seed
- left rail state
- sidecar state
- desktop toolbar state
- player state

### Children it should compose

- `SourceRail`
- `ThinkSurface`
- `SeedSurface`
- `AiUtilityRail`
- `StagingPanel`
- player bar

### Key structural change

`ThinkSurface` and `SeedSurface` become center-canvas modes inside one desktop owner instead of fully separate shell branches.

## 7.3 Refactor Into Mobile Source Workspace

### New owner: `MobileSourceWorkspace`

Create a dedicated mobile owner focused on:

- source reading/listening
- source picker sheet
- Seven sheet
- staging sheet
- capture flows

### Existing pieces to reuse

- `ListenSurface`
- `AiBar`
- `MobileComposeSheet`
- `MobileControlDock`

### Key structural change

`MobileControlDock` should stop acting like a miniature desktop controller and become a simpler mobile task switcher.

## 7.4 New Shared Shell Concepts

### `SidecarShell`

A shared desktop sidecar owner with tabs:

- `Seven`
- `Stage`
- `Details`

### `WorkspaceModeController`

A small shared state layer that determines whether the current Box context is:

- source-led
- seed-led
- operate
- proof

This should become explicit state instead of being scattered across shell conditions.

### `EntryController`

A dedicated layer that formalizes:

- first-time
- returning
- power
- desktop vs mobile entry defaults

This already exists partially in view-model logic but is not yet expressed as product-level navigation policy.

---

## 8. Recommended Information Architecture Updates

## 8.1 Keep the top-level IA

Keep:

- `Boxes`
- `Box home`
- `Think`
- `Create`
- `Operate`
- `Receipts`

## 8.2 Change how the phases are experienced

The proposal does **not** remove `Think` and `Create`.

It changes their runtime expression:

- on desktop they are two emphases of one assembly workspace
- on mobile they are mostly source-first and light-edit flows

This preserves language while reducing screen fragmentation.

## 8.3 Clarify route behavior

Recommended cold-open behavior:

- first-time -> first-box flow
- desktop returning -> most recent `Box home`
- mobile returning -> most relevant active source/seed view

Deep links should still open exact documents directly.

## 8.4 Box Organization Proposal

The current Box model is conceptually strong, but the organization system is too thin for repeated real use.

Right now, the product mostly supports:

- open current Box
- open another Box
- create Box
- rename Box
- delete non-default Box

That is enough for structure, but not enough for ongoing wayfinding.

### The organization problem

As Box count grows, users will need help with:

- finding the right Box quickly
- distinguishing active work from dormant work
- keeping long-tail Boxes without visual clutter
- jumping back into the right Box from mobile

### Recommended Box organization model

Add lightweight organization before adding complex hierarchy.

Recommended first-layer organization:

- `Pinned`
- `Recent`
- `All Boxes`
- `Archived`

This is better than introducing folders immediately because it solves retrieval first without making the system heavy.

### Recommended Box metadata

Each Box should eventually have:

- title
- subtitle / current position
- last touched time
- source count
- seed status
- proof status
- pinned state
- archived state

### Recommended Boxes index behavior

#### Desktop Boxes

Desktop should support:

- search by title
- sort by recent activity
- pin/unpin
- archive/unarchive
- richer resume summaries

#### Mobile Boxes

Mobile should support:

- recent first
- pinned section at top
- search
- very fast tap-to-resume

Mobile should not require scrolling through a long flat list to get back to the right Box.

### Recommended default ordering

1. pinned active Boxes
2. recent Boxes
3. everything else

### Archive vs delete

Archive should become the normal organizational cleanup action.

Delete should remain rare and deliberate.

This is especially important because Box deletion has real semantic weight in the product, even if work is safely moved under the hood.

### Organization principle

The Boxes system should help the user answer:

- `What matters now?`
- `What was I just using?`
- `Where does this new signal belong?`

That is more important than adding deep taxonomy early.

---

## 9. Implementation Phases

## Phase 1: Lock Product Contract

Output:

- one agreed desktop contract
- one agreed mobile contract
- one agreed entry strategy

Tasks:

- confirm device roles
- confirm cold-open rules
- confirm whether `Seed` should become the dominant user-facing term over `Assembly`

## Phase 2: Desktop Shell Refactor

Output:

- unified desktop `AssemblyWorkspace`

Tasks:

- extract left rail ownership
- extract center canvas ownership
- create one sidecar shell
- reduce simultaneous open desktop regions

## Phase 3: Mobile Shell Refactor

Output:

- dedicated `MobileSourceWorkspace`

Tasks:

- simplify mobile dock
- unify mobile sheets
- bias mobile toward capture/read/listen/Seven
- add a dedicated mobile quick-actions layer
- add a dedicated mobile image/photo entry point

## Phase 4: Operate and Receipts Takeovers

Output:

- cleaner Operate and proof moments

Tasks:

- make Operate feel like a focused result surface
- make Receipts feel calm and proof-first
- reduce adjacent UI competition when either is open

## Phase 5: Provenance and Trust Visibility

Output:

- clearer trust/provenance in the existing UI

Tasks:

- surface source provenance in left rail and Box home
- surface trust hints in source details and receipts

## Phase 5A: Box Organization

Output:

- faster Box retrieval and cleaner long-term organization

Tasks:

- add pinned and archived states
- add Boxes search
- sort by recent activity by default
- improve mobile Box resume behavior

## Phase 6: Runtime QA

Output:

- actual verified product behavior

Tasks:

- run desktop checklist
- run mobile checklist
- promote pass/fail results into the gap register

---

## 10. Success Criteria

The redesign is successful when:

### Desktop

- the user can compare source and seed without UI crowding
- stage and Seven no longer fight for permanent space
- Operate feels focused
- Receipts feel calm
- the main canvas clearly dominates

### Mobile

- the user can capture, read, listen, and ask Seven comfortably
- stage is reachable without becoming cumbersome
- the user never feels trapped in a shrunk desktop
- the user can paste, add a photo, or speak a source immediately
- returning to the right Box on mobile feels fast and obvious

### Cross-device

- users understand that desktop and mobile serve different strengths
- work moves cleanly between devices
- the Box remains the continuous object across both

---

## 11. Immediate Recommendation

If only one thing should happen next, it should be this:

**Refactor the desktop product around a single AssemblyWorkspace with one right sidecar and one dominant center canvas.**

That change will do the most to:

- improve usability
- reduce shell sprawl
- clarify the product promise
- create a clean basis for a deliberately simpler mobile experience

---

## 12. Concrete Mapping From Current Components

### Current component -> Proposed role

- `BoxesIndex` -> keep as `Boxes`
- `ProjectHome` -> keep as `Box home`
- `FirstBoxComposer` -> keep as first-time entry
- `SourceRail` -> desktop left rail
- `ThinkSurface` -> desktop source-led center state
- `SeedSurface` -> desktop seed-led center state
- `AiUtilityRail` -> desktop sidecar tab: `Seven`
- `StagingPanel` -> desktop sidecar tab: `Stage`
- `OperateSurface` -> dedicated Operate takeover
- `ReceiptSurface` -> dedicated Receipts takeover
- `ListenSurface` -> mobile primary source surface
- `AiBar` -> mobile Seven sheet
- `MobileComposeSheet` -> mobile stage queue sheet
- `MobileControlDock` -> simplified mobile task switcher

### Current shell problem -> proposed fix

- `WorkspaceShell` owns too much -> split into desktop and mobile workspace owners
- desktop support panels compete -> unify into one sidecar
- mobile mirrors desktop too closely -> give mobile its own device contract
- entry behavior is ambiguous -> formalize by user state and device
- mobile source creation is too diffuse -> add explicit quick actions
- Box retrieval is too flat -> add search, pinning, and archive

---

## 13. Open Questions

These should be answered before implementation starts:

1. Should returning desktop users land in `Box home` or the last exact working document?
2. Should `Seed` fully replace `Assembly` in user-facing copy inside the workspace?
3. On mobile, should `Operate` remain fully available or be reframed as a lightweight review action?
4. Should mobile allow direct seed assembly from stage, or only stage collection for later desktop work?
5. Should `Seven` on mobile be source-only, or also available against the seed?
6. Should mobile quick actions live on Box home, in the dock, or both?
7. Should `Archive` ship before more advanced Box grouping?

My recommendation:

- desktop cold-open -> `Box home`
- use `Seed` as the primary live object term
- keep Operate available on mobile but simplified
- allow lightweight mobile seed edits, not heavy assembly sessions
- allow Seven against both source and seed, but bias toward source on mobile
- put quick actions on both mobile Box home and mobile source surfaces
- ship `Pinned`, `Recent`, and `Archived` before folders or tags
