# Lœgos UX Brief — Entry, Flow, and AI Access

## The Core Problem

The app currently treats all users the same way at every stage. It shouldn't. A first-time user, a returning user, and a power user are at different gradient positions — they need different surfaces, different defaults, and different access to the AI.

---

## Three Users, Three Assembly Paths

### User A — First Timer ("What is this?")

**Who:** Just signed up. Saw the login page. Doesn't know what a Box is. Doesn't know what œ does. May have come from the about page or a blog post.

**What they want:** Understand the tool by using it, not by reading about it.

**Entry experience:**
- Open the app → blank screen. "Say something. Drop a file. Or just say a word."
- Three inputs visible: text field, mic button, file attach
- Whatever arrives first becomes the first source
- Seven responds with a read, then creates the seed — aim, ground, gap — from the user's own words
- The Box names itself from the seed
- Primary actions become visible: **Add source** and **Ask Seven**
- œ button is visible but greyed out until there's enough material to read

**What they do NOT need:** Box launcher with multiple boxes. Settings. Advanced source management. Shape/gradient diagnostics.

**Assembly path:** Say or drop something → Seven creates the seed → maybe add another source → ask Seven a question → get a feel for the system → come back tomorrow or don't.

**Success metric:** They come back.

---

### User B — Returning User ("Where was I?")

**Who:** Has used Lœgos before. Has 1–3 Boxes. Has sources in them. Coming back to continue work.

**What they want:** Get back into their Box and keep going. Zero friction to resume.

**Entry experience:**
- Open the app → see their most recent Box, seed visible, showing where things stand right now
- NOT the Box launcher. The Box launcher is reachable but not the default landing
- The seed tells them immediately: here's what you're aiming at, here's what's real, here's the gap
- Seven is accessible with one tap/click
- Primary actions visible: **Add source** · **Switch source** · **Ask Seven** · **œ**

**What they do NOT need:** Onboarding. Seed files. "What is this?" explanation. They know.

**Assembly path:** Review current assembly or latest source → add new source or continue editing → ask Seven → run œ when ready → seal or reroute.

**Success metric:** Time to first meaningful action < 10 seconds.

---

### User C — Power User ("Full capability")

**Who:** Has been using Lœgos regularly. Multiple Boxes. Understands Think/Create/Operate. Knows what shapes and gradients mean. Wants full control.

**What they want:** Speed. Source switching. Multiple Boxes. Diagnostic surfaces. Keyboard shortcuts.

**Entry experience:**
- Open the app → lands in most recent Box (same as User B)
- But now: source sidebar is visible, Box switching is fast, Seven thread history is accessible, Operate history is reviewable
- Shape/gradient diagnostics are available (not default, but one click away)

**What they do NOT need:** Explanation of any kind. Just workspace.

**Assembly path:** Switch between sources rapidly → ask Seven targeted questions → run œ → compare with previous Operate runs → seal → open next Box.

**Success metric:** Sources per session. Receipts sealed per week.

---

## Entry Experience — The Fix

### The Rule

**The app should open to where you left off, not where you started.**

- First time → blank screen. "Say something. Drop a file. Or just say a word."
- Every other time → most recent Box, seed visible, ready to continue

### First-time experience

The screen is blank. Dark. Three lines of text:

```
Say something.
Drop a file.
Or just say a word.

[ type here ]                    [🎤] [📎]
```

Three entry paths. All equal. Text, voice, file. Whatever arrives first becomes the first source. Seven responds — not with a tutorial, but with a read. Then Seven creates the **seed**.

The seed is the first .md file in the Box. It's built from whatever the user brought:

User says "I want to start a bakery" → Seven creates:

```
# Bakery

## Aim
You want to start a bakery.

## What's here
Just the intention. No location, no budget, no timeline yet.

## The gap
Everything. But now it has a name.
```

The Box names itself from the seed. The first source exists. "Add more" now makes sense because there's something to add to.

### The seed is the assembly

This is the architectural insight: the seed and the assembly are the same object. They've been two names for one thing.

The seed starts as three lines — aim, ground, gap — created from the user's first input. Then it grows. It is the living, evolving document that always answers one question: **where does this Box stand right now?**

Every Box has one seed. It is:

- **Created** by Seven from the user's first input
- **Updated** as new sources enter the Box
- **Refined** when the user edits or when Seven incorporates new material
- **Sharpened** every time Operate runs — the three operator sentences (aim, ground, bridge) feed back into the seed
- **Grounded** every time a receipt seals — the sealed convergence point becomes part of the seed's reality section

The seed is not a static document. It is the Box reading itself, continuously. Early on, it's mostly aim (△) and gap. As sources accumulate, the ground section (□) fills in. As receipts seal, the reality section grows and the gap section shrinks. The shape of the seed shifts over time — from dream to proof.

**What the seed looks like at different stages:**

Week 1 (just started):
```
# Bakery

## Aim
You want to start a bakery. Sourdough-focused.
Somewhere walkable in Brooklyn.

## What's here
3 photos of spaces you like. One article about
bakery margins. A voice note about why.

## The gap
No budget. No lease research. No timeline. The aim
is clear but the ground is empty.
```

Week 4 (evidence arriving):
```
# Bakery

## Aim
Open a sourdough bakery in Park Slope or
Cobble Hill by Q1 next year.

## What's here
Lease research for 3 locations (receipts sealed).
Startup cost estimate: $180K (receipt, L2).
Commercial kitchen regs reviewed. Two sourdough
recipes tested with feedback.

## The gap
No funding source identified. No business plan
beyond cost estimate. The aim is directed but
the money isn't there yet.

## Sealed
- Location research complete (L3, sealed Mar 2)
- Startup cost estimate verified (L2, sealed Mar 8)
- Recipe testing round 1 done (L2, sealed Mar 15)
```

Week 12 (converging):
```
# Bakery

## Aim
Open a sourdough bakery at 312 Court St, Cobble
Hill. Lease signed. Target opening: February.

## What's here
Signed lease (L4). Equipment list priced and
sourced (L3). Menu finalized (L3). Contractor
hired, buildout timeline 8 weeks (L2). LLC filed.
Health dept application submitted.

## The gap
Funding gap: $40K remaining. Contractor hasn't
started — waiting on permits. No staff hired yet.

## Sealed
- 14 receipts across 12 weeks
- Trust floor: L2, ceiling: L4
- Receipt-to-source ratio: 0.7
```

The seed went from dream to proof. The gap shrank. The receipts accumulated. The Box became real. And at every point, the user could open the Box, look at the seed, and know exactly where they stand.

**UX implications:**

- The seed is always the first thing visible when opening a Box
- It sits at the top of the source list, visually distinct — it's not a source among sources, it's the summary of all sources
- Seven can update it at any time, with the user's consent
- The user can also edit it directly — it's their document
- When Operate runs, the result feeds back into the seed automatically
- The seed is included when Operate reads the Box — it IS the current assembled position

**The design rule:** every Box has exactly one seed. The seed is born from the user's first word. It grows as the Box grows. It is the living answer to "where am I with this?" If a Box has no seed, something is broken.

### The assembly process — a virtual object becoming real

The seed is a virtual object. It has structure. It has an assembly index. But it only exists inside the Box. It hasn't touched reality yet. It's △ — pure aim.

The entire journey of a Box is watching that virtual object try to become real.

Sources add material to it — but unproven material. The object gains shape but stays translucent. Receipts are different. Every sealed receipt is a part of the virtual object that touched reality and survived. When a receipt seals, that part of the object becomes solid. Opaque. Real.

**The visualization is not a chart. It's the object itself.**

Imagine the seed rendered as a shape:

**Week 1 — wireframe.**
Almost nothing solid. The outline of an intention. A few edges, mostly empty. The user typed "I want to start a bakery" and dropped two photos. The shape exists but it's all aim. Translucent.

```
    ╱╲
   ╱  ╲
  ╱    ╲         ← wireframe. aim only.
 ╱      ╲           no receipts yet.
╱________╲
```

**Week 4 — partially solid.**
Sources added material. Three receipts sealed — location research, cost estimate, recipe test. Those three areas of the shape are now opaque. Solid. The rest is still wireframe — the parts that haven't been tested yet.

```
    ╱╲
   ╱  ╲
  ╱ ██ ╲        ← partially solid.
 ╱ ████ ╲          3 receipts filled in.
╱________╲         gap still visible.
```

**Week 12 — mostly solid.**
Fourteen receipts. Lease signed. Equipment sourced. Menu finalized. Most of the shape is opaque. A few wireframe sections remain — funding gap, staffing, permits. The gap is visible as the parts that are still transparent.

```
    ╱╲
   ╱██╲
  ╱████╲        ← mostly solid.
 ╱██░░██╲          14 receipts.
╱████░░██╲         gap = wireframe sections.
```

**Fully assembled — solid object.**
Every section backed by a receipt. Every aim grounded in evidence. The wireframe is gone. The shape is fully opaque. The virtual object became real. It's ready to leave the Box and exist in the world.

```
    ╱╲
   ╱██╲
  ╱████╲        ← solid. real.
 ╱██████╲          assembly complete.
╱████████╲
```

The user doesn't need labels. They don't need to understand △ □ œ to read this. They look at their object and see: **how much of this is real?** Solid = receipts. Wireframe = still intention. The gap between solid and wireframe IS the gap between what you think and what you do. Made visible. One shape.

### Why this is not a metaphor

In Assembly Theory, an object's assembly index is the minimum number of non-random steps required to produce it.

A seed at week 1 has low assembly index — one step created it (the user said something). A seed at week 12 with fourteen sealed receipts has high assembly index — each receipt required real steps, real evidence, real convergence. The object literally became more complex, more assembled, more real. The visualization IS Assembly Theory rendered for a human.

The number of receipts that filled in the shape is the assembly index of the Box made visible. You are watching assembly happen. The virtual object gaining reality, one receipt at a time. Each solid section is proof of assembly. Each wireframe section is assembly still in progress.

### When the object is fully solid

That's the moment the thing is ready to leave the Box and exist in the world. The bakery opens. The proposal ships. The project launches. The promise is kept. The virtual became real. The assembly is complete.

Not every Box needs to reach fully solid. Some Boxes are explorations — they stay partly wireframe forever because the user learned enough and moved on. That's fine. Reroute is respect for truth. But the visualization shows the user exactly how much of their intention became real, and how much stayed intention.

### How this connects to everything

- **The seed** is the virtual object in text form — aim, ground, gap
- **The shape visualization** is the same object rendered visually — wireframe becoming solid
- **Operate** reads the Box and produces the three sentences that describe the object's current state
- **Receipts** are the events that turn wireframe sections solid
- **The receipt-to-source ratio** is the same information expressed as a number instead of a shape
- **The gradient (1–7)** tracks how far along the object is from wireframe to solid

One object. Multiple views. The seed, the shape, the three sentences, the ratio — they all describe the same thing: a virtual object trying to become real.

---

### What should be visible on open (returning user)

The seed is the default view. The user opens their Box and sees their seed — the current state of everything. From there, they can dive into sources, ask Seven, or press œ.

**Desktop:**
```
┌─────────────────────────────────────────────────────┐
│ [Box name]                    [Switch Box ▾]  [œ]   │
├──────────┬──────────────────────────────────────────┤
│ Seed  ●  │                                          │
│          │  [Seed — current state of the Box]       │
│ Sources  │                                          │
│ source 1 │                                          │
│ source 2 │                                          │
│ source 3 │                                          │
│          │                                          │
│ Receipts │                                          │
│ receipt 1│                                          │
│ receipt 2│                                          │
│          │                                          │
│ [+ Add]  │                                          │
│          ├──────────────────────────────────────────┤
│          │  Seven                          [expand]  │
│          │  "Need help? Ask me anything."            │
└──────────┴──────────────────────────────────────────┘
```

- Seed: always at the top of the sidebar, visually distinct. The default view on open.
- Sources: below the seed. One click to switch.
- Receipts: below sources. Sealed, immutable, ordered by date.
- Seven: collapsed but always visible at the bottom. One click to expand.
- œ button: always visible in the header. Always reachable.
- Add source: in the sidebar. One click.

**Mobile:**
```
┌─────────────────────────┐
│ [Box name]    [≡]  [œ]  │
├─────────────────────────┤
│                         │
│ [Current source /       │
│  assembly content]      │
│                         │
│                         │
│                         │
│                         │
├─────────────────────────┤
│ [+ Add]  [Sources]  [Seven] │
└─────────────────────────┘
```

- Bottom bar: three actions. Add source. Switch source. Open Seven.
- œ button: top right. Always visible.
- The content area is the source you're working with. Swipe or tap "Sources" to switch.

---

## The Box — What It Actually Is

Stop and think about what a Box contains.

A photo of a whiteboard from last Tuesday's meeting. A voice memo you recorded in the car. A screenshot of a Slack thread. A PDF your partner sent. A note you typed at 2am. A link to an article that changed how you think about the problem. An image of a place you want to build something. A scanned receipt from a dinner where the deal got done.

Images. Sound. Text. Links. Files. Fragments. All in one container. All readable by the same engine.

No other tool does this. Notion holds text and databases. Figma holds design files. Google Drive holds documents. None of them take a photo, a voice memo, and a scribbled note and say: "here's what you're actually aiming at, here's what's real, and here's the gap."

The Box is not a folder. A folder stores. The Box reads. When you press œ, the system reads across every modality — image descriptions, voice transcriptions, text, extracted links — all normalized to the same grammar, all shape-classified, all compressed into three sentences. The photo of the ranch and the spreadsheet of zoning costs and the voice memo about your timeline become one coherent read.

That's the magic. Not that it stores everything. That it understands everything together.

### What this means for UX

**Adding sources should feel like dropping things into a physical box.** Not uploading files to a system. Dropping. The gesture should be casual, fast, low-commitment. Drag an image from your desktop. Paste a link. Record a voice note. Screenshot something and share it to the app. Every entry path should feel like tossing something into a box on your desk — because that's what it is.

**The source list should show modality.** An icon or visual cue for each source type — text, image, audio, link, file. The user should see at a glance that their Box contains different kinds of material. That visual mix IS the identity of the Box. A Box of all text feels different from a Box of images and voice memos. The user should feel that difference.

**Seven should be able to talk about any source type.** "What's in this image?" "Summarize that voice memo." "How does this screenshot relate to my assembly?" The AI has to be modality-fluent, not text-only.

**Operate should show what it read.** The result surface should show: "Read 3 text sources, 2 images, 1 voice memo, 1 link." The user should know that the three sentences came from ALL of their material, not just the text. That's the trust moment — the user sees that the photo they dropped in actually shaped the diagnosis.

### The emotional register

A Box with images, sounds, and text in it is a living thing. It's closer to a scrapbook than a spreadsheet. It's closer to a memory than a document. People will put things in their Box that matter to them — not just work artifacts but aspirational images, voice notes to themselves, photos that represent where they want to go.

The UX has to respect that. The Box is not a productivity tool. It's a container for intention. Some of what goes in will be evidence. Some will be dream. The system reads both — classifies one as □ and the other as △ — and shows the user the distance between them. That distance is the gap. Closing it is the work.

### The gravity center: receipts

Here's what needs to be explicit: the most important things in a Box are not the sources. They are the receipts.

Sources are inputs. They enter the Box as raw material — images, notes, voice memos, links, ideas. They might be △1 (raw hope) or □2 (unverified evidence). They're valuable. But they haven't been tested yet.

Receipts are proven. A receipt is a sealed convergence point — aim met reality and the weld was recorded. A receipt is at minimum gradient 7 and at minimum L1, often L2 or L3. It is the thing in the Box that you can stand on.

When you assemble, you assemble FROM receipts. The assembly is not a collage of ideas — it's a structure built on proven ground. The ideas, images, voice memos — those are the material you explore with. The receipts are the foundation you build on. The difference matters:

- A source says: "I think revenue grew 12%."
- A receipt says: "Revenue grew 12%. Verified against Stripe. Sealed March 15."

When Operate reads the Box, the receipts carry more weight than the sources because they've already passed the convergence test. They are reality that has been named and sealed. Everything else is still being assembled.

**What this means for UX:**

**Receipts should be visually distinct from sources.** Not just a different icon — a different presence. Sources are the working material. Receipts are the settled ground. The user should see at a glance: this Box has 8 sources and 3 receipts. The 3 receipts are what I know for sure. The 8 sources are what I'm still working with.

**The source sidebar should separate them.** Sources on top (working material, ordered by recency or user preference). Receipts below (sealed, immutable, ordered by seal date). A clear visual line between "what I'm exploring" and "what I've proven."

**Assembly should reference receipts, not just sources.** When the user builds the assembly document, they should be able to pull in sealed receipts as anchored evidence — not copy-pasted text but referenced proof. "This claim is backed by receipt #7, sealed March 15, L3." The assembly becomes a document grounded in receipts.

**Operate should weight receipts differently.** This creates a nuance in the Operate spec: receipts generated INSIDE this Box by previous Operate runs should be excluded (to prevent self-sealing loops). But receipts brought INTO this Box from GetReceipts, from other Boxes, or from external sources should be treated as high-weight □ sources. They are proven ground. They anchor the read.

**The rule:** receipts from outside the Box are first-class sources. Receipts from inside the Box are sealed history. Both are visible. Only the external ones feed Operate.

**Over time, a Box's receipts tell you what's real.** Early in a Box's life, it's all sources — aims, ideas, fragments. As the user works, receipts accumulate. The ratio shifts. A mature Box has more receipts than raw sources. That shift IS the assembly becoming real. The Box is literally filling with proof.

The most important number in a Box might not be the gradient or the trust level. It might be the receipt-to-source ratio. Low ratio = still dreaming. High ratio = the dream is becoming real.

---

## Box Intelligence — More Than an Activity Log

### The Problem

Right now the Box shows an activity log — what happened, when. That's useful but thin. It's the equivalent of a to-do list with checkmarks. It tells you what occurred. It doesn't tell you what it means.

The Box has vastly more data than that. Every source has a shape (△ □ œ). Every source has a gradient position (1–7). Every receipt has a trust level (L1–L7). Over time, these accumulate into patterns that reveal what the user is actually building — or failing to build.

### What the Box should show

Beyond the activity log, the Box should surface diagnostics that emerge naturally from the data. Not dashboards the user configures. Signals the system reads and surfaces when they're meaningful.

**Shape distribution — what kind of box is this?**

A simple visual: how much of this Box is aim (△), how much is reality (□), how much is weld (œ)?

```
△ ████████████████░░░░░░░░░░  58%
□ ████████░░░░░░░░░░░░░░░░░░  27%
œ ██████░░░░░░░░░░░░░░░░░░░░  15%
```

The user sees at a glance: this Box is aim-heavy. Lots of intentions, not much evidence. That's not a judgment — it's a read. Maybe the Box is new. Maybe the user is dreaming before building. But if it stays aim-heavy after weeks, that's signal.

**Gradient position — where is this Box in the arc?**

A single indicator showing the overall convergence state of the Box. Not a number — a position on a visual arc from raw (1) to sealed (7). As sources accumulate and receipts seal, the position moves.

```
raw ──●───────────────── sealed
      2
```

Early on, the dot sits left. As evidence arrives and receipts seal, it drifts right. The user feels the movement without needing to understand the math.

**Trust terrain — how deep is the proof?**

A visual showing the trust level distribution across all receipts in the Box.

```
L7 ░░░░░░░░░░░░░░░░░░░░░░░░
L6 ░░░░░░░░░░░░░░░░░░░░░░░░
L5 ░░░░░░░░░░░░░░░░░░░░░░░░
L4 ░░░░░░░░░░░░░░░░░░░░░░░░
L3 ████░░░░░░░░░░░░░░░░░░░░  2 receipts
L2 ████████░░░░░░░░░░░░░░░░  4 receipts
L1 ████████████████░░░░░░░░  8 receipts
```

Most users start at L1. Over time, receipts climb. Seeing the terrain shift upward is the visual proof that the Box is getting more real.

**Receipt-to-source ratio — is the dream becoming real?**

```
Sources: 12    ████████████
Receipts: 3    ███

Ratio: 0.25 — still assembling
```

This is the single most important diagnostic. A ratio near zero means the Box is all raw material. A ratio approaching 1.0 means almost everything in the Box has been tested and sealed. The shift from low to high IS the assembly becoming real.

**Geometry over time — how did the shapes change?**

A timeline showing how the shape distribution shifted as the Box grew:

```
Week 1:  △△△△△△△ □□ œ          (all aim)
Week 2:  △△△△ □□□□ œœ          (evidence arriving)
Week 3:  △△△ □□□□□ œœœ         (testing)
Week 4:  △△ □□□□□□ œœœœ        (converging)
```

The user watches their Box evolve from dream to proof. Each week, the balance shifts. The shape of the shift tells the story.

**Turning points — where did the Box change direction?**

The system identifies moments where the shape distribution shifted significantly — a new source that changed everything, a receipt that sealed a major convergence, a reroute that redirected the aim.

> "March 14: You added the zoning report. Before that, this Box was 70% aim. After, it shifted to 45% reality. That source grounded the project."

These are the moments that matter. Without the Box reading itself, they'd be invisible — buried in the activity log like everything else.

### When to show this

**Not on first use.** A new Box with two sources doesn't need analytics. It needs "add more."

**After meaningful accumulation.** Once a Box has 5+ sources and 1+ receipt, the diagnostics start to mean something. Surface them then — gently. A small "Box insights" section that expands on tap.

**Always available to power users.** User C (power user) should be able to pull up full shape distribution, gradient history, trust terrain, and receipt ratio at any time. One click from the Box home.

**Surfaced by Seven.** The most natural way to encounter the analytics is through conversation. The user asks Seven: "How is this Box doing?" Seven responds with the read — shape distribution, gradient position, trust floor, receipt ratio. The visualization materializes alongside the conversation. That's the briefing room.

### The briefing room vision

When Seven discusses the Box, the analytics should appear alongside the conversation — not in a separate dashboard, but as visual context that materializes as Seven speaks. Seven says "your Box is aim-heavy" and the shape distribution appears. Seven says "your trust floor is L2" and the trust terrain renders. The visualization IS the conversation.

### Development principle: don't build dashboards

AI models are developing so fast that most of what used to require pre-built UI is now unnecessary. If the user asks Seven "how is my Box doing?", Seven can generate a chart in real time — shape distribution, trust terrain, geometry timeline, whatever the question requires. The chart is the response. No dashboard needed.

This changes how we design:

**The receipt is the primitive.** Every receipt has aim, ground, bridge, gradient, trust level, timestamp, source lineage. That's structured data. Any analysis — shape distribution, trust terrain, receipt-to-source ratio, turning points, trends — is computable from those primitives on demand.

**Seven has full context.** The AI has access to every source, every receipt, every assembly in the Box. It doesn't need a pre-built analytics layer to answer questions about the data. It reads the data and responds — sometimes with text, sometimes with a chart, sometimes with both.

**The AI can respond in many formats.** Text. Charts. Tables. Comparisons. Timelines. The response format matches the question. "How is my Box doing?" might get a shape bar and a sentence. "Show me how my trust levels changed over time" gets a chart. "What was the turning point?" gets a narrative with a timestamp. The user doesn't pick a visualization type. The AI picks the best way to answer.

**What we build vs. what the AI generates:**

| Build (static, always visible) | AI generates (on demand, in conversation) |
|---|---|
| Receipt-to-source ratio (simple count, always useful) | Shape distribution over time |
| Gradient position indicator (one dot on an arc) | Trust terrain heatmap |
| Source type icons in sidebar (text, image, audio) | Turning point analysis |
| Receipt list with seal dates and trust levels | Cross-box comparison |
| | Trend charts |
| | Pattern detection |
| | Custom analysis the user asks for |

The left column is thin. A few indicators that help the user orient without asking. The right column is infinite — anything the AI can compute from the primitives, generated on demand, in the conversation, with the right visual format.

**The design principle:** build the minimum static surface. Let the AI generate everything else. Every chart we hard-code into the UI is a chart that will be outdated by the next model improvement. Every chart the AI generates is always current, always contextual, always responsive to what the user actually asked.

**The practical implication:** the Box home screen needs receipts, sources, a gradient indicator, and access to Seven. That's it. Everything else — every analysis, every visualization, every insight — comes through conversation. The user asks. Seven answers. The format matches the question.

This is not laziness. This is architecture. The receipt is the primitive. The AI is the analyst. The conversation is the surface. Build the primitives right and the intelligence is free.

---

## AI Access — The Fix

### The Problem

Seven exists but there's no quick, persistent access to it on either platform. The user has to go find it. By the time they find it, the impulse is gone.

### The Rule

**Seven is always one tap away. On every screen. In every state.**

### When do users pick up the AI?

| Moment | What they ask | What Seven does |
|---|---|---|
| Just opened a source | "What is this?" / "Summarize this" | Reads the source. Gives a shape-read. |
| Stuck writing | "Help me with this paragraph" / "What am I missing?" | Assists creation. Stays in document scope. |
| Before pressing œ | "Is this ready?" / "What's weak?" | Pre-audit. Checks the box before Operate runs. |
| After pressing œ | "Explain this result" / "Why is the gap here?" | Post-audit. Walks through the three sentences. |
| Adding a new source | "What does this add?" / "How does this change the box?" | Shape-reads the new source in context of the box. |
| Feeling lost | "What should I do next?" | Names one next move based on box state. |

### Desktop AI access

- Seven panel: always visible at the bottom of the workspace, collapsed to one line
- Click to expand into a chat panel (right side or bottom)
- Keyboard shortcut: `Cmd+J` or `/` to open Seven instantly
- Seven always knows which source or assembly is active — context is automatic

### Mobile AI access

- Bottom bar: "Seven" button is always there
- Tap to open full-screen chat
- Seven automatically has context of the current source
- Swipe down to dismiss, return to source

---

## Source Switching — The Fix

### The Problem

Switching between sources inside a Box is too many steps. The user has to navigate away from what they're reading to find something else.

### Desktop

- Source sidebar is always visible on the left
- Click any source to switch instantly
- Current source is highlighted
- Drag to reorder
- Right-click for actions (rename, delete, move to staging)
- Assembly is always at the bottom of the source list, visually distinct

### Mobile

- "Sources" in the bottom bar opens a drawer
- Swipe between sources horizontally (like tabs)
- Or tap the drawer to see the full list
- Assembly is always the first item in the drawer

---

## Stage-Specific Behavior

### Think Stage (exploring, reading, listening)

**What the user does:** Reads sources. Asks Seven questions. Gathers material.

**What should be optimized:**
- Source switching must be instant
- Seven should proactively offer to summarize or shape-read new sources
- No pressure to create or seal — this is gradient 1–3

**Visible actions:** Add source · Switch source · Ask Seven
**Hidden actions:** œ button is visible but not emphasized

---

### Create Stage (staging, assembling, writing)

**What the user does:** Moves material into staging. Writes the assembly. Edits.

**What should be optimized:**
- Selecting text in a source and sending it to staging should be one action (highlight → "Add to staging")
- Assembly editor is the primary surface
- Seven can help with writing but stays document-scoped
- Source sidebar stays visible so user can reference while writing

**Visible actions:** Edit assembly · Add to staging · Ask Seven
**Hidden actions:** œ button becomes more prominent as assembly grows

---

### Operate Stage (diagnosing, sealing, rerouting)

**What the user does:** Presses œ. Reads the three sentences. Decides: seal, adjust, or reroute.

**What should be optimized:**
- œ result appears as a dedicated surface, not in chat
- The three sentences are visually distinct (△ □ œ)
- "Ask Seven to audit" is one button on the result surface
- "Draft receipt" is one button
- Returning to sources or assembly from the result is one click

**Visible actions:** Ask Seven to audit · Draft receipt · Back to assembly
**Hidden actions:** Shape/gradient diagnostics (available but not default)

---

## Quick Access Summary

Every screen, every state, the user should be able to:

| Action | Desktop | Mobile |
|---|---|---|
| Add a source | Sidebar: [+ Add] | Bottom bar: [+ Add] |
| Switch source | Sidebar: click | Bottom bar: [Sources] → tap |
| Ask Seven | Bottom panel or Cmd+J | Bottom bar: [Seven] |
| Run Operate | Header: [œ] | Header: [œ] |
| Switch Box | Header: [Switch Box ▾] | Menu: [≡] → Boxes |

Four actions. Always reachable. No hunting.

---

## What This Changes

The app stops being a tool you open and figure out. It becomes a workspace you return to. The difference:

- **Tool:** you come to it when you have a task. You leave when the task is done.
- **Workspace:** it remembers where you were. You pick up where you left off. The AI is already there. The sources are already there. You just keep going.

The seed file handles day one. The "open where you left off" rule handles every day after. Seven handles the moments between. œ handles the convergence.

Think. Create. œ. The user doesn't need to know the names. They just need the actions to be there when they need them.
