# Document Assembler

Document Assembler is a tool for reading, listening to, editing, and assembling documents from multiple sources, with receipts that show what was read, how it was transformed, and what was produced.

This repository is in the middle of a product pivot. The old reader-first specs have been removed. This `README.md` is now the product source of truth.

## One-Line Summary

Read it, think about it, build something new from it, and prove that you did.

## Product

The product centers on five ideas:

1. Every imported document becomes canonical Markdown.
2. Every document is made of addressable blocks.
3. Users can assemble new documents from blocks across many source documents.
4. AI can propose blocks and operations, but the human composes the final document.
5. Every important action can become part of a receipt.

## Core Objects

### Canonical markdown

All uploaded files are normalized into Markdown, regardless of whether they began as PDF, DOC, DOCX, text, or Markdown.

### Blocks

Blocks are the atomic unit of the system. A block can be:

- a paragraph
- a heading
- a list item
- a quote
- a generated synthesis block

Each block should eventually carry durable identity and lineage.

### Documents

A document is an ordered assembly of blocks.

Documents can be:

- imported source documents
- edited working documents
- newly assembled documents derived from many sources

### Receipts

Receipts are the proof layer.

The system will support three receipt types:

- consumption receipts
- assembly receipts
- synthesis receipts

Receipts should be exportable and handoff-ready for GetReceipts.

## MVP

The MVP should do the following:

1. Authenticate users.
2. Upload PDF, DOCX, DOC, text, and Markdown files.
3. Convert every uploaded file into canonical Markdown.
4. Open documents in a minimal terminal-like workspace.
5. Let users inspect and select document blocks.
6. Let users listen to a full document or a scoped selection.
7. Let users run AI operations on one or more documents:
   - extract
   - summarize
   - synthesize
   - search for evidence
8. Save AI output as explicit, labeled blocks.
9. Let users assemble a new document from source blocks and generated blocks.
10. Let users edit assembled documents in place.
11. Log the important steps that led to the final output.
12. Create receipt drafts locally and optionally in GetReceipts.

## Product Direction

The next frontend should be rebuilt from scratch as a minimal workspace, likely terminal-like in feel:

- text-first
- low ornament
- block-first
- command/action oriented
- optimized for fast MVP iteration

The current frontend should not define the new experience.

## Frontend V1

The frontend should be one authenticated workspace, not a maze of pages.

### Primary routes

- `/`
- `/workspace`
- `/account`

Legacy routes can redirect into the workspace while the product is in transition.

### Workspace information architecture

The workspace should have four persistent areas:

- sources
- buffer
- context
- transport + command line

### Sources

The left pane is the document tree:

- source documents
- assembled documents
- receipts

In MVP, this can begin with source documents first and placeholders for assemblies and receipts.

### Buffer

The center pane is the active working surface.

It can show:

- an imported source document
- an assembly draft
- a receipt preview

This pane should be block-oriented and easy to scan.

### Context

The right pane changes with the user’s mode and selection.

It should show:

- selected block metadata
- lineage
- evidence
- AI outputs
- receipt draft context

### Transport

Playback is a first-class feature and should always be visible.

The transport should stay pinned and include:

- play / pause
- rewind
- forward
- previous block
- next block
- rate
- voice / scope

### Command line

The workspace should always include a command bar for direct operations.

Early commands can include:

- open
- next
- prev
- play
- pause
- connect
- account

### Visual language

The UI should feel like a calm editorial terminal:

- dark background
- restrained text colors
- monospace typography
- semantic accents for state
- almost no decorative chrome

### Color semantics

- default text for source material
- cyan for current or selected block
- amber for AI-generated or pending material
- green for accepted / connected / ready states
- red for errors

### Frontend principle

Do not design for delight first.

Design for:

1. import
2. inspect
3. select
4. transform
5. assemble
6. receipt

## What We Already Have

The existing backend already gives us a strong starting point.

### Reusable now

- authentication with NextAuth
- Apple sign-in and email magic links
- per-user profiles
- document upload and storage
- file normalization into canonical Markdown
- private per-user document library
- document-scoped progress and annotation persistence
- stable runtime block IDs in the renderer
- per-document AI thread persistence
- evidence set persistence
- text-to-speech with ElevenLabs and OpenAI fallback
- listening session persistence
- local receipt draft persistence
- GetReceipts connection flow
- optional remote receipt draft creation in GetReceipts

### Existing code likely to survive the pivot

- `src/lib/auth.js`
- `src/lib/document-import.js`
- `src/lib/reader-documents.js`
- `src/lib/reader-db.js`
- `src/lib/reader-workspace.js`
- `src/lib/getreceipts.js`
- `src/app/api/*`
- `prisma/schema.prisma`

## What Still Needs To Be Built

The pivot does not require a backend rewrite, but it does require new domain models and new flows.

### Needed for MVP

- persistent block records, not only runtime block IDs
- durable block lineage across edits and assemblies
- document editing and save/update flows
- versioning for edited and assembled documents
- a first-class assembly model
- AI operations that return structured block outputs
- explicit labeling of AI-authored blocks
- operation logging for receipt generation
- receipt builders for:
  - consumption
  - assembly
  - synthesis
- a new terminal-like frontend

### Probably not needed in MVP

- polished visual design
- collaborative editing
- complex permissions
- analytics-heavy product instrumentation
- advanced workflow orchestration

## GetReceipts

GetReceipts should remain the external receipt destination, not the place where our internal document lineage lives.

Our app should own:

- document ingestion
- block identity
- assembly state
- operation logs
- receipt preparation

GetReceipts should own:

- receipt destination
- receipt review/sharing flow
- external verification surface

## Principles

- blocks before pages
- lineage before polish
- receipts before rhetoric
- human composition over autonomous generation
- one canonical representation per document
- simple UI, serious provenance

## Working Rule

When product or implementation questions come up, optimize for the smallest path that gets us to:

1. import
2. inspect
3. select
4. transform
5. assemble
6. receipt

If something does not help that chain, it is probably not MVP.
