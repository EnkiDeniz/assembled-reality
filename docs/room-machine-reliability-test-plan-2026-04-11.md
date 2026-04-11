# Room Machine Reliability Test Plan

Date: 2026-04-11
Status: Proposed after repo audit and local verification
Audience: founders, engineers, operators, and anyone deciding whether this machine is trustworthy enough to drive hard

---

## 1. Why This Plan Exists

If this system is the machine, then the test job is not to admire it.
The test job is to find out:

1. what it does correctly under load and ambiguity
2. what it refuses correctly
3. what it corrupts when stressed
4. whether it preserves truth boundaries better than ordinary chat
5. whether a real AI caller can use it without turning it into a hallucination amplifier

This plan is written from a championship mindset:

- if a law boundary can fail, assume it will fail under pressure
- if a state transition is important, prove it with artifacts
- if a live-model test is flaky, separate infrastructure failure from machine failure
- if a suite does not tell us what changed, it is not yet a serious suite

The machine we are testing is not just the UI.
It is the whole Room truth path:

`conversation -> preview -> apply -> canon -> runtime -> receipt -> closure`

---

## 2. Current Test Audit

## 2.1 Existing test layers in the repo

The repository already has a better testing spine than most products at this stage.

### A. Semantic / kernel tests

- `tests/room-turn-policy.test.mjs`
- `tests/echo-field-state.test.mjs`
- `tests/echo-ripple-signal.test.mjs`
- `LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs`

These test:

- turn classification
- seven-by-seven guardrails
- semantic rejection rules
- ping law
- compiler/gate mapping
- echo field behavior

### B. Service-core Room journey tests

- `tests/room-turn-journeys.test.mjs`

These test the actual law path without depending on browser behavior:

- conversation-only turns
- preview without canon mutation
- apply as the only canonical mutation boundary
- return entering through lawful apply
- contradiction blocking closure
- session continuity without canon forking
- preview supersession

### C. Route-level Room journey tests

- `tests/room-route-journeys.test.mjs`

These confirm that the HTTP surface preserves the same truth boundaries as the service-core harness:

- turn route preview behavior
- malformed model fallback
- blocked apply
- receipt completion through route
- concurrent session preview/apply behavior

### D. Room state / architecture tests

- `tests/room-first-workspace.test.mjs`
- `tests/room-preview-state.test.mjs`
- `tests/room-advisory-seam.test.mjs`
- `tests/room-adjacent-lanes.test.mjs`
- `tests/room-session-reset.test.mjs`

These test:

- room-first entry wiring
- hidden Room canonical source usage
- preview state semantics
- adjacent non-canonical lanes
- reset/session model
- advisory seam separation

### E. AI-caller collaboration tests

- `tests/room-agent-collaboration.test.mjs`
- `tests/room-agent-collaboration-routes.test.mjs`
- `tests/helpers/ai-user-generator.mjs`
- `tests/helpers/run-room-ai-journey.mjs`

These are designed to test the machine as a collaboration layer with:

- a separate AI caller
- a separate Room responder
- leak detection and boundary checks
- route and service-core paths

### F. Competitive benchmark

- `tests/room-comparison-benchmark.test.mjs`
- `tests/helpers/run-room-comparison-benchmark.mjs`
- `docs/loegos-vs-chat-comparison-benchmark-2026-04-11.md`

This benchmark compares:

- `loegos`
- `schema_only`
- `plain_chat`

on one end-to-end journey involving aspiration, plan, return, contradiction, seal attempt, and fresh-session handoff.

### G. Browser / operator tests

- `tests/e2e/phase1-inline-operate.spec.mjs`
- `tests/e2e/phase2-workspace-shell.spec.mjs`
- `tests/e2e/room-phase2-closeout.spec.mjs`

These cover:

- inline Operate + attest + receipt + seal acknowledgement
- mocked shell flows
- room/phase2 UI behaviors

### H. Legacy / supporting UI tests

- `tests/founder-workbench-m4.test.mjs`
- `tests/reality-assembly-preview.test.mjs`
- `tests/project-attachment-safety.test.mjs`
- `tests/landing-echo-instrument.test.mjs`
- `tests/landing-design-system-ownership.test.mjs`
- `tests/phase2-shell-design-system-ownership.test.mjs`

These are useful but not the main reliability spine for the Room machine.

---

## 2.2 Test reports and artifacts already present

The repo already preserves inspectable testing artifacts, which is a major strength.

Important reports:

- `docs/room-truth-path-test-report-2026-04-11.md`
- `docs/ai-room-collaboration-test-run-2026-04-11.md`
- `docs/agent-collaboration-test-plan-2026-04-11.md`
- `docs/room-backend-first-testing-proposal-2026-04-11.md`
- `docs/loegos-vs-chat-comparison-benchmark-2026-04-11.md`

Artifact roots:

- `test-results/room-turn-journeys`
- `test-results/room-route-journeys`
- `test-results/room-agent-collaboration`
- `test-results/room-comparison-benchmark`

That means the project is not only asserting pass/fail.
It is already moving toward dossier-style proof, which is exactly the right direction.

---

## 2.3 What I ran during this audit

### Local run 1: focused deterministic Room truth path

Command:

```bash
node --test tests/room-route-journeys.test.mjs tests/room-turn-journeys.test.mjs tests/room-first-workspace.test.mjs tests/room-preview-state.test.mjs tests/room-advisory-seam.test.mjs tests/room-adjacent-lanes.test.mjs tests/room-session-reset.test.mjs tests/room-turn-policy.test.mjs tests/echo-field-state.test.mjs tests/echo-ripple-signal.test.mjs LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs
```

Observed result on 2026-04-11:

- `50 passed`
- `0 failed`

### Local run 2: comparison benchmark

Command:

```bash
node --test tests/room-comparison-benchmark.test.mjs
```

Observed result on 2026-04-11:

- `1 passed`
- `0 failed`

### Live AI-caller attempt

Command:

```bash
ROOM_AI_COLLAB_ENABLED=1 node --test tests/room-agent-collaboration.test.mjs tests/room-agent-collaboration-routes.test.mjs
```

Observed result on 2026-04-11:

- suite reached the model call
- suite did not prove Room behavior
- all tests failed before Room evaluation because the AI caller generator returned an upstream quota error

Important conclusion:

This is not evidence that the Room machine failed.
It is evidence that the live AI-caller harness is currently coupled to external model availability and billing state.

That distinction matters.

---

## 3. What The Machine Has Already Earned

The current deterministic stack has already earned real trust in these areas.

## 3.1 Proven today

### A. Preview and canon are separate

The system already proves:

- a turn can create a preview
- preview can be visible and active
- canon does not change until apply

This is one of the most important product claims, and it is already mechanically tested.

### B. Apply is the canonical mutation boundary

The system already proves:

- turn route does not mutate canon directly
- apply route is the intended mutation path
- blocked apply leaves canon unchanged

### C. Runtime truth only strengthens through lawful return paths

The system already proves:

- return-bearing state changes only enter through lawful apply/receipt paths
- runtime gets stronger after return-backed change, not after conversational confidence

### D. Contradiction governs closure

The system already proves:

- contradiction can be recorded
- contradiction prevents seal
- blocked closure cannot be applied into canon

This is where the system begins to justify itself as more than structured chat.

### E. Session continuity and box canon are separate

The system already proves:

- a second conversation can share the same canon
- a fresh session does not fork truth accidentally
- handoff context can affect prompt context without mutating box truth

### F. Route behavior matches core law behavior

The system already proves:

- malformed model payload falls back safely
- route-level truth path preserves the same boundaries as service-core truth path

### G. Lœgos beats serious baselines on at least one decisive journey

The comparison benchmark already proves:

- better boundary preservation than plain chat
- a real advantage over schema-only workflow when contradiction and closure matter

That is a meaningful product result, not a vanity benchmark.

---

## 3.2 Conditionally proven, not yet fully trusted

### A. Live AI caller use of the machine

There is already a good harness design for this.
But as of this audit, the live generator path is blocked by upstream quota, so the current run did not actually exercise the AI caller behavior.

This means:

- the harness design is promising
- the old report is useful historical evidence
- the present machine does not yet have a repeatable, currently-green live AI-caller proof on this environment

### B. Browser truth-path parity for the current Room-first system

There are browser tests, but the browser proof is still not the same thing as the backend truth-path proof.
The browser layer still needs a more explicit Room-first parity gate.

### C. Adverse-condition resilience

The current suites do not yet adequately prove behavior under:

- DB failure mid-apply
- duplicate apply requests
- model timeout
- model 429 / quota / transport errors
- stale state replay from multiple actors
- partial artifact write failure

### D. Performance and long-run stability

The current suites prove correctness much more than they prove durability.

There is not yet enough proof for:

- latency budgets
- memory growth under repeated sessions
- repeated apply/receipt churn
- concurrent load

---

## 4. The Core Risk Model

If my life depended on this machine, these would be the risk classes.

## 4.1 P0: truth corruption risks

These are stop-ship failures.

- canon changes before apply
- contradiction can still seal
- fresh session sees draft as canon
- return changes runtime without lawful provenance path
- hidden prompt / generator leak crosses the boundary into Room-visible state
- stale preview applies after canon has already moved

## 4.2 P1: false confidence risks

- system sounds structured but law is not actually governing
- schema-only behavior sneaks back in behind Room language
- browser UI implies mutation happened when it did not
- receipt drafting suggests proof where only conversation exists

## 4.3 P2: availability and operability risks

- live AI-caller suite fails because of external quota, not system behavior
- e2e coverage depends on local environment configuration
- lack of skip/fallback policy makes infra look like product failure

## 4.4 P3: degradation risks

- route and service-core drift apart
- prompt changes alter behavior without updated dossiers
- performance regressions make operator use unsafe or misleading

---

## 5. Testing Doctrine

These are the rules I would use to test this machine seriously.

## 5.1 Law first, language second

We do not pass a test because the answer sounds good.
We pass because:

- the right state changed
- the wrong state did not change
- the law enforced the boundary correctly

## 5.2 Separate the actors

Every serious collaboration test must distinguish:

1. caller
2. responder
3. law kernel
4. reality return

If those blur together, the test becomes self-congratulatory fiction.

## 5.3 Deterministic proof on every PR, live-model proof on scheduled runs

The fastest way to damage confidence is to make every PR depend on a live model, network, and billing state.

Deterministic proof should be the merge gate.
Live proof should be a higher-level proving run.

## 5.4 Artifact-first testing

Every important journey should produce a dossier:

- fixture
- initial source
- prompt packet
- raw model payload or stub payload
- guarded turn
- gate result
- view after turn
- source after apply
- runtime after apply
- report

If we cannot inspect it, we cannot really debug it.

## 5.5 Failure classification matters

A failed run must be classified as one of:

- product law failure
- route/serialization failure
- browser presentation failure
- external model failure
- quota/billing failure
- environment boot failure

Without this, the signal is muddy and the team chases ghosts.

---

## 6. Champion-Level Test Strategy

This is the gate sequence I would use.

## Gate 0: Mechanical boot

Purpose:

- prove the car starts
- verify env wiring before deeper runs

Checks:

- install
- Prisma generate
- basic route imports
- auth bootstrap available
- required env present for optional live suites

Pass criteria:

- no missing dependency or import crash
- clear classification of which optional suites are runnable

Frequency:

- every local serious run
- every CI run

Recommended commands:

```bash
npm run build
npm run lint
```

If build is too expensive for every inner loop, at least run a route import smoke.

---

## Gate 1: Kernel law

Purpose:

- prove the rules of the machine before we test operator stories

Suites:

- `tests/room-turn-policy.test.mjs`
- `tests/echo-field-state.test.mjs`
- `tests/echo-ripple-signal.test.mjs`
- `LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs`

Pass criteria:

- all green
- no snapshot drift without explicit review
- no semantic rule weakened without new benchmark evidence

Stop-ship examples:

- ping law regression
- conversation mode allowing hidden structure
- contradiction no longer represented correctly

Frequency:

- every PR

---

## Gate 2: Service-core truth path

Purpose:

- prove end-to-end law at the state-machine level

Suites:

- `tests/room-turn-journeys.test.mjs`

Critical scenarios:

- aspiration stays conversation-only
- concrete observation earns preview only
- apply mutates canon
- return mutates runtime only through apply
- contradiction blocks closure
- preview supersession
- same box, new conversation

Pass criteria:

- all green
- dossier artifacts regenerated or explicitly reviewed

Stop-ship examples:

- source mutation on turn
- runtime mutation without return/apply
- contradiction path no longer blocks closure

Frequency:

- every PR

---

## Gate 3: Route/API truth path

Purpose:

- prove the public HTTP surface preserves the same law

Suites:

- `tests/room-route-journeys.test.mjs`
- `tests/room-first-workspace.test.mjs`
- `tests/room-preview-state.test.mjs`
- `tests/room-adjacent-lanes.test.mjs`
- `tests/room-session-reset.test.mjs`
- `tests/room-advisory-seam.test.mjs`

Critical scenarios:

- malformed model payload fallback
- blocked apply
- receipt completion via route
- concurrent session previews
- preview visibility without canon mutation

Pass criteria:

- all green
- route and service-core expectations aligned

Frequency:

- every PR

---

## Gate 4: Competitive benchmark

Purpose:

- prove the machine is worth using

Suite:

- `tests/room-comparison-benchmark.test.mjs`

Required verdict:

- `loegos` must beat `plain_chat`
- `loegos` must beat `schema_only` on contradiction-governed closure

Pass criteria:

- benchmark remains green
- generated report remains inspectable

Frequency:

- every PR touching Room law, closure, apply, return, or session semantics

---

## Gate 5: Live AI-caller proving run

Purpose:

- prove a real AI caller can use the machine without collapsing its boundaries

Suites:

- `tests/room-agent-collaboration.test.mjs`
- `tests/room-agent-collaboration-routes.test.mjs`

Core scenarios:

- aspiration remains conversational
- concrete observation earns preview
- invalid ping blocked
- return path only strengthens runtime through lawful apply
- same box/new conversation shares canon
- authority smuggling blocked
- sentinel hidden prompt token does not leak
- hidden prompt variants with same visible message preserve the same truth-path outcome

Current status:

- harness exists
- live execution currently blocked by upstream API quota

Recommendation:

- do not make this suite a mandatory PR gate yet
- classify it as `proving run`
- run it:
  - nightly
  - before major demos
  - before agent-facing releases

Hard recommendation:

Introduce two modes:

1. `recorded deterministic mode`
   - uses captured model outputs
   - required on every PR

2. `live model mode`
   - uses real model calls
   - optional but tracked
   - failures classified separately as product vs infra vs billing

Without that split, the suite is too dependent on quota and networking to serve as a serious reliability gate.

---

## Gate 6: Browser truth-path proof

Purpose:

- prove the UI shows the correct law, not just any UI

Existing suites:

- `tests/e2e/phase1-inline-operate.spec.mjs`
- `tests/e2e/phase2-workspace-shell.spec.mjs`
- `tests/e2e/room-phase2-closeout.spec.mjs`

Current judgment:

- useful
- not yet the full Room-first truth-path proof

Add these browser scenarios:

1. preview visible, canon unchanged after turn
2. apply clears preview and updates mirror
3. blocked seal shows contradiction rationale and cannot proceed
4. new conversation sees box canon, not prior draft
5. receipt completion visibly changes runtime-backed state only after apply
6. attested override acknowledgement is required before seal

Pass criteria:

- UI reflects the same distinctions proven in service-core and route layers

Frequency:

- every release candidate
- every PR touching RoomWorkspace UI or route response shape

---

## Gate 7: Adverse-condition and durability testing

Purpose:

- prove the machine is safe when the world is uncooperative

These tests are not sufficiently present today and should be added next.

### A. Transport and model failure

Add tests for:

- OpenAI timeout
- OpenAI 429
- OpenAI quota exceeded
- malformed but non-empty payload
- empty payload
- partial response

Expected behavior:

- route returns safe fallback or explicit unavailable state
- no canon mutation
- no preview inflation
- failure classified clearly

### B. Apply idempotency and replay

Add tests for:

- duplicate apply request
- replaying an already-applied preview
- stale preview after newer preview exists
- two applies racing at once

Expected behavior:

- exactly one canonical winner
- stale or duplicate requests rejected safely

### C. Persistence failure

Add tests for:

- DB write failure after turn persistence begins
- DB failure during apply
- receipt draft failure after runtime change attempt

Expected behavior:

- no partial truth corruption
- transaction or rollback semantics are explicit
- final view does not imply mutation if mutation failed

### D. Performance budgets

Track and enforce:

- turn classification latency
- route response latency with stubbed model
- apply latency
- view rebuild latency
- large-session render latency

Suggested initial budgets:

- stubbed turn route under `250ms`
- apply under `250ms`
- comparison benchmark under `1s`
- core deterministic stack under `10s`

Use trend alerts, not only hard failures, at first.

### E. Soak / loop durability

Run:

- many sequential turns in one session
- many sessions against one box
- many preview/apply/return cycles

Prove:

- no state drift
- no memory blow-up
- no artifact corruption

---

## 7.1 Competitive Performance Benchmarks

Correctness alone is not enough.
If this machine is going to justify itself over simpler alternatives, we need to measure not only whether it stays lawful, but whether it reaches better outcomes with acceptable cost.

The right question is not:

> "Is Loegos slower because it has more structure?"

The right question is:

> "Does Loegos reach a better and safer outcome per unit of time, turns, tokens, and correction effort than simpler competing workflows?"

### A. Baselines to compare against

At minimum, compare these modes on the same journeys:

1. `loegos`
   - current Room law path
   - preview/apply/canon/runtime separation

2. `schema_only`
   - structured draft/apply workflow
   - no contradiction-governed closure law

3. `plain_chat`
   - rolling conversational truth
   - no preview/apply boundary

4. `plain_ai_to_ai`
   - two model roles
   - no shared law kernel
   - no canon/runtime distinction
   - no special hidden system about the product beyond basic actor role

5. `prompted_ai_to_ai`
   - two model roles
   - strong role prompting
   - still no canonical law kernel, no apply boundary

This matters because ordinary multi-agent chat can sound very capable while still collapsing draft, truth, contradiction, and closure into one rolling stream.

### B. Metrics that actually matter

There are five performance families.

#### 1. Speed metrics

- `time_to_first_useful_response`
  - wall-clock time to the first response that gives a non-trivial next move or clarification
- `time_to_lawful_preview`
  - time until the system produces the first valid preview-worthy structure
- `time_to_canonical_plan`
  - time until a plan actually becomes accepted canonical state
- `time_to_first_verifiable_return`
  - time until the journey records a real external return
- `time_to_safe_closure_or_block`
  - time until the system either closes lawfully or correctly refuses closure

#### 2. Interaction-efficiency metrics

- `turns_to_preview`
- `turns_to_apply`
- `turns_to_first_return`
- `turns_to_resolution`
- `turns_to_detect_contradiction`
- `turns_to_recover_after_contradiction`

Important note:

Loegos may legitimately take one more turn because it forces apply.
That is acceptable if the added turn prevents a bad closure or reduces later recovery cost.

#### 3. Token and cost metrics

- `input_tokens_total`
- `output_tokens_total`
- `tokens_per_turn`
- `tokens_to_first_preview`
- `tokens_to_first_return`
- `tokens_to_resolution`
- `tokens_per_accepted_canonical_clause`
- `cost_to_resolution`

These should be tracked both raw and normalized by successful outcome quality.

#### 4. Quality and safety metrics

- `preview_precision`
  - how often preview appears only when structure is actually earned
- `canonical_integrity`
  - whether canon mutates only through lawful apply
- `runtime_integrity`
  - whether runtime changes only through lawful return paths
- `contradiction_governance_rate`
  - how often contradiction correctly blocks closure
- `false_seal_rate`
  - how often the system seals when it should not
- `handoff_integrity`
  - whether a fresh session sees canon rather than accidental draft state
- `truth_boundary_violation_count`
  - count of illegal state collapses

These are not "nice to have" metrics.
They are the point of the product.

#### 5. Recovery-cost metrics

- `recovery_turns_after_wrong_hypothesis`
- `recovery_tokens_after_wrong_hypothesis`
- `recovery_time_after_contradiction`
- `canon_repair_steps_required`
- `operator_intervention_count`

This family is where Loegos should win hardest.
Even if it is a little slower up front, it should be much cheaper when the first story is wrong.

### C. Outcome scoring model

Use a two-layer scorecard.

#### Layer 1: hard safety gates

If any of these happen, the run is a failure regardless of speed:

- canon changed before apply
- contradiction failed to block invalid seal
- runtime changed without lawful return path
- fresh session inherited draft as canon
- hidden state leaked across actor boundary

#### Layer 2: competitive performance score

For runs that pass the safety gates, compute a weighted score:

- `Outcome quality`:
  - did the run reach the right next move, return, or safe refusal?
- `Time efficiency`:
  - how long did it take?
- `Interaction efficiency`:
  - how many turns did it take?
- `Token efficiency`:
  - how many tokens and dollars did it take?
- `Recovery efficiency`:
  - how expensive was correction when reality contradicted the first story?

In plain English:

```text
competitive_value = safe_outcome_quality / (time + turns + tokens + recovery_cost)
```

The exact math can vary.
The important part is that safety failures must zero out the score.

### D. The specific win condition I would expect

I would not expect Loegos to always win on:

- first-response speed
- raw turns on very easy conversational cases
- raw tokens on trivial tasks

I would expect it to win on:

- safe plan formation
- contradiction handling
- false-seal avoidance
- fresh-session handoff
- recovery after wrong early interpretation
- token efficiency per trustworthy resolved outcome

That last phrase matters:

Not cheapest conversation.
Cheapest trustworthy resolution.

### E. Best benchmark journey shapes

To compare fairly, use at least four journey classes.

#### 1. Straight-line resolution

- concrete observation
- lawful plan
- confirming return
- safe closure

Purpose:

- measure overhead when reality is simple

#### 2. Wrong-first-story journey

- concrete observation
- plausible first hypothesis
- contradictory return
- revised interpretation
- closure only after repair

Purpose:

- this is the most important benchmark class
- Loegos should beat plain chat here decisively

#### 3. Ambiguous/noisy journey

- vague aspiration
- partial facts
- mixed witness quality
- no clear return yet

Purpose:

- test whether the system avoids premature structure and cheap certainty

#### 4. Multi-session handoff journey

- session one opens issue and drafts plan
- later session checks current truth
- third actor or agent returns with new evidence

Purpose:

- measure handoff integrity and draft/canon separation under collaboration

### F. Data collection needed

To run these benchmarks properly, instrument:

- timestamps for every turn, apply, and receipt action
- token usage per model call
- cost estimate per model call
- state transition events
- preview creation count
- apply count
- contradiction count
- seal attempts
- blocked seal attempts
- session handoff checks

For the live AI-caller layer, also log:

- generator model
- generator latency
- generator token usage
- generator failure mode

### G. Practical reporting format

For each benchmark mode and journey, emit:

- summary table
- trace of turns and state changes
- latency totals
- token totals
- cost totals
- safety violations
- recovery-cost summary
- final verdict

Recommended top-line table:

| Mode | Safe outcome | Time | Turns | Tokens | Cost | False seal | Recovery cost | Fresh-session integrity |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Loegos | yes | ... | ... | ... | ... | 0 | ... | pass |
| Schema-only | maybe | ... | ... | ... | ... | 1 | ... | fail |
| Plain chat | maybe | ... | ... | ... | ... | 1 | ... | fail |
| Prompted AI-to-AI | maybe | ... | ... | ... | ... | ? | ... | ? |

### H. Immediate recommendation

The next competitive benchmark expansion should add:

1. `plain_ai_to_ai`
2. `prompted_ai_to_ai`
3. wall-clock timing
4. token accounting
5. recovery-cost scoring

That will let the team say something much stronger than:

> "Loegos is more structured."

It will let the team say:

> "Loegos reaches safer resolution with lower total correction cost than ordinary AI collaboration, especially when the first story is wrong."

---

## 7.2 Detailed Phase 1 Benchmark Matrix

This is the benchmark matrix I would use right now.

| ID | Scenario | Actor mode | Layer | Expected result | Severity if broken | Current status |
|---|---|---|---|---|---|---|
| B1 | Empty-box aspiration | deterministic | service-core | conversation only, no preview, no canon change | P0 | covered, green |
| B2 | Concrete observation emerges | deterministic | service-core + route | preview present, canon unchanged | P0 | covered, green |
| B3 | Apply proposal | deterministic | service-core + route | canon changes only on apply | P0 | covered, green |
| B4 | Return after apply | deterministic | service-core + route | runtime strengthens only through lawful apply | P0 | covered, green |
| B5 | Contradiction before seal | deterministic | service-core + route | seal blocked, canon unchanged | P0 | covered, green |
| B6 | Fresh session after prior work | deterministic | service-core + route | new conversation sees canon, not draft | P0 | covered, green |
| B7 | Malformed model payload | deterministic | route | safe fallback, no mutation | P0 | covered, green |
| B8 | Invalid ping / missing test | deterministic | service-core + route | proposal blocked | P0 | covered, green |
| B9 | Preview superseded by later turn | deterministic | service-core | earlier preview non-canonical and superseded | P1 | covered, green |
| B10 | Concurrent session apply race | deterministic | route | stale apply rejected | P0 | covered, green |
| B11 | Lœgos vs schema vs chat | deterministic | benchmark | Lœgos wins on contradiction-governed closure | P1 | covered, green |
| B12 | AI caller aspiration | live + recorded | service-core + route | still conversational, no boundary leak | P1 | harness exists, live blocked by quota |
| B13 | AI caller concrete observation | live + recorded | service-core + route | earns preview, no canon mutation | P1 | harness exists, live blocked by quota |
| B14 | AI caller authority smuggling | live + recorded | service-core + route | blocked by law | P0 | harness exists, live blocked by quota |
| B15 | Sentinel leak test | live + recorded | service-core | hidden token never appears in Room path | P0 | harness exists, live blocked by quota |
| B16 | Same visible message, different hidden prompt | live + recorded | service-core | materially same truth-path outcome | P1 | harness exists, live blocked by quota |
| B17 | Browser preview/apply parity | browser | e2e | UI reflects preview/apply separation correctly | P1 | missing explicit Room-first proof |
| B18 | Browser contradiction/seal parity | browser | e2e | seal visibly blocked and cannot force mutation | P0 | partial, should be expanded |
| B19 | Upstream quota exceeded | deterministic + browser | route | safe unavailable state, no mutation | P1 | missing |
| B20 | Duplicate apply / replay | deterministic | route + persistence | single winner, no duplicate canon mutation | P0 | missing explicit coverage |

---

## 8. Immediate Recommendations

If I were responsible for this machine now, I would do these next.

## 8.1 Keep the current deterministic Room stack as the main merge gate

It already proves the heart of the system.

Use these as the minimum serious gate:

```bash
node --test tests/room-route-journeys.test.mjs tests/room-turn-journeys.test.mjs tests/room-first-workspace.test.mjs tests/room-preview-state.test.mjs tests/room-advisory-seam.test.mjs tests/room-adjacent-lanes.test.mjs tests/room-session-reset.test.mjs tests/room-turn-policy.test.mjs tests/echo-field-state.test.mjs tests/echo-ripple-signal.test.mjs LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs
node --test tests/room-comparison-benchmark.test.mjs
```

## 8.2 Split AI-caller proving into deterministic replay and live model modes

This is the biggest immediate testing improvement.

Why:

- right now the harness is too dependent on quota and upstream availability
- that makes it unsuitable as a merge gate
- it hides whether the failure is in the machine or outside it

What to add:

- recorded fixture outputs for the AI caller generator
- an env switch:
  - `ROOM_AI_COLLAB_MODE=recorded`
  - `ROOM_AI_COLLAB_MODE=live`

Policy:

- recorded mode on every PR
- live mode nightly and pre-release

## 8.3 Add explicit tests for quota/timeout/transport failure

The audit found a real operational weakness:

- quota exhaustion currently fails the suite hard

That is useful information, but it should be classified cleanly.

Desired behavior:

- if the intent is to test live AI proving, fail with `infra/model unavailable`
- if the intent is to test product law, fall back to recorded mode or skip

## 8.4 Add a Room-first browser parity suite

The backend truth path is ahead of the browser proof.

Add one browser suite that follows:

1. concrete observation
2. preview visible
3. apply
4. return
5. contradiction
6. blocked seal
7. second conversation handoff

This should be the browser analogue of the service-core truth-path dossier.

## 8.5 Add apply replay and persistence-failure tests before widening external use

If agents or multiple humans will use this machine, replay and stale state are not edge cases.
They are inevitable.

---

## 9. Release Criteria

I would not call this machine fully proven for agent-facing use until all of these are true.

## Required

- deterministic kernel and truth-path suites green
- comparison benchmark green
- browser Room-first parity suite green
- duplicate apply / stale replay tests green
- quota/timeout failure tests green
- recorded AI-caller suite green

## Strongly preferred

- live AI-caller suite green on at least 3 repeated runs
- one full founder/operator browser proof green on a real environment
- no unresolved P0 truth-corruption risks

## Stop-ship rules

Do not ship agent-facing claims if any of these happen:

- canon mutates before apply
- contradiction can be sealed
- draft leaks into fresh-session canon
- hidden prompt leaks into Room-visible path
- replay apply mutates canon twice
- route failure leaves runtime and canon disagreeing

---

## 10. Final Judgment

The current machine is stronger than it first appears.

It already has:

- a real law kernel
- a real preview/apply boundary
- real contradiction-governed closure
- real comparative evidence against simpler baselines
- good dossier-style testing instincts

That is serious engineering.

What it does not yet have is a fully trustworthy live AI-caller proving loop on this environment.
The harness exists, but the current run was blocked by upstream quota before the Room path could be judged.

So the correct championship call is:

- trust the deterministic Room law stack now
- treat live AI-caller proving as an important but not yet release-grade gate
- harden the AI-caller harness by splitting recorded proof from live proving
- add adverse-condition and browser parity tests next

If this were my machine, I would say:

The chassis is real.
The law is real.
The benchmark win is real.
The next work is to prove the engine under live fuel pressure, not to redesign the car.
