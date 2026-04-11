# Current Project Baseline (Compiler-First Room Sessions)

Date: 2026-04-10
Baseline commit: `f5c4645`
Branch at review: `codex/mobile-reader-overhaul`
Owner context: refreshed implementation baseline after team audit/fix pass

---

## Purpose

This document is the new implementation baseline for the project as of commit `f5c4645`.

It is intended to replace thread memory as the shared starting point for future work.

This document answers:

1. what is actually true in the code now,
2. what materially changed from the earlier April 9 baseline,
3. what remains adjacent or aspirational rather than live,
4. how to think about the project's current authority model.

This is not the Room choreography spec.
That role belongs to [room-v2-master-build-spec.md](./room-v2-master-build-spec.md).

This is the "what the system is now" document.

---

## Baseline Marker

- Commit reviewed: `f5c4645`
- Commit message: `reset workspace around compiler-first room sessions`

High-level change summary:

- one-time compiler-first workspace reset
- explicit Room session model
- Room routes and UI now bind to sessions
- canonical box truth remains compiler/runtime-backed

---

## System At A Glance

The repository currently has three major active layers:

1. **Room-first workspace runtime (Next.js app)** in `src/`
2. **Loegos compiler/runtime/gate stack** in `LoegosCLI/`
3. **Shape Library standalone engine** in `shapelibrary/`

The main user-facing runtime is now more explicitly centered on:

- `/workspace`
- one canonical box
- one hidden Room source per box
- many conversations per box

---

## What Materially Changed In This Baseline

Compared to the April 9 baseline, the most important change is not a new prompt or a new panel.

The most important change is that the workspace now explicitly models:

**one box, many conversations, one canon**

This baseline adds:

1. a one-time reset into a compiler-first workspace state,
2. a `ReaderRoomSession` persistence model,
3. explicit session creation / activation / archive flows,
4. Room prompt context that includes session handoff continuity,
5. a clearer separation between:
   - box-level canonical truth
   - session-level conversational continuity

---

## What Is Definitely Real Now

### 1. The old workspace state is intentionally non-authoritative

There is now a one-time reset path keyed by `ReaderProfile.compilerFirstWorkspaceResetAt`.

On first pass into the new model, the app deletes prior user workspace state including:

- room sessions
- receipt drafts
- attested overrides
- operate runs
- conversation threads
- evidence sets
- listening sessions
- projects
- source assets
- documents

This is implemented in:

- [room-sessions.js](/Users/denizsengun/Projects/AR/src/lib/room-sessions.js)
- [migration.sql](/Users/denizsengun/Projects/AR/prisma/migrations/20260410_add_room_sessions_and_compiler_reset/migration.sql)

Interpretation:

The team has explicitly declared the old workspace era superseded and has reset the product around a compiler-first Room baseline.

### 2. Room sessions are now first-class product objects

There is now a `ReaderRoomSession` model with:

- `sessionKey`
- `threadDocumentKey`
- `title`
- `handoffSummary`
- `isActive`
- `isArchived`

This is implemented in:

- [schema.prisma](/Users/denizsengun/Projects/AR/prisma/schema.prisma)
- [room-sessions.js](/Users/denizsengun/Projects/AR/src/lib/room-sessions.js)
- [room/sessions/route.js](/Users/denizsengun/Projects/AR/src/app/api/workspace/room/sessions/route.js)

Interpretation:

Conversation continuity is no longer an implicit hidden thread assumption.
It is now an explicit part of the product model.

### 3. A box can now host multiple conversations

The Room UI exposes:

- `New Conversation`
- conversation list
- activate conversation
- archive conversation
- handoff summaries

This is implemented in:

- [RoomWorkspace.jsx](/Users/denizsengun/Projects/AR/src/components/room/RoomWorkspace.jsx)

Interpretation:

The product is no longer modeling "the conversation" as singular.
It is modeling multiple conversation lanes around one box.

### 4. Sessions do not create separate canons

This is the most important current truth.

Sessions are separate conversation threads, but they all converge on the same box-level hidden Room document and canonical compile/runtime state.

Turns persist to the active session thread.
Apply still writes to the same box-level Room source.

This is implemented in:

- [room-server.js](/Users/denizsengun/Projects/AR/src/lib/room-server.js)
- [turn/route.js](/Users/denizsengun/Projects/AR/src/app/api/workspace/room/turn/route.js)
- [apply/route.js](/Users/denizsengun/Projects/AR/src/app/api/workspace/room/apply/route.js)

Interpretation:

**A new conversation is not a branch.**
It is a new conversational lane around the same canonical box reality.

### 5. Compiler/runtime authority still governs canonical Room truth

The prior lawfulness still holds:

- Seven proposes
- proposals are gated
- canonical source mutates only through apply
- canonical mirror/state come from compile/runtime-backed view building

Interpretation:

The introduction of sessions did not weaken the compiler/runtime truth boundary.

### 6. Session continuity now affects prompt context

The Room turn route now includes `view.session.handoffSummary` in the user prompt context.

Interpretation:

Sessions are not just UI storage.
They now shape what the model sees as the current conversational continuity.

### 7. The backend now emits a stronger authority object

`buildRoomWorkspaceViewForUser` now builds an `authorityContext` that includes:

- project
- session
- sources
- assembly
- artifact summary
- runtime state
- mirror snapshot
- diagnostics
- reset time

Interpretation:

The backend now has a more explicit truth summary for the Room, even if the frontend is not yet rendering that object directly as a user-facing explanation layer.

### 8. Shape Library remains separate from the live Room turn path

This baseline does **not** wire Shape Library analyze/BAT into the live Room turn/apply flow.

Shape Library still exists as:

- standalone service
- separate route family
- separate API bridge
- separate engine with starter library and BAT

But it is still not in the active `/workspace` Room path.

Interpretation:

Starter-library priors and BAT are implementation-ready in the Shape Library subsystem, but they are still adjacent to Room rather than live inside Room.

---

## Current Authority Model

The simplest accurate description of the project now is:

### Box

The Box is the canonical truth-bearing object.

It includes:

- sources
- hidden Room source
- compile/runtime-backed state
- receipts and returns
- box-level mirror truth

### Session

A Session is one conversational thread around a Box.

It includes:

- thread history
- handoff summary
- active/archive status
- conversation-specific continuity

A Session is not a canonical branch.

### Room

The Room is the primary human surface over:

- one box
- one active session
- one canonical field

### Canon

Canon remains box-level, not session-level.

### Shape Library

Shape Library remains:

- advisory
- separate
- non-mutating with respect to Room truth

---

## What The Product Is Now

The most accurate current product description is:

**A compiler-first box system with explicit Room conversations layered over one canonical box reality.**

More concretely:

1. user opens `/workspace`
2. app ensures compiler-first reset has happened
3. app resolves an active box
4. app ensures there is an active Room session for that box
5. app loads the active session thread
6. app compiles the hidden Room source for the box
7. app hydrates runtime window
8. app builds a canonical Room view
9. user talks inside one explicit conversation
10. preview/proposal stays session-bound
11. canonical mutation stays box-bound

That is the central truth of this baseline.

---

## Relationship Between Box, Room, Session, And Field

The current model is now best understood as:

- **Box** = canonical object
- **Room** = primary human surface
- **Session** = one conversation lane inside the Room around the Box
- **Field** = the current canonical condition inside the Box

This means:

- multiple sessions can exist,
- only one session is active at a time,
- all sessions ultimately act on the same canonical field,
- the field is not duplicated per session.

---

## What Is Still Adjacent, Not Yet Central

### Shape Library starter priors and BAT

These are real in the Shape Library subsystem:

- preloaded starter primitives
- analyze result with `mainGap`, `nextLawfulMove`, `receiptCondition`, `operatorRead`
- base-library-style first-read logic

But they are not yet live in the Room route.

### Operate as full engine doctrine

Operate still exists and is meaningful, but the strongest doctrinal version of Operate remains larger than what the currently shipped Room exposes in daily use.

### Authority context as explicit user-facing explanation

The backend now emits authority context, but the Room UI is not yet using it as a first-class explanatory surface.

---

## What Is Now Less True Than Before

The older mental model:

- one box
- one hidden thread
- one conversation implicitly equal to the Room

is no longer accurate.

The more correct model now is:

- one box
- many conversations
- one active conversation at a time
- one canon

This is the main conceptual update future work must respect.

---

## Tests Run Against This Baseline

The following targeted tests passed during this refresh:

- `tests/room-first-workspace.test.mjs`
- `tests/room-session-reset.test.mjs`
- `tests/echo-field-state.test.mjs`
- `tests/echo-ripple-signal.test.mjs`
- `LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs`

Interpretation:

The Room-first route, compiler/runtime lawfulness, echo field semantics, and new session/reset model are all at least test-encoded and currently green on the reviewed baseline.

---

## Key Documents To Use With This Baseline

For implementation truth:

1. [current-project-baseline-2026-04-10-f5c4645.md](/Users/denizsengun/Projects/AR/docs/current-project-baseline-2026-04-10-f5c4645.md)
2. [current-runtime-state-2026-04-09.md](/Users/denizsengun/Projects/AR/docs/current-runtime-state-2026-04-09.md)
3. [seven-room-loegos-authority-audit-2026-04-10.md](/Users/denizsengun/Projects/AR/docs/seven-room-loegos-authority-audit-2026-04-10.md)

For Room build direction:

1. [room-v2-master-build-spec.md](/Users/denizsengun/Projects/AR/docs/room-v2-master-build-spec.md)

For system law:

1. [compiler-artifact-contract-v0.md](/Users/denizsengun/Projects/AR/LoegosCLI/docs/compiler-artifact-contract-v0.md)
2. [seven-proposal-gate-contract-v0.md](/Users/denizsengun/Projects/AR/LoegosCLI/docs/seven-proposal-gate-contract-v0.md)
3. [echo-field-contract-v1.md](/Users/denizsengun/Projects/AR/LoegosCLI/docs/echo-field-contract-v1.md)

For Shape Library truth:

1. [ShapeLibrary_Standalone_System_Spec_v0.1.md](/Users/denizsengun/Projects/AR/shapelibrary/ShapeLibrary_Standalone_System_Spec_v0.1.md)
2. [Product_Law_Interface_Contract.md](/Users/denizsengun/Projects/AR/shapelibrary/docs/Product_Law_Interface_Contract.md)
3. [BAT_Spec_v0.1.md](/Users/denizsengun/Projects/AR/shapelibrary/docs/BAT_Spec_v0.1.md)

---

## Final Baseline Verdict

As of `f5c4645`, the project's most important truth is:

**the Room is now explicitly organized around compiler-first box truth plus session-based conversation continuity.**

The project is more coherent than before because it now distinguishes:

- box truth
- conversation continuity
- canonical mutation
- session management

What remains to be integrated is not the law.
It is the next layer of experiential and advisory intelligence on top of that law:

- starter priors,
- BAT first-read behavior,
- stronger inline preview choreography,
- clearer user-facing authority legibility.
