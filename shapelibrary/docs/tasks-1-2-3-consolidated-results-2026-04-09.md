# Shape Library Consolidated Results and Findings (Tasks 1-3)

Date: 2026-04-09
Scope: Post-first-promotion execution of Task 1 (evaluate on populated library), Task 2 (strengthen bottleneck), and Task 3 (second primitive identification and promotion path).

## Executive Summary

- The pipeline remains stable and release-ready (`releaseGatePass: true`).
- Task 1 rerun confirms no false closure, but no immediate `shapeIds` population in the 8-episode stress suite.
- Task 2 is completed: `primitive_bottleneck` now has explicit `repairLogic`, `failureSignature`, and `disconfirmationCondition`.
- Task 3 was executed with `primitive_gate_dependency` as the second primitive candidate and an earned promotion cycle; candidate was promoted and linked.

## Task 1: Evaluate Against Populated Library

Evaluate artifact:

- `shapelibrary/results/evaluate/2026-04-09T17-02-11.821Z_evaluate_run.json`

Topline:

- `reproducibility: 1`
- `utility: 0.7234375`
- `maturationScore: 1`
- `releaseGatePass: true`

Findings:

- Episodes with populated `shapeIds`: none (`[]`).
- `matchBasis` remains `token_overlap` for candidate runs.
- No stronger match basis emerged in this suite after linking `primitive_bottleneck`.
- Recurring near-miss signals still point toward bottleneck:
  - `stress-05`: `nearMiss.shapeId = primitive_bottleneck`, `score = 0.3333`
  - `stress-06`: `nearMiss.shapeId = primitive_bottleneck`, `score = 0.1667`
  - `stress-07`: `nearMiss.shapeId = primitive_bottleneck`, `score = 0`

Interpretation:

- Library population alone does not guarantee match conversion under current similarity threshold and lexical strategy.
- The engine is still behaving honestly: candidate/near-miss without over-claiming identity.

## Task 2: Strengthen `primitive_bottleneck`

Action taken:

- Updated `ShapePrimitive.metadataJson` for `primitive_bottleneck` with approved fields:
  - `repairLogic`
  - `failureSignature`
  - `disconfirmationCondition`

Verification:

- Confirmed via `GET /v1/library?type=primitive` that all three fields are now present on `primitive_bottleneck`.

Supporting spec artifact:

- `shapelibrary/docs/primitive_bottleneck.spec.json`

## Task 3: Second Primitive Candidate From Corpus

Selected candidate:

- `primitive_gate_dependency`

Why selected:

- Recurs across distinct corpus contexts (standalone and assembly contexts).
- Structurally distinct from `primitive_bottleneck` (condition-blocked progression vs lane-capacity choke).
- Has an operational falsifier pattern (bounded gate relaxation and before/after lead-time comparison).

Second earned promotion cycle (executed):

- Analyze artifact:
  - `shapelibrary/results/analyze/2026-04-09T17-07-43.854Z_analyze_ok_bfee5c92-84f7-42b4-9550-4c84b02f0e92.json`
  - `resultType: candidate_primitive`
  - `nearMiss.shapeId: primitive_gate_dependency` (`score: 0.3846`)
- Promote artifact:
  - `shapelibrary/results/promote/2026-04-09T17-07-43.856Z_promote_cd813222-659b-4a9c-bc94-eccc1d48d2d2.json`
  - `approved: true`
  - `toState: promoted`
  - `libraryOutcome.linkedShapeId: primitive_gate_dependency`
  - `libraryMergeStatus: linked`

Candidate record verification:

- `candidateId: 4fc4176f-3bd0-42aa-860e-573c692362d9`
- `status: promoted`
- `linkedShapeId: primitive_gate_dependency`
- `assemblyClass: path_dependent`

## Current Library State (Meaningful)

- Linked primitives from earned promotion cycles in this phase:
  - `primitive_bottleneck`
  - `primitive_gate_dependency`
- `primitive_bottleneck` now includes explicit repair/failure/disconfirmation metadata.
- `primitive_gate_dependency` is linked; metadata hardening remains a follow-up step.

## Findings for Team Decision

1. **Release confidence remains strong**: evaluation gate stays green with strict closure discipline.
2. **Matching conversion is still weak**: linked primitives are not yet converting stress-suite candidates into `*_match` with non-empty `shapeIds`.
3. **Bottleneck quality improved**: operational guidance fields are now present and testable.
4. **Second primitive path is validated**: promotion loop is repeatable and receipt-backed.

## Recommended Next Steps

1. Harden `primitive_gate_dependency` metadata (same three fields as bottleneck).
2. Calibrate similarity/matching strategy to improve candidate -> match conversion without reducing discipline:
  - evaluate tokenization overlap behavior on known bottleneck/gate phrasings,
  - consider richer basis features beyond raw token overlap.
3. Add a focused regression check:
  - at least one known bottleneck IR and one known gate-dependency IR should resolve to populated `shapeIds` under controlled phrasing.
4. Re-run Task 1 suite after matching calibration and compare:
  - `episodes_with_shapeIds`,
  - `resultType` shifts,
  - any movement in `matchBasis`.

