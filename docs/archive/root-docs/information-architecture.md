# Loegos Information Architecture

**Status:** Canonical information architecture spec  
**Scope:** Navigation, surface ownership, desktop/mobile behavior, and naming

---

## Summary

Loegos has two layers of structure:

- structural nouns: `Box`, `Boxes`, `Sources`, `Assembly`, `Receipts`, `Seven`, `Operate`
- workflow framing: `Think → Create → Operate`

The information architecture must preserve both without turning the product into either:

- a generic dashboard
- a wizard
- a symbolic doctrine puzzle

## Top-Level Navigation

Top-level routes remain:

- `/`
- `/workspace`
- `/account`
- `/opengraph-image`

Authenticated navigation model:

1. `Boxes` index
2. `Box home`
3. opened `Box` workspace
4. account / settings

The `Boxes` index exists outside the main user loop.

## Box-Level IA

### Boxes index

Owns:

- open current box
- open another box
- create a box
- open Box management

Primary user question:

`Which box am I working in?`

### Box home

Owns:

- strongest next move
- current position
- proof summary
- source inventory
- recent assembly / receipt context

Primary user questions:

- `What is in this box?`
- `What should I do next?`

### Think

Owns:

- source rail
- source/document reading
- listening
- source-level context
- document-scoped Seven

Primary user question:

`What is in this box?`

### Create

Owns:

- staging
- Assembly
- editing
- source-to-assembly movement

Primary user question:

`What are we building from this?`

### Operate

Owns:

- box read
- diagnosis
- Operate result surface
- Seven audit handoff
- receipt drafting from the result

Primary user question:

`What does this box mean now, and what happens next?`

### Receipts

Owns:

- latest proof state
- local vs remote draft status
- GetReceipts connection state
- recent drafts
- evidence trail

Primary user question:

`What proof exists now?`

## Desktop Layout

Desktop is the primary quality bar.

Current persistent layout:

- left rail: `Sources` and Box navigation
- center surface: active source or Assembly
- right utility area: Seven and staging / create context
- top header: Box context plus primary actions including Operate
- bottom or pinned playback area: listening controls

Key rule:

The main reading/building surface must stay dominant. Support surfaces should help the work, not compete with it.

## Mobile Layout

Mobile is secondary but coherent.

Current intended behavior:

- one primary content surface visible at a time
- source navigation in a sheet
- Seven in a sheet or rail-like overlay
- staging in a sheet
- Receipts reachable directly as a phase
- Operate reachable from the top-level action area
- playback remains reachable and stable

Key rule:

Mobile should preserve the model, not mimic the desktop layout literally.

## Visibility Rules

### Always visible concepts

- Boxes
- Box
- Sources
- Assembly
- Receipts
- Seven
- Operate

### Contextual concepts

- staging count
- source type or trust hints
- Operate summary
- Seven audit prompts
- receipt connection state

### Deferred / gated concepts

- deep `△ □ œ × 1–7` analysis
- shape distribution
- gradient distribution
- ghost operator diagnostics

These should only appear when the Box has enough material to justify them.

## Naming Rules

Use these nouns consistently:

- `Boxes`
- `Box`
- `Sources`
- `Assembly`
- `Receipts`
- `Seven`
- `Operate`

Use these workflow words consistently:

- `Think`
- `Create`
- `Operate`

Avoid in the live product shell:

- `Project`
- `Main Project`
- `Current assembly`
- `Receipt log`

## IA Behavior Rules

### 1. `Boxes` and `Box home` are not the same surface

`Boxes` chooses the container. `Box home` orients the user inside the chosen container.

### 2. `Think → Create → Operate` is workflow framing, not a rigid wizard

The user should feel the phases clearly, but the product should not trap them in forced step transitions.

### 3. Seven and Operate must not overlap

Seven is contextual conversation. Operate is box diagnosis.

### 4. Receipts remain proof/history, not peer editing

They can be visible and important without becoming another editing surface.

### 5. The built-in guide is a source, never the hero object

It stays in the Box and can teach the system, but it does not define the product identity.

### 6. The coordinate system is analysis, not navigation

`△ □ œ × 1–7` informs diagnostics and Operate. It does not become the shell IA.

## Acceptance Criteria

The IA is correct when:

1. A new user can explain the difference between `Boxes` and `Box home` after one session.
2. The opened Box clearly separates thinking, construction, box read, and proof.
3. Seven, staging, Assembly, Operate, and Receipts no longer feel like competing side features.
4. Desktop and mobile preserve the same model even with different layouts.
