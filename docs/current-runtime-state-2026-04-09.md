# Current Runtime State (Workspace + Shape Library)

Date: 2026-04-09
Owner context: active implementation baseline in this repository

## Purpose

This document is a quick-entry handoff for any new contributor joining now. It captures what is currently built, how the main subsystems relate, and where to continue work without re-discovering architecture from scratch.

## System at a glance

The repository currently has two active layers:

1. **Loegos Workspace runtime (Next.js app)** in `src/`
2. **Shape Library standalone engine (Node/Express + SQLite)** in `shapelibrary/`

The workspace remains the broader product runtime. Shape Library is now integrated as an operator-facing UI slice and API bridge inside the workspace app.

## What is live now

### Workspace runtime

- Main app framework: Next.js App Router
- Core workspace route: `/workspace`
- Existing lifecycle foundation remains:
  - source intake
  - seed/assembly shaping
  - Operate reads
  - receipt drafting/sync

### Shape Library subsystem

- Standalone service lives in `shapelibrary/`
- API default: `http://localhost:4310`
- Core endpoints:
  - `POST /v1/analyze`
  - `GET /v1/candidates`
  - `POST /v1/promote`
  - `POST /v1/evaluate`

### Shape Library UI slice in workspace

Added routes:

- `/shapelibrary` (first read + receipt capture + promote flow)
- `/shapelibrary/history` (analyze/evaluate/promote run ledger + diff)
- `/shapelibrary/drift` (drift flags + match basis + near-miss distributions)

Added app-level proxy routes:

- `POST /api/shapelibrary/analyze`
- `GET /api/shapelibrary/candidates`
- `POST /api/shapelibrary/promote`
- `GET /api/shapelibrary/history`
- `GET /api/shapelibrary/drift`

These proxies keep browser calls app-native and forward to Shape Library service.

## Design system alignment status

The Shape Library UI was refactored to follow the existing project visual system:

- Uses tokenized styling through `src/app/styles/shapelibrary.css`
- Imported through `src/app/globals.css`
- Uses existing variables and tone system (`--surface-*`, `--text-*`, `--line`, shared radius/shadows)
- Avoids isolated inline style patterns

Reference: `shapelibrary/docs/shape-library-ui-refactor-2026-04-08.md`

## Important backend behavior added

For path-dependent near-miss cases (especially bottleneck-like symptom-only inputs), analyze output now includes specific operator guidance:

- `mainGap`
- `nextLawfulMove`
- `receiptCondition`
- `possibleDisconfirmation`

Related files:

- `shapelibrary/shape-core/engine.js`
- `shapelibrary/schema/analyze-result.schema.json`
- `shapelibrary/tests/v02.test.js`

## How to run locally

### 1) Start Shape Library service

From `shapelibrary/`:

```bash
npm install
npm run test
npm run dev
```

### 2) Start workspace app

From repo root:

```bash
npm install
npm run dev
```

Then visit:

- `http://localhost:3000/shapelibrary`
- `http://localhost:3000/shapelibrary/history`
- `http://localhost:3000/shapelibrary/drift`

If using a non-default app port, update URL accordingly.

## Canon docs to read first

For project-level orientation:

1. `README.md`
2. `docs/README.md`
3. `docs/partner-developer-handoff-loegos.md`

For Shape Library specifics:

1. `shapelibrary/README.md`
2. `shapelibrary/docs/api-contract.md`
3. `shapelibrary/docs/Assembly_Classes.md`
4. `shapelibrary/docs/read-order-eval-patch-report-2026-04-09.md`
5. `shapelibrary/docs/shape-library-ui-refactor-2026-04-08.md`

## Current known boundaries

- Shape Library UI is implemented as a dedicated route family, not yet merged into `/workspace` shell modes.
- History and drift views are intentionally thin/operator-first and derived from export/result artifacts.
- Further primitive expansion and embedding-driven matching work remain intentionally gated behind human session feedback.

## Next recommended continuation

If a new contributor is continuing implementation:

1. Run one operator flow in `/shapelibrary` end-to-end (first read -> receipts -> promote).
2. Verify history and drift render with fresh data.
3. Decide whether to:
   - integrate Shape Library flow into workspace shell as a native mode, or
   - keep it route-scoped and harden operator feedback loops first.
