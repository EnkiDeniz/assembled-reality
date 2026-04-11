# Progress Checkpoint: Phase-Two Room Closeout

Date: 2026-04-11
Branch: `codex/mobile-reader-overhaul`
Checkpoint commit: `bd67eed`
Purpose: Record what has actually landed since the compiler-first Room baseline, what remains unfinished, and what is now ready for backend-first proof work.

---

## 0. Relationship To Other Documents

This document does not replace the existing planning stack.

It sits beside:

1. [current-project-baseline-2026-04-10-f5c4645.md](/Users/denizsengun/Projects/AR/docs/current-project-baseline-2026-04-10-f5c4645.md)
   - what was true at the compiler-first reset baseline
2. [room-v2-master-build-spec.md](/Users/denizsengun/Projects/AR/docs/room-v2-master-build-spec.md)
   - what the Room should feel like
3. [future-state-system-architecture.md](/Users/denizsengun/Projects/AR/docs/future-state-system-architecture.md)
   - what the full system should become
4. [transition-map-current-to-future.md](/Users/denizsengun/Projects/AR/docs/transition-map-current-to-future.md)
   - what is allowed now, next, and later

This document answers a narrower question:

**what progress has actually been made through the Phase-Two closeout work, and what is still missing before we move into Later-stage advisory integration?**

---

## 1. High-Level Judgment

The project is still in the **Next** phase, but it is much closer to the exit edge of that phase than it was at the April 10 baseline.

The most important progress is not a new prompt or a new panel.

The most important progress is that the Room now has:

- a clearer preview lifecycle,
- a clearer witness lane,
- a clearer Operate adjacency story,
- a cleaner distinction between conversation continuity and canonical box truth,
- and an internal advisory seam for later Shape Library/BAT integration that does not yet contaminate the live Room path.

In short:

**the Room is now thinner, more explicit, and more governable than it was at baseline.**

---

## 2. What Has Landed Since The April 10 Baseline

### 2.1 Preview is now a first-class non-canonical object

The Room view contract now explicitly carries:

- `view.activePreview`
- `messages[].previewStatus`

This means preview lifecycle is no longer primarily inferred in the UI from mixed local heuristics.

Current preview states include:

- `active`
- `blocked`
- `superseded`
- `applied`
- `none`

Interpretation:

The Room is now much closer to the intended rule:

**preview should feel immediate, canon should remain earned.**

### 2.2 Proposal structure is visible inline

The Room no longer depends on a proposal inspector as the primary path for understanding what the Room is hearing.

Proposal structure is rendered inline in the conversation flow.
Formal clause detail can still remain secondary, but the user no longer has to hunt for the Room’s emerging read.

Interpretation:

This is the strongest experiential move toward the breathing-room mock without cheating on authority.

### 2.3 The canonical chip remains honest

The field/status chip still reflects canonical field truth only.

Preview activity does not rewrite:

- chip label
- chip tone
- canonical mirror truth

Interpretation:

The Room now does a better job of letting the conversation feel alive without letting the UI overstate what has actually been accepted.

### 2.4 Fresh-box and stale-session behavior is safer

Switching boxes now clears stale session identity instead of dragging an old conversation into a new box.

Server behavior also hardens against foreign session ids by falling back safely rather than exploding when a session does not belong to the selected box.

Interpretation:

The product now better preserves the core model:

**one box / many conversations / one canon**

without accidentally treating conversations as portable across boxes.

### 2.5 Witness is now a real adjacent lane inside `/workspace`

The workspace now honors witness focus through:

- `document` / `documentKey`
- focused witness resolution in the server view model
- a witness panel inside the Room’s adjacent/instrument layer

Mirror evidence links can now open witness context inside `/workspace` instead of effectively dead-ending in a redirect loop.

Interpretation:

Reader is no longer just a nominal deep link.
It is starting to function as a real witness-focus orbit around the Room.

### 2.6 Operate is now more clearly adjacent and box-level

Operate is now exposed as a lightweight adjacent advisory surface from the Room.

The Room can:

- open Operate,
- run or refresh Operate,
- ask Seven to audit an Operate read,

without implying that Operate is speaking inside the live Room path or mutating Room canon.

Interpretation:

This is a healthier relationship between Room and Operate:

**adjacent, useful, non-canonical, box-level**

instead of vague cross-talk.

### 2.7 Authority context is more explicit in the instrument layer

The backend already carried `authorityContext`; the Room now uses that more coherently in the instrument/adjacent layer.

That context now better reflects:

- Box
- Conversation
- canon source
- runtime state
- focused witness
- adjacent advisory state

Interpretation:

The system is becoming easier to inspect without forcing that explanation into the main conversation lane.

### 2.8 Seven is now more tightly compressed

The Room path now enforces a `7x7` guardrail:

- up to 7 sentences
- up to 7 words per sentence
- if Seven cannot compress honestly, it should ask one short question

Interpretation:

The Room voice is becoming more operator-like and less generically chatty.

### 2.9 Future advisory seams now exist without being live

There is now an internal seam for later advisory integration with three future outcome kinds:

- `insufficient_witness`
- `starter_prior`
- `personal_field`

This seam is:

- pure
- non-canonical
- adapter-shaped
- not imported by the live Room route

Interpretation:

The project is now better prepared for later Shape Library/BAT entry without violating the transition rule that the Room must get simpler before it gets smarter.

---

## 3. What Has Been Proven

### 3.1 Proven in unit/regression tests

The following have explicit automated coverage:

- preview lifecycle semantics
- non-canonical preview not altering canonical field truth
- session continuity without canon branching
- witness and Operate adjacency contracts
- 7x7 assistant compression
- advisory seam contract purity and non-import in the live Room route
- room-first routing and canonical pipeline anchors
- echo/ripple/compiler-gate regression anchors

Interpretation:

The backend and view-model side of the Room is now substantially more provable than before.

### 3.2 Proven in build/lint

The current Room closeout work builds successfully and passes targeted lint on touched files.

Interpretation:

The new contract and UI changes are integrated, not floating as speculative patches.

---

## 4. What Is Not Yet Fully Proven

### 4.1 Browser acceptance is authored but not yet green in this environment

A new Playwright closeout suite exists for:

- preview visible inline without inspector
- chip staying canonical-only
- apply changing canon
- session switching without canon fork
- witness focus opening inside the workspace
- Operate staying adjacent
- mobile one-lane behavior

However, during this checkpoint pass, local `next dev` reported itself ready but did not respond to HTTP requests in this environment, which prevented truthful completion of the browser suite.

Interpretation:

The browser proof harness is now present, but the suite should still be treated as:

**ready to run, not yet environment-verified here**

### 4.2 The Room is not yet ready for live starter-prior/BAT speech

Even though the advisory seam exists, the live Room route still correctly does not import it.

Interpretation:

This remains the right boundary.
The project is not ready to let another semantic authority speak in the Room yet.

---

## 5. Current Phase Assessment Against The Transition Map

### 5.1 Exit criteria that are now substantially satisfied

These Next-phase criteria are now much closer to satisfied:

1. preview is explicit and lifecycle-bound
2. preview vs canon is more legible in the main lane
3. canonical chip remains brutally honest
4. structure is visible inline without inspector-first behavior
5. witness and Operate are more clearly adjacent rather than mixed into Room truth
6. the Room path has less helper/UI inference than before

### 5.2 Exit criteria that still need practical proof

These still need real acceptance confidence:

1. browser/mobile proof of the clean conversation -> preview -> canon path
2. confirmation that the Room feels like one lane in practice, not just in contract
3. one fully reproducible backend-first Room-turn proof flow that the team can point to when discussing lawfulness

Interpretation:

The code is closer to the intended shape than the proof story is.

---

## 6. Holistic Current System Shape

As of this checkpoint, the project is best understood as:

### 6.1 What the Room now is

The Room is now:

- the default human surface into a Box
- session-aware
- preview-aware
- compiler/runtime-governed
- able to show witness and Operate as adjacent lanes
- more disciplined in voice and truth boundaries

### 6.2 What the Box now is

The Box remains:

- the canonical truth-bearing object
- the owner of hidden Room source
- the owner of compile/runtime truth
- the thing that multiple conversations orbit around

### 6.3 What Shape Library/BAT now are

Shape Library/BAT are still:

- real subsystems
- architecturally relevant
- appropriate for later advisory entry
- not yet licensed to speak in the live Room path

### 6.4 What the project most needs next

The project does not most need new intelligence.

It most needs:

1. one reproducible end-to-end Room turn proof harness
2. green browser/mobile acceptance for the current Room
3. explicit backend-first analysis of where preview, session, runtime, and canon diverge during a turn

---

## 7. Recommended Next Work After This Checkpoint

### 7.1 First

Stabilize and run the Room Playwright closeout suite in an environment where the dev server actually answers HTTP requests.

### 7.2 Second

Build a backend-first Room turn simulation harness that proves:

- input turn
- classifier decision
- prompt construction
- model output shaping
- preview object creation
- gate result
- thread persistence
- canonical non-mutation on turn
- canonical mutation on apply

### 7.3 Third

Turn that harness into a reusable test/story format so the team can reason about concrete Room journeys without needing live model calls for every discussion.

---

## 8. Current One-Sentence Progress Summary

The Room is no longer just a compiler-first architecture with a soft surface; it is becoming a compiler-first surface with explicit preview truth, adjacent witness/advisory lanes, and a safe seam for later intelligence that still does not get to speak before it earns the right.
