# Shape Library Read-Order + Evaluation Patch Report (2026-04-09)

This document consolidates the implementation, tests, and runtime results for the closure-discipline patch governed by the product law:

> Do not let the metrics or the response shape claim more closure than the engine has actually earned.

## Scope Implemented

### 1) Read-order fix (engine)

File: `shapelibrary/shape-core/engine.js`

- Assembly class is resolved first.
- For `path_dependent` and `developmental_embodied`, stage pre-check runs before invariant matching.
- If stage pre-check fails, analyze returns a structured valid state:
  - `ok: true`
  - `status: "not_sealable_yet"`
  - includes: `assemblyClass`, `maturationBlockers`, `mainGap`, `nextLawfulMove`, `receiptCondition`, `possibleDisconfirmation`, `requiredReceipts`, `maturation`
- In that branch, candidate naming is withheld:
  - no `resultType`
  - no `shapeIds`
  - invariant matching does not run

### 2) Analyze API response handling

File: `shapelibrary/shape-api/server.js`

- `/v1/analyze` now treats `not_sealable_yet` as a valid success response.
- Response is schema-validated and exported as an analyze success artifact.
- Structured non-200 behavior remains for transport/schema/execution failures (existing behavior preserved).

### 3) Analyze result schema update

File: `shapelibrary/schema/analyze-result.schema.json`

- Schema upgraded to `oneOf`:
  - standard analyze result shape
  - `not_sealable_yet` result shape
- `not_sealable_yet` contract requires:
  - `runId`, `status`, `granularity`, `assemblyClass`, `maturationBlockers`,
  - `mainGap`, `nextLawfulMove`, `receiptCondition`, `possibleDisconfirmation`, `requiredReceipts`

### 4) Episode `pass` semantics hardening

File: `shapelibrary/shape-eval/evaluator.js`

- Episode `pass: true` now requires all:
  - `reproducibility >= 0.8`
  - `utility >= 0.5`
  - `maturationPass === true`
  - no per-episode hard failures

### 5) `expectedAlignment` closure fix + split granularity signal

Files:

- `shapelibrary/shape-eval/metrics.js`
- `shapelibrary/shape-eval/evaluator.js`
- `shapelibrary/schema/evaluate-result.schema.json`
- `expectedAlignment` now scores only identity-bearing expected fields:
  - `expected.resultType`
  - `expected.shapeIds`
- Granularity is separated into:
  - `granularityAlignment`
- Evaluate schema now includes `granularityAlignment`.

### 6) Persistence safety for non-sealable runs

File: `shapelibrary/shape-store/repository.js`

- `insertRun` now safely persists `not_sealable_yet` runs with defaults when classic analyze fields are absent.
- Candidate insertion is guarded when `resultType` is missing.

## Test Verification

Command run:

- `npm run test` (in `shapelibrary`)

Result:

- 20 tests passed
- 0 failed

Updated test coverage includes:

- `not_sealable_yet` read-order behavior with no candidate naming
- expected alignment split behavior (`expectedAlignment` vs `granularityAlignment`)
- evaluate result shape now including `granularityAlignment`

Files updated in tests:

- `shapelibrary/tests/v02.test.js`
- `shapelibrary/tests/eval.test.js`

## Runtime Evaluate Run (Post-Patch)

Evaluate output artifact:

- `shapelibrary/results/evaluate/2026-04-09T15-22-12.115Z_evaluate_run.json`

Top-level metrics observed:

- `reproducibility: 1`
- `utility: 0.7234375`
- `expectedAlignment: null`
- `granularityAlignment: 1`
- `maturationScore: 0.75`
- `maturationPass: false`
- `releaseGatePass: false`
- `hardFailures: ["adversarial_maturation_failure"]`

## Required 3 Checks

### Check 1: stress-02 / stress-04 response shape

Question:

- Do `stress-02-no-order-signal` and `stress-04-developmental-no-time` now return `not_sealable_yet` with no candidate name?

Observed:

- Yes.
- Both episodes return `status: "not_sealable_yet"` in each run.
- Both include blockers and next-step fields (`mainGap`, `nextLawfulMove`, `receiptCondition`, `possibleDisconfirmation`).
- Candidate naming fields are not present.

### Check 2: Maturation threshold

Question:

- Does `maturationScore >= 0.85`?

Observed:

- No. `maturationScore = 0.75`.

### Check 3: Release gate

Question:

- Does `releaseGatePass` flip to `true`?

Observed:

- No. `releaseGatePass = false`.

## Conclusion

- The closure-discipline patch is implemented and working as intended for read-order and response semantics.
- The engine now correctly withholds candidate closure when stage viability is not earned.
- Evaluation semantics now avoid over-claiming closure by:
  - tightening episode pass logic
  - separating identity alignment from granularity alignment
- Current stress batch does not earn release under the stricter gate, which is consistent with the enforced policy.

## Post-Fix Evaluate Run (2026-04-09T15:34:54)

Evaluator fix applied: correct pre-screen runs (`status: "not_sealable_yet"`, no `resultType`)
now score as maturation pass, not maturation failure.

Results:
- reproducibility: 1
- utility: 0.7234375
- maturationScore: 1
- maturationPass: true
- releaseGatePass: true
- hardFailures: []
- All 8 episodes: pass: true

stress-02 and stress-04 pass while preserving not_sealable_yet behavior.
Release gate passed. Story complete.

