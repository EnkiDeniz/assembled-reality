# LoegosCLI Implementation Plan v0

Date: 2026-04-09  
Owner: Engineering

## 1) Goal

Ship a real compiler-first Loegos system where:

- compiler output is canonical
- Mirror and Editor are renderers of the same artifact
- runtime/receipt state is auditable and deterministic

## 2) Non-Negotiable Laws

1. No direct UI mutation of canonical box state.
2. Seven cannot bypass compile/kind/shape checks.
3. Window state is computed by compiler/runtime, not inferred by UI.
4. Witness identity and return provenance are required for strong closure.
5. Compile and runtime remain separate subsystems.
6. UI reset may replace all surfaces except content-intake and voice-over player capabilities.
7. UI rebuilds must remain aligned with the existing design system language.

## 3) Build Sequence

## Phase A - Compiler Spine (now -> v0.1)

Deliverables:

- deterministic parse/kind/shape pipeline
- stable diagnostic ids and source spans
- assembly graph output
- fixture corpus runner

Acceptance:

- all corpus tests pass
- same source yields byte-stable output (except timestamp fields)
- SH/SW behavior matches spec examples

## Phase B - Artifact Contract Lock (v0.1)

Deliverables:

- frozen compile artifact schema
- validation guard in CLI and future web adapter
- compatibility policy (`artifactVersion`)

Acceptance:

- schema validation passes for all fixture outputs
- breaking changes require explicit version bump

## Phase C - Mirror Production Path (v0.2)

Deliverables:

- compiler-fed box renderer (aim/evidence/story/action/state)
- proposal gate (Seven proposal -> compile validate -> apply)
- sentence-to-line reveal backed by source spans

Acceptance:

- no mirror-only heuristics for state
- every rendered sentence maps to compile line(s)
- every applied proposal produces updated source + compile artifact

## Phase D - Editor Production Path (v0.3)

Deliverables:

- file tree with state dots from artifacts
- tokenized source rendering using compile tokens
- diagnostics panel with jump-to-line
- status bar from artifact stats

Acceptance:

- editor does not run custom parser/checker logic
- editor survives malformed files and still renders diagnostics

## Phase E - Runtime and Ledger (v0.4)

Deliverables:

- move issuance endpoint/service
- return ingestion endpoint/service
- append-only event and receipt logs
- closure transitions using active closure semantics

Acceptance:

- open -> awaiting -> closure states are reproducible from event log
- receipt provenance and witness anchor checks enforced before closure

## 4) Current Repo Mapping

Already implemented:

- `packages/compiler/src/*` (initial parser/kind/shape)
- `packages/runtime/src/index.mjs` (minimal state/event helpers)
- `apps/cli/src/index.mjs` (`compile`, `run`, `return`, `status`, `fixtures`)
- fixture tests in `packages/compiler/test/fixtures.test.mjs`

Next engineering focus:

1. strengthen compiler signatures/rules to full v0.5 behavior
2. add artifact validator and snapshot tests
3. build source-of-truth proposal gate for Mirror

## 5) Definition of Done (v0 line)

Loegos v0 is "real" when all are true:

1. compiler catches fake-convergence patterns in corpus
2. Mirror and Editor render same artifact without divergent logic
3. runtime state transitions are event-derived and replayable
4. closure decisions are blocked when SH006/SH007 constraints fail
5. intake and voice-over player flows remain reliable across UI refactors
