# Word Layer and Lakin Moments Review Brief v0.1

## Why this slice exists

The Assembly lane now shows how a box assembled.

The next question was: can the box also show how its language assembled?

That is the purpose of the new **Word layer**. It treats the vocabulary inside a box as behavioral evidence, not just content. The point is not analytics. The point is lexical archaeology:

- what language became load-bearing
- what language emerged
- what language receded
- what language was carried forward into the current seed or sealed proof

From that same layer, we wanted one additional concept that matters deeply to the product and to the company name:

**Lakin moments**

A Lakin moment is not just any change. It is a graceful corrective pivot:

- a direction was real
- reality pushed back
- something fell away
- something more durable was carried forward
- the box can still show the trail honestly

The aim of this slice was to make that visible lightly, without inventing a new dashboard, a new persistence system, or a new decorative language.

## What we were trying to do

There were five design constraints:

1. The Word layer had to be **derived** from the existing box truth model.
2. It had to stay **epistemically humble**.
3. It had to appear **inside the Assembly lane**, not as a new mode.
4. Seven could help interpret it, but Seven could not become a mind-reader.
5. `Lakin moment` had to be a **stronger subset** of a more neutral concept, not the first thing the product jumps to.

So the intended progression is:

- raw box language
- lexical index
- `Selection points`
- `Lakin moments` when the evidence is strong enough

That order matters. We want the product to say "this may be a meaningful turn" before it says "this is a Lakin moment."

## What changed

### 1. Added a shared Word layer

The lexical model now lives in:

- `/Users/denizsengun/Projects/AR/src/lib/word-taxonomy.js`
- `/Users/denizsengun/Projects/AR/src/lib/word-layer.js`

It builds a read-only lexical index from:

- root text and gloss
- visible non-builtin source blocks
- current seed blocks
- receipt text

It explicitly excludes product chrome, lane labels, system wrappers, and builtin guide content.

The model now derives:

- class summary
- invariant terms
- emergent terms
- receding terms
- carried terms
- dropped terms
- selection points
- co-occurrences
- evidence moments

It also separates authorship so imported-source language and current box language are not flattened into one undifferentiated bag of words.

### 2. Added lane-native rendering for the Word layer

The Word layer now renders inside the Assembly lane in:

- `/Users/denizsengun/Projects/AR/src/components/AssemblyLane.jsx`

The lane shows:

- taxonomy counts
- invariant / emerging / receding terms
- carried / dropped terms
- selection points
- a quiet disclaimer that interpretations are hypotheses, not facts

This stays inside the lane instead of becoming a separate analysis dashboard.

### 3. Added on-demand Seven interpretation

Seven can now interpret the Word layer through the existing instrument path in:

- `/Users/denizsengun/Projects/AR/src/components/WorkspaceShell.jsx`
- `/Users/denizsengun/Projects/AR/src/app/api/seven/route.js`

Important constraint:

- Seven does **not** persist these interpretations as conversation history
- Seven must return hypotheses, not facts
- Seven may not psychologize without lexical evidence

### 4. Added Lakin moments as a light subset of selection points

This is the new part of the latest slice.

`Selection points` remain the base concept.

`Lakin moments` are only surfaced when the product can support them with hybrid proof:

- a credible dropped term
- a credible carried term
- enough chronology
- a real linked move in the Assembly lane

The derivation is handled in:

- `/Users/denizsengun/Projects/AR/src/lib/word-layer.js`
- `/Users/denizsengun/Projects/AR/src/lib/box-view-models.js`

Move entries can now carry:

- `isLakinMoment`
- `pivotPair`
- `lakinSummary`

The lane then shows a small `Lakin moment` chip and a quiet `from -> to` pivot line on that move entry only.

This is intentionally lane-first and very light. We did **not** add a separate Lakin dashboard or a new color system.

### 5. Curated the first Lakin moments in the Lœgos origin example

The public self-assembly page and the private seeded Lœgos example box now share the same authored Lakin metadata through:

- `/Users/denizsengun/Projects/AR/src/lib/loegos-origin-template.js`
- `/Users/denizsengun/Projects/AR/src/lib/loegos-origin-example.js`
- `/Users/denizsengun/Projects/AR/src/lib/self-assembly.js`

The initial curated moments are intentionally small:

- `listener-first-rollback`
- `pivot-to-workspace`

That means both the public demo and the private example box can show the same two known pivots, while normal user boxes only surface Lakin moments when the derived model can support them.

## What we think is strong

### The concept is disciplined

`Lakin moment` is not being used as a synonym for "change." It is constrained to corrective, evidence-backed turns.

### The truth model stayed unified

We did not build a second interpretation system just for pivots. The lane, the Word layer, the public self-assembly page, and the private example box still run through one shared model.

### The public/private example story stayed aligned

The same authored moments now show up in both places, which protects the "one box, one truth source" principle.

### Seven is constrained correctly

Seven can interpret surfaced moments, but Seven cannot invent new ones. That matters a lot.

## What still feels rough or open

### 1. Threshold tuning

The current derived thresholds for Lakin moments are intentionally conservative, but they are still first-pass heuristics. Reviewers should pressure-test whether they are:

- too easy to trigger
- too hard to trigger
- too dependent on token frequency rather than semantic importance

### 2. Taxonomy quality

The Word layer currently uses a curated taxonomy and unigram-first analysis. That is good enough for v0.1, but reviewers should look for obvious misclassifications or brittle alias handling.

### 3. UI density

The lane remains restrained, but there is still a real question about whether the new chip + pivot line + word-layer selection-point notes are the right density or whether they are one layer too much.

### 4. Selection point vs. Lakin moment distinction

Conceptually the distinction is right. The product now needs reviewers to sanity-check whether it is also clear in the UI.

If users cannot tell:

- "this is a lexical divergence"
- "this stronger one qualifies as a Lakin moment"

then the concept may still be too internal.

## What I want reviewers to answer

1. Does the Word layer feel like real lexical archaeology, or does it still feel too close to analytics?
2. Does `Lakin moment` feel truthful and earned on the surfaced move entries?
3. Are the two curated Lœgos moments the right initial examples, or is one of them overstated?
4. Does the public/private alignment feel strong enough that the example box is now teaching the concept well?
5. Is the Seven constraint strong enough, or are there still ways the interpretation path could overclaim?
6. Is the current UI light enough, or should Lakin be even quieter in v0.2?

## Files to review first

- `/Users/denizsengun/Projects/AR/src/lib/word-taxonomy.js`
- `/Users/denizsengun/Projects/AR/src/lib/word-layer.js`
- `/Users/denizsengun/Projects/AR/src/lib/box-view-models.js`
- `/Users/denizsengun/Projects/AR/src/components/AssemblyLane.jsx`
- `/Users/denizsengun/Projects/AR/src/components/WorkspaceShell.jsx`
- `/Users/denizsengun/Projects/AR/src/app/api/seven/route.js`
- `/Users/denizsengun/Projects/AR/src/lib/loegos-origin-template.js`
- `/Users/denizsengun/Projects/AR/src/lib/loegos-origin-example.js`
- `/Users/denizsengun/Projects/AR/src/lib/self-assembly.js`

## Bottom line

The main bet in this slice is:

**a box should eventually be able to show not only what it contains, but what language carried it, what language fell away, and where it learned to turn honestly.**

This is the first light version of that.
