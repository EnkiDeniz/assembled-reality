# Assembly Lane Review Brief v0.1

Grounded in commit `3e1c6345e41d80ca3e68e13904195b161067217e` on 2026-04-05.

## Why this exists

This change tries to resolve a product contradiction that became obvious during the self-assembly exercise.

We had started building two different things:

- the main workspace, which still behaved like a traditional box app with a summary-style Box Home plus separate Think / Seed / Operate / Receipts surfaces
- the self-assembly demo, which was starting to show the product more like a reconstructable chain of evidence

The push from product was that this should not become two modes.

The key correction was:

**Forward assembly and retrospective assembly should be the same object viewed from different positions in time.**

That means:

- no separate retrospective mode
- no second box model
- no separate “history” system next to the real one
- one assembly lane that is always present

The stronger product sentence became:

**Loegos is an assembly lane where sources enter, meaning is shaped, proof closes moves, and the box can prove how it got here.**

That last clause matters. The lane is not meant to be a neutral timeline. It is supposed to be the receipt of the box’s own assembly.

## What I tried to do

I tried to make the product take its own theory seriously in a first practical slice.

The implementation goal was:

- make `Assembly lane` the default box-facing surface
- derive it from the existing box data model rather than inventing a second persistence model
- keep Think / Seed / Operate / Receipts, but demote them from separate top-level truths to contextual surfaces around the same lane
- align the public self-assembly demo to the same framing so the demo and product stop diverging conceptually

In plain language, I tried to replace “open the box, then choose a mode” with “open the box, see how it assembled, and move from the current edge.”

## The story behind the implementation

The immediate trigger for this work was the Lœgos self-assembly exercise.

We used the actual origin corpus of the project:

- foundational text sources like `# ASSEMBLED REALITY`
- the image-derived origin/evolution/feedback/receipt markdown
- the Git history export

That exercise made the real question much sharper:

**If today’s app had existed then, would it actually have helped assemble this box, and would the box now be able to prove how it got here?**

The answer was “partially.”

The app could already:

- ingest sources
- let a user listen, select, confirm, and stage blocks
- shape a seed
- operate on the box
- draft and seal receipts

But it could not yet show the box as a coherent assembly lane.

It still presented the box mostly as:

- a source list
- a seed surface
- an operate surface
- a receipts surface
- a summary home

That structure makes the box useful, but it weakens the main promise. The user can work in the box, but the box still struggles to show how it got here.

So this implementation is an attempt to make the first durable move toward that promise without blowing up the current product.

## The core logic

The implementation is based on a few rules.

### 1. One lane, not two models

I did not add a “retrospective box” or “history mode.”

Instead, the lane is derived from data the product already has:

- source documents and derived documents
- the current seed / assembly document
- block confirmation state
- receipts and sealed drafts
- project metadata such as `stateHistory` and `assemblyIndexMeta.events`
- optional history witnesses such as imported Git history

### 2. The lane is evidence-backed, not just chronological

Each lane entry tries to carry:

- what kind of thing it is
- when it happened, or whether order is inferred
- what stage of assembly it represents
- what proof state it has
- what kind of evidence it is based on

This is the beginning of the “chain of evidence” framing, even though the first version is still fairly lightweight.

### 3. History exports are optional witnesses

Git history was promoted into a shared normalization module because the self-assembly demo had already proven the shape was useful.

But the lane is not supposed to require Git or any platform export.

The intended rule is:

- a box without external history should still render coherently from sources, seed, and receipts
- a box with exported platform history should gain corroborating chronology, not a separate truth system

### 4. The live edge matters

The lane is not meant to be a dead archive.

It needs to preserve:

- root / origin
- current live seed
- proof closure

So the surface explicitly pins those three ideas and then renders the broader lane beneath them.

## What changed in code

### Main product changes

- Added a new lane surface in [AssemblyLane.jsx](/Users/denizsengun/Projects/AR/src/components/AssemblyLane.jsx)
- Added shared lane derivation in [box-view-models.js](/Users/denizsengun/Projects/AR/src/lib/box-view-models.js)
- Made the workspace default toward lane-first behavior in [WorkspaceShell.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceShell.jsx)
- Updated workspace controls and mobile nav to say `Assembly lane` in:
  - [WorkspaceControlSurface.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceControlSurface.jsx)
  - [MobileBottomNav.jsx](/Users/denizsengun/Projects/AR/src/components/MobileBottomNav.jsx)
  - [SourceRail.jsx](/Users/denizsengun/Projects/AR/src/components/SourceRail.jsx)
  - [BoxesIndex.jsx](/Users/denizsengun/Projects/AR/src/components/BoxesIndex.jsx)

### History witness changes

- Extracted shared history normalization into [history-normalization.js](/Users/denizsengun/Projects/AR/src/lib/history-normalization.js)
- Refactored the self-assembly pipeline to use that shared history normalization in [self-assembly.js](/Users/denizsengun/Projects/AR/src/lib/self-assembly.js)

### Product-language changes

- Updated the product sentence and evidence framing in [product-language.js](/Users/denizsengun/Projects/AR/src/lib/product-language.js)
- Updated public copy in [public-site.js](/Users/denizsengun/Projects/AR/src/lib/public-site.js)
- Updated the self-assembly page language in [SelfAssemblyPage.jsx](/Users/denizsengun/Projects/AR/src/components/SelfAssemblyPage.jsx)

### Styling

- Added the new lane UI styling in [globals.css](/Users/denizsengun/Projects/AR/src/app/globals.css)

### Planning artifact

- Updated the planning doc terminology in [box-history-lane-product-doc-v0.1.md](/Users/denizsengun/Projects/AR/First%20Seed/box-history-lane-product-doc-v0.1.md)

## What the lane currently does

The current lane view model builds entries from:

- declared root
- real source documents
- derived / history-witness documents
- state-advance events
- current seed
- recent receipts

Each entry currently carries lightweight versions of:

- `kind`
- `title`
- `occurredAt`
- `orderKind`
- `stageStatus`
- `proofStatus`
- `evidenceBasis`
- `trustSummary`
- `linkedReceiptId`
- `isLeadingEdge`

The UI then renders:

- a masthead with the new product sentence
- pinned summary cards for root / live edge / proof closure
- a list of lane entries framed as a chain of evidence

## What I think is good about this slice

- It moves the product closer to the real theory instead of just re-labeling existing tabs.
- It avoids introducing a second retrospective-only architecture.
- It makes history exports part of the main product direction instead of a demo-only trick.
- It gives the box a more legible “how did we get here?” surface.
- It creates a better conceptual bridge between the main workspace and the public self-assembly page.

## What I think is still rough or incomplete

This is a meaningful first slice, but it is not the finished idea.

### 1. The lane is still somewhat summary-shaped

Even though the default surface is now the lane, it is still more “overview + entries” than truly load-bearing box workflow.

It may still feel too much like a redesigned Box Home rather than a fully convincing assembly-native workspace.

### 2. Event coverage is still partial

The lane is derived from existing data, but current event writing is not yet rich enough to reconstruct the full story cleanly.

For example, there is not yet a complete explicit event vocabulary for:

- source added
- source derived
- seed updated
- assembly created
- receipt drafted

Some of that still has to be inferred from document state rather than read directly from an intentional lane record.

### 3. The stage/proof grammar is early

The current `selected / staged / advanced / sealed` and `open / witness / supported / sealed` statuses are useful, but they are still product-design proposals disguised as implementation.

They likely need stronger critique.

### 4. Think is not fully re-integrated yet

This slice demotes Think from the top-level language of the box, which is probably directionally right.

But there is still a real product question:

- is Think just source-reading and Seven-context now?
- or should there be a more explicit “thinking from a selected lane position” interaction model?

### 5. The lane does not yet fully prove causality

It is better at showing sequence and closure than at proving that source X became move Y.

That stronger causality layer will likely need:

- better block lineage
- stronger event writing
- richer source-to-seed traceability

## What feedback would be most useful

If you are reviewing this, the most valuable feedback is not “does the code work?” only.

The more important question is whether this is the right product move.

Please focus feedback on:

### Product / concept

- Does `Assembly lane` feel like the right primary concept?
- Does the lane feel meaningfully different from a normal workspace timeline?
- Does the “chain of evidence” framing actually come through, or is it still too rhetorical?
- Does the current implementation preserve the idea that the box can prove how it got here?

### Information architecture

- Is it correct to make the lane the default surface?
- Are Think / Seed / Operate / Receipts now positioned correctly relative to the lane?
- Does the pinned root / live edge / proof closure structure feel right?

### Data / modeling

- Is deriving the lane from current data the right approach, or is this too inference-heavy?
- Is the current lane entry shape sensible?
- Are history witnesses correctly treated as corroborating, optional sources?

### UX

- Does the lane actually help a user orient?
- Does it feel alive enough for forward work, or too archival?
- Does it need denser move-grouping, filtering, or clearer action affordances?

### Risks

- What is misleading here?
- What part of the current implementation feels too provisional to harden?
- What part is directionally right but architecturally incomplete?

## Suggested review flow

1. Read this brief.
2. Read the product sentence and lane framing in [product-language.js](/Users/denizsengun/Projects/AR/src/lib/product-language.js).
3. Inspect the lane component in [AssemblyLane.jsx](/Users/denizsengun/Projects/AR/src/components/AssemblyLane.jsx).
4. Inspect the lane derivation in [box-view-models.js](/Users/denizsengun/Projects/AR/src/lib/box-view-models.js).
5. Inspect the workspace integration in [WorkspaceShell.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceShell.jsx).
6. Compare the self-assembly alignment in [SelfAssemblyPage.jsx](/Users/denizsengun/Projects/AR/src/components/SelfAssemblyPage.jsx) and [self-assembly.js](/Users/denizsengun/Projects/AR/src/lib/self-assembly.js).
7. Then respond with:
   - what feels right
   - what feels wrong
   - what is missing
   - what should happen next

## My own short read

I think this is the correct direction and only a partial execution of it.

The best part is the architectural choice:

- one lane
- one box
- one truth model

The weakest part is that the first rendering still behaves a little too much like a summary dashboard.

So my current view is:

**The direction is right. The model is promising. The surface still needs another pass before it fully feels like the box’s own receipt of assembly.**
