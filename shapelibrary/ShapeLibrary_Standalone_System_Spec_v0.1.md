# Shape Library Standalone System Spec

Status: Draft v0.1  
Owner: Shape Library side project  
Purpose: Define a standalone, reusable Shape Library system that can be integrated with Loegos later, without coupling early architecture to one host product.

---

## 1) Problem statement

Shape Library needs to operate as an independent subsystem that can:

1. Accept human or machine input.
2. Normalize to a canonical intermediate representation (IR).
3. Run shape interpretation with explicit gates.
4. Produce stable outputs with measurable reproducibility and utility.
5. Promote primitives and assemblies only through receipt-backed rules.

It is designed as an epistemic discipline layer:

1. Convert witness claims into operable structure.
2. Reject weak or non-falsifiable claims before they become named matches.
3. Keep reproducibility (stability) separate from expected alignment (label agreement).
4. Require explicit library closure on advancement (`link`, `mint`, or `pending`) so promotion is not a status-only flip.
5. Classify assembly path (`combinable`, `path_dependent`, `developmental_embodied`) so stage requirements are explicit.

This spec is implementation-facing and planning-ready.

---

## 2) Product goals

### 2.1 Primary goals

1. Standalone by default (no hard dependency on Loegos runtime internals).
2. Reusable across multiple host systems.
3. Deterministic-enough evaluation harness for reproducibility tracking.
4. Explicit promotion gate ("no receipt, no promotion").
5. Clear API and storage contract that supports adapters later.

### 2.2 Non-goals for v0.1

1. Full formal ontology completeness.
2. Perfect truth verification.
3. Rich UI workbench.
4. Multi-tenant enterprise concerns.
5. Tight coupling to any single host app.

---

## 3) System boundaries

### 3.1 In scope

1. Core engine pipeline.
2. Canonical IR schema.
3. Primitive and assembly library persistence.
4. Episode/evaluation runner.
5. Promotion decision path.
6. Thin API surface.

### 3.2 Out of scope

1. Host product UX and navigation.
2. Final receipt authority network integration details.
3. Domain-specific adapters beyond a baseline contract.

---

## 4) Architecture (standalone first)

Use a hybrid shape:

1. `shape-core` (pure library; no transport concerns)
2. `shape-eval` (episode orchestration and scoring)
3. `shape-store` (library + episode persistence)
4. `shape-api` (thin HTTP wrapper around core/eval/store)
5. `shape-adapters/*` (optional host-specific translation layers; later)

### 4.1 Logical flow

1. Intake payload arrives (`human` or `ai`).
2. Translation module outputs canonical IR.
3. Granularity check (`primitive` | `assembly` | `unknown`).
4. Five Reads executed.
5. Gates executed (structure, transfer, falsifier required).
6. Library search returns match or candidate.
7. Result emitted with confidence, rationale, ambiguity, and required receipts.
8. Optional evaluation episodes run for reproducibility/utility measurement.
9. Promotion path remains pending until receipt criteria met.

---

## 5) Canonical IR contract (v0.1)

All front doors must produce this shape.

```json
{
  "irVersion": "0.1",
  "runId": "uuid",
  "runType": "single|evaluation|promotion_check",
  "inputMode": "human|ai",
  "mode": "exploratory|standard",
  "intentLayer": "ontology|behavior|communication|intervention|evaluation",
  "assumptionStatus": "explicit|inferred|repaired",
  "observables": ["string"],
  "timescale": {
    "horizon": "immediate|short|medium|long",
    "window": "string"
  },
  "constraints": ["string"],
  "resourceBudget": {
    "time": "string",
    "money": "string",
    "attention": "string",
    "other": ["string"]
  },
  "operationalFailure": "string",
  "invariant": "string",
  "variables": ["string"],
  "granularity": "primitive|assembly|unknown",
  "shapeClass": "primitive|assembly|unknown",
  "constituentShapes": ["shape_id"],
  "assemblyRule": {
    "edges": [
      {
        "from": "shape_id",
        "to": "shape_id",
        "type": "amplifies|inhibits|gates|saturates|extracts"
      }
    ]
  },
  "joinPattern": "string",
  "pressureClaim": "string",
  "failureSignature": "string",
  "repairLogic": "string",
  "falsifier": "string",
  "transferPrediction": "string",
  "evidenceRefs": ["evidence_id"],
  "metadata": {
    "source": "string",
    "createdAt": "iso8601",
    "trace": {}
  }
}
```

### 5.1 Validation rules

1. `intentLayer` required.
2. `mode` required (`exploratory` or `standard`).
3. `granularity` required and must match Step 0 persisted output.
4. In `standard` mode, `observables`, `timescale`, `constraints`, `resourceBudget`, and `operationalFailure` are mandatory.
5. In `exploratory` mode, missing required fields are allowed but must be marked in `assumptionStatus` as `inferred` or `repaired`.
6. `falsifier` and `transferPrediction` required before passing transfer gate.
7. Missing mandatory fields in `standard` mode causes `invalid_input` result.

---

## 6) Engine contract

### 6.1 Step 0: Granularity check

Output:

```json
{
  "granularity": "primitive|assembly|unknown",
  "reason": "string",
  "confidence": 0.0
}
```

### 6.2 Step 0.5: Intent layer enforcement

Intent layer is not metadata-only. It must constrain execution behavior.

Example baseline policy:

1. If `intentLayer = ontology`, disable communication optimization and intervention planning outputs.
2. If `intentLayer = behavior`, allow process-level dynamics but no ontology promotion decisions.
3. If `intentLayer = communication`, allow frame/rhetoric reads but do not emit structural causality claims as promoted shapes.
4. If engine output crosses disallowed layer behavior, mark run `invalid_layer_execution`.

Output:

```json
{
  "intentLayerEnforced": true,
  "policy": "string",
  "violations": [],
  "executionStatus": "ok|invalid_layer_execution"
}
```

### 6.3 Step 1: Five Reads

Required outputs per read:

1. `matchInvariants`
2. `readJoins`
3. `pressGeometry`
4. `readFailure`
5. `testRepair`

Each read returns:

```json
{
  "status": "pass|weak|fail|ambiguous",
  "rationale": "string",
  "evidenceRefs": ["evidence_id"],
  "confidence": 0.0
}
```

### 6.4 Step 2: Gates

1. Structure Gate: reject if not distinguishing.
2. Transfer Gate: reject if no falsifiable prediction.

Gate result:

```json
{
  "passed": true,
  "failures": [],
  "warnings": []
}
```

### 6.5 Step 3: Search

Result types:

1. `primitive_match`
2. `assembly_match`
3. `candidate_primitive`
4. `candidate_assembly`
5. `rejection`

---

## 7) API surface (thin wrapper)

### 7.1 `POST /v1/analyze`

Input: canonical IR or front-door payload with translator mode.  
Output:

```json
{
  "runId": "uuid",
  "resultType": "primitive_match|assembly_match|candidate_primitive|candidate_assembly|rejection",
  "shapeIds": ["shape_id"],
  "granularity": "primitive|assembly|unknown",
  "gate": { "passed": true, "failures": [], "warnings": [] },
  "reads": {},
  "ambiguities": ["string"],
  "discriminatingTest": {
    "observable": "string",
    "expectedOutcomeA": "string",
    "expectedOutcomeB": "string",
    "timeWindow": "string"
  },
  "requiredReceipts": ["string"],
  "confidence": 0.0,
  "confidenceSource": "convergence|heuristic|single_run"
}
```

### 7.2 `POST /v1/evaluate`

Runs parallel or repeated episodes and returns reproducibility/utility metrics.

### 7.3 `POST /v1/promote`

Attempts promotion for candidate primitive/assembly.

Rules:

1. Must include receipt evidence set.
2. Must pass minimum reproducibility threshold.
3. Must pass minimum utility threshold.

### 7.4 `GET /v1/library`

Query primitives/assemblies by tags, classes, status, or confidence bands.

---

## 8) Persistence model (minimum)

### 8.1 Entities

1. `ShapePrimitive`
2. `ShapeAssembly`
3. `ShapeEdgeRule` (`amplifies`, `inhibits`, `gates`, `saturates`, `extracts`)
4. `ShapeEpisode`
5. `ShapeRun`
6. `ShapeCandidate`
7. `ShapePromotionDecision`
8. `ShapeReceipt`

### 8.2 Key relationships

1. Assembly contains many primitives.
2. Assembly links via edge rules.
3. Episodes contain many runs.
4. Candidates are derived from runs.
5. Promotions require linked receipts.

---

## 9) Evaluation protocol (v0.1)

### 9.1 Reproducibility metric

Definition:

`reproducibility = agreement_rate(result_type + top_shape + gate_outcome + granularity_agreement + invariant_similarity_threshold) across N repeated runs`

Initial target: `>= 0.80` on curated episode set.

### 9.2 Utility proxy metric

Definition:

1. `prediction_clarity` (0-1)
2. `falsifier_quality` (0-1)
3. `repair_actionability` (0-1)
4. `rejection_specificity` (0-1)

`utility = 0.25 * prediction_clarity + 0.25 * falsifier_quality + 0.25 * repair_actionability + 0.25 * rejection_specificity`  
Initial target: `>= 0.50`.

### 9.3 Compression metric

Track whether output reduces explanatory complexity while preserving operational distinctions.

### 9.4 Rejection quality

Rejections are positive if they are:

1. specific,
2. falsifiable,
3. non-generic,
4. guidance-bearing for next input repair.

### 9.5 Episode quality rule

Bad episodes are worse than fewer episodes.

The evaluation corpus should optimize for:

1. diversity,
2. adversarial challenge cases,
3. structured comparability,
4. explicit expected-outcome criteria.

---

## 10) Promotion policy

Promotion is receipt-backed, not argument-backed.

### 10.1 Primitive promotion requirements

1. Candidate appears recurrently across episodes.
2. Reproducibility threshold met.
3. Utility threshold met.
4. At least one accepted receipt set linked.

### 10.2 Assembly promotion requirements

1. Non-additive behavior demonstrated.
2. New failure signature beyond constituent primitives.
3. New transfer prediction beyond constituents.
4. Receipt criteria satisfied.

### 10.3 Promotion states

1. `candidate`
2. `provisional`
3. `promoted`
4. `deprecated`

---

## 11) Determinism and traceability

To evaluate reliably:

1. Persist model/version per run.
2. Persist prompt/template hash per run.
3. Persist translation trace from source payload to IR.
4. Persist read-level and gate-level rationale.
5. Log seed or sampling controls where available.

---

## 12) Security and safety (minimum)

1. Never claim truth certainty from model agreement alone.
2. Keep generator and judge separated.
3. Mark repaired assumptions explicitly.
4. Keep ambiguity explicit; do not collapse unknowns to confident classes.

---

## 13) Implementation plan (phased)

### Phase 1 (Week 1): Contracts + core skeleton

1. Define IR JSON schema.
2. Implement translator stubs (`human`, `ai`).
3. Implement engine interfaces for Five Reads and gates.
4. Implement `POST /v1/analyze`.

Deliverable: end-to-end single-run path with structured outputs.

### Phase 2 (Week 2): Storage + runs

1. Add persistence for runs, candidates, and library records.
2. Add logging and trace capture.
3. Implement `GET /v1/library`.

Deliverable: searchable run history and candidate persistence.

### Phase 3 (Week 3): Evaluation engine

1. Implement episode runner.
2. Add reproducibility/utility metric computation.
3. Add `POST /v1/evaluate`.

Deliverable: measurable quality baseline on curated dataset.

### Phase 4 (Week 4): Promotion and hardening

1. Implement receipt entity and `POST /v1/promote`.
2. Apply promotion policy checks.
3. Add regression suite for reproducibility drift.

Deliverable: receipt-gated promotion pipeline.

---

## 14) Integration-later strategy

Keep integration optional and adapter-based.

1. Host project converts its internal objects to canonical IR.
2. Host calls Shape Library via API or local package.
3. Host receives structured result and maps to local UI/state.
4. Host never bypasses Shape Library gates.

This preserves one engine with many front doors.

---

## 15) Open decisions to finalize before coding

1. Runtime language choice (`TypeScript` recommended for fast integration with current workspace).
2. Storage choice (SQLite/Postgres for standalone; JSON files acceptable only for local prototype).
3. Evaluate transport (`library-only` vs `HTTP` vs hybrid; hybrid recommended).
4. Curated evaluation episode set ownership and update workflow.
5. Receipt authority policy for provisional vs promoted states.

---

## 16) Definition of done for v0.1

v0.1 is complete when:

1. Standalone analyze/evaluate/promote APIs work.
2. Canonical IR is validated and versioned.
3. Reproducibility and utility are computed from stored episodes.
4. Promotion is blocked without receipt evidence.
5. A host adapter can be built without changing core engine internals.

---

## 17) Immediate next actions

1. Approve this v0.1 contract.
2. Choose runtime + storage.
3. Define a 20-episode seed evaluation corpus.
4. Scaffold modules: `shape-core`, `shape-eval`, `shape-store`, `shape-api`.
5. Implement `POST /v1/analyze` first with deterministic logging.

---

## 18) Plain-language summary (non-technical)

This section explains what the final system should feel like for a normal user.

### 18.1 What the system will do

The Shape Library will act like a pattern-reading assistant for messy real-world situations.

You bring in notes, plans, documents, transcripts, or mixed inputs, and the system helps you:

1. identify what pattern is likely happening,
2. see where that pattern could fail,
3. decide one practical next move,
4. define what evidence would prove the reading right or wrong.

The point is not polished summaries. The point is making decisions more testable.

### 18.2 What pre-populated shapes it starts with

The system starts with a small starter library of common process patterns (primitives), such as:

1. bottleneck-like patterns,
2. feedback-loop-like patterns,
3. gate/dependency patterns,
4. saturation patterns,
5. extraction patterns.

These are initial working patterns, not final doctrine.

### 18.3 How shapes are created and promoted

New shapes are not added because they sound smart.

A candidate shape is promoted only when:

1. it recurs across different episodes,
2. outputs are reproducible enough,
3. outputs are useful enough,
4. receipt evidence supports promotion.

Rule: no receipt, no promotion.

### 18.4 What the end user experience should feel like

A user experience target:

1. input a messy situation,
2. receive a structured pattern read,
3. inspect likely failure and test path,
4. compare alternatives,
5. choose an action with a clear falsifier,
6. return later and update using real outcomes.

In short: the product should help users move from confusion to a testable next move, with evidence over narrative confidence.

---

## 19) Next: v0.2 (kernel-aligned upgrade)

v0.1 is the shipped baseline (IR, API, storage, evaluation, promotion). The **additive v0.2 plan** (myth decompression, braid kernel, cross-domain convergence) is specified in:

- [ShapeLibrary_v0.2_Upgrade_Map.md](./ShapeLibrary_v0.2_Upgrade_Map.md)

Implementation should follow that map’s rollout order and preserve v0.1 tests and thresholds on the v0.1 benchmark corpus.

