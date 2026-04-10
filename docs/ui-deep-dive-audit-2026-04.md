# UI Deep-Dive Audit (2026-04)

## Executive Summary

This audit reviewed the full UI surface with priority on regression risk, design-system consistency, UX clarity, and performance. The highest-risk issue is route and shell contract drift around `/workspace`: integrations and auth callbacks still target `/workspace` with query semantics that are only honored by legacy loader flows, while default routing now lands users in `/workspace/phase1`. This creates hidden behavior changes across sign-in, deep links, and integrations.

The second major risk is shell fragmentation: three workspace shells are active (`phase1`, `legacy`, `v1`) with different data bootstraps, endpoint coverage, and user terminology. Without explicit compatibility contracts, regressions can ship while one fork still appears healthy.

Design-system drift is real but manageable: token sources are split across CSS and JS token maps, and guardian audit currently fails on known violations. Performance risk is concentrated in large client shells and broad dynamic rendering.

## Scope and Method

- App routes under `src/app`
- UI shells and major components under `src/components`
- Phase shell under `LoegosCLI/UX`
- Test and guardrail scripts in `scripts`, `tests`, Playwright configs

Audit method:
- Route-to-shell topology mapping
- API wiring trace per shell
- Regression-risk ranking by blast radius
- Design-system conformance check (`npm run audit:guardian`)
- UX language and journey coherence review
- Performance hotspot analysis
- Test coverage and CI gate audit

## Severity Snapshot

| Severity | Count | Core theme |
|---|---:|---|
| Critical | 3 | Workspace routing/query contract drift |
| High | 8 | Fork divergence, auth/integration mismatch, UX term drift |
| Medium | 9 | Data fallback inconsistency, test gaps, style/token and perf risks |
| Low | 4 | Naming and route hygiene issues |

## Key Findings by Category

### 1) Regression Risk

1. **Critical**: `/workspace` redirects to `/workspace/phase1` by default, but many query params were designed for `loadWorkspacePageData` flows.  
   - Files: `src/app/workspace/page.jsx`, `src/lib/workspace-page-data.js`, `src/app/workspace/phase1/page.jsx`
2. **Critical**: post-login callbacks still use `/workspace?mode=listen`, but phase1 shell does not implement `mode`.  
   - Files: `src/components/IntroLanding.jsx`, `src/components/AuthTerminal.jsx`, `src/app/workspace/phase1/page.jsx`
3. **Critical**: integration callback returns to `/workspace` with `connected/error/mode/phase` semantics not consumed by phase1 shell.  
   - Files: `src/app/api/integrations/getreceipts/callback/route.js`, `src/app/connect/getreceipts/route.js`, `src/app/workspace/phase1/page.jsx`
4. **High**: legacy shell links can lose `legacy=1` and bounce users into phase1.  
   - Files: `src/components/WorkspaceShell.jsx`, `src/app/workspace/page.jsx`
5. **High**: shared loader parity is not guaranteed between `legacy` and `v1`, and phase1 uses different bootstrap logic.  
   - Files: `src/lib/workspace-page-data.js`, `src/app/workspace/v1/page.jsx`, `src/app/workspace/phase1/page.jsx`
6. **Medium**: deep-link route `/read/[documentKey]` can silently fall back to a different doc in phase1 if key not found.  
   - Files: `src/app/read/[documentKey]/page.jsx`, `src/app/workspace/phase1/page.jsx`

### 2) Design-System Conformance

Guardian result:
- `npm run audit:guardian` currently fails with raw color usage and decorative gradient violations.
- Reported files include:
  - `src/components/DesignProposalScreen.jsx`
  - `src/app/styles/surfaces.css`

Structural drift:
- CSS token source: `src/app/styles/tokens.css`
- JS token source: `src/lib/design-tokens.js`
- Massive global style layer: `src/app/globals.css`

Risk:
- parallel token systems and high global CSS surface increase inconsistency risk and review burden.

### 3) UX Clarity

1. **High**: same workspace ecosystem uses conflicting terms (`Mirror/Editor`, `Listen/Assemble`, `Reality/Witness`, `Language/Loe gos`).  
   - Files: `LoegosCLI/UX/loegos-phase1-shell.jsx`, `src/components/WorkspaceShell.jsx`, `src/components/reality-assembly/RealityAssemblyShell.jsx`
2. **High**: route naming says `phase1` while UI text says `Phase 2` in active shell copy and keys.  
   - Files: `src/app/workspace/phase1/page.jsx`, `LoegosCLI/UX/loegos-phase1-shell.jsx`
3. **Medium**: account integration notices can display raw error strings.  
   - File: `src/app/account/page.jsx`
4. **Medium**: `/read` and `/library` redirect bluntly to `/workspace` without preserving user intent context beyond optional doc query.  
   - Files: `src/app/read/page.jsx`, `src/app/library/page.jsx`

### 4) Performance

1. **High**: monolithic client shell (`WorkspaceShell`) with wide synchronous import graph and heavy local state complexity.  
   - File: `src/components/WorkspaceShell.jsx`
2. **High**: broad use of `export const dynamic = "force-dynamic"` across app pages increases TTFB and reduces static cache opportunities.
3. **Medium**: phase shell compiles and runs runtime logic in the browser (`compileSource`, runtime helpers).  
   - File: `LoegosCLI/UX/loegos-phase1-shell.jsx`
4. **Medium**: global CSS surface is large and always loaded.  
   - File: `src/app/globals.css`
5. **Low**: limited route-level code splitting patterns (`next/dynamic` usage not detected in `src`).

### 5) Test Coverage and Gates

Current coverage:
- Static/contract-heavy checks:
  - `npm run test:smoke` → `scripts/phase1-smoke-check.mjs`
  - `npm run test:founder`
  - `npm run test:reality-assembly`
- Browser E2E:
  - `tests/e2e/phase1-inline-operate.spec.mjs` (legacy-ish flow, environment-dependent)
  - `tests/e2e/phase2-workspace-shell.spec.mjs` (phase1 shell path, mocked APIs)

Gaps:
- no route-level E2E for most non-workspace pages (`/account`, public pages, `/shapelibrary/*`)
- no strict matrix asserting query-contract equivalence between `/workspace` defaults and shell-specific semantics

## Route-to-Shell Matrix (Appendix)

| Route | Page file | Active shell/component | Data loader path | Key API namespaces | Current test coverage | Risk |
|---|---|---|---|---|---|---|
| `/workspace` | `src/app/workspace/page.jsx` | redirect to `/workspace/phase1` (default), `WorkspaceShell` if `legacy=1` | legacy path uses `loadWorkspacePageData` | workspace, reader, seven, documents (legacy) | smoke + founder + e2e (partial) | **Critical** |
| `/workspace/phase1` | `src/app/workspace/phase1/page.jsx` | `LoegosPhase1Shell` | direct session + document bootstrap | seven, seven/audio, reader/listening-session, workspace intake | phase2 e2e (mocked) + smoke indirect | **High** |
| `/workspace/v1` | `src/app/workspace/v1/page.jsx` | `RealityAssemblyShell` | `loadWorkspacePageData` | workspace document/seed/intake, reader/listening-session, seven/audio | reality-assembly node test + smoke | **High** |
| `/read/[documentKey]` | `src/app/read/[documentKey]/page.jsx` | redirect | none | none directly | none route-level | **Medium** |
| `/account` | `src/app/account/page.jsx` | `AccountShell` | server data calls | integrations callback interactions via account routes | no direct e2e | **Medium** |
| `/shapelibrary/*` | `src/app/shapelibrary/*.jsx` | client pages + operator panels | client fetches | shapelibrary APIs | no direct e2e | **Medium** |
| Public pages | `src/app/{about,trust,privacy,terms,disclaimer,self-assembly,design-proposal}` | public components | mostly static | none/minimal | no route-level e2e | **Low/Medium** |

## Design-System Scoring Rubric

Score each critical surface 0..2 per criterion:

- Token source alignment (`tokens.css` / root vars)
- JS token parity (`design-tokens.js` vs CSS tokens)
- Inline style exception discipline
- Typography and spacing consistency
- Guardian compliance status

Audit score bands:
- 9-10: healthy
- 6-8: watch
- <=5: corrective action required

## Route-Specific Remediation Plan

### `/workspace` routing contract
- Define canonical default shell contract and preserve expected query semantics for that shell.
- If default is phase shell, add explicit handling for `mode`, `phase`, `connected`, `error` or normalize/strip with user-visible handoff.

### Legacy shell continuity
- Ensure all legacy in-shell links preserve `legacy=1` while legacy remains supported.

### Integration callbacks
- Update callback targets to route(s) that consume their parameters, or refactor callback payload to match default shell contract.

### Terminology normalization
- Publish one lexicon for shell navigation and state labels.
- Remove phase-number ambiguity in route labels and UI copy.

## CI Regression Gate Matrix (Recommended)

- **Gate A (static contract):** `npm run test:smoke`
- **Gate B (shell structure):** `npm run test:founder && npm run test:reality-assembly`
- **Gate C (phase shell browser):** Playwright run of `tests/e2e/phase2-workspace-shell.spec.mjs`
- **Gate D (legacy flow browser, env-backed):** Playwright run of `tests/e2e/phase1-inline-operate.spec.mjs` with required env
- **Gate E (style guard):** `npm run audit:guardian`

## Prioritized Fix Queue (10-15 items)

1. Align `/workspace` default redirect with query-contract semantics (Critical, M)
2. Standardize auth callback destinations (`mode=listen` mismatch) (Critical, S)
3. Align GetReceipts callback params with default shell handling (Critical, M)
4. Preserve `legacy=1` on all legacy internal navigation (High, S)
5. Add route-level regression tests for `/workspace`, `/workspace/phase1`, `/workspace/v1` handoffs (High, M)
6. Publish shell terminology lexicon and rename conflicting labels (High, S)
7. Introduce compatibility notice when query params are ignored by active shell (High, S)
8. Reconcile CSS and JS token palettes, document authority (Medium, M)
9. Reduce `globals.css` coupling for non-workspace routes (Medium, M/L)
10. Add E2E coverage for `/account` integration notice states (Medium, M)
11. Add E2E smoke for `/shapelibrary`, `/shapelibrary/history`, `/shapelibrary/drift` (Medium, M)
12. Split large client shell chunks with route/feature-level dynamic loading (Medium, L)
13. Introduce performance telemetry for shell hydration and interaction latency (Medium, M)
14. Remove or gate demo-only paths for non-prod where needed (Low/Medium, S)

Effort key: S (small), M (medium), L (large)

## Rollout Order

1. **Stabilize routing contracts** (items 1-4)
2. **Lock regression gates** (items 5, 10, 11)
3. **Normalize language and UX signaling** (items 6, 7)
4. **Design system and performance hardening** (items 8, 9, 12, 13)
5. **Cleanup/deployment hygiene** (item 14)

## Acceptance Criteria Check

- Full UI inventory: complete
- Critical/high findings tied to concrete files: complete
- Design-system drift scored with actionable rubric: complete
- Performance and regression risks prioritized: complete
- Report ready for implementation sprint handoff: complete

## Launch Version Addendum (Nuke-Ready)

Decision basis for cleanup:
- **Launch canonical shell:** `/workspace/phase1`
- **Cleanup policy:** soft freeze first, then hard delete

### Launch Canonical Contract

Launch version requirements:
- Compiler-truth UI is the primary workspace surface (`compileSource`-driven state and diagnostics).
- Shape Library remains downstream/advisory only and accessible as a separate operator surface.
- Intake and voice-over capabilities remain protected.

Evidence:
- Compiler in launch shell: `LoegosCLI/UX/loegos-phase1-shell.jsx`
- Shape Library advisory entry in launch shell: `LoegosCLI/UX/loegos-phase1-shell.jsx` (operator link to `/shapelibrary`)
- Shape Library standalone routes: `src/app/shapelibrary/page.jsx`, `src/app/shapelibrary/history/page.jsx`, `src/app/shapelibrary/drift/page.jsx`

### Soft-Freeze Then Delete Plan

#### Phase F1 (Soft Freeze)

1. Keep `/workspace` as stable entrypoint but always route to launch shell.
2. Freeze non-launch forks by making them explicit archive/deprecated routes:
   - `/workspace?legacy=1`
   - `/workspace/v1`
3. Add visible deprecation notice on frozen forks: “This surface is deprecated; use `/workspace`.”
4. Block new feature work on frozen forks in CI with static guard checks.

#### Phase F2 (Hard Delete)

Delete only after two successful regression cycles on launch shell:
- remove legacy route behavior and legacy-only URLs
- remove preview route and shell implementation
- remove stale tests tied only to deleted shells
- keep any shared modules still required by launch shell

### Keep / Freeze / Delete Matrix

| Area | Status now | Hard-delete target |
|---|---|---|
| `src/app/workspace/page.jsx` | Keep (launch entry redirector) | Keep |
| `src/app/workspace/phase1/page.jsx` | Keep (launch canonical route) | Keep |
| `LoegosCLI/UX/loegos-phase1-shell.jsx` | Keep (launch shell) | Keep |
| `src/app/shapelibrary/**` | Keep (operator surfaces) | Keep |
| `src/app/api/shapelibrary/**` | Keep (downstream advisory integration) | Keep |
| `src/app/workspace/v1/page.jsx` | Freeze (deprecated preview route) | Delete in F2 |
| `src/components/reality-assembly/**` | Freeze (preview shell code) | Delete in F2 |
| `src/components/WorkspaceShell.jsx` | Freeze (legacy shell) | Delete in F2 |
| `src/components/workspace/useOperateOverlayController.js` | Freeze (legacy flow dependency) | Delete in F2 unless reused |
| `src/components/workspace/useReceiptSealController.js` | Freeze (legacy flow dependency) | Delete in F2 unless reused |
| `tests/e2e/phase1-inline-operate.spec.mjs` | Freeze (legacy-biased behavior) | Replace/remove in F2 |
| `tests/reality-assembly-preview.test.mjs` | Freeze (`/workspace/v1` contract test) | Remove in F2 |

### Pre-Delete Safety Gates (mandatory)

Before F2 hard delete:
1. Launch-shell regression suite green for two consecutive cycles.
2. Callback and redirect contracts verified:
   - auth callback paths
   - integrations callback paths
   - `/read` deep-link behavior.
3. Shape Library operator flows verified after fork freeze.
4. Guardian/style gates green for launch-scope files.

### Nuke Execution Order

1. Freeze banners + route guards on `/workspace?legacy=1` and `/workspace/v1`.
2. Replace old shell references and URL builders that emit legacy paths.
3. Remove legacy/preview tests and add launch-equivalent tests.
4. Delete legacy/preview route files and shell trees.
5. Sweep dead imports and stale styles.
6. Final smoke + e2e + guardian pass.

## Echo Field Addendum (Verdict Delivery)

Status: implemented in launch shell.

- Semantic contract now formalized in `LoegosCLI/docs/echo-field-contract-v1.md`.
- Launch shell now exposes explicit echo-legibility prompts and metrics.
- Runtime ledger now distinguishes distant-echo/ripple events (`distant_echo_arrived`) from normal updates.

Validation anchors:

- `tests/echo-field-state.test.mjs`
- `tests/echo-ripple-signal.test.mjs`
- `tests/reality-assembly-preview.test.mjs`
