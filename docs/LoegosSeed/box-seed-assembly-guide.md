# Box, Seed, Sources, and Assembling in Loegos

Grounded in the current repository state on 2026-04-05.

## One-sentence model

Loegos is a box-based workspace where meaningful signal is turned into sources, a current seed, an honest box-read, and portable proof.

The shortest product sentence in the codebase is:

`source -> seed -> receipt`

The shortest implementation sentence is:

`ReaderProject -> ReaderDocument(source/assembly) -> ReadingReceiptDraft`

## Executive summary

- A **box** is the container for one piece of work.
- In code, a box is primarily a `ReaderProject`.
- A **seed** is the current working position inside that box.
- In code, the seed is the box's current `assembly` document, usually the one pointed to by `currentAssemblyDocumentKey`.
- **Sources** are normalized incoming signals with preserved provenance and trust hints.
- **Assembling** is the loop of bringing signal in, turning it into blocks, shaping the seed, confirming evidence, running Operate, and sealing receipts.
- The code still uses a lot of older `assembly` naming internally; the product language increasingly calls that same object the **seed**.

## What a box is

### Product meaning

A box is the top-level container for one work thread: one strategy, negotiation, research thread, project, trip, decision, or operating question.

It is not just a folder. A real box can contain:

- sources
- one current seed
- receipt drafts and seals
- Seven context
- box state
- resume state
- root / declared line

### Code meaning

The main box record is `ReaderProject` in `prisma/schema.prisma`.

Important fields:

- `projectKey`: stable box identifier
- `title` / `boxTitle`: the box name
- `subtitle` / `boxSubtitle`: the summary line shown in the UI
- `currentAssemblyDocumentKey`: pointer to the current seed
- `metadataJson`: box architecture metadata
- `documents`: memberships linking documents into the box
- `readingReceiptDrafts`: proof drafts attached to the box

The code treats box and project as near-synonyms:

- user-facing language: **box**
- persistence/model language: **project**

That translation is everywhere:

- `src/lib/project-model.js`
- `src/lib/reader-projects.js`
- `src/app/api/workspace/project/route.js`

### Default box vs named boxes

There is always a default box:

- `DEFAULT_PROJECT_KEY = "default-project"`
- `DEFAULT_PROJECT_TITLE = "Untitled Box"`

The app can also create named boxes with their own `projectKey`, title, metadata, and document memberships.

## What a seed is

### Product meaning

The seed is the current working object of the box.

It answers:

`Where does this box stand right now?`

In current product language, the seed is the visible working position the user shapes over time.

### Code meaning

The seed is implemented as an `assembly` document:

- `documentType === "assembly"` or `isAssembly === true`
- often additionally marked with `seedMeta.isSeed === true`
- attached to a box with role `ASSEMBLY`
- usually set as the box's `currentAssemblyDocumentKey`

This is the key compatibility rule in the repo:

- user-facing term: **seed**
- internal compatibility term: **assembly**

Important files:

- `src/lib/seed-model.js`
- `src/lib/workspace-documents.js`
- `src/app/api/workspace/seed/route.js`
- `src/lib/project-model.js`

### Seed structure

The current seed markdown template has four sections:

- `Aim`
- `What's here`
- `The gap`
- `Sealed`

Those sections are defined in `src/lib/seed-model.js`.

### Seed status and metadata

Seed-specific metadata lives in `seedMeta` and is normalized by `normalizeSeedMeta`.

Important fields:

- `isSeed`
- `templateVersion`
- `status`
- `updatedAt`
- `suggestionPending`
- `autoTitled`
- `sourceFingerprint`
- `lastSuggestedFingerprint`

That means the seed is not just a markdown document. It is a tracked, stateful working object.

## The relationship between seed and assembly

This is the most important conceptual point in the repo.

The docs increasingly say:

- the seed and the assembly are the same object

The code mostly agrees, with one nuance:

- the infrastructure still stores and routes the object as an `assembly`
- the UI and product copy increasingly call that active assembly the `seed`

So the cleanest current interpretation is:

- **assembly** is the legacy/internal substrate
- **seed** is the current product-facing name for the live assembly

One more nuance matters:

- the product ideal is "one box has one seed"
- the database can still contain multiple assembly documents over time
- the one that counts as the live seed is the one referenced by `currentAssemblyDocumentKey`

## What sources are, and how they relate to the box

### Core rule

Sources are incoming signals normalized enough to use, but not automatically promoted to truth.

The repo repeats this distinction constantly:

- normalization makes a source readable
- verification changes how much weight it carries

### Source record shape

In practice, most sources are `ReaderDocument` records with:

- `documentType = "source"`
- attached `blocks`
- optional `sourceAssets`
- `sourceProvenance`
- `sourceTrustProfile`
- `intakeKind`
- optional derivation metadata

Relevant files:

- `src/lib/reader-documents.js`
- `src/lib/source-model.js`
- `src/lib/source-assets.js`
- `docs/source-model-spec.md`
- `docs/provenance-trust-policy.md`

### Source classes in the code and specs

The source model names these modalities:

- `text`
- `voice`
- `image`
- `link`
- `human-state`
- `derived`
- `assembly`
- `receipt`

Current practical live paths are strongest for:

- uploaded text documents
- pasted text
- imported links
- voice notes / transcripts
- image-derived source documents or notes

### Source origin and trust

Each source is meant to preserve:

- modality
- origin
- capture method
- captured time
- source URL or filename when available
- transformation history

Trust is carried separately, for example:

- built-in guide: `guide`
- seed/assembly: `working`
- uploaded/pasted/link/image/voice source: usually `L2` hint in current code

Important distinction:

- a seed is useful for Create and Operate
- a seed is **not** treated as independent proof

That exact idea appears in `buildSourceTrustProfile` in `src/lib/source-model.js`.

### Built-in guide vs real sources

The box can contain a built-in guide document.

That guide:

- helps orientation
- can appear in source lists
- is excluded from Operate by default
- is not counted as a real source

`listRealSourceDocuments` in `src/lib/seed-model.js` is the cleanest implementation of that distinction.

## Why the user uses boxes and seeds

### Why the user uses a box

The box solves the container problem.

The user needs one place where different kinds of signal can coexist:

- a file
- a page from a link
- a pasted note
- a voice memo
- an image-derived document
- the current working position
- proof that has been drafted or sealed

The box is therefore the scope of meaning-making. It is where one thread of reality is gathered and pressured.

### Why the user uses a seed

The seed solves the orientation problem.

The user needs a living answer to:

- what am I trying to make real?
- what is actually here?
- what is still missing?
- what has already been sealed?

The seed is that answer.

### Why the user keeps using them together

The box keeps the evidence together.

The seed keeps the current position legible.

Without the box, the seed has no grounded material.

Without the seed, the box is only a pile.

## How the user uses them in the current app

### First-time path

The first-time composer in `src/components/FirstBoxComposer.jsx` offers two entry modes:

- `Capture`
- `Write`

Capture supports:

- upload file
- add photo
- paste text
- add link
- speak note

Write supports:

- typing the first intention, context, or signal directly

Important implementation nuance:

- even "Write" becomes a **source first**
- it does not skip the source layer and write directly to the seed

`writeFirstSeedDraft` in `src/components/WorkspaceShell.jsx` literally pastes the typed text into the workspace as a source, then the seed is ensured afterward.

### Auto-seed behavior

When a box has real source documents and no current seed, the workspace auto-runs the seed ensure flow.

That behavior lives in `src/components/WorkspaceShell.jsx`.

So the user experience is:

1. bring in the first real signal
2. the app creates or opens the seed
3. the seed becomes the live working position

### Returning-user path

The box home and resume logic are built around:

- the strongest next move
- the current seed
- the latest source
- the proof state

The box view model in `src/lib/box-view-models.js` computes:

- `resumeTarget`
- `strongestNextMove`
- `hasSeed`
- `receiptSummary`
- `stateSummary`

So the box is not passive storage. It is an oriented work container.

## The actual assembly process in code

This is the end-to-end loop as the repo currently implements it.

### 1. Intake: signal enters the box

Signal can arrive through:

- file upload: `POST /api/documents`
- folder import: `POST /api/workspace/folder`
- link import: `POST /api/workspace/link`
- paste: `POST /api/workspace/paste`
- voice/audio upload: source-intake path
- image upload/paste: source-intake path

Important behavior:

- folder import can create a new box if no `projectKey` is provided
- each accepted file becomes its own source document
- the intake result also tracks skipped files and diagnostics

### 2. Normalization: raw signal becomes a source document

Incoming material is normalized into markdown-like document content and then into blocks.

This happens through utilities such as:

- `src/lib/document-import.js`
- `src/lib/link-intake.js`
- `src/lib/image-intake.js`
- `src/lib/audio-intake.js`
- `src/lib/source-intake.js`

The normalization rule is:

- preserve provenance
- preserve modality
- preserve derivation path
- do not silently upgrade trust

### 3. Blocking: documents become block-addressable material

`buildWorkspaceBlocksFromDocument` in `src/lib/document-blocks.js` turns parsed document sections into blocks.

Each block gets important lineage fields:

- `id`
- `documentKey`
- `sourceDocumentKey`
- `sourcePosition`
- `sectionTitle`
- `sectionSlug`
- `sourceTitle`
- `plainText`
- `operation`
- `author`

This is what makes later assembly traceable.

### 4. Box attachment: the source becomes part of a box

When a source document is created, it is attached to a box using `attachDocumentToProjectForUser`.

That means a box is not just a title record. It owns explicit memberships to documents.

Membership roles:

- `SOURCE`
- `ASSEMBLY`

### 5. Seed creation: the box gets a current working position

The seed route is `POST /api/workspace/seed`.

Current behavior:

- if there is no real source and no seed, first seed creation is rejected
- if there are real sources and no seed, the route creates the first seed
- if a seed already exists, the route can ensure it, suggest an update, or apply a suggestion

Seed generation is based on:

- box title
- real source documents
- current seed sections when present
- receipt count
- latest operate timestamp

Important implementation nuance:

- product docs often say "Seven creates the seed"
- current code creates the seed through the dedicated seed route, not through `POST /api/seven`
- the route uses the OpenAI responses API directly and falls back to a heuristic seed when AI is unavailable

### 6. Staging and shaping: selected material becomes the seed

The Create / Seed surface lets the user:

- select blocks from sources
- stage them
- move accepted Seven output into staging
- assemble them into a working document

The old implementation name for this action is still `assemble`.

`POST /api/workspace/assemble`:

- requires at least one selected block
- creates an assembly document
- marks it as editable and lineage-preserving
- can immediately create a receipt draft for that assembly

This is why "assembling" in this repo means more than document editing. It means taking traceable blocks from sources and shaping them into the current working object.

### 7. Confirmation: source blocks are tested as evidence

Raw source blocks start as unconfirmed.

The confirmation system lets the user confirm or discard source blocks through:

- `POST /api/workspace/confirm`

When a block is confirmed, it gets:

- `confirmationStatus = confirmed`
- a `primaryTag`
- an optional `secondaryTag`
- a `domain`

When discarded, it gets:

- `confirmationStatus = discarded`

This matters because confirmed evidence blocks are what later support sealing.

### 8. Operate: the box reads itself

Operate is box-scoped, not document-scoped.

`POST /api/workspace/operate` reads:

- real sources in the box
- the current seed, if included

By default it excludes:

- the built-in guide
- staging
- receipt history
- Seven thread history

Operate returns a structured read:

- `aim`
- `ground`
- `bridge`
- `gradient`
- `convergence`
- `trustFloor`
- `trustCeiling`
- `levels`
- `level_rationales`
- `nextMove`

This is the diagnostic layer, not the chat layer.

### 9. Receipt drafting: the box preserves proof

Receipts can be drafted from:

- a workspace state
- an assembly/seed
- an Operate result

Relevant route:

- `POST /api/workspace/receipt`

Important rule:

- receipt drafting is local-first
- remote GetReceipts failure never blocks local draft creation

### 10. Sealing: proof is pressure-tested against the box

Sealing a receipt uses:

- `PUT /api/workspace/receipt`
- `src/lib/receipt-seal-audit.js`

The seal audit checks:

- `root-alignment`
- `evidence-contact`
- `seed-alignment`

A seal needs:

- a root or declared line
- confirmed evidence blocks
- a delta statement describing what changed

When sealed, the system updates:

- the receipt draft status
- the box's assembly state
- the box's state history
- the box's assembly index event stream

### 11. Remote proof: local proof can travel

If GetReceipts is connected, receipt drafts and seals can sync outward.

Important terms here:

- `GetReceipts`
- `Courthouse`
- `remoteSeal`
- `verifyUrl`
- `sealHash`

The repo treats this as a portability layer, not the source of truth for local drafting.

## How the seed relates to source documents

The seed is built from source documents in three distinct ways.

### 1. Semantic summarization

The seed route reads real source documents and produces:

- Aim
- What's here
- The gap
- Sealed

So the seed compresses the source set into the current working line.

### 2. Structural lineage

When the user assembles blocks into a seed, the assembly document preserves per-block source lineage.

That lineage includes:

- source document key
- source position
- source title
- operation

This is the repo's core anti-handwave feature.

### 3. Operative inclusion

Operate includes the current seed alongside real sources by default.

That means the seed is not just a summary for humans. It becomes part of the box material used for the next diagnostic read.

## Root, domains, and why they matter

The repo's box model is not only "sources plus seed." It also tracks a declared line called the **Root**.

### Root

The Root is:

- a short declared line for the box
- limited to seven words
- immutable after declaration
- optionally paired with a gloss

Important files:

- `src/lib/assembly-architecture.js`
- `src/components/RootEditor.jsx`
- `src/lib/reader-projects.js`

### Domains

The box architecture also tracks applicable domains such as:

- vision
- financial
- legal
- people
- physical
- technical
- temporal
- relational
- risk
- completion

Confirmed evidence is mapped into domains. Coverage across those domains is used to assess how assembled the box is.

## Box state progression

The box state machine in `buildAssemblyStateSummary` is one of the clearest answers to "what does assembling mean here?"

States:

- `declare-root`
- `rooted`
- `fertilized`
- `sprouted`
- `growing`
- `structured`
- `assembled`
- `sealed`
- `released`

Rough progression logic:

- `declare-root`: no root yet
- `rooted`: root exists
- `fertilized`: root exists and at least one real source exists
- `sprouted`: at least one sealed receipt exists
- `growing`: at least three sealed receipts and evidence across at least two domains
- `structured`: enough evidence coverage across applicable domains
- `assembled` / `sealed` / `released`: currently controlled by manual state overrides

The code also defines two broader phases:

- `assembling`
- `committing`

So assembling is not one click. It is a tracked progression of grounding, confirming, sealing, and releasing.

## Visualization and object logic

The seed is also treated as a visual object.

`buildVisualizationState` in `src/lib/seed-model.js` maps box maturity into visualization stages:

- `dormant`
- `wireframe`
- `growing`
- `solid`
- `tension`

Those stages depend on:

- real source count
- whether the box has a seed
- local receipt count
- remote receipt count
- whether the seed still carries gap signal

So the box is not visualized as a notebook. It is visualized as an object becoming more real.

## Important terminology in the current codebase

| Term | Meaning in this repo | Current code reality |
|---|---|---|
| Box | Top-level container for one thread of work | Usually a `ReaderProject` |
| Project | Persistence/model word for box | Same object as box in practice |
| Box Home | The orient/resume screen for one box | UI summary surface |
| Boxes | All-boxes index | Outside the inner work loop |
| Source | Normalized incoming signal | Usually a `ReaderDocument` with `documentType = source` |
| Real source | Non-built-in, non-seed source | What counts for first-seed creation |
| Built-in guide | Internal reference source inside a box | Excluded from Operate by default |
| Source asset | Attached media/link record for a source | `ReaderSourceAsset` |
| Source provenance | Origin/capture/transformation metadata | Separate from trust |
| Source trust profile | Trust basis and hint | Usually guide, working, or L2-like hints |
| Seed | Current working object of the box | Current assembly document |
| Assembly | Older internal name for seed | Still the storage and route term |
| Assembly document | A document built from staged blocks | Can be the live seed |
| Seed meta | Seed-specific document metadata | `isSeed`, fingerprints, suggestion state |
| Root | Declared line for the box | Short, portable, seven words or fewer |
| Gloss | One-line expansion of the Root | Helps the Root travel |
| Block | Smallest working unit derived from a document | Carries lineage |
| Staging | Temporary selected material before shaping | Create surface concept |
| Confirmation queue | Unconfirmed source blocks awaiting judgment | Box architecture system |
| Primary tag | Main role of a confirmed block | `aim`, `evidence`, `story`, or unconfirmed |
| Secondary tag | Optional second role tag | Additional annotation |
| Domain | Area of reality the block belongs to | Vision, legal, financial, etc. |
| Seven stage | Optional 1-7 stage on a block | More detailed assembly staging |
| Think | Reading/orientation phase | Source-first work |
| Seed/Create | Shaping phase | Stage material into live position |
| Operate | Box-read engine | Structured diagnostic, not chat |
| Seven | Contextual conversational surface | Interpretive, document-scoped or audit help |
| Receipt | Proof artifact | Usually local-first draft before seal/sync |
| Seal | Closure of a receipt against evidence | Changes box state |
| GetReceipts | External proof portability layer | Optional remote sync |
| Courthouse | Remote seal/verification language | GetReceipts-related proof status |
| Gradient | Operate's 1-7 convergence stage | Returned by Operate |
| Convergence | Operate judgment of fit | `convergent`, `divergent`, `hallucinating` |
| Trust floor / ceiling | Operate trust bounds | Limited to `L1`-`L3` in current code |
| Aim / Ground / Bridge | Operate's three sentences | Distinct from seed sections |
| Aim / What's here / The gap / Sealed | Seed's four sections | Current seed template |
| Assembly Index events | Event stream of structural box changes | Stored in project metadata |
| State history | Recorded box progression | Stored in project metadata |

## Two important code-vs-doc nuances

### 1. Seed generation is not literally Seven chat

The docs often narrate seed creation as "Seven creates the seed."

The code currently does this more precisely:

- the dedicated seed route creates or refreshes the seed
- it calls the OpenAI API directly
- Seven remains the separate conversational surface

That separation is consistent with the repo's larger boundary rule:

- Seven talks
- Operate diagnoses
- Receipts preserve proof

### 2. The conceptual shape language is slightly ahead of the implementation

Some newer docs propose richer symbolic language like:

- `œ`
- welded meaning
- updated shape vocabulary

But the current assembly architecture code still uses these primary tags:

- `aim` with `△`
- `evidence` with `◻`
- `story` with `○`
- `unconfirmed` with `⊘`

So if you want the truth of the running implementation, trust `src/lib/assembly-architecture.js` over the more speculative symbolic docs.

## The cleanest mental model to keep

If you want the shortest expert model of this repo, it is this:

1. A **box** is the scoped container for one reality thread.
2. **Sources** are normalized signal inside the box, with provenance and trust kept explicit.
3. A **seed** is the current assembled position of the box.
4. **Assembling** means turning incoming signal into blocks, shaping the seed, confirming evidence, reading the box honestly, and sealing proof.
5. The box becomes more real as more of its material moves from raw source, to shaped seed, to confirmed evidence, to sealed receipt.

## Primary code map

If someone wants to study this system directly in code, these are the best files to start with.

- `README.md`: best current high-level source of truth
- `src/lib/project-model.js`: box/project identity and seed pointers
- `src/lib/reader-projects.js`: box persistence, creation, updates, memberships
- `src/lib/seed-model.js`: seed structure, detection, visualization
- `src/lib/source-model.js`: source modalities, provenance, trust, box source summaries
- `src/lib/document-blocks.js`: block normalization and lineage
- `src/lib/assembly-architecture.js`: root, domains, block confirmation, box states
- `src/lib/source-intake.js`: file/link/image/audio intake orchestration
- `src/lib/reader-documents.js`: source document creation and derived document flows
- `src/lib/workspace-documents.js`: assembly/seed document creation and metadata updates
- `src/lib/operate.js`: inclusion rules and Operate result shape
- `src/app/api/workspace/seed/route.js`: first seed creation and seed refresh
- `src/app/api/workspace/assemble/route.js`: assembly creation from staged blocks
- `src/app/api/workspace/confirm/route.js`: evidence confirmation and discard
- `src/app/api/workspace/operate/route.js`: box-read execution
- `src/app/api/workspace/receipt/route.js`: receipt drafting and sealing
- `src/lib/receipt-seal-audit.js`: seal audit logic
- `src/lib/workspace-receipts.js`: receipt payload and lineage snapshots
- `src/components/FirstBoxComposer.jsx`: first-time user entry
- `src/components/ProjectHome.jsx`: why the box exists as a work container
- `src/components/SeedSurface.jsx`: how the seed is presented to the user
- `src/components/SourceRail.jsx`: how sources and seeds are separated in the UI

