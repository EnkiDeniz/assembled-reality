# Room Truth-Path Journey Harness

Date: 2026-04-11
Status: Active proposal
Purpose: Build a backend-first, inspectable proof harness for the Room so the team can see exactly how a user turn travels through conversation, preview, compiler/gate, canonical source, runtime, and rebuilt view.

---

## 0. Why This Exists

The project now has a real lawful Room core:

- Room-first workspace
- one box, many conversations, one canon
- hidden Room source as canonical box truth
- preview and session continuity distinct from canon
- compiler/runtime-backed field truth
- Shape Library still outside the active Room authority path

What is still missing is one reusable proof harness that answers, with evidence:

1. what actually happens when a user sends a Room turn
2. when the turn stays conversational
3. when it becomes a preview
4. when the compiler/gate matters
5. when canonical source still has not changed
6. when canonical source does change
7. how session, preview, canon, and runtime differ during the life of the interaction

The goal is not only green tests.
The goal is inspectable truth-path proof.

---

## 1. Core Testing Thesis

Every Room journey should answer one question clearly:

**What changed: the conversation, the preview, the canon, the runtime, or only the appearance of understanding?**

That is the harness’s job.

---

## 2. What The Harness Must Prove

### 2.1 Conversation-only turns remain non-canonical

A vague or aspirational turn may shape the conversation without creating structure.

### 2.2 Proposal turns can preview lawful structure without mutating canon

A turn can become structurally interesting and still remain non-canonical until apply.

### 2.3 Apply is the only canonical mutation path

Canonical Room source must only change through lawful apply.

### 2.4 Runtime/receipts are the only path to return-backed field change

The field should become more real only when runtime-bearing returns are recorded.

### 2.5 Sessions affect continuity, not canonical branching

A new conversation changes thread context, not box truth.

These are the truths the current system claims. The harness must make them visible.

---

## 3. Harness Architecture

The harness should be layered. We should not test everything through HTTP alone.

### 3.1 Fixture Layer

Use journey fixtures, not personas.

Each fixture defines:

- initial box state
- initial session state
- one or more user turns
- deterministic model payloads
- expected stage transitions

Suggested location:

- [tests/fixtures/room-journeys](/Users/denizsengun/Projects/AR/tests/fixtures/room-journeys)

### 3.2 Service-Core Runner

Add a reusable runner that executes the real Room truth path without forcing all proof through route HTTP behavior.

The runner should:

1. seed a known box state
2. seed a known session state
3. classify the turn
4. build prompt/context
5. inject a synthetic model result
6. run guardrails
7. run proposal gate if applicable
8. persist turn/session results
9. rebuild the Room view
10. optionally invoke apply
11. optionally invoke receipt completion
12. capture before/after snapshots

Current implementation:

- [run-room-journey.mjs](/Users/denizsengun/Projects/AR/tests/helpers/run-room-journey.mjs)

### 3.3 Route-Level Confirmation

Keep route tests, but use them to confirm the service-core truth path is correctly exposed, not as the only place where truth is understood.

### 3.4 Browser Confirmation

Browser tests remain secondary. They should confirm that the frontend presents the backend truth model correctly, not define it.

---

## 4. Required Instrumentation

Each journey should emit a test-only trace packet so the run is inspectable, not just pass/fail visible.

### 4.1 Turn Stage Packet

Capture:

- fixture id
- box id
- session id
- requested turn
- classified turn mode/style
- prompt hash + prompt context summary
- optional full prompt text in debug mode
- raw model payload
- guarded turn
- gate result
- persisted thread result
- rebuilt view after turn
- flags:
  - preview present
  - source mutated
  - runtime mutated

### 4.2 Apply Stage Packet

Capture:

- action type
- proposal reload source
- gate result
- compile result
- source before/after hash
- runtime before/after mutation flags
- applied clauses
- rebuilt view after apply

### 4.3 Receipt / Runtime Stage Packet

Capture:

- receipt input
- provenance channel
- runtime before/after
- source before/after
- artifact before/after
- field state transition

### 4.4 Prompt Capture Rule

Store:

- prompt hash + context summary by default
- full prompt text only in debug artifact mode

That keeps the normal dossiers readable without giving up deep inspectability.

---

## 5. Inspectable Output Artifacts

Each fixture run should emit a dossier folder.

Current artifact root:

- [test-results/room-turn-journeys](/Users/denizsengun/Projects/AR/test-results/room-turn-journeys)

Example:

```text
test-results/room-turn-journeys/concrete_problem_emerges/
  00-fixture.json
  01-initial-room-source.loe
  02-initial-artifact.json
  03-initial-runtime.json
  04-user-turn.txt
  05-turn-stage-packet.json
  06-raw-model-payload.json
  07-guarded-turn.json
  08-gate-result.json
  09-thread-after-turn.json
  10-view-after-turn.json
  11-view-after-reload.json      # optional
  11-apply-stage-packet.json     # numbering shifts if no reload snapshot
  12-room-source-after-apply.loe
  13-artifact-after-apply.json
  14-runtime-after-apply.json
  15-view-after-apply.json
  16-source-diff.patch
  17-artifact-diff.md
  18-runtime-diff.md
  19-report.md
```

### 5.1 Human-Readable Report

Each dossier should include a concise report with:

- fixture summary
- user turn
- turn classification
- prompt context summary
- raw vs guarded model output
- gate decision
- what changed in thread/session
- what changed in canon
- what changed in runtime
- final verdict:
  - preview only
  - canonical mutation
  - runtime mutation
  - purely conversational

### 5.2 Terminal Summary

Each journey should also print a one-line summary, for example:

```text
room-turn-journeys concrete_problem_emerges mode=proposal preview=yes gate=yes sourceMutated(turn)=no sourceMutated(apply)=no runtimeMutated(apply)=no diagnostics=0
```

That gives quick scan confidence without replacing the dossier.

---

## 6. First Journey Set

Start with a small, disciplined set.

### Journey 1: `empty_box_aspiration`

Input:

> "I want to develop an app."

Expected:

- turn mode = conversation
- one narrowing question
- no proposal preview
- no active preview
- no canonical mutation
- no runtime mutation

Purpose:

Proves aspiration alone does not generate fake structure.

### Journey 2: `concrete_problem_emerges`

Input:

> "We observed beta users fail after permissions."

Synthetic model result:

- short assistant text
- proposal segments with one aim contour and one lawful ping/test

Expected:

- turn mode = proposal
- preview created
- gate accepted
- persisted thread contains preview payload
- canonical source unchanged before apply
- canonical mirror unchanged before apply

Purpose:

Proves lawful preview can emerge without pretending the box already changed.

### Journey 3: `invalid_ping_rejected`

Synthetic proposal:

- `MOV` without `TST`

Expected:

- proposal exists
- gate rejects / blocks
- diagnostics present
- canonical source unchanged
- no canonical mirror inflation

Purpose:

Directly proves the ping law.

### Journey 4: `preview_then_apply`

Starting state:

- Journey 2 completed

Action:

- apply preview

Expected:

- hidden Room source changes
- compiler artifact changes
- canonical mirror changes
- preview clears or becomes applied
- runtime may receive `proposal_applied` event if modeled that way

Purpose:

Proves the exact point where canon changes.

### Journey 5: `report_return`

Starting state:

- box with lawful ping already in canon

Action:

- complete receipt kit / report return

Expected:

- receipt-related gate runs
- runtime changes
- return event exists
- canonical source includes lawful return structure where appropriate
- field state shifts lawfully

Purpose:

Proves how runtime truth enters after contact.

### Journey 6: `same_box_new_conversation`

Starting state:

- box already has canon
- second session created

Input:

> "What is the current aim?"

Expected:

- different thread
- different session continuity
- same canonical source at start
- no implicit branch

Purpose:

Proves the one-box / many-conversations / one-canon model.

### Journey 7: `preview_reload_without_apply`

Starting state:

- proposal preview exists but is unapplied

Action:

- rebuild / reload Room

Expected:

- preview survives as preview/session truth
- hidden Room source unchanged
- canonical artifact unchanged
- no direct preview-to-canon leak

Purpose:

Catches the exact mock shortcut.

### Journey 8: `shape_library_not_in_room_path`

Starting state:

- Shape Library unavailable or mocked out

Action:

- run ordinary Room journey

Expected:

- Room path still works
- no Shape Library authority in turn/apply flow

Purpose:

Protects the current baseline and audit truth.

---

## 7. Additional Boundary Journeys To Add Soon After

These are the next good boundary checks once the first set is stable.

### 7.1 `handoff_affects_prompt_not_canon`

Prove that `handoffSummary` changes prompt context and maybe preview wording, but does not itself change box truth.

### 7.2 `contradicting_return_blocks_seal`

Start from a box that might otherwise seal, then introduce contradiction and prove closure law holds.

### 7.3 Route-level truth-path confirmation

Confirm that the HTTP Room routes expose the same service-core truth path cleanly, without smuggling in extra authority.

### 7.4 Browser truth-path confirmation

Confirm that the frontend presents the same distinction between conversation, preview, canon, and runtime without blur.

---

## 8. Assertions Per Truth Layer

Each journey should assert all relevant layers.

### 8.1 Session Truth

- active session id
- thread document key
- thread messages
- handoff summary before/after
- session-local continuity

### 8.2 Preview Truth

- preview exists or not
- preview payload contents
- preview status:
  - active
  - blocked
  - superseded
  - applied

### 8.3 Canonical Truth

- hidden Room source before/after
- clause count before/after
- canonical artifact before/after
- canonical mirror before/after
- field state before/after

### 8.4 Runtime Truth

- runtime window before/after
- events before/after
- receipts before/after
- return-bearing changes

### 8.5 Lawfulness

- turn mode classification
- guardrail effects
- semantic audit / gate result
- compiler diagnostics

### 8.6 Divergence Assertions

Explicitly assert where truths diverge:

- preview exists while canon unchanged
- session changed while canon unchanged
- runtime changed while conversation alone does not prove it
- canonical view derives from source/runtime, not preview alone

---

## 9. What This Proposal Explicitly Does Not Do

This proposal does not recommend:

- live OpenAI calls as the primary proof path
- persona-led tests before state-led journeys exist
- collapsing turn, preview, and apply into one step
- treating browser tests as the primary truth model
- pulling Shape Library or BAT into the active Room path just to make tests richer

The point is not to simulate the future.
The point is to prove the current Room truth path.

---

## 10. Acceptance Criteria

This harness is successful when:

1. each journey emits an inspectable dossier
2. preview and canon are visibly distinguishable
3. session and box truth are visibly distinguishable
4. apply is provably the only canonical mutation path
5. runtime mutation is provably tied to returns/receipts
6. invalid structure is blocked before canon changes
7. Shape Library absence does not break Room path
8. a human can inspect one journey folder and answer:
   - what the system heard
   - what it previewed
   - what it refused
   - what it wrote into canon
   - what runtime changed
   - whether the final Room view came from law or from presentation

The strongest success condition is:

**someone can read one journey dossier from first turn to apply and understand the Room truth model without needing a meeting.**

---

## 11. Current Implementation Status

The first cut of this harness now exists in code:

- journey fixtures:
  - [core-journeys.mjs](/Users/denizsengun/Projects/AR/tests/fixtures/room-journeys/core-journeys.mjs)
- service-core runner:
  - [run-room-journey.mjs](/Users/denizsengun/Projects/AR/tests/helpers/run-room-journey.mjs)
- journey suite:
  - [room-turn-journeys.test.mjs](/Users/denizsengun/Projects/AR/tests/room-turn-journeys.test.mjs)
- route-level runner:
  - [run-room-route-journey.mjs](/Users/denizsengun/Projects/AR/tests/helpers/run-room-route-journey.mjs)
- route-level suite:
  - [room-route-journeys.test.mjs](/Users/denizsengun/Projects/AR/tests/room-route-journeys.test.mjs)
- plain route handlers for importable route proof:
  - [room-turn-route-handler.js](/Users/denizsengun/Projects/AR/src/lib/room-turn-route-handler.js)
  - [room-apply-route-handler.js](/Users/denizsengun/Projects/AR/src/lib/room-apply-route-handler.js)

Current covered journeys:

- `empty_box_aspiration`
- `concrete_problem_emerges`
- `invalid_ping_rejected`
- `preview_then_apply`
- `report_return`
- `same_box_new_conversation`
- `handoff_affects_prompt_not_canon`
- `contradicting_return_blocks_seal`
- `preview_reload_without_apply`
- `proposal_superseded_by_later_turn`
- `authority_context_consistency`
- `shape_library_not_in_room_path`
- route-level malformed payload fallback
- route-level conversation-mode segment stripping
- route-level blocked apply
- route-level receipt-kit completion
- route-level concurrent-session stale preview rejection

The next meaningful additions are:

1. browser confirmation that the frontend presents the backend truth model without blur
2. stronger multi-turn sequences that mix supersession, apply, and later return
3. route-level contradiction mediation / closure journeys after return
4. turning the focused suite into an always-on CI law gate if it is not one already

---

## 12. Final Recommendation

This is the right testing direction for the current phase of the project.

The Room should be proven through journey fixtures that trace where truth lives and when it changes.

The critical additions are:

1. inspectable dossiers as a first-class deliverable
2. negative boundary journeys that prove the mock shortcut is gone
3. a layered harness:
   - fixture layer
   - service-core runner
   - route-level confirmation
   - browser confirmation second

That is the version to build on.
