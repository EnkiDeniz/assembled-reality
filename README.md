# Assembled Reality

Assembled Reality is a Next.js App Router application for a private, multi-user reading instrument. The current product is not a generic content site and not yet the full receipt-reading system described in the manuscript. What exists today is a reader-first application that lets a signed-in reader unlock the text, move through the manuscript, save personal marks, preserve progress, generate reading-receipt drafts, and use an embedded assistant called Seven for section-based explanation and read-aloud support.

This README is meant to be the working foundation for the next phase of the project. It documents what is already built, how the app is structured, where the current boundaries are, and which next steps appear highest leverage.

## Product Thesis

The repo centers on a strong product idea that already shows up clearly in the manuscript and internal docs:

- the front door is a reading instrument, not a chatbot lobby
- reading should preserve place, marks, and continuity
- receipts matter more than story
- Seven should eventually become a reader of receipts and operator structure, not only a manuscript explainer

Right now, the codebase implements the reading instrument more fully than it implements the deeper diagnostic system.

## What Is Built Today

### Core user flow

The current product loop is:

1. Reader lands on `/`
2. Reader passes an unlock gate through a code or cuneiform puzzle
3. Reader signs in with Apple or email magic link if auth is configured
4. Reader enters `/read`
5. Reader reads the manuscript, creates bookmarks/highlights/notes, and preserves progress
6. Reader can open Seven for section help and audio
7. Reader can visit `/account` to manage identity, preferences, diagnostics, and receipt drafts

### Current shipped capabilities

- landing-page unlock gate with session-scoped unlock state
- alternate puzzle-based entry path
- NextAuth-based authentication
- Apple sign-in support when Apple credentials are present
- email magic-link auth when Resend and sender env vars are present
- authenticated reader experience on `/read`
- manuscript parsing from markdown in `content/assembled_reality_v07_final.md`
- appendix replacement from repo docs so authoritative appendix files can override embedded manuscript sections
- per-user bookmarks
- per-user highlights
- per-user notes
- per-user reading progress persistence
- in-reader account/navigation surface
- account page with reading stats and saved receipt drafts
- GetReceipts connection flow and callback handling
- reading-receipt draft generation from selected marks and sections
- optional remote draft creation in GetReceipts when a valid connection exists
- Seven text responses via OpenAI Responses API
- Seven voice responses via ElevenLabs first, with OpenAI speech fallback
- Seven diagnostics on the account page to validate chat and voice provider health

### What the current product is not yet

- not yet a collaborative reader
- not yet a shared-annotation system
- not yet a persistent multi-session Seven conversation product
- not yet a receipt-derived diagnostic engine
- not yet a full operator-library or process-graph implementation
- not yet instrumented with formal analytics, monitoring, or automated tests

## Current Product Surface

### Routes

- `/`: unlock and auth entry flow
- `/read`: authenticated reading application
- `/account`: reader profile, preferences, diagnostics, reading snapshot, receipt drafts
- `/connect/getreceipts`: starts GetReceipts connect flow

### API routes

- `/api/unlock`: validates the bootstrap code
- `/api/auth/[...nextauth]`: NextAuth entry point
- `/api/reader/profile`: fetch/update reader profile
- `/api/reader/marks`: load and save bookmarks, highlights, notes
- `/api/reader/progress`: save reading progress
- `/api/reader/receipts/from-reading`: generate a reading receipt draft from marks/sections
- `/api/seven`: Seven text explanation/question/summary
- `/api/seven/audio`: Seven text-to-speech
- `/api/integrations/getreceipts/callback`: OAuth-style integration callback

## Architecture Overview

### Frontend

The UI is built in Next.js App Router with React 19.

Key page entry points:

- `src/app/page.jsx`: session-aware landing page
- `src/app/read/page.jsx`: authenticated reader page
- `src/app/account/page.jsx`: authenticated account page

Key UI components:

- `src/components/EntryGate.jsx`: bridges unlock state and auth state
- `src/components/UnlockScreen.jsx`: access-code and puzzle front door
- `src/components/AuthScreen.jsx`: Apple and magic-link auth UI
- `src/components/ReadGate.jsx`: client handoff into the reader shell
- `src/components/ReaderShell.jsx`: main reading application shell
- `src/components/ReaderMarksPanel.jsx`: notebook/marks interface
- `src/components/SelectionMenu.jsx`: inline selection actions
- `src/components/SevenPanel.jsx`: embedded assistant UI
- `src/components/AccountScreen.jsx`: profile, settings, diagnostics, receipts

### Content layer

The manuscript is file-backed, not CMS-backed.

- canonical manuscript source: `content/assembled_reality_v07_final.md`
- authoritative appendix sources:
  - `docs/operator-sentences.md`
  - `docs/convergence-foundations.md`

`src/lib/document.js` parses the markdown into:

- document title
- subtitle
- introduction markdown
- numbered sections
- a generated table of contents

It also replaces appendix sections with authoritative versions from `docs/` when present.

### Persistence layer

The app now uses server-backed persistence for reader state.

Database access flows through Prisma:

- `src/lib/prisma.js`
- `prisma/schema.prisma`

Current persisted entities:

- `User`
- `ReaderProfile`
- `Bookmark`
- `Highlight`
- `Note`
- `ReadingProgress`
- `GetReceiptsConnection`
- `ReadingReceiptDraft`
- NextAuth tables: `Account`, `Session`, `VerificationToken`

### Auth layer

Auth is implemented with NextAuth and Prisma.

- adapter: Prisma adapter
- session strategy: JWT
- supported providers:
  - Apple
  - email magic links

Reader profile creation is automatically bootstrapped on sign-in if no profile exists yet.

### Seven layer

Seven is implemented as an in-reader assistant, not yet as the full receipt-reading intelligence layer.

Current Seven modes:

- explain the current section
- answer a question about the current section
- summarize the current section
- read content aloud

Current Seven context:

- document title
- document subtitle
- intro markdown
- section outline
- current section label/title
- current section markdown
- optionally relevant nearby sections for question mode

Current Seven limitations:

- no bookmarks in prompt context
- no highlights in prompt context
- no notes in prompt context
- no reading receipts in prompt context
- no operator inference
- no persistent conversation memory

## Data Model Summary

The main product-specific model is `ReaderProfile`, which anchors identity inside the reading instrument. All personal reader state is attached to that profile.

### Reader profile

- `displayName`
- `readerSlug`
- `role`
- `lastReadSlug`
- `lastReadAt`

### Marks

Bookmarks are section-level.

Highlights and notes are range-based within a block:

- `sectionSlug`
- `sectionTitle`
- `blockId`
- `startOffset`
- `endOffset`
- `quote`
- `excerpt`

Notes also store:

- `noteText`

### Reading progress

Stored as one record per reader profile:

- `sectionSlug`
- `progressPercent`

### Reading receipt drafts

Drafts persist both the local receipt payload and any optional remote GetReceipts result:

- title
- status
- source sections
- source mark ids
- payload JSON
- optional remote receipt id

## Integrations

### GetReceipts

The app already contains meaningful GetReceipts scaffolding.

What is implemented:

- signed state generation
- connect URL builder
- callback handling
- token exchange
- encrypted token storage
- local receipt draft persistence
- optional remote draft creation

What is not yet clear from the current code:

- how far the remote draft shape has been validated in live production use
- whether refresh-token rotation is needed
- whether expired tokens are actively repaired or only fail passively

### OpenAI

Used for:

- Seven text generation
- optional speech generation fallback

### ElevenLabs

Used for:

- primary speech provider for Seven audio

## Environment

There is no committed `.env.example` yet, so setup currently depends on README guidance and local knowledge.

### Minimum required for useful local development

- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`

### Reader gate / site config

- `READER_BOOTSTRAP_CODE`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`

### Email auth

- `NEXTAUTH_EMAIL_FROM` or `EMAIL_FROM`
- `RESEND_API_KEY`

### Apple auth

- `APPLE_WEB_CLIENT_ID` or `APPLE_ID` or `APPLE_CLIENT_ID`
- `APPLE_KEY_ID`
- `APPLE_TEAM_ID`
- `APPLE_PRIVATE_KEY`

### GetReceipts

- `GETRECEIPTS_BASE_URL`
- `GETRECEIPTS_APP_SLUG`
- `GETRECEIPTS_CLIENT_SECRET`
- `GETRECEIPTS_REDIRECT_URI`
- `INTEGRATIONS_STATE_SECRET`
- `INTEGRATIONS_TOKEN_KEY`

### Seven / AI providers

- `OPENAI_API_KEY`
- `OPENAI_API_KEY_PROD`
- `OPENAI_API_KEY_PREVIEW`
- `OPENAI_SEVEN_MODEL`
- `OPENAI_SEVEN_SPEECH_MODEL`
- `OPENAI_SEVEN_VOICE`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID`
- `ELEVENLABS_OUTPUT_FORMAT`

## Local Development

### Install

```bash
npm install
```

### Run the app

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

### Prisma

Generate the Prisma client:

```bash
npx prisma generate
```

Apply the existing migration set when your database is configured:

```bash
npx prisma migrate deploy
```

For local-only development against a disposable database, a schema push may be acceptable:

```bash
npx prisma db push
```

## Current State of the Codebase

### What feels solid

- the product has a coherent reader-first shape
- core auth and reader persistence are in place
- the document parsing approach is simple and understandable
- the data model supports the current single-user reading workflow well
- account diagnostics make Seven operationally more transparent than before
- the repo already contains product-thinking docs that can guide the next phase

### What feels partial or risky

- Seven provider health is still operationally fragile and depends on live quota/credentials
- there is no automated test suite in the repo today
- there is no `.env.example`, which raises onboarding cost
- there is no formal observability stack beyond logs and UI diagnostics
- the README before this rewrite did not capture enough architecture or roadmap context
- some docs describe older local-first behavior, so documentation needs consolidation over time

### Important conceptual gap

The strongest gap is not UI polish. It is product-depth mismatch:

- the manuscript and appendices describe a richer receipt-reading system
- the shipped app is currently strongest as a private annotated manuscript reader
- Seven explains text but does not yet reason from reader evidence

That mismatch is not a failure. It is the clearest guide for the next phase.

## Repo Guide

### Product and planning docs

- `docs/seven-current-state.md`: current assessment of Seven
- `docs/reader-v2-plan.md`: older local-first reader plan; useful as history, not current architecture
- `docs/convergence-foundations.md`: product theory / source material
- `docs/operator-sentences.md`: appendix content used by the reader

### Content and lock materials

- `content/assembled_reality_v07_final.md`: primary manuscript
- `lockscreen/cuneiform-matrix-lock-spec.md`
- `lock screen/cuneiform-matrix-lock-spec.md`

### App and domain code

- `src/app/**`: routes and API endpoints
- `src/components/**`: UI surfaces
- `src/lib/**`: domain logic, env parsing, auth, document parsing, integrations
- `prisma/**`: schema and migrations

## Recommended Next Steps

The most useful next work is to make the repo easier to operate, then deepen the product in the direction the manuscript already points toward.

### 1. Stabilize the foundation

- add a committed `.env.example`
- document the expected local database workflow more explicitly
- add at least smoke-level tests for auth gating, reader APIs, and receipt creation
- add minimal observability around Seven failures and GetReceipts draft creation

### 2. Consolidate the source of truth

- decide which docs are historical vs active
- align README, `docs/seven-current-state.md`, and product language
- remove or label stale planning documents so new contributors do not follow the wrong architecture

### 3. Deepen Seven from “section explainer” to “reading instrument”

- pass reader marks into prompt context
- let Seven reason over notes/highlights across multiple sections
- define what a receipt-aware Seven response should look like
- choose whether Seven should remain ephemeral or gain persistent thread history

### 4. Clarify the receipt pipeline

- define the canonical shape of a reading receipt
- decide which local fields must exist before remote draft creation
- make token expiry and remote failure handling more explicit
- identify whether GetReceipts is optional infrastructure or a core product dependency

### 5. Decide the next product horizon

There are at least three plausible next directions:

- make the private reader excellent as a premium reading instrument
- evolve Seven into a receipt-aware assistant for a single reader
- expand into collaborative or organizational reading/diagnostic workflows

The codebase currently supports the first direction best, while the product theory points strongly toward the second.

## Suggested Near-Term Execution Plan

If the goal is to move this project forward without diffusing effort, the next sequence should likely be:

1. operational cleanup: `.env.example`, setup docs, smoke tests, basic monitoring
2. product spec: define “receipt-aware Seven” in concrete input/output terms
3. data extension: decide how marks, receipts, and operator signals should be represented for prompting
4. implementation pass: upgrade Seven to read from stored reader evidence
5. validation pass: test real reading sessions and refine based on actual use

## Notes From This Review

This assessment is based on the current code and docs in the repository as of 2026-04-01. The repo already has a meaningful product skeleton and a strong point of view. The main challenge now is not inventing direction from zero; it is tightening the bridge between the current reader app and the deeper receipt-centered system the project already describes.
