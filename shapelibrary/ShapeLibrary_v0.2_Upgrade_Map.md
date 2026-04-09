# Shape Library v0.2 Upgrade Map (Additive, Non-Breaking)

**Status:** Planning — next implementation phase after v0.1  
**Relation to v0.1:** Incremental upgrade; v0.1 behavior and contracts remain the baseline.  
**Companion:** [ShapeLibrary_Standalone_System_Spec_v0.1.md](./ShapeLibrary_Standalone_System_Spec_v0.1.md)

---

## 1) Versioning + compatibility rules

- Keep **v0.1** behavior intact by default.
- Add `irVersion: "0.2"` support; if missing, treat as `0.1`.
- Add runtime feature flags (env or config):
  - `enableMythDecompression`
  - `enableBraidKernel`
  - `enableCrossDomainConvergence`
- Rule: v0.2 fields are **optional** unless `inputMode = "myth"` or `irVersion = "0.2"` with strict mode enabled.

---

## 2) Schema upgrades (add, do not break)

Extend `schema/ir.schema.json` (and related validators) with optional v0.2 blocks:

- **`inputMode`:** add `"myth"`.
- **`mythDecompression`** object:
  - `mythicHandle`
  - `canonicalInvariant`
  - `sequencePattern[]`
  - `roleMapping`: `{ preserved, threat, boundary, validator }`
  - `triLayerMap`: `{ molecular, biological, operational }`
  - `counterpartShape`
  - `falsifier`
  - `candidateUse`
- **`aliases`** object:
  - `mythic[]`, `technical[]`, `deprecated[]`
- **`trace`** extension (kernel-aligned):
  - `events[]`, `successCount`, `failureCount`, `recurrence`, `orderingValid`
- **`crossDomainMap`** object:
  - `domains[]`, `functionalClass`, `consistencyScore`
- **`stateMode`** (kernel-level enum):
  - `candidate | viable | unstable | extinct | locked`

**Validation additions:**

- If `inputMode = myth`, require `mythDecompression.canonicalInvariant`, `mythDecompression.falsifier`, and at least one operational mapping.
- Myth-derived entries cannot satisfy promotion with myth-only evidence (enforce in **promote** logic, not schema alone).

---

## 3) Core engine upgrades

**Matching and confidence (v0.1 fidelity):**

- v0.1 library match uses **token overlap** between IR `invariant` and each primitive’s `invariantText` above a fixed threshold; **no** use of `episode.expected` during analyze. Benchmark episodes are only “easy” if their wording aligns with seeded invariants — document this and reduce surprise in operators’ mental models.
- **`candidate_primitive` / `candidate_assembly` confidence** is a **fixed constant** when no match fires; replace with a **derived** score from reads, gate warnings, evidence refs, and (when available) near-miss similarity to the top library candidate.
- Optional: **`matchBasis`** in analyze output (`token_overlap` | `alias` | `embedding` | …) for transparency; optional **`nearMiss`**: top primitive id + score when below promote threshold.

Add a pre-pass and integrated passes:

1. **Myth decompression pass** (before canonical analysis)
   - Input: symbolic / mythic text.
   - Output: normalized operational invariant + falsifier + mapping fields.
   - Provenance: `source: myth_handle` — not evidential truth.

2. **Braid kernel pass** (inside `analyze`)
   - **Build pass:** structure formation, reinforcement.
   - **Break pass:** simulated constraint pressure, instability exposure.
   - Compute kernel state transitions (`candidate → viable / unstable / extinct / locked`).

3. **Cross-domain convergence pass**
   - Map result across domain tags.
   - Compute `convergence_score` from:
     - domain agreement
     - functional similarity
     - interpretation consistency

---

## 4) Gate logic changes

- **Structure gate (v0.2):** existing checks **plus** invariant stability under break pressure.
- **Transfer gate (v0.2):** existing checks **plus** survival across at least one simulated break condition.

Keep v0.1 gate outputs; add **`kernelGateDetails`** (or equivalent) so responses stay backward-compatible.

---

## 5) Evaluation engine changes

Extend `shape-eval` output with:

- `convergenceScore`
- `domainCoverageCount`
- `crossDomainPass` (e.g. `>= 2` aligned domains)

**Utility update:**

- Add cross-domain applicability component; consider preserving v0.1 utility as `utility_v0_1` for regression visibility.

**Regression requirement:**

- v0.2 must **not** degrade v0.1 thresholds on the v0.1 benchmark set.

**Evaluate semantics (close the spec–implementation gap):**

- **Document** in the API contract: reproducibility measures **stability of `analyze` across iterations** (result type, top `shapeId`, gate, granularity, rationale similarity) — not “ground truth” agreement with `episode.expected`.
- **Optionally score correctness:** use each episode’s `expected` (e.g. expected `granularity`, and when present expected `resultType` / `shapeIds`) to compute an **`expectedAlignment`** (or `labelAccuracy`) metric **in addition to** reproducibility, so benchmark runs report both **stability** and **labeled alignment**.
- Keep `structuredPass` as metadata completeness; do not treat it as shape-ID accuracy unless the new metric is implemented.

---

## 6) Promotion rule changes

Receipt gate remains mandatory. **Add:**

- Promotion allowed if:
  - `reproducibility >= threshold` **OR** `crossDomainConvergence >= threshold`
- For **myth-derived** candidates:
  - must include **non-myth** evidence receipts
  - must pass at least one **break simulation**

Keep existing promotion state machine; treat kernel `stateMode` as metadata unless you explicitly merge it with promotion states.

**Promotion–library closure (v0.1 gap):**

- v0.1 **`/v1/promote`** persists receipts, applies caller-supplied `reproducibility` / `utility`, and updates **candidate status** only — it does **not** attach the candidate to an existing `ShapePrimitive`, insert a new library row, or re-run matching to emit a canonical `shapeId`.
- v0.2 should **define and implement** at least one path:
  - **Link:** on approved promotion, set `linkedShapeId` (or equivalent) when evidence + invariant alignment justify mapping to an existing primitive; **or**
  - **Mint:** insert a new `ShapePrimitive` (with provenance from run/candidate/receipts) when the candidate is novel; **or**
  - **Explicit human gate:** API records `promoted` plus `pendingLibraryMerge` until an operator confirms link vs mint.
- Myth-derived candidates remain subject to non-myth evidence rules above.

---

## 7) Storage extensions (non-destructive migration)

Add nullable columns or parallel tables:

- **`ShapeRun`:** `kernelState`, `kernelTraceJson`, `convergenceScore`, `domainMapJson`, `isMythDerived`
- **`ShapeCandidate`:** same summary fields for querying
- Optional **`ShapeAlias`** table for `mythic` / `technical` / `deprecated` alias tracking

**Migration rule:** nullable columns only; no breaking table rewrites.

---

## 8) API contract (same endpoints; extend payloads)

No new routes required for v0.2 if you extend existing bodies/responses:

- **`POST /v1/analyze`**
  - Accept `inputMode: myth`
  - Return optional blocks: `mythDecompression`, `kernel`, `crossDomain`
  - **§11:** optional `matchBasis`, `nearMiss`, derived (non-constant) confidence for candidates
- **`POST /v1/evaluate`**
  - Return legacy metrics **plus** convergence metrics
  - **§11:** optional `expectedAlignment` (or equivalent) alongside reproducibility
- **`POST /v1/promote`**
  - Support convergence-based promotion path + myth constraints
  - **§11:** response includes library outcome: `linkedShapeId` | `mintedShapeId` | `pendingLibraryMerge` when fidelity upgrades ship
- **`GET /v1/library`**
  - Optional filters: `kernelState`, `isMythDerived`, `convergenceScore`

---

## 9) Implementation order (safe rollout)

1. Schema + validator support (no behavior change yet).
2. **§11 fidelity:** contract doc updates + optional `expectedAlignment` + `matchBasis` / `nearMiss` (low risk).
3. Myth decompression module behind feature flag.
4. Kernel trace and build/break pass.
5. Cross-domain scoring.
6. Gate upgrades.
7. Promotion upgrades (including **library closure** from §6 / §11).
8. Eval / reporting updates.
9. Benchmark expansion (myth + cross-domain cases).
10. Final regression + release gate.

---

## 10) Definition of done (v0.2)

- Myth inputs produce valid IR and structured decomposition.
- Kernel dynamics alter outcomes in at least one benchmark class.
- Convergence metrics are computed and queryable.
- Promotion obeys new OR rule + myth constraints.
- **v0.1 tests and thresholds still pass** on the v0.1 corpus.
- **§11 items** are either implemented or explicitly deferred with a short rationale in this doc.

---

## 11) v0.1 fidelity fixes (audit backlog)

These items capture gaps between **intended operator narrative** and **v0.1 behavior**, so v0.2 planning stays honest and actionable.

| Area | v0.1 behavior (as implemented) | v0.2 fix (target) |
|------|--------------------------------|-------------------|
| **Evaluate vs “known answers”** | Benchmark success is **reproducibility + utility + corpus quality flags**; `episode.expected` is used for **structuredPass** only, not to score whether `shapeIds` match labels. | Document in contract; add **optional** `expectedAlignment` / label metrics (§5). |
| **Analyze vs benchmark** | Same `analyze` path and DB library for live and eval; fixtures “win” mainly via **wording overlap** with seeded `invariantText`. | Document; improve matching (aliases, normalization, optional embedding) and expose `matchBasis` / `nearMiss` (§3). |
| **Candidate confidence** | Constant confidence when no library hit. | Derive from reads, gates, and near-miss scores (§3). |
| **Promotion → library** | Receipts + thresholds update **candidate status** only; no automatic `ShapePrimitive` link or insert. | Implement link/mint/operator gate path (§6). |
| **Receipt semantics** | Receipts are stored; promotion uses **caller-supplied** `reproducibility` / `utility` in the promote body — not recomputed server-side from stored eval runs. | Optionally recompute or validate against latest stored eval; document contract (§6, API). |

**Implementation note:** Items in this table can ship incrementally behind existing `enable*` flags or a dedicated `enableV01FidelityUpgrades` if you want to bundle them separately from myth/kernel work.

---

## 12) v0.2.0 implementation status (codebase)

The following are **implemented** in the standalone package (see `docs/api-contract.md` and `README.md`):

- IR `0.1` / `0.2`, `inputMode: myth`, optional `mythDecompression`, `aliases`, `crossDomainMap`, `stateMode`; myth expansion before validation when `SHAPELIBRARY_ENABLE_MYTH=1`.
- Feature flags: `SHAPELIBRARY_ENABLE_V01_FIDELITY` (default on), `SHAPELIBRARY_ENABLE_MYTH`, `SHAPELIBRARY_ENABLE_KERNEL`, `SHAPELIBRARY_ENABLE_CROSS_DOMAIN`.
- Analyze: `matchBasis`, `nearMiss`, derived candidate confidence (fidelity); optional `kernel` and `crossDomain` blocks; `isMythDerived` when applicable.
- Evaluate: `expectedAlignment`, `utilityV01`, aggregate `convergenceScore` / `domainCoverageCount` / `crossDomainPass` when cross-domain is enabled; reproducibility definition unchanged.
- SQLite `user_version` migration v1: extra columns on `ShapeRun` / `ShapeCandidate` for kernel, convergence, myth, library merge.
- Promote: `crossDomainConvergence` OR-path with classic thresholds; `libraryAction` `link` | `mint` | `pending`; myth-derived promotion requires a non-myth receipt when myth is enabled.
- Fixtures: `fixtures/episodes/myth.smoke.episodes.json`, `fixtures/episodes/crossdomain.smoke.episodes.json`; benchmark `ep-001` includes full `expected` labels for alignment smoke.

**Explicitly deferred** (per §11 and earlier deferrals): embedding-based `matchBasis`, `ShapeAlias` table / synonym matching, server-side recomputation of promote thresholds from stored eval runs (still caller-supplied on `/v1/promote`).

---

## Build continues from here

**Current baseline:** v0.2.0 under `shape-core/`, `shape-store/`, `shape-eval/`, `shape-api/`, `schema/`, `fixtures/episodes/`, `tests/`. Run `npm install`, `npm run test`, `npm run dev` from this folder.

**Next work:** deepen kernel and cross-domain semantics, optional alias/embedding matching, and any v0.3 items not listed above.
