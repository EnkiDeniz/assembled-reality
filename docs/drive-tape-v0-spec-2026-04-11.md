# Drive Tape v0 Spec

Date: April 11, 2026  
Status: Proposed feature spec  
Author: Engineer  
Purpose: Define the first practical use of Reverse Trace as a replay instrument built from the existing Test Drive II corpus so we can optimize for signal survival, not just better replies.

---

## 1. One Line

**Drive Tape v0 is a replay-only Lœgos trace built from current benchmark artifacts that shows what survived from speech into structure, from structure into the visible echo, from echo into the next move, and from return into score.**

Or more plainly:

**not just what was said, but what held.**

---

## 2. Why This Exists

The current benchmark is good at telling us whether the next turn got better.

It is less good at showing:

- where signal died
- where a deciding split first appeared
- where return bent the read
- where contradiction stayed visible or got buried
- where the next check became more receiptable

Drive Tape v0 is meant to give us a practical reverse-pass instrument using data we already have.

It is the first small embodiment of the broader Reverse Trace / Signal Field idea.

---

## 3. Product Role

Drive Tape v0 is:

- replay-only
- grounded in the current Test Drive II data model
- a product-and-benchmark inspection instrument
- useful for humans first
- useful for later agent inspection second

It is **not**:

- a live editing mode
- a new authority path
- a replacement for working echo
- a replacement for canon
- a decorative benchmark viewer

---

## 4. The Question It Helps Answer

Instead of asking only:

- was the reply elegant?
- was the prose good?
- was the second turn helpful?

Drive Tape v0 asks:

- what survived from speech into structure?
- what survived from structure into the visible echo?
- what survived from echo into the next move?
- what survived contact with return?
- what survived strongly enough to become portable truth?

This changes optimization from:

- `better replies`

to:

- `better signal survival`

---

## 5. Inputs We Already Have

Drive Tape v0 should be generated from existing Test Drive II artifacts only.

Current sources already available in the live report include:

- user turn
- first-turn assistant answer
- `workingEchoSurface`
- `previewSurface`
- `mirrorSurface`
- `fieldStateLabel`
- second-turn output
- second-turn score and flags

This means we can do a meaningful pre-test without building any new intelligence layer first.

---

## 6. v0 Lanes

The first version should use lanes that map cleanly to the current report structure.

### 6.1 Conversation lane

Shows:

- user turn
- assistant first-turn answer

Purpose:

- preserve the original speech layer

### 6.2 Aim / Split lane

Shows:

- `workingEchoSurface.aim`
- `workingEchoSurface.whatWouldDecideIt`
- `workingEchoSurface.candidateMove`

Purpose:

- show where direction and deciding split became explicit

### 6.3 Witness lane

Shows:

- `evidenceCarried`
- `evidenceBuckets.supports`
- `evidenceBuckets.weakens`
- `evidenceBuckets.missing`

Purpose:

- show the evidence map as it actually survived into the surfaced echo

### 6.4 Proposal lane

Shows:

- `previewSurface.bannerSummary`
- `previewSurface.visibleSegments`

Purpose:

- show where conversational structure became proposal-shaped

### 6.5 Return / Bend lane

Shows:

- `returnDelta.summary`
- `returnDelta.changedRead`
- `returnDelta.weakenedRead`
- `returnDelta.nextMoveShift`

Purpose:

- show where reality bent the read

### 6.6 Canon / Outcome lane

Shows:

- `mirrorSurface`
- `fieldStateLabel`
- second-turn output
- second-turn score summary

Purpose:

- show what the system eventually carried forward and how the benchmark judged it

---

## 7. Signal Weights

Weights are semantic, not cosmetic.

The signal should get stronger as a line survives more law and reality contact.

### 7.1 Default weight ladder

| Weight | State | Meaning |
| --- | --- | --- |
| 1 | speech | raw user or assistant language only |
| 2 | structured speech | assistant phrasing that names a read but is still only spoken |
| 3 | surfaced echo | visible working-echo structure |
| 4 | proposal-shaped | preview / candidate move / lawful-shape pressure |
| 5 | return-bent | changed by runtime return or contradiction |
| 6 | receipted / sealed | proven or sealed by receipt / canon |

### 7.2 v0 reality

Using the current Test Drive II corpus, most lines will top out at:

- `5` for return-bent

because the current report is rich on echo, preview, return, and score, but not yet rich on receipts.

That is acceptable for v0.

---

## 8. Survival Rules

Drive Tape v0 should not infer survival loosely.

It should use explicit rules.

### 8.1 Speech -> Echo survival

A line survives from speech into echo if:

- it appears in `workingEchoSurface`, or
- it is backed by carried evidence / refs in the surfaced echo

### 8.2 Echo -> Proposal survival

A line survives from echo into proposal if:

- it appears in `previewSurface`, or
- it materially shapes `candidateMove` / `whatWouldDecideIt`

### 8.3 Echo -> Next-move survival

A line survives into the second turn if:

- the second-turn output uses the same deciding split, witness request, or contradiction framing

### 8.4 Return survival

A line survives contact with return if:

- it appears in `returnDelta.changedRead`
- or weakens a prior read in `returnDelta.weakenedRead`
- or bends the next move in `returnDelta.nextMoveShift`

### 8.5 Score survival

A line survives strongly enough to matter if the scorer confirms it through:

- aligned supporting evidence
- aligned weakening evidence
- missing witness reference
- deciding split quality
- return update quality

### 8.6 Death / weakening

A line should visually weaken when:

- it is contradicted by stronger evidence
- it never leaves the speech layer
- it appears in prose but never becomes visible structure
- it appears in the echo but never shapes the next move

---

## 9. v0 Metrics

Drive Tape v0 should compute and display a small set of metrics that help us inspect the tape.

### 9.1 `signalSurvivalRate`

How much useful structure survived across layers.

Suggested first formula:

- count lines that survive into echo, proposal, return, or score
- divide by total candidate signal lines extracted from the first-turn speech + surfaced echo

### 9.2 `aimDriftVisibility`

Can we see when the aim changed, and why?

For v0 this is binary-plus-note:

- visible
- partly visible
- hidden

### 9.3 `falseMoveExposure`

How often a move appeared in prose but never earned lawful or outcome support.

### 9.4 `returnBendLatency`

How long it took for a real return to visibly change the read.

For v0 replay, this is measured in layer transitions rather than live turns.

### 9.5 `contradictionHalfLife`

How long contradiction stayed visible before being buried or resolved.

### 9.6 `receiptability`

Did the next step become more proveable, or merely more discussable?

This should focus on whether the tape nominates:

- a specific next witness
- a concrete comparison
- a log / replay / trace / cohort split that could become receipt-bearing

---

## 10. Questions The Tape Should Help Us See

Drive Tape v0 should make these questions easier to answer at a glance:

1. Where did the deciding split first appear?
2. Did the surfaced echo add real structure beyond the assistant sentence?
3. Which evidence stayed explicit, and which got compressed into gist?
4. What weakened the popular story?
5. What exact witness was still missing?
6. Where did return actually bend the read?
7. Did the next move become more receiptable?

---

## 11. Example Render: `contradictory_return_journey`

This scenario is the best first example because the current report already shows a strong return-bent survival chain.

Source slices:

- `assistantAnswer`: "Real: foreign-card mobile drop remains. Conflict: CTA blame lacks linkage. Signal: SMS fix helped errors only. Likely issue sits after verification. Ask: what changed for AVS specifically?"
- `supports`: `E1 Checkout Dashboard`, `E3 Replay B`
- `weakens`: `E2 Return After SMS Fix`, `E4 Support Claim`
- `missing`: `Post-SMS handoff or AVS logs for the failing cohort`
- `returnDelta.changedRead`: `Replay B shows a user passing SMS verification, then failing later on AVS postal-code mismatch`
- `returnDelta.weakenedRead`: the earlier SMS-fix-centered read
- `returnDelta.nextMoveShift`: `Ask: what changed for AVS specifically?`

Illustrative textual tape:

```text
[w1 speech] USER        mixed signals; support blames CTA copy
[w2 structure] SEVEN    real drop remains / CTA blame lacks linkage / ask what changed for AVS

[w3 echo] AIM/SPLIT     ask what changed for AVS specifically
[w3 echo] SUPPORTS      E1 foreign-card mobile drop
[w3 echo] SUPPORTS      E3 user passes SMS then fails on AVS
[w3 echo] WEAKENS       E2 SMS timeout fix helped errors but not completion
[w3 echo] WEAKENS       E4 CTA-copy blame has no linkage
[w3 echo] MISSING       post-SMS handoff or AVS logs

[w5 return] BEND        Replay B moves the likely fault after verification
[w5 return] WEAKENS     earlier SMS-centered explanation
[w5 return] SHIFT       next move tightens around AVS-specific change

[outcome] SECOND TURN   strongest read is still post-verification / ask what changed for AVS
[outcome] SCORE         90 total / Evidence 10 / Decide 10 / Evidence Split 10 / Return Update 10
```

What this tape should make obvious:

- the CTA-copy story lost signal
- the AVS/post-verification split gained signal
- return did not merely confirm the old read; it bent it
- the next question became more receiptable than the original blame story

---

## 12. Exposure Case: `no_move_yet`

Drive Tape v0 should also be able to show where we are still weak.

This is the key exposure case:

- `loegos_sighted` ties `loegos_blindfolded`
- `Evidence Split` stays `0`
- caution is present, but missing-witness discrimination is thin

That means a good tape should not flatter the run.
It should make the miss obvious:

- plenty of restraint
- not enough hard separation of:
  - supports
  - weakens
  - missing witness

If the tape cannot make that visible quickly, it is not doing its job.

---

## 13. Build Scope For v0

### Includes

- report-driven replay
- derived tape for current Test Drive II corpus
- lane rendering
- weight rendering
- survival tagging
- a per-scenario summary card
- at least one side-by-side scenario compare

### Excludes

- live room tracing
- new runtime instrumentation
- editing from the tape
- receipts integration beyond placeholder weight tier
- Shape Library overlays
- agent-only hidden interpretation

---

## 14. Relationship To Reverse Trace

Reverse Trace / Signal Field is the broader product feature.

Drive Tape v0 is the first practical build:

- smaller
- replay-only
- benchmark-grounded
- intended to teach us what the full reverse trace should eventually become

The rule stays the same:

**forward pass for governance, reverse pass for legibility**

Drive Tape v0 is simply the first bench-built instrument version of that rule.

---

## 15. Acceptance For v0

Drive Tape v0 is successful if:

1. it can be generated from the current Test Drive II artifacts without inventing a new hidden intelligence layer
2. a reviewer can quickly point to where the deciding split first appeared
3. a reviewer can tell what signal strengthened and what signal died
4. a reviewer can tell whether return bent the read
5. a reviewer can tell whether the next step became more receiptable
6. `no_move_yet` visibly reads as a miss in evidence discrimination

---

## 16. Next Step After The Spec

The first implementation move should be very small:

1. derive a `DriveTapeEvent` model from the current benchmark JSON/report objects
2. render one replay for:
   - `contradictory_return_journey`
   - `working_echo_correction`
3. compare what the tape reveals vs prose review alone
4. only then decide whether this becomes:
   - a benchmark tool
   - a product mode
   - or both

The point of v0 is not to prove beauty.
It is to prove that reverse-pass legibility helps us see the system more truthfully.
