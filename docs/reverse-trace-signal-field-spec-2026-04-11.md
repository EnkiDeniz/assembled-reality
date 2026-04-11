# Reverse Trace / Signal Field Spec

Date: April 11, 2026  
Status: Proposed feature spec  
Author: Engineer  
Purpose: Define a new read-only product mode that renders a whole human/Seven interaction as a visible Lœgos trace so humans and agents can see what actually survived law and reality contact.

---

## 1. One Line

**Forward pass for governance.  
Reverse pass for legibility.**

Or more plainly:

**what survives gets the signal.**

---

## 2. Why This Feature Exists

Right now the system is mostly experienced through:

- chat
- working echo
- canon and receipts

Those are valuable, but they still keep the interaction mostly inside the turn-by-turn illusion of conversation.

This feature is meant to create an outside view:

- take the whole interaction trace
- render it back through the language
- show what was only speech
- show what became structural proposal
- show what stayed provisional
- show what got a real return
- show what became receipt-bearing
- show what actually survived

This is not a new truth path.
It is a truth-legibility instrument.

---

## 3. Core Thesis

Lœgos already runs the loop forward:

- aim
- witness
- move
- test
- return
- closure

The Reverse Trace runs the same interaction backward for inspection.

It does **not** rewrite truth.
It reveals what the interaction really was.

That means:

- forward pass decides what is lawful
- reverse pass shows what earned signal

---

## 4. Product Goal

Give a human or agent a mode where they can scroll through the interaction as a single visible artifact and immediately tell:

1. what the current aim was
2. what witness was grounded
3. what was only spoken
4. what became proposal
5. what was accepted
6. what reality answered
7. what weakened
8. what survived
9. what became receipted
10. where re-aim happened

The feature should help both:

- humans steer better
- future agents inherit the loop more honestly

---

## 5. What It Is Not

### 5.1 Not another narrator

The Reverse Trace must not invent new meaning outside:

- Lœgos
- lawful artifact/runtime state
- visible provisional state
- return
- receipts

### 5.2 Not a second truth path

It cannot mutate:

- canon
- field state
- closure

It is read-only.

### 5.3 Not a decorative log viewer

The visual language must teach the truth hierarchy of the system, not just make the log look futuristic.

### 5.4 Not a hidden internal debugger first

The same surfaced object should be usable by:

- humans
- benchmarks
- later agents

If the user cannot see it, the benchmark should not claim gains from it.

---

## 6. The Feature In One Sentence

The Reverse Trace is a scrollable Lœgos signal field that renders a conversation, witness, moves, returns, receipts, and re-aims as one visible chronology, with stronger visual signal given to what survived more law and reality contact.

---

## 7. Visual Principle

Not everything spoken is real.
Not everything real is equally earned.

The view should teach that through signal strength.

Suggested hierarchy:

1. plain human speech
   - dimmest
2. Seven response / segment
   - brighter but provisional
3. surfaced preview / proposal
   - more stable
4. accepted canonical artifact line
   - stronger
5. returned evidence
   - stronger still
6. receipt-backed / sealed line
   - brightest, hardest, most stable

Contradiction, weakening, and supersession should visibly reduce or alter stability rather than simply disappear.

---

## 8. Visual Grammar

The first version should be a structured signal field, not an abstract art piece.

### 8.1 Lanes

Suggested vertical lanes:

- `Aim`
- `Witness`
- `Proposal`
- `Move/Test`
- `Return`
- `Receipt`
- `Canon`

### 8.2 Primitive marks

Suggested first-pass mapping:

- `DIR` / aim
  - triangle or pointed marker
- `GND` / witness
  - square block
- `MOV` / move
  - forward arrow
- `TST` / test
  - split arrow or probe marker
- `RTN` / return
  - ripple or echo wave
- `CLS` / closure
  - seal / lock / hard-edge marker
- contradiction
  - cut, slash, or fracture overlay
- weakened / superseded
  - faded or hollowed version of the original mark
- receipted / verified
  - thick border, brighter core, or geometric stabilization

### 8.3 Color rules

Color should carry semantics, not decoration.

For example:

- aim
- grounded witness
- provisional
- return
- receipt
- contradiction

should each have a stable semantic mapping.

The exact palette can be designed later, but the rule is:

**color indicates state and authority level, not aesthetics.**

---

## 9. Data Model

The feature should be driven by a structured trace event model, not by raw text scraping.

```ts
type TraceAuthority =
  | "speech"
  | "provisional"
  | "preview"
  | "canonical"
  | "return"
  | "receipted"
  | "sealed";

type TraceOrigin =
  | "user"
  | "seven"
  | "lawful_artifact"
  | "runtime_return"
  | "receipt"
  | "bounded_advisory";

type TraceEventKind =
  | "aim_declared"
  | "aim_reaimed"
  | "witness_grounded"
  | "proposal_formed"
  | "proposal_applied"
  | "move_sent"
  | "test_sent"
  | "return_arrived"
  | "receipt_attached"
  | "closure_attempted"
  | "closure_blocked"
  | "closure_sealed"
  | "contradiction_marked"
  | "signal_weakened"
  | "signal_superseded";

type TraceEvent = {
  id: string;
  turnId?: string;
  timestamp: string;
  lane: "aim" | "witness" | "proposal" | "move" | "return" | "receipt" | "canon";
  kind: TraceEventKind;
  authority: TraceAuthority;
  origin: TraceOrigin;
  text: string;
  sourceRefs: string[];
  derivedFrom: string[];
  supersedes?: string[];
  contradictedBy?: string[];
  receiptedBy?: string[];
};
```

### Provenance rule

Every visible mark should be able to answer:

- where did this come from?
- what law/reality contact did it survive?
- what weakened it?
- what hardened it?

---

## 10. Source Of Truth Rules

This feature must follow the language-first rule:

1. if the lawful artifact already knows it, surface that
2. if runtime or receipt state knows it, surface that
3. only then use bounded provisional state
4. do not manufacture parallel meaning for the trace

The Reverse Trace should be a rendering of:

- lawful artifact
- visible provisional state
- return/runtime state
- receipt/proof state

not a new hidden interpretation engine.

---

## 11. MVP Scope

The first version should be deliberately small.

The very first practical build of this should be `Drive Tape v0`, a replay-only instrument derived from the existing Test Drive II corpus rather than a new live runtime mode.

### MVP includes

- read-only mode
- one conversation / one box replay
- scrollable chronology
- lanes for:
  - aim
  - witness
  - proposal
  - move/test
  - return
  - receipt
  - canon
- signal strength by survival level
- contradiction / weakening visibility
- ability to inspect source refs

### MVP excludes

- live editing
- direct mutation from the trace
- Shape Library inline advice
- GetReceipts deep object inspection
- agent-only hidden overlays
- complex animation for its own sake

This should first be a **flight recorder**, not a cockpit.

---

## 12. UX Modes

### Mode A: Replay

Replay a completed or in-progress interaction trace.

This is the MVP.

The first concrete replay spec is:

- [drive-tape-v0-spec-2026-04-11.md](/Users/denizsengun/Projects/AR/docs/drive-tape-v0-spec-2026-04-11.md)

### Mode B: Live Trace

A later mode where the current conversation emits live signal into the field.

This should only come after Replay is useful and truthful.

### Mode C: Compare

A later mode where:

- chat only
- working echo
- reverse trace

can be compared on the same interaction.

---

## 13. Relationship To Existing Surfaces

### Chat

Chat remains the conversational layer.

### Working Echo

Working Echo remains the compact steering surface.

### Reverse Trace

Reverse Trace becomes the deep legibility surface:

- why this is the current read
- what survived
- what weakened
- what became real

### Canon / Mirror

Canon remains what the box can lawfully claim.

The Reverse Trace should help explain how canon got there, but it must not become canon itself.

---

## 14. Why This Might Matter Product-Wise

This feature may solve several current problems at once:

- make the language visible instead of implicit
- reduce dependence on heuristic summary
- help humans steer from outside the chat illusion
- help future agents inherit state more honestly
- show return and re-aim more clearly
- teach the authority hierarchy of speech, proposal, canon, return, and proof

It is not just a prettier log.
It is a candidate truth-legibility instrument.

---

## 15. How We Should Test It

The first tests for this feature should be simple.

Before we build a full trace surface, we should first ask whether a smaller replay instrument already changes what we can see in the benchmark corpus. `Drive Tape v0` is the intended first pre-test for that.

### 15.1 Legibility tests

Ask:

- can a human identify the current aim?
- can they identify what was only spoken?
- can they identify what got a real return?
- can they identify what was contradicted?
- can they identify what survived?

### 15.2 Steering tests

Compare:

1. chat only
2. chat + working echo
3. chat + reverse trace

Measure:

- deciding split quality
- missing witness quality
- honest fog handling
- return/re-aim understanding

### 15.3 Fidelity tests

Ask:

- is the Reverse Trace faithfully rendering existing lawful/provisional/return/receipt structures?
- or is it inventing new meaning?

### 15.4 Receiptability tests

Ask:

- does the trace help the user identify what next check could actually become proof?

---

## 16. Build Order

### Step 1

Create a trace event model from existing:

- messages
- working echo
- preview/apply events
- runtime/return state
- receipts

### Step 2

Build a read-only replay view for one benchmark or one Room conversation.

### Step 3

Run human inspection on replay:

- what did they see here that chat + panel did not show?

### Step 4

If the replay mode creates real legibility gains, integrate it as an advanced product mode.

### Step 5

Only later consider live mode or advisory overlays.

---

## 17. Risks

### Risk 1: Over-aestheticization

The feature turns into visual theater instead of truth legibility.

### Risk 2: Parallel meaning

The trace renderer becomes a second intelligence layer.

### Risk 3: Over-density

The signal field becomes too complex for humans to read.

### Risk 4: Authority blur

Provisional, canonical, returned, and receipted states become visually muddled.

### Risk 5: Premature complexity

We build the full live Matrix view before proving replay mode is useful.

---

## 18. Success Condition

This feature is successful if, after seeing the Reverse Trace, a human or agent can more accurately answer:

- what the aim really was
- what evidence grounded the read
- what was only a story
- what contradicted the easy story
- what reality actually answered
- what became receipt-bearing
- what survived enough to deserve signal

---

## 19. Future Shape Library / Receipt Relationship

Later:

- Shape Library may annotate one likely deciding split, one receipt condition, and one disconfirmation line
- GetReceipts may visually harden proof-bearing trace lines

But both should remain subordinate to the trace itself.

The trace should remain:

- language-first
- law-faithful
- proof-sensitive

not advisory-first.

---

## 20. One Line

The Reverse Trace should let us watch the conversation become structure, then watch structure survive reality.
