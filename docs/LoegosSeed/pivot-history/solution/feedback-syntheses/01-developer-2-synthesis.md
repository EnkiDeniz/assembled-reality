# Feedback Synthesis 01

## Developer 2

Date: 2026-04-06
Status: Working synthesis
Purpose: Capture the strongest takeaways from Developer 2's review so future feedback can merge into a stable decision record.

## Documents Under Review

- [The De-obfuscation Experience](../The%20De-obfuscation%20Experience/The%20De-obfuscation%20Experience.md)
- [Inference Authority Rules v0.1](../Inference%20Authority%20Rules%20v0.1/Inference%20Authority%20Rules%20v0.1.md)

## Core Convergence

Developer 2 is directionally right and should be weighted highly.

The key convergence is:

- De-obfuscation is the product experience north star.
- Inference Authority Rules is the governance and trust contract.
- Both documents should be kept.

This matches the strongest product reading so far:

`source -> seed -> operate -> evidence -> receipt`

The de-obfuscation concept gives that pipeline a first undeniable user moment:

`write -> Operate -> see the gap -> inspect -> add evidence -> seal`

The authority rules prevent the inference system from turning into an ungrounded oracle.

## Locked Takeaways

### 1. The two docs still conflict

This is the biggest immediate problem.

The authority doc says Layer 2 history:

- cannot turn a word green
- cannot turn a word red
- can intensify scrutiny
- can add risk and pattern warnings
- cannot block seal

The de-obfuscation doc still contains an older formulation where Layer 2 can turn a word red as a pattern warning.

The authority doc should win.

Working decision:

- Layer 2 does not change the core signal.
- Layer 2 may add warning, scrutiny, pattern note, or risk badge.
- Layer 2 may influence review attention.
- Layer 2 does not independently make a claim red or green.

### 2. De-obfuscation mixes near-term product with long-term research

The buildable product slice is:

- local-source inference
- flagged words or flagged spans first
- inspectable inference receipts
- manual override with provenance
- evidence-first onboarding

The Shape Library material is important, but it dilutes the execution contract of the experience doc.

Working decision:

- Keep Shape Library as research-horizon material.
- Move it out of the center of the experience spec.
- Reference it through a separate stack or appendix document.

### 3. "Force-green" is the wrong name

The mechanism is sound.

The name is not.

The actual behavior is:

- a human attests
- the system records provenance
- trust stays lower
- the receipt remembers

That is accountable assertion, not cheating.

Working naming direction:

- preferred: `Attested Override`
- acceptable alternates: `Manual Witness Override`, `Witnessed Assertion`

### 4. v1 should ship block/span-first

This is one of the most grounded engineering points in the review.

The current product is strongest at:

- source
- block
- evidence
- receipt
- provenance

Working decision:

- v1 should emphasize block-level shapes in gutter
- flagged spans or claims should highlight first
- deeper word-level reasoning should be inspectable on demand
- full always-on word compilation should not be the first shipped surface

## Current Synthesis

If the next version were frozen today, the clearest working stance would be:

- Keep De-obfuscation as the experience contract.
- Keep Authority Rules as the non-negotiable safety contract.
- Remove the Layer 2 contradiction from De-obfuscation.
- Move Shape Library out of the core experience doc into a referenced appendix or canonical stack doc.
- Rename `Force-green`.
- Trim duplication and repeated examples in De-obfuscation.
- Reframe v1 as block and flagged-span de-obfuscation first, with deeper word-level inspectability second.

## v1 Definition

The right v1, in one sentence:

**v1 = local-source inference + inspectable receipts + attested override + flagged span/block highlighting.**

## Structural Recommendation

Developer 2's best structural suggestion is to create one small canonical document to stop drift:

`Reference Stack Canon v1.0`

Working use:

- De-obfuscation links to it.
- Authority Rules defines it.
- Shape Library moves there or to an appendix.
- The two main docs stop re-explaining the same stack in conflicting ways.

## Why This Feedback Matters

This review is strong because it is not resisting the direction.

It is doing something more useful:

- preserving the best idea
- removing contradictions
- separating near-term product from research horizon
- making the direction more buildable

## Carry Forward

Unless later feedback clearly improves on these points, the following should be treated as the current default:

- keep both docs
- Authority Rules wins on layer authority
- Shape Library is appendix material, not core v1 material
- `Attested Override` replaces `Force-green`
- block/span-first is the safest first shipped experience

This document should be merged with future reviewer syntheses, not treated as the final word.
