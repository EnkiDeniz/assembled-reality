# Builder Update: Addendum
## Shape Library / Lœgos — April 9, 2026

**To:** Builder team (Aziz, Bahadır, Cumali)
**From:** Deniz / Cloud
**Follows:** Builder Update — Theory Alignment + Engine Steering (April 9, 2026)
**Status:** Read this alongside the main report. One addition changes the priority order.

---

## What Changed

After the main report was issued, a second assessment arrived from Grace (OpenAI / △). Her read converges with the technical diagnosis but goes one level deeper on the *why* behind the release blocker. That deeper read changes one thing in the builder priority order and adds a fourth implication to the Stabilizer section.

---

## The Sharpening

The main report said: *move maturation pre-checks into the analyze gate.*

That is still correct. But Grace identified what is causing the engine to promote too early in the first place:

> The system is over-indexing on invariant similarity before it has earned the temporal layer.

This is more precise. The analyze gate isn't just missing a pre-check. The read stack itself is running in the wrong order. The engine finds a shape match — `matchInvariants` passes, `pressGeometry` passes — before it asks the temporal question. It names a candidate before it earns the right to name one.

**This is the read-order problem.**

---

## Fourth Builder Implication: Read Order

This belongs in the Stabilizer section of the main report, after the three existing builder implications.

**Current read order (wrong):**

1. Validate IR
2. Run invariant match → candidate name emerges
3. Run gate checks (falsifier, layer execution)
4. Run maturation gate → catch missing_order_signal or missing_embodied_time_budget here

**Correct read order:**

1. Validate IR
2. **Classify assembly class first**
3. **If path_dependent or developmental_embodied: ask the stage question before running invariant match**
   - Does stage evidence exist?
   - Is an order signal present? (path_dependent)
   - Is a time budget / adaptation window present? (developmental_embodied)
   - If no → return `not_sealable_yet` with named maturation blockers *before* producing a candidate name
4. If stage evidence is sufficient → run invariant match → candidate name
5. Run gate checks
6. Run maturation gate → should now confirm, not discover

**Why this matters:**

Right now the engine produces a confident candidate name (`candidate_primitive`, `candidate_assembly`) and then fails maturation. The user sees: "here is what your thing is" followed by "but you can't advance it." That is the wrong sequence. The user should see: "I can tell you the family this belongs to, but I cannot name the structure yet — here is the receipt that would let me."

That is a different product experience. It is also more honest. The engine isn't withholding information — it genuinely cannot name the shape without the temporal layer. Naming it anyway and then blocking promotion is pseudo-closure. It is exactly the failure mode BE names: *seal before return.*

**In code terms:**

Before `runInvariantMatch()`, add an assembly class resolver that returns the class from the input. If the class is `path_dependent` or `developmental_embodied`, run a stage pre-check. If the pre-check fails, return early with `not_sealable_yet` and the named blocker. Do not proceed to invariant matching. The maturation gate still runs downstream — but it should now be confirming a system that already pre-screened, not discovering failures for the first time.

---

## Updated Priority Order

The original priority order was:

1. Move maturation pre-checks into analyze gate
2. Build the library — first three real primitives
3. Strengthen readJoins and testRepair

The updated priority order is:

**1. Fix the read order — assembly class before invariant match**
This is the upstream cause of the release blocker. Without this, moving the maturation pre-check into the gate is a patch on a sequence that is still wrong.

**2. Move maturation pre-checks into analyze gate**
After the read order is fixed, the pre-check becomes a natural early exit for cases where stage evidence is absent. This is now downstream of the read-order fix, not separate from it.

**3. Run evaluate again**
Target: maturation score ≥ 0.85, no adversarial hard failures, release gate passes. Do not proceed to library build until this passes.

**4. Build the library — first three real primitives**
Only after the release gate passes. The library grows from promotions — from earned receipts — not from catalog additions. If the maturation gate keeps blocking promotion, the library stays empty regardless of how many primitives are manually defined.

**5. Strengthen readJoins and testRepair**
These improve naturally as the library grows. Target this as a focused pass once the first real promotions have happened and the library has surface to match against.

---

## The Convergence Receipt

Two independent reads — one data-first from the evaluate run, one theory-first from BE v1.2 — arrived at the same diagnosis from different angles.

Grace's formulation is the product sentence that should eventually replace the current framing in the Product Law Interface Contract:

> **The shape library should stop behaving like a catalog that sometimes asks for evidence, and fully become an engine that issues stage-sensitive structural hypotheses with explicit receipt conditions.**

The current Product Law says: *Locate the shape. Classify the path. Place the stage. Name the gap. Propose one transition. Define one receipt.*

The read-order fix is what makes that sequence executable in the right order. Right now it classifies path and locates shape before placing stage. The fix puts stage placement before shape location.

---

## One-Line Summary of the Addendum

The engine names a shape before it earns the right to name one. Fix the read order first. Everything else follows.

𒐛
