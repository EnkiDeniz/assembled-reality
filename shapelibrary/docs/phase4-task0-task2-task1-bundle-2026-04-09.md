# Phase 4 Bundle Report (Task 0 + Task 2 + Task 1)

Date: 2026-04-09
Scope: Complete revised priority bundle: library write governance, join pattern array conversion check, and third primitive spec (review-only).

## Task 0 - Library Write Governance

Implemented:

- Versioned primitive spec history via table:
  - `ShapePrimitiveSpecVersion`
- Governed write endpoint:
  - `PATCH /v1/library/primitives/:shapeId`
- Explicit update metadata on every patch:
  - `updatedAt`
  - `updatedBy`
  - `changeReason` (added recommendation)
  - `fieldsChanged`
  - `priorValues`
- Promote records remain immutable (no edit path added for promotion decisions).

### Versioned Primitive Record Schema

```json
{
  "versionId": "uuid",
  "shapeId": "primitive_bottleneck",
  "version": 2,
  "snapshotJson": {
    "shapeId": "primitive_bottleneck",
    "name": "Bottleneck",
    "invariant": "...",
    "status": "promoted",
    "metadata": {
      "joinPattern": ["request", "review", "approve", "ship"],
      "repairLogic": "...",
      "failureSignature": "...",
      "disconfirmationCondition": "..."
    },
    "createdAt": "ISO-8601"
  },
  "updatedAt": "ISO-8601",
  "updatedBy": "agent|human",
  "changeReason": "short rationale",
  "fieldsChangedJson": ["joinPattern", "repairLogic"],
  "priorValuesJson": {
    "joinPattern": ["request", "review", "ship"],
    "repairLogic": null
  }
}
```

### PATCH Endpoint Spec

`PATCH /v1/library/primitives/:shapeId`

Request body (partial updates only):

```json
{
  "invariant": "optional string",
  "joinPattern": ["optional", "ordered", "array"],
  "repairLogic": "optional string",
  "failureSignature": "optional string",
  "disconfirmationCondition": "optional string",
  "updatedBy": "agent_or_human_id",
  "changeReason": "why this patch was made"
}
```

Response:

```json
{
  "ok": true,
  "value": {
    "shapeId": "primitive_bottleneck",
    "name": "Bottleneck",
    "invariantText": "...",
    "metadata": { "...": "..." },
    "specVersion": 2,
    "specUpdatedAt": "ISO-8601",
    "specUpdatedBy": "agent_or_human_id",
    "specChangeReason": "why this patch was made",
    "fieldsChanged": ["repairLogic"]
  }
}
```

Validation behavior confirmed:
- Empty/unsupported patch body returns `400 invalid_input`.

### Migration Confirmation (required)

Both existing promoted primitives were migrated to versioned records with current metadata as version 1:

- `primitive_bottleneck` -> version 1, `updatedBy: system_migration`, `changeReason: bootstrap_versioning_v1`
- `primitive_gate_dependency` -> version 1, `updatedBy: system_migration`, `changeReason: bootstrap_versioning_v1`

## Task 2 - Join Pattern Array Format

Target conversion:

- `primitive_bottleneck` -> `["request", "review", "approve", "ship"]`
- `primitive_gate_dependency` -> `["draft", "legal_review", "approval", "execute"]`

Status:
- Converted and confirmed via `/v1/library` metadata type check (`joinPatternType: list`).

### Controlled Bottleneck Inputs: Before vs After

Before conversion artifacts:
- `results/analyze/2026-04-09T17-45-31.848Z_analyze_ok_6f0629be-7572-4593-bdc9-2bd256b6176f.json`
- `results/analyze/2026-04-09T17-45-31.850Z_analyze_ok_a8cd7d72-a913-4884-8a32-af21bc05918f.json`
- `results/analyze/2026-04-09T17-45-31.851Z_analyze_ok_ed41f253-33bf-4e9d-8905-7a73000be5b4.json`

After conversion artifacts:
- `results/analyze/2026-04-09T18-01-59.535Z_analyze_ok_e46218fb-8b35-4a7f-aabd-3797ba73689d.json`
- `results/analyze/2026-04-09T18-01-59.536Z_analyze_ok_30edba7b-6317-4e3c-a797-9802e2c0af5e.json`
- `results/analyze/2026-04-09T18-01-59.538Z_analyze_ok_2c4ed086-484b-4a71-a5be-88a373405b9e.json`

Observed effect:
- No regression from array conversion.
- Canonical/paraphrase remained match.
- Symptom-only remained candidate with stable near-miss behavior.

Interpretation:
- Converting joinPattern storage to ordered arrays is structurally cleaner and did not degrade match behavior under current scorer.

## Task 1 - Third Primitive Spec (review-only, no promote)

Proposed primitive:

```json
{
  "shapeId": "primitive_saturation",
  "assemblyClass": "combinable",
  "invariant": "Additional input into the same channel yields diminishing marginal output after a threshold, while operating constraints remain unchanged.",
  "joinPattern": ["input_increase", "same_channel_exposure", "marginal_output_flattening", "plateau"],
  "failureSignature": "After shifting to a differentiated channel or audience, marginal returns recover materially without changing core process constraints; if gains rebound, the original read was channel-fit or gate-limited, not saturation.",
  "repairLogic": "Reduce same-channel pressure and introduce differentiated capacity (new audience/channel/path), then compare marginal gain slope before vs after the shift.",
  "disconfirmationCondition": "Run a bounded A/B: keep one cohort in the same channel and move one cohort to a differentiated channel. If marginal return slope does not improve in the differentiated cohort, saturation is not the primary structure."
}
```

Distinctness rationale:
- `primitive_bottleneck` is lane-constrained flow (path-dependent transition choke).
- `primitive_gate_dependency` is condition-blocked progression (path-dependent approval dependency).
- `primitive_saturation` is diminishing marginal utility under unchanged channel assumptions (combinable response curve dynamic).

No analyze/promote cycle was run for this third primitive in this bundle.

## Task 3 - Baseline Run 4 (post-governance + post-join-format)

Evaluate artifact:
- `results/evaluate/2026-04-09T18-07-08.372Z_evaluate_run.json`

Summary:
- `releaseGatePass: true`
- `reproducibility: 1`
- `utility: 0.7362499999999998`
- `expectedAlignment: 1`
- `matchBasisDistribution`:
  - `none: 12`
  - `hybrid_structural_overlap: 18`

Near-miss drift snapshot:
- `nearMissHistogram.totalNearMisses: 9`
- `nearMissHistogram.byShape.primitive_bottleneck`:
  - `avgScore: 0.1677`
  - `minScore: 0.067`
  - `maxScore: 0.3444`

Compared to prior phase baseline (`avg ~0.1883` on bottleneck), this run shows:
- slightly lower bottleneck average near-miss
- higher max near-miss
- stable release and reproducibility

Over-match guardrail check:
- No stress-suite episode crossed into match territory.
- Stress outputs remain rejection / not_sealable_yet / candidate as expected.

Match-case regression check:
- `match-001-bottleneck-lane-throttle`:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_bottleneck"]`
  - `matchBasis: hybrid_structural_overlap`
- `match-002-gate-dependency`:
  - `resultType: primitive_match`
  - `shapeIds: ["primitive_gate_dependency"]`
  - `matchBasis: hybrid_structural_overlap`

Interpretation:
- Structural refinement and governance preserved epistemic discipline.
- Match-case expectations hold for both promoted primitives.
- Stress-suite remains contained (no over-match drift).
