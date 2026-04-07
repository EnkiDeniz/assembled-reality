# Lœgos System Assessment: Status Addendum

**Date:** April 7, 2026  
**Purpose:** Status-only answers to the engineering questions raised after the system assessment  
**Companion document:** `version 1/loegos-system-assessment-2026-04-07.md`

This addendum answers the questions directly from the current implementation. It does not add recommendations or future-state proposals.

## 1. The Middle Act: What Staging Is Right Now

The current staging interaction is not drag-and-drop.

For source blocks, the physical interaction is a per-block button inside the document workbench:

- `Stage into weld`
- `Remove from weld`

That button lives in `src/components/workspace/WorkspaceDocumentWorkbench.jsx`.

When the user clicks `Stage into weld`, the block is added to the workspace clipboard in `src/components/WorkspaceShell.jsx` by `addBlockToClipboard()`.

What the user sees after the click:

1. The button on that block changes from `Stage into weld` to `Remove from weld`.
2. The block becomes selected in the workbench.
3. The stage count in the shell updates.
4. On desktop, the staging sidecar opens automatically if staging now contains source or Seven material.

What feedback is recorded:

1. A workspace log entry is appended in the form `block N -> staging`.
2. There is no dedicated success toast for a manually staged source block.

There is also a separate visible staging surface in `src/components/StagingPanel.jsx`:

1. `Seven findings`
2. `Seed queue`

Inside that panel, the user can:

1. move Seven output into the queue with `+` or `Add all`
2. reorder queued blocks with `↑` and `↓`
3. remove queued blocks with `−`
4. clear the queue
5. run `Assemble`

Seven uses a slightly different path. When a Seven reply is staged from the AI rail, `stageSevenMessage()` in `src/components/WorkspaceShell.jsx` adds paragraph blocks into staged AI findings and does show explicit success feedback:

- `Seven reply added to staging.`

So the current staging step is:

1. block-level `Stage into weld` for source material
2. `Add to staging` for Seven output
3. a separate staging panel where the queue is reviewed and assembled

## 2. Operate: What It Computes Right Now

Operate currently has two different computation layers.

### 2.1 Box-Level Operate Read

The main box read is implemented in `src/app/api/workspace/operate/route.js`.

Its prompt explicitly defines Operate as:

1. not chat
2. not summary
3. not rewrite

The box-level Operate result computes:

1. `aim`
2. `ground`
3. `bridge`
4. `gradient` from 1 to 7
5. `convergence`
6. `trust_floor`
7. `trust_ceiling`
8. per-field levels for aim, ground, and bridge
9. per-field rationales
10. `next_move`

The included corpus is built from the current box. In practice that means:

1. the current assembly document if one exists
2. the source documents attached to the box

Built-in guide documents are excluded unless explicitly included.

So Operate is reading the current seed or assembly against the box source corpus, not just summarizing one document in isolation.

The convergence output is already able to name unsupported convergence at a coarse level. It can return:

1. `convergent`
2. `divergent`
3. `hallucinating`

In the current prompt, `hallucinating` means the aim claims support the box does not actually provide.

### 2.2 Inline Operate Overlay

The inline block-level layer is implemented in `src/lib/operate-overlay.js`.

This layer:

1. takes up to 24 non-empty blocks from the working document
2. builds local evidence candidates from source documents using token overlap
3. asks the model for block-level signal, trust, rationale, uncertainty, evidence ids, and optional spans
4. enforces local rules after the model returns

The inline result computes, per block:

1. `green`, `amber`, or `red`
2. `L1`, `L2`, or `L3`
3. rationale
4. uncertainty
5. evidence attachments
6. optional spans

The evidence enforcement layer matters because it constrains the result after generation:

1. if a block has no local evidence, its signal is forced to `amber`
2. if a block has no local evidence, its trust is forced to `L1`
3. if a block claims `L3` with fewer than two evidence items, trust is capped to `L2`

So the current Operate system is already more than summarization. It is a constrained analytical read with explicit support for unsupported claims, evidence-limited trust, and block-level signal assignment. It is not a formal contradiction engine or a full theorem-style convergence verifier.

## 3. Seven: What It Is Right Now

Seven is not implemented as a general-purpose free chat assistant.

The current Seven route is `src/app/api/seven/route.js`. It is document-scoped and surface-scoped.

Every request carries context such as:

1. `documentKey`
2. current section
3. section outline
4. opening context
5. relevant section context for question mode
6. the active workspace surface

Seven also uses surface-specific operating principles:

1. `think` or `listen`: presence before interpretation
2. `seed`: help tighten the line and keep the next move concrete
3. `operate`: read for pattern under constraint and avoid inflating weak evidence
4. `receipts`: audit for proof, drift, and portability
5. `root`
6. `lane`

The general Seven prompt explicitly says:

1. stay close to the provided context
2. do not invent claims, sections, or authorities
3. if inference goes beyond the provided text, say that it is inference

Seven also has specialized instrument modes, including:

1. `word-layer-hypothesis`
2. `root-compress`
3. `root-rewrite`
4. `root-suggest`

What Seven returns right now is still normal assistant text, not a hard-typed staging object by default. After the response arrives, that text can be split into blocks and staged into the box. Those staged Seven blocks are marked in provenance as AI-carried and recast.

So the current status is:

1. Seven is box-aware and document-aware
2. Seven is constrained by surface and context
3. Seven is not unrestricted chat
4. Seven still speaks in prose replies that can later be staged

## 4. Evidence and Trust: What Exists in the Substrate Right Now

The trust and provenance substrate is structured, but it is distributed across several models rather than one single trust object.

### 4.1 Concrete Example

For pasted text, the current backend creates both provenance and trust metadata in `src/app/api/workspace/paste/route.js`.

The provenance seed includes fields such as:

1. `modality`
2. `origin`
3. `captureMethod`
4. `capturedAt`
5. `capturedBy`
6. `attributionStatus`
7. `sourceUrl`
8. `sourceLabel`
9. `transformationHistory`

The trust profile seed includes:

1. `basis`
2. `verification`
3. `trustLevelHint`
4. `summary`

For pasted text specifically, the current system stores:

1. basis `pasted-text`
2. verification `normalized`
3. trust hint `L2`
4. a summary that the text was preserved in the box but not independently verified

### 4.2 Evidence Linkage

The evidence schema in `prisma/schema.prisma` currently includes:

1. `ReaderEvidenceSet`
2. `ReaderEvidenceItem`

An evidence item can contain:

1. `origin`
2. `sourceType`
3. `sectionSlug`
4. `sectionTitle`
5. `blockId`
6. `startOffset`
7. `endOffset`
8. `quote`
9. `excerpt`
10. `noteText`
11. `sourceMarkId`
12. `sourceMessageId`
13. `sourceCitationId`

Receipt payloads also carry evidence linkage through fields such as linked evidence item ids, linked message ids, source sections, and source marks.

### 4.3 Provenance at the Block Layer

At the workspace block level, `src/lib/workspace-provenance.js` currently distinguishes carried material using transfer and provenance fields such as:

1. `transferKind`
2. `importedFromProjectKey`
3. `importedFromDocumentKey`
4. `importedFromBlockId`
5. `importedFromTitle`
6. `carriedAt`
7. `carriedBy`

Those fields are rendered into visible labels like:

1. `History witness`
2. `Source witness`
3. `Carried from`
4. `Recast from`
5. `Authored here`

### 4.4 What This Means in Status Terms

The backend does not currently revolve around one global trust score, one citation graph object, or one canonical provenance chain object.

Instead, the current substrate is composed of:

1. source provenance seeds
2. source trust profile seeds
3. evidence items
4. operate runs
5. receipt proof links
6. block provenance
7. attested overrides

Several state boundaries already exist in storage, though not under exactly the same words used in the aim brief:

1. witness states exist through block provenance labels such as `Source witness` and `History witness`
2. attested override states exist as active, stale, and orphaned
3. assembly confirmation states exist as draft, confirmed, and discarded
4. receipt states exist as local draft, remote draft, sealed, pending, and failed
5. operate states exist as convergent, divergent, and hallucinating

There is not one backend enum today that maps directly onto the complete list `witness`, `active`, `provisional`, `committed`, `stale`, `contradicted`, `sealed`.

## 5. ReaderAttestedOverride: What It Is Right Now

`ReaderAttestedOverride` is a persisted human override on a specific block or span.

The model in `prisma/schema.prisma` stores:

1. `documentKey`
2. `blockId`
3. `spanStart`
4. `spanEnd`
5. `excerptSnapshot`
6. `note`

The write path lives in `src/lib/reader-operate.js`.

The UI surface lives in `src/components/founder/LoegosExplainPanel.jsx` under `Attested override`.

The current user interaction is:

1. select a block in the Founder renderer
2. open the explain panel
3. enter a note
4. click `Attest block`

The panel text currently frames the action as:

- keeping a line attested despite missing or partial evidence

What the override changes in the current system:

1. the block is rendered with override display state
2. the machine read remains visible underneath
3. trust is forced to `L1`

The override itself can be:

1. `active`
2. `stale`
3. `orphaned`

Those statuses are derived by comparing the saved excerpt snapshot against the current block text.

So this is already the system’s explicit persisted mechanism for human judgment overriding the current machine read at the block level.

## 6. Box Lifecycle on Return: What the User Sees Right Now

The current return experience is driven primarily by listening-session resume state plus the current box state.

The resume summary is built in `src/lib/reader-workspace.js` by `buildResumeSessionSummaryForUser()`.

That summary is based on the most recent `ReaderListeningSession` with status `active` or `paused`. It returns:

1. `documentKey`
2. `title`
3. `subtitle`
4. `status`
5. `blockId`
6. `blockPosition`
7. `totalBlocks`
8. `updatedAt`

That summary is then used in `src/lib/box-view-models.js` to render a `Resume` target. The current visible box-home behavior is:

1. if a resume session exists, show `Resume`
2. show the document title
3. show detail such as `Block X of Y`

If no listening resume state exists, the system falls back to current box material such as:

1. the current seed
2. the current assembly
3. the latest real source

The current workspace also records checkpoint events through `src/app/api/workspace/checkpoint/route.js` and `recordReaderProjectSessionCheckpointForUser()` in `src/lib/reader-projects.js`. Those checkpoints summarize whether meaningful events happened since the last checkpoint. That data is being recorded in project metadata and event history.

What the user does not currently get as a general return surface:

1. a unified “what changed in this box while you were away” screen
2. a general elapsed-time-aware staleness preflight
3. a box-wide diff summary on re-entry

Localized staleness detection does exist in the current system:

1. operate overlay fingerprints can become stale
2. attested overrides can become stale
3. document saves can detect stale-document conflicts

So the current return state is resume-oriented, not change-summary-oriented.

## 7. Inter-Box Awareness: What Exists Right Now

At the data-model level, a document can belong to more than one box.

`ReaderProjectDocument` is unique on `[projectId, documentKey]` in `prisma/schema.prisma`. That means the uniqueness boundary is per project, not global per document. `attachDocumentToProjectForUser()` in `src/lib/reader-projects.js` also checks for existing membership only inside the target project.

So the backend currently permits the same `documentKey` to be attached to multiple boxes.

What the visible product currently expresses is different:

1. the workspace is organized box by box
2. imported and created material is attached into the active box flow
3. the current UI does not expose a visible cross-box relationship map
4. the current UI does not expose a cross-box receipt graph
5. the current UI does not expose a box-to-box reference browser

So inter-box infrastructure exists at the membership level, but inter-box awareness is not currently a surfaced front-end behavior.

## 8. Listening: What the Experience Is Right Now

Listening is currently a real playback subsystem, not just a placeholder icon.

The front-end player lives in `src/components/WorkspaceShell.jsx` as `PlayerBar`.

The visible controls include:

1. play or pause
2. previous block
3. next block
4. seek backward 10 seconds
5. seek forward 10 seconds
6. rate adjustment
7. voice selection

The listening session is persisted through `src/app/api/reader/listening-session/route.js` and `saveListeningSessionForUser()` in `src/lib/reader-workspace.js`.

The persisted state includes:

1. document key
2. playback mode
3. scope start and end nodes
4. active node id
5. active section slug
6. offset in milliseconds
7. rate
8. provider
9. voice id
10. active, paused, or idle status

Generated audio is produced through `src/app/api/seven/audio/route.js`.

That route currently supports:

1. OpenAI speech
2. ElevenLabs speech
3. provider fallback behavior

The client also supports device speech synthesis as a local playback mode.

So the current listening experience is:

1. document and block playback
2. resumable listening position
3. selectable voice provider
4. persisted listening state

It is more than a generic media player because it is tied to block navigation and workspace state. It is not currently a separate mismatch-detection engine. The current implementation is playback and positioning support around source and seed text.

## 9. GetReceipts Integration: What Status It Has Right Now

The GetReceipts integration is implemented in the current codebase and is wired into the workspace flow.

The current implemented path includes:

1. connect entry through `src/app/connect/getreceipts/route.js`
2. OAuth callback through `src/app/api/integrations/getreceipts/callback/route.js`
3. encrypted token storage through `src/lib/getreceipts.js`
4. remote receipt draft creation
5. remote seal requests
6. verify URL generation and storage
7. remote evidence upload for supported assets

The workspace uses that integration in multiple places:

1. assemble flow can create a remote receipt draft
2. receipt draft flow can create a remote receipt draft
3. sealing flow can sync the sealed draft to GetReceipts and store remote seal state

In the seal path, `src/app/api/workspace/receipt/route.js` calls `syncReceiptDraftToCourthouse()` from `src/lib/receipt-remote-sync.js` when the user has a connected GetReceipts account. The sealed draft payload can then store:

1. remote receipt id
2. remote seal status
3. seal hash
4. verify URL
5. remote level
6. last remote error

The UI currently surfaces courthouse status, retry paths, and verify links in the workspace and receipt views.

So the current status is:

1. GetReceipts sync is not aspirational in code
2. it is implemented across connect, draft, seal, and verify surfaces
3. it is optional, with local proof still supported when disconnected

What I did not do in this pass was re-run a live end-to-end external seal against the real GetReceipts service. So the code path is present and wired, but this addendum does not claim a fresh runtime verification from today.
