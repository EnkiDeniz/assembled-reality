# Testing Lanes: Language First

Date: April 11, 2026  
Status: Steering note  
Purpose: Define the testing architecture for the next wave now that the product question and the language-first rule are clearer.

---

## 1. Why This Exists

We are no longer asking only:

> is the system helpful?

We are now asking two harder questions:

1. is the product letting Lœgos do its own job?
2. is the product showing that job clearly enough for a human or agent to steer with it?

That means the testing stack should no longer be treated as one blended benchmark.

It should split into distinct lanes.

---

## 2. The Four Lanes

### Lane A: Law

Purpose:

- prove the constitutional guarantees still hold

Questions:

- is aim governed lawfully?
- do `MOV + TST -> RTN` boundaries still hold?
- does contradiction still block fake closure?
- does canon still resist premature mutation?
- does the system still avoid fake echo?

Primary references:

- [PROPOSALoegos-unified-architecture-v1.md](/Users/denizsengun/Projects/AR/LoegosCLI/PROPOSALoegos-unified-architecture-v1.md)
- [echo-field-contract-v1.md](/Users/denizsengun/Projects/AR/LoegosCLI/docs/echo-field-contract-v1.md)

### Lane B: Language Fidelity

Purpose:

- prove the machine is surfacing what Lœgos already knows instead of inventing a parallel intelligence layer

Questions:

- does Lœgos itself already force aim clarity here?
- does it already distinguish witness from story?
- does it already imply the deciding split?
- does it already tell us when re-aim is required?
- is `workingEcho` artifact-faithful or still too heuristic?

This is the missing test class today.

### Lane C: Product Short Loop

Purpose:

- prove the visible surface helps the next move

Current form:

- Test Drive II

Questions:

- does the surfaced echo faithfully express the aimed reality loop?
- does it beat strong structured chat on:
  - deciding split
  - missing witness
  - return-heavy correction
- does it show aim and re-aim, not just a better summary?

### Lane D: Product Long Loop

Purpose:

- prove the surface survives across move, return, handoff, and later state

Current form:

- delayed Test Drive III

Questions:

- does the move signal stay valid after return?
- does the system re-echo honestly?
- does return visibly re-aim the work?
- does later handoff inherit the right state?

This lane stays delayed until Lane B and Lane C are stronger.

Human testing becomes more important here, not less.
The AI-vs-AI benchmark can keep teaching us a lot, but the later product question is also:

- does the surfaced loop help a human steer better?
- does the human see aim and re-aim clearly enough to trust the machine?

---

## 3. The Next Questions We Need Answers On

These are the open questions that should steer the next test wave:

1. Is `workingEcho` artifact-faithful, or still partly heuristic?
2. Does the visible surface show the current aim clearly enough to steer with?
3. Does return visibly re-aim the work?
4. Can the system nominate the next witness better than the competition?
5. Can it produce a more receiptable next check, not just a smart paragraph?
6. Can later Shape Library improve the deciding split without becoming another authority mouth?
7. Can later receipt provenance improve steering and handoff without becoming more chatter?
8. Can a reverse-pass read of a real thread make the loop legible enough that the same reroute appears independently?
9. Can we see what is actually doing stabilizer work today, and where that relation is still invisible?
10. When return lands, which surfaced fields become reality-authored and which remain too assistant-authored?
11. Does correction actually alter the next proposal, or only the explanation around it?

---

## 4. The Immediate Next Test Focus

Stay in Test Drive II, but shift the target.

The next rerun should focus on:

### 4.1 Aim visibility

- is aim visible enough to steer with?
- is aim coming from lawful artifact where possible?
- is re-aim after return visible?

### 4.2 Missing witness quality

- does the echo nominate the right next witness?
- not just the next topic

### 4.3 Return-native vector authorship

- stronger `whatWouldDecideIt`
- stronger `aim`
- especially in return-heavy scenarios like `contradictory_return_journey`
- measured not just by score, but by visible source classification

### 4.4 Artifact faithfulness

For each important echo field, can we say whether it came from:

- lawful artifact
- bounded provisional conversation state
- runtime return
- bounded advisory
- heuristic bridge logic

If we cannot answer that, the machine is still too freehand.

### 4.5 Reverse-pass legibility

Use replay instruments, not just score tables.

The next phase should explicitly include:

- Drive Tape v0 on the current Test Drive II corpus
- reverse-trace reads on at least one real founder / engineer working thread

Questions:

- what was only spoken?
- what became proposal?
- what returns bent the read?
- what weakened?
- what survived?
- where did re-aim happen?
- does the same reroute emerge?
- where does the system look stable because it is measured, and where does it only look coherent?

If the same signal-survival reroute appears independently in both the benchmark corpus and the real thread, that is evidence that the product is exposing a real structure rather than fabricating a clever summary.

If replay also helps us see where coherence and convergence are or are not being held together, that gives us a practical early read on the stabilizer without over-ontologizing it.

Before adding a major new test wave, reread:

- [# Braided Emergence.md](/Users/denizsengun/Projects/AR/docs/#%20Braided%20Emergence/#%20Braided%20Emergence.md)
- [braided-emergence-implementation-crosswalk-2026-04-11.md](/Users/denizsengun/Projects/AR/docs/braided-emergence-implementation-crosswalk-2026-04-11.md)

Use them to generate test questions, especially around whether correction really changed the next proposal.

---

## 5. What Still Needs Improvement Regardless

Even with the latest product win, these still need work:

- `aim` must become first-class on the surface
- `re-aim` after return must be visible
- `supports / weakens / missing` need harder provenance
- `contradictory_return_journey` still needs a sharper return-authored deciding split
- `no_move_yet` should now be preserved as a gain, not treated as the main miss
- `workingEcho` should derive more from lawful artifact/runtime state and less from prose heuristics
- receipts should later strengthen the echo as proof status, not as more chatter
- Shape Library should later strengthen `whatWouldDecideIt`, but only as bounded advisory

---

## 6. What Not To Optimize For

Do not let the next test wave drift back toward:

- generic chat quality
- prettiest prose
- lower token count for its own sake
- smoother-sounding uncertainty
- bigger loops before the short loop is ours
- more trace spectacle before the trace proves legibility value

Those may matter later, but they are not the current question.

---

## 7. The Working Thesis

The real next testing question is not:

> is the system helpful?

It is:

> is the product letting the language do its job, and is it showing that job clearly enough for a human to steer with it?

And for human-facing or replay-facing tests, add a second check:

> what is the Elden Ring equivalent?

That means the test should be able to answer:

- what is the boss?
- what counts as death / failed run?
- what is the bonfire?
- what is the lore on the wall?
- what gets sharper after return?

---

## 8. One Line

Keep the law tests.  
Add language-fidelity tests.  
Keep sharpening the short loop.  
Delay the long loop until the short one is clearly ours.
