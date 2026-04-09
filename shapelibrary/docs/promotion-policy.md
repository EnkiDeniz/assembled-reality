# Promotion Policy v0.1

Promotion is receipt-backed, not argument-backed.

## State machine

`candidate -> provisional -> promoted -> deprecated`

## Primitive promotion checks

1. recurrent candidate behavior,
2. reproducibility threshold met,
3. utility threshold met,
4. accepted receipt evidence exists.

## Assembly-path checks (v0.2)

In addition to thresholds, promotion requires class-specific receipt evidence:

1. `combinable`: `runtime_observation`
2. `path_dependent`: `runtime_observation`, `stage_transition_proof`, `falsifier_outcome`
3. `developmental_embodied`: `runtime_observation`, `embodied_feedback`, `falsifier_outcome`, `settlement_receipt`

If required class receipts are missing, promotion remains blocked even when score thresholds pass.

## Assembly promotion checks

1. non-additive behavior shown,
2. new failure signature shown,
3. new transfer prediction shown,
4. accepted receipt evidence exists.
