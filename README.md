# Loegos

**Meaning is an assembled object.**  
**Build working documents from source material.**

Loegos `1.0` is an invite-only beta for solo operators. It is a desktop-first web workbench for turning source material into a working assembly with visible proof.

This `README.md` is the current product source of truth.

## Active Docs

- `README.md`
- `docs/AR Version 1.0.md`
- `docs/box-migration-plan.md`

## Release Posture

- invite-only beta
- `noindex`
- desktop-first
- solo operator first
- GetReceipts optional
- warm-audience landing, not broad public marketing

## Core Loop

`import source → listen / ask Seven → stage blocks → assemble → draft receipt`

This is the only loop that must feel excellent in `1.0`.

## Product Model

The authenticated product is one workbench with three clear verbs:

- `7` talks
- `Staging` collects
- `Edit` rewrites

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
2. Import supported sources and normalize them into usable source documents.
3. Let users open a source, listen to it, and ask Seven about it.
4. Let users stage blocks from the source and from Seven replies.
5. Assemble a new working document from staged material.
6. Draft a local receipt for the current document or assembly.
7. Optionally push that receipt draft to GetReceipts without making GetReceipts required.

## Trust And Proof Bar

For launch, these flows need clear status handling:

- auth
- source intake
- document save/edit
- delete
- playback
- Seven replies
- assembly creation
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
