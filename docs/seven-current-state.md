# Seven Current State

Last reviewed: 2026-03-31

## Executive Summary

Seven is currently implemented as a contextual reading guide inside the Assembled Reality reader, not yet as the full Lakin-style receipt-reading instrument described in the manuscript and appendices.

The good news:

- Chat is built.
- Voice is built.
- The Seven panel, section context, question flow, summary flow, diagnostics, and read-aloud flow all exist in code.

The main problems right now:

- Provider health still needs real-world validation with authenticated diagnostics.
- Seven is still much narrower than the product vision. It explains the current section; it does not yet read receipts, marks, or operator structure in the stronger Lakin sense.
- The mobile panel is now much more explicit, but it still needs real reader testing to validate whether the new hierarchy feels natural over longer sessions.

## Product Intent

The product framing in the manuscript is clear:

- Assembled Reality is supposed to help a person see the real decision space they are standing in before they move.
- Seven is supposed to work from receipts rather than stories.
- Lakin is supposed to surface what is actually happening, where the process is in the arc, and whether it is growing or merely replicating.

Relevant source anchors:

- `content/assembled_reality_v07_final.md`
- `docs/convergence-foundations.md`
- `docs/operator-sentences.md`

Important lines from the current written vision:

- "Assembled Reality helps people see the real decision space they are standing in before they move."
- "Lakin's 7 does not accumulate stories. It accumulates receipts."
- "The front door is a reading instrument, not a chatbot lobby."

## What Is Actually Implemented Today

### 1. Entry and reader flow

Current live structure:

- `/` is the sign-in flow for Apple and email magic links.
- `/read` loads the authored manuscript plus reader state.
- `/account` exposes identity, reading stats, connection state, and created reading receipts.

Current reader capabilities:

- server-backed bookmarks
- server-backed highlights
- server-backed notes
- reading progress persistence
- current-section navigation
- receipt draft creation from reading context

Primary implementation files:

- `README.md`
- `src/app/page.jsx`
- `src/app/read/page.jsx`
- `src/app/account/page.jsx`
- `src/lib/document.js`
- `src/lib/reader-db.js`
- `prisma/schema.prisma`

### 2. What Seven currently does

Seven today is a section-aware assistant embedded inside the reader.

Implemented capabilities:

- explain the current section in plainer language
- answer a question about the current section
- summarize the current section
- read the current section aloud
- read assistant replies aloud
- show a short "In This Section" preview
- show explicit chat and voice provider state inside the panel
- surface fallback/provider diagnostics in the account area

Primary implementation files:

- `src/components/SevenPanel.jsx`
- `src/app/api/seven/route.js`
- `src/app/api/seven/audio/route.js`
- `src/lib/seven.js`

Important implementation detail:

Seven is currently prompted only with:

- document title
- document subtitle
- intro markdown
- section outline
- current section label
- current section markdown

Seven is not currently prompted with:

- the reader's bookmarks
- the reader's highlights
- the reader's notes
- reading receipts
- any derived operator structure
- any process graph or receipt chain

So the shipped product is a manuscript explainer, not yet a receipt-derived diagnostic reader.

### 3. What the marks panel currently means

The marks panel now shows only the authenticated reader's own bookmarks, highlights, and notes.

The earlier `Mine` / `Seven` shared-marks view has been removed so the reader experience is personal by default.

## Current Local Runtime Findings

The findings below were verified against the current local app on 2026-03-31.

Important update:

- unauthenticated `POST /api/seven` and `POST /api/seven/audio` requests now return `401` as expected
- live provider health should now be re-checked through the in-app diagnostics after sign-in

### Environment status

`.env.local` currently contains:

- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

That means the local build is configured to attempt both Seven chat and Seven provider voice.

### Voice status

Observed local behavior:

- `POST /api/seven/audio` currently returns a failure JSON response instead of audio.
- Local server logs show:
  - ElevenLabs failure: `401`, detail `quota_exceeded`
  - OpenAI speech failure: `429`

What this means:

- The app is correctly attempting provider audio first.
- ElevenLabs is not healthy right now because the account/voice path is exhausted or otherwise rejected as quota exceeded.
- OpenAI speech is also unavailable right now because the current key/model path is being rate limited.
- Because both provider paths fail, the client falls back to browser speech synthesis when available.

This explains the observed symptom that "the voice always defaults to the computer audio."

Conclusion:

- This is not a missing feature.
- It is a real runtime failure plus an opaque fallback UX.

### Chat status

Observed local behavior:

- `POST /api/seven` currently returns a failure JSON response.
- Local server logs show OpenAI chat is returning `429`.

What this means:

- Chat is already implemented in both UI and API.
- Chat is not missing.
- Chat is currently failing because the current OpenAI path is rate limited.

Conclusion:

- The product gap is not "build chat from scratch."
- The immediate need is to restore provider health and make the UI clearer about what is failing.

## Confirmed UX and UI Issues

### 1. Seven is now much easier to discover on mobile

On smaller screens, the launcher now keeps an explicit `Ask Seven` label instead of collapsing to a bare `7`.

That is a meaningful improvement, but it still needs live reader feedback to confirm the button feels natural in the top bar.

### 2. The Seven panel now takes focus more cleanly

The mobile panel still uses a sheet pattern, but it now sits above the reader chrome with stronger overlay focus and a taller presentation.

This addresses the earlier overlap problem, but it still needs real testing for:

- comfort on shorter devices
- whether the new sheet height feels balanced
- whether the overlay transition feels calm enough during real reading

### 3. The chat entry is now much more primary

The panel now opens with:

- status chips
- quick actions
- starter prompts
- composer
- transcript
- section preview

That is much closer to an actual assistant flow than the earlier utility-panel ordering.

### 4. Silent fallback is no longer silent

The client now exposes provider/fallback state directly, and the account surface can test chat and voice independently.

So the product is much more honest about:

- which provider is active
- whether fallback happened
- whether device voice is acting as a last resort

## Missing Features and Partial Ships

### 1. Provider health still depends on live credentials

The product now exposes provider state more honestly, but it still depends on live provider health for the best experience.

What still needs monitoring:

- ElevenLabs quota/auth health
- OpenAI rate limits for chat and speech
- whether provider fallback settles on OpenAI voice or device voice in real sessions

### 2. Seven still does not use reader context deeply

Seven currently ignores:

- saved marks
- note text
- reading receipts
- account history
- derived patterns across the document

So Seven is not yet delivering the stronger "reader of convergence" experience implied by the docs.

### 3. There is still no persistent conversation layer

Seven is now much easier to use in-session, but its conversation state still lives only in the active reader session.

### 4. Telemetry is still lightweight

Server logs are now more structured and the UI is more honest, but there is still no dedicated analytics or incident dashboard for Seven behavior.

## Debugging Analysis

### Voice: likely root cause chain

Current likely chain:

1. User clicks `Listen`.
2. Client calls `/api/seven/audio`.
3. Server attempts ElevenLabs.
4. ElevenLabs currently fails with `quota_exceeded`.
5. Server attempts OpenAI speech fallback.
6. OpenAI speech currently fails with `429`.
7. Client catches provider failure.
8. If browser speech is available, client falls back to device speech.

So the symptom is real, but the product is doing exactly what the current fallback logic tells it to do.

### Chat: likely root cause chain

Current likely chain:

1. User opens Seven and submits a question.
2. Client calls `/api/seven`.
3. Server sends the section context to OpenAI.
4. OpenAI currently returns `429`.
5. UI shows "Seven's chat is unavailable right now."

So chat is built, but unhealthy.

### UI: why it feels half-built even where code exists

The current Seven experience has three product mismatches:

1. The docs frame Seven as a primary interpretive instrument.
2. The current UI frames Seven as a side utility.
3. The current runtime failures make the utility feel even less intentional.

That combination creates the impression that Seven is not really there yet, even though substantial implementation already exists.

## Recommended Next Work

### Immediate fixes

1. Restore provider health.
   - Resolve ElevenLabs quota/account issue.
   - Resolve OpenAI `429` rate limiting for both chat and speech.

2. Run authenticated diagnostics in staging/local and confirm which provider paths are actually healthy.
   - Verify chat from account diagnostics.
   - Verify voice from account diagnostics.
   - Confirm whether local fallback ends on OpenAI or device voice.

3. Watch real-reader feedback on the new panel hierarchy.
   - Confirm `Ask Seven` is now discoverable.
   - Confirm the mobile overlay feels intentional rather than intrusive.

### Near-term product improvements

1. Feed reader marks and notes into Seven prompts in a controlled way.
2. Let Seven summarize or answer from current reader context, not only authored section text.
3. Continue improving the personal marks workflow as Seven starts incorporating reader context more deeply.

### Next-level Seven work

1. Feed marks and notes into the Seven prompt.
2. Let Seven reason over reading receipts, not only the current section.
3. Move Seven closer to the manuscript's actual promise:
   - detect patterns
   - compare authored vs observed structure
   - surface operator-like distinctions

## Practical Bottom Line

Seven is more implemented than it appears, but it is currently undercut by provider failures and a UI that does not clearly announce its own capabilities.

The two most important truths right now are:

- Seven is now testable as a real reader assistant, not just a hidden side utility
- provider health is still the main live variable determining whether voice feels premium or degraded

So the next phase should focus on:

- validating live provider behavior with authenticated diagnostics
- feeding richer reader context into Seven
- iterating on the panel from real reader feedback rather than guesswork
