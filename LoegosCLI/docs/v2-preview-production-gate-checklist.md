# V2 Preview -> Production Gate Checklist

Date: 2026-04-10  
Owner: Shell release operator

## Purpose

Ensure V2 Room/Compass/Instrument releases are promoted only after proof-first behavior, DS compliance, and protected capability integrity are validated on the exact preview artifact.

## Gate 1: Local Contract and Build

- `node --test tests/echo-field-state.test.mjs tests/echo-ripple-signal.test.mjs` passes.
- `npm run test:reality-assembly` passes.
- `npm run test:smoke` passes.
- `npm run build` passes.

## Gate 2: Interaction and Explainability

- Room default is visible first (`phase2-room-surface`).
- Compass is locked by default and unlocks only via:
  - first return loop, or
  - 3+ boxes, or
  - explicit enable.
- Segment reveal works:
  - click a Seven segment
  - mapped structural clause is visible.
- Box mirror supports collapse/expand and ratio cue remains visible when expanded.

## Gate 3: Proof-First and Override Safety

- No UI flow mutates state outside source -> compile -> runtime pipeline.
- Manual attest requires rationale and writes `CLS attest ... if "..."` through normal compile path.
- Ledger and receipts remain append-only and visible in instrument drawer.

## Gate 4: Protected Capabilities

- Intake flows remain functional:
  - folder/file import
  - paste
  - link import
- Voice player flow remains functional:
  - playback request
  - listening session restore/save.

## Gate 5: Deploy and Promote

1. Deploy preview with `vercel deploy --yes`.
2. Validate preview URL manually (Room/Compass/Drawer + key test IDs).
3. Promote the same preview deployment with:
   - `vercel promote <preview-url> --yes`.
4. Verify production route:
   - `/workspace/phase1?phase2demo=1`.

## Promotion Rule

Production promotion is allowed only if all gates above are satisfied on the same build artifact.
