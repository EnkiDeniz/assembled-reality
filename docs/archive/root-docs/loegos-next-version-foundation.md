# Loegos Next Version Foundation

**Status:** Proposed foundation for the next version  
**Purpose:** Provide one clear product, UX, and workspace spec for the next major version of Loegos.  
**Scope:** Agreement points, product rules, information architecture, desktop/mobile contracts, UI behavior, and implementation priorities.

---

## 1. Summary

The next version of Loegos should feel simpler, faster, and more intentional than the current product.

The product already has the right building blocks:

- Boxes
- Box home
- Sources
- Seed
- Seven
- Operate
- Receipts

The problem is not missing capability. The problem is that too many good capabilities compete on screen at the same time.

The next version should solve that by:

- reducing clutter
- using calmer and more legible layouts
- making entry and re-entry much clearer
- giving desktop and mobile different jobs
- making source capture dramatically easier on mobile
- making the desktop workspace feel like one real assembly surface

This document is the foundation for that version.

---

## 2. Core Agreement

These are the main points we have already aligned on.

### 2.1 One Box system, not multiple products

Loegos is one Box-based system.

It should not become:

- one product for first-timers
- another for power users
- another for desktop
- another for mobile

Instead, it should be one coherent Box system that behaves differently depending on:

- device
- current task
- Box maturity
- whether the user is entering, resuming, assembling, or reviewing proof

### 2.2 Desktop and mobile should not have strict parity

Desktop is the primary assembly workspace.

Mobile is the primary source and quick-capture workspace.

That is not a compromise. It is the correct product contract.

### 2.3 The Seed is the live current state of the Box

The Seed should remain the central live object in the product.

It is the best answer to:

`Where does this Box stand right now?`

The Seed is:

- the living working position of the Box
- editable by the user
- influenced by sources
- sharpened by Operate
- grounded over time by receipts

### 2.4 Box home is the orientation surface

The product should not drop every user into a raw document without context.

`Box home` exists to answer:

- `What is in this Box?`
- `What should I do next?`
- `What proof exists?`

### 2.5 The product should open to momentum, not explanation

Returning users should not be forced back through generic launch structures or heavy explanations.

The product should remember momentum and let the user resume fast.

### 2.6 Clutter is now a primary product problem

The current app is capable, but not calm enough.

The next version must reduce:

- explanatory paragraphs
- competing panels
- duplicated controls
- visual hierarchy noise
- too many equal-weight actions

### 2.7 Source capture must become immediate

This is especially true on mobile.

Users need to be able to:

- paste
- add a photo
- speak a note
- add a link
- resume listening
- ask Seven

with almost no friction.

### 2.8 Power should come from speed and depth, not extra complexity by default

Advanced users should get:

- faster access
- richer history
- stronger shortcuts
- deeper inspection

They should not need a visibly separate product layer to feel supported.

---

## 3. Product Rules

These are the governing rules for the next version.

## Rule 1

The top-level object is always the `Box`.

## Rule 2

The `Seed` is the live current state of a Box.

## Rule 3

`Boxes` and `Box home` are not the same surface.

`Boxes` chooses the container. `Box home` orients the user inside it.

## Rule 4

Desktop is where the user assembles.

## Rule 5

Mobile is where the user captures, reads, listens, and asks.

## Rule 6

The app should remember momentum.

## Rule 7

The first session should begin with one real signal, not a taxonomy.

## Rule 8

Actions can be icon-led, but core product nouns must still be named in text.

## Rule 9

Support surfaces must help the main canvas, not compete with it.

## Rule 10

Only one support context should own real attention at a time.

## Rule 11

Operate and Receipts should feel like focused modes, not crowded sub-tabs.

## Rule 12

Advanced Box intelligence should appear only when the Box has earned it.

## Rule 13

Remote proof is optional. Local proof is never blocked.

## Rule 14

Mobile image capture is a first-class source action, not a hidden beta path.

## Rule 15

Do not build dashboards where better defaults, calmer screens, or Seven-driven reveal would do the job.

---

## 4. Product Model

### 4.1 Stable nouns

Use these nouns consistently:

- `Boxes`
- `Box`
- `Sources`
- `Seed`
- `Seven`
- `Operate`
- `Receipts`

`Assembly` remains a domain concept, but the live product should usually talk about the active working document as the `Seed`.

### 4.2 Underlying loop

The durable loop remains:

`source -> seed -> operate -> proof`

The practical user loop remains:

`capture/import -> read/listen -> ask/stage -> shape seed -> run Operate -> preserve proof`

### 4.3 Shared truths

- The built-in guide is never the hero object.
- Seven is contextual conversation, not the replacement for Operate.
- Operate is a box read, not chat and not rewrite.
- Receipts are proof, not a peer editing mode.
- Deep analysis belongs inside Operate or earned inspection, not in primary navigation.

---

## 5. Information Architecture

The next version should have two layers.

### 5.1 Entry layer

- `Boxes`
- `Box home`

### 5.2 Working layer

- `Assembly workspace`
- `Operate`
- `Receipts`

Important note:

`Think` and `Create` remain valid workflow framing, but on desktop they should be experienced inside one assembly workspace rather than as two strongly separate worlds.

---

## 6. Entry And Re-entry Spec

## 6.1 First-time entry

First-time users should get a radically simplified first-box experience.

They do not need:

- box launcher complexity
- management UI
- deep diagnostics
- too much explanatory copy

They need:

- one clear prompt
- one obvious action
- one visible next move

### First-time entry actions

- Paste
- Photo
- Speak
- Link
- Upload file
- Write

### First-time design rule

The first session should feel like starting with one real signal.

## 6.2 Returning desktop entry

Returning desktop users should cold-open into the most recent `Box home`.

From there they should see:

- current Box
- strongest next move
- current Seed state
- latest proof state
- source inventory
- a strong Resume action

### Returning desktop goal

Time to first meaningful action should be very low.

## 6.3 Returning mobile entry

Returning mobile users should open into the most relevant active source or Seed in a source-friendly mode.

Preferred order:

1. last actively listened source
2. last touched source
3. current Seed in light-edit/read mode
4. Box home if no strong resume target exists

### Returning mobile goal

The user should be able to capture or resume in 1 to 2 taps.

---

## 7. Desktop Spec

## 7.1 Desktop role

Desktop is the primary assembly environment.

Desktop is for:

- comparing sources
- moving between source and Seed
- staging and reorder work
- sustained Seed editing
- Operate runs
- proof review in context

Desktop is not just a larger reader. It is the synthesis surface of the product.

## 7.2 Desktop screen set

Desktop should use five main screen types:

1. `Boxes`
2. `Box home`
3. `Assembly workspace`
4. `Operate`
5. `Receipts`

## 7.3 Desktop home and Box launch

The desktop launch surfaces should be calm, centered, and low-copy.

The visual reference is:

- centered identity
- 3 to 4 clear actions
- recent Boxes below
- very little explanatory text

### Desktop Boxes surface

The primary actions should be:

- `Open current Box`
- `Add source`
- `Speak note`
- `Browse Boxes`

Below that:

- `Pinned Boxes`
- `Recent Boxes`

The surface should feel closer to a launcher than a dashboard.

### Desktop Box home

`Box home` should show:

- Box title
- one-line current position
- Resume action
- proof state
- source count
- Seed state
- recent receipts

It should not feel like a dense analytical report.

It should feel like the calm answer to:

- `What is here?`
- `What should I do next?`

## 7.4 Desktop workspace model

The core desktop innovation of the next version is:

**one Assembly workspace**

The current product has good Think/Create components, but the next version should make them feel like two emphases of one place.

### Desktop Assembly workspace modes

#### Mode A: Source-led

The user is reading a source and pulling from it toward the Seed.

#### Mode B: Seed-led

The user is actively shaping the Seed with source material and staged findings.

These are not separate products. They are two postures inside one workspace.

## 7.5 Desktop layout

Default desktop layout:

- thin top header
- left rail
- dominant center canvas
- one right sidecar
- compact persistent player

### Left rail

Owns:

- Box switch
- source list
- Seed list
- add source actions

Should be:

- persistent
- calm
- low-drama
- easy to scan

### Center canvas

Owns the dominant working object.

Can show:

- active source
- active Seed
- Box home
- Operate
- Receipts

The center canvas must always win visually.

### Right sidecar

Owns exactly one support context at a time.

Allowed sidecar modes:

- `Seven`
- `Stage`
- `Details`

Design rule:

**Seven and Stage must not both be fully open at the same time.**

### Player

Must remain:

- compact
- stable
- always reachable

It should never become the dominant visual object.

## 7.6 Desktop workspace chrome

Use fewer controls and more consistent placement.

Desktop should prefer:

- one action row
- one sidecar switcher
- one overflow menu

Avoid:

- duplicate actions in rail, header, and panel
- multiple equally-weighted support panes
- explanatory copy living in every region

## 7.7 Desktop Operate

Operate should feel like a focused read mode.

When open:

- center canvas becomes the Operate result
- sidecar is closed by default
- Seven audit becomes available after result exists

Operate should feel like:

- pause
- read
- decide

not:

- another busy workspace tab

## 7.8 Desktop Receipts

Receipts should feel calm and proof-first.

When open:

- center canvas becomes the proof surface
- latest proof is visible first
- local vs remote state is clear
- evidence trail is secondary
- sidecar is closed by default

Receipts should answer:

`What proof exists now?`

---

## 8. Mobile Spec

## 8.1 Mobile role

Mobile is the quick-capture and source interaction surface.

Mobile is for:

- adding sources
- speaking notes
- taking or selecting photos
- importing links
- reading and listening
- asking Seven about a source or Seed
- light editing
- quick proof review

Mobile is not the primary environment for:

- sustained multi-source comparison
- deep stage reorder
- long Seed writing sessions
- dense Operate analysis

## 8.2 Mobile screen set

Mobile should use four primary screen types:

1. `Box home`
2. `Source reader/listener`
3. `Seven sheet`
4. `Receipts`

The Seed remains reachable, but it should not pretend to be a full desktop assembly surface.

## 8.3 Mobile quick actions

This is the most important mobile addition.

When the app opens on mobile, the user should be able to do one meaningful thing immediately.

### Mobile quick actions cluster

Primary:

- `Paste`
- `Photo`
- `Speak`

Secondary:

- `Link`
- `Listen latest`
- `Ask Seven`

### Quick actions design rule

The user should be able to perform a meaningful capture or resume action in 1 to 2 taps.

### Dedicated image action

Mobile needs a true `Photo` action.

It should support:

- `Take photo`
- `Photo library`

At minimum, image intake should be separate from generic document upload.

### Quick actions placement

Mobile quick actions should appear:

- on mobile Box home
- on mobile source surfaces
- in empty states

They should not be hidden inside a heavy control menu.

## 8.4 Mobile Box home

Mobile Box home should be very compact.

It should show:

- current Box
- one-sentence current position
- Resume action
- quick actions row
- recent or pinned Boxes below

The quick actions answer:

`What can I do right now?`

The resume card answers:

`Where was I?`

## 8.5 Mobile source surface

The source screen is the main mobile work screen.

It should prioritize:

- readable content
- stable playback controls
- one source picker sheet
- one Seven sheet
- one stage queue sheet

Only one sheet should own attention at a time.

## 8.6 Mobile Seven

Seven should open as a sheet, not as a permanent side region.

It should support:

- ask about source
- ask about Seed
- save useful replies for later

But mobile should bias Seven toward source interpretation rather than deep box analysis.

## 8.7 Mobile stage

On mobile, stage should behave like a queue, not a full assembly workspace.

Users can:

- add to stage
- remove from stage
- review what is waiting

But heavy reorder and synthesis work should bias toward desktop.

## 8.8 Mobile Operate

Operate should still exist on mobile, but in simplified form.

It should be:

- callable
- readable
- compact
- honest

If deeper Operate use is better on desktop, the UI may say so directly.

---

## 9. Box Organization Spec

The next version needs better Box retrieval and organization.

The current model is structurally correct but too flat for repeated use.

## 9.1 First-layer organization

Ship these before any deep hierarchy:

- `Pinned`
- `Recent`
- `All Boxes`
- `Archived`

This solves wayfinding before taxonomy.

## 9.2 Box metadata

Each Box should support:

- title
- subtitle/current position
- last touched time
- source count
- Seed status
- proof status
- pinned state
- archived state

## 9.3 Desktop Box organization

Desktop should support:

- search
- recent sort
- pin/unpin
- archive/unarchive
- richer resume summaries

## 9.4 Mobile Box organization

Mobile should support:

- pinned at top
- recent next
- fast search
- very quick tap-to-resume

The user should not need to scroll a long flat list just to find the right Box.

## 9.5 Archive vs delete

Archive should become the normal cleanup action.

Delete should remain rare and deliberate.

---

## 10. UI And Visual Spec

## 10.1 Visual direction

The next version should feel:

- calmer
- more centered
- less explained
- more icon-led
- more deliberate in what gets attention

It should not feel like:

- a dashboard
- a tutorial
- a control room
- a collection of competing cards

## 10.2 Copy rule

Use less copy.

Prefer:

- object names
- action names
- one sentence of orientation when needed

Avoid:

- repeated explanatory paragraphs
- describing the same concept in multiple places
- trying to teach the whole model in the shell

### Copy principle

Explain through placement, hierarchy, and state before explaining through prose.

## 10.3 Icons rule

Icons should do more work, but not all the work.

### Icons should lead for actions

Use icon-led controls for:

- Paste
- Photo
- Speak
- Link
- Listen
- Search
- Pin
- Archive
- Overflow
- Add

### Text should remain for product nouns

Keep visible text for:

- Box
- Seed
- Operate
- Receipts
- Seven

These are product-specific and should not be hidden behind ambiguous symbols.

### Principle

Icons lead. Words confirm.

## 10.4 Cards rule

Cards are allowed when they serve one of these jobs:

- launch action
- compact summary
- proof summary
- quick entry

Cards should not become the default wrapper for every region.

## 10.5 Sidebar rule

Sidebars are useful, but only if they reduce context switching.

Use sidebars for:

- source navigation
- Box switch
- support context

Do not use sidebars to host every possible action.

## 10.6 Density rule

Every major screen should have:

- one dominant object
- one clear primary action
- one clear secondary support region

If more than one thing feels like the hero, the screen is too crowded.

## 10.7 Launch surface reference

The launch surfaces should use a calmer, centered structure:

- identity
- 3 to 4 clear actions
- recent items below
- almost no extra copy

This is a useful direction for both desktop `Boxes` and mobile `Box home`, adapted to Loegos rather than copied literally from another tool.

---

## 11. Component Stacking Strategy

The next version should build from existing components rather than replacing everything.

## 11.1 Keep and refine

- `BoxesIndex`
- `ProjectHome`
- `FirstBoxComposer`
- `OperateSurface`
- `ReceiptSurface`

## 11.2 Recompose desktop

Create a dedicated `AssemblyWorkspace` owner that orchestrates:

- active source
- active Seed
- left rail
- sidecar
- desktop controls
- player

This should compose:

- `SourceRail`
- `ThinkSurface`
- `SeedSurface`
- `AiUtilityRail`
- `StagingPanel`
- player controls

## 11.3 Recompose mobile

Create a dedicated `MobileSourceWorkspace` owner that orchestrates:

- source reader
- source picker sheet
- Seven sheet
- stage queue sheet
- quick actions
- playback

This should compose:

- `ListenSurface`
- mobile Seven sheet
- mobile stage sheet
- mobile quick actions
- simplified dock

## 11.4 Shared shell concepts

Introduce:

- `EntryController`
- `WorkspaceModeController`
- `SidecarShell`

These should make product state explicit instead of scattering it across one giant shell.

---

## 12. Non-goals For This Version

Do not treat these as core next-version goals:

- full desktop/mobile parity
- broad multimodal marketing before the whole path is real
- deep folder taxonomy for Boxes
- doctrine-heavy analytics in primary navigation
- turning Seven into the whole product

---

## 13. Implementation Priorities

## Phase 1

Lock:

- desktop/mobile product contract
- Seed naming rule
- entry rules
- quick-actions rule

## Phase 2

Refactor desktop around one `AssemblyWorkspace`.

## Phase 3

Ship mobile quick actions and dedicated image/photo intake.

## Phase 4

Refactor mobile into a simpler source-first shell.

## Phase 5

Improve Box organization with:

- pinned
- recent
- archived
- search

## Phase 6

Strengthen Operate and Receipts as focused takeovers.

## Phase 7

Increase provenance and trust visibility only after the calmer shell is in place.

## Phase 8

Run runtime QA across desktop and mobile before widening the public promise.

---

## 14. Success Criteria

The next version is successful when:

### Product

- the product feels simpler without losing power
- the Seed is clearly central
- Box home makes return easy
- the user understands where to go next

### Desktop

- assembly feels like one coherent workspace
- the main canvas clearly dominates
- Seven and Stage no longer compete for equal space
- Operate feels focused
- Receipts feel calm

### Mobile

- quick capture is excellent
- paste, photo, and speak are immediate
- listening and Seven feel natural
- the user can resume fast
- mobile no longer feels like a shrunk desktop

### Organization

- the user can find the right Box quickly
- recent and pinned behavior reduce friction
- archive reduces clutter without creating fear

---

## 15. Immediate Next Step

If one build direction should anchor the next version, it is this:

**Create a calmer desktop Assembly workspace and a faster mobile quick-actions model, while keeping the Seed as the live center of the Box.**

That is the simplest expression of the next version.

