# Assembly Classes

Shape recognition is not enough. We also need to classify the assembly path.

Some structures can be composed quickly from components. Others only become viable by moving through ordered states. The path is constitutive.

## Classes

## `combinable`

- Can be assembled mostly by correct component composition.
- Intermediate states are useful but not strictly constitutive.
- Typical use: stable static arrangements with low staging risk.

Required stage evidence:

- `runtime_observation`

## `path_dependent`

- Final form depends on ordered transitions.
- Stage ordering carries information and failure behavior.
- Typical use: systems where join sequence and timing materially affect outcome.

Required stage evidence:

- `runtime_observation`
- `stage_transition_proof`
- `falsifier_outcome`

## `developmental_embodied`

- Viability requires cost/time/sequence/adaptation under real contact.
- Intermediate states are constitutive, not incidental.
- Typical use: social-technical adoption loops, settlement and trust paths, high-friction change systems.

Required stage evidence:

- `runtime_observation`
- `embodied_feedback`
- `falsifier_outcome`
- `settlement_receipt`

## Diagnostic questions

- Can this be assembled by composition alone, or does order create properties?
- Which properties appear only after specific transitions?
- Which assumptions fail when we import final-state language into early-state context?
- What must be earned in sequence (time, cost, adaptation, return)?
- Which receipts prove staged maturation rather than static fit?

## Non-importable properties by class

- `combinable`: minimal non-importable properties.
- `path_dependent`: ordered transition behavior, failure timing dynamics.
- `developmental_embodied`: adaptation history, real cost curve, settlement under load.

## Failure modes when class is wrong

- Treating path-dependent work as combinable causes “looks right, breaks in passage.”
- Treating developmental work as static causes pseudo-progress without viability.
- Promoting without class-appropriate receipts causes category drift and trust collapse.

## Promotion implication

Promotion should check:

1. baseline reproducibility/utility/convergence thresholds, and
2. class-specific required receipts for maturation evidence.

Library closure remains explicit: `link`, `mint`, or `pending`.
