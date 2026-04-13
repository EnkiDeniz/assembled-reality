# Design Reference Stack: Room + Dream MVP

Date: April 13, 2026  
Status: Active reference stack  
Purpose: Establish the active reference order so design and engineering work from one consistent MVP center.

---

## 1. Active Design Center

For the current MVP phase, the active center is:

- `Room`
- `Dream`
- `Bridge`
- `workingEcho`
- `Compiler Read`

Everything else is either:

- utility
- contextual
- deferred
- or prototype / observer tier

This is the current design boundary.

---

## 2. Canonical Reference Order

Read and interpret in this order.

### 2.1 Product constitution

- [projection-contact-loop-constitution-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/projection-contact-loop-constitution-2026-04-13.md)

Use this for:

- product law
- force flow
- what must remain load-bearing

### 2.2 MVP alignment

- [team-realignment-memo-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/team-realignment-memo-room-dream-mvp-2026-04-13.md)

Use this for:

- current scope
- sequencing
- what counts as MVP
- what must be deferred

### 2.3 Runtime design direction

- [room-dream-foundation-design-proposal-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/room-dream-foundation-design-proposal-2026-04-13.md)

Use this for:

- surface behavior
- IA
- shell logic
- Room / Dream / Bridge interaction shape

### 2.4 Engineering trust contracts

- [compiler-engineer-response-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/compiler-engineer-response-room-dream-mvp-2026-04-13.md)

Use this for:

- minimum honest contracts
- trust transitions
- structure-layer build order
- honesty checks

### 2.5 Runtime cut line

- [minimal-runtime-foundation-proposal-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/minimal-runtime-foundation-proposal-2026-04-13.md)

Use this for:

- what stays in the runtime center
- what gets hidden
- what gets deferred
- anti-dashboard discipline

### 2.6 Design handoff framing

- [designer-handoff-memo-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/designer-handoff-memo-room-dream-mvp-2026-04-13.md)

Use this for:

- required outputs
- planning questions
- design deliverable shape

### 2.7 Design system law

- [loegos-design-system-v6.jsx](/Users/denizsengun/Projects/AR/loegos-design-system-v6.jsx)

Use this for:

- visual law
- material treatment
- typography law
- card logic
- color semantics

### 2.8 Runtime hinge note

- [working-echo-and-911-north-star-2026-04-11.md](/Users/denizsengun/Projects/AR/docs/working-echo-and-911-north-star-2026-04-11.md)

Use this for:

- why `workingEcho` matters
- steering feel
- visible stabilizer direction

---

## 3. Precedence Rule

If two docs conflict, interpret them in this precedence order:

1. constitution
2. MVP realignment memo
3. Room + Dream design proposal
4. compiler-engineer response
5. minimal runtime cut line

This means:

- the minimal runtime doc does not override higher-level MVP or contract decisions
- the reference stack should never route contributors through older cut-line assumptions first
- keep/hide/defer decisions are downstream of the current MVP center, not above it

---

## 4. Working Product Model

### 4.1 Room

The live steering surface.

Must contain:

- active thread identity
- thread
- composer
- source entry
- thin but real `workingEcho`
- field state

### 4.2 Dream

The source re-entry surface.

Must contain:

- document access
- active document stage
- `Compiler Read`
- `Send to Room`
- listening

Current sequence priority:

1. document stage
2. `Compiler Read`
3. `Send to Room`
4. listening polish

### 4.3 Bridge

The handoff seam between Dream and Room.

Must preserve:

- source identity
- anchor
- provenance
- continuity

### 4.4 Utility

Subordinate only:

- account
- settings
- sign out

Not a third equal product surface.

---

## 5. What Is In Scope

- shell
- `Room`
- `Dream`
- `Bridge`
- the visual and behavioral role of `workingEcho`
- mobile and desktop behavior for the above

---

## 6. What Is Out Of Scope For Planning

Do not let these distort the MVP planning phase:

- Recon as a runtime mode
- Drive Tape as a runtime mode
- Seven Terminal
- Shape Library as a top-level destination
- boxes as visible destination
- sessions as visible region
- witness as permanent section
- operate as permanent section
- mirror as permanent section
- receipt kit as primary surface
- design-proposal routes inside the main signed-in app

These may matter later.
They are not the design center now.

---

## 7. Runtime Design Rules

### 7.1 The shell is not the product center

The shell exists to support:

- `Room`
- `Dream`
- `Bridge`

It must not become a control wall.

### 7.2 Room must not collapse into chat

If Room becomes only messages plus input, the product center is lost.

### 7.3 Dream must not collapse into storage

If Dream becomes only files plus playback, the product center is lost.

### 7.4 Bridge must remain first-class

If Dream -> Room handoff becomes hidden plumbing, the MVP loses continuity.

### 7.5 `workingEcho` must remain real

If `workingEcho` becomes decorative summary, Room stops being a steering instrument.
