# AR Version 2

**Status:** Final V2 direction document  
**Date:** April 2026

**Companion roadmap:** `docs/AR Version 2 Build Plan.md`

## One-Line Thesis

AR Version 2 is an IDE for turning scattered inputs into real-world action, with receipts as version control and GetReceipts as the remote proof layer.

## What This Product Actually Is

Assembled Reality is not a document editor.

It is a workbench for assembling real-world outcomes from scattered material.

Cursor helps a person assemble working software from files, context, suggestions, and edits.

AR helps a person assemble working plans, briefs, decisions, and actions from PDFs, notes, research, voice memos, transcripts, and AI operations.

GitHub tracks what happened to code.

GetReceipts tracks what happened in reality:

- what you intended
- what you tried
- what was produced
- what actually happened
- what the gap was

That is the product.

Documents are the medium, not the finish line.

## Primary Product Hierarchy

Version 2 should stop thinking in a flat library of `documents` and `assemblies`.

That model is too shallow.

The better hierarchy is:

### 1. Project

The project is the real top-level object.

A project is the container for a real thing the user is trying to make happen in life:

- a trip
- a proposal
- a meeting
- a research synthesis
- a project brief
- a decision process

In software terms, the project is the repo.

### 2. Sources

Sources are the raw inputs inside the project.

These can be:

- uploaded files
- notes
- transcripts
- imported markdown
- AI-produced support material

In software terms, these are the source files and dependencies.

### 3. Assembly

The assembly is the current built artifact inside the project.

This is the thing being shaped from the sources:

- the plan
- the brief
- the synthesis
- the checklist
- the argument

In software terms, this is the app or build output.

There may eventually be multiple assemblies or versions, but the product should think in terms of:

`open project → work on the current assembly`

not:

`open random document`

### 4. Receipts

Receipts are the version history of how the assembly was made and what happened after.

In software terms, receipts are closer to commits, PRs, deploy history, and postmortems combined.

### 5. Reflection

Reflection is the Learn layer.

It captures what happened in the real world after the assembly was used, and it closes the loop between intention and outcome.

## What This Changes

This changes the product model in an important way:

- the user should eventually open a project, not a file
- sources are inputs to the project
- the assembly is the current output of the project
- receipts are the project history
- reflection is the project's contact with reality

That is much stronger than a flat split between “documents” and “assemblies.”

## The Core Loop

The loop is:

1. Plan
2. Live
3. Learn
4. Repeat

More concretely:

1. Gather source material.
2. Turn it into blocks.
3. Listen, inspect, and select.
4. Assemble a plan, brief, argument, or artifact.
5. Take it into the world.
6. Return with what happened.
7. Capture the difference between plan and outcome.
8. Preserve the receipt.

Version 1 got us mostly through the `Plan` phase.

Version 2 should make the full loop real.

## Step Zero

Step zero of Version 2 is a review and simplification of the current version with the future in mind.

We should not start by adding more power.

We should start by asking:

`what needs to become calmer, clearer, and more trustworthy so the next stage has the right bones?`

### Step Zero goals

1. Make the startup flow obvious.
2. Make listening feel native, not bolted on.
3. Make editing, saving, selecting, and assembling feel trustworthy.
4. Make receipts feel like proof, not debug output.
5. Make the product easier to understand on the first session.
6. Preserve the backend and data model hooks needed for the larger vision.

### Step Zero means

- fewer simultaneous surfaces
- clearer language
- better defaults
- less chrome
- more trust in the core loop

It does not mean reducing ambition.

It means earning the right to expand.

## What Version 1 Proved

Version 1 already proved that the product is real.

We now have:

- authentication
- upload and normalization
- block-based source material
- listening
- editing
- assembly creation
- AI operations
- receipts
- GetReceipts integration

That is not a mockup. That is a foundation.

## What Version 1 Got Right

### 1. The block model is correct

The decision to reduce documents into blocks is the right abstraction.

Blocks let us:

- compose across sources
- preserve lineage
- distinguish human vs AI material
- track operations over time

Blocks are the atoms of assembly.

They will also remain the atoms of the project model.

### 2. The clipboard is the invention

Editors are common.
AI sidebars are common.
A concrete staging area for fragments from multiple sources is not.

The clipboard is not a convenience feature. It is the assembly mechanic.

### 3. Receipts are the most original layer

The receipt system turns work into witnessed history.

Instead of only preserving the output, AR preserves:

- what was read
- what was selected
- what AI proposed
- what was edited
- what was assembled
- what was decided

That makes receipts the GitHub of real-life work.

### 4. Listening is load-bearing

Playback is not decoration.

The current-block highlight, the next-block state, and the audio-driven reading flow are what make AR feel like more than a markdown editor.

If listening feels weak, the whole product shifts in the wrong direction.

### 5. AI is most useful as collaborator, not replacement

The strongest AI pattern so far has been:

- inspect the current state
- propose bounded changes
- return explicit blocks
- keep the user in control
- preserve the trail

That is much closer to the future product than a generic chat transcript.

### 6. The visual language is coherent

The calm editorial-terminal aesthetic works.

The semantic color system is useful:

- green for accepted and ready
- amber for AI-generated or pending
- cyan for active human intervention
- dim system text for low-priority state

That should continue.

## What Version 1 Still Gets Wrong

### 1. The top-level model is too flat

Right now the experience still treats `documents` and `assemblies` like siblings.

They are not siblings.

One is component material.
The other is the thing being built from that material.

The missing top-level object is the project.

That means the current experience still leans toward:

- open a document
- switch between documents
- open an assembly

when it should increasingly feel like:

- open a project
- inspect source material
- work on the current assembly
- review receipts and outcomes

This is one of the most important conceptual upgrades for Version 2.

### 2. The intro explains the tool more than the outcome

The current intro teaches mechanics well enough, but it still explains the product more than it demonstrates the payoff.

The user needs to feel:

`I can turn messy material into something I can take into the world.`

That should become more concrete over time.

### 3. The workspace still assumes too much fluency

The current workspace is much better than before, but it still leans toward the tenth session more than the first.

Version 2 should keep pushing toward:

- fewer mysteries
- clearer first actions
- better progressive disclosure

### 4. “Live” and “Learn” are still underbuilt

This is the biggest gap.

Right now, AR is strongest when helping someone make the thing.

It is still weaker at helping them:

- take the thing into the real world
- return with what happened
- preserve the gap between plan and outcome

That must change in Version 2.

### 5. Assembly is still closer to concatenation than composition

The current assembly flow creates a real new document, which is good.

But in many cases it is still:

`selected blocks in order`

rather than:

`a shaped composition with connective tissue and argument structure`

Version 2 should address that.

### 6. Some important product basics are still missing

These remain incomplete or undefined:

- delete
- share
- session history
- stronger startup guidance
- better compare/synthesis surfaces

## What The Team Notes Added

Three external inputs remain important:

- the concept document
- the Cursor inspiration notes
- the review and proposal

### From the concept document

Keep:

- canonical markdown
- blocks as the atomic unit
- AI proposes, human composes
- every session should produce both a document and a receipt

### From the Cursor inspiration notes

Keep:

- calm startup screen
- clean separation of entry, work, history, and system state
- one-field command model over time
- session history
- standard tab behavior
- dim system status instead of loud telemetry

The lesson is not “copy Cursor.”

The lesson is:

`good tools make the room legible.`

### From the second review

The strongest additions were:

- AR is a workbench for assembling real-world outcomes, not a document editor
- the Learn phase is currently underrepresented
- the intro should eventually guide a first meaningful outcome, not just explain features
- the future AI experience should feel like an active working relationship with the current artifact

Those are all correct.

### Additional correction from product discussion

The product should not keep treating source material and assemblies as the same kind of noun.

The correct hierarchy is:

- project
- sources
- assembly
- receipts
- reflection

That hierarchy should guide the next version of the IA, naming, and data model.

## The Future AI Experience

What we are doing in this collaboration is a clue.

The best future AI experience in AR should not feel like “open a chat and ask a question.”

It should feel like:

- review the current state
- simplify what exists
- propose the next step
- make a bounded change
- explain what changed
- preserve the trail
- continue with context

That means the AI layer should increasingly feel like:

`pair-building inside the project`

not:

`chatting beside the artifact`

### Desired AI verbs in Version 2

The user should be able to say:

- review this and simplify it
- compare this plan with what actually happened
- pull the strongest evidence for this claim
- turn this into a one-page brief
- stitch these blocks into a clearer flow
- show me what changed between the original and the current version
- help me decide what to keep, remove, or rewrite

The system should respond with:

- proposed edits
- staged blocks
- explicit rationale
- visible diffs where useful
- receipt entries

## Version 2 Product Principles

### 1. Simplify before expanding

Every new capability should come after the current surface becomes easier to trust.

### 2. Keep the document central

The assembly remains the primary work surface inside the project.
Supporting systems should help it, not replace it.

### 3. Preserve lineage from day one

Origin, position, author, and operation should continue to travel with every block.

### 4. Show the chain, not just the result

The making matters as much as the output.

### 5. Build for return

The user must be able to come back after the meeting, decision, trip, or milestone and continue the loop naturally.

### 6. Treat premium voice as compute, not as an unlimited entitlement

High-quality voice is expensive infrastructure.

The product model has to respect that reality.

## Voice Economics

Version 2 needs a real voice-credit system.

If a user pays a base monthly price, premium ElevenLabs-style voice cannot be unlimited.

### Product requirement

The premium voice should run on a quota.

That quota should be visible, predictable, and easy to understand.

### Recommended model

- The base subscription includes a fixed monthly amount of premium listening credits.
- Premium voice playback spends those credits.
- When premium credits run out, the product falls back automatically to a lower-cost voice path:
  - OpenAI voice first
  - device voice if needed
- Users can keep listening after premium credits are exhausted, but the premium voice is no longer available unless they buy more credits or upgrade.

### Why this matters

This keeps:

- pricing sane
- voice usage sustainable
- premium voice desirable
- the core listening loop intact even after credits are exhausted

### UX requirements for voice credits

The system should show:

- remaining premium voice credits
- the active voice provider
- when playback is using premium vs fallback voice
- what happens when credits run out

It should never surprise the user.

### Good default behavior

- user starts on the premium voice if credits are available
- playback downgrades gracefully when needed
- the downgrade is explained in plain language
- the user can still complete the session

This is a product requirement, not a later business afterthought.

## Version 2 Priorities

### Phase 0: Review and simplification

- tighten startup and launchpad
- define the project model clearly
- tighten save/edit confidence
- tighten the listening flow
- define delete
- define share
- keep the workspace calm
- make first-use behavior clearer

### Phase 1: Make the IDE model more real

- move from flat library thinking toward project-first thinking
- stronger tab model
- more legible recent/session history
- better command input with `@` and `/`
- optional outline
- optional raw view for power users
- better compare behavior across sources

### Phase 2: Build the Learn surface

- structured post-action reflection
- planned vs actual comparison
- outcome capture
- follow-up assemblies
- receipts that make the gap between intention and outcome visible

This is the phase that most fully turns AR into a real-life operating system.

### Phase 3: Strengthen composition

- AI stitching between blocks
- stronger composition support beyond concatenation
- more intentional templates for real-world use cases
- reusable patterns for planning, acting, and learning

### Phase 4: Strengthen the remote proof layer

- better receipt publishing
- clearer local draft vs remote proof distinction
- export and sharing that feel native and simple
- tighter GetReceipts integration

## Step Zero Checklist

Before we expand further, the current product should be reviewed against this checklist.

### Entry

- Is the landing flow calm and understandable?
- Is the startup launchpad clean enough?
- Is the intro helping people understand the outcome, not just the mechanism?
- Is the user being oriented toward a project, not just a document?

### Workspace

- Is the player always visible when it should be?
- Is editing obviously saved?
- Is the clipboard discoverable and trustworthy?
- Is AI reachable from where the user is already working?

### Listening

- Does pressing play feel alive?
- Is block sync tight?
- Is premium vs fallback voice understandable?
- Is the quota model visible and fair?

### Receipts

- Does the log feel like proof?
- Is receipt drafting understandable?
- Is the “how this was made” story visible enough?

### Future-readiness

- Are we preserving enough lineage?
- Are we keeping enough session state for later reflection?
- Are we avoiding UI clutter that will make the next stage harder?
- Are we structuring the product around projects, sources, assemblies, receipts, and reflection?

## Open Questions

1. What is the smallest possible “return with what happened” flow?
2. What is the right first real-world template to prove the loop?
3. When does a local workspace event become a real receipt?
4. What is the right unit of sharing: document, receipt, or both?
5. How explicit should the project model become in the UI in Version 2?
6. Should composition support focus first on AI stitching, compare view, or guided first assembly?

## Final Summary

Version 1 proved that the architecture is real and the product surface is viable.

Version 2 should begin with simplification, then extend AR from document assembly into execution, reflection, and versioned proof in the real world.

It should also move the product from a flat document library toward a project-based model:

- sources feed the project
- the assembly is the current build
- receipts preserve the history
- reflection closes the loop with reality

The destination is not “a smarter document tool.”

The destination is:

`a system for building things from text, acting on them in life, learning from the outcome, and keeping proof of what actually happened.`
