# Shape Library Phase 4 Baseline Drift Summary

Date: 2026-04-09
Scope: Phase 4 kickoff after Phase 3 seal, focused on matcher observability and baseline drift before any embedding-based similarity work.

## What Was Implemented

1. Evaluate observability metrics were added:
  - `matchBasisDistribution`
  - `nearMissHistogram`
2. Matcher baseline remained discipline-safe:
  - read-order and `not_sealable_yet` behavior unchanged
  - release gate integrity preserved
3. Regression gate remained green after calibration:
  - known bottleneck input -> `shapeIds: ["primitive_bottleneck"]`
  - known gate-dependency input -> `shapeIds: ["primitive_gate_dependency"]`
4. Match-case corpus episode is active:
  - `fixtures/episodes/matchcase.episodes.json`

## Baseline Run Protocol

- Corpus: 8 stress episodes + 1 match-case episode (total 9)
- Iterations per evaluate run: 3
- Baseline run count: 3 (required before embedding discussion)

## Baseline Run Outputs

- `results/evaluate/2026-04-09T17-38-07.085Z_evaluate_run.json`
- `results/evaluate/2026-04-09T17-38-07.091Z_evaluate_run.json`
- `results/evaluate/2026-04-09T17-38-07.094Z_evaluate_run.json`

## Drift Summary (Runs 1-3)

All key metrics were stable across all three runs:

- `releaseGatePass`: `true` (all runs)
- `reproducibility`: `1` (all runs)
- `utility`: `0.7305555555555555` (all runs)
- `expectedAlignment`: `1` (all runs)

Observability metrics were also stable:

- `matchBasisDistribution`:
  - `none`: 12
  - `hybrid_structural_overlap`: 15
- `nearMissHistogram.totalNearMisses`: 9
- `nearMissHistogram.byShape`:
  - `primitive_bottleneck`: count 6, avg 0.1883, min 0.1167, max 0.2598
  - `primitive_gate_dependency`: count 3, avg 0.0154, min/max 0.0154
- `nearMissHistogram.bins`:
  - `0.00-0.19`: 6
  - `0.20-0.39`: 3
  - `0.40-0.59`: 0
  - `0.60-0.79`: 0
  - `0.80-1.00`: 0

## Interpretation

- No detectable drift in three consecutive baseline runs.
- Matcher behavior is deterministic under this suite and current calibration.
- Under-match pressure remains visible in near-miss mass concentrated below 0.40, especially for bottleneck-like candidates.
- Over-match risk appears contained under current gate discipline and threshold.

## Decision Gate

Embedding-based similarity remains deferred by design. Baseline requirement (3 stable runs) is now satisfied.

Recommended next decision options:

1. Continue with non-embedding refinement first:
  - expand structural metadata usage in scoring,
  - add one gate-dependency match-case episode,
  - re-check near-miss mass shift.
2. If embedding exploration is approved:
  - add as optional feature flag,
  - preserve current hybrid path as control,
  - require regression gate + drift comparison before enabling by default.

