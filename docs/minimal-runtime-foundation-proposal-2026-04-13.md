# Minimal Runtime Foundation Proposal

Date: April 13, 2026  
Status: Active runtime cut line  
Purpose: Define the current MVP runtime cut line so design and engineering rebuild from one stable center instead of re-importing earlier runtime assumptions.

---

## 1. Summary

The smallest correct MVP runtime is:

- `Room` as the live steering surface
- `Dream` as the source re-entry surface
- `Bridge` as the first-class seam between them
- `workingEcho` as the visible structural object that keeps Room from collapsing into generic chat
- `Compiler Read` as a read-only Dream action

Everything else should either be:

- quiet utility
- contextual support
- hidden but preserved
- or explicitly deferred

This document is not a record of earlier proposal states.
It is the current runtime cut line.

---

## 2. Product Thesis

The MVP is not a workspace suite and not a panel collection.

It is one loop rendered through two durable surfaces and one load-bearing seam:

1. a human enters `Room` because a live question matters
2. the machine helps structure the live field through `workingEcho`
3. the human enters `Dream` when source contact, rereading, listening, or document pressure-testing is needed
4. something from `Dream` can be intentionally carried back through `Bridge`
5. reality and receipts still decide what can travel with trust

If this loop is strong, the product is real.
If this loop is weak, adding more nouns only hides the problem.

---

## 3. Permanent Runtime Center

### 3.1 Room

`Room` is the live steering surface.

Its job is to hold:

- active thread identity
- the thread itself
- one composer
- one source-entry path
- a thin but real `workingEcho`
- visible field state
- the current reason the loop is still open

`Room` must not reduce to:

- generic chat
- messages plus input
- a dashboard of system nouns

If `Room` becomes only thread and composer, the MVP stops being recognizably Lœgos.

### 3.2 Dream

`Dream` is the source re-entry surface.

Its job is to hold:

- document access
- active document stage
- reading and listening
- `Compiler Read`
- intentional carry-forward into `Room`

`Dream` must not reduce to:

- storage
- library management furniture
- a separate analysis product

`Dream` is where source is re-entered under attention, and where that source can be prepared for live work.

### 3.3 Bridge

`Bridge` is not a third surface.
It is the load-bearing seam between `Dream` and `Room`.

Its job is to let something from `Dream` become live material in `Room` without losing:

- source identity
- anchor
- provenance
- continuity

In the MVP, `Bridge` exists so a user can intentionally carry:

- a `passage`
- a `note`
- a `witness`

into `Room` as source-backed material.

It must never silently:

- auto-send a turn
- create canon
- create a receipt
- promote `Compiler Read` into authority

### 3.4 Utility

Utility remains subordinate:

- account
- settings
- sign out
- low-frequency management actions

Utility is necessary.
It is not a third equal product surface.

---

## 4. What Must Be Excellent

The rebuild should optimize for excellence in four runtime experiences.

### 4.1 Room steering

Required qualities:

- immediate entry into live work
- clear active thread identity
- calm thread hierarchy
- one obvious composer
- one obvious source-entry path
- visible structural state without dashboard weight

### 4.2 Dream document contact

Required qualities:

- quiet document access
- dominant active document stage
- strong reread and listening feel
- easy resume and return
- no control-wall feel

### 4.3 Bridge continuity

Required qualities:

- clear `Send to Room` intent
- visible source identity on arrival
- preserved anchor and provenance
- no trust jump during handoff
- continuity between the active Dream document and the Room draft

### 4.4 Compiler Read honesty

Required qualities:

- read-only posture
- useful output even when nothing lawfully compiles
- lawful subset separated from unsupported material
- claim-by-claim inspectability
- no hidden write-back into `Room`, canon, or receipts

---

## 5. Canonical Runtime IA

### 5.1 Signed-in runtime

```text
Signed-in app
├── Room
│   ├── Active thread identity
│   ├── Thread
│   ├── workingEcho
│   ├── Field state
│   ├── Composer
│   └── Source entry
├── Dream
│   ├── Document access
│   ├── Active document stage
│   ├── Compiler Read
│   ├── Send to Room
│   └── Listening
├── Dream -> Room Bridge
│   └── Source-backed carry-forward
└── Utility
    ├── Account
    ├── Settings
    └── Sign out
```

Two permanent surfaces exist:

- `Room`
- `Dream`

`Bridge` is a permanent seam, not a permanent destination.

### 5.2 Entry forms for future capabilities

No future capability should become a permanent runtime destination unless it proves itself at the same level as `Room` or `Dream`.

Every new capability must first declare its entry form:

| Form | Meaning | Examples |
|---|---|---|
| `inline` | Belongs inside Room or Dream flow | source entry, Send to Room |
| `popup/card` | Contextual structural object with short life | preview, warning, deciding split |
| `sheet` | Temporary management or inspection surface | box picker, session picker, witness inspect |
| `utility route` | Necessary, low-frequency control surface | account |

This is the anti-dashboard rule.

---

## 6. Keep / Hide / Defer

### 6.1 Keep in the MVP center

- `Room`
- `Dream`
- `Bridge`
- thin but real `workingEcho`
- visible field state:
  - `open`
  - `contested`
  - `awaiting return`
- `Compiler Read`
- source-backed Dream -> Room carry-forward
- provenance and trust gradients
- existing compiler/runtime infrastructure where practical

### 6.2 Hide but preserve

These can remain real without remaining central:

- box selection
- session switching
- witness detail inspection
- operate inspection
- receipt detail inspection
- source-history browsing

They should live behind contextual actions, temporary sheets, or utility patterns.

### 6.3 Defer from the runtime center

These may matter later, but they should not define the current signed-in runtime:

- Recon as a runtime surface
- Drive Tape as a runtime surface
- Seven Terminal as a runtime surface
- Shape Library as a runtime surface
- boxes as a permanent destination
- sessions as a permanent region
- witness as a permanent section
- operate as a permanent section
- mirror as a permanent section
- receipt kit as a first-class area

---

## 7. Engineering Cut Line

### 7.1 In scope now

- rebuild the signed-in shell around `Room` and `Dream` only
- keep `Bridge` explicit as the Dream -> Room seam
- keep `workingEcho` and field state visible in `Room`
- keep `Compiler Read` read-only, provisional, and inspectable
- preserve backend compatibility where practical
- keep existing signed-in routes such as `/workspace`, `/dream`, and `/account`

### 7.2 Out of scope now

- full Recon productization
- Drive Tape runtime integration
- Seven Terminal runtime integration
- Shape Library as a top-level mode
- deep redesign of receipt workflows
- theory-heavy explanatory surfaces

### 7.3 Rule for ambiguous cases

If there is doubt about whether something deserves permanent runtime presence:

> do not wire it permanently

Use contextual, temporary, or utility forms until the behavior earns more weight.

---

## 8. Document Precedence

This document is an active runtime cut line, not the top of the authority stack.

It is subordinate to:

1. [projection-contact-loop-constitution-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/projection-contact-loop-constitution-2026-04-13.md)
2. [team-realignment-memo-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/team-realignment-memo-room-dream-mvp-2026-04-13.md)
3. [room-dream-foundation-design-proposal-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/room-dream-foundation-design-proposal-2026-04-13.md)
4. [compiler-engineer-response-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/compiler-engineer-response-room-dream-mvp-2026-04-13.md)

Its role is narrower:

- define what stays in the runtime center
- define what gets hidden
- define what gets deferred
- reinforce anti-dashboard discipline

It must not be used to override higher-level MVP or contract decisions.

---

## 9. Success Criteria

The runtime cut line is doing its job if:

- the doc can be read alone without implying `Dream` without `Bridge`
- the doc can be read alone without implying `Room` as generic chat plus optional structure
- `workingEcho` reads as load-bearing rather than decorative
- contributors can tell what stays central, what becomes contextual, and what is deferred
- the stack no longer routes contributors through stale assumptions

It fails if:

- `Room` still reads like messages plus input
- `Dream` still reads like storage plus listening
- `Bridge` still reads like optional plumbing
- future runtime nouns can still claim equal architectural weight by default

---

## 10. One-Line Seal

**Lœgos should rebuild around the smallest correct MVP runtime: Room for live steering, Dream for source re-entry, Bridge as the first-class seam, workingEcho as the live structural object, and Compiler Read as a read-only Dream action.**
