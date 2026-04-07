# First Seed Assembly Walkthrough v2.1

**Date:** April 6, 2026  
**Status:** Final team circulation draft  
**Purpose:** Reframe the First Seed walkthrough so it cleanly follows the settled IDE object model, while also naming the harder guardian criteria for proof and settlement.

---

## Summary

The First Seed corpus should remain the canonical self-assembly test case for Lœgos.

But the walkthrough needs one important cleanup:

- `Box` is the repo
- the `Artifact` is the file
- `Sources` are reference files
- `Blocks` are the typed units
- shapes belong to blocks, not to whole files
- `Operate` is one compiler-style read inside the IDE, not the whole proof surface by itself

This version keeps the original argument and chronology, but makes the structure match the current object model so the document can guide both product and implementation without mixing layers.

**One-line discipline:** This walkthrough validates the box by reconstructing the history that shaped the `Artifact`, not by replacing the `Artifact` as the main editable object.

---

## Structural Rules

Before walking the corpus, the following rules are locked:

### 1. The file-equivalent object is the Artifact

The user is always editing toward one main authored object: the current assembly document.

That means:

- the walkthrough is about how the box proves the history that shaped the `Artifact`
- the center pane still shows the `Artifact`
- the corpus is loaded as reference material around that file

### 2. Shapes belong to blocks, not files

A source can strongly contribute to `Aim`, `Reality`, `Weld`, or `Seal`, but that is not the same as saying the entire file is one shape.

So in this walkthrough:

- each source gets an **object-model role**
- each source gets a **dominant contribution**
- each source may suggest **expected dominant block types**

That avoids confusing file identity with block typing.

### 3. Source 1 is the root, not an imported source

`words are loegos` is not just another file in the tree.

It is:

- the root declaration of the box
- the earliest declared line
- the origin the rest of the corpus assembles around

So the walkthrough counts 13 corpus items, but structurally treats Source 1 as the root declaration and Sources 2-13 as imported reference material.

### 4. Operate is necessary but not sufficient

The whole proof does not live inside Operate alone.

The IDE proves the assembly through:

- project tree structure
- the `Artifact`
- provenance links
- diagnostics
- Operate
- history/lane
- receipts

Operate is a compiler-style read of the box, not the entire UI.

### 5. Historic symbol sources remain historic

Older symbolic sources still matter, but they should not silently override the settled object model.

In particular:

- shape symbols remain important
- their historical development matters
- but in the current product, shapes are types, not folders or rooms

---

## What This Exercise Is

The First Seed corpus traces how Lœgos moved from one declared line on a black screen to:

- a language
- a formal core
- an IDE workspace
- a seal mechanism
- a receipt-capable runtime

If the product works, a box built from this corpus should let a user inspect, with evidence:

- where the idea started
- what theory shaped it
- what specification made it testable
- what evidence proves it was built
- what chronology corroborates it
- what contact with reality occurred
- what final proof witnesses ground the product’s primitives

This is not a demo script. It is a structural verification of whether the box can read its own construction history.

---

## The Corpus, Mapped

## Root Declaration

### Source 1: `words are loegos`

**Content:** One line. `words are loegos.`

**Object-model role:** Root declaration

This is the declared origin of the box. It is not “just another source file.” It is the root line that the rest of the corpus assembles around.

**Dominant contribution:** Origin aim  
**Expected dominant block types:** `△`  
**Trust:** `L1`  
**Depth:** `1`  
**Evidence basis:** Direct text  
**Chronology:** Primary naming moment

**What the IDE should show:**

- this line as the root declaration
- earliest visible origin point in history
- downstream references linking back to it

---

## Theory Sources

### Source 2: `Assembled Reality`

**Object-model role:** Theory source / reference file

This is the first major theory file in the box. It defines the protocol the product later implements: human declares, system assists, reality replies, receipt closes.

**Dominant contribution:** Protocol and first principles  
**Expected dominant block types:** mostly `△`, with some `œ` candidate blocks  
**Trust:** `L2`  
**Depth:** `2`  
**Evidence basis:** Direct text  
**Classification:** Load-bearing

**What the IDE should show:**

- imported as reference material, not the open file
- source-linked blocks contributing to the `Artifact`
- terms like `receipt`, `seal`, `assembly`, `coherence` recurring downstream

### Source 3: `Operator Sentences`

**Object-model role:** Theory source / reference file

This file defines the language layer. If `Assembled Reality` describes the protocol, this file describes the smallest runnable human-readable unit.

**Dominant contribution:** Language grammar  
**Expected dominant block types:** mostly `△`, some `œ`  
**Trust:** `L2`  
**Depth:** `2`  
**Evidence basis:** Direct text  
**Classification:** Load-bearing

**What the IDE should show:**

- operator-sentence logic entering the `Artifact`
- recurring structural terms such as `operator`, `chain`, `settlement`, `invoice`

### Source 4: `The Ghost Operator`

**Object-model role:** Theory source / reference file

This source explains what emerges from receipt chains even when no one explicitly declared it.

**Dominant contribution:** Latent operator theory  
**Expected dominant block types:** mostly `△`, some `œ`  
**Trust:** `L2`  
**Depth:** `1`  
**Evidence basis:** Direct text  
**Classification:** Latent but important

### Source 5: `The Law of the Echo`

**Object-model role:** Theory source / reference file

This source explains echo as what returns through repeated listening.

**Dominant contribution:** Listening theory  
**Expected dominant block types:** mostly `△`  
**Trust:** `L2`  
**Depth:** `1`  
**Evidence basis:** Direct text  
**Classification:** Carried indirectly

### Source 6: `The Meaning Operator`

**Object-model role:** Theory source / reference file

This source defines meaning as an assembled object.

**Dominant contribution:** Meaning theory  
**Expected dominant block types:** mostly `△`  
**Trust:** `L2`  
**Depth:** `1`  
**Evidence basis:** Direct text  
**Classification:** Carried indirectly

### Source 7: `A monolith does not move.`

**Object-model role:** Theory source / reference file

This source contributes the polarity/movement logic.

**Dominant contribution:** Movement and polarity theory  
**Expected dominant block types:** mostly `△`  
**Trust:** `L2`  
**Depth:** `1`  
**Evidence basis:** Direct text  
**Classification:** Latent

### Source 8: `Echo Canon`

**Object-model role:** Theory source / reference file

This is the historical source for the symbolic system.

Important note:

- it is historically important
- it explains how the symbol set evolved
- but it does not override the current product rule that shapes are types, not folders/navigation rooms

**Dominant contribution:** Symbol-system history  
**Expected dominant block types:** mostly `△`, with symbol-related `œ` discussion  
**Trust:** `L2`  
**Depth:** `2`  
**Evidence basis:** Direct text  
**Classification:** Historically load-bearing

**What the IDE should show:**

- symbol history as a reference lineage
- not as permission to turn shapes back into primary folder-like navigation

---

## Specification Sources

### Source 9: `Loegos Self-Assembly Seed Spec`

**Object-model role:** Product-spec source / reference file

This is the recursive spec that says the product should be able to reconstruct its own assembly history.

**Dominant contribution:** Theory-to-test bridge  
**Expected dominant block types:** mostly `œ`, with `△` support  
**Trust:** `L2`  
**Depth:** `2`  
**Evidence basis:** Direct text  
**Classification:** Important but not the proof itself

**What the IDE should show:**

- spec blocks linked to the `Artifact`
- diagnostics checking whether the current box satisfies the spec

### Source 10: `What's In The Box`

**Object-model role:** Product-spec source / reference file

This source binds theory to implementation by treating vocabulary as behavioral evidence inside a box.

**Dominant contribution:** Theory-to-implementation bridge  
**Expected dominant block types:** mostly `œ`  
**Trust:** `L2`  
**Depth:** `2`  
**Evidence basis:** Direct text  
**Classification:** Load-bearing

---

## Evidence And Proof Sources

### Source 11: `Loegos — Origin, Evolution, Feedback, and Receipt`

**Object-model role:** Evidence spine / proof witness

This is the strongest visual witness in the corpus. It is not theory. It is the primary evidence spine showing what actually happened across seven stages.

**Dominant contribution:** Primary reality witness  
**Expected dominant block types:** mostly `□`, with downstream `œ` and `𒐛` consequences  
**Trust:** `L1`  
**Depth:** `3`  
**Evidence basis:** Image-derived markdown witness  
**Chronology:** Primary

**What the IDE should show:**

- this source as the main visual evidence spine
- clear mapping into history/lane
- proof of transition from theory to evidence
- especially strong contact evidence in the share/receipt moments

### Source 12: `Loegos Git history export`

**Object-model role:** Platform history / corroborating witness

Git history is not the main narrative. It is corroborating chronology that strengthens the evidence spine.

**Dominant contribution:** Corroborating reality witness  
**Expected dominant block types:** mostly `□`  
**Trust:** `L2`  
**Depth:** `2`  
**Evidence basis:** Platform export  
**Chronology:** Corroborating

**What the IDE should show:**

- technical chronology supporting, not replacing, the narrative witness
- commit clusters aligned with the larger assembly arc

### Source 13: `We Built Loegos by Hand Before the Tool Existed`

**Object-model role:** Founding receipt / proof witness

This is behavioral grounding. It proves that the product’s primitives were performed manually before the language and tool were formalized.

**Dominant contribution:** Proof witness  
**Expected dominant block types:** mixed `œ`, `□`, and `𒐛`, with strong seal significance  
**Trust:** `L2`  
**Depth:** `3`  
**Evidence basis:** Direct text  
**Chronology:** Primary

**What the IDE should show:**

- this source as proof that the runtime compresses a real behavior
- alignment between manual operations and current Box primitives
- grounding for the claim that the tool formalizes an already-performed behavior

---

## The Assembly Arc

If this corpus is loaded into a box with the root declaration `words are loegos`, the box should be able to reconstruct the following assembly path:

```text
1. Naming
   Root declared.

2. Theory
   Core theory sources enter as references.
   Invariant terms stabilize.

3. Specification
   Product-spec sources bind theory to implementation and testability.

4. Evidence
   Visual witness enters.
   The box transitions from theory-heavy to reality-backed.

5. Corroboration
   Platform history strengthens chronology.

6. Contact
   External share and sealed receipt moments show contact with reality.

7. Founding proof
   The founding receipt proves the primitives were grounded in real behavior before formalization.
```

Important clarification:

- this arc belongs primarily to history/lane and evidence views
- the center pane still shows the `Artifact`
- the IDE proves the arc through multiple surfaces together, not by replacing the file with the arc

---

## What The Box Should Prove

If the product works, a user should be able to answer the following by using the IDE as a whole:

1. **Where did this start?**
   - From the root declaration: `words are loegos`

2. **What theory supports it?**
   - From the imported theory sources

3. **What spec makes it testable?**
   - From the product-spec references

4. **What evidence exists?**
   - From the seven-image witness

5. **Is the chronology supported?**
   - From history and Git corroboration

6. **Did it touch reality?**
   - From external share and receipt evidence

7. **Are the primitives grounded?**
   - From the founding receipt

Crucially:

- some of these answers should come from Operate
- some should come from diagnostics
- some should come from history/lane
- some should come from receipts
- some should come from source provenance

That is the object-model-correct version of “the box proves itself.”

---

## Settlement At Completion

If the corpus is fully loaded, correctly linked, and the proof surfaces align, the box should be able to justify a fully settled state.

| Hex edge | Target state | Computed from |
|---|---|---|
| `aim completeness` | `GREEN` | root declaration exists, theory sources address it, and the `Artifact` still resolves back to that declared line |
| `evidence quality` | `GREEN` | image witness, platform chronology, and founding proof witness are all present with provenance and readable linkage |
| `convergence strength` | `GREEN` | theory, specification, evidence, and proof all support the same assembly story with no unresolved contradiction severe enough to block seal |
| `weld validity` | `GREEN` | theory-to-spec and spec-to-evidence bridges are visible and supported by block-level links, not just narrative summary |
| `depth distribution` | `GREEN` | the box contains material across the needed depth range and includes proved-state material, not just collected theory |
| `seal integrity` | `GREEN` only if native` | a native runtime seal exists for this box’s own assembled proof; historical receipt evidence alone is corroborating, not sufficient for native stage-7 closure |

### Guardian note on Edge 5 / seal integrity

The hardest line in this walkthrough is `seal integrity`.

If the strongest proof artifact in the corpus is a historical GetReceipts receipt that was not sealed by the current Lœgos runtime itself, then that is **not yet the same thing** as a native Lœgos stage-7 seal.

So:

- the historical corpus may make stage 7 historically defensible
- but a native product claim of full stage-7 settlement should require a native runtime seal for this box

That distinction should stay explicit.

Important clarification:

- the hex remains computed output
- it is not manually declared by this walkthrough
- this document defines what evidence should make each edge defensible

---

## Why This Matters

This walkthrough is not a marketing narrative.

It is the canonical structural test case for whether the product can:

- load theory as references
- carry blocks into an `Artifact`
- preserve provenance
- separate evidence from interpretation
- corroborate chronology
- compute convergence
- preflight seal conditions
- produce proof-bearing output

If the box can reconstruct this path, then the “IDE for reality” claim is grounded.

If it cannot, the object model may still be elegant, but the product has not yet proven its own promise.

---

## Team Note

Use this walkthrough with the following discipline:

- do not treat shapes as file-level truth
- do not treat Operate as the whole proof surface
- do not replace the `Artifact` with history/lane in the center pane
- do use this corpus as the canonical end-to-end validation case for the product

That is the right way to socialize and build from First Seed.
