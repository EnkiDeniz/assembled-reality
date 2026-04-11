# Test Drive III Proposal: Working Echo To Valid Signal

Date: April 11, 2026  
Status: Proposed  
Author: Engineer  
Purpose: Upgrade Test Drive II from a second-turn working-echo benchmark into a full product benchmark that measures whether the visible echo leads to a more valid move signal, a more honest return update, and a better later handoff.

---

## 1. Where We Actually Are

Test Drive II is not imaginary. It already does an important part of the job.

It currently tests:

- `plain_chat`
- `structured_chat`
- `loegos_blindfolded`
- `loegos_sighted`
- `schema_board`

And it already uses:

- a paired sighted vs blindfolded design
- the real current surfaced Room object
- deterministic second-turn scoring
- current-surface extraction from the real Room view semantics

Concretely, Test Drive II already compares whether seeing the current surfaced Room object improves the **next reply**.

That is a real and important benchmark.

It is also important to classify the current scenario coverage correctly:

- the current two scenarios are the right opening lap
- they are not the full long-term suite

And it is now important to classify the current benchmark lesson correctly:

- the question "does showing the echo matter?" is basically answered yes
- the latest clean run is headline-valid under the current rules
- `loegos_sighted` is the official winner under those rules
- `schema_board` still has the strongest raw mean score
- the new question is "what kind of echo carries harder receipts than excellent structured chat and the best board?"

---

## 2. What Test Drive II Is Already Doing Right

Test Drive II already answers:

> "Does the visible current Room surface help the next turn become better than answer-only Loegos, plain chat, or a generic schema board?"

That is meaningful because it tests:

- current surfaced assistant answer
- visible preview banner and inline chips
- visible witness panel when present
- visible mirror when present
- visible field state label

And it scores:

- specificity gain
- evidence alignment
- contradiction awareness
- counterfeit resistance
- false-forward avoidance
- move readiness

That is already much closer to the real product than the failed Phase 1 benchmark.

---

## 3. What Test Drive II Still Does Not Prove

Even though Test Drive II is directionally right, it still stops too early.

It proves:

- the visible surface may improve the second turn

It does **not yet prove**:

- that the improved second turn leads to a **more valid move signal**
- that the move survives contact with **return**
- that the system **re-echoes honestly** after return
- that contradiction governs later closure
- that a later human or agent inherits the right state

So Test Drive II is a **working-echo steering benchmark**.

Test Drive III should become a **working-echo product benchmark**.

But there is one important sequencing rule now:

Do not use Test Drive III to skip the remaining Test Drive II work.

The current visible miss is now strongest in honest fog and explicit evidence carry-forward, with `no_move_yet` still the clearest weak corner.
So the right move is:

1. strengthen the visible working echo for stronger `supports / weakens / missing`
2. sharpen `whatWouldDecideIt` in fog
3. rerun Test Drive II
4. only then stretch into Test Drive III

Two authority rules should stay in force during that upgrade:

- GetReceipts may strengthen provenance, but it should not become another conversational speaker
- Shape Library may strengthen the deciding split, but it should remain a bounded advisory seam rather than a second truth path

There is one more product truth to carry forward into Test Drive III:

**Aim is not optional.**

The longer-loop benchmark should be understood as testing an aimed reality loop:

**Aim -> Echo -> Split -> Witness/Test -> Return -> Receipt -> Re-aim -> Canon**

That means Test Drive III should not only ask whether the echo improved the reply.
It should also ask whether the later return changed the aim honestly.

---

## 4. The Core Upgrade

The upgrade is simple in concept:

### Test Drive II

`first turn -> surfaced echo -> second turn`

### Test Drive III

`first turn -> surfaced echo -> second turn -> move signal -> return -> re-echo -> handoff`

That is the missing arc.

Test Drive III should answer:

> "Does the visible working echo not only improve the next reply, but also produce a more trustworthy move-forward signal and a more honest later state?"

And the later state should include whether the system re-aimed correctly under return.

That is the benchmark that can tell us whether the product really rotates at the apex.

Current sequencing rule:

- stay in Test Drive II until the next rerun materially improves `no_move_yet` and evidence explicitness
- keep a language-fidelity lane in parallel so the stronger short loop is also more artifact-faithful
- only then move the stronger echo into the longer loop

---

## 5. Test Drive III Thesis

The visible working echo wins only if it improves:

1. the next reply
2. the validity of the move signal
3. the honesty of the post-return update
4. the later handoff state
5. the honesty of re-aim after reality pushes back

If it only improves prose, it has not earned the complexity.

If it improves the next move and the later truth state, then it is real product value.

---

## 6. The New Primary Metric

Test Drive III should promote one new metric to the top:

## `valid_signal_to_move_forward`

Definition:

Was the visible echo accurate enough, specific enough, and honest enough that moving forward was justified?

This is stricter than "move readiness."
It asks whether the system produced a move signal that should actually be trusted.

This should become the main headline metric.

It is especially important because the current benchmark already suggests that:

- steering
- correction
- restraint

are where the visible echo is starting to matter,

while:

- return-aware update
- post-return rerouting
- later-state inheritance
- aim recalibration under return

are still where the product needs to earn its distinction.

---

## 7. Benchmark Arms

Keep the Test Drive II arms, but use them across the longer journey.

### Arm A: `plain_chat`

- assistant answer only
- no external echo surface
- no law-backed state transitions

### Arm B: `structured_chat`

- structured answer discipline
- no external echo surface
- no Lœgos law

### Arm C: `loegos_blindfolded`

- real Lœgos first turn and law path
- evaluator sees assistant answer only

### Arm D: `loegos_sighted`

- exact same Lœgos first turn as Arm C
- evaluator sees current surfaced Room object

### Arm E: `schema_board`

- generic visible external board
- no Lœgos law underneath it

For Test Drive III, the paired reveal rule must stay:

- `loegos_blindfolded` and `loegos_sighted` share the same first turn
- only visibility changes

---

## 8. Surface Modes

Test Drive III should support two explicit surface modes.

### Mode 1: `current_surface`

Use what the Room visibly exposes today.

This is the honest first benchmark.

### Mode 2: `product_intent_surface`

Use a future, stronger surfaced working echo panel.

This mode should only be valid after the panel exists as a real surfaced product object.

Rule:

No benchmark may claim gains on an invented surface.

So Test Drive III should launch in `current_surface`, then later extend to `product_intent_surface`.

In both modes, the surfaced object should remain bounded:

- no raw courthouse payloads
- no raw advisory internals
- only product-visible provenance and advisory summaries

---

## 9. Scenario Shape

Each Test Drive III scenario should include:

1. initial vague or partial problem
2. visible evidence bundle
3. one counterfeit explanation
4. one unresolved contradiction
5. one justified move family
6. one premature move family
7. one return that sharpens the current read
8. one return that contradicts or reroutes the current read
9. one closure or confidence temptation
10. one fresh-session or second-actor continuation

This creates the full loop needed to measure product value.

But the scenario portfolio also needs breadth, not only depth.

The current Test Drive II starter cases are useful because they stress:

- contradiction handling
- counterfeit blame resistance
- deciding-split behavior
- evidence carry-forward

Those should stay.

They should not be treated as the whole benchmark set, because they are both close to the same underlying shape:

- a plausible explanation is wrong
- the real issue is elsewhere
- the right move is a sharper diagnostic split

That is good territory, but not the whole product.

The first added Test Drive III scenarios should therefore favor:

- return-aware echo
- correction after visible misweighting
- handoff after state change
- witness-heavy evidence carrying

---

## 10. Turn Structure

Each run should look like this:

1. initial user turn
2. assistant reply
3. surfaced echo according to arm and mode
4. second user/agent turn
5. score second-turn improvement
6. generate move recommendation or clarification
7. score `valid_signal_to_move_forward`
8. inject return
9. re-echo using the same arm's visibility rules
10. score `return_update_honesty`
11. attempt closure or next-confidence step
12. score contradiction governance
13. open fresh session or second actor
14. score handoff integrity

This is the smallest complete loop that tests what the product is actually claiming.

---

## 11. New Metrics

Test Drive III should keep the Test Drive II second-turn metrics and add these:

### 11.1 Move signal metrics

- `valid_signal_to_move_forward`
- `false_forward_rate`
- `move_discrimination_quality`
- `time_to_valid_signal`
- `tokens_to_valid_signal`

### 11.2 Return and re-echo metrics

- `return_update_accuracy`
- `re_echo_honesty`
- `contradiction_visibility_after_return`
- `aim_recalibration_honesty`

`aim_recalibration_honesty` should ask:

- did the later state preserve the original aim when it still held
- did it loosen or reroute the aim when return weakened it
- did it avoid pretending that the aim never moved
- `counterfeit_survival_rate`

### 11.3 Handoff metrics

- `fresh_session_handoff_integrity`
- `later_actor_state_accuracy`
- `stale_preview_confusion_rate`

### 11.4 Existing second-turn metrics to keep

- `specificity_gain`
- `evidence_alignment`
- `contradiction_awareness`
- `counterfeit_resistance`
- `false_forward_avoidance`
- `move_readiness`

---

## 12. New Scoring Contracts

We need three deterministic scorers in addition to the current second-turn scorer.

### 12.1 `score-working-echo-move-signal.mjs`

Scores whether the chosen move is:

- justified
- discriminating
- non-premature
- appropriately tentative

### 12.2 `score-working-echo-return-update.mjs`

Scores whether the post-return state:

- updates the read honestly
- preserves contradiction when needed
- does not quietly preserve counterfeit framing

### 12.3 `score-working-echo-handoff.mjs`

Scores whether a fresh session or second actor inherits:

- the right current read
- the right unresolved tension
- the right move state
- the right non-canonical/canonical distinction

Deterministic scoring remains primary.
LLM judge may explain, but it should not decide the winner.

---

## 13. Harness Additions

Build on Test Drive II. Do not replace it.

### Reuse

- `tests/helpers/run-test-drive-ii-benchmark.mjs`
- `tests/helpers/extract-surfaced-room-state.mjs`
- `tests/helpers/score-working-echo-second-turn.mjs`
- existing Room route harness and truth-path preflight suites

### Add

- `tests/helpers/run-test-drive-iii-benchmark.mjs`
- `tests/helpers/score-working-echo-move-signal.mjs`
- `tests/helpers/score-working-echo-return-update.mjs`
- `tests/helpers/score-working-echo-handoff.mjs`
- `tests/fixtures/room-benchmarks/working-echo-journeys/*.mjs`
- `tests/test-drive-iii-benchmark.test.mjs`
- `scripts/run-test-drive-iii-benchmark.mjs`

### Optional later

- `src/components/room/WorkingEchoPanel.jsx`

Only if we move to `product_intent_surface`.

---

## 14. Report Format

Test Drive III should generate one master dossier:

- `test-results/room-benchmarks/test-drive-iii-master-report.md`

It should include:

- executive verdict
- surface mode
- prerequisites
- scenario pack and gold labels
- paired first-turn records
- surfaced objects actually shown to each evaluator
- second-turn score table
- move-signal score table
- return-update score table
- handoff score table
- efficiency table
- blind auditor appendix

The report should make it possible to answer:

1. Did the visible echo improve the next reply?
2. Did it improve the move signal?
3. Did it survive return honestly?
4. Did it improve later handoff?

---

## 15. Acceptance Conditions

Test Drive III should not be considered headline-valid unless all of these are true:

1. substrate truth-law preflight suites are green
2. surfaced mode is declared
3. paired reveal is used for sighted vs blindfolded Loegos
4. all scenario packs have gold labels for move, return, and handoff
5. schema-board control is present
6. deterministic scores are populated for second turn, move, return, and handoff
7. no arm is scored on hidden state it would not actually surface

---

## 16. Suggested First Two Scenarios

I would start with:

### Scenario A: Safe Uncertainty Incident

Goal:

- does the visible echo help the second turn resist the counterfeit explanation
- does it produce a better diagnostic move
- does it update honestly after a clock-skew return

### Scenario B: Contradictory Return Journey

Goal:

- does the visible echo help the second turn avoid the wrong explanation
- does the later return reroute the read honestly
- does later handoff preserve the contradiction

These are already close to the current Test Drive II scenario packs, so they are the cheapest upgrade path.

They should stay the first two scenarios, not the permanent whole suite.

### Add next scenario families

- `no_move_yet`
  - the right answer is to stay in fog and narrow first
- `working_echo_correction`
  - the surfaced read is slightly wrong and the user improves it
- `return_re_echo`
  - return should change the visible echo and the next move
- `handoff`
  - a second operator must continue from the surfaced state
- `witness_heavy`
  - the surface must carry actual source material, not just summary

---

## 17. Recommended Build Order

### Milestone 1

Ship Test Drive II cleanly and freeze its report format.

### Milestone 2

Add move-signal scoring on top of the same scenarios.

### Milestone 3

Add return injection and re-echo scoring.

### Milestone 4

Add fresh-session / second-actor handoff scoring.

### Milestone 5

Only then add `product_intent_surface` if the current surface is too weak.

This keeps us honest and lets Test III grow from real evidence instead of aspiration.

---

## 18. Short Version

Test Drive II asks:

> does the visible current surface improve the next reply?

Test Drive III should ask:

> does the visible working echo improve the next reply, the move signal, the post-return update, and the later handoff?

That is the upgrade path from a good benchmark to the benchmark that can really tell us whether this product is becoming a 911.
