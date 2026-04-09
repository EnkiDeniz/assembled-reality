# Shape Library Matching Frontier - Combined Summary Brief

Date: 2026-04-09
Scope: Completion of remaining steps from the matching-frontier brief (Task A, Task B Steps 1-3, Task C), plus consolidated findings and next-step decisions.

## Executive Outcome

- Pipeline discipline remains intact (no closure laundering introduced).
- Matcher was upgraded from strict lexical overlap to a hybrid structural overlap strategy.
- Regression gate now passes:
  - bottleneck known input resolves to `shapeIds: ["primitive_bottleneck"]`
  - gate-dependency known input resolves to `shapeIds: ["primitive_gate_dependency"]`
- One match-case corpus episode was added and validated with passing evaluate output.

## Task A - Harden `primitive_gate_dependency`

Action:
- Updated `primitive_gate_dependency` metadata in library entry with:
  - `repairLogic`
  - `failureSignature`
  - `disconfirmationCondition`

Result:
- Library now has hardened guidance for both promoted primitives:
  - `primitive_bottleneck`
  - `primitive_gate_dependency`

## Task B Step 1 - Instrument current matching

Controlled bottleneck analyzes (before calibration) showed:
- Canonical phrasing matched.
- Moderate/loose paraphrases stayed candidate + near-miss.

Artifacts from instrumentation pass:
- `shapelibrary/results/analyze/2026-04-09T17-16-20.619Z_analyze_ok_74a6f24e-6dc1-4d5b-8983-49398f0a1553.json`
- `shapelibrary/results/analyze/2026-04-09T17-16-20.620Z_analyze_ok_a663d896-e1dc-4424-9a49-ea9992a57ab3.json`
- `shapelibrary/results/analyze/2026-04-09T17-16-20.622Z_analyze_ok_f0a28dac-695f-4e40-b708-065ceaedde49.json`

## Task B Step 2 - Enrichment options assessment

Assessed options:

1. **Invariant embedding similarity**
   - Pros: best paraphrase tolerance
   - Cons: new dependency/model path, cost/latency, reproducibility and audit complexity
   - Risk: introducing opaque similarity before calibration discipline matures

2. **Join pattern matching**
   - Pros: directly structural, interpretable, compatible with assembly-class discipline
   - Cons: coverage depends on join-pattern quality/presence in IR and primitive metadata
   - Risk: sparse signals unless consistently authored

3. **Falsifier pattern matching**
   - Pros: aligns with epistemic discipline and disconfirmation law
   - Cons: sparse/variable phrasing in current corpus and primitive metadata
   - Risk: weak early lift without broader corpus normalization

Recommendation chosen:
- **Hybrid structural overlap (implemented)**:
  - synonym-normalized token overlap
  - weighted blend of invariant, constraints, and structural signals (join/falsifier/failure)
  - calibrated threshold for candidate->match conversion while keeping explicit `matchBasis`

Implemented matcher changes:
- `matchBasis` now reports `hybrid_structural_overlap`
- similarity now uses synonym normalization and balanced overlap formula
- shape scoring blends invariant + constraints + structural evidence
- threshold calibrated to preserve discipline while enabling known-good conversions

## Task B Step 3 - Regression gate (required)

Regression run outputs:
- Bottleneck:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_bottleneck"]`
  - `matchBasis: "hybrid_structural_overlap"`
  - artifact: `shapelibrary/results/analyze/2026-04-09T17-27-07.527Z_analyze_ok_1ad0f2b6-6d83-4690-8dab-a6f48e7672f6.json`

- Gate dependency:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_gate_dependency"]`
  - `matchBasis: "hybrid_structural_overlap"`
  - artifact: `shapelibrary/results/analyze/2026-04-09T17-27-07.530Z_analyze_ok_37049a0f-d210-44da-9136-dc73761fe2cc.json`

Status:
- Regression gate passed.

## Task C - Add one match-case corpus episode

Added fixture:
- `shapelibrary/fixtures/episodes/matchcase.episodes.json`
- Episode: `match-001-bottleneck-lane-throttle`
- Expected:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_bottleneck"]`

Evaluate run (8 stress + 1 match-case):
- artifact: `shapelibrary/results/evaluate/2026-04-09T17-27-27.299Z_evaluate_run.json`
- `releaseGatePass: true`
- `expectedAlignment: 1`
- Match-case first run:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_bottleneck"]`
  - `matchBasis: "hybrid_structural_overlap"`

## Test and Quality Status

- Test suite: `21/21` passing after matcher and threshold calibration.
- Existing release discipline preserved:
  - early `not_sealable_yet` behavior remains intact
  - evaluator hard-fail semantics remain aligned with correct pre-screen logic

## Consolidated Findings

1. The bottleneck has shifted from pipeline integrity to matcher quality, and this phase addressed that directly.
2. Two promoted primitives are now both linked and operationally defined.
3. Candidate->match conversion now works for required known-good regression inputs without removing closure discipline.
4. `expectedAlignment` becomes informative with explicit match-case expectations in corpus.

## Recommended Next Steps

1. Add one gate-dependency match-case episode (parallel to `match-001`) so both primitives are represented in corpus-level expected alignment.
2. Add matcher observability fields to evaluate rollups (`matchBasis` distribution, near-miss histogram) for calibration tracking.
3. Consider embedding-based similarity only after collecting baseline drift metrics from the new hybrid matcher over multiple runs.
