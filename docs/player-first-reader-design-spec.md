# Assembled Reality Player-First Reader Design Spec

Last updated: 2026-04-01

## Purpose

This document is the design brief for the next UI phase of Assembled Reality.

It translates three things into one working direction:

- the product vision in [Assembled_to_Reality_PRD_v0.3.md](/Users/denizsengun/Downloads/Assembled_to_Reality_PRD_v0.3.md)
- the current single-document reader already implemented in this repo
- the new UX direction: treat one book like an album, sections like tracks, and listening like a first-class player experience

This is intentionally a single-document design brief. It does not try to solve the full library, sharing, or proposal system yet.

## Working Frame

The product should start feeling less like:

- a reader with side panels
- an assistant bolted onto a manuscript
- a utility UI for chat and audio

And more like:

- a focused reading and listening instrument
- an album-like player for one living text
- a guided interpretation workspace where Seven supports the reading rather than replacing it

## Core Metaphor

- Book = album
- Section / chapter = track
- Paragraph = lyric line or active text block
- Seven = guide layered into the player
- Evidence = reviewed selections from the album
- Receipt = human-authored liner-note-like interpretation artifact grounded in reviewed passages

This is a metaphor for UI structure and emotional clarity, not a literal attempt to mimic Spotify or Apple Music.

## Product Goal For This Phase

Make the current manuscript experience feel complete and distinctive before expanding outward into:

- multi-document library
- uploads and ingestion
- document creation
- sharing and collaboration
- proposals and governed evolution

## What Success Looks Like

A reader should be able to say:

- "This feels like a real player, not just text-to-speech controls."
- "I always know what section is playing."
- "Listening and reading feel fused."
- "Seven feels built into the experience, not off to the side."
- "Evidence and receipts feel intentional, not like generic save/export actions."

## Design Principles

### 1. Player first

Listening is not a secondary utility. It should feel like one of the main ways to inhabit the text.

### 2. Text remains the source of truth

The design may borrow the emotional grammar of a music player, but the manuscript remains primary. The interface must still feel literary, calm, and trustworthy.

### 3. Borrow grammar, not gimmicks

Use the clarity of album art, track lists, now-playing states, and lyric focus. Do not turn the app into a generic entertainment clone.

### 4. Seven supports, not dominates

Seven is the guide inside the listening and reading flow. It should not visually overpower the manuscript or evidence workflow.

### 5. Evidence is deliberate

Evidence enters only through explicit review and acceptance. The interface should reinforce that this is a curated set, not a passive AI dump.

### 6. Mobile leads the experience

The strongest version of this concept is mobile-first. Desktop should adapt from the mobile player model rather than the other way around.

## Phase Scope

### In scope

- redesign the listening surface around a stronger player model
- reframe Seven into `Player`, `Guide`, and `Evidence`
- create a more album-like mobile experience
- improve desktop companion hierarchy to mirror the new player-first model
- introduce a clearer section-as-track mental model
- move toward a lyrics-mode relationship between text and audio
- visually unify player, guide, evidence, and receipt creation

### Out of scope

- multi-document library UI
- uploads and ingestion UI
- create-new-document UI
- shared annotations
- collaboration and invites
- proposals, branches, diffs, and editions
- full artwork or cover-generation system

## Current Product Baseline

The current app already has the right foundations for this phase:

- a single canonical document with a stable `documentKey`
- section-aware reading navigation
- section playback
- previous / next section transport
- embedded Seven chat
- explicit citation acceptance into evidence
- evidence review inside Seven
- receipt creation from reviewed evidence
- per-document conversation persistence
- per-document evidence-set persistence

Primary implementation files today:

- `src/components/ReaderShell.jsx`
- `src/components/SevenPanel.jsx`
- `src/components/ReaderMarksPanel.jsx`
- `src/components/MarkdownRenderer.jsx`
- `src/components/SelectionMenu.jsx`
- `src/app/globals.css`

## The New Experience Model

The product surface for this phase should be understood as:

- Reader = the manuscript surface
- Player = the active listening and navigation surface
- Guide = Seven chat and passage guidance
- Evidence = reviewed material for interpretation
- Notebook = saved personal marks, secondary to Evidence for interpretation work

The core change is not just visual. It is structural:

- Player becomes the emotional center
- Guide becomes a companion mode
- Evidence becomes a curated review mode
- Notebook becomes a support surface rather than the place where interpretation is formed

## Information Architecture For This Phase

### Primary modes

- `Player`
- `Guide`
- `Evidence`

### Secondary surfaces

- `Notebook`
- `Account`

### State hierarchy

- `Reader` stays open as the manuscript source
- `Player` controls what is actively being heard
- `Guide` references the active scope
- `Evidence` accumulates reviewed source material
- `Receipt` is composed from locked evidence

### Mode exits

The phase should define not just how a user enters a mode, but how they leave it.

- `Reader` -> `Player`: open Seven or tap the mini-player
- `Player` -> `Reader`: close the player sheet on mobile or collapse Seven on desktop
- `Player` -> `Guide`: tap `Guide` in the mode switcher
- `Guide` -> `Player`: tap `Player` in the mode switcher
- `Guide` -> `Evidence`: tap `Evidence` in the mode switcher or move there after accepting citations
- `Evidence` -> `Player`: tap `Player` in the mode switcher
- `Evidence` -> `Receipt`: tap `Create Receipt`
- `Receipt` -> `Evidence`: close the receipt composer and return to the evidence set
- `Notebook` -> `Reader`: close the notebook panel

## Mobile Screen Architecture

Mobile should be the lead design target.

### 1. Collapsed state

When Seven is not fully open, show a persistent mini-player.

This is a closed decision for this phase:

- the mini-player lives bottom-center
- it behaves like a persistent now-playing dock
- it should be visually central and unmissable
- it should not read like top-chrome navigation or a small companion badge

The mini-player shows:

- current section title
- section number / total
- play / pause
- subtle progress hint
- tap target to expand into full player

### 2. Expanded state

Expanded Seven becomes a full-height player sheet.

Top area:

- close handle or close action
- small book identity
- current section title
- section number / total

Middle area:

- active text preview or lyric-like text focus
- optional citations or guide handoff depending on mode

Bottom area:

- progress bar
- previous / play-pause / next controls
- mode switcher: `Player`, `Guide`, `Evidence`

### 3. Player mode

This is the default mobile mode.

On desktop, the player remains persistently visible at the top of the companion, while the lower work area defaults to `Guide`.

Primary content:

- book identity
- current section identity
- active reading / listening text
- strong transport controls
- section progress
- section list entry point

### 4. Guide mode

This is Seven chat inside the player world.

Primary content:

- transcript
- question composer
- citations that can be accepted into evidence

Visual rule:

- Guide should feel lighter and more secondary than Player

### 5. Evidence mode

This is the reviewed material set.

Primary content:

- evidence list
- provenance labels
- add current section action
- receipt creation entry point

Visual rule:

- Evidence should feel curated, not cluttered

## Desktop Screen Architecture

Desktop should preserve the centered manuscript while adopting the player model.

### Reader column

- the book remains central
- active section remains obvious
- text continues to be readable without the companion open

### Right companion

The companion should feel less like a utility side panel and more like a listening console.

Top:

- now-playing identity
- progress
- transport
- section context

Below:

- segmented modes: `Guide` and `Evidence`

Optional lower area:

- track list for section navigation

For Phase 1, this should be implemented as an expandable section list beneath the now-playing area rather than an always-open third panel.

### Desktop goal

The reader should feel like:

- manuscript in the center
- album/player console on the right

Not:

- manuscript plus a generic drawer

## Visual Language

### Overall look

- darker, warmer, more atmospheric
- charcoal and deep brown base
- warm amber or copper light
- manuscript-led texture, not flat black
- subtle glow and blur, not loud neon

### Background treatment

Use a stage-like backdrop:

- soft radial gradients
- blurred ambient shapes
- optional textural layer drawn from the manuscript or book identity

### Typography

- strong hierarchy for book vs section
- section title should feel like the now-playing track title
- book title should read like album metadata
- body copy should remain literary and legible

### Motion

- restrained transitions
- soft mode changes
- smooth player expansion / collapse
- subtle active-track and active-paragraph transitions

Avoid:

- bouncy consumer-app motion
- flashy equalizer-style effects

## Player Model

### Book identity

The book needs a stronger visual identity in the player.

For this phase, that can be lightweight:

- title
- subtitle or author-like secondary line
- simple generated or typographic cover treatment

Decision for Phase 1:

- use a typographic identity card rather than a generated artwork system

Do not block this phase on a full artwork system.

### Section identity

Each section should behave like a track:

- title
- order in sequence
- progress within section
- ability to jump to previous / next

### Section list

The table of contents should begin to feel like a track list:

- numbered sequence
- clear active track
- tap to jump and optionally start playback

## Text / Lyrics Mode

The reading surface should move toward lyric-style focus while audio is active.

### Desired behavior

- the current paragraph or text block arrives into focus
- nearby text grows quieter rather than simply darker
- progress is felt through the section, not just through a generic transport bar
- auto-follow is available while preserving manual scroll freedom

### First implementation target

Do not attempt word-level sync yet.

Start with:

- active block arrival through subtle emphasis, warmth, and presence
- surrounding block quieting through restrained de-emphasis
- smoother section transitions while listening

### Design rule

Do not frame this as a question of "how aggressive should dimming be?"

The real question is what the active block does when it becomes the live block. In this phase, the answer is:

- the active block arrives
- the surrounding text quiets
- the manuscript remains readable

## Guide Model

Guide is Seven in conversational mode.

### Guide responsibilities

- answer questions about the active section
- surface cited passages
- help navigate to relevant sections
- optionally frame adjacent passages

### Guide visual language

- transcript should feel integrated into the player
- citations should feel like surfaced passages, not generic utility cards
- message audio stays secondary

### Guide register

Seven's voice inside this mode should shift from general chat toward an in-player guide.

That means:

- shorter responses by default
- passage-first phrasing
- citation-forward answers
- less conversational sprawl
- a quieter, more integrated tone

Guide should feel like a guide standing beside the text, not a separate assistant trying to become the main event.

### Guide rule

Guide must never visually compete with Player for primacy.

## Evidence Model

Evidence is the reviewed set for interpretation.

### Evidence inputs

- reader-selected passages
- reader notes
- highlights accepted into evidence
- Seven-suggested citations explicitly accepted by the reader

### Evidence presentation

Evidence items should show:

- section reference
- excerpt
- origin
- source type
- note text when applicable

### Evidence feeling

This should feel more like a curated sequence or setlist than a storage bin.

## Receipt Model In This Phase

Receipt creation should feel like composing interpretation from reviewed material.

### Receipt rules

- receipt creation opens only from `Evidence`
- evidence must already be reviewed
- evidence locks when the composer opens
- locked evidence is shown visibly inside the composer, not hidden in metadata
- evidence cannot be added or removed while the composer is open
- to change the evidence set, the reader closes the composer and returns to `Evidence`
- interpretation remains human-authored
- Seven can support the path to evidence, but not replace interpretation

### Receipt tone

The receipt composer should feel closer to a deliberate writing surface than an admin form.

### Receipt interaction model

Opening the composer should feel like crossing a threshold from collection into interpretation.

That means:

- the composer opens from the evidence set, not from chat or notebook
- the locked evidence set remains visible throughout writing
- the evidence lock is explicit and legible
- the reader understands they are now writing from a reviewed set, not still browsing for source material

## Notebook Role

Notebook remains useful, but it becomes secondary.

Its job in this phase:

- hold bookmarks
- hold highlights
- hold notes
- offer quick add-to-evidence actions

Its job is not:

- to be the primary interpretation workspace

## Reference Mood

The reference images provided by the user point toward:

- full-screen dark player surfaces
- strong now-playing hierarchy
- warm ambient lighting
- soft blur behind text
- a lyric-like relationship between audio and text
- bottom-anchored transport controls that feel central

What to borrow:

- emotional clarity
- spatial hierarchy
- track-oriented sequencing
- playback-first mental model

What not to borrow blindly:

- heavy consumer-music chrome
- social or reaction mechanics that do not serve reading
- excessive visual noise

## Implementation Phases

### Phase 1: Player shell redesign

Goal:

- make Seven feel like a real player

Changes:

- rename mobile mental model around `Player`, `Guide`, `Evidence`
- redesign top identity area
- enlarge transport controls
- strengthen progress display
- improve section identity and ordering

Primary files:

- `src/components/SevenPanel.jsx`
- `src/app/globals.css`

### Phase 2: Track list and mini-player

Goal:

- make the section structure feel musical and persistent

Changes:

- add mini-player when Seven is collapsed
- add track-list-like section navigation
- improve active section state across mobile and desktop

Primary files:

- `src/components/ReaderShell.jsx`
- `src/components/SevenPanel.jsx`
- `src/app/globals.css`

### Phase 3: Lyrics mode

Goal:

- fuse listening and reading more deeply

Changes:

- active paragraph or block arrival during playback
- surrounding text quieting without losing readability
- better auto-follow behavior

Primary files:

- `src/components/ReaderShell.jsx`
- `src/components/MarkdownRenderer.jsx`
- `src/app/globals.css`

### Phase 4: Guide and Evidence visual integration

Goal:

- make chat and evidence belong to the same world as the player

Changes:

- restyle citations
- restyle evidence items
- restyle receipt composer
- strengthen provenance cues

Primary files:

- `src/components/SevenPanel.jsx`
- `src/app/globals.css`

## Technical Constraints And Notes

### Keep the architecture generic

Even though this is a single-document design phase, the code should continue to think in terms of:

- `Document`
- `Passage`
- `Conversation`
- `Evidence Set`
- `Receipt`

Do not hard-code UI assumptions that would block later library support.

### Avoid backend expansion unless needed

Most of this phase is a client and styling phase.

Backend changes should only happen if needed for:

- richer playback state
- active block tracking
- better section progress behavior

### Keep current trust boundaries

Do not loosen the evidence model just to simplify the UI.

Specifically:

- assistant replies are not evidence
- citations require explicit acceptance
- receipt interpretation remains human-authored

## Acceptance Criteria

The phase is successful when:

- mobile Seven opens into a convincing full-screen player experience
- the current section clearly feels like a now-playing track
- the section list clearly feels like a track list
- desktop companion hierarchy feels player-first rather than drawer-first
- reading while listening feels more alive and focused
- Guide and Evidence feel integrated rather than bolted on
- receipts still preserve the evidence-first interpretation workflow

## Closed Decisions For Build Start

The following questions are considered closed for the beginning of Phase 1:

- the mini-player lives bottom-center as a persistent now-playing dock
- `Player` is the default open mode on mobile
- on desktop, the player stays visibly present and the lower work area defaults to `Guide`
- the desktop track list is expandable beneath the now-playing area rather than permanently open
- the mobile expanded player owns the screen; the manuscript does not remain visibly open behind it outside transition context
- book identity in Phase 1 uses a typographic identity card, not generated cover art
- the lyric-mode brief is "active block arrives, surrounding text quiets"
- the receipt composer opens only from `Evidence` and locks its evidence set for the duration of composition
- Seven in `Guide` mode uses a quieter, shorter, more passage-first register than a generic chat assistant

## Remaining Open Questions

These can be resolved in design exploration without changing the core product direction:

- how much blur, glow, and texture the player can carry before it starts feeling theatrical instead of calm
- how prominent the mini-player's progress hint should be in the collapsed state

## Recommended Next Build Pass

The next implementation pass should focus on UI only.

### Build order

1. redesign `SevenPanel` into a stronger player shell
2. add section track list
3. add mobile mini-player
4. add first-pass lyrics mode in the reader
5. restyle Guide and Evidence into the same visual system

### Explicitly do not add yet

- library browsing
- uploads
- collaboration
- proposal workflows
- overbuilt cover-art systems

## Summary

The next version of Assembled Reality should feel like a player for one living text.

That means:

- the manuscript is the album
- sections are tracks
- listening is central
- Seven is the guide
- evidence is reviewed and curated
- receipts are human interpretation artifacts grounded in what was actually reviewed

If we get this phase right, it becomes the right foundation for the broader PRD later:

- library
- corpus-wide Seven
- sharing
- proposals
- editions
