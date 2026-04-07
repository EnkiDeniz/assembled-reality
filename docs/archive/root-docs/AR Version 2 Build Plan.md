# Loegos Version 2 Build Plan

**Status:** Working implementation roadmap after the Box migration  
**Date:** April 2026

## Purpose

This document translates [Loegos Version 2](/Users/denizsengun/Projects/AR/docs/AR%20Version%202.md) into a build sequence.

The direction doc explains what the product should become next.

This plan explains how to build it without breaking the shipped `1.0` Box workbench.

## Current Baseline

The current product already ships:

- Loegos branding
- Box language in the user-facing shell
- a Boxes launcher surface
- source intake into the active box
- listening and editing
- per-document Seven conversation
- staging
- assembly creation
- local receipt drafts
- optional GetReceipts sync

That is the baseline. Version 2 starts from there.

## Build Strategy

Build V2 in layers, not as a rewrite.

The right order is:

1. strengthen Box management
2. complete the return-from-reality loop
3. deepen Seven into a box reader
4. strengthen composition
5. strengthen receipts and the remote proof layer

The existing routes, data model, and working flows should be preserved wherever possible.

## Guiding Constraints

- Do not break auth, intake, listening, Seven conversation, assembly, or receipt drafting.
- Do not rename persistence unless the gain is worth the migration cost.
- Do not surface the full coordinate system as primary navigation.
- Do not make the product more powerful by making it less legible.
- Keep the live shell calmer than the doctrine behind it.

## Phase 0: Historical Hardening Pass

### Status

Already shipped before the Box migration.

### What it accomplished

- hardened save confidence
- moved receipts to document-scoped history
- improved playback reliability
- tightened the first-run launch experience

This phase remains important context, but it is no longer the live roadmap.

## Phase 1: Box Naming And Management

### Goal

Make Boxes feel fully first-class.

### Work

- improve the Boxes page and box switching flow
- support stronger box naming behavior
- improve empty box and sparse box states
- allow box-level actions without confusing the main workspace

### Definition of done

- a user understands what a Box is
- creating and switching boxes feels intentional
- the Boxes page acts like a real launcher, not a hidden mode

## Phase 2: Return From Reality

### Goal

Complete the loop beyond planning.

### Work

- add a clear departure moment for assemblies
- add a return prompt for used assemblies
- capture what happened after the assembly left the app
- connect that return to receipts in a lightweight, trustworthy way

### Definition of done

- a user can build an assembly, use it, and come back with evidence
- the product supports more than the planning phase

## Phase 3: Seven As Box Reader

### Goal

Extend Seven from document conversation to box-level reading.

### Work

- preserve per-document Seven threads
- add box-level summaries only when there is enough material
- introduce quiet diagnostics for sparse vs mature boxes
- let Seven read across multiple sources, assemblies, and receipts

### Important rule

`△ □ ○ × 1–7` remains the analysis model, not the navigation model.

### Definition of done

- Seven is more useful because it can read the box, not just the active document
- diagnostics stay earned and restrained

## Phase 4: Composition Upgrade

### Goal

Move assembly from ordered fragments toward stronger composition.

### Work

- better connective tissue tools
- better structure tools
- stronger synthesis flows
- more intentional templates where they genuinely help

### Definition of done

- assemblies feel authored, not merely accumulated

## Phase 5: Receipts And Remote Proof

### Goal

Make receipts feel like a first-class payoff layer.

### Work

- improve receipt review UX
- clarify local draft vs remote proof
- improve GetReceipts publish flow
- improve export and sharing surfaces

### Definition of done

- receipts are easy to understand
- GetReceipts feels like the remote proof system, not a side feature

## Cross-Cutting Technical Tracks

### 1. Compatibility

- preserve current user data
- preserve block lineage
- keep project-backed persistence stable while the UI speaks Box

### 2. Seven Execution Model

- keep useful outputs stageable
- preserve thread continuity where it matters
- avoid turning Seven into a generic chat transcript

### 3. Listening Quality

- keep playback reliable
- keep provider fallback stable
- preserve the feeling that listening is first-class

### 4. Future Diagnostics

- reserve room for shape and gradient metadata
- do not require it for the current UI to make sense

## Recommended Sequence

The next build order should be:

1. Box management
2. return-from-reality loop
3. Seven box diagnostics
4. composition upgrades
5. receipts and remote proof

## Immediate Next Tasks

1. make the Boxes launcher feel fully real
2. define the first return-from-reality interaction
3. decide when Seven should shift from document reading to box reading
4. decide what receipt review needs before broader sharing

## Success Criteria

Version 2 succeeds if:

- Boxes feel native and legible
- the loop extends beyond planning
- Seven becomes meaningfully smarter without becoming noisier
- assemblies improve in quality
- receipts become more valuable with repeated use

## Working Summary

Version `1.0` made the Box workbench real.

This plan is about making the full Box lifecycle real.
