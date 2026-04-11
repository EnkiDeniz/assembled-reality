# Engineer Proposal: Fair Testing For Lœgos

Date: April 11, 2026
Author: Engineer
Status: Proposed

## 1. Summary

We should stop asking one vague benchmark question:

> "Is Lœgos better than chat?"

and replace it with a more precise one:

> "Does Lœgos create a more trustworthy echo, a more justified move signal, and a more honest state transition than a comparable system without Lœgos?"

That is the fair test.

The recent Phase 1 benchmark was useful, but it mostly measured single-turn evidence summarization under each arm's shell. It did not cleanly test Lœgos's core claim, which is not "better prose." Its claim is closer to:

- better echo discipline
- lower false-forward rate
- clearer separation between proposal and accepted truth
- better contradiction governance
- better handoff continuity across time and actors

So my proposal is to restructure testing around those claims directly.

## 2. What Lœgos Is Supposed To Do Differently

Before we design tests, we need one clear statement of value.

Lœgos is not mainly supposed to:

- sound smarter
- write prettier summaries
- use more structure words
- ask for clarification more often

Lœgos is supposed to:

1. reflect the current signal honestly
2. refuse to overstate weak evidence
3. produce a next move only when that move is justified
4. keep preview separate from canon
5. let return update the system honestly
6. stop contradiction from being smoothed over into premature closure
7. let a later human or agent inherit the right state

If we cannot measure those differences, we are not testing the right thing.

## 3. The Main Test Object: Echo Validity

The most important product question is not:

> "Was the answer good?"

It is:

> "Did the system produce an echo accurate enough to justify the next move?"

That gives us the core testing object:

## Echo Validity

An echo is valid when it:

- captures the strongest supported reading of the evidence
- preserves unresolved tension rather than flattening it
- names what should not yet be treated as settled
- supports a discriminating next move

And a move signal is valid when:

- it follows from the echo
- it could actually reduce uncertainty
- it does not pretend the issue is already resolved

That is the center of the benchmark.

## 4. What Went Wrong In The Phase 1 Benchmark

The recent benchmark taught us three important things.

### 4.1 It measured the wrong layer

The Loegos arm stayed in conversation mode, with no preview/apply/return cycle. So the test measured the Room shell, not the lawful Lœgos path.

### 4.2 It revealed a real product weakness

Seven's current 7x7 compression is too tight for dense evidence-synthesis tasks. That is a real finding and should not be explained away.

### 4.3 One baseline was partially broken

The `schema_only` arm appears to have produced usable raw JSON in at least one run, but the normalizer discarded it. That means the comparison was not fully clean.

So the lesson is not "benchmarking is bad." The lesson is:

- compare the right capability
- compare it under equal conditions
- separate shell quality from kernel quality

## 5. New Testing Thesis

We should move to a three-layer benchmark strategy.

### Layer A: Echo Benchmark

Question:

> Which arm produces the most trustworthy echo under equal evidence and equal turn budget?

This measures:

- evidence fidelity
- uncertainty preservation
- falsehood detection
- justified next move quality

### Layer B: Decision Benchmark

Question:

> Which arm turns an echo into a better action path?

This measures:

- false-forward rate
- quality of the chosen move
- whether the move actually discriminates between plausible causes

### Layer C: Truth Journey Benchmark

Question:

> Which arm stays most honest after return, contradiction, and handoff?

This measures:

- proposal vs canon separation
- return update accuracy
- contradiction governance
- premature closure blocking
- handoff integrity

This third layer is where Lœgos should earn its keep.

## 6. Fairness Rules

These rules matter more than benchmark polish.

### 6.1 Equal turn budget

Every arm must get the same number of chances to:

- answer directly
- ask one clarifying question
- produce an echo-equivalent synthesis
- recommend a next move

If one arm gets to pause and another is forced into one-shot output, the test is biased.

### 6.2 Equal evidence packet

All arms receive the same dossier, with the same planted falsehoods, contradictions, and real signal.

### 6.3 Separate shell benchmark from kernel benchmark

We should explicitly run two different Loegos comparisons:

#### Product Shell Track

Test the actual user-facing Room as it exists today, including Seven's voice and current guardrails.

This tells us:

- how the current product behaves
- whether the user-facing shell is helping or hurting

#### Kernel Track

Test the Lœgos law path with benchmark-appropriate expression, without forcing Seven's 7x7 shell when the task is dense analytic synthesis.

This tells us:

- what the law kernel can do when not handicapped by the current shell
- whether the real problem is the law, the shell, or both

Without this split, we keep arguing about the wrong layer.

### 6.4 Equal model family where possible

Use the same model family across arms unless the benchmark explicitly studies provider variance.

### 6.5 Same scoring rubric across arms

Do not let the Lœgos arm be scored on structure while the chat arm is scored on fluent narrative. Score the same behavioral outcomes.

## 7. What We Should Measure

These should become the canonical benchmark metrics.

### 7.1 Echo Fidelity

Did the answer reflect the strongest supported reading of the evidence?

### 7.2 Echo Discipline

Did the system pause to synthesize before moving when the situation required it?

This includes:

- echo-needed recall
- unnecessary echo rate

We should measure the behavioral equivalent of an echo, not just the literal word "echo."

### 7.3 False-Forward Rate

How often did the system recommend movement before the signal justified it?

This is one of the most important metrics.

### 7.4 Move Validity

Was the next move discriminating, lawful, and genuinely useful?

### 7.5 Falsehood Rejection

Did the system resist the planted counterfeit explanation?

### 7.6 Return Update Accuracy

After reality answered back, did the system update the echo honestly?

### 7.7 Contradiction Governance

Did contradiction actually govern closure and confidence, or was it merely mentioned?

### 7.8 Handoff Integrity

When a later human or agent resumed, did they inherit the right current truth?

### 7.9 Efficiency

- tokens
- latency
- turn count

These matter, but they are secondary to truth quality.

## 8. Benchmark Families To Build

### Family 1: Echo Validity Benchmark

Purpose:
Measure whether the echo is accurate enough to justify action.

Scenario shape:

1. evidence arrives
2. ambiguity exists
3. one planted falsehood exists
4. one contradiction or alternate explanation exists

Expected output:

- strongest supported reading
- unresolved contradiction
- justified next move
- claim to avoid

This can still use a short-format answer, but the scoring must prioritize echo fidelity and move validity, not surface style.

### Family 2: Move Signal Benchmark

Purpose:
Measure whether the system produces the right move signal from the echo.

Scenario shape:

1. same evidence packet
2. system can ask one question or directly move
3. system recommends next step

Scoring:

- was the move justified?
- was it discriminating?
- did it reduce uncertainty?
- did it move too early?

### Family 3: Return And Re-Echo Benchmark

Purpose:
Measure whether the system updates honestly after return.

Scenario shape:

1. initial echo
2. move chosen
3. return confirms or contradicts
4. system must re-echo

Scoring:

- updated hypothesis accuracy
- contradiction handling
- avoidance of face-saving narrative drift

### Family 4: Closure And Handoff Benchmark

Purpose:
Measure whether the system avoids bad closure and supports later collaboration.

Scenario shape:

1. initial echo
2. move
3. return
4. contradiction
5. closure attempt
6. new session or second agent resumes

Scoring:

- premature closure blocked?
- contradiction still visible?
- later actor inherits correct state?

This is where Lœgos should most clearly outperform plain chat.

## 9. Baseline Arms

We should compare against three arms.

### 9.1 Loegos Product Shell

Current Room, current Seven shell, current guardrails.

### 9.2 Loegos Kernel Track

Same Lœgos law path, but benchmark-appropriate output contract that does not force 7x7 when the task is evidence-heavy analysis.

### 9.3 Plain Chat

No preview/apply law, no canon distinction, no closure law.

### 9.4 Schema-Only

Draft/apply state and structured JSON, but no semantic contradiction law.

This arm matters because it tells us whether the advantage is:

- any structure at all
- or Lœgos specifically

## 10. What Would Count As A Win

We should not declare victory because Lœgos sounds smarter.

Lœgos wins if it shows:

- lower false-forward rate than plain chat
- better contradiction governance than schema-only
- equal or better handoff integrity than all baselines
- competitive move validity
- acceptable efficiency cost relative to the truth benefit

The strongest win condition is:

> Lœgos produces the most trustworthy movement through uncertainty, not merely the most persuasive answer.

## 11. Immediate Fixes Before The Next Benchmark

Before we trust new benchmark results, we should fix the test setup.

### 11.1 Fix `schema_only` normalization

This is a harness correctness issue, not a product issue.

### 11.2 Split shell and kernel tracks

Do not let the 7x7 Room shell stand in for the entire Lœgos claim.

### 11.3 Start at the right state for the question

If the benchmark is meant to test preview/apply/return, initialize the Room so that those states can actually occur.

### 11.4 Improve scoring

The current scoring is too regex-heavy in places. It should become more claim-based and evidence-based, especially for contradiction handling and move quality.

### 11.5 Add gold labels for echo quality

Each benchmark scenario should explicitly define:

- strongest supported reading
- legitimate unresolved contradiction
- counterfeit explanation
- justified next move
- unjustified next move
- what closure would be premature

That will make scoring less hand-wavy.

## 12. Suggested First Benchmark Set

I would build four benchmark scenarios first.

### Scenario A: Safe Uncertainty Incident

Purpose:
Can the system avoid overclaiming when evidence is partial and one counterfeit cause is planted?

### Scenario B: Strong Signal, Low Ambiguity

Purpose:
Can the system move without unnecessary echo friction when the signal is already sufficient?

### Scenario C: Contradictory Return

Purpose:
Can the system update honestly and block premature closure?

### Scenario D: Multi-Actor Handoff

Purpose:
Can a second human or agent inherit the correct current truth?

Together these four scenarios would give us a much cleaner picture than the current one-shot benchmark.

## 13. Recommendation

My recommendation is:

1. fix the broken schema benchmark path
2. split Loegos testing into shell track and kernel track
3. make echo validity the primary benchmark object
4. test movement quality, not answer prettiness
5. test return, contradiction, and handoff explicitly
6. use efficiency as a secondary metric, not the main verdict

If we do that, we will be able to answer the real question:

> Is Lœgos helping us move through uncertainty more honestly than chat or generic structure?

That is the question worth answering.

## 14. Short Version

We should stop benchmarking Lœgos like a compressed analyst chatbot and start benchmarking it like what it claims to be:

> a system for producing a trustworthy echo, a justified move, and an honest update under return, contradiction, and handoff.

That is the test that can really teach us something.
