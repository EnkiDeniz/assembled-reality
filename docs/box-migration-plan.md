# Box Model: Canonical UI-First Migration

## Summary

This document is the source of truth for the Box upgrade.

The first Box release is a UI-first migration:

- `Project` becomes `Box` everywhere user-facing
- `Main Project` disappears and becomes `Untitled Box`
- `Current assembly` becomes `Assembly`
- `Receipt log` becomes `Receipts`
- `Seven` stays visible as a contextual conversation and diagnostic surface
- database tables, route params, payload keys, and Prisma model names stay project-based internally

The governing rule for the deeper Lœgos system is simple:

`△ □ ○ × 1–7` is the analysis model for reading what is in a box. It is not the primary navigation model of the app.

## Canonical Product Model

### Box

A Box is the native top-level container in Loegos.

A box holds:

- sources
- one active assembly
- receipts
- a Seven reading surface

A project is a software placeholder. A box is the thing the user actually has.

### Sources

Sources are what enter the box.

They can be imported, pasted, linked, spoken, or derived from supported intake flows. The built-in `Lœgos` guide is also a source, but it remains a pinned guide inside the box rather than the hero of the product.

### Assembly

Assembly is the active built artifact inside the box.

It is the document the user is shaping from source material and staged blocks. The product should not expose `current assembly` language in the UI. The active built artifact is simply `Assembly`.

### Receipts

Receipts are the proof layer inside the box.

For the first pass, receipts remain a practical drafting and proof surface. The deeper convergence model is part of the doctrine, but the live UI should keep receipts legible and literal.

### Seven

Seven is the box's conversation and diagnostic surface.

In `1.0`, Seven is primarily conversational and contextual:

- ask about the document you are in
- keep the thread tied to that document
- move useful replies into staging

Seven can also become the place where box-level readings appear, but only when there is enough material in the box to justify them.

## Product Relationship

### Loegos

Loegos is the doctrine, language system, and workbench where the box lives.

### Lakin

Lakin is the intelligence layer that reads the box.

Lakin does not replace the box model. It interprets what is inside it.

### GetReceipts

GetReceipts is the proof and sealing layer connected to the box.

For `1.0`, GetReceipts remains optional and account-level. Local receipt drafts must stand on their own even when remote sync fails.

### PromiseMe

PromiseMe is a separate Lakin AI product that can eventually create and track commitments alongside or inside the box model.

It is part of the broader architecture, but not a required surface for the first Box upgrade.

## Analysis Model, Not Navigation Model

The coordinate system from `docs/loegos-box-v2.md` remains valid, but it has a specific role.

### What it is for

`△ □ ○ × 1–7` answers:

- what is in this box?
- what kind of material are we looking at?
- where does it sit in the arc?
- what is missing or overrepresented?

### What it is not for

It is not:

- the primary navigation structure
- the main tab model
- the first-run onboarding vocabulary
- decorative symbolism in the shell

The live product should stay simple:

- Box
- Sources
- Assembly
- Receipts
- Seven

The coordinate system becomes visible only when analysis has enough material to be meaningful.

## UI-First Migration Policy

The first Box pass is compatibility-safe.

### Keep unchanged internally

- Prisma `ReaderProject` and related models
- `projectKey`, `projectId`, and `currentAssemblyDocumentKey`
- `/api/workspace/project`
- `?project=` URLs
- existing route structure

### Change immediately in the UI

- `Project` → `Box`
- `Main Project` → `Untitled Box`
- `New Project` → `New Box`
- `Project settings` → `Box settings`
- `Project home` / overview language → `What's in the Box`
- `Current assembly` → `Assembly`
- `Receipt log` → `Receipts`

### View-model rule

The UI should consume Box semantics even when the server still emits project-shaped data.

That means the first pass adds a Box-facing adapter over the current project model instead of renaming persistence.

## Seven Activation Rule

Seven remains visible as a contextual surface in the workspace, but box-level diagnostic copy is gated.

### Show a box-level reading only when the box has:

- `2+` non-built-in sources, or
- `1+` receipt

### Otherwise show a quiet placeholder

Use language like:

`Seven needs more in the box to read the pattern.`

This prevents the product from overclaiming insight before the box has enough material to justify a read.

## Launch Language Rules

### Use these nouns consistently

- `Box`
- `Sources`
- `Assembly`
- `Receipts`
- `Seven`

### Capitalization

- use `Box` in labels, headings, tabs, and CTAs
- use `box` in descriptive prose

### Avoid these phrases in the live product

- `Project`
- `Main Project`
- `Current assembly`
- `Receipt log`

## Implementation Phases

### Phase 1 — UI-first Box migration

- rewrite docs and product language around the Box model
- add a Box-facing view-model adapter
- remove `Project` from the user-facing shell
- keep persistence untouched

### Phase 2 — Box naming

- make box naming first-class
- support user-controlled box names
- optionally suggest a name from the first sealed receipt

### Phase 3 — Shape foundation

- add shape and gradient metadata to sources and receipts
- introduce box overview summaries

### Phase 4 — Seven diagnostics

- shape balance
- gradient distribution
- gap analysis
- ghost operator detection

### Phase 5 — Full coordinate system

- convergence mapping
- advanced scoring
- deeper Lakin reads if the product still benefits from them

## Acceptance Criteria For The First Pass

- users see `Untitled Box`, never `Main Project`
- no visible `Project` language remains in the main product UI
- the active built artifact is labeled `Assembly`
- `Receipts` replaces `Receipt log`
- Seven remains conversational first
- sparse boxes do not receive overconfident diagnostics
- existing project-backed routes and records keep working without migration

## One-Sentence North Star

Open a box, bring in sources, shape the assembly, keep the receipts, and let Seven read the pattern only when the box has earned a read.
