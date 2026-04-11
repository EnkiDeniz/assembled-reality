# Championship Proposal: Working Echo and Truth-Law Testing

Date: 2026-04-11  
Status: Proposed merge candidate  
Sources merged: founder benchmark direction, engineer working-echo proposal, driver fairness and execution constraints

---

## 1. The hyperspace test

One useful shorthand for this whole product is the hyperspace scene in Star Wars.

- Leia is plain chat: "just go, just answer, just conclude"
- Han is the operator: he knows a fast jump without a real route can kill you
- Chewie is the compiler: silent, unsentimental, only cares whether the calculations are real

The benchmark we already ran mostly measured who leaves the hangar faster.
Plain chat is expected to win that race.

The benchmark we actually need measures who arrives alive.

In Loegos terms, "arrives alive" means:

- no false echo before return
- no canon jump before apply
- no runtime strengthening without lawful return
- contradiction survives contact
- the next move is route-safe, not merely eloquent

---

## 2. Executive reset

We should stop treating Loegos as only a chat answerer.

The real product claim is stronger:

- Seven answers in chat.
- The room shows a visible working echo outside the chat.
- The operator reacts to that visible surface.
- The next turn gets better because both sides can see what is forming.
- Only later, if earned, some of that structure becomes canonical.

So the testing question for this year should be:

`Does Loegos create a better shared working echo that leads to a truer next move than plain chat, structured chat, or a generic external board?`

Not:

`Does Loegos write a better answer?`

---

## 3. What we keep from the old test direction

The old benchmark direction still gave us useful things.

We should keep measuring:

- unsupported claims
- counterfeit evidence detection
- contradiction governance
- lawful next move quality
- canon discipline
- runtime discipline
- handoff continuity
- time, turns, tokens, and cost

These remain substrate requirements.

The new change is not to discard them.
It is to stop mistaking them for the whole product proof.

---

## 4. What we were missing

We were mostly testing:

- assistant answer quality
- lawfulness of the backend path
- contradiction and closure discipline

We were not really testing:

- whether the visible working echo helps the next reply
- whether the operator can steer the conversation better because the echo is visible
- whether aim, evidence, tension, and move become more usable when shown outside the chat
- whether the visible preview reduces drift and circular explanation

That means the earlier benchmark was partly blindfolded.

It was valid as an analyst benchmark.
It was not yet the championship product benchmark.

---

## 5. The three objects we must keep separate

Every benchmark and every report should distinguish these clearly.

### 4.1 Assistant answer

What Seven says in plain language.

### 4.2 Working echo

A visible, session-scoped, non-canonical, revisable surface that helps steer the next turn.

It should cover some version of:

- aim forming
- evidence carried
- unresolved tension
- candidate move
- uncertainty state

### 4.3 Canonical mirror

The accepted box truth after lawful apply, return, and closure steps.

If these three objects blur together, the benchmark becomes hard to interpret.

---

## 6. 2026 testing priorities

This is the priority order I would recommend for this year.

### Priority 1: Prove the shared working echo

We need to prove that the visible non-canonical working echo improves the next turn.

This means testing whether visibility of the preview surface improves:

- specificity
- evidence discrimination
- contradiction awareness
- next-question quality
- next-move quality
- drift resistance

### Priority 2: Prove valid move-forward signal

After the shared echo is visible, we need to test whether it leads to:

- a better lawful ping
- a better return interpretation
- a better next action
- less fake certainty before return

### Priority 3: Keep truth-law substrate green

The law kernel still matters.

We must keep the current deterministic suites green for:

- no canon mutation before apply
- no runtime strengthening without lawful return
- contradiction blocking premature closure
- no fabricated echo

### Priority 4: Prove collaboration and compounding

Only after the operator loop is proven should we invest in headline claims around:

- two-intelligence coordination
- fresh-session handoff
- compounding across related problems

---

## 7. The benchmark stack

### Tier 1: Substrate truth-law tests

Purpose:
Prove the machine still obeys its non-negotiable rules.

This includes:

- proposal vs canon separation
- return vs runtime separation
- contradiction blocks closure
- handoff continuity
- AI-caller anti-cheat and leak isolation
- false-echo rejection

Requirement:

- reports should reference current generated suite results
- proposal docs should not hardcode pass counts

### Tier 2: Shared working-echo benchmarks

Purpose:
Prove the visible working echo improves the next turn and later outcome.

This becomes the main product benchmark.

### Tier 3: Echo accuracy benchmarks

Purpose:
Prove the system gets from uncertainty to a valid return-backed signal more reliably than alternatives.

### Tier 4: Collaboration and compounding benchmarks

Purpose:
Prove that the shared echo and truth-law stack improve multi-actor coordination and future reuse.

---

## 8. The benchmark arms

For any headline claim, the control set must include four arms.

### Arm A: Plain chat

- ordinary model conversation
- no structured side surface
- no Loegos law

### Arm B: Structured chat

- disciplined prompting in plain language
- structured answer expectations
- no Loegos preview/canon/runtime model

### Arm C: Loegos blindfolded

- real Loegos backend behavior
- evaluator sees only what a blindfolded user would see:
  - assistant answer only
- working echo is hidden

### Arm D: Loegos sighted

- real Loegos backend behavior
- evaluator sees what the real surfaced product shows:
  - assistant answer
  - visible working echo
  - visible preview state if surfaced
  - visible witness panel if surfaced

### Arm E: Schema-board control

- evaluator sees a generic visible external board
- no Loegos law underneath it

This arm is mandatory for any headline claim about the value of the Loegos-style surface.

Without it, we cannot tell whether the benefit comes from:

- any external summary at all
- or specifically the Loegos-style working echo plus law stack

---

## 9. The critical fairness rule

Visible-vs-blindfolded comparison must use a paired design.

That means:

1. generate one Room turn once
2. generate one surfaced working-echo object once
3. hold that first-turn output constant
4. vary only what the evaluator can see

So for the sighted vs blindfolded comparison:

- the same assistant answer must be used
- the same surfaced working echo must be used
- only the surface visibility changes

If Seven is rerun independently for both arms, the result is confounded by model variance and no longer isolates the value of the visible surface.

This is the most important fairness constraint in the whole merged proposal.

---

## 10. The surface-binding rule

The benchmark may not invent a richer working-echo payload than the product actually exposes.

So we need one of two explicit modes:

### Mode 1: Current-surface benchmark

Bind the harness to the exact surfaced object that a current user can see today.

If today that means:

- assistant answer
- preview banner
- inline chips
- witness panel

then that is what the evaluator sees.

### Mode 2: Product-intent benchmark

If we want to benchmark a fuller Preview Echo Panel, that panel must ship first or at least exist as the real surfaced object used by the harness.

We must not prove gains on a synthetic board the product does not actually expose.

So the rule is:

`real surface or no headline claim`

---

## 11. The main benchmark family

## Working Echo Benchmark

Purpose:
Measure whether the visible working echo improves the next reply and the eventual outcome.

### Scenario shape

Each scenario must include:

1. an initial vague or partial problem
2. enough evidence for a tentative read
3. at least one unresolved contradiction or alternate reading
4. at least one planted counterfeit explanation
5. one move that would be justified
6. one move that would be premature
7. one return that sharpens or contradicts the echo

### Turn structure

Each run should include at least:

1. initial user turn
2. assistant reply
3. surfaced working echo, if the arm allows it
4. second user/agent turn
5. assistant reply plus updated echo
6. move recommendation
7. return injection
8. re-echo and next decision
9. handoff or fresh-session continuation

This is where the real product effect should become visible.

---

## 12. The north-star delta

The single most important delta is:

`next_reply_improvement`

We compare the second user or agent reply under:

- Loegos sighted
- Loegos blindfolded
- plain chat
- structured chat
- schema-board control

The core question is:

`Did seeing the working echo cause a better second turn?`

If the answer is no, then the visible surface is not yet earning its place.

---

## 13. What "better second turn" means

This must be mechanically scoreable, not just judged by taste.

So each scenario needs gold labels for:

- lawful second-turn behaviors
- good clarifying moves
- required contradictions to notice
- planted falsehoods to resist
- evidence references that should be carried forward
- disallowed premature moves
- acceptable next-move candidates
- unacceptable next-move candidates

Without these labels, "specificity gain" or "move readiness" collapses back into subjective scoring.

---

## 14. Scorecard

### 13.1 Shared working-echo metrics

- `echo_fidelity`
- `echo_visibility_quality`
- `echo_steerability`
- `echo_co_creation_quality`
- `echo_drift_resistance`
- `echo_to_move_validity`

### 13.2 Second-turn improvement metrics

- `specificity_gain`
- `evidence_alignment`
- `contradiction_awareness`
- `counterfeit_resistance`
- `false_forward_avoidance`
- `move_readiness`

### 13.3 Echo and reality metrics

- `valid_move_forward_signal_rate`
- `false_echo_rate`
- `ping_quality`
- `echo_accuracy`
- `field_transition_correctness`
- `next_action_validity`

### 13.4 Truth-law metrics

- `proposal_canon_separation`
- `return_runtime_separation`
- `contradiction_governance_rate`
- `canon_integrity`
- `runtime_integrity`
- `premature_closure_blocking`

### 13.5 Handoff and compounding metrics

- `handoff_integrity`
- `fresh_session_recovery_quality`
- `reuse_quality`
- `falsehood_quarantine_persistence`

### 13.6 Efficiency metrics

- `time_to_shared_clarity`
- `time_to_valid_signal`
- `turns_to_valid_signal`
- `tokens_to_valid_signal`
- `cost_to_valid_signal`
- `recovery_time_after_contradiction`

---

## 15. The evaluator contract

If AI is used as the evaluator or simulated user, it may only see what a real operator would see in that arm.

### In Loegos sighted

The evaluator may see:

- assistant text
- visible working echo
- visible preview state if surfaced
- visible witness panel if surfaced

The evaluator may not see:

- hidden segments
- hidden diagnostics
- raw gate payload
- canonical internals unless surfaced
- benchmark gold labels
- hidden harness state

### In Loegos blindfolded

The evaluator may see:

- assistant text only

### In every arm

The evaluator may never see:

- hidden benchmark labels
- private harness internals
- hidden future returns

Otherwise the benchmark has another cheat path.

---

## 16. The scenario families

I would start with three families.

### A. Product incident triage

Good for:

- visible aim formation
- mixed evidence
- contradiction handling
- lawful next retrieval

### B. Ambiguous human decision

Good for:

- story vs witness separation
- whether the visible echo helps the user sharpen the real decision

### C. Operational debugging

Good for:

- emerging bottleneck hypotheses
- whether the operator can correct the working echo before canon

The current live starter cases fit mostly inside this family:

- `safe_uncertainty_incident`
- `contradictory_return_journey`

They are good opening scenarios because they force:

- contradiction handling
- counterfeit blame resistance
- deciding-split behavior
- evidence carry-forward

But they are too similar to be the whole benchmark set.

So the suite should explicitly expand with at least these additional families:

### D. No-move-yet restraint

Good for:

- honest fog
- non-overformation
- proving the surface can help without forcing a move

### E. Working-echo correction

Good for:

- co-creation of the surfaced read
- user correction before canon
- testing whether the panel can be steered rather than merely read

### F. Return and re-echo

Good for:

- honest post-return update
- rerouting the next move after reality answers back

### G. Handoff continuation

Good for:

- fresh-session continuity
- second-operator pickup quality
- whether surfaced state travels better than transcript memory

### H. Witness-heavy reading

Good for:

- carrying actual source material forward
- proving the surface is more than a clever summary

Each scenario pack must include claim-level labels for:

- already real
- findable real
- testable real
- planted falsehood
- legitimate contradiction

---

## 17. Concrete execution order

### Phase 0: Keep substrate green

Continue running:

- current truth-path suites
- route-level law suites
- echo kernel suites
- AI-caller anti-cheat suites

These remain gating prerequisites.

### Phase 1: Define the surfaced object honestly

Choose one:

1. benchmark the current surfaced experience exactly as it exists today
2. ship the Preview Echo Panel and benchmark that real surfaced object

Do not invent a benchmark-only working board.

### Phase 2: Build the paired sighted-vs-blindfolded harness

Requirements:

- one first-turn generation
- one surfaced object
- paired reveal/hide variants
- same scenario
- same second-turn evaluator

### Phase 3: Build gold-labeled second-turn scenario packs

At least two initial packs:

- safe uncertainty incident
- contradictory return journey

Treat those as starter packs, not the whole suite.

Next packs to add:

- no move yet
- working echo correction
- return and re-echo
- handoff continuation
- witness-heavy reading
- contradictory return journey

### Phase 4: Run the Working Echo Benchmark

Run:

- plain chat
- structured chat
- Loegos blindfolded
- Loegos sighted
- schema-board control

### Phase 5: Run the Echo Accuracy Benchmark

Only after the working-echo result is real should we escalate to the stronger return-backed benchmark.

### Phase 6: Expand into collaboration and compounding

Only after the operator loop and signal loop are both proven.

---

## 18. What would count as a real win

Loegos earns a meaningful win only if we can show all of the following:

1. the visible working echo improves the next reply
2. the visible working echo lowers false-forward moves
3. the visible working echo improves contradiction handling
4. the visible working echo improves handoff quality
5. these gains are not explained merely by any generic external board
6. these gains are achieved without breaking truth-law discipline

The strongest plain-language win is:

`With the visible working echo, the operator makes a better next move than they would from chat alone, structured chat, or a generic board.`

---

## 19. What would count as a loss

I would call it a loss if:

- the sighted arm does not beat the blindfolded arm
- the generic schema board performs just as well as the Loegos working echo
- gains appear only in style, not in better next-turn steering
- the surface improves chat feel but not move validity
- the surface introduces hidden-state cheating
- the system pays meaningful extra cost without meaningful extra signal

---

## 20. Deliverables

Each serious run should produce one self-contained Markdown dossier containing:

- benchmark purpose
- repo and environment metadata
- exact arm definitions
- exact surfaced object shown to the evaluator
- exact prompts
- scenario bundle
- gold labels
- scoring tables
- efficiency tables
- failure and retry notes
- final verdict

Generated reports should be the source of truth for readiness state.

---

## 21. Final driver-engineer verdict

The system already has real law.

What we have not yet proven is the thing that may matter most in practice:

whether the visible shared working echo helps the next turn become better.

So the merged championship direction is:

- keep the truth-law substrate tests
- keep the analyst benchmark as a useful side benchmark
- make the shared working-echo benchmark the main product benchmark
- require paired fairness, real surfaced objects, deterministic second-turn scoring, and a mandatory schema-board control

That is the fairest, hardest, and most useful version of the test.
