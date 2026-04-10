# Echo Field Contract v1

Date: 2026-04-09  
Status: canonical

## Purpose
Define the non-negotiable mapping between language, runtime, and UI so Lœgos consistently behaves as echolocation for decisions.

## Canonical Mappings

- `MOV` + `TST` => ping sent
- `RTN` => echo returned
- `awaiting` => active listening (ping sent, return not yet received)
- `shape_error | flagged` => fractured region
- `open | attested` with weak returns => fog region
- `sealed` or return-backed clarity => mapped region

## Truth Rule

Only returned evidence clears fog.

Interpretation/story can guide where to ping next, but story alone does not map a region.

## Runtime and UI Contract

The launch shell must expose these signals at all times:

1. Did I ping?
2. Am I waiting?
3. What came back, from where?
4. How clear is this region?

These are rendered through:

- `buildEchoFieldModel()` in `LoegosCLI/UX/lib/artifact-view-model.mjs`
- `EchoLegibilityPanel` in `LoegosCLI/UX/loegos-phase1-shell.jsx`

## Distant Echo (Ripple) Contract

A `distant_echo_arrived` event may be emitted only when all are true:

1. previous field state is not mapped
2. next field state is mapped
3. return count increases
4. no new ping was introduced in the same transition

Implementation authority:

- `deriveDistantEchoSignal()` in `LoegosCLI/UX/lib/artifact-view-model.mjs`
- runtime ledger rendering in `LoegosCLI/UX/loegos-phase1-shell.jsx`

## Attestation Boundary

`CLS attest` remains an honest closure into fog, never mapped truth.

Attestation can record a decision and rationale without claiming return-backed certainty.

## Governance Boundary

Seven can process pings and returns, but cannot fabricate echoes.

Shape Library remains downstream/advisory and does not author compiler/runtime truth.
