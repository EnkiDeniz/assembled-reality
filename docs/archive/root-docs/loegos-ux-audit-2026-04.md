# Loegos UX Audit

**Status:** Canonical workspace audit  
**Date:** April 5, 2026  
**Audience:** Product, design, and implementation  
**Scope:** Authenticated desktop workspace, box home, source reading, seed/assembly state, Operate/Receipts handoff

## Summary

The live product already contains the right primitives. The audit problem is not "missing product." It is that too many valid concepts are visible at once, and the shell does not consistently declare which one is the current star.

The strongest current runtime qualities are:

- the intro/login screen is the cleanest expression of the current Loegos brand
- the authenticated source-reading view is focused and legible
- the product model is real, not theoretical: sources, seed, Operate, receipts, and box history all exist
- the visual language already has a calm graphite base that can support a strong final system

The main UX failures are:

1. too many simultaneous centers of gravity in the workspace
2. inconsistent phase ownership between box home, seed, assembly lane, Operate, and receipts
3. provenance and trust are present but not legible enough to guide action
4. naming and status language mix product nouns, process labels, and internal-state language in the same moments
5. the box home tries to answer too many questions at once

The design implication is clear: Loegos needs stronger screen stars, tighter phase separation, and a single interpretation of trust/proof language across the shell.

## Audit Standard

This audit judged the workspace against the current repo truth:

- core loop from `README.md`: `import source → listen / ask Seven → stage blocks → assemble → operate → draft receipt`
- IA rules from `docs/information-architecture.md`
- current-state guardrails from `docs/current-state-audit.md`
- live authenticated runtime behavior captured in browser screenshots and DOM snapshots

Each screen was evaluated on:

- orientation
- task clarity
- visual hierarchy
- action priority
- terminology consistency
- provenance and trust visibility
- interaction cost

## Evidence

Runtime captures used for this audit:

- `output/playwright/audit-intro-anchor.png`
- `output/playwright/audit-workspace-seed.png`
- `output/playwright/audit-source-reading.png`
- `output/playwright/audit-box-home.png`
- `output/playwright/audit-box-operate-or-receipts.png`
- `output/playwright/audit-box-receipts.png`

Runtime snapshots used for detail:

- intro/login at `/intro`
- seed workspace at `/workspace?project=loegos-origin-example&mode=assemble&document=seed-of-seeds-3`
- source-reading at `/workspace?project=loegos-origin-example&mode=listen&document=what-s-in-the-box`
- box home / launchpad at `/workspace?project=loegos-origin-example&launchpad=1&launchpadView=box`

Runtime sanity notes:

- source-reading and core workspace render without console errors
- Operate interaction produced a `429 Too Many Requests` error at `/api/workspace/operate`
- switching between Operate and Receipts does not produce a clearly distinct state in the captured launchpad flow

## Brand Anchor

The intro/login surface in `audit-intro-anchor.png` should be treated as the current brand anchor.

Why:

- it expresses the graphite shell most cleanly
- typography and spacing are more controlled than in the authenticated workspace
- it presents the product as calm, serious, and tool-like without overcrowding

Design consequence:

- authenticated screens should inherit more of the intro screen's restraint
- future shell redesigns should compare themselves against the intro for tone, spacing, and concentration of emphasis

## Findings

### Re-entry And Orientation

#### [High][Visual hierarchy] The intro/login screen is materially more coherent than the main workspace

Evidence:

- `audit-intro-anchor.png` versus `audit-workspace-seed.png`

Why it matters:

- the brand promise is currently clearest before login
- the product becomes noisier exactly when the user reaches the core working surface

Recommended direction:

- use the intro screen as the visual anchor for authenticated shell refinement
- preserve its restraint, spacing discipline, and controlled emphasis when redesigning the workspace chrome

#### [Critical][UX structure] The seed workspace has no single dominant job

Evidence:

- `audit-workspace-seed.png`
- seed snapshot shows all of the following at once: source rail, seed update notice, seed editor, stage sidecar, top action bar, box navigation, and persistent listening controls

Why it matters:

- the user cannot tell whether the current task is "review the seed," "respond to a seed update," "manage sources," "stage blocks," or "listen"
- this violates the `one star` rule and slows first action

Recommended direction:

- make the center surface own exactly one job per state
- in seed mode, the star should be the seed and its next revision
- demote source management and playback to support status unless explicitly invoked
- move opportunistic system notices like "Seed update available" into a tighter inline decision block or separate review state

#### [High][Copy/naming] The shell mixes product nouns and internal process language in the same header

Evidence:

- "Reality"
- "Released · Committing"
- "Assembly Index is ready."
- "Assembly lane"
- "Seed"
- "What’s In The Box"

Why it matters:

- the user has to parse multiple vocabularies at once: box status, assembly protocol, current document, and phase
- several of these are meaningful internally but not action-driving externally

Recommended direction:

- constrain the header to three things only:
  - current box
  - current phase
  - one next action
- move internal or diagnostic language like `Released · Committing` and `Assembly Index is ready.` into a secondary details layer

### Thinking Through Sources

#### [High][Visual hierarchy] The source rail is informative but visually over-instrumented

Evidence:

- each source row shows title, block count, source type, provenance, multiple chip labels, and trust
- the left rail in `audit-workspace-seed.png` is visually louder than the center surface

Why it matters:

- the support rail competes with the main work area instead of orienting it
- trust is present but buried inside repeated micro-labels

Recommended direction:

- keep title + one supporting line + one compact trust/provenance marker as the default row
- move secondary metadata into hover, disclosure, or details state
- let the active document carry richer context in the center panel instead of inside every rail row

#### [Medium][Trust/provenance] Trust labels are visible but not decision-useful

Evidence:

- repeated row patterns like `Load-bearing · Text · Uploaded · L1 trust`
- trust appears as a suffix, not as a meaningful explanation

Why it matters:

- trust is one of the product's differentiators, but it currently reads like taxonomy rather than guidance
- users can see that trust exists without understanding how it should affect action

Recommended direction:

- define one canonical compact trust pattern per source row
- reserve richer trust language for the details panel or source header
- make trust answer a user question such as "How safe is this to build from?" instead of only reporting a label

#### [Low][Interaction/state] Source reading is the strongest current screen

Evidence:

- `audit-source-reading.png`
- the listening view collapses the shell to title, content, and playback

Why it matters:

- this is the clearest proof that Loegos becomes more usable when phase ownership is strict

Recommended direction:

- use this screen as the structural model for other phases:
  - one main object
  - one support strip
  - one action family

### Creating And Editing

#### [Critical][UX structure] Seed editing, staging, and source selection are braided too tightly

Evidence:

- seed mode shows the seed editor, stage queue, sidecar tabs, source rail, and playback at once
- the stage panel language says "The queue is the handoff between sources, Seven, and the living seed" while the center also presents seed controls and update prompts

Why it matters:

- Create should feel like active shaping, but right now the user has to mentally compose the phase from several small systems
- the staging panel is conceptually correct but spatially subordinate and easy to ignore

Recommended direction:

- when in Create/Seed mode, stage should become first-class
- choose one of these patterns and implement it consistently:
  - stage as the dominant right-side partner to the seed editor
  - or stage as a top/center sequence feeding directly into seed changes
- do not make stage feel optional while the screen copy claims it is the handoff

#### [High][UX structure] `WorkspaceShell.jsx` owns too many distinct screen-state families

Evidence:

- `src/components/WorkspaceShell.jsx` is `11202` lines
- the component directly owns at least these top-level desktop states:
  - boxes launchpad
  - box-home launchpad
  - first-box composer
  - source-reading
  - think workspace
  - create/seed workspace
  - Operate workspace
  - Receipts workspace
- it also directly coordinates:
  - 3 desktop sidecar states: Seven, Stage, Details
  - at least 8 sheet/dialog families: workspace picker, mobile box sheet, drop-anything, photo intake, mobile compose, receipt seal, close move, confirmation queue
  - multi-phase voice recorder state

Why it matters:

- the shell is not just large; it is acting as the runtime owner of too many surface transitions
- state entanglement makes IA cleanup and visual cleanup harder at the same time

Recommended direction:

- treat the shell as an orchestration layer, not a screen implementation layer
- split by owned screen-state family, not by arbitrary helper extraction
- minimum split target:
  - launchpad container
  - first-box/onboarding container
  - listen container
  - think/create workbench container
  - Operate container
  - Receipts container
- secondary extraction target:
  - mobile sheets and recorder flow
  - feedback/instrument state helpers

#### [Medium][Action priority] The top action bar is too flat

Evidence:

- `Add source`, `Speak`, `Box settings`, plus phase buttons and box switcher all share similar emphasis

Why it matters:

- the user cannot tell which action is expected now versus merely available

Recommended direction:

- reserve one primary action style per screen
- demote utilities like settings and global navigation
- surface contextual actions based on the active phase

### Operating On The Box

#### [High][Interaction/state] Operate is discoverable but not trustworthy in the captured runtime

Evidence:

- Operate tab is clickable in box home
- runtime log shows `429 Too Many Requests` on `/api/workspace/operate`
- the screen does not clearly transition into a distinct Operate result state in the captured flow

Why it matters:

- Operate should feel like a culmination moment
- if activation is unreliable or visually ambiguous, the product undermines one of its core differentiators

Recommended direction:

- make Operate a visibly separate state with clear loading, success, and failure surfaces
- show a bounded result container, not just an active tab and a `Run Operate` button
- ensure failure states are explicit and recoverable in-product

#### [High][Product confidence] There is no dedicated rate-limit UX pattern for Operate failures

Evidence:

- `runOperate()` throws the API error string and sends it through generic `setFeedback(..., "error")`
- the console log shows `429 Too Many Requests`
- the current UX path sets `operateError` and the global error feedback, but does not present a rate-limit-specific retry or cooldown pattern

Why it matters:

- this is not just an interaction glitch; it directly affects trust in the product's core read
- a user hitting a 429 on Operate should understand what happened, whether the box changed, and what to do next

Recommended direction:

- create a specific Operate rate-limit state with:
  - explicit message that the box and seed were not changed
  - retry guidance or retry-after timing if available
  - a stable failed state inside the Operate surface, not only a generic toast/banner
  - optional fallback move such as "Ask Seven about current source instead"

#### [Medium][Visual hierarchy] Box home currently over-mixes chronology, proof, and diagnostics

Evidence:

- `audit-box-home.png`
- launchpad view presents assembly summary, chronology/origin list, proof list, and word-layer diagnostics in one long page

Why it matters:

- the box home should answer `What is in this box?` and `What should I do next?`
- right now it also tries to answer `How did the box evolve?`, `What proof exists?`, and `What lexical analysis can we run?`

Recommended direction:

- box home should prioritize:
  - current position
  - next move
  - compact proof summary
  - source inventory
- chronology and word-layer analysis should become expandable sections or secondary views

### Reviewing Proof

#### [High][UX structure] Receipts does not currently read as a separate proof-first destination

Evidence:

- switching from Operate to Receipts in the captured launchpad flow did not produce a clearly distinct state
- proof content is visible in box home, but Receipts does not visually assert itself as its own phase in the audit run

Why it matters:

- the README explicitly positions receipts as proof/history, not a peer editing mode
- if proof feels buried inside a general launchpad, the product loses one of its clearest value propositions

Recommended direction:

- give Receipts a visually distinct proof surface with:
  - current receipt state
  - local/remote connection status
  - latest sealed proof
  - evidence trail and receipt history
- do not make the user discover proof via mixed cards inside a general box overview

## Prioritized Redesign Brief

### Immediate UX corrections

1. Rebuild seed mode around one dominant center task: shape or review the seed.
2. Simplify the workspace header to current box, current phase, and one primary action.
3. Reduce default source-row metadata and make trust compact and actionable.
4. Make Operate and Receipts visibly separate states with explicit loading, success, and failure patterns.
5. Use the intro/login screen as the authenticated-shell brand anchor.

### Shell simplifications

1. Stop showing equally strong controls for navigation, settings, capture, and current-phase work in the same top row.
2. Demote chronology and word-layer analysis on box home; keep them available but not primary.
3. Use source-reading as the reference model for clearer phase ownership elsewhere.
4. Split `WorkspaceShell.jsx` by owned screen-state family, not by micro-helper.

### Later polish

1. Tighten copy style so the runtime speaks in one system voice.
2. Refine micro-status language and badge density.
3. Improve motion and transitions only after structural simplification is complete.

## Acceptance Criteria For The Next Sprint

- a returning user can identify the current phase and next action in under 10 seconds
- every major screen has one obvious star
- trust/provenance is visible without overwhelming the rail
- Operate and Receipts each have unmistakable state ownership
- box home answers orientation first and analysis second
