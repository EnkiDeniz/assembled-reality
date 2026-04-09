# Shape Library API Contract v0.2

## System intent

Shape Library exists to turn structural claims into testable, evidence-bearing objects. It is not a prose beautifier. It is an operational layer that accepts canonical IR, runs reads and gates, and only advances claims when they are falsifiable and receipt-backed.

## Endpoints

- `POST /v1/analyze`: validate IR, optional myth decompression, run engine, persist run/candidate.
- `POST /v1/evaluate`: execute episode runner and return metric report (reproducibility, utility, optional expected alignment, convergence).
- `POST /v1/promote`: receipt-gated promotion; optional convergence OR-path; optional library link/mint/pending.
- `GET /v1/library`: list primitives/assemblies.
- `GET /v1/candidates`: list candidates (includes `linkedShapeId`, `libraryMergeStatus`, `isMythDerived` when set).

## IR versions

- `irVersion`: `0.1` (default from translator) or `0.2`.
- `inputMode`: `human` | `ai` | `myth`. Myth requires `SHAPELIBRARY_ENABLE_MYTH=1` and a valid `mythDecompression` block; the server expands myth payloads before standard IR validation.
- Optional v0.2 IR fields: `mythDecompression`, `aliases`, `crossDomainMap`, `stateMode`, `assemblyClass` (see `schema/ir.schema.json`).

## Analyze result (additive fields)

When `SHAPELIBRARY_ENABLE_V01_FIDELITY` is on (default: on), successful analyze includes:

- `matchBasis`: e.g. `token_overlap` for library matches; `null` on rejection.
- `nearMiss`: `{ shapeId, score }` for candidates when a best primitive scored below the match threshold; else `null`.

With `SHAPELIBRARY_ENABLE_KERNEL=1`: optional `kernel` (`stateMode`, `kernelGateDetails`).

With `SHAPELIBRARY_ENABLE_CROSS_DOMAIN=1`: optional `crossDomain` (`convergenceScore`, `domainCoverageCount`, `crossDomainPass`, …).

`isMythDerived: true` when the run was produced from myth expansion.

`assemblyClass` always resolves to one of:

- `combinable`
- `path_dependent`
- `developmental_embodied`

`maturation` includes:

- `requiredStages`
- `nonImportableProperties`
- `gate` (`passed`, failures, warnings)

## Evaluate semantics

- **Reproducibility:** stability of analyze outputs across iterations (result type, top shape id, gate, granularity, rationale similarity) — not the same as label accuracy.
- **expectedAlignment:** mean score over episodes where `episode.expected` includes `granularity` / `resultType` / `shapeIds` and those fields are compared to the **first** iteration’s outcome.
- **utilityV01:** utility from the original v0.1-style formula (per-run `scoreUtility` averaged).
- **utility:** when `SHAPELIBRARY_ENABLE_CROSS_DOMAIN=1`, may blend in `crossDomain.convergenceScore` from the last iteration per episode (`0.85 * utilityV01 + 0.15 * convergence` when convergence is numeric).
- **convergenceScore** / **domainCoverageCount** / **crossDomainPass:** aggregate cross-domain metrics when the cross-domain flag is enabled.
- **maturationScore** / **maturationPass:** aggregate staged assembly readiness from per-run maturation gates.
- **maturationThreshold:** current release threshold for maturation (`0.85`).
- **hardFailures:** non-negotiable release blockers (currently includes `adversarial_maturation_failure` when any adversarial episode fails maturation).

## Promotion

- **Classic threshold:** `reproducibility >= 0.8` and `utility >= 0.5`.
- **OR path:** `crossDomainConvergence >= 0.5` and `utility >= 0.5` (pass `crossDomainConvergence` on the promote body).
- **Myth-derived candidates** (when myth is enabled): at least one receipt must **not** be myth-only (`myth_interpretation`, `myth_handle_only`, `myth_only`).
- **libraryAction** (optional, when approved): `link` (set `linkedShapeId`, default target from token match), `mint` (new `ShapePrimitive`, `mint_*` id), `pending` (`libraryMergeStatus`).
- **assemblyClass receipts:** promotion also requires class-specific receipts (`runtime_observation` always, plus stage receipts for path-dependent/developmental classes).

Response `value.libraryOutcome`: `linkedShapeId`, `mintedShapeId`, `libraryMergeStatus`.
Response `value.assemblyPath`: resolved class, required receipts, missing receipts, pass/fail.

## Error classes this API is meant to prevent

- **Narrative laundering:** vague language promoted as named structure.
- **Evidence bypass:** promotions that skip receipt-backed proof.
- **Metric confusion:** assuming reproducibility means correctness.
- **Catalog drift:** ad-hoc shape additions without explicit closure state.

## Gate examples

**Reject case**

- Input has abstract invariant ("team lacks alignment"), no falsifier, and no transfer prediction.
- Expected: structure/transfer failure path (`invalid_input` or gate failure payload depending on where it fails).

**Advance case**

- Input has specific bottleneck invariant, operational observables, explicit falsifier, transfer prediction, and later runtime receipts.
- Expected: analyze produces candidate or match, and promote advances through receipt gate with `libraryAction` (`link`, `mint`, or `pending`).

## Error codes

- `invalid_input`
- `invalid_layer_execution`
- `gate_failed`
- `promotion_blocked_missing_receipts`
- `myth_mode_disabled`

## Runtime defaults

- Port: `4310`
- Health `version`: `0.2.0`
- Thresholds: reproducibility `0.80`, utility `0.50`

## Feature flags (environment)

| Variable | Default | Effect |
|----------|---------|--------|
| `SHAPELIBRARY_ENABLE_V01_FIDELITY` | on | `matchBasis`, `nearMiss`, derived candidate confidence |
| `SHAPELIBRARY_ENABLE_MYTH` | off | `inputMode: myth` |
| `SHAPELIBRARY_ENABLE_KERNEL` | off | `kernel` block on analyze |
| `SHAPELIBRARY_ENABLE_CROSS_DOMAIN` | off | `crossDomain` on analyze; evaluate utility/convergence aggregates |

## Result exports (folder)

Successful and structured error responses can be mirrored to JSON files under a configurable directory (default: `results/` relative to the process cwd, i.e. `shapelibrary/results/` when you run `npm run dev` from `shapelibrary/`).

- `results/analyze/` — each `POST /v1/analyze` outcome (success, invalid IR, invalid layer, gate failed)
- `results/evaluate/` — each successful `POST /v1/evaluate` run
- `results/promote/` — each successful `POST /v1/promote`, and blocked promote (no receipts)

Each file includes `exportedAt`, `resultsRoot`, `relativePath`, and the payload.

**Environment variables**

- `SHAPELIBRARY_RESULTS_DIR` — root folder for exports (default: `results`)
- `SHAPELIBRARY_EXPORT_RESULTS` — set to `0`, `false`, or `off` to disable file export

**API response**

When export is enabled, responses may include `exportedTo`: a path relative to cwd pointing at the written file (or `null` if disabled / write failed silently — writes use sync I/O and throw on failure).

**Disable exports**

```bash
SHAPELIBRARY_EXPORT_RESULTS=0 npm run dev
```
