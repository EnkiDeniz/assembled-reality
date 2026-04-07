# Box Assembly Lane Product Doc v0.1

Grounded in the current repository state on 2026-04-05.

## One sentence

Loegos should not have a separate retrospective mode; a box should always be a single assembly lane where forward assembly is the live edge and retrospective assembly is the same lane viewed after more of the path exists.

## Status

- This document is a product direction and gap analysis.
- It uses the Lœgos origin corpus as the canonical test case.
- It is meant to convert the current self-assembly insight into the next box model.

## Core correction

The earlier framing, "add a retrospective mode," is wrong.

It creates the wrong product shape and the wrong implementation burden.

If we split the product into:

- a forward box
- a retrospective box

we guarantee two view models, two workflows, two mental models, and eventually two truth systems.

The better rule is:

**A box assembled today is tomorrow's retrospective.**

So the product should have:

- one box model
- one assembly lane
- one box view model
- one set of source and proof rules

The only difference is temporal position:

- **forward assembly** means the user is standing at the leading edge
- **retrospective assembly** means the user is loading more of the lane after the fact

## Product thesis

Loegos already knows how to hold sources, a root, a live seed, confirmations, assemblies, and receipts.

What it does not yet know how to do well is show the user:

- how this box got here
- which sources were load-bearing
- where the shape turned
- what was selected, staged, advanced, and sealed
- what is missing from the record

The next product move is not "add retrospective."

The next product move is:

**Make box assembly legible by default.**

## Canonical test case

The first test case is the product itself.

The reverse-engineered Lœgos box should begin with:

- [# ASSEMBLED REALITY.md](/Users/denizsengun/Projects/AR/docs/First%20seed/%23%20ASSEMBLED%20REALITY/%23%20ASSEMBLED%20REALITY.md) as the first major source and likely root candidate
- staged operator sentences extracted from that source
- a first seed shaped from those blocks

Then the lane should continue through:

- software implementation captured in Git history
- screenshots showing the naming moment, early box state, document player, and Declare Root evolution
- competitive analysis and product realization from image-derived notes
- feedback moments with builders and Melih
- receipt sealing in GetReceipts
- the later self-assembly insight that the product can read its own origin

The question is not just "what sources produced Lœgos?"

The real question is:

**If today's app had existed then, would it have helped assemble this box, and what would still have been missing?**

## What the box should look like

The default box view should be an assembly lane.

Not a source list plus separate create surface plus separate proof area as the primary mental model.

Those surfaces can still exist, but they should all be projections of one lane.

At minimum, the box should show:

- a pinned root line
- the current live seed
- lane entries in time order
- grouped moves or milestones when the record is dense
- proof state for each move
- missing-evidence warnings where the shape is inferred but weak
- a clear leading edge where the next move can happen

In the Lœgos example, the lane would read roughly like this:

1. Assembled Reality enters as the foundational source.
2. Operator sentences are selected and staged into an early seed.
3. The first document-sharing tool is built.
4. The reader becomes a player.
5. Naming and interface identity cohere.
6. Competitive analysis clarifies the trust and product difference.
7. The prototype is shared externally.
8. The share becomes a sealed receipt.
9. The self-assembly insight appears.

That is one lane.

If we were living at step 3, it would still be the same lane.

## Product principles

### 1. One lane, not two modes

Retrospective and forward work must use the same box object, same provenance rules, same receipt rules, and same UI grammar.

### 2. Time is first-class

Every meaningful move in a box should be placeable in time, even if some timestamps are inferred or approximate.

### 3. Sources do not equal truth

Imported material becomes usable when normalized. It becomes weight-bearing only when supported by provenance, confirmation, or proof.

### 4. Derived evidence never replaces raw evidence

Image-derived markdown, summaries, transcripts, and history normalizers are witnesses, not substitutes for the original asset or export.

### 5. The seed is the live edge

The seed should be understood as the current working position on the lane, not as a separate zone disconnected from history.

### 6. Receipts close moves

The sealed receipt is what closes a move against reality. Not every lane entry seals, but every meaningful closure should be visible.

### 7. Platform history is optional enrichment

Git, email, chat, calendar, and task exports are powerful chronology witnesses when available, but boxes must still work without them.

### 8. Seven proposes; the human authors

Seven can cluster, compare, suggest chronology, and propose missing links. The human still decides what the move meant.

## Current reality in the app

The app already supports important parts of this model.

### Supported now

- Mixed-source intake exists for files, links, pasted text, photos, and speak notes.
- A root can be declared.
- Blocks can be staged and confirmed.
- The live seed exists as the current assembly document.
- Receipts can be drafted and sealed.
- Box metadata already stores `assemblyState`, `stateHistory`, and `assemblyIndexMeta.events`.

### Partially supported

- Image sources can be converted into source notes or documents.
- Audio can become transcript sources.
- Link imports are preserved as derived source documents.
- Git history normalization exists, but only in the self-assembly demo layer, not in the main box workflow.

### Missing

- No default assembly lane UI in the box itself.
- No first-class "dump the folder" flow for retrospective loading.
- No native milestone clustering over mixed sources.
- No first-class causal map between sources, product moves, and receipts.
- No visible distinction between lane entries that are selected, staged, advanced, or sealed.
- No box-level chronology view that joins sources, screenshots, exports, and receipts into one readable path.
- No main-product history adapters for Git, chat, email, calendar, task systems, or doc revisions.
- No first-class gap register showing where the box is inferring shape from weak evidence.

## Gap statement

Today, Loegos can help build this box.

Today, Loegos cannot yet show this box the way the theory says it should be seen.

That is the central gap.

## Unified object model

The product should keep the existing persistence model and reinterpret it through a box-history lens.

### Existing code terms

- `ReaderProject` = box
- `ReaderDocument` = source or seed/assembly document
- `ReadingReceiptDraft` = proof draft or sealed receipt
- `currentAssemblyDocumentKey` = current live seed pointer
- `metadataJson.assemblyState` = box state summary
- `metadataJson.stateHistory` = state transitions through time
- `metadataJson.assemblyIndexMeta.events` = recorded box events

### Product-level history terms

- **Lane entry:** any dated or ordered event in the box
- **Move:** a grouped step in the assembly path
- **Leading edge:** the newest live position where the user can still act
- **History witness:** a source whose main value is chronology
- **Closure:** a move that is sealed by proof

### Mapping rule

We should not create a second persistence layer for retrospective assembly.

We should derive the lane from:

- source documents
- source assets
- block confirmations
- seed revisions
- assembly documents
- receipt drafts and seals
- project events
- imported history entries

## Default box experience

The default box should open to an assembly lane with three simultaneous readings of the same object:

- **Lane:** what happened
- **Seed:** where we stand now
- **Proof:** what has actually closed

### Core regions

- **Pinned origin:** root and root rationale
- **Lane body:** chronological moves and source activity
- **Seed panel:** current live edge and next move
- **Proof rail:** receipts and closure state

### Lane entry grammar

Each lane entry should be able to show:

- title
- type
- time or inferred order
- source basis
- trust/provenance hint
- selected blocks
- staged blocks
- advanced statements
- proof status
- linked receipt if any

### Move grammar

When many entries cluster, Seven can propose a move boundary such as:

- "Reader becomes player"
- "Declare Root becomes explicit"
- "Prototype shared externally"

The user can accept, edit, merge, or split these moves.

## Forward assembly on the lane

When the user is working live, they do not switch into a different mode.

They stay on the same lane and operate at the leading edge:

1. Add a source.
2. Listen or read.
3. Select and confirm blocks.
4. Shape the seed.
5. Run Operate if useful.
6. Draft or seal a receipt.
7. Continue the lane.

This is forward assembly.

## Retrospective assembly on the lane

When the user is rebuilding a finished chapter, they also stay on the same lane:

1. Dump the folder.
2. Normalize everything into source documents and assets.
3. Declare root.
4. Load available history witnesses.
5. Let Seven propose chronology and move clusters.
6. Confirm the shape.
7. Seal the strongest closures.

This is retrospective assembly.

Same box. Same lane. Same proof rules.

## Source classes the lane must support

The lane should treat these as first-class source classes:

- direct text sources
- uploaded documents
- pasted notes
- links
- photos and screenshots
- voice memos and transcripts
- receipt evidence assets
- platform history exports

### History export kinds

The first normalization contract should support:

- `git-log`
- `email-thread-export`
- `chat-export`
- `calendar-export`
- `task-history-export`
- `docs-revision-export`

The rule is:

all of them normalize into the same lane-entry structure.

## The Lœgos reverse-engineering walkthrough

If we rebuild the Lœgos box with the desired product:

### Phase A: founding source

- `# ASSEMBLED REALITY.md` enters as the first major source.
- Key operator sentences are selected.
- The first seed forms from those selected blocks.

### Phase B: build history

- Git commits become chronology witnesses for implementation moves.
- They do not replace narrative sources, but they strengthen sequence and change visibility.

### Phase C: product realization

- Screenshots and image-derived notes capture naming, UI shape, player logic, and product differentiation.
- These become lane entries and proposed move clusters.

### Phase D: external contact

- Messages to builders and Melih enter the lane as feedback witnesses.
- The share of the prototype becomes a move with contact against reality.

### Phase E: proof closure

- The GetReceipts seal closes the strongest move in the lane.
- The box now shows not only that the product was built, but where reality answered back.

### Phase F: self-assembly insight

- The final move is not just another source.
- It is the recognition that the box itself can be used as the example of the framework.

## Proposed implementation phases

### Phase 1: Expose the lane already in the data

- Use existing `stateHistory` and `assemblyIndexMeta.events` in the main box view.
- Show receipts and seed changes inside a unified timeline.
- Keep current source and seed surfaces, but make them projections from the lane.

### Phase 2: Make the seed the leading edge of the lane

- Reframe the current seed panel as "current edge."
- Show how staged blocks and confirmations attach to recent lane entries.
- Add visible `selected -> staged -> advanced -> sealed` status to relevant moves.

### Phase 3: Add retrospective import to the same box flow

- Add "dump a folder" as a source-ingestion path, not a new product mode.
- Preserve raw assets and derived witnesses together.
- Ask for root after import, not before import.

### Phase 4: Bring history adapters into the main product

- Move Git history normalization out of the self-assembly demo layer and into the box ingestion pipeline.
- Add the shared history-entry contract for other exports.
- Keep exports optional, never required.

### Phase 5: Add Seven clustering and gap detection

- Propose chronology order when timestamps are mixed or partial.
- Cluster entries into candidate moves.
- Highlight likely load-bearing sources.
- Flag missing proof, weak chronology, and unsupported causal claims.

### Phase 6: Add box-history sharing

- Let a user share the lane view of a box.
- The shared view should show the assembly path, not just the final seed or final proof.

## Design constraints

- No separate retrospective data model.
- No second box type.
- No split between "live work" and "history work" at the persistence layer.
- No claim of automatic truth from derived evidence.
- No requirement that every box have platform-history data.

## Success criteria

We should consider this direction successful when:

- a live box naturally becomes a retrospective box without conversion
- the user can see how the box got here, not only what is in it now
- the seed reads as the live edge of history
- receipts visibly close moves in the lane
- imported history exports strengthen chronology without distorting the rest of the box
- the Lœgos origin corpus can be rebuilt in the main product without needing a separate self-assembly-only framework

## Product sentence

**Loegos is an assembly lane where sources enter, meaning is shaped, proof closes moves, and the box can prove how it got here.**
