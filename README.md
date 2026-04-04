# Loegos

**Meaning is an assembled object.**  
**Build working documents from source material.**

Loegos `1.0` is an invite-only beta for solo operators. It is a desktop-first web workbench for turning source material into a working assembly with visible proof.

This `README.md` is the current product source of truth.

## Active Docs

- `README.md`
- `docs/AR Version 1.0.md`
- `docs/box-migration-plan.md`
- `docs/operate-spec-v2.md`

## Release Posture

- invite-only beta
- `noindex`
- desktop-first
- solo operator first
- GetReceipts optional
- warm-audience landing, not broad public marketing

## Core Loop

`import source → listen / ask Seven → stage blocks → assemble → operate → draft receipt`

This is the only loop that must feel excellent in `1.0`.

## Product Model

The authenticated product is one workbench with three clear verbs:

- `7` talks
- `Staging` collects
- `Edit` rewrites

And one box-level read:

- `Operate` reads the box

The active hierarchy is:

- box
- sources
- assembly
- receipts

The built-in `Lœgos` guide stays pinned in the source list, but it is not the hero of the app.

## Supported Intake For 1.0

Launch-supported intake paths:

- PDF
- DOCX
- Markdown / TXT
- paste
- link import
- voice memo capture via `Speak note`

Supported in code but not part of the public `1.0` promise:

- folder import
- image-to-document flows
- arbitrary audio-file upload
- legacy DOC upload

If those paths remain reachable, they should feel secondary or beta-quality, not like the main product promise.

## Workspace Model

The live product is the workspace.

### Public routes

- `/`
- `/workspace`
- `/account`
- `/opengraph-image`

### Main surfaces

- boxes page as the launcher for opening or creating a box
- box home as a dense launcher
- source rail for navigation
- main document surface for read, listen, select, and edit
- right-side context split between Seven conversation and staging
- receipts as proof/history, not as a peer editing mode
- playback always visible

### Seven

- `7` opens a real thread tied to the active document
- replies render as conversation, not hidden operator output
- useful replies can move into staging with one explicit action
- deeper `△ □ ○ × 1–7` box analysis is deferred beyond the first Box pass

### Operate

- Operate is the box-read engine
- it is not chat, not summary, and not rewrite
- it reads the active box across real sources plus the current assembly
- it returns `Aim`, `Ground`, `Bridge`, a `Gradient`, a trust floor and ceiling in `L1–L3`, one convergence state, and one next move
- it can draft a local-first receipt and optionally sync it to GetReceipts

### Staging

- staging collects selected blocks and accepted Seven output
- staging is the input to assembly
- staging is not the same thing as Seven

### Edit

- edit is literal block editing
- it only affects editable document blocks
- saves must expose clear saving, saved, conflict, and error states

## What 1.0 Must Do

1. Authenticate users with Apple or magic link.
2. Let users open an existing box or create a new box.
3. Import supported sources into the active box and normalize them into usable source documents.
4. Let users open a source, listen to it, and ask Seven about it.
5. Let users stage blocks from the source and from Seven replies.
6. Assemble a new working document from staged material.
7. Run Operate on the active box to read the current position honestly.
8. Draft a local receipt for the current document, assembly, or Operate result.
9. Optionally push that receipt draft to GetReceipts without making GetReceipts required.

## Trust And Proof Bar

For launch, these flows need clear status handling:

- auth
- source intake
- document save/edit
- delete
- playback
- Seven replies
- assembly creation
- Operate reads
- receipt drafting

Failure to sync with GetReceipts must never block a local receipt draft.

## Share Surface

Shared links should keep the canonical app brand:

- root metadata
- Open Graph card
- Twitter card

## Out Of Scope For 1.0

- collaboration
- teams
- billing
- public discovery growth loops
- reflection / Learn flows
- voice economics
- “all file types” marketing

## Current Visual Direction

The visual system is locked to the current graphite/blue desktop workbench language:

- graphite surfaces
- blue accent
- system UI typography in app chrome
- restrained, tool-first composition

The goal is calm, trustworthy utility, not feature theater.

## Reference Docs

These are useful inputs, but this README wins when they disagree:

- `docs/box-migration-plan.md`
- `docs/AR Version 2.md`
- `docs/AR Version 2 Build Plan.md`
- `prototype/document-assembler-concept.md`
- `prototype/document-assembler-addon-spec.md`
- `prototype/document-assembler-cursor-inspiration.md`
