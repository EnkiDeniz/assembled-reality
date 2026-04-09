# Phase 4 Task 1-2-3 Calibration Report

Date: 2026-04-09
Scope: Execute Task 1 (add gate-dependency match-case + evaluate), Task 2 (weight assessment and adjustment without threshold change), and Task 3 (post-adjustment baseline run 4).

## Task 1 - Gate-Dependency Match-Case Episode

Added fixture:

- `shapelibrary/fixtures/episodes/matchcase.episodes.json`
- New episode:
  - `episodeId: match-002-gate-dependency`
  - expected:
    - `resultType: primitive_match`
    - `shapeIds: ["primitive_gate_dependency"]`
    - `granularity: primitive`

## Task 2 - Scoring Weight Assessment and Adjustment

Constraint honored:

- **No threshold change** in this phase (`MATCH_THRESHOLD` remains `0.4`).

### Step 1: Weight distribution (before)

Before adjustment, score mix in `scoreShapeSimilarity`:

- invariant overlap: `0.55` (or earlier pre-pass `0.45`)
- constraints overlap: `0.15` (or earlier pre-pass `0.20`)
- join pattern: `0.25` (already at required minimum)
- falsifier: `0.03` (or pre-pass `0.05`)
- failure signature: `0.02` (or pre-pass `0.05`)

### Step 2: Adjustment applied

Calibration pass retained join weight >= 25% and used:

- invariant: `0.55`
- constraints: `0.15`
- join: `0.25`
- falsifier: `0.03`
- failure: `0.02`

Also refined token normalization/synonyms and seeded `joinPattern` metadata for promoted primitives:

- `primitive_bottleneck`: `request->review->approve->ship`
- `primitive_gate_dependency`: `draft->legal_review->approval->execute`

### Step 3: Controlled bottleneck inputs (before vs after)

Pre-adjustment controlled run artifacts:

- `results/analyze/2026-04-09T17-45-31.848Z_analyze_ok_6f0629be-7572-4593-bdc9-2bd256b6176f.json`
- `results/analyze/2026-04-09T17-45-31.850Z_analyze_ok_a8cd7d72-a913-4884-8a32-af21bc05918f.json`
- `results/analyze/2026-04-09T17-45-31.851Z_analyze_ok_ed41f253-33bf-4e9d-8905-7a73000be5b4.json`

Post-adjustment controlled run artifacts:

- `results/analyze/2026-04-09T17-50-28.804Z_analyze_ok_5528015d-2c29-4a69-9198-665b78a0502b.json`
- `results/analyze/2026-04-09T17-50-28.807Z_analyze_ok_002e7b43-4c87-4411-96d9-2803b6a98089.json`
- `results/analyze/2026-04-09T17-50-28.808Z_analyze_ok_b5c8546e-c517-44f8-b52b-8a5fe3cdf89a.json`

Results summary:

- Canonical:
  - before: `primitive_match`, confidence `0.8095`
  - after: `primitive_match`, confidence `0.8488`
- Paraphrase:
  - before: `primitive_match`, confidence `0.7570`
  - after: `primitive_match`, confidence `0.8076`
- Symptom-only:
  - before: `candidate_primitive`, nearMiss `0.0986`
  - after: `candidate_primitive`, nearMiss `0.3181`

Interpretation:

- Paraphrase and symptom-only signal improved (especially symptom-only near-miss).
- No discipline break observed; symptom-only remains candidate (no over-match).

## Task 1 Evaluate Run (10 episodes) - After calibration

Evaluate artifact:

- `results/evaluate/2026-04-09T17-50-55.583Z_evaluate_run.json`

Requested outputs:

- `releaseGatePass`: `true`
- `expectedAlignment`: `1`
- `matchBasisDistribution`:
  - `none: 12`
  - `hybrid_structural_overlap: 18`
- `nearMissHistogram`:
  - `totalNearMisses: 9`
  - `byShape`:
    - `primitive_bottleneck`: avg `0.1677`, min `0.067`, max `0.3444`

Match-case episode results:

- `match-001-bottleneck-lane-throttle`:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_bottleneck"]`
  - `matchBasis: hybrid_structural_overlap`
- `match-002-gate-dependency`:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_gate_dependency"]`
  - `matchBasis: hybrid_structural_overlap`

## Task 3 - Baseline Run 4 (post-adjustment drift check)

Baseline run 4 artifact:

- `results/evaluate/2026-04-09T17-50-55.583Z_evaluate_run.json`

Comparison against prior Phase 4 baseline:

- `releaseGatePass`: remains `true`
- `nearMissHistogram`:
  - `primitive_gate_dependency` near-miss mass no longer dominates once match-case resolves to match
  - `primitive_bottleneck` avg near-miss is slightly lower (`0.1883 -> 0.1677`) while max increases (`0.2598 -> 0.3444`)
- `matchBasisDistribution`: expanded hybrid-match count due to second match-case and matcher calibration (`15 -> 18` on 10-episode suite)
- Stress suite crossings:
  - none crossed into match (still rejection/not_sealable_yet/candidate), preserving over-match guardrails.

## Quality Gate

- Test suite: `21/21` pass after changes.
- Threshold unchanged.
- Closure discipline preserved.

