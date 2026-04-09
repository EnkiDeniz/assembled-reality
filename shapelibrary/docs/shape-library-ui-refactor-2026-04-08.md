# Shape Library UI Refactor

Date: 2026-04-08

## Why this refactor happened

After the first implementation pass, the Shape Library UI was functional but not aligned with the existing project design system and app wiring model. The goal of this pass was to prevent visual and architectural drift while preserving the one-week scope.

## What changed

### 1) Design system alignment

- Replaced inline styles in Shape Library UI routes/components with class-based styling.
- Added `src/app/styles/shapelibrary.css` using existing token vocabulary from the app (`--surface-*`, `--text-*`, `--line`, `--radius-*`, `--shadow-panel`).
- Imported the new stylesheet via `src/app/globals.css`.
- Kept status distinction explicit and unambiguous:
  - hypothesis states (`not_sealable_yet`, `candidate_*`)
  - confirmed states (`*_match`)
  - blocked/rejection states

### 2) UI structure retained, but normalized

The existing UI flow remains the same:

- First Read panel (`/shapelibrary`)
- Receipt Capture panel
- Candidate -> Promote panel
- Run History + Diff (`/shapelibrary/history`)
- Drift Dashboard (`/shapelibrary/drift`)

Only the visual layer was normalized to project-native components/tokens.

### 3) Wiring refactor to app-native API routes

Instead of direct browser calls to `http://localhost:4310`, client calls now go through Next API routes:

- `POST /api/shapelibrary/analyze` -> forwards to Shape Library `POST /v1/analyze`
- `GET /api/shapelibrary/candidates` -> forwards to Shape Library `GET /v1/candidates`
- `POST /api/shapelibrary/promote` -> forwards to Shape Library `POST /v1/promote`

This aligns Shape Library UI with the project’s existing route architecture and keeps integration points centralized in the app boundary.

### 4) Symptom-only guidance hardening (backend)

For path-dependent near-miss cases that align with bottleneck behavior, analyze output now includes specific operator guidance (instead of generic scaffolding):

- focused `mainGap`
- actionable `nextLawfulMove` about sequence mapping and order reversal testing
- strict `receiptCondition` for ordered sequence confirmation + before/after metric shift
- explicit disconfirmation condition

Schema and tests were updated accordingly.

## Files introduced/updated in this pass

- `src/app/styles/shapelibrary.css`
- `src/app/globals.css`
- `src/app/shapelibrary/page.jsx`
- `src/app/shapelibrary/history/page.jsx`
- `src/app/shapelibrary/drift/page.jsx`
- `src/components/shapelibrary/StatusBadge.jsx`
- `src/components/shapelibrary/FirstReadPanel.jsx`
- `src/components/shapelibrary/ReceiptCapturePanel.jsx`
- `src/components/shapelibrary/PromotionGatePanel.jsx`
- `src/components/shapelibrary/RunHistoryTable.jsx`
- `src/components/shapelibrary/RunDiffView.jsx`
- `src/components/shapelibrary/DriftDashboard.jsx`
- `src/lib/shapelibrary-client.js`
- `src/lib/shapelibrary-transformers.js`
- `src/app/api/shapelibrary/analyze/route.js`
- `src/app/api/shapelibrary/candidates/route.js`
- `src/app/api/shapelibrary/promote/route.js`
- `src/app/api/shapelibrary/history/route.js`
- `src/app/api/shapelibrary/drift/route.js`
- `shapelibrary/shape-core/engine.js`
- `shapelibrary/schema/analyze-result.schema.json`
- `shapelibrary/tests/v02.test.js`
- `shapelibrary/docs/shape-library-ui-refactor-2026-04-08.md`

## Verification run

- `shapelibrary` backend tests: pass (`22/22`)
- ESLint for new/refactored Shape Library UI/API/client files: pass
- UI/API smoke checks (webpack dev mode):
  - `/api/shapelibrary/analyze` pass
  - `/api/shapelibrary/candidates` pass
  - `/shapelibrary` returns 200
  - `/shapelibrary/history` returns 200
  - `/shapelibrary/drift` returns 200

## Outcome

Shape Library UI remains functionally complete for the planned slice, while now conforming to the base project’s design and integration conventions. This reduces drift risk and keeps the subsystem ready for deeper workspace-level integration.
