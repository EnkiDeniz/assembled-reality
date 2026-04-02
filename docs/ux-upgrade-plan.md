# UX Upgrade Plan — Assembled to Reality R2
**Competitive analysis: ElevenLabs Reader vs. AR current state**
**April 2026**

---

## What ElevenLabs does well (and what we can steal)

### 1. The persistent bottom player bar

**What they do:** A full-width audio transport bar pinned to the bottom of every screen. It shows the current voice avatar, voice name, progress bar with elapsed/remaining time, and playback controls (sleep timer, -15s, play/pause, +30s, speed). The bar is always visible — even when scrolling the document, even when in the AI chat view. It creates a sense of continuity: "your audio session is always here."

**What we have:** A `ReaderListenTray` that slides up from the bottom with skip-previous, play/pause, skip-next. It's functional but minimal — no progress bar, no time display, no speed control, no voice indicator.

**What we should steal:**
- A proper progress bar with elapsed/remaining time in the tray
- Playback speed selector (1x, 1.25x, 1.5x, 2x) directly in the tray
- The tray should always be visible once audio starts, across all surfaces (even when Seven panel is open)
- Voice provider indicator (small label showing "ElevenLabs" or "Device voice")
- Sleep timer control (nice-to-have, but signals polish)

### 2. Synchronized text highlighting during playback

**What they do:** As audio plays, the currently spoken line gets a translucent green/olive highlight that moves through the text in real time. The document becomes a karaoke-style follow-along. This is *the* killer feature of their reader — it turns passive listening into active reading.

**What we have:** We track `playerCursor` with `blockId` and do some autoscroll via `lyricFocusBlockId`, but there's no visible highlight on the text itself during playback. The reader doesn't visually show "this is what you're hearing right now."

**What we should steal:**
- Active paragraph/sentence highlighting during audio playback. Apply a `is-speaking` class to the block currently being read, with a subtle background color (use our accent gold at low opacity)
- Auto-scroll to keep the speaking block in the viewport center
- This should work in both provider and device-speech modes

### 3. The voice identity layer

**What they do:** A voice avatar (circular photo), voice name ("Sir Michael Caine"), and a voice picker bar at the very bottom below the transport. The voice becomes a character — you're not just "using TTS," you're "listening to Michael Caine read your document." This transforms a utility feature into a branded experience.

**What we have:** Seven has a voice but it's abstracted — the user sees "Voice is ready through ElevenLabs" in status text. No avatar, no personality, no selection.

**What we should steal:**
- Give Seven's voice a visual identity. Not a celebrity face, but a minimal avatar or glyph (the `7` icon is actually perfect for this)
- Show the voice identity in the listen tray: "Seven · ElevenLabs" or "Seven · Device"
- Eventually: voice selection (but not now — this is a later feature)

### 4. The AI chat as a pull-up sheet

**What they do:** The AI chat ("Ask me anything...") is a bottom sheet that pulls up over the document. It shows the document title as context ("The Shape Library Lakin.docx"), has a large animated orb as a visual idle state, suggested questions as horizontally scrolling chips, and both microphone and text input modes.

**What we have:** Seven is a right-side panel that slides in. It has a Guide tab (chat) and Evidence tab. The chat works but feels like a sidebar tool, not an immersive companion experience.

**What we should steal:**
- **Suggested questions / conversation starters.** When the Seven panel opens and there's no conversation yet, show 3-4 contextual prompts based on the current section: "What is this section arguing?", "How does this connect to section 3?", "Summarize the key claims." These reduce the blank-page problem enormously.
- **Visual idle state.** When Seven is open but no conversation has started, show something more inviting than an empty chat. Could be a subtle animation, the `7` glyph, or a brief orientation message.
- **Document context indicator.** Show which section Seven is currently scoped to at the top of the panel.
- **On mobile: make Seven a bottom sheet rather than a side panel.** Side panels on mobile are clunky. A bottom sheet that swipes up is the native mobile pattern.

### 5. The home/library as a launchpad

**What they do:** The home screen has four prominent action tiles: "Write text", "Upload a file", "Scan text", "Paste a link". Below that: recommended collections, recent items, and a bottom tab bar (Home, Explore, Import, Library, Voices). It's a dashboard that says "what do you want to do?" rather than dumping you into content.

**What we have:** No library yet — users go directly from unlock → auth → the single document reader. No home screen, no import flow, no library browser.

**What we should steal (for R2 library phase):**
- **Action tiles for document ingestion.** When we add Markdown upload, present it as a prominent action on the home/library screen: "Upload Markdown", "Paste text", "Create new". Keep it to 2-3 options, not 4 — we don't need scan.
- **Bottom tab bar for mobile navigation.** Library | Reader | Seven | Notebook is a natural tab structure for AR.
- **Recent documents section** on the library home, sorted by last-read date. Each card shows title, last-read position, and a subtle progress indicator.

### 6. Dark-first aesthetic with warm tones

**What they do:** Deep charcoal background (#1a1a1a range), warm off-white text, subtle surface elevation through slightly lighter card backgrounds. UI chrome uses dark gray with thin borders, not black. Buttons and controls are muted gray with rounded corners. The overall feeling is "premium dark mode that doesn't feel harsh."

**What we have:** We have a paper/light theme as default and a dark theme option. The dark theme uses `#11100f` background with warm ink colors — actually quite good. But the light "paper" theme is our default and primary identity.

**What we should steal:**
- **Polish the dark theme to be a first-class citizen**, not an afterthought. Many serious readers prefer dark mode (especially for long sessions). Make sure every surface, panel, and control looks intentional in dark mode.
- **Increase contrast and hierarchy** in both themes. ElevenLabs uses font weight, size, and opacity to create clear visual hierarchy. Our current styles are good but could be sharper.
- **Rounded, pill-shaped controls** — we already use `border-radius: 999px` in many places. Commit to this as a system-wide pattern.

### 7. The inline comment/annotation FAB

**What they do:** A floating action button (chat bubble icon) appears in the bottom-right of the reading view. Tapping it opens the AI chat scoped to the visible passage. It's always one tap away from "ask about what I'm reading."

**What we have:** Seven is accessed via the `7` button in the top bar. It's not contextual — it opens the full Seven panel, not a quick-ask about the current passage.

**What we should steal:**
- A floating "Ask Seven" button that appears near the bottom-right when the user is reading. Tapping it opens Seven pre-loaded with context about the current section/paragraph.
- This is different from the full Seven panel — it's a quick-ask shortcut. Think of it as the "Hey Siri" for the document.

---

## What AR already does better than ElevenLabs

Before we only look at what to copy, it's worth naming what we already have that ElevenLabs doesn't:

1. **Deep annotation model** — highlights, notes, bookmarks with full persistence. ElevenLabs has no annotation system at all.
2. **Evidence collection and interpretation receipts** — this is our unique differentiator. Nobody else has a formal "commit to an interpretation" workflow.
3. **Conversation threading with citations** — our Seven cites specific passages. ElevenLabs' chat is general-purpose.
4. **Thematic entry experience** — the cuneiform puzzle and "say the magic word" gate. This creates mystery and ceremony that ElevenLabs' utilitarian upload flow never will.
5. **Reading progress tracking** — persisted per-user, per-document.
6. **Two-theme reading system** — paper and dark, with text size and page width controls.

---

## Prioritized upgrade plan

### Phase 1: Audio player upgrade (high impact, medium effort)

The listen tray is the most visible gap between us and ElevenLabs. Upgrading it creates an immediate perception of quality.

**Tasks:**
1. Add a scrubable progress bar to `ReaderListenTray` showing elapsed / remaining time
2. Add playback speed selector (1x, 1.25x, 1.5x, 2x) as a tappable cycle button
3. Show voice identity: "Seven · ElevenLabs" or "Seven · Device voice" in the tray
4. Make the tray persist across all surfaces (visible even when Seven panel or Notebook panel is open)
5. Add `is-speaking` highlight class to the currently playing block in `MarkdownRenderer`, driven by `playerCursor.blockId`
6. Auto-scroll to keep the speaking block in viewport during playback

### Phase 2: Seven panel experience lift (high impact, medium effort)

Make Seven feel like a companion, not a sidebar.

**Tasks:**
1. Add contextual conversation starters (3-4 chip buttons) when Seven opens with no thread. Generate them from the current section title/content.
2. Add a visual idle state when no conversation exists — a centered `7` glyph with a subtitle like "Ask about this section" and the section title.
3. Show current section context at the top of the Seven panel header.
4. Add a floating "Ask Seven" FAB (bottom-right) on the reading surface that opens Seven with section context pre-loaded.
5. Improve the chat message styling — slightly larger text, better spacing between messages, clearer visual distinction between user and Seven messages.

### Phase 3: Reading surface polish (medium impact, low effort)

Small CSS refinements that compound into a premium feel.

**Tasks:**
1. Refine dark theme — audit every component for contrast, consistency, and intentionality. Ensure all panels, menus, and controls look native in dark mode.
2. Add subtle transition animations to panel open/close (currently 240ms ease, could add a slight scale or fade).
3. Polish the topbar: add a subtle bottom border fade on scroll, ensure the section label updates smoothly.
4. Add a reading progress bar (thin, at the very top of the viewport, spanning full width) showing document-wide progress. This is a single CSS element driven by the existing `progress` state.
5. Improve mobile viewport handling — ensure panels use `100dvh`, safe-area insets are respected everywhere, and touch targets are minimum 44px.

### Phase 4: Mobile-native patterns (high impact for mobile, high effort)

For mobile users, adopt the patterns that ElevenLabs proves work.

**Tasks:**
1. Convert Seven panel to a bottom sheet on mobile (< 768px). Use `position: fixed; bottom: 0` with drag-to-expand. Keep the side panel on desktop.
2. Convert Table of Contents to a bottom sheet on mobile.
3. Add swipe-left/right gestures for section navigation on mobile.
4. Implement a bottom tab bar on mobile for primary navigation: Contents | Read | Seven | Notebook. This replaces the topbar buttons which are hard to reach on tall phones.
5. Ensure the listen tray stacks correctly above the bottom tab bar.

### Phase 5: Library home (for R2 multi-document phase)

When Markdown upload ships, this becomes the entry point.

**Tasks:**
1. Create a `/library` route as the new home after auth.
2. Add 2-3 prominent action tiles: "Upload Markdown", "Paste text", "Create new".
3. Show recent documents with title, last-read section, progress bar, and last-read date.
4. Add a document card component with minimal metadata (title, section count, last read).
5. Route `/read/[documentId]` for multi-document support.
6. Keep the current single-document experience as the default for the canonical manuscript.

---

## Implementation order and dependencies

```
Phase 1 (Audio player) ─── no dependencies, start immediately
Phase 2 (Seven panel) ──── no dependencies, can parallel with Phase 1
Phase 3 (Reading polish) ── no dependencies, can parallel
Phase 4 (Mobile patterns) ─ depends on Phase 1-2 (needs final tray/panel layouts)
Phase 5 (Library home) ──── depends on PRD multi-document data model work
```

Phases 1-3 can be done in parallel and should be the immediate focus. They upgrade the current single-document experience without requiring any backend changes.

---

## Design principles to carry forward

1. **Reading surface is sacred.** Never clutter it. Every overlay, panel, and control should feel like it's serving the text, not competing with it.
2. **Audio is a first-class mode, not a feature.** Treat listening like an equal experience to reading. The player deserves as much design attention as the reading column.
3. **Seven is a presence, not a tool.** Give Seven personality, context, and visual identity. The chat should feel like talking to a guide, not querying a search engine.
4. **Ceremony matters.** Keep the unlock gate, the cuneiform puzzle, the receipt formality. These create meaning that utilitarian products can't replicate.
5. **Dark mode is not an afterthought.** Many power readers live in dark mode. Make it feel intentional and premium.
6. **Mobile-first doesn't mean desktop-second.** The reading surface should be beautiful on both. Use responsive patterns (bottom sheets on mobile, side panels on desktop) rather than forcing one layout everywhere.
