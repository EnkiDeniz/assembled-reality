# Compiler Engineer Handoff Memo: Room + Dream MVP

Date: April 13, 2026  
Audience: Compiler Engineer  
Status: Active handoff memo  
Purpose: Refocus compiler/structure work on the MVP center and request a concrete proposal + implementation plan in response.

Primary references:

- [team-realignment-memo-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/team-realignment-memo-room-dream-mvp-2026-04-13.md)
- [projection-contact-loop-constitution-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/projection-contact-loop-constitution-2026-04-13.md)
- [room-dream-foundation-design-proposal-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/room-dream-foundation-design-proposal-2026-04-13.md)
- [compiler-read-spec-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/compiler-read-spec-2026-04-13.md)
- [compiler-engineer-response-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/compiler-engineer-response-room-dream-mvp-2026-04-13.md)

Response delivered here:

- [compiler-engineer-response-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/compiler-engineer-response-room-dream-mvp-2026-04-13.md)

This memo remains the request and framing document.
Use the response doc for the answered MVP contract position.

---

## 1. Why You’re Getting This Memo

The product center has narrowed.

For the MVP, we are not trying to solve the whole future system.
We are building:

- `Room`
- `Dream`
- the handoff between them

That means your job is not broad platform invention right now.
Your job is to make the structural layer under this MVP honest, inspectable, and hard to fake.

The design team can reshape the surfaces.
You are protecting the part that makes those surfaces recognizably Lœgos.

---

## 2. What You Own In This Phase

You own the machine-side truth spine for the MVP.

That means:

1. `Compiler Read`
2. `Bridge`
3. `workingEcho` honesty
4. field-state / reason-for-open honesty
5. carry-forward / receipt trust rules as needed for MVP continuity

You do **not** need to own the broad front-end redesign.
You **do** need to make sure the redesign has real structural behavior underneath it.

---

## 3. Current MVP Rule

The MVP is not “chat plus documents.”

The MVP stays Lœgos only if:

- `Room` does not collapse into generic chat
- `Dream` does not collapse into file storage
- `Compiler Read` does not become shadow canon
- `Bridge` does not become hidden plumbing
- the machine remains honest about what is provisional, what is grounded, and what can carry forward

Your work is what keeps those failures from happening.

---

## 4. What We Need From You

Please come back with a **proposal and plan** for the compiler/structure layer of the MVP.

That response should cover five things.

### 4.1 Compiler Read contract

We need your view on the minimum trustworthy contract for `Compiler Read` in MVP.

Specifically:

- what fields are mandatory in extracted claims
- what provenance/support rules are non-negotiable
- what must be inspectable in the UI
- what counts as `not_run`, `translation_loss`, `compiler_gap`, or `out_of_scope`
- what should remain intentionally provisional

The key standard:

**Compiler Read must be honest and inspectable enough for provisional use.**

Not more sealed than that.

### 4.2 Bridge contract

We need the minimum structural contract for Dream -> Room handoff.

Specifically:

- what is the smallest `BridgePayload`
- what provenance must survive the handoff
- what anchor semantics are required
- what should appear in Room when something arrived from Dream
- what the bridge must never do silently

The key standard:

**Bridge is first-class seam, not incidental plumbing.**

### 4.3 Room structural contract

We need your view on the minimum load-bearing contract for `workingEcho` in MVP.

Specifically:

- what fields are essential
- what should stay out of MVP
- how `open / contested / awaiting return` should actually be determined
- how “reason the loop is still open” should be surfaced honestly
- how to prevent `workingEcho` from drifting into assistant summary

The key standard:

**Room is not just chat; it becomes Lœgos through the working echo.**

### 4.4 Receipt / carry-forward minimum

We do **not** need the whole receipts universe designed right now.
We **do** need your judgment on the minimum carry-forward law required for the MVP.

Specifically:

- what can travel from Dream into Room
- what can travel from a Room turn into later state
- what should remain quiet backend truth versus explicit UI
- what must never be upgraded in trust automatically

The key standard:

**receipts decide what can travel**

But for MVP, this should stay as small as possible.

### 4.5 Sequencing judgment

We need you to pressure-test the current sequencing.

Current team alignment is:

1. Room
2. Dream document stage + Compiler Read + Send to Room
3. Bridge hardening
4. Listening polish

If you think that order is wrong for the trust spine, say so directly.

---

## 5. Clarifications For Your Proposal

These are the current product-intent answers to the main contract questions that have already surfaced.

### 5.1 Bridge landing shape in Room

For MVP, `Send to Room` should land as a **source-backed composer draft in the active Room thread**.

That means:

- the handoff creates a draft state, not an auto-sent turn
- the draft visibly carries source identity and anchor
- the source remains inspectable as source-derived material
- the draft becomes a real Room turn only when the user sends it

If the user has no current active thread, the system may open or create a thread context for the draft.
It should still not auto-send.

### 5.2 Field state should be derived in MVP

For MVP, `open / contested / awaiting return` should be treated as a **derived `workingEcho` view**, not a canonical persisted room state.

Persist the underlying turns, returns, and source/bridge facts.
Derive the field-state label and reason-for-open from those.

Do not introduce a separately persisted authoritative field-state object unless a concrete runtime need appears.

### 5.3 `Compiler Read` should explicitly support `not_run`

Yes.

For MVP, `Compiler Read` should explicitly support a `not_run` outcome when no lawful subset is translated or no compiler execution actually occurred.

It must not surface empty translation as a clean compile.

### 5.4 Smallest allowed carry-forward set

For MVP, carry-forward should stay minimal:

- `passage`
- `note`
- `witness`

with provenance and anchor preserved.

A provisional structural read should **not** travel automatically as an authoritative object.
If a user wants to carry something structurally learned from Compiler Read into Room, that should happen through:

- a quoted passage
- a user-authored note
- or a source-backed witness object

not through silent promotion of the `Compiler Read` result itself.

### 5.5 Bridge contract timing

Yes:

**the minimal Bridge contract should be defined before `Send to Room` ships.**

Bridge hardening can happen after initial Room and Dream slices, but `Send to Room` should not ship before the minimum contract is clear.

---

## 6. What Not To Spend Time On

Please do **not** spend your main energy right now on:

- broad shell IA debates
- visual design decisions
- future Recon runtime architecture
- Drive Tape as a top-level product
- Seven Terminal
- Shape Library UI
- general-purpose theory expansion

Those may matter later.
They are not your main job in this slice.

---

## 7. Questions Your Response Should Answer

Please structure your response around these questions:

1. What is the minimum honest contract for `Compiler Read`?
2. What is the minimum honest contract for `Bridge`?
3. What is the minimum honest contract for `workingEcho` and field state?
4. What trust transitions are allowed in the MVP, and which ones are forbidden?
5. What implementation order do you recommend for the compiler/structure layer?
6. What risks do you see if design proceeds faster than these contracts solidify?

---

## 8. Preferred Output Shape

Please return with:

### A. Short proposal

One concise document that states:

- the MVP compiler/structure scope
- the minimum contracts
- the key non-goals
- the main risks

### B. Build plan

A concrete plan with:

- phases
- files/modules likely involved
- test lanes
- acceptance criteria

### C. Honesty checks

A short section naming:

- what could overclaim
- what could silently mutate trust
- what could make the machine look smarter than the structure really is

---

## 9. One-Line Working Seal

**Your job in this phase is to make Room, Dream, and the handoff structurally honest enough that the redesign can stay minimal without becoming fake.**
