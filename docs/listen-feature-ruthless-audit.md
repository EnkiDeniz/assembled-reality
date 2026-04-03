# Listen Feature Definition and Ruthless Audit

Last updated: 2026-04-02

## Why this document exists

This document does three jobs:

1. Define what the "listen" feature actually is today from the user's point of view.
2. Trace how it is implemented across the current codebase.
3. Tear the current experience apart so we can make it materially better.

This is intentionally blunt. The goal is not to defend the current implementation. The goal is to understand it well enough to replace weak assumptions with a stronger product.

## What the listen feature is supposed to be

At the product level, listen is not supposed to be "text to speech controls."

It is supposed to be one of the primary ways to inhabit a document:

- open a document
- move between reading and listening without losing place
- hear the current section or continue through the whole document
- ask Seven about what is being read
- save highlights, notes, and evidence without leaving the flow
- preserve continuity across sessions and contexts

The surrounding product thesis matters here. Assembled Reality is not trying to be a utility reader. It is trying to fuse library, reading, listening, guidance, and interpretation into one instrument.

Relevant source docs:

- `README.md`
- `docs/Assembled_to_Reality_PRD_v0.4.md`
- `docs/player-first-reader-design-spec.md`
- `docs/ux-upgrade-plan.md`

## Current user-facing definition

From the user's perspective, the current listen feature begins after unlock, auth, and document selection:

1. Enter the app through `/`.
2. Authenticate and land in `/library`.
3. Open a document from the library.
4. In the reader, tap `Listen`, press `l`, or open Seven and tap `Listen`.
5. Use the player tray to play the current section, continue through the book, move to the previous or next section, change speed, or play Seven's replies aloud.

Today, "listen" is actually three different experiences hiding behind one label:

### 1. Section narration

The primary play button defaults to the current section.

What the user believes:

- "Read this section to me."

What the implementation does:

- builds one narration string for the whole current section
- strips markdown
- prepends the section heading
- sends chunked text to `/api/seven/audio`

### 2. Continue through book

The secondary button continues forward through the document from the current block.

What the user believes:

- "Keep going from where I am."

What the implementation does:

- builds a queue of registered text blocks
- starts at the current or nearest readable block
- synthesizes and plays each block in sequence
- updates the player cursor block by block

### 3. Seven reply playback

Inside Seven, each assistant reply can be played aloud.

What the user believes:

- "Read Seven's answer to me."

What the implementation does:

- pauses any document or section playback
- plays the assistant message as a separate audio source
- leaves document playback paused when message playback ends

## Current surfaces and entry points

### Library

The new default home is `/library`, not `/read`.

What matters for listen:

- users can resume a partially read document from the library
- imported documents become listenable as soon as they are parsed into markdown
- supported imports today are `.md`, `.markdown`, `.doc`, `.docx`, and `.pdf`

This matters because the listen feature is no longer just for the canonical manuscript. It is now part of the multi-document reading loop.

### Reader shell

The reader shell is the real listen product.

Primary entry points:

- top-bar `Listen` button
- keyboard shortcut `l`
- Seven panel `Listen` shortcut
- collapsed mini-player capsule

The listen tray has three visual states:

- `closed`
- `collapsed`
- `open`

This is the correct structural direction. The tray already behaves like a persistent player more than a modal utility.

### Seven panel

Seven sits beside the player and shares state with it.

What matters:

- users can ask section-scoped questions
- users can play assistant replies aloud
- users can add citations to evidence
- users can create receipts from evidence

This is important because the current product is implicitly telling users that listening, guidance, and evidence belong together.

## Current implementation map

### Core files

- `src/components/ReaderShell.jsx`
- `src/components/ReaderListenTray.jsx`
- `src/components/SevenPanel.jsx`
- `src/components/MarkdownRenderer.jsx`
- `src/lib/seven.js`
- `src/lib/reader-player.js`
- `src/app/api/seven/audio/route.js`
- `src/app/api/seven/route.js`
- `src/lib/reader-workspace.js`
- `src/lib/reader-db.js`

### State model

The listen feature is driven mainly by `ReaderShell.jsx`.

Important state buckets:

- `playerState`
- `runtimeAudioState`
- `audioTimeState`
- `playbackSpeed`
- `playerCursor`
- `listenTrayCollapsed`
- `voiceStatus`

Important source types:

- `document`
- `section`
- `message`

This is a good foundation. The implementation already understands that listening can refer to multiple scopes.

### Playback model

There are two different playback architectures in the same feature:

#### Section mode

- uses `getNarrationText(...)`
- speaks the whole section as one narration unit
- only anchors the player cursor to the first block of the section

#### Document mode

- uses registered reader blocks from `MarkdownRenderer`
- builds a playback queue with `buildPlaybackQueue(...)`
- advances block by block
- autoscrolls the currently active block into view
- visually marks the active and next blocks

### Voice pipeline

The current voice pipeline is:

1. Reader page passes `sevenVoiceEnabled`
2. Reader page passes `sevenVoiceProvider`
3. `ReaderShell` decides whether to use provider audio or browser speech
4. `/api/seven/audio` tries provider synthesis
5. client falls back to `speechSynthesis` if provider playback fails and browser speech is available

But there is an important contradiction:

- the README says Seven voice is "ElevenLabs first, with OpenAI speech fallback"
- the current API route tries OpenAI first, then ElevenLabs
- the reader page also passes `openai` as the preferred provider whenever OpenAI is enabled

So the actual default voice path is not what the docs say it is.

### Persistence model

What persists today:

- reading progress per user per document
- bookmarks, highlights, notes per user per document
- Seven conversation thread per user per document
- evidence set per user per document
- receipt drafts per user
- reader preferences in local storage

What does not persist:

- active audio queue
- active chunk
- elapsed playback offset
- whether the user was in section mode or book mode
- whether audio was paused or playing

This means the app preserves reading continuity, but not listening continuity.

## What the user stories really are

The best way to evaluate the listen feature is to force it through real user stories.

### Story: "Read this section to me while I walk."

Current answer:

- mostly works
- play button starts section narration
- speed control exists
- provider fallback exists

Current weakness:

- section sync is not truly coupled to the visible text
- no sleep timer
- no background or lock-screen story
- no durable resume if the user gets interrupted

### Story: "Keep going from where I am."

Current answer:

- partially works through `Continue through book`

Current weakness:

- this is hidden as a secondary button instead of the main promise
- previous and next are section-based, not queue-based
- skip +/- only operate inside the current provider chunk
- there is no restart/resume model strong enough for a long listening session

### Story: "I want to read and listen at the same time."

Current answer:

- document mode gets closest
- active and next blocks are visually styled
- active block autoscroll exists

Current weakness:

- the player overlay locks body scrolling while fully open
- section mode is not truly synchronized
- the progress bar is display-only, not navigable
- there is no word-level or sentence-level timing

### Story: "Read Seven's answer aloud, then let me go back to the document."

Current answer:

- works at a basic level

Current weakness:

- message playback interrupts the main reader
- document playback does not automatically resume
- the transition between "book audio" and "assistant audio" feels mechanical rather than designed

### Story: "I was listening yesterday. Help me continue today."

Current answer:

- weak

Current weakness:

- only reading progress persists
- audio progress does not persist
- there is no recap, no "resume from 14:32", no "resume queue", no "last heard paragraph"

### Story: "Let me listen to exactly this quote or selected passage."

Current answer:

- not supported

Current weakness:

- selection menu supports highlight, note, and evidence
- selection menu does not support "listen to selection"

## Ruthless audit

The current implementation is promising, but it is not yet a best-in-class listening experience.

Below is the blunt version.

### P0: The feature is conceptually split in half

The product says "listen," but the code implements two different products:

- a section narrator
- a continuous document player

They are not just two modes. They behave differently enough that they create different mental models.

Why this is a problem:

- section mode sounds like "player mode" but is really just narrated TTS for the section
- document mode is the only mode that actually behaves like synchronized reading
- the UI does not explain the distinction
- the main play button defaults to the weaker mode

Result:

The feature's strongest architecture is hidden behind a secondary button.

### P0: "Close" does not mean stop

The tray exposes collapse and close actions.

What users will reasonably assume:

- collapse hides controls but keeps playback
- close stops playback

What the current implementation does:

- if the tray is open and audio is active, close just dismisses the overlay state and leaves the tray collapsed
- playback keeps going

That makes the `X` misleading.

### P0: The full player fights the reading experience

When any overlay is open, the reader sets `document.body.style.overflow = "hidden"`.

That means:

- open Seven -> page scroll is locked
- open Notebook -> page scroll is locked
- open Listen -> page scroll is locked

So the full-size player does not actually support "read while listening" very well. The user has to collapse the tray to get back to a fluid reading posture.

This is a direct conflict with the intended "listening and reading feel fused" promise.

### P0: The provider story is incoherent

Today the system has four different "truths" about voice:

- docs say ElevenLabs first
- reader page prefers OpenAI whenever OpenAI exists
- audio route tries OpenAI first
- tray label hides the actual provider and only says `Seven narration`

This is product debt, implementation debt, and messaging debt at the same time.

Result:

- users cannot build trust in the voice
- the team cannot reliably reason about the voice stack
- fallback behavior becomes invisible

### P1: Section sync is performative, not real

The section player highlights the first block of the section and keeps the section active, but it does not know where inside the section the voice actually is.

Result:

- visually it implies synchronization
- functionally it is not synchronized

This is dangerous because fake sync feels worse than no sync. It makes the product feel imprecise.

### P1: The progress bar looks interactive but is not

The tray shows elapsed time, remaining time, and a progress bar.

But:

- it is not scrubbable
- it cannot seek into a specific paragraph
- it cannot jump across chunk boundaries

The user sees player grammar without player power.

### P1: Skip controls are weaker than they appear

Provider skip buttons operate only on the currently loaded HTMLAudioElement.

That means:

- skip back cannot move into the previous chunk
- skip forward cannot move into the next chunk
- behavior near chunk boundaries is limited and can feel broken

In device mode:

- skip buttons disappear
- speed control still shows
- but device speech rate is hard-coded inside `SpeechSynthesisUtterance`

So speed changes in device mode are effectively not real.

### P1: Message playback is a dead-end interruption

Playing a Seven reply pauses document audio, but the app does not automatically return the user to their previous listening session.

That means the user has to manually reconstruct flow after every reply.

For a product that wants Seven to feel integrated into the player, this is too clumsy.

### P1: There is no true listening continuity

The app remembers where the user has read.

It does not remember:

- where the user last listened
- what mode they were in
- what queue they were listening through
- what speed they used for that session
- what offset they were at when interrupted

This makes the experience feel disposable.

### P1: Chunk playback will create avoidable gaps

Provider playback is sequential:

- fetch chunk
- play chunk
- when it ends, fetch next chunk

That means longer narrations are vulnerable to:

- network gaps
- dead air between chunks
- inconsistent duration estimates

Other products hide this with prefetching, pre-generation, streaming, or local buffering.

### P1: The player has no operating-system presence

There is no clear evidence of:

- Media Session metadata
- lock-screen controls
- headphone button integration
- transport integration outside the page

For something meant to serve commutes, walking, chores, and background listening, this is a major miss.

### P2: The feature is still generic at the identity layer

The current tray says:

- `Seven narration`
- `Device narration`

That is not enough.

There is no:

- provider identity
- voice identity
- voice picker
- voice memory by document or user task
- explanation of why a fallback happened

### P2: No sleep timer

This is a small feature with outsized emotional value. It signals "this product understands real listening behavior."

### P2: No track list or queue visibility

The player-first spec frames sections as tracks, but the current player does not show:

- what is coming next
- where the user is in the book queue
- how many readable blocks remain in the current section
- estimated remaining section time
- estimated remaining document time

### P2: No selection listening

The app supports highlight, note, and evidence from a selection.

It does not support:

- listen to selection
- start playback from selection
- queue selection into Seven reply or evidence workflows

This leaves an obvious capability gap in the most literal "read this exact thing to me" user story.

### P2: No comprehension recovery features

The current listen experience assumes continuous attention.

It does not help the user re-enter after interruption with:

- recap
- last-heard summary
- "audio bookmark that speaks"
- section checkpoint
- "what changed since your last stop"

This is one of the highest-leverage gaps in the entire experience.

## Where other products are ahead

The goal here is not to worship competitors. It is to identify patterns they already proved matter.

### ElevenReader

Current official signals:

- supports `Write text`, `Scan text`, `Paste a link`, and `Upload a file`
- supports EPUB, PDF, and TXT imports
- frames itself as an "audio companion" for commute, gym, work, school, and accessibility
- offers hundreds of voices
- supports highlighted words in sync with audio
- is available on mobile and web/desktop
- Chrome extension can capture complex or paywalled pages, import highlighted text, and combine multiple chapters into one continuous read

Why it matters:

- it treats ingestion as part of listening, not a separate product
- it treats voice choice as part of the experience
- it treats continuous reading across imported sources as a first-class job

What it does better than us:

- more flexible ingestion
- stronger voice identity and selection
- clearer support for continuous long-form listening
- actual synced highlighting language in the product

Sources:

- https://help.elevenlabs.io/hc/en-us/articles/26197616307985-How-do-I-add-content-to-ElevenReader
- https://elevenlabs.io/text-reader
- https://help.elevenlabs.io/hc/en-us/articles/41076873230097-How-does-the-ElevenReader-Chrome-extension-work

### Speechify

Current official signals:

- active text highlighting "perfectly synced, word for word"
- up to 4.5x speed
- cross-device sync across mobile and desktop
- screenshot or camera import for text
- AI document conversation
- notes and bookmarks
- recent version history references offline voices, talk-to-document, skip redesign, and offline mechanisms

Why it matters:

- it is built around continuity and throughput
- it supports high-speed listening credibly
- it treats "talk to the document" and "listen to the document" as the same user job

What it does better than us:

- stronger continuity story
- stronger speed story
- stronger import story
- stronger study/productivity framing
- stronger offline story

Sources:

- https://apps.apple.com/us/app/speechify-text-to-speech/id1209815023

### Matter

Current official signals:

- time-synced text for YouTube and podcast content
- advanced parsing for distraction-free reading
- advanced speech synthesis
- smooth highlighting
- seamless switching between audio and text
- offline search
- power queuing
- low-friction highlighting

Why it matters:

- it treats reading quality and listening quality as the same system
- it understands that parsing quality is a listening feature
- it understands that queue management is part of the player

What it does better than us:

- better "switch between text and audio" framing
- better queue and offline mental model
- better respect for reading flow during annotation

Sources:

- https://hq.getmatter.com/
- https://apps.apple.com/ga/app/matter-reading-app/id1501592184

### Audible + Kindle

Current official signals:

- synchronized highlighted text inside the Audible app
- explicit `Listen` vs `Read & Listen` mode switching
- existing page syncing between formats and devices
- automatic discovery of eligible ebook/audiobook pairs
- dedicated filter for matched titles

Why it matters:

- it removes the cognitive tax of changing mode
- it removes discovery friction
- it turns switching into a feature, not a recovery task

What it does better than us:

- explicit mode language
- better cross-format continuity
- better sync trust
- better library affordance for read/listen eligible material

Sources:

- https://www.audible.com/about/newsroom/audible-launches-immersion-reading-for-deeper-engagement-with-books

### Spotify audiobooks

Current official signals:

- `Page Match` scans a page and jumps to the corresponding point in the audiobook
- can also guide the user back from audio into print
- offers `Play from here` and `Save for later`
- `Recaps` give short audio summaries tailored to the user's latest listening point
- explicitly frames Recaps as reducing friction and helping users reengage without relistening

Why it matters:

- this is the best currently visible articulation of mode-switch continuity
- it recognizes re-entry as a first-class problem
- it treats interruption recovery as part of the product, not a user burden

What it does better than us:

- much better mode switching
- much better interruption recovery
- much better "where was I?" support

Sources:

- https://newsroom.spotify.com/2026-02-05/page-match-how-to/
- https://newsroom.spotify.com/2025-11-13/audiobook-recaps-beta-test/

### NaturalReader

Current official signals:

- OCR for PDFs and camera scanner
- MP3 export
- AI text filtering to strip distracting text like URLs and brackets
- word highlight and captions
- advanced pronunciation editor
- cross-device continuation
- version history shows investment in last-read fixes, speed control, text view for PDFs, recap, quizzes, chat, and Q&A

Why it matters:

- source cleanup is part of listening quality
- pronunciation control matters in serious documents
- explicit resume and PDF text-view work are core reader improvements, not edge cases

What it does better than us:

- stronger source preprocessing
- stronger accessibility detail
- stronger resume reliability signals

Sources:

- https://apps.apple.com/in/app/naturalreader-text-to-speech/id1487572960

## What we should steal

Not everything. The point is not to become a clone.

The things worth stealing are structural:

### 1. Make one primary listen promise

Recommendation:

- primary CTA should become `Continue from here`
- section play becomes a secondary mode or explicit submenu

Reason:

Our stronger implementation is the continuous block-based player, not the section narrator.

### 2. Unify text sync around a single playback graph

Recommendation:

- represent section headings, paragraphs, list items, and quoted blocks as a single ordered playable graph
- treat section narration as a queue built from that graph, not as one giant section string
- attach timestamps or timing estimates per block and per sub-block where possible

Reason:

This removes the fake sync problem and creates one model for reading, listening, scrubbing, resuming, and evidence capture.

### 3. Make the player actually navigable

Recommendation:

- scrub to a real location
- seek across chunk boundaries
- show section remaining time
- show document remaining time
- show upcoming section or upcoming block

Reason:

A progress bar that cannot navigate is decorative, not trustworthy.

### 4. Persist listening state, not just reading state

Recommendation:

- save last playback source type
- save queue anchor block id
- save chunk index
- save elapsed offset
- save playback speed
- save whether the session was paused or active

Reason:

Without this, "listen" feels stateless and disposable.

### 5. Add re-entry aids

Recommendation:

- add `Resume from 14:32`
- add `What did I miss?`
- add short section recap
- add "audio bookmark that speaks" after long pauses or next-day return

Reason:

Re-entry is where strong listening products separate themselves from generic TTS.

### 6. Treat mode switching as a core feature

Recommendation:

- explicit `Read`, `Read + Listen`, and `Guide` language
- instant handoff between text and audio position
- keep the reading viewport live while the player is expanded

Reason:

The best competitors remove friction at the boundary between modes.

### 7. Fix the voice stack and make it visible

Recommendation:

- choose and document the real provider priority
- expose provider and fallback in UI
- add voice identity
- add voice selection
- remember the user's last chosen voice

Reason:

Voice trust is part of product trust.

### 8. Support background listening properly

Recommendation:

- add Media Session support
- add lock-screen metadata and controls
- support headphone transport behavior
- keep playback stable during screen changes where possible

Reason:

Users will use this while walking, driving, cooking, cleaning, and commuting. The app should respect that reality.

### 9. Make selection listening real

Recommendation:

- add `Listen to selection`
- add `Start from here`
- add `Queue selection next`

Reason:

This is one of the clearest and most useful user jobs in a serious reading tool.

### 10. Clean the source before speaking it

Recommendation:

- add pronunciation rules
- strip citations, URLs, and junk text more aggressively when appropriate
- improve imported PDF and DOC cleanup
- allow a "listening text view" that optimizes the text for the ear

Reason:

Bad source cleanup makes good TTS sound dumb.

## The best possible experience

If this feature were excellent, a user would be able to do the following:

- Open any document and hit one obvious button: `Continue from here`.
- See exactly what is being spoken, in sync, without fake motion.
- Leave reading mode, come back tomorrow, and resume from the right audio spot.
- Play a selected quote without starting the whole section.
- Ask Seven a question, hear the answer, and flow back into the book without rebuilding state.
- Trust the progress bar enough to navigate with it.
- Trust the voice because the app clearly states what voice is active and why.
- Switch between text and audio without manually hunting for location.
- Get a recap after interruptions instead of doing recovery work alone.
- Use the product on the go with lock-screen and headphone controls like a real player.

That is the bar.

## Recommended execution order

### Phase 1: Fix the product definition

- make `Continue from here` the main listen action
- rename current controls so the two modes are explicit
- decide and document the true voice provider order
- make `Close` either actually stop playback or rename it

### Phase 2: Fix continuity

- persist playback sessions
- add resume UI
- add recap after interruption
- add message-audio return-to-book behavior

### Phase 3: Fix trust

- real provider labeling
- real fallback labeling
- real scrubbing
- real skip behavior
- real speed behavior in every supported mode

### Phase 4: Fix delight

- voice identity
- voice selection
- sleep timer
- track list
- selected-passage listen

### Phase 5: Fix depth

- pronunciation editor
- text cleaning controls
- comprehension modes for study, commute, skim, and bedtime

## Bottom line

The current listen feature is not bad. In fact, it already contains the seed of a strong player:

- persistent tray
- block registration
- queue-based document playback
- visible lyric-focus styling
- integrated Seven audio
- evidence and receipt workflows next to the player

But the experience is still compromised by conceptual split, weak continuity, hidden state, and misleading player affordances.

Right now it feels like a good TTS tray inside a promising reader.

It needs to become a real reading-and-listening instrument.
