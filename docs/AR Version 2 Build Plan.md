# AR Version 2 Build Plan

**Status:** Working implementation roadmap, with Phase 0 shipped in the current workspace code  
**Date:** April 2026

## Purpose

This document translates [AR Version 2](/Users/denizsengun/Projects/AR/docs/AR%20Version%202.md) into a build sequence.

The V2 direction doc explains what the product is becoming.

This plan explains how to build it without losing the current working product.

## Build Strategy

We should build V2 in layers, not as a rewrite.

The right approach is:

1. simplify the current version
2. introduce the project model
3. reshape the workspace around projects
4. build the Learn loop
5. add voice economics
6. strengthen receipts, sharing, and the remote proof layer

The current backend and working flows should be preserved wherever possible.

## Guiding Constraints

- Do not break auth, uploads, current AI operations, or current receipt drafting while evolving the product.
- Do not throw away the existing block model.
- Do not retrofit lineage later.
- Do not make the UI more powerful at the cost of becoming less understandable.
- Preserve fallback behavior for listening.

## Phase 0: Review And Simplification

### Status

Implemented on April 3, 2026 as an additive hardening pass over the current `Assembled Reality` product.

### Goal

Make the current product calmer, clearer, and more trustworthy before adding the next abstraction layer.

### Work

- review the startup flow, launchpad, and intro
- replace session-wide receipt logging with document-scoped receipt history
- tighten save confidence for editing with optimistic concurrency
- review the listening flow end to end
- reduce confusing or duplicate UI
- tighten product language so it describes outcomes, not internal structures
- clarify local draft versus pushed-to-GetReceipts receipt status

### Specific deliverables

- launchpad and intro pass
- document-scoped receipt/log mode
- visible save confidence in edit mode
- conflict recovery for stale saves
- player and listening polish
- browser-native `Device` voice path
- actual provider labeling during playback
- clearer receipt draft status:
  - local draft
  - pushed to GetReceipts

### What shipped in code

- `Draft receipt` and `Export receipt` now use only the active document's log entries.
- Assembly receipts are assembly-scoped and lineage-scoped, not whole-session-scoped.
- Document saves now use `updatedAt` as a revision token and return `409` on stale writes.
- The workspace shows document-level save states: `saving`, `saved`, `conflict`, and `error`.
- Editing the active block stops playback and invalidates stale generated audio.
- Selecting `Device` now uses browser `speechSynthesis` instead of the server audio route.
- The player preserves block-by-block playback controls across cloud and device voice.
- The intro and launchpad now frame the product around source → blocks → assembly → receipt.

### Explicitly not part of Phase 0

- project-model migration
- delete redesign
- new sharing surfaces beyond current document and receipt export

### Verification status

- production build passes
- shipped app code passes targeted lint
- repo-wide lint still fails in `prototype/`, which remains outside the shipped product paths

### Definition of done

- first-time user can understand the first move
- listening feels stable
- editing feels saved
- receipt logs feel attached to the current document, not the whole session
- the product no longer feels like “documents and assemblies are the same kind of thing”

## Phase 1: Introduce The Project Model

### Goal

Move from a flat document library to a real project container without destroying the current product.

### Product model

Each project should contain:

- sources
- current assembly
- receipt history
- reflection history

### Work

- define the project schema
- define project creation rules
- define how existing user documents migrate into projects
- define a default project strategy for existing accounts

### Recommended data model direction

- `Project`
- `ProjectSource`
- `ProjectAssembly`
- `ProjectReceipt` or project-linked receipt references
- `ProjectReflection`

The existing document tables and workspace metadata can be adapted into this, but the new top-level object should be explicit.

### Migration strategy

- create a default project per user for existing materials
- attach the built-in source and existing uploaded docs into that project
- treat existing assemblies as early project assemblies
- preserve document keys and block lineage where possible

### Definition of done

- a user can open a project, not just a document
- existing data still loads
- sources and the current assembly are clearly distinct in the model

## Phase 2: Rebuild The Workspace Around Projects

### Goal

Reshape the current workspace so it feels like:

`open project → inspect sources → work on current assembly`

### Work

- add a project home / project overview surface
- separate source navigation from assembly navigation
- show the current assembly as the primary working artifact
- keep the clipboard central
- keep receipts visible
- make the project history legible

### UX targets

- opening a project should feel closer to opening a repo than opening a loose file
- the user should understand what is input material and what is the current build
- switching between sources and the assembly should feel normal, not conceptual

### Candidate V2 workspace structure

- project header
- source tabs or shelf
- current assembly surface
- clipboard / staging area
- player
- receipt/log mode

### Definition of done

- the UI no longer feels like a flat library
- the project model is visible in the IA
- the assembly feels like the primary artifact inside the project

## Phase 3: Build The Learn Surface

### Goal

Close the loop between plan and reality.

### Work

- add a return prompt for assemblies:
  - how did it go?
- add reflection capture
- add plan vs actual comparison
- allow outcome notes tied to assemblies
- carry reflections into receipts
- allow follow-up assembly creation from reflected results

### Core UX

The user should be able to:

1. build a plan
2. leave the app
3. return later
4. capture what happened
5. see the gap between intention and outcome

### Definition of done

- the product supports `Plan → Live → Learn`, not just planning
- reflections can be stored, revisited, and included in receipts

## Phase 4: Voice Economics

### Goal

Make premium listening sustainable.

### Product model

- base plan includes monthly premium voice credits
- premium voice spends credits
- lower-cost fallback voice remains available
- the listening loop continues even when premium credits are gone

### Work

- define the credit unit:
  - character-based
  - time-based
  - audio-generation-based
- add a voice-usage ledger
- attach usage to user accounts
- add quota display in the UI
- add graceful premium-to-fallback downgrade
- decide whether extra credits, tier upgrades, or both are supported

### UX requirements

- show remaining premium credits
- show active provider
- show fallback clearly but calmly
- avoid surprising interruptions

### Definition of done

- premium voice cost is controlled
- users understand what they are using
- listening does not break when quota is exhausted

## Phase 5: Strengthen Composition

### Goal

Move assembly from concatenation toward composition.

### Work

- AI stitch operation for connective tissue
- better compare/synthesis views
- possible side-by-side source comparison
- stronger section structure tools
- composition templates for common real-world jobs

### Candidate templates

- meeting prep
- project brief
- trip planning
- weekly review
- research synthesis

### Definition of done

- assembled outputs feel authored, not merely stacked

## Phase 6: Strengthen Receipts And The Remote Layer

### Goal

Make receipts easier to publish, review, and trust.

### Work

- improve receipt review UX
- clarify local draft vs remote proof
- strengthen GetReceipts publishing flow
- add better session history
- strengthen export and native share behavior

### Share definition for the later phase

Share should remain simple:

- export document
- export receipt
- use native sharing surfaces where available
- optionally publish proof to GetReceipts

Public-link complexity should come later, if ever.

### Definition of done

- receipts feel like a first-class product layer
- GetReceipts feels like the remote proof system, not a side integration

## Cross-Cutting Technical Tracks

These run across phases.

### 1. Data migration and compatibility

- preserve current user data
- preserve block IDs and lineage
- keep a stable migration path from the current workspace model

### 2. AI execution model

- keep AI outputs block-shaped
- preserve rationale where useful
- log AI actions as receipt events
- avoid chat-history bloat

### 3. Listening quality

- keep playback sync tight
- invalidate stale audio when content changes
- keep provider fallback stable

### 4. Billing and entitlement readiness

- make voice credits observable in the product
- leave room for future plan tiers

## Recommended Sequence

If we build this in order, the next sequence should be:

1. Phase 0: review and simplification
2. Phase 1: project model
3. Phase 2: project workspace
4. Phase 3: Learn surface
5. Phase 4: voice economics
6. Phase 5: composition improvements
7. Phase 6: receipts and remote proof layer

## Immediate Next Tasks

Phase 0 is done. The next real build steps should be:

1. convert the current mental model from flat documents into a draft project model
2. decide how existing user materials map into default projects
3. define the first V2 screen:
   - open project
   - recent projects
   - current assembly
4. define migration rules for receipts, reflections, and other project history
5. decide what Phase 1 preserves unchanged from the current workspace shell

## Success Criteria For V2

Version 2 succeeds if:

- users understand they are working in projects
- sources and assemblies are clearly different
- the product supports the return-from-reality moment
- receipts become more valuable as the loop deepens
- premium voice is sustainable
- AI feels like a partner inside the project, not a generic chat tool

## Working Summary

Version 2 should not be treated as “more features on top of Version 1.”

It should be treated as:

1. simplify the current product
2. make the project model explicit
3. build the full Plan → Live → Learn loop
4. make receipts and voice economics sustainable enough to support that loop
