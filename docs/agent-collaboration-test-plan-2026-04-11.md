# Agent Collaboration Test Plan

Date: 2026-04-11
Status: Proposed
Purpose: Prove whether the current Room + Lœgos stack can support collaboration between intelligences, not only between a human and Seven, while keeping caller intent, responder output, canonical truth, and runtime truth visibly separate.

---

## 0. Why This Plan Exists

The current Room truth-path harness already proves a lot:

- one box, many conversations, one canon
- preview and canon are distinct
- apply is the canonical mutation boundary
- runtime truth strengthens through lawful return paths
- contradiction can block seal
- stale preview apply can now be blocked

That is already more like a collaboration protocol than a chat app.

The next question is:

**Can this same lawful core support intelligence-to-intelligence collaboration?**

This means:

- one AI using the system as a caller,
- another AI or model answering inside the system,
- both operating around one shared box,
- with Lœgos governing what becomes preview, canon, runtime, or closure.

The point of this plan is not to prove that agents are “smart.”
The point is to prove that the system can coordinate intelligences without collapsing:

- caller intent,
- responder output,
- lawful mutation,
- and world return

into one blurry loop.

---

## 1. Core Thesis

The system should be testable as a lawful collaboration layer between intelligences if and only if the tests can answer:

**Which intelligence acted, which intelligence answered, what the law accepted, what remained only advisory, and what changed in shared box truth?**

If the tests cannot answer that clearly, the collaboration claim is premature.

---

## 2. The Most Important Rule: Separate The Intelligences

This plan depends on one hard rule:

**The intelligence using the system and the intelligence answering inside the system must be modeled as separate actors in the harness.**

If they are not separated, we will hallucinate proof.

### 2.1 Required distinction

Every test must model at least these roles:

1. **Caller agent**
   - the agent that sends a turn, applies a preview, completes a receipt, or opens another conversation
   - this actor is analogous to a user of the API

2. **Room responder**
   - the model output consumed by the Room turn route
   - this actor is analogous to Seven’s answering layer

3. **Law kernel**
   - compiler, gate, canonical source, runtime window
   - not an intelligence, but the authority that judges both

Optional fourth role:

4. **Reality / external return**
   - a receipt, witness, or contradiction arriving from outside both agents

### 2.2 What must never happen in the tests

The harness must not:

- use one live model to improvise both caller and responder behavior in the same proof run
- let assertions depend on “this answer sounds reasonable”
- let the caller agent directly mutate canonical state without going through the same public action path as everyone else
- let the responder output be treated as truth just because the caller also authored the scenario
- silently upgrade synthetic agent claims into witness truth

### 2.3 Testing discipline

To prevent self-fulfilling proof:

- caller actions are fixture-defined
- responder outputs are deterministic stub payloads
- assertions target state transitions, gate results, and persisted artifacts
- full prompts may be captured for inspectability, but natural-language elegance is not a pass condition
- no live OpenAI calls in proof tests

This is the single most important anti-hallucination guardrail in the whole plan.

---

## 3. What We Are Actually Testing

We are not testing “can two AIs chat.”

We are testing whether Lœgos can govern collaboration between intelligences by keeping these truths separate:

- caller intent
- conversational continuity
- proposal preview
- canonical box truth
- runtime return truth
- closure law

That is a much stronger and more interesting question.

---

## 4. Current Read Of The System

Right now, the current codebase already supports a surprising amount of this:

- sessions act as conversation lanes
- the box holds canon across sessions
- previews can exist in one session without instantly becoming canon
- route actions are typed:
  - turn
  - apply proposal preview
  - complete receipt kit
- stale proposal re-apply can now be blocked

What is **not** present yet is a proper machine-native protocol layer.

The Room is still human-oriented in several ways:

- Seven’s `7x7` voice
- human-facing assistant text
- human-facing session/handoff language
- no explicit actor identity model for API callers
- no revision token or agent provenance contract

So this test plan should be framed correctly:

**We are testing whether the current lawful kernel is already strong enough to support agent collaboration, not claiming that the machine-native API is already complete.**

---

## 5. Test Goals

The agent-collaboration suite should prove five things.

### 5.1 A caller agent can use the system without becoming the system

The calling agent should be able to:

- send turns
- request structure
- apply lawful preview
- record return

without bypassing the canonical truth boundary.

### 5.2 The responder model remains only a proposer

The answering model may:

- reply
- propose structure
- attach receipt-kit guidance

but may not become canonical truth without apply.

### 5.3 Multiple agents can orbit one box without forking truth accidentally

Different agents may:

- open different sessions
- review different previews
- hand off context

but the box remains one canon unless explicit branching is introduced later.

### 5.4 Runtime truth still outranks agent confidence

A confident agent cannot close the box if:

- return contradicts it
- seal is unlawful
- the proposal is stale
- the proposal adds nothing new

### 5.5 Lœgos remains the governing kernel across human and non-human collaboration

The same lawful boundaries should hold whether the caller is:

- a person,
- a single agent,
- or multiple agents coordinating around the same box.

---

## 6. Harness Design

The agent-collaboration harness should extend the existing Room truth-path harness instead of inventing a new system.

### 6.1 Reuse existing layers

Build on:

- [tests/helpers/run-room-journey.mjs](/Users/denizsengun/Projects/AR/tests/helpers/run-room-journey.mjs)
- [tests/helpers/run-room-route-journey.mjs](/Users/denizsengun/Projects/AR/tests/helpers/run-room-route-journey.mjs)
- [tests/fixtures/room-journeys/core-journeys.mjs](/Users/denizsengun/Projects/AR/tests/fixtures/room-journeys/core-journeys.mjs)

### 6.2 Add explicit actor roles to fixtures

Each agent-collaboration fixture should define:

- initial box state
- session state(s)
- actor registry
- action sequence
- responder payload sequence
- expected truth transitions

Suggested actor shape:

```json
{
  "id": "agent_planner",
  "kind": "agent",
  "label": "Planner Agent",
  "capabilities": ["turn", "apply"],
  "sessionId": "session_planner"
}
```

Suggested responder shape:

```json
{
  "id": "seven_stub",
  "kind": "room_responder",
  "provider": "stubbed",
  "mode": "deterministic_payload"
}
```

### 6.3 Action model

Each action should be explicit:

- `turn`
- `apply_proposal_preview`
- `complete_receipt_kit`
- `reload_view`
- `switch_session`
- `open_new_session`

Suggested action shape:

```json
{
  "actorId": "agent_planner",
  "type": "turn",
  "message": "Beta users abandon onboarding after permissions.",
  "sessionId": "session_planner",
  "expectedResponderId": "seven_stub"
}
```

### 6.4 Response model

Responder outputs should be predeclared deterministic payloads.

Never let the same proof run generate both:

- caller action text
- and responder payload text

unless they are generated offline and frozen into fixtures beforehand.

---

## 7. Required Anti-Hallucination Invariants

These invariants must be encoded directly into the tests.

### 7.1 Caller / responder separation invariant

The fixture must identify:

- who sent the action
- who produced the response payload

and the test must assert they are not the same role.

### 7.2 Canon mutation invariant

Only `apply_proposal_preview` or `complete_receipt_kit` may mutate canonical source.

### 7.3 Preview non-authority invariant

A responder payload may produce preview, but preview alone may not:

- change canonical mirror
- change canonical chip
- change hidden Room source

### 7.4 Runtime truth invariant

Runtime truth must change only through lawful receipt / return handling, not through agent certainty or conversational repetition.

### 7.5 Cross-session stale-action invariant

If one agent applies a preview and another agent later tries to apply a stale equivalent preview:

- the second apply must block or no-op safely
- canon must not duplicate clauses

### 7.6 Shape Library isolation invariant

Unless a future machine-native advisory path is explicitly under test, Shape Library and BAT must remain outside the live collaboration path.

---

## 8. Test Layers

The suite should stay layered.

### 8.1 Service-core proof

Use the service-core harness to prove collaboration semantics at the law level.

Best for:

- actor separation
- preview/canon distinction
- runtime return semantics
- stale preview blocking
- contradiction / closure law

### 8.2 Route-level proof

Use the route harness to prove the public Room actions expose the same lawful collaboration story.

Best for:

- typed actions
- persisted session differences
- receipt completion through live route handlers
- malformed/mis-scoped payload hardening

### 8.3 Browser proof later

Browser testing comes later and should verify that the UI surfaces the same distinctions.

It should not define the collaboration law.

---

## 9. First Agent-Collaboration Journey Set

Start with a disciplined set, not a giant matrix.

### Journey 1 — single_agent_aspiration_stays_conversational

Caller:
- one planning agent

Input:
- “I want to build an app.”

Expected:
- turn stays conversational
- responder asks one narrowing question
- no preview
- no canon mutation
- no runtime mutation

Purpose:
- prove an agent cannot conjure structure from aspiration alone

### Journey 2 — single_agent_concrete_problem_yields_preview

Caller:
- one planning agent

Input:
- “Beta users abandon onboarding after permissions.”

Expected:
- lawful preview emerges
- preview is session truth only
- canon unchanged before apply
- field/chip unchanged before apply

Purpose:
- prove agent use of the system does not collapse preview into truth

### Journey 3 — agent_apply_changes_canon_once

Caller:
- same planning agent

Action:
- apply the active preview

Expected:
- canon changes once
- active preview clears or becomes applied
- runtime may get proposal-applied event
- mirror changes only after apply

Purpose:
- prove apply remains the boundary in agent use

### Journey 4 — reviewer_agent_second_session_same_box

Callers:
- planning agent
- reviewer agent

Sequence:
1. planner agent creates preview in session A
2. reviewer agent opens session B on the same box
3. reviewer agent asks for current box state

Expected:
- session continuity differs
- box canon is shared
- no implicit branch
- reviewer can see canon but not magically inherit planner preview as canon

Purpose:
- prove multi-agent orbit around one box canon

### Journey 5 — stale_agent_preview_rejected

Callers:
- planner agent
- reviewer agent

Sequence:
1. planner gets preview in session A
2. reviewer gets equivalent preview in session B
3. reviewer applies it
4. planner later attempts stale apply

Expected:
- first apply succeeds
- stale second apply is rejected or no-ops safely
- canon contains no duplicated clauses

Purpose:
- prove multi-agent stale protection

### Journey 6 — skeptical_agent_blocks_premature_seal

Callers:
- planner agent
- skeptical agent

Sequence:
1. box contains contradiction-bearing return
2. skeptical agent requests seal

Expected:
- proposal is blocked
- contradiction diagnostic is present
- no preview-to-canon leak

Purpose:
- prove closure law survives adversarial or overconfident agent behavior

### Journey 7 — agent_reports_return_through_receipt_path

Caller:
- observer agent

Action:
- completes receipt kit with concrete observed return

Expected:
- route-level receipt completion succeeds
- runtime receipts change
- recent returns change
- canonical source changes only if the lawful receipt completion path says so

Purpose:
- prove an agent can contribute reality-bearing return without bypassing law

### Journey 8 — malformed_agent_payload_fails_closed

Caller:
- any agent

Input:
- malformed or contradictory route payload

Expected:
- safe fallback or safe rejection
- no canon mutation
- no fake preview

Purpose:
- prove agent integration does not require trust in caller formatting

---

## 10. Second-Wave Journeys

After the first cut, add these.

### 10.1 agent_handoff_changes_prompt_not_canon

Prove one agent’s handoff summary changes prompt context for a later agent without changing canon by itself.

### 10.2 two_agents_disagree_then_return_resolves

Two agents propose different readings; runtime return resolves which one survives lawfully.

### 10.3 agent_attempts_direct_closure_without_return

Prove that repeated agent insistence cannot substitute for return.

### 10.4 single_agent_self_collaboration_over_time

One agent revisits the same box across sessions and must still obey stale preview, apply, and receipt truth boundaries.

### 10.5 shape_library_absent_agent_path_still_works

Explicitly prove that agent collaboration on the current Room path does not depend on live Shape Library participation.

---

## 11. Assertions Per Truth Layer

Every agent-collaboration journey should assert these layers separately.

### 11.1 Actor layer

- which actor initiated each action
- which responder payload was used
- whether actor and responder were distinct

### 11.2 Session layer

- active session id
- thread continuity
- session-local messages
- handoff summary before/after

### 11.3 Preview layer

- preview existence
- preview status
- proposal id
- whether preview is active, blocked, superseded, or applied

### 11.4 Canonical layer

- hidden Room source before/after
- artifact before/after
- canonical mirror before/after
- field state before/after

### 11.5 Runtime layer

- runtime window before/after
- events before/after
- receipts before/after
- return-bearing change before/after

### 11.6 Lawfulness layer

- turn classification
- guardrail effects
- gate result
- diagnostics

### 11.7 Divergence assertions

Explicitly assert cases like:

- preview exists while canon unchanged
- one agent’s session changes while box canon does not
- runtime changes after receipt while prior preview text stays the same
- stale agent action fails even when the earlier preview looked valid

---

## 12. Inspectable Artifacts

The collaboration harness should emit dossiers just like the Room truth-path harness does.

Suggested root:

- `test-results/room-agent-collaboration`

Each dossier should include:

- fixture definition
- actor registry
- action sequence
- request/response packets
- prompt context summary
- raw responder payloads
- guarded outputs
- gate results
- session snapshots
- source/artifact/runtime diffs
- human-readable report

Each report should answer:

1. which agent acted
2. which responder answered
3. what remained only preview
4. what entered canon
5. what changed only in runtime
6. whether the law blocked anything

If the report cannot answer those clearly, the test is not good enough yet.

---

## 13. Machine-Native API Readiness Questions

This test plan should also help answer whether the project is ready for an agent-facing API.

The current tests should reveal gaps such as:

- missing actor identity in route payloads
- missing caller provenance
- no revision token / optimistic concurrency token
- human-oriented response copy where machine-native state should be primary
- missing no-op / idempotency semantics

These are not failures of Lœgos.
They are the difference between:

- a strong lawful kernel
- and a finished agent protocol

The tests should surface those gaps explicitly.

---

## 14. What This Plan Does Not Claim

This plan does not claim:

- that multi-agent API support already exists
- that Seven’s human-facing voice is already ideal for machine collaboration
- that Shape Library/BAT should enter the live Room path now
- that a browser UI is the right primary proof surface for agent collaboration

It claims only this:

**the current lawful Room kernel is strong enough to be tested as collaboration infrastructure between intelligences.**

---

## 15. Acceptance Criteria

This plan is successful when we can point to a collaboration dossier and a teammate can answer, without a meeting:

1. which intelligence initiated the action
2. which intelligence answered
3. what the law accepted
4. what stayed preview only
5. what changed in canon
6. what changed in runtime
7. whether another agent could safely disagree, review, or reopen the same box

The strongest acceptance condition is:

**a reviewer can inspect one agent-collaboration journey and see that Lœgos is governing collaboration, not just decorating it.**

---

## 16. Final Recommendation

This should be the next major backend-first proof wave before browser work.

Why:

- it tests the most strategically important extension of the system
- it uses the lawful core we already have
- it reveals what is missing for a future API without pretending that API already exists
- it keeps us honest about the distinction between:
  - a caller intelligence,
  - a responder intelligence,
  - and canonical box truth

If these tests go well, we will know something important:

**Lœgos is not only a human-facing Room language. It can already function as a collaboration law between intelligences.**
