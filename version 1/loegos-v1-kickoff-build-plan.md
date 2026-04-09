# Lœgos v1 Kickoff Build Plan

## Purpose

This plan translates the current v1 canon into a build sequence.

It is derived from:

- the aim brief
- the language spec
- the reality-assembly draft
- the product redefinition
- the Seven governance note
- the capability assembly map

It is not derived from the older shell structure.

## Build law

The product should be assembled along the atomic ladder:

`source object -> witness -> block -> marked block -> compiled Lœgos structure -> move/test -> receipt`

This is the most reliable order for building the next product shape.

## Governing loops

### Product

`state -> move -> test -> receipt -> update -> seal / flag / stop -> return`

### Language

`declare -> capture -> observe -> weld -> move -> test -> receipt -> seal`

### Agents

`rate -> tighten weakest axis -> rerate -> seal / flag / stop`

The build must preserve these as distinct layers.

## Platform priority

### Mobile priority

Mobile should be best at:

- fast source addition
- witness reading
- listening
- text follow
- block marking
- save and resume

### Desktop priority

Desktop should be best at:

- compile
- compare
- Lœgos editing
- next-move selection
- test/receipt judgment
- seal / flag / stop review

## Milestone 1: Box, witness, and listening loop

### Goal

Make the capture side excellent before rebuilding deeper assembly logic.

### Deliver

- clear box home centered on aim and latest state
- one obvious `Add source` entry
- normalization into witness objects
- calm witness reading
- notes-level witness editing
- listening that is clearly bound to the current witness
- text follow during playback
- mobile-first witness resume state

### Acceptance test

A user can:

1. open a box
2. add a source quickly
3. read it
4. listen to it
5. leave
6. return
7. know exactly what object they are in

## Milestone 2: Block marking and advancement

### Goal

Create the bridge between sensing and assembly.

### Deliver

- visible block boundaries inside witness
- one simple action meaning:
  `this block matters to the aim`
- marked blocks saved as advancement candidates
- lightweight rationale or tag surface for why a block matters
- marked blocks visible later on both mobile and desktop

### Acceptance test

A user can listen to a witness, mark a meaningful block, and later find that block as something the box can advance.

## Milestone 3: Explicit compile and compare

### Goal

Make the witness-to-Lœgos conversion visible, teachable, and trustworthy.

### Deliver

- explicit `Compile to Lœgos`
- explicit `Recompile`
- persisted compile boundary metadata
- side-by-side compare:
  - witness
  - Lœgos
  - rationale
- stale detection after witness changes

### Acceptance test

A user can compile witness into Lœgos, see what changed and why, and understand why the Lœgos form is more operable than the raw witness.

## Milestone 4: Desktop assembly workbench

### Goal

Let the user work directly on the active Lœgos structure without losing the trace back to witness.

### Deliver

- editable Lœgos blocks
- rewrite, split, merge, compress
- type and stage visibility
- open-witness context from the active structure
- clearer grammar ownership across:
  - type
  - stage
  - support/trust
  - exception

### Acceptance test

A user can change the active structure directly and always know whether they changed witness or Lœgos.

## Milestone 5: Governed Seven

### Goal

Move Seven from side assistant to bounded operator inside the alignment loop.

### Deliver

- explicit axis rating support
- weakest-axis identification
- one bounded next-move recommendation
- one test recommendation
- rerate support
- explicit end states:
  - `seal`
  - `flag`
  - `stop`

### Acceptance test

Seven helps move the box forward by one bounded cycle instead of expanding the conversation indefinitely.

## Milestone 6: Move, test, and receipt cycle

### Goal

Make the first accountable runtime atom real.

### Deliver

- one next move attached to the active state
- one test attached to that move
- returned signal captured as a receipt
- visible before/after state
- receipt storing:
  - starting state
  - move
  - test
  - returned result
  - ending state
  - seal / flag / stop outcome

### Acceptance test

A user can perform one full bounded cycle and preserve the result as an accountable receipt-bearing update.

## Milestone 7: Box return and accumulation

### Goal

Make the box feel like an assembly space that accumulates reality, not a pile of screens.

### Deliver

- calm box home
- latest witness
- latest marked blocks
- active Lœgos status
- latest receipt state
- explicit next move
- explicit open gap if unresolved

### Acceptance test

When the user returns days later, they understand where the box stands and what should happen next.

## What to preserve from the current system

- auth and session
- box/project persistence
- source intake and normalization
- document persistence
- listening substrate
- witness-to-Lœgos compile substrate
- compare substrate
- Operate
- attested override
- receipt routes and remote sync logic
- design system and visual language

## What not to preserve as product identity

- the current mixed desktop shell
- tab-heavy desktop navigation
- generic AI chat as the center
- mode sprawl
- phase-heavy labels that obscure the real loop

## Test posture

Each milestone should have:

- one simple human acceptance test
- one focused automated test for the new invariant
- no continuation into the next milestone until the current one is trustworthy

## Final rule

Do not build the new shell by decorating the old shell.

Build it by assembling the correct objects and loops in the right order.
