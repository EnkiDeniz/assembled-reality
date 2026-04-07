# Document Assembler — Elegance Pass Spec

**Screen-by-screen design refinement**
**April 3, 2026**

The principle for every screen: **one star, everything else supporting cast.** Before designing any screen, answer: what is the single thing the user came here to do? Make that thing dominant. Make everything else smaller, dimmer, or hidden until needed.

---

## Screen 1: Home (Mode Selection)

### The star: the next action.

The user just opened the app. They either want to continue where they left off or start something new. That's it.

### Current problems:
- Four equally-sized cards competing for attention
- "Listen" and "Assemble" are modes; "Upload" and "Paste Source" are actions — but they look identical
- "6 src 0 asm 0 rcpt" is developer shorthand
- Cards are too tall, pushing recent docs off screen

### Redesign:

```
┌─────────────────────────────────┐
│                                 │
│  DOCUMENT ASSEMBLER      [@]   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  CONTINUE LISTENING             │
│  Leader · block 1 of 23   [▶]  │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  [ ▶ Listen ]   [ ⊞ Assemble ] │
│                                 │
│  [ ↑ Upload ]   [ ⊕ New ]      │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  SOURCES                     6  │
│  Leader                   TXT   │
│  The Thesis              DOCX   │
│  A monolith does not...    MD   │
│  Assembled Reality    BUILTIN   │
│                                 │
│  ASSEMBLIES                  0  │
│  Nothing assembled yet.         │
│                                 │
└─────────────────────────────────┘
```

**Key changes:**

1. **"Continue Listening" card at the top** — if the user was listening to something, show it immediately with a play button. This is the most likely next action. One tap and they're back. This card only appears if there's an active listening session.

2. **Four action buttons, half the size** — shrink them to compact buttons in a 2×2 grid. Not cards. Buttons. They're entry points, not destinations. Each one gets a small icon and a label:
   - `▶ Listen` — pick a doc and play it
   - `⊞ Assemble` — enter assembly mode
   - `↑ Upload` — add a new file
   - `⊕ New` — start a blank document

3. **Sources list below** — simple list, just like Cursor's recent projects. Title on the left, file type badge on the right. Tap to open. No cards, no borders, no heights. Just rows.

4. **Remove jargon counts** — no "6 src 0 asm 0 rcpt." If counts are needed, use the section headers: "SOURCES  6" and "ASSEMBLIES  0" in dim text.

5. **"Nothing assembled yet"** — when a section is empty, say so plainly. Not "IDLE." Not "0 asm." Just a simple sentence.

### Icons for this screen:

| Action | Icon | Style |
|---|---|---|
| Listen | ▶ (play triangle) | Outline, thin stroke |
| Assemble | ⊞ (four squares / grid) | Outline, suggests pieces coming together |
| Upload | ↑ (up arrow) | Outline, universal upload symbol |
| New | ⊕ (plus in circle) | Outline, creation |

All icons should be monoline, same stroke weight, same size. No filled icons. The terminal aesthetic means icons are drawn, not solid.

---

## Screen 2: Listening View

### The star: the text being read and the player controls.

This is the core experience. The user is here to listen and read along. Everything else is secondary.

### Current problems:
- Seven layers of chrome above the first block (header, buttons, browse, listening label, assemble bar, status message, source label)
- The block content starts too far down the screen
- Too many navigation concepts visible at once

### Redesign:

```
┌─────────────────────────────────┐
│  ← Leader                 ⋯    │
│  ═══════════════════════════    │
│                                 │
│                                 │
│  001                            │
│  What's Taught as Good          │
│  Management but Functions       │
│  as Sovereignty Extraction      │
│                                 │
│                                 │
│  002                            │
│  These two things can happen    │
│  at the same time. A manager    │
│  can genuinely believe they     │
│  are developing someone while   │
│  systematically extracting      │
│  their sovereignty...           │
│                                 │
│                                 │
│  003                            │
│  ...                            │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│                                 │
│    ◁ PREV    ▶ PLAY    NEXT ▷   │
│                                 │
│  ━━━━━●━━━━━━━━━━━━━━━━━━━━━━  │
│  1/23          1x        Seven  │
│                                 │
└─────────────────────────────────┘
```

**Key changes:**

1. **Top bar: just the document title and a back arrow.** That's it. `← Leader` on the left, `⋯` overflow menu on the right (for browse, assemble, settings). One line. Then a thin divider. Then the content starts.

2. **Kill all middle chrome.** No BROWSE bar. No LISTENING label. No ASSEMBLE bar. No "Opened Leader." status message. No SOURCE label. The user knows they're listening — they pressed the button. The user knows the source — it's in the top bar. Telling them things they already know wastes the most valuable real estate on a phone screen: the top third.

3. **Content starts immediately.** After the one-line top bar, the next thing you see is block 001. On a phone, the first block should be fully visible without scrolling. The text is the star.

4. **Block numbers are quiet.** `001` in small, dim text above each block. Not a full metadata line. Not `001 0 · READER NOTE IMPORTED`. Just the number. The origin and operation data lives in the receipt log, not on the reading surface.

5. **The currently-playing block** gets a subtle left-side green bar (the stripe from the prototype) and slightly brighter text. Everything else dims slightly. The reader's eye is pulled to what they're hearing.

6. **The player is the bottom third.** Generous touch targets for PREV / PLAY / NEXT. Progress bar below. Speed and voice selector below that. The player is permanent and proud. It's the co-star of this screen.

7. **The `+` selector for clipboard** is NOT visible by default in listening mode. It appears only when the user enters assembly mode or long-presses a block. Listening mode is for listening. Don't clutter it with assembly controls.

### Player icon details:

| Control | Icon | Notes |
|---|---|---|
| Previous block | ◁ | Outline triangle pointing left |
| Play / Pause | ▶ / ❚❚ | Filled when playing (green), outline when paused |
| Next block | ▷ | Outline triangle pointing right |
| Speed | `1x` | Text button, cycles through 0.75x / 1x / 1.25x / 1.5x / 2x |
| Voice | `Seven` | Text dropdown, shows current voice name |

The play button should be the largest element in the player bar. It's the primary control. On mobile, it should be at least 48×48px touch target, ideally larger.

### The overflow menu (⋯):

When tapped, shows:

```
Browse sources
Assemble
View receipt log
Export document
Settings
```

These are all real features, but none of them need permanent screen space while listening.

---

## Screen 3: Browse / Sources View

### The star: the list of documents.

The user is here to find and open a specific document. This is a file picker, not a dashboard.

### Current problems:
- Duplicate entries ("A monolith does not move." × 2, "1\. The Thesis" × 2)
- "BUILTIN" is internal language
- "CURRENT ASSEMBLY · IDLE" is system state the user doesn't need
- The list has no visual hierarchy between items

### Redesign:

```
┌─────────────────────────────────┐
│  ← Browse                 ⋯    │
│  ═══════════════════════════    │
│                                 │
│  SOURCES                     6  │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ▶  Leader          TXT  │    │
│  │    23 blocks             │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ▶  The Thesis     DOCX  │    │
│  │    14 blocks             │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ▶  A monolith...    MD  │    │
│  │    8 blocks              │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ▶  Assembled Reality     │    │
│  │    SAMPLE · 499 blocks   │    │
│  └─────────────────────────┘    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ASSEMBLIES                  0  │
│  You haven't assembled          │
│  anything yet.                  │
│                                 │
└─────────────────────────────────┘
```

**Key changes:**

1. **Each document is a row with a play button.** The fastest path: I see a doc, I press ▶, I'm listening. No need to open it first, then find the player. The play button on the row is a shortcut to the listening view.

2. **Tap the row (not the ▶) to open in reading/editing mode.** Two paths: ▶ for instant listen, tap title for full view.

3. **Block count as the secondary line.** "23 blocks" tells you how long the document is. Useful for deciding what to listen to. No other metadata needed.

4. **File type badge on the right.** TXT, DOCX, MD — keep these, they're useful. Small, dim, right-aligned.

5. **"SAMPLE" instead of "BUILTIN."** If a document came with the app, call it a sample. That's a word everyone understands.

6. **Fix duplicates.** This is a bug, not a design choice. The conversion pipeline should deduplicate or the upload should prevent double-imports.

7. **Remove "CURRENT ASSEMBLY · IDLE."** If nothing is being assembled, show nothing. Silence is better than announcing inactivity.

8. **"You haven't assembled anything yet"** — warm, human, not a status code. This sentence also teaches: it implies that assemblies are a thing you can make, which might prompt curiosity.

---

## Screen 4: Assembly View (not yet shown, but spec it now)

### The star: the clipboard contents and the assemble button.

This is where selected blocks are arranged and committed into a new document.

### Design:

```
┌─────────────────────────────────┐
│  ← Assemble              Clear │
│  ═══════════════════════════    │
│                                 │
│  NEW ASSEMBLY                   │
│  3 blocks from 2 sources        │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  1  [Leader]                    │
│     What's Taught as Good       │
│     Management but Functions... │
│                        ↑  ↓  − │
│                                 │
│  2  [The Thesis]                │
│     GitHub is the largest       │
│     open dataset of assembled   │
│     human coordination...       │
│                        ↑  ↓  − │
│                                 │
│  3  [AI · extracted]            │
│     Both documents argue that   │
│     coordination without        │
│     receipts is aggregation...  │
│                        ↑  ↓  − │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │     ⊞  ASSEMBLE         │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Key elements:**

1. **Block previews with source labels.** Each block shows where it came from in brackets. AI-generated blocks show `[AI · extracted]` or `[AI · summarized]` in green.

2. **Reorder and remove controls on each block.** ↑ ↓ − on the right side of each row. Large enough touch targets for mobile.

3. **The ASSEMBLE button is the biggest element on the screen.** Full width, prominent, green. This is the commit action. It should feel important.

4. **Clear in the top right** — one tap to empty the clipboard and go back.

5. **Block count and source count** at the top: "3 blocks from 2 sources." Plain language.

---

## Global Icon System

All icons across the app should follow one style:

**Style:** Monoline outline. 1.5px stroke. No fills except the active play button (filled green). All icons the same optical size (20×20 or 24×24 depending on context).

**Color rules:**
- Default icons: dim gray (#666)
- Active/selected: green (#22c55e)
- Destructive actions (delete, clear): muted red (#ef4444) on hover/press only, gray by default

| Icon | Used for | Symbol |
|---|---|---|
| ▶ | Play | Filled triangle (green when playing) |
| ❚❚ | Pause | Two vertical bars |
| ◁ | Previous block | Outline triangle left |
| ▷ | Next block | Outline triangle right |
| ← | Back / navigate up | Left arrow |
| ⋯ | Overflow menu | Three horizontal dots |
| ⊞ | Assemble | Four squares in grid |
| ↑ | Upload | Up arrow |
| ⊕ | New / create | Plus in circle |
| − | Remove from clipboard | Minus |
| + | Add to clipboard | Plus |
| ↑↓ | Reorder | Up/down arrows |
| ▶ (small) | Quick-play in browse list | Small outline triangle |

**Recommendation:** Use Lucide icons (open source, monoline, consistent). They match the terminal aesthetic without looking like system defaults.

---

## Typography Refinements

The monospace aesthetic is right. But not everything needs to be the same size and weight.

**Hierarchy:**

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Block heading (H1) | IBM Plex Mono | 22px | 700 | White (#fff) |
| Block body | IBM Plex Mono | 15px | 400 | Light gray (#ccc) |
| Block quote | IBM Plex Mono | 15px | 400 italic | Amber (#f59e0b) |
| Block number | IBM Plex Mono | 11px | 400 | Very dim (#444) |
| Section labels (SOURCES, etc.) | IBM Plex Mono | 10px | 600 | Dim (#666), letter-spaced |
| Player text (speed, voice) | IBM Plex Mono | 12px | 400 | Dim (#888) |
| Button labels | IBM Plex Mono | 13px | 600 | Green or white depending on context |
| Status/error messages | IBM Plex Mono | 12px | 400 | Green for success, amber for warning |

**The key insight:** on a phone screen, the body text (15px) must be comfortably readable because this is a reading/listening tool. If the text is too small, nobody will read along while listening. Err larger.

---

## Color Palette (refined)

Keep the dark terminal base but tighten the accent usage:

| Color | Hex | Used for |
|---|---|---|
| Background | #0e0e0e | App background |
| Surface | #161616 | Cards, blocks, elevated surfaces |
| Border | #222222 | Dividers, card edges |
| Text primary | #e0e0e0 | Block body text, titles |
| Text secondary | #888888 | Labels, metadata |
| Text dim | #444444 | Block numbers, inactive elements |
| Green (primary accent) | #22c55e | Play button, active states, assemblies, success |
| Amber | #f59e0b | Quotes, warnings |
| Blue | #60a5fa | Source references |
| Purple | #a78bfa | AI actions |
| Red (danger) | #ef4444 | Delete/remove, errors (used sparingly) |

**Rule:** Green is the only color that appears "bright." Everything else is muted. Green means "this is alive" — playing, selected, assembled, connected.

---

## Summary: The Star of Each Screen

| Screen | The star | Everything else |
|---|---|---|
| Home | The next action (Continue Listening or pick a mode) | Source list, counts, settings — supporting |
| Listening | The text + the player | Navigation, browse, assemble — hidden in overflow |
| Browse | The document list | Counts, types, status — secondary |
| Assembly | The clipboard + the Assemble button | Source labels, reorder controls — supporting |
| Receipt Log | The timestamped action list | Export, share — secondary |

One star per screen. No exceptions.

---

## Screen 5: Conversational Listening Mode

### The star: the voice interaction.

This is the next evolution of the listening experience. Instead of just hearing the document, the user can talk back to it — ask questions, request summaries, challenge claims — mid-listen. The document pauses, the AI answers in the same voice, and playback resumes.

### The loop:

```
Document plays
       │
       ▼
User taps mic (or document detects silence gap)
       │
       ▼
Playback pauses automatically
       │
       ▼
User speaks: "What does that mean?"
       │
       ▼
Whisper transcribes speech → text
       │
       ▼
AI receives: transcription + current block + surrounding context
       │
       ▼
AI generates answer
       │
       ▼
ElevenLabs speaks the answer (same voice)
       │
       ▼
Playback resumes from where it paused
```

### Screen layout during conversation:

```
┌─────────────────────────────────┐
│  ← Leader                 ⋯    │
│  ═══════════════════════════    │
│                                 │
│  003                            │
│  These two things can happen    │
│  at the same time. A manager    │
│  can genuinely believe they     │
│  are developing someone while   │
│  systematically extracting      │
│  their sovereignty...           │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│                                 │
│  "What does sovereignty         │
│   extraction actually           │
│   look like in practice?"       │
│                                 │
│  It shows up as control over    │
│  decisions disguised as         │
│  guidance. The document gives   │
│  three examples in the next     │
│  section...                     │
│                                 │
├─────────────────────────────────┤
│                                 │
│    ◁ PREV    ▶ PLAY    NEXT ▷   │
│  ━━━━━●━━━━━━━━━━━━━━━━━━━━━━  │
│  3/23    🎤     1x       Seven  │
│                                 │
└─────────────────────────────────┘
```

### Key design decisions:

**1. The mic button lives in the player bar.** It sits between the progress indicator and the speed selector. Always visible during listening. One tap to start talking. The same place every time.

**2. When the mic is active, the player bar expands upward** to show a conversation area. The user's transcribed question appears in a slightly different style (italic or indented with a `>` prefix). The AI's spoken response appears below it in normal text. This area is temporary — it collapses back down after playback resumes, but the exchange is logged in the receipt.

**3. The document stays visible behind the conversation.** The current block remains on screen, highlighted. The user can see what they were listening to when they asked the question. Context stays anchored.

**4. Suggested prompts appear contextually.** Based on the currently-playing block, show 2-3 tappable suggestions at the bottom of the conversation area:

```
Try asking:
[ What does this mean? ]  [ Give me an example ]
[ How does this connect to the previous section? ]
```

These change as the document progresses. They're generated from the block content — not generic, not static. If the block mentions a specific claim, one suggestion might be "What's the evidence for that?"

**5. The conversation doesn't interrupt the document flow.** After the AI answers and playback resumes, the conversation area collapses. If the user wants to see past exchanges, they check the receipt log. The listening surface stays clean.

### Technical components:

| Component | Technology | Exists? |
|---|---|---|
| Document playback | ElevenLabs TTS | Yes |
| Speech-to-text | OpenAI Whisper API | New — one API call |
| AI document Q&A | OpenAI / existing AI bar | Yes — reuse the same endpoint |
| Answer spoken aloud | ElevenLabs TTS (same voice) | Yes — same pipeline |
| Pause/resume on interaction | Player state toggle | Yes — wire mic tap to existing pause |
| Contextual suggestions | AI generates from current block | New — lightweight prompt |

**What's actually new:** Whisper integration (speech-to-text) and the UI for the conversation area. Everything else is reconnecting existing pieces.

### Estimated effort: 1-2 days.

- Whisper API integration: half a day
- Mic button + conversation UI area: half a day
- Pause/resume wiring: a few hours
- Contextual suggestions: a few hours
- Polish and transitions: half a day

### Receipt integration:

Every voice interaction is logged:

```
10:14:22  LISTENED    Leader — Block 3 (0:42)
10:14:22  PAUSED      User asked a question
10:14:25  VOICE_QUERY "What does sovereignty extraction look like?"
10:14:28  AI_ANSWER   "It shows up as control over decisions..." (spoken)
10:14:35  RESUMED     Leader — Block 3
```

This is a new receipt type: the **Dialogue Receipt**. It proves not just that you listened, but that you engaged — you stopped, questioned, received an answer, and continued. That's a deeper proof of comprehension than time-on-page will ever be.

### What this enables:

- Students proving they engaged with assigned reading — not just played it
- Researchers interrogating papers while listening on a commute
- Teams reviewing documents asynchronously with voice, not text comments
- Anyone who thinks better out loud than by typing

### Priority:

This is a v0.3 feature. Get the core listening experience polished first (v0.2 elegance pass), then add the conversational layer. But the player bar should be designed now with space for the mic button so it doesn't require a layout change later.

### Icon addition:

| Icon | Used for | Symbol |
|---|---|---|
| 🎤 | Voice input / mic | Microphone outline, monoline |
| 🎤 (active) | Mic is recording | Microphone filled green, with subtle pulse animation |

When the mic is active, the play button area can show a simple waveform or pulsing dot to indicate recording. Keep it minimal — a breathing green circle is enough.

---

## Updated Summary: The Star of Each Screen

| Screen | The star | Everything else |
|---|---|---|
| Home | The next action (Continue Listening or pick a mode) | Source list, counts, settings — supporting |
| Listening | The text + the player | Navigation, browse, assemble — hidden in overflow |
| Conversational | The voice exchange + the current block | Player, suggestions — supporting |
| Browse | The document list | Counts, types, status — secondary |
| Assembly | The clipboard + the Assemble button | Source labels, reorder controls — supporting |
| Receipt Log | The timestamped action list | Export, share — secondary |

One star per screen. No exceptions.
