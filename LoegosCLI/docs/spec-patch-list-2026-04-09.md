# Spec Patch List — 2026-04-09

This is the concrete patch map applied from the architecture decisions.

## 1) Closure Authority + `attest`

Implemented:

- Added `attest` to reserved `CLS` verbs.
- Added signature rule: `CLS attest ... if <rationale>` (`if` required).
- Added parse guard: `PH006` when `CLS attest` has missing/empty rationale.
- Added runtime closure mapping: `attested` state.

Files:

- `packages/compiler/src/constants.mjs`
- `packages/compiler/src/parse.mjs`
- `packages/compiler/src/compile.mjs`
- `packages/runtime/src/index.mjs`
- `Lœgos Compiler-Facing Spec v0.md`

## 2) State Semantics Split

Implemented:

- `compileState`: `clean|warning|blocked`
- `runtimeState`: `open|awaiting|returned|closed`
- `closureType`: `seal|flag|stop|reroute|attest|null`
- `mergedWindowState`: primary badge state

Merged precedence enforced:

`shape_error > flagged > awaiting > attested > rerouted > stopped > sealed > open`

Files:

- `packages/compiler/src/compile.mjs`
- `apps/cli/src/index.mjs`
- `docs/compiler-artifact-contract-v0.md`
- `Lœgos Compiler-Facing Spec v0.md`

## 3) Artifact Contract Lock

Implemented:

- `artifactVersion` locked to `0.5.0` in compiler output.
- Added `tokenizedLines` with token categories + source spans.
- Added `stats` object (`lineCount`, `clauseCount`, `errorCount`, `warningCount`, `symbolCount`).

Files:

- `packages/compiler/src/parse.mjs`
- `packages/compiler/src/compile.mjs`
- `packages/schemas/compile-report.schema.json`
- `docs/compiler-artifact-contract-v0.md`

## 4) Fixture + Test Updates

Added fixtures:

- `packages/fixtures/attest-with-rationale.loe`
- `packages/fixtures/attest-missing-rationale.loe`

Added tests:

- lawful `attest` path emits `mergedWindowState=attested`
- missing rationale triggers `PH006`
- artifact contract fields exist and version is `0.5.0`

File:

- `packages/compiler/test/fixtures.test.mjs`

## 5) Outstanding Clarifications (optional next pass)

1. Whether `attest` should bypass or enforce SH006/SH007 at closure time (current behavior: closure attempt rules still apply).
2. Whether `returned` should eventually become a surfaced merged label or stay drill-down only.
3. Whether to add explicit `SH009` emission in checker (spec mentions it; implementation currently uses parse error `PH006` for rationale absence).
