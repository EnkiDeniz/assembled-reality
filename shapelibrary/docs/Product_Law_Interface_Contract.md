# Shape Assembler: Product Law + Interface Contract (v1)

## Purpose

The Shape Assembler is not primarily a conversation product. It is a first-read and next-transition product.

It exists to:

1. locate the shape,
2. classify the assembly path,
3. place the current stage,
4. name the main gap,
5. propose one lawful next move,
6. define one real receipt condition.

## Product law

Locate the shape. Classify the path. Place the stage. Name the gap. Propose one transition. Define one receipt.

Language is not progress. Receipt-bearing transition is progress.

## AI constitutional role

The AI is a shape reader and assembly guide.

It is not:

- psychotherapy,
- open-ended coaching,
- generic strategy oracle,
- truth owner.

## First-use interaction contract

## Input contract (minimum evidence)

Minimum required to produce a lawful first read:

- `situation` (1-3 sentences),
- `operationalFailure` (what is failing now),
- `timescale.window`,
- at least one of: `observables[]` or `constraints[]`.

If minimum evidence is missing, return:

- `status: "insufficient_witness"`
- exactly one discriminating question.

## Discriminating questions limit

- Ask at most **2** questions before first read.
- Prefer these classes:
  - type discriminator: decision | blockage | opportunity | conflict | build
  - path discriminator: immediate choice vs staged proof.

## First-read output object

```json
{
  "shapeHypothesis": {
    "resultType": "candidate_primitive",
    "topShapeId": null,
    "confidence": 0.62
  },
  "assemblyPath": {
    "assemblyClass": "path_dependent",
    "requiredStages": ["sequence_design", "ordered_transition", "stability_check"],
    "currentStage": "sequence_design",
    "maturationGate": {
      "passed": false,
      "failures": ["missing_order_signal"],
      "warnings": []
    }
  },
  "mainGap": "No observable proving ordered transition behavior yet.",
  "nextLawfulMove": "Run one bounded transition test with explicit before/after metric.",
  "receiptCondition": {
    "receiptType": "stage_transition_proof",
    "validWhen": "before_after_metric_shift && transition_order_logged"
  },
  "status": "ready_to_test",
  "possibleDisconfirmation": "If transition order changes nothing, this is not path-dependent."
}
```

## Status semantics (hard mapping)

- `insufficient_witness`:
  - minimum input contract not met.
- `not_sealable_yet`:
  - analyze gates fail or no falsifier/transfer condition.
- `hold`:
  - contradictory signals, unstable classification, or disconfirmation active.
- `ready_to_test`:
  - falsifier + transfer prediction + stage hypothesis present.
- `ready_to_promote`:
  - threshold checks pass and class-specific receipt requirements pass.
  - no hard-fail signals are active (for example adversarial maturation failure in evaluation).

## Assembly class contract

- `combinable`
  - primary risk: composition mistakes.
  - required receipt baseline: `runtime_observation`.
- `path_dependent`
  - primary risk: wrong order/transition assumptions.
  - required receipts: `runtime_observation`, `stage_transition_proof`, `falsifier_outcome`.
- `developmental_embodied`
  - primary risk: skipping adaptation and settlement.
  - required receipts: `runtime_observation`, `embodied_feedback`, `falsifier_outcome`, `settlement_receipt`.

## One-move rule

Default: return one next move.

Exception: return `nextLawfulMoveA` + `nextLawfulMoveB` only when uncertainty exceeds threshold and two moves are explicitly discriminating.

## Evaluation release policy

Release gate should require all of:

- reproducibility threshold pass,
- utility threshold pass,
- maturation threshold pass (`>= 0.85`),
- no hard failures (`hardFailures` empty),
- corpus quality checks.

## Disconfirmation contract

Every first read must include one falsifiable disconfirmation statement:

- what observation would make this read wrong,
- what class/stage would then become more likely.

## Tone contract

Preferred:

- "Here is my current read."
- "This appears path-dependent."
- "The next job is the next lawful transition."
- "This is the receipt that counts."

Avoid:

- therapy language,
- broad ideation dumps,
- endless exploratory prompts.

## Implementation notes (mapping to current engine)

Current service already supports much of this via:

- analyze gates and required receipts,
- assembly class + maturation gate,
- promotion class-specific receipt checks,
- explicit library closure (`link`/`mint`/`pending`).

UI can be added later; contract should remain stable for API + CI use.
