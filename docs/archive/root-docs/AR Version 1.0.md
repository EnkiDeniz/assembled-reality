# Loegos Version 1.0

## Summary

Loegos `1.0` is an invite-only beta for solo operators.

It is a desktop-first workbench for one reliable loop:

`import source → listen / ask Seven → stage blocks → assemble → operate → draft receipt`

## Canonical Docs

The live release should stay aligned with this canonical set:

- `README.md`
- `docs/current-state-audit.md`
- `docs/loegos-product-spec.md`
- `docs/box-migration-plan.md`
- `docs/think-create-operate-spec.md`
- `docs/operate-spec-v2.md`
- `docs/source-model-spec.md`
- `docs/source-normalization-table.md`
- `docs/provenance-trust-policy.md`
- `docs/information-architecture.md`
- `docs/user-flows.md`
- `docs/seven-operate-receipt-contract.md`
- `docs/component-architecture-plan.md`

If older review or roadmap docs disagree with this set, this set wins.

## Product Model

- `7` talks
- `Staging` collects
- `Edit` rewrites
- `Operate` reads the box

The active hierarchy is:

- box
- sources
- assembly
- receipts

The authenticated entry surface is a Boxes launcher where the user can open an existing box or create a new one.

## Supported Intake

Public `1.0` intake paths:

- PDF
- DOCX
- Markdown / TXT
- paste
- link import
- voice memo capture

Not part of the public `1.0` promise:

- folder import
- image-to-document flows
- arbitrary audio-file upload
- legacy DOC

## Launch Bar

Before signoff, the live product must make these flows feel trustworthy:

- auth
- source intake
- listen/playback
- Seven conversation
- staging
- assembly creation
- Operate reads
- receipt drafting
- delete
- document save and conflict recovery

## UX Rules

- The landing page stays minimal and warm-audience oriented.
- The workspace is the product.
- The Boxes page is the first launcher surface for authenticated users.
- The built-in `Lœgos` guide stays inside the box as a pinned source, but never the hero action.
- Operate is a dedicated result surface inside an opened box, not chat, not summary, and not rewrite.
- Operate reads real box material, excluding the built-in guide by default.
- Receipts are proof/history, not a competing editing mode.
- `△ □ ○ × 1–7` is the analysis model for reading what is in the box, not the primary navigation model.
- GetReceipts is optional and account-level.
- Failure to sync remotely must never block a local receipt draft.
