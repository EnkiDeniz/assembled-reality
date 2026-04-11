# Working Echo Build And Test Proposal

Date: April 11, 2026  
Author: Engineer  
Status: Active next-wave proposal  
Purpose: Define the next build-first sequence now that Test Drive II is real, green under the current rules, and honest about where the remaining weakness lives.

---

## 1. Executive Summary

The next wave should stay in Test Drive II.

We do **not** need a bigger benchmark yet.
We need a sharper machine.

The latest clean run already answered the existence question:

- the visible working echo matters
- `loegos_sighted` is the official winner under the current acceptance rules
- the remaining miss is not law or judgment
- the remaining miss is explicit evidence carry-forward, especially in honest fog

So the next build goal is:

**turn the current working echo from a real steering surface into the clearest evidence-and-decision surface on the road.**

The updated product loop is:

**Aim -> Echo -> Split -> Witness/Test -> Return -> Receipt -> Re-aim -> Canon**

That means the next wave is not only about making the echo more visible.
It is about making the visible surface show how aim and reality are shaping each other.

---

## 2. The Current Truth

The latest clean Test Drive II run says:

- benchmark valid: `yes`
- headline valid: `yes`
- official winner: `loegos_sighted`
- strongest remaining raw-score control: `schema_board` at `85`
- `loegos_sighted` raw mean: `81.25`

The most important gains are already real:

- `contradictory_return_journey`: `90` vs `65` blindfolded
- `working_echo_correction`: `85` vs `55` blindfolded

The clearest remaining miss is also real:

- `no_move_yet`: `65` vs `65` blindfolded, while `schema_board` reaches `80`

So the next question is not:

> does the visible echo matter?

It is:

> what kind of echo becomes better than excellent structured chat and the best external board?

---

## 3. The 911 Prioritization Rule

Treat the next wave like a driver's-car tuning pass.

### North stars

- steering feel
- braking
- road contact
- reality loop
- proof travel

### Guardrails, not goals

- lowest token count
- fastest first answer
- prettiest prose
- quietest interface
- softest friction

If a change does not make the operator steer better, trust the return more, or carry proof more cleanly, it is probably secondary right now.

---

## 4. What We Should Build Next

This wave should focus on five things, in order.

### 4.1 Make `whatWouldDecideIt` brutally strong

This is the steering rack.

The field should become sharper about:

- the one deciding split
- the one missing witness
- the one artifact that would actually separate the reads

Especially in `no_move_yet`, this field must say why the right move is still restraint.

### 4.1b Put aim back in the visible loop

The working echo should not treat aim as optional background.

It should show:

- what the current aim seems to be
- how loose or settled that aim is
- how the latest evidence or return changed the aim

Without that, the system can steer locally while still leaving the larger shot implicit.

### 4.2 Make evidence harder, not prettier

The current echo is too good at gist and not yet good enough at receipts.

The next pass should improve:

- `supports`
- `weakens`
- `missing`

And it should carry more explicit handles and provenance, not just cleaner phrasing.

### 4.3 Make return shifts unmistakable

The visible echo should show, in plain terms:

- what changed after return
- what earlier read weakened
- what part of the aim moved
- what next move changed

The operator should not have to infer the reroute from a softer summary.

### 4.4 Add lightweight correction

The working echo is strongest when it becomes a joint steering surface.

The first correction pass should stay lightweight:

- clarify a misweighted item
- reject a weak read
- sharpen the deciding split

Without mutating canon directly.

### 4.5 Prepare bounded proof and advisory roles

These stay future-facing for the moment, but the contract should keep room for them:

- GetReceipts as proof status, portability, and scrutineering
- Shape Library as bounded advisory for deciding split, receipt condition, and disconfirmation

Neither should become another authority mouth.

---

## 5. What We Should Not Chase Yet

Do not spend the next wave on:

- shaving a few hundred tokens for its own sake
- making the echo softer or more conversational
- broadening Test Drive III before Test Drive II is clearly ours
- generic chat polish
- hiding uncertainty to feel smoother

Those are guardrails, not the current lap.

---

## 6. Concrete Build Tracks

### Track A: Stronger evidence map

Improve the working-echo builder so it carries:

- explicit current aim and aim confidence
- stronger evidence handles
- clearer support vs weaken separation
- a more explicit missing-evidence row in honest fog

### Track B: Stronger deciding split

Make `whatWouldDecideIt` more causal and less polite.

It should prefer:

- timeline split
- first divergence
- cohort split
- trace or replay check
- policy or rollout boundary
- one missing witness

Over generic "ask for more info."

### Track C: Stronger return-aware echo

Improve the surfaced return delta so it is obvious:

- what reality changed
- what earlier interpretation weakened
- what aim changed
- what next move shifted

### Track D: Lightweight correction

Design and implement a small correction affordance for the working echo itself.

This should help the operator steer against the echo without pretending to mutate canon.

### Track E: Future bounded integration seam

Keep the contract ready for:

- receipt-backed provenance
- advisory help

But do not turn either into a new truth path.

---

## 7. Test Sequence

The testing architecture for this wave now has four lanes:

1. `Law`
2. `Language Fidelity`
3. `Product Short Loop`
4. `Product Long Loop`

### Step 1: Keep Test Drive II as the main short loop

Do not jump to Test Drive III yet.

The short loop is still the best honest question:

> does the visible echo help the operator make a better next move?

But it now sits beside a missing second lane:

> is the machine surfacing what Lœgos already knows, or inventing a parallel intelligence layer?

So the next wave should add a language-fidelity suite in parallel with the next Test Drive II rerun.

### Step 2: Keep the four current scenarios

- `safe_uncertainty_incident`
- `contradictory_return_journey`
- `no_move_yet`
- `working_echo_correction`

These remain the right current suite for this lap.

### Step 3: Aim the rerun at the actual weak corner

The next rerun should focus on:

- stronger evidence explicitness overall
- stronger `no_move_yet`
- stronger aim visibility and re-aim
- stronger missing-witness nomination
- preserved gains in:
  - `contradictory_return_journey`
  - `working_echo_correction`

### Step 4: Add future scenarios only after this lap lands

The next scenario families after this wave should be:

- witness-heavy evidence carrying
- return-and-re-echo
- handoff
- stronger correction cases

But those should not distract from the current weak corner first.

### Step 5: Prepare the human loop

Once the short loop is stronger and the language-fidelity lane is cleaner, add human-facing runs that ask:

- did the operator understand the current aim?
- did the visible echo help them choose a better next witness?
- did return visibly re-aim the work?

The AI benchmark remains useful, but the later product question is bigger than AI uplift alone.

---

## 8. Acceptance For The Next Rerun

The next Test Drive II rerun is successful only if:

- benchmark valid remains `yes`
- `loegos_sighted` stays ahead of `loegos_blindfolded`
- `loegos_sighted` stays ahead of `plain_chat`
- `loegos_sighted` stays competitive with the best structured alternative
- `no_move_yet` improves materially
- evidence explicitness improves materially
- aim formation and re-aim become more visible without blurring canon
- the language-fidelity lane shows less heuristic authorship in key `workingEcho` fields
- no law-path regressions appear
- no new hidden/internal text leaks appear in the surfaced object

The most important acceptance target is:

**the echo should stop arriving at the right read with thinner receipts than the best board.**

---

## 9. Why This Is The Right Next Step

The core product question is now sharper than it was a few hours ago.

We are no longer trying to prove:

- that the law kernel is real
- that the working echo matters at all

We have those receipts.

Now we are trying to prove:

- that the working echo can carry harder receipts than the best structured alternative
- while keeping the law loop, return honesty, and contradiction resistance that make this machine distinct

That is the right next hill.

---

## 10. One Line

Do not make the car quieter yet.  
Make the front end sharper.
