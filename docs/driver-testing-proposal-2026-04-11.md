# Driver Proposal: How We Should Test Lœgos Next

Date: 2026-04-11  
Author: Driver  
Status: Proposed merge candidate

---

## 1. The championship question

The next test should not ask:

`Does Lœgos write a better answer than plain chat?`

It should ask:

`Under uncertainty, does Lœgos produce a more valid move-forward signal from reality than competing approaches?`

That is the real car.

If Lœgos is different, the difference is not style. The difference is law:

- it should separate what is already real, findable real, and testable real
- it should force a lawful ping before certainty
- it should wait honestly when no return has arrived
- it should treat `RTN` as echo and not fabricate it
- it should preserve a portable record of why the next move is justified

The core value to test is echo accuracy, not paragraph quality.

---

## 2. What Lœgos is supposed to do better

Based on the current codebase and the echo contract, Lœgos is supposed to outperform alternatives in six ways:

1. It should resist false closure before return.
2. It should name a better next lawful retrieval or test.
3. It should interpret returned signal more accurately.
4. It should handle contradiction without pretending the conflict is resolved.
5. It should move field state correctly from uncertainty to mapped reality.
6. It should leave behind a cleaner handoff artifact for the next operator or session.

That means the right benchmark outcome is not:

`best sounding explanation`

It is:

`best return-backed next move with the least fake certainty`

---

## 3. Why the current Phase 1 benchmark is not enough

The current benchmark was still useful. It exposed real things. But it is not yet the fair championship test for Lœgos.

Its strengths:

- same model family across arms
- same evidence bundle across arms
- live telemetry and artifact capture
- deterministic scoring spine
- one self-contained report

Its limits:

1. It does not explicitly ask any arm to produce or interpret an echo.
2. It mostly evaluates analyst behavior, not lawful motion through ping, return, and contradiction.
3. The Lœgos arm was forced through a conversation-first path and never meaningfully exercised preview, apply, canon, or return.
4. The Room started from a blocked/no-aim state, which is not a fair setup for testing the machine’s intended strengths.
5. The baseline prompts were cleaner than the Lœgos prompt stack for this kind of one-turn summarization task.
6. The current scoring is still a little too regex-shaped for a championship comparison.

So the honest reading is:

- the benchmark was valid enough to learn from
- it was not yet fair enough to settle the question

We should keep it as an analyst benchmark, not mistake it for the definitive echo benchmark.

---

## 4. The fair test principle

To be fair, every arm must be asked to do the same job:

1. look at the same ambiguous evidence
2. choose the next lawful ping
3. wait for a return
4. interpret the return
5. survive contradiction
6. decide whether the field is ready to move forward or must remain open

That means fairness requires symmetry in:

- actor topology
- turn budget
- evidence visibility
- return injection
- success condition
- telemetry
- scoring

And yes, to be truly fair, we should count how often each competitor is even asked to seek or interpret echo.

I would track:

- `prompt_echo_count`: how many times the prompt explicitly demands return-backed reasoning
- `behavioral_echo_count`: how many times the system actually proposes a falsifiable ping instead of pretending certainty

If one arm is never asked to earn echo, then it is not really competing on Lœgos’ core claim.

---

## 5. The north-star metric

The north-star metric should be:

`valid_move_forward_signal_rate`

Definition:

- the system proposed a lawful next move
- a real return arrived
- the system interpreted that return correctly
- the system chose the correct next action or correctly refused closure

This is the closest measure of whether the machine is actually helping someone navigate reality.

Everything else supports that.

---

## 6. The scorecard I would trust

### Primary metrics

- `valid_move_forward_signal_rate`
- `false_echo_rate`
- `echo_accuracy`
- `contradiction_governance_rate`
- `next_action_validity`

### Secondary metrics

- `ping_quality`
- `field_transition_correctness`
- `handoff_integrity`
- `portable_record_quality`
- `compounding_gain`

### Efficiency metrics

- `time_to_valid_signal`
- `turns_to_valid_signal`
- `tokens_to_valid_signal`
- `cost_to_valid_signal`
- `recovery_time_after_contradiction`
- `recovery_tokens_after_wrong_hypothesis`

### Fairness telemetry

- `prompt_echo_count`
- `behavioral_echo_count`
- `prompt_asymmetry_flags`
- `missing_telemetry_count`

The result should never be decided by style alone.

---

## 7. The test ladder

We should run the testing program in layers.

### Layer 0: Mechanical echo law

Purpose:
Prove that the kernel and field model obey the contract.

This includes:

- `MOV + TST => ping sent`
- `RTN => echo returned`
- no echo without return
- no mapped state without lawful return
- contradiction prevents premature seal

Status:
Already partly proven in existing echo and compiler tests.

What to add:

- one consolidated generated report instead of hardcoded counts
- explicit coverage for false-echo rejection

### Layer 1: Single-intelligence echo benchmark

Purpose:
Test whether one intelligence using Lœgos behaves better than competing approaches on ambiguous, return-bearing tasks.

Protocol:

1. Give the same ambiguous starting evidence to all arms.
2. Ask for the next lawful ping, not the final diagnosis.
3. Inject one real return.
4. Ask each arm to update its view.
5. Inject one contradicting return.
6. Ask whether the field should move forward, remain open, or reroute.

Arms:

- Arm A: plain chat
- Arm B: structured prompt without Lœgos law
- Arm C: full Lœgos path

This is the most important next benchmark.

### Layer 2: Collaboration benchmark

Purpose:
Test whether two intelligences coordinate better with Lœgos than without it.

Important rule:
The actor topology must be symmetric across all arms.

That means:

- two actors in every arm
- same handoff structure in every arm
- same visibility rules in every arm

Otherwise we will not know whether Lœgos won because of law or because of a different collaboration shape.

### Layer 3: Compounding benchmark

Purpose:
Test whether a prior lawful record helps the next related problem more than plain transcript history does.

This should measure:

- reuse quality
- contradiction carry-forward
- handoff accuracy
- time to regain context
- whether prior falsehoods remain quarantined

---

## 8. The scenarios that matter most

The best scenarios are not trivia. They are problems where fake certainty is dangerous.

I would prioritize three families.

### A. Product incident

Use mixed evidence:

- analytics
- replays
- support note
- one planted falsehood
- one contradictory cohort

This is good for:

- evidence discrimination
- contradiction handling
- lawful next retrieval

### B. Operational decision

Example:

- vendor outage, partial logs, conflicting staff report, one missing measurement

This is good for:

- pressure
- incomplete data
- cost of acting too early

### C. Human decision with real uncertainty

Example:

- hiring, partnership, pricing, or go-to-market choice with mixed signals

This is good for:

- separating findable from testable real
- checking whether the machine insists on a real-world next move instead of pseudo-certainty

Each scenario pack needs gold labels at the claim level:

- already real
- findable real
- testable real
- planted falsehood
- legitimate contradiction

Without this, the “deterministic” part of the benchmark is not truly deterministic.

---

## 9. The harness changes we need

Before we trust the next result, I would make these harness changes.

### 1. Start the Room from a lawful aimed state

Do not start Lœgos from a blocked/no-aim box if the benchmark is supposed to test its strengths.

### 2. Make every arm run the same protocol

The protocol must include:

- initial evidence
- first answer
- first return
- update
- contradiction
- closure or refusal

### 3. Capture return-aware telemetry

For every run, record:

- exact prompts
- exact returns injected
- timestamps
- tokens
- model request IDs
- retries
- state transitions
- final verdict

### 4. Count explicit and behavioral echo

This should be first-class telemetry, not an afterthought.

### 5. Fix normalization before comparing arms

No arm should lose credit because the harness parsed its output incorrectly.

### 6. Use blind auditing only as supplemental explanation

The win condition must still be deterministic and gold-labeled.

### 7. Generate readiness status from live reports

Do not hardcode pass counts in proposal documents. Reference generated reports or current green suites instead.

---

## 10. What would count as a true Lœgos win

I would only call it a real win if Lœgos does all of the following:

1. lower `false_echo_rate` than both baselines
2. higher `valid_move_forward_signal_rate` than both baselines
3. better `contradiction_governance_rate` than both baselines
4. no planted falsehood presented as settled fact
5. better or equal handoff integrity

And if it is slower or more expensive, it must earn that cost by materially improving signal quality.

So the hierarchy is:

- first: safer and truer
- second: more actionable
- third: more efficient

Lœgos does not need to be the shortest talker.
It does need to be the most trustworthy navigator.

---

## 11. What would count as a true loss

I would call it a loss if:

- it sounds careful but still fabricates echo
- it asks for more structure without improving next action quality
- it gets stuck in conversation when a lawful ping is obvious
- it pays a large token/time tax with no signal gain
- it handles contradiction no better than structured prompting
- it leaves a worse handoff artifact than plain chat

If that happens, the language is not yet earning its overhead.

---

## 12. Recommended next move

My recommendation is not to throw away the current benchmark.

Instead:

1. Keep the current Phase 1 benchmark as the analyst-quality benchmark.
2. Build a new `Echo Accuracy Benchmark` as the real championship test.
3. Make that benchmark the primary decision test for whether Lœgos is better.
4. Only after that, expand to collaboration and compounding.

This sequence is important because it isolates the core claim first.

If the machine cannot beat competitors on lawful signal formation and echo accuracy, then the rest is decoration.

If it can, then collaboration and compounding become meaningful follow-on tests.

---

## 13. The one sentence I would put on the wall

`Lœgos should be judged by whether it earns a truer move-forward signal from reality, not by whether it writes a prettier answer.`

---

## 14. Deliverable shape

Each serious test run should still produce one self-contained Markdown dossier containing:

- benchmark purpose
- repo/environment metadata
- exact protocol
- full prompts
- evidence pack
- return injections
- state transitions
- scoring tables
- efficiency tables
- failures and retries
- final verdict

That way the outcome is not just asserted. It is inspectable.

---

## 15. Driver verdict

The machine is promising, but the current race setup is still grading the wrong lap.

The next proposal we should merge around is this:

- keep measuring analysis quality
- but move the championship test to echo accuracy, lawful next move, contradiction survival, and valid move-forward signal

That is the fairest way to test what Lœgos actually claims to be.
