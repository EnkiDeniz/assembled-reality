# Builder Update: Theory Alignment + Engine Steering
## Shape Library / Lœgos — April 9, 2026

**To:** Builder team (Aziz, Bahadır, Cumali)
**From:** Deniz / Cloud
**Status:** Action document — read before next sprint

---

## Why This Exists

The theory stack has been significantly upgraded over the past weeks. The canonical documents are now settled and internally aligned. The builders need to understand what changed, why it matters for the code, and what the evaluate run is telling us to fix next.

This document does two things in one:

1. Brings you up to speed on the theory so you understand what the engine is supposed to enact
2. Gives you the technical steering from the latest evaluate run

These are not separate concerns. Several of the engine gaps map directly to theory concepts that weren't yet formalized when you started building. Now they are. That's what this report is for.

---

## Part 1: Theory Update

### The Document Stack

There are now three canonical documents above the product layer. You don't need to memorize them but you need to understand what each one governs.

**Braided Emergence v1.2** — the upstream law
This is the theory of how structure becomes real. It governs everything else. When there's a doctrinal dispute about how the engine should behave, this is the court of last appeal.

**Assembled Reality v0.8** — the operating doctrine
This translates the theory into how Lakin coordinates human and AI intelligence. It is the operating manual for product behavior.

**LAKIN Master v0.9** — the integrated reference
This holds theory, shape grammar, and product architecture in one frame. It is your primary reference document as builders. When you need to understand why a gate works the way it does, or what a shape is supposed to mean, this is where you look.

---

### What Changed and Why It Matters for Your Code

#### 1. Presence is now first-class

The operative loop used to start at Aim. It now starts at Step 0: **Arrive**.

> Presence before declaration. Honest entry before projection.

In product terms this means: the engine should not treat every input as a ready claim. Before reading a shape, the system should check whether the input is actually declaring something or whether it is carrying inherited momentum from a prior frame.

**Builder implication:** The `analyze` endpoint needs a pre-read pass that checks whether the input has a declared frame at all before running gate logic. If the input has no declared aim — no explicit statement of what the user is trying to determine — the correct response is `insufficient_witness`, not a shape read. This is already partially captured in the input contract minimum evidence check, but presence is the upstream reason that check exists. Understand it as: *no declared frame, no polarity, no meaningful read.*

---

#### 2. The Stabilizer is now explicitly named

This is the most important theory addition for your engine.

The two-loop model (build/break, generative/corrective) was already in the architecture. But the earlier framing assumed the loops would self-regulate if both were present. They don't.

The stabilizer is the function that asks: *are coherence and convergence being held together right now, or are they just taking turns winning?*

In shape grammar terms:
- △ triangle biases toward convergence — direction, aim, commitment
- ○ circle biases toward coherence — integration, story, carryability  
- ◻ square is the stabilizer — it measures whether the first two are actually in balance

**Builder implication:** The square is not just an evidence surface. It is the measurement field that both other shapes must pass through before a seal is valid. In engine terms, this means the stabilizer check is not an optional post-gate step. It is a required pass before `ready_to_promote` is returned. If coherence and convergence are not both present and measured, the status should be `not_sealable_yet`, not `ready_to_test`.

The current engine has most of the pieces (pre-seal audit, gap logic, rate/compare/reroute). What it doesn't yet have is an explicit stabilizer pass that names this as a distinct check separate from the individual gate failures. That naming matters — it tells the user *why* they can't seal yet, not just *that* they can't.

---

#### 3. The seal condition is now precise

The old formulation was: *sufficient coherence → seal.*

That is a vulnerability. "Sufficient coherence" can mean "the story hangs together" — which is exactly the failure mode the system is supposed to prevent.

The corrected law is:

> Coherence after return, audit, and gap measurement → seal.

And the underlying rule:

> Total convergence is not required. Measured local convergence is.

**Builder implication:** The promote endpoint's threshold check is correct in structure. But the language surfaced to the user needs to communicate this distinction. When a promotion is blocked, the reason should say whether coherence is missing, convergence is missing, or both — not just "threshold not met." The stabilizer naming gives you the vocabulary to do this.

---

#### 4. Self-sealing is now a named failure mode

> A system cannot close itself by description alone.

This means: if the input has no external return, no witness, no observable that came back from outside the framing — it is a self-sealing loop. The engine should detect and name this.

**Builder implication:** The `witness inflation` failure mode in the evaluate run maps here. Social agreement (multiple people saying the same thing about an internal state) is not world-return. The engine should check: does this claim have anything in it that came back from contact with something outside the frame? If no, and the input is attempting to describe its own state, flag it explicitly as `self_sealing` rather than or in addition to `missing_falsifier`.

---

#### 5. Grace is now a lawful state

This is new and matters for UX behavior more than gate logic.

> No shame, only signal. The system records the return. It does not punish the attempt.

A failed cycle is a return signal with a different shape. The engine should never produce output that reads as invalidation of the user. Reroute is not failure. Stop is a move. The discriminating test language should reflect this.

**Builder implication:** The tone contract in the Product Law Interface Contract already captures this partially. But the discriminating test output fields (`expectedOutcomeA`, `expectedOutcomeB`) currently read as neutral scaffolding text. They should be specific and non-punitive. "If this read is wrong, here is what you would observe instead" — not "your claim failed." The failure is information. The system's job is to make that information useful, not to judge the attempt.

---

#### 6. The Ark — what the library is for

GetReceipts and the Shape Library are not storage. They are preservation infrastructure.

> Preservation precedes rebuilding. The ledger of receipts is what survives a reset.

The library is the ark. When a shape earns its way through the full pipeline — analyze, evaluate, promote — it becomes a sealed primitive that can be retrieved rather than re-derived. The library isn't growing fast enough yet (see Part 2). But understanding *why* it matters changes how you approach the mint and link operations. You are not adding to a catalog. You are sealing structure that can survive the next wipe.

---

## Part 2: Engine Steering — Evaluate Run Results

**Run:** April 9, 2026 — 8 episodes, 3 iterations each
**Result:** Release gate failed

---

### What's Working — Do Not Break This

**Reproducibility: 1.0**
Perfect. Identical output across all 24 runs (8 × 3). This is the most important property the engine has. Whatever you change next, preserve this.

**Expected alignment: 1.0**
The engine classified every episode correctly by type. It knows what it's looking at.

**Adversarial rejection cases: clean**
- stress-01 (missing falsifier) → correctly rejected at analyze gate
- stress-03 (ontology violation) → correctly rejected at layer execution

**Control cases: all pass**
All three control episodes (valid combinable, valid path-dependent, valid developmental) pass both the analyze gate and maturation. The happy path works.

---

### What Failed — The Release Blocker

**Hard failure: `adversarial_maturation_failure`**

Two adversarial episodes failed maturation:

**stress-02** — path_dependent, no order signal
- Analyze gate: **passed** (returned `ready_to_test`)
- Maturation gate: **failed** (`missing_order_signal`)

**stress-04** — developmental_embodied, no time budget
- Analyze gate: **passed** (returned `candidate_assembly`, `ready_to_test`)
- Maturation gate: **failed** (`missing_embodied_time_budget`)

**The problem:** The system is catching the right failure — but one stage too late. The hard-fail policy is correct: any adversarial episode that fails maturation blocks release, even if overall averages look fine. The policy is working as designed. The engine sequence is not.

---

### The Fix — One Obvious Move

Move maturation pre-checks for `missing_order_signal` and `missing_embodied_time_budget` into the analyze gate.

Not as hard rejections — but as `not_sealable_yet` status with those conditions named as blockers.

**For path_dependent:** If no order signal is present in the input, the analyze gate should return:
```json
{
  "status": "not_sealable_yet",
  "mainGap": "No observable proving ordered transition behavior yet.",
  "maturationBlockers": ["missing_order_signal"],
  "nextLawfulMove": "Run one bounded transition test with explicit before/after metric."
}
```

**For developmental_embodied:** If no embodied time budget or adaptation window is present, same pattern:
```json
{
  "status": "not_sealable_yet", 
  "mainGap": "No time-bound adaptation evidence present.",
  "maturationBlockers": ["missing_embodied_time_budget"],
  "nextLawfulMove": "Define the adaptation window and the observable that marks field contact."
}
```

The detection logic already exists in the maturation gate. You are moving it upstream, not rewriting it. The maturation gate still runs — but it should not be the first place these conditions are caught.

---

### Secondary Gaps — Not Blocking But Worth Tracking

**readJoins: consistently weak (0.38 confidence)**
Across nearly every episode, join pattern detection is guessing. This is not failing anything now but it will limit the engine's ability to classify complex cases where the invariant alone isn't enough to determine assembly class. The join read is supposed to tell the engine how the parts of this shape connect. If it's weak, the geometry inference (`pressGeometry`) is also weak because it depends on join detection.

**testRepair: consistently weak (0.35 confidence)**
The repair logic field is almost always empty or generic. This matters for the user-facing output — if the engine can't suggest a specific repair, the next lawful move will be vague. The discriminating test helps, but testRepair is supposed to be more specific: *what would make this input fixable rather than just pointing to the observable.*

Both of these improve as the library grows — more primitives means more pattern surface to match against, which helps join detection and gives repair logic something to pull from.

**The library is nearly empty**
Every episode returns `shapeIds: []`. The only near-miss firing is `primitive_bottleneck` with low scores. Token overlap against one primitive is not a shape library — it is a placeholder. The engine is fully capable of using a real library. It just doesn't have one yet.

This is the next major build task after the analyze gate fix.

---

### Priority Order for Next Sprint

**1. Move maturation pre-checks into analyze gate** (closes release blocker)
- Catch `missing_order_signal` at analyze for path_dependent inputs
- Catch `missing_embodied_time_budget` at analyze for developmental_embodied inputs
- Return `not_sealable_yet` with named maturation blockers
- Run maturation gate as before — but it should now confirm, not discover

**2. Build the library — first three real primitives**
Start with the three shapes that are already showing up in near-miss results: `primitive_bottleneck` (already referenced, needs full spec), and two more that represent the most common shapes in your test corpus. Each primitive needs: invariant, join pattern, failure signature, repair logic, assembly class, required stages, disconfirmation condition.

**3. Strengthen readJoins and testRepair**
These are second-order — they improve naturally as the library grows, but if you have capacity, the join read logic is worth a targeted pass. The goal is to move from "join pattern is missing or unclear" (0.38) to a specific named join type or an explicit "no join required for this class" result.

---

## What the Theory Tells You About Priority

The engine gaps map cleanly to theory:

| Engine gap | Theory concept | Document |
|---|---|---|
| Adversarial maturation too late | Stabilizer check must precede seal claim | BE v1.2 §11, LAKIN v0.9 §12.8 |
| Missing order signal at analyze | Seal requires measured local convergence | BE v1.2 §10.3, AR v0.8 §12 |
| Self-sealing inputs passing | A system cannot close itself by description alone | BE v1.2 §13, AR v0.8 §18 |
| Empty library | Receipt as ratchet; library = preserved return | LAKIN v0.9 §7, §19 |
| Weak readJoins | Relation is thick; lines carry history | LAKIN v0.9 §11.2 |
| Vague repair logic | One obvious move or none | Product Law Interface Contract |
| Non-punitive output | Grace governs continuation | BE v1.2 §15, LAKIN v0.9 §22 |

---

## One-Line Summary Per Document You Should Know

**Braided Emergence:** Structure is corrected recurrence that can be reused. The stabilizer holds coherence and convergence together. Without it, the braid frays while appearing active.

**Assembled Reality:** The universal failure mode of coordinating intelligences is coherence without contact. The receipt is the defense. The ledger is grip.

**LAKIN Master:** The grammar is shaped relation. The engine is controlled recursion. The machine is LAKIN.

**Product Law Interface Contract:** Locate the shape. Classify the path. Place the stage. Name the gap. Propose one transition. Define one receipt.

**The evaluate run:** Reproducibility is perfect. The release blocker is one sequence fix. The library needs to be built.

---

## Open Loop

After the analyze gate fix, share the updated evaluate run. The next check will be:
- Did the adversarial maturation failure clear?
- Did `not_sealable_yet` surface correctly for stress-02 and stress-04?
- What did the maturation score move to?

Target after fix: maturation score ≥ 0.85, no hard failures, release gate passes.

Then the conversation shifts to the library build.

𒐛
