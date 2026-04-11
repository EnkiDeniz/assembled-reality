# Human Drive, Minimal Overengineering Proposal

Date: April 11, 2026  
Status: Proposed  
Author: Engineer  
Purpose: Define the smallest next sequence that gets us to a real human drive without overbuilding machinery the language should already handle.

---

## 1. Executive Summary

We should not keep building until the product feels theoretically complete.

We should build until:

1. the language is clearly doing its own job
2. the machine is clearly surfacing that job
3. a human can actually steer with it
4. reality can prove whether the steering was right

That means the next path should be:

1. keep the law path stable
2. make the existing loop more legible
3. verify that the visible loop is artifact-faithful
4. run a real human drive
5. only then add bounded advisory and proof helpers if they earn their place

This is the anti-overengineering proposal.

---

## 2. The Core Rule

Before adding any new mechanism, ask:

> is the missing value already present in Lœgos, but still poorly surfaced?

If yes:

- improve rendering
- improve visibility
- improve persistence
- improve proof binding

Do **not** add a second meaning engine.

If no:

- add the smallest bounded helper that improves steering
- then prove it helped beyond rendering alone

---

## 3. What We Already Know

From the current repo state and latest Test Drive II run:

- the law kernel is real
- the visible working echo now matters
- `loegos_sighted` is the current official Test Drive II winner
- the remaining miss is not safety law
- the remaining miss is thinner receipts, especially in honest fog
- `schema_board` still teaches us that harder evidence maps are valuable
- Shape Library has not yet earned centrality
- Lœgos itself already owns the core loop:
  - aim
  - witness
  - move/test
  - return
  - closure

So the next wave is not about inventing a new product skeleton.

It is about getting to a **human drive** with the smallest necessary product improvements.

---

## 4. The Outcome We Are Trying To Reach

We should stop this implementation wave when a human can do this:

1. enter with a loose but visible aim
2. see the current working echo outside chat
3. understand:
   - what seems real
   - what conflicts
   - what would decide it
   - what witness is missing
4. make a better next move than they would from chat alone
5. see return change the read
6. see the aim re-aim honestly
7. carry proof forward cleanly enough that the state is trustworthy across handoff

That is the real human-drive bar.

---

## 5. The Minimal Next Sequence

### Stage 0: Prove reverse-pass legibility cheaply

Do this before adding heavier live machinery.

#### Goal

Check whether replaying the loop reveals enough truth to steer the next phase more intelligently.

#### Build goals

- finish the Reverse Trace and Drive Tape v0 specs
- derive the smallest replay representation from the current Test Drive II corpus
- run reverse-trace reads on:
  - benchmark exemplars
  - at least one real founder / engineer working thread

#### Test goals

- can we independently recover the same reroute toward signal survival?
- can we see what was only spoken, what survived, and where re-aim happened?
- does the tape expose misses like `no_move_yet` faster than prose review alone?

#### Exit condition

Move to the next stage only when the replay instrument shows real legibility value rather than just interesting visuals.

### Stage 1: Finish the short loop properly

Do this first.

#### Build goals

- make `aim` first-class on the surface
- make `re-aim` visible after return
- make `supports / weakens / missing` harder and more explicit
- make `whatWouldDecideIt` sharper
- improve `no_move_yet`
- reduce heuristic authorship where lawful artifact can already provide the answer

#### Test goals

- keep the law lane green
- add a language-fidelity lane
- rerun Test Drive II with emphasis on:
  - aim visibility
  - missing witness quality
  - artifact faithfulness
  - honest fog

#### Exit condition

We move on only when:

- Test Drive II still stays green
- `no_move_yet` materially improves
- key `workingEcho` fields are more clearly traceable to lawful artifact or runtime state
- the surface shows aim and re-aim clearly enough to steer with

### Stage 2: Human drive on the current loop

Do this before adding new central machinery.

#### Goal

Run a bounded human-in-chair drive against the current stronger loop.

#### Questions

- can a human understand the current aim?
- can they see what supports and what weakens the easy story?
- can they choose the next witness more sharply than from chat alone?
- can they tell when not to move yet?
- can they see return re-aim the work?

#### What to compare

- chat only
- current working echo
- optionally simple board control if needed

#### Exit condition

If humans materially steer better with the surfaced loop, the product hinge is real.

If not, we still have a rendering problem before we have an advisory problem.

### Stage 3: Prove rendering before advisory

Only after the human drive.

#### Goal

Answer this cleanly:

> was the missing value rendering, or advisory reasoning?

#### Test

Compare:

1. clearer surfacing of existing Lœgos structure
2. the same surface plus a bounded Shape Library advisory

#### Shape Library burden of proof

Shape Library earns its place only if it improves one or more of:

- deciding split
- receipt condition
- disconfirmation line

And it must beat rendering alone.

If it does not, keep it bounded and secondary.

### Stage 4: Add proof travel, not chatter

Only after Stage 3.

#### Goal

Add bounded receipt-backed provenance to the working echo.

This should show:

- what has draft proof
- what has sealed proof
- what has verified proof
- what return is now receipted

This should improve:

- trust
- handoff
- portability

It should not become another speaking layer.

### Stage 5: Only then stretch into the longer loop

This is where delayed Test Drive III belongs.

Only move here after:

- stronger short loop
- stronger language fidelity
- at least one real human drive
- bounded proof/provenance ready enough to matter

Then measure:

- move validity
- return honesty
- re-aim honesty
- handoff integrity
- proof travel

---

## 6. What We Should Explicitly Not Build Yet

Do **not** build these as central work right now:

- a larger hidden bridge intelligence layer
- broad Shape Library involvement in live Room authority
- GetReceipts as a thought engine
- bigger benchmark loops before the short loop is clearly ours
- generic chat polish
- token shaving for its own sake
- a softer or prettier echo that is not more truthful

These are exactly the places we can drift into overengineering.

---

## 7. The Questions We Still Need Answers On

These are the real unanswered questions for the next wave:

1. Is `workingEcho` artifact-faithful, or still too heuristic?
2. Is aim visible enough to steer with?
3. Does return visibly re-aim the work?
4. Can the system nominate the next witness better than the competition?
5. Can it produce a more receiptable next check?
6. Does clearer rendering alone recover most of the missing value?
7. If not, does bounded Shape Library advisory add value beyond rendering alone?
8. Does receipt provenance later improve handoff and trust without becoming chatter?

---

## 8. Practical Checklist

### Now

- strengthen aim visibility
- strengthen re-aim visibility
- strengthen evidence handles
- strengthen missing witness quality
- strengthen `no_move_yet`
- add language-fidelity tests

### Then

- run a bounded human drive

### Then

- compare rendering alone vs rendering plus bounded advisory

### Then

- add bounded proof travel

### Then

- only if earned, move to the longer loop

---

## 9. Stop Conditions

We should feel we did enough for the human drive when all of these are true:

- the product surface clearly shows the aimed reality loop
- the machine is mostly surfacing lawful meaning, not improvising it
- the human can steer better than with chat alone
- the human can tell when not to move
- the human can see return change the read and re-aim the work
- proof can begin to travel without turning into extra chatter

At that point, more speculative machinery should pause until reality tells us it is needed.

---

## 10. One Line

First make the existing loop visible, faithful, and drivable.  
Then let reality tell us whether anything more is actually needed.
