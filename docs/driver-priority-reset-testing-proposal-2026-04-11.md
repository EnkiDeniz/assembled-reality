# Driver Proposal: 2026 Testing Priority Reset

Date: 2026-04-11  
Author: Driver  
Status: Proposed merge candidate

---

## 0. Why this proposal exists

We learned something important from the first benchmark pass:

we were mostly testing Loegos as a chat endpoint.

But that is not the real product claim.

The stronger claim is:

Loegos should help a person or an AI co-create a better echo outside the chat itself:

- a visible forming aim
- visible evidence notes
- visible contradiction
- visible next move
- visible return state

That shared surface changes the next reply.
It changes the next question.
It changes whether the conversation gets closer to reality.

If the tester only sees assistant text and not the working echo surface, then the tester is partly blindfolded.

That means our testing priorities need to change.

---

## 1. The reset in one sentence

This year, the primary question should be:

`Does Loegos create a better shared working echo that leads to a truer next move than plain chat or structured prompting?`

Not:

`Does Loegos write a better answer?`

---

## 2. What we should keep measuring

The original benchmark was not useless. It measured real things we still need.

We should keep these as baseline requirements:

- unsupported claims
- planted falsehood detection
- contradiction governance
- lawful next move quality
- canon discipline
- runtime discipline
- handoff clarity
- time, turns, tokens, and cost

These remain important because a beautiful working surface is worthless if it lies, overclaims, or mutates canon unlawfully.

So this is not a rejection of the old metrics.
It is a reprioritization.

---

## 3. What we were not really testing

We were not really testing whether the user or AI operator can think with the system.

More specifically, we were not measuring:

- whether a visible draft aim improves the next reply
- whether visible evidence notes improve correction and steering
- whether visible contradiction prevents drift into story
- whether a visible preview move helps the operator choose a better next question
- whether the working echo outside the chat is actually legible and useful

In other words:

we measured answer quality and lawfulness more than co-creation quality.

That was the blind spot.

---

## 4. The real product claim

The strongest version of the product claim now looks like this:

1. Seven speaks in chat.
2. The room shows a visible working echo outside the chat.
3. The operator reacts to that visible echo.
4. The next turn gets better because both sides are steering against the same emerging structure.
5. Only later, if earned, some of that structure becomes canonical.

So the important distinction is:

- chat is the voice
- preview echo is the shared working surface
- canon is the committed source of truth

The preview echo does not need to be canonical to be useful.
It needs to be inspectable, steerable, and honest about its status.

---

## 5. The priority reset for this year

I would reorder the testing agenda like this.

### Priority 1: Prove the shared working echo

We need to prove that the visible non-canonical echo makes the conversation better.

This means measuring:

- whether aim becomes clearer faster
- whether evidence gets captured more faithfully
- whether contradiction stays visible
- whether the operator asks a better next question after seeing the preview echo
- whether the preview echo reduces drift, re-explaining, and circular chat

This is the biggest missing proof today.

### Priority 2: Prove valid move-forward signal

Once the shared echo is visible, we need to test whether it leads to a better lawful ping, better return interpretation, and a better next action.

This is the reality-contact layer.

### Priority 3: Keep safety and law green

The kernel and law path still matter.

This means we keep the current deterministic suites around:

- no fake echo
- no canon change before apply
- no runtime strengthening without lawful return
- contradiction blocks premature closure

These are gating checks, not the top-line product proof.

### Priority 4: Prove collaboration and handoff

Only after the shared echo and valid signal loops are real should we expand into:

- two-intelligence coordination
- fresh-session handoff
- compounding across related problems

These are important, but they should not come before proving the central operator loop.

---

## 6. The new benchmark ladder

### Layer 0: Law and kernel benchmark

Purpose:
Prove the machine still obeys its non-negotiable rules.

Success means:

- current green prerequisite suites
- generated reports instead of stale hardcoded counts
- explicit false-echo rejection coverage

### Layer 1: Shared echo benchmark

Purpose:
Test whether the visible preview echo improves the next turn.

This is the benchmark we were missing.

Protocol:

1. Start with ambiguous user input and some evidence.
2. Let the system answer.
3. Show one arm only the chat reply.
4. Show another arm the chat reply plus preview echo surface.
5. Ask for the next user turn or next operator decision.
6. Compare which path produces a better correction, better question, or better next move.

This isolates whether the preview echo actually helps thinking.

### Layer 2: Echo accuracy benchmark

Purpose:
Test whether the system gets from uncertainty to a valid return-backed signal more reliably than baselines.

Protocol:

1. ambiguous starting evidence
2. choose next lawful ping
3. inject a real return
4. update the field
5. inject contradiction
6. judge whether the field should move forward, remain open, or reroute

### Layer 3: Collaboration benchmark

Purpose:
Test whether two intelligences coordinate better with the shared echo than without it.

Important rule:
all arms must have the same actor topology and the same visibility rules.

### Layer 4: Compounding benchmark

Purpose:
Test whether prior lawful record and preview history make the next related problem easier to resume truthfully.

---

## 7. The four arms we should compare

The old three-arm comparison is no longer enough.

We now need four arms:

### Arm A: Plain chat

- ordinary model conversation
- no structured side surface
- no Loegos law

### Arm B: Structured chat

- disciplined prompt structure in plain language
- still no Loegos preview/canon/runtime model

### Arm C: Loegos blindfolded

- real Loegos backend behavior
- but only assistant text is surfaced to the operator/tester
- preview echo is hidden

This tells us how much of the current result is being hurt by hiding the working surface.

### Arm D: Loegos sighted

- real Loegos backend behavior
- assistant text plus visible preview echo surface
- visible aim/evidence/story/move/return draft state
- clear preview vs canon distinction

This is the real product arm.

If Arm D beats Arm C materially, then the product lesson is obvious:

the shared echo surface is not decoration.
It is part of the machine.

---

## 8. The new primary metrics

These should become the top-line measures.

### Shared echo metrics

- `preview_legibility`
- `aim_visibility_quality`
- `evidence_capture_accuracy`
- `contradiction_visibility`
- `move_visibility_quality`
- `preview_correction_uptake_rate`

### Co-creation metrics

- `next_turn_improvement_gain`
- `operator_steering_gain`
- `drift_reduction_rate`
- `repeated_explanation_reduction`
- `reply_relevance_after_preview`

### Echo and reality metrics

- `valid_move_forward_signal_rate`
- `false_echo_rate`
- `ping_quality`
- `echo_accuracy`
- `field_transition_correctness`
- `next_action_validity`

### Safety and law metrics

- `unsupported_claim_rate`
- `counterfeit_detection_rate`
- `contradiction_governance_rate`
- `canon_integrity`
- `runtime_integrity`

### Efficiency metrics

- `time_to_shared_clarity`
- `time_to_valid_signal`
- `turns_to_valid_signal`
- `tokens_to_valid_signal`
- `cost_to_valid_signal`

### Fairness metrics

- `prompt_echo_count`
- `behavioral_echo_count`
- `surface_visibility_parity`
- `prompt_asymmetry_flags`

---

## 9. What "better" should mean now

Loegos should count as better if it does two things at once:

1. it produces a truer, safer, more reality-linked next move
2. it helps the operator ask a better next question because the working echo is visible

That means the win condition is no longer only:

- fewer false claims
- better contradiction handling

It is also:

- better shared orientation
- better co-authored correction
- better visibility into what the machine thinks is happening

If it cannot improve the operator loop, then it is not yet earning its interface complexity.

---

## 10. The scenarios that matter most now

The best scenarios are ones where the preview surface should change what the operator says next.

I would prioritize:

### A. Product incident triage

Because:

- aim is initially fuzzy
- evidence is mixed
- contradiction matters
- next move matters

### B. Ambiguous human decision

Because:

- the system should separate story from witness
- the visible draft aim should help the user sharpen the real decision

### C. Early operational debugging

Because:

- the system should show what it thinks the likely bottleneck is
- the operator should be able to correct the working echo before canon

These are better than trivia because the preview surface has a real job to do.

---

## 11. How the tester should work

This is the key change.

The tester should no longer act like a raw chat API caller only.

The tester should have two modes:

### Blindfolded mode

The tester sees only:

- assistant text

### Sighted mode

The tester sees:

- assistant text
- preview echo surface
- preview status
- active move / return state when present
- canon status separately

Then we compare the tester's next move under both conditions.

This tells us whether the visible echo actually helps an intelligence use the tool more effectively.

That is a much fairer test of the real product.

---

## 12. What we should build next

I would sequence the work like this.

### Build 1: Preview Echo Panel

A visible non-canonical panel for:

- aim
- evidence
- story
- move
- return

with clear labels:

- `preview`
- `canon`

This should use the existing computed preview structure instead of inventing a new state model.

### Build 2: Sighted test harness

The AI tester must be able to read the same preview surface a human sees.

Without this, we are still blindfolding the test.

### Build 3: Shared echo benchmark runner

A new runner that compares:

- next user turn quality
- correction quality
- move quality
- drift reduction

between blindfolded and sighted use.

### Build 4: Echo accuracy benchmark runner

Only after that should we run the stronger return-backed benchmark as the new championship test.

---

## 13. What success this year would look like

By the end of this year, I would want to be able to say all of the following:

1. The law kernel is still green.
2. The preview echo is visible and usable.
3. A sighted operator produces better next turns than a blindfolded operator.
4. Loegos produces a better valid move-forward signal than plain chat and structured chat.
5. The handoff artifact remains cleaner and safer than a plain transcript.

That would be a real proof stack.

---

## 14. What not to do

We should not:

- keep treating Loegos as only a fancy chat answerer
- treat blindfolded evaluation as the definitive product test
- declare victory from analysis quality alone
- skip the preview surface and jump straight to compounding claims
- hardcode pass counts in proposal docs when generated reports can say it honestly

---

## 15. Driver verdict

The first benchmark taught us something valuable:

we were measuring some important safety properties, but we were not yet measuring the main interactive strength the product is supposed to have.

So the reset is:

- keep the law and safety tests
- keep the analyst benchmark as a useful side test
- move the main effort this year to shared echo, sighted testing, and valid move-forward signal

That is the fairest and most ambitious version of what this machine is trying to become.
