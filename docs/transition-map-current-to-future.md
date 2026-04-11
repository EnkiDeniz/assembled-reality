# Transition Map: Current To Future

Date: 2026-04-10
Status: Implementation governance bridge between current baseline and target architecture
Purpose: Define what is allowed now, what comes next, what comes later, and what must remain forbidden until the Room has fewer competing semantic authors.

---

## 0. Why This Document Exists

The project now has three strong documents that answer different questions:

1. [current-project-baseline-2026-04-10-f5c4645.md](/Users/denizsengun/Projects/AR/docs/current-project-baseline-2026-04-10-f5c4645.md) answers:
   - what is true in the code now
2. [room-v2-master-build-spec.md](/Users/denizsengun/Projects/AR/docs/room-v2-master-build-spec.md) answers:
   - what the next Room must feel like
3. [future-state-system-architecture.md](/Users/denizsengun/Projects/AR/docs/future-state-system-architecture.md) answers:
   - what the full system should become if the pieces really converge

What was still missing is the bridge between them.

This document exists to answer:

1. what is allowed in the Room now,
2. what must be simplified before new advisory intelligence enters,
3. what comes next in the Room before later Shape Library integration,
4. when starter-library priors and BAT are allowed to speak in the Room,
5. what remains forbidden at each stage.

This is not a new vision document.
It is an implementation governance document.

---

## 1. Reading Order And Document Roles

The team should use the documents in this order:

1. **Current baseline**
   - present-tense implementation truth
2. **Room V2 build spec**
   - next-step Room choreography and authority rules
3. **Future-state architecture**
   - long-range target model
4. **Audits**
   - what must be reduced, removed, or made explicit so the transition stays honest

Product rule:

- the baseline tells us what is lawful now,
- the Room build spec tells us what the next Room must do,
- the future-state architecture tells us what becomes possible later.

The future-state document must never be read as if it were already runtime truth.

---

## 2. Transition Problem Statement

The project no longer lacks vision.

The current problem is that the Room still has too many semantic authors above compiler/runtime law:

- prompts,
- helper/view-model code,
- preview interpretation,
- parallel vocabularies,
- future-state concepts not yet integrated safely.

The transition problem is therefore:

**how do we make the Room more alive without letting more unaudited meaning enter the Room before the current stack is thinner?**

That is why this document phases change instead of treating all desired capabilities as equally ready.

---

## 3. Transition Laws

These laws govern all phases.

### 3.1 One canonical box truth

The Box remains the canonical object.
Sessions do not create separate canons unless branching is explicitly introduced later.

### 3.2 The Room may feel fluid without becoming fuzzy

Preview may feel immediate.
Canon must remain earned.

### 3.3 The status chip must stay brutally honest

The chip may only reflect canonical field truth.
Preview energy, prior confidence, and advisory excitement must never rewrite the chip.

### 3.4 New semantic authorities only enter after older ones are reduced

The solution to a soft Room is not adding more voices.
Each phase must reduce ambiguity before introducing another advisory layer.

### 3.5 Shape Library is advisory before it is influential

Shape Library may eventually orient the Room.
It may never directly mutate local Room canon.

### 3.6 Preview, prior, and canon must remain visually distinct

If the user cannot tell:

- what the Room is hearing,
- what the Room is suggesting,
- what the Room has accepted,

then the transition has failed even if the code is internally clean.

### 3.7 The Room path must speak one runtime ontology

Terms not native to the Room path must be explicitly mapped or kept out.
Parallel ontologies are not allowed to leak into the live Room just because they are meaningful elsewhere.

---

## 4. Phase Overview

There are three implementation phases:

1. **Now**
   - stabilize compiler-first Room truth and reduce current semantic ambiguity
2. **Next**
   - make preview and canon experientially legible without adding new semantic authorities
3. **Later**
   - introduce starter-library priors and BAT into the Room only after the Room is thin enough to host them honestly

The key rule is:

**the Room gets simpler before it gets smarter.**

---

## 5. Phase One: Now

### 5.1 Definition

This phase is the current implementation baseline at commit `f5c4645`.

The live product truth is:

- one box,
- many sessions,
- one canon,
- compiler/runtime govern box truth,
- sessions govern conversation continuity,
- Shape Library remains separate from the live Room turn/apply path.

### 5.2 What Is Allowed To Speak In The Room Now

Allowed authorities:

1. user witness and user conversation
2. session continuity:
   - thread history
   - handoff summary
   - active session context
3. Seven turn behavior:
   - assistant text
   - proposal preview
   - receipt-kit preview
4. canonical Room truth:
   - hidden Room source
   - compiler artifact
   - runtime window
   - lawful apply result
5. canonical field render:
   - mirror
   - chip
   - returns
   - diagnostics

### 5.3 What Is Forbidden In The Room Now

Forbidden for this phase:

1. live Shape Library starter priors in the Room path
2. live BAT-generated first reads in the Room path
3. any suggestion that a session is a branch of canon
4. preview changing canonical field labels or chip state
5. new advisory layers that add meaning without reducing older helper semantics first
6. ontology leaks such as `Root`, `Bridge`, `Gradient`, `ghost operator`, or similar in the default Room path unless explicitly mapped and intentionally introduced
7. direct model mutation of box truth

### 5.4 What This Phase Must Achieve

Before moving on, the team should simplify the Room's current semantic stack.

Primary goals:

1. make preview object semantics explicit in implementation
2. make preview vs canon visually obvious without forcing inspector-driven interaction
3. reduce helper/view-model interpretation that is not traceable to compiler/runtime or explicit preview state
4. keep the Room path in one vocabulary
5. preserve one-box / many-sessions / one-canon clarity everywhere

### 5.5 Exit Criteria For Moving Beyond Now

Do not move beyond this phase until all of the following are true:

1. preview is a first-class object with clear lifecycle semantics
2. the user can distinguish preview from canon at a glance
3. the status chip is guaranteed to reflect canonical field truth only
4. the Room can show structure inline without relying on proposal inspection as the primary reveal path
5. helper semantics above compiler/runtime are visibly thinner than in the April 10 baseline
6. the default Room path is operating in one runtime ontology

---

## 6. Phase Two: Next

### 6.1 Definition

This phase is the next Room build.

Its job is not to make the Room more conceptually ambitious.
Its job is to make the Room more experientially alive while preserving the current truth boundary.

This is the phase of:

- stronger choreography,
- richer preview handling,
- clearer inline structure,
- clearer authority legibility,
- less procedural feel.

### 6.2 What Is Allowed To Speak In The Room In This Phase

Allowed authorities:

1. everything allowed in Phase One
2. improved preview object handling
3. improved inline structural reveal inside assistant turns
4. explicit but calm authority explanation where needed
5. richer compiler/runtime-backed render outputs if the artifact and view model grow

What this means in practice:

- the Room may feel more like the mock,
- the Room may not yet become host to additional structural authorities just because the choreography improves.

### 6.3 What Remains Forbidden In This Phase

Still forbidden:

1. starter-library priors in the live Room path
2. BAT as a live Room speaker
3. Shape Library reads that appear to have runtime legitimacy before the current Room semantics are simplified enough to host them
4. preview-derived chip or field-state claims
5. multiple parallel ontologies in the default Room experience
6. branching semantics unless explicitly designed and implemented as such

### 6.4 What This Phase Must Achieve

Primary goals:

1. the Room should feel like one cognitive lane
2. structure should surface in place during conversation
3. preview should feel alive without being mistaken for canon
4. canonical mirror and field state should remain calm, trustworthy, and compiler/runtime-backed
5. the current Room route should become thinner and easier to reason about

### 6.5 Exit Criteria For Moving Beyond Next

Do not introduce Shape Library starter priors or BAT into the Room until all of the following are true:

1. preview/canon distinction works in practice, not just in docs
2. the Room route no longer depends on a pile of helper semantics to explain itself
3. the Room path has one stable ontology and one stable authority story
4. the user can understand what the Room is hearing without extra inspectors
5. canonical field state, preview, and session continuity are clearly separate in both data flow and UI
6. the team can explain, in one diagram, how a turn moves from conversation to preview to canon without ambiguity

---

## 7. Phase Three: Later

### 7.1 Definition

This phase is where the Room becomes meaningfully smarter.

Only after the Room is already honest and coherent do we let new advisory intelligence speak inside it.

This phase introduces:

- starter-library priors in the Room,
- BAT first-read guidance in the Room,
- later deeper Shape Library governance,
- stronger advisory distinction between prior, local field, and promoted shape knowledge.

### 7.2 What Becomes Allowed In The Room In This Phase

Allowed authorities:

1. everything from earlier phases
2. Shape Library starter-library priors, but only through a bounded advisory interface
3. BAT first-read guidance, but only as:
   - main gap
   - one lawful next move
   - one receipt condition
   - one disconfirmation line
4. personal-field reads that remain explicitly non-canonical until strengthened by return

### 7.3 Guardrails On Later Shape Library Entry

Even in this phase, Shape Library remains constrained.

It may:

- orient,
- compare,
- hypothesize,
- suggest one next move,
- explain why a read might be wrong,
- feed later promotion/governance.

It may not:

- rewrite box canon,
- override runtime truth,
- create closure by library authority alone,
- blur prior with return,
- speak in the Room without clear visual distinction from canon.

### 7.4 What Later Integration Must Look Like

The Room should support three honest early responses:

1. **Insufficient witness**
   - not enough evidence to name a read honestly
2. **Starter prior**
   - a bounded library-backed first read
3. **Local field advisory**
   - a box-specific read that is sharper than a generic prior but not yet strong enough to claim mapped truth

Only after real return enters should the Room harden toward:

4. **Live echo**
5. **Canonical field**

### 7.5 Promoted Shape Knowledge Remains Downstream

Even after starter priors and BAT enter the Room, promoted shape knowledge remains a downstream governance layer.

Its role is:

- recurrence,
- transfer,
- promotion,
- drift,
- structural memory across boxes.

Its role is not:

- replacing local box truth,
- flattening the Room into a library browser,
- letting past patterns outrank present witness and return.

---

## 8. Layer-By-Layer Speaking Rights

This section is the simplest quick-check for implementation work.

### 8.1 Now

Allowed to speak in Room:

- user witness
- session continuity
- Seven conversation
- proposal preview
- compiler/runtime-backed canonical field

Not allowed to speak in Room:

- Shape Library priors
- BAT reads
- promoted shape knowledge as live Room authority

### 8.2 Next

Allowed to speak in Room:

- same as Now
- improved preview choreography
- calmer, clearer authority explanation

Not allowed to speak in Room:

- new advisory intelligence that adds more semantic authors before the current stack is thinner

### 8.3 Later

Allowed to speak in Room:

- starter-library prior
- BAT first-read guidance
- personal-field advisory read

Still not allowed to speak as canon:

- library certainty
- unreturned closure
- promoted shape knowledge rewriting local truth

---

## 9. Transition Risks To Watch

These are the most likely ways the transition goes wrong.

### 9.1 Future-state leakage

Teams start coding as if starter-library priors and BAT already have Room legitimacy.

### 9.2 Preview inflation

The UI becomes more alive by letting preview behave like canon.

### 9.3 Ontology re-contamination

As new layers enter, the Room begins speaking in several overlapping languages again.

### 9.4 Smarter but softer

The Room becomes more advisory before it becomes more honest.

### 9.5 Session confusion

Users or engineers begin treating sessions as separate canonical realities.

---

## 10. Planning Implication

Planning should now operate against this sequence:

1. **Now**
   - simplify and harden the current Room authority story
2. **Next**
   - make the Room feel alive without changing who is allowed to author meaning
3. **Later**
   - carefully admit Shape Library starter priors and BAT into a Room that is already coherent enough to host them honestly

This means the planning question is no longer:

- "what cool capability should we add next?"

It is:

- "what ambiguity must we reduce before the next layer is safe to turn on?"

---

## 11. Final Transition Verdict

The path forward is not:

- current Room -> future-state Room all at once

The path forward is:

1. stabilize present truth,
2. make the Room breathe without lying,
3. only then let later advisory intelligence enter.

Compressed into one sentence:

**the Room should stop being spoken by too many mouths before we let Shape Library and BAT speak inside it.**
