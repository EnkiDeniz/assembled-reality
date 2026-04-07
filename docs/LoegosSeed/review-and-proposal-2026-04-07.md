# Assembled Reality: Review and Proposal

## Part 1: What This Project Actually Is

After reading every component, every CSS rule, and every API route, here is my understanding of the vision — corrected for the framing you gave me.

**Assembled Reality is not a document editor. It is a workbench for assembling real-world outcomes.**

The analogy: Cursor is to code what AR is to real life. Cursor helps you assemble working software from scattered context (docs, errors, patterns, AI suggestions). AR helps you assemble working plans, decisions, and actions from scattered material (PDFs, notes, research, voice memos). And just as GitHub tracks what happened to code (who changed what, when, why), GetReceipts tracks what happened in reality — what you planned, what you tried, what actually occurred, and what the gap was.

The core loop is not "read and write documents." The core loop is:

```
PLAN (assemble material into actionable form)
  → LIVE (take it into the real world — the meeting, the trip, the project)
  → LEARN (come back, document what actually happened, close the gap)
  → repeat
```

Documents are the medium, not the product. The product is *a real thing that happened in the real world*, with visible lineage from intention to outcome.

---

## Part 2: What the Current Experience Gets Right

### 2.1 The Block Model Is the Right Abstraction

The decision to decompose documents into blocks — each with a kind, author, source, operation, and position — is architecturally correct for this vision. Blocks are the atoms of assembly. They let you:

- Pull a paragraph from a research paper, a checklist from a project plan, and an AI summary into the same workspace
- See where every piece came from (source lineage)
- Know whether a human wrote it, AI generated it, or it was edited after import

This maps directly to real-world assembly. When you plan a vacation, you pull a flight confirmation from email, a hotel recommendation from a friend's message, a packing list from last year, and a restaurant shortlist from a review site. Blocks are how those things become composable.

The implementation is solid: `normalizeWorkspaceBlock()` in `document-blocks.js` handles the full normalization pipeline. Every block gets a stable ID (`documentKey:section:position`), author tracking, operation type, and edit history. The `buildWorkspaceBlockLineage()` function in `workspace-receipts.js` can reconstruct the full provenance chain of any assembled document. This is well-engineered.

### 2.2 The Receipt System Is the GitHub of Real Life

The receipt system is the most conceptually original part of the product. Most productivity tools treat the output as the end. AR treats the output as a waypoint and the receipt as the accountability layer.

`buildWorkspaceReceiptPayload()` captures:
- **Aim**: What you were trying to do
- **Tried**: What operations you performed (curated N blocks from M sources)
- **Outcome**: What the assembled output contains
- **Learned**: What the lineage tells you
- **Decision**: What happens next

This is a retrospective framework baked into the tool. It is not journaling. It is structured reflection with evidence — every receipt links back to the specific blocks, operations, and log entries that shaped it. The `LOG_ACTION_COLORS` system (UPLOADED, LISTENED, SELECTED, EDITED, ASSEMBLED, AI_QUERY, AI_RESULT, RECEIPT) creates a visible timeline of how you worked, not just what you produced.

The integration with GetReceipts as a remote store means receipts can live outside the tool — they become portable proof of work, decision-making, and learning.

### 2.3 Listening as a First-Class Interaction

The TTS implementation is not an afterthought. The player bar (`PlayerBar` component, line 815) provides:
- Block-scoped playback with auto-advance
- Multi-provider fallback (ElevenLabs → OpenAI → device speech)
- Rate control (0.75x to 2x) persisted across sessions
- Visual sync (currently playing block gets `is-playing` highlight, next block gets `is-next`)

The `playSequenceFromIndex()` function (line 1454) handles the full lifecycle: fetch audio → create blob URL → play → listen for `ended` event → advance to next block → clean up. It respects document boundaries, handles rate changes mid-playback, and logs every LISTENED event to the receipt trail.

This is important because many people absorb material better through audio than reading. For the "plan a vacation" use case: you can listen through your assembled travel plan while packing, rather than switching between tabs.

### 2.4 The Visual Design Is Cohesive

The "calm editorial terminal" aesthetic — monospace everywhere, dark background, semantic color accents — creates a focused environment. The color system is well-considered:

- **Cyan** (#06b6d4) = your active selection/editing (the human hand)
- **Amber** (#f59e0b) = AI-generated content (pending human approval)
- **Green** (#22c55e) = accepted, connected, ready (the system affirming)
- **Purple** (#a78bfa) = AI interface elements (the AI prompt, presets)

This gives you instant visual literacy: green stripe = this is real. Amber stripe = AI proposed this, you haven't approved it. Cyan stripe = you're actively touching this. You can scan a document and immediately know what's settled vs. what's pending.

### 2.5 AI as Collaborator, Not Replacement

The AI bar (line 634) offers four presets — extract, summarize, synthesize, evidence search — and produces *staged* blocks that sit in a separate "AI staging" section of the clipboard. The user must explicitly accept each block (or batch-accept) before it enters the clipboard and can be assembled.

This is the right power dynamic for a tool about authorship and provenance. If AI could silently modify your assembled output, the receipt system would be meaningless — you couldn't trust that the lineage was real.

---

## Part 3: Where the Experience Falls Short

### 3.1 The Intro Explains the Tool, Not the Outcome

The 7-step intro carousel (`IntroLanding.jsx`) walks through:
1. "You've got stuff everywhere"
2. "We turn documents into pieces"
3. "Listen instead of reading"
4. "Keep the parts that matter"
5. "Assemble something new"
6. "Live it. Then come back"
7. "Plan it. Live it. Learn from it."

Every step describes a *feature* of the tool. None of them show a *real outcome*. The user learns mechanics but never feels the payoff. Step 6 ("Live it. Then come back") is the most important step — it's the entire reason the tool exists — and it gets the least concrete treatment.

**The problem:** A user finishes the intro knowing *how blocks work* but not *why they should care*. They understand the tool but not the transformation.

**Compare to Cursor:** Cursor doesn't explain "we parse your code into an AST, then we send context to an LLM." It shows you: type a question, get working code. The mechanism is invisible. The outcome is immediate.

### 3.2 The Workspace Assumes You Already Know What You're Doing

When you land in the workspace for the first time, you see:
- A header bar ("Document Assembler")
- A launchpad with Continue/Upload/Latest Assembly cards
- A recent documents list
- Stats (sources, assemblies, total docs)

But there is no guidance on what to do first. The launchpad tagline — "Compile source material into something you can actually use in life" — is good copy, but it is abstract. The user has to already understand the loop to know that "Upload → Listen → Pick → Build → Live → Learn" is the workflow.

Once you open a document, the interface shows: shelf (left rail of documents), toolbar (DOC/LOG/EDIT/AI tabs), a content surface of blocks, a player bar at the bottom, and (conditionally) a clipboard tray and AI bar. That is 5-6 simultaneous UI regions. There is no progressive disclosure — everything appears at once.

**The problem:** The workspace is designed for the 10th session, not the 1st session. A power user who has internalized the loop will find this efficient. A first-time user will feel like they opened a cockpit and don't know which lever to pull.

### 3.3 "Live" and "Learn" Have No Surface in the Product

The intro promises a complete loop: Plan → Live → Learn. But the current workspace only supports the Plan phase (upload, listen, pick, build). The Live and Learn phases — taking the assembled output into the real world and returning with what happened — have no dedicated interface.

Right now, "Live" means: leave the app. "Learn" means: come back and... what? Upload a new document? Edit the assembly? Create a receipt manually?

The receipt system *could* serve as the Learn interface, but receipts are currently tucked behind the LOG tab and require the user to click "Draft receipt." There is no prompt to reflect, no structured way to capture "here's what I planned vs. what actually happened," and no way to document the gap between intention and outcome without manual effort.

**The problem:** The most philosophically important part of the loop — the part that makes this more than a document editor — is the least supported by the interface.

### 3.4 Assembly Output Is Concatenation, Not Composition

When you hit "Assemble" in the clipboard tray, the system:
1. Prompts for a title (`window.prompt()`)
2. Sends blocks to `/api/workspace/assemble`
3. Creates a new document with the blocks in clipboard order
4. Generates a receipt draft

The resulting document is the blocks placed end-to-end. There is no connective tissue — no transitions, no framing, no argument structure. For many real-world assembly tasks (writing a trip itinerary, building a project brief, preparing meeting notes), the user needs more than concatenation. They need the *relationships between blocks* to be articulated.

**The problem:** The assembly output feels like a playlist, not a composition. The blocks are arranged but not woven together.

### 3.5 The Clipboard Tray Is Spatially Awkward

The clipboard tray (`ClipboardTray` component, line 690) appears at the bottom of the workspace, between the content surface and the player bar, only when blocks are selected. It contains reorder controls (up/down arrows), remove buttons, source labels, and text previews — all in a compact grid layout.

On mobile, the grid collapses to single-column (`@media max-width: 820px`), making reordering painful. On desktop, the tray competes for vertical space with the content surface and the player bar. When the AI bar is also open, the visible content area shrinks dramatically.

**The problem:** The clipboard is the most important work-in-progress surface (it holds the fragments of your assembly), but it is treated as a secondary panel that appears and disappears. It should feel like a first-class workspace, not a notification drawer.

### 3.6 No Multi-Document Side-by-Side

The shelf (horizontal document tabs) lets you switch between documents, but you can only view one document at a time. For synthesis work — the core use case — you often need to compare two sources, or view a source alongside your in-progress assembly. The current design requires constant tab-switching.

### 3.7 The "/" Shortcut for AI Is Undiscoverable

The `handleKeyDown` effect (line 1103) binds "/" to open the AI bar. This is a great power-user shortcut (borrowed from Cursor's command palette), but there is no visual hint that it exists. The AI button in the toolbar says "AI" — it doesn't mention "/". The intro doesn't mention it. The launchpad doesn't mention it. A user could use the tool for weeks without discovering it.

---

## Part 4: Proposal — What I Would Change

The proposals below are ordered by impact. The first three address the deepest UX problems. The rest are refinements.

### Proposal 1: Replace the Intro Carousel with a Guided First Assembly

**What:** Remove the 7-step slide deck. Replace it with a hands-on walkthrough that takes the user through their first complete loop in under 3 minutes.

**How it works:**
1. The user signs in and lands in a workspace pre-loaded with 2-3 short source documents (e.g., a sample travel research PDF, a friend's restaurant recommendations, a packing checklist).
2. A small coach overlay (not a modal — a 1-2 line prompt anchored to the relevant UI element) says: "Press play to listen to this document." The user presses play, hears a block, sees it light up.
3. The coach says: "Tap + on a block to save it to your clipboard." The user taps +, sees the clipboard tray appear with their first block.
4. The coach says: "Open the next source and pick something from there too." The user switches documents, picks another block.
5. The coach says: "Hit Assemble. You just built a new document from two sources." The user assembles, sees their new document appear on the shelf with full lineage.
6. The coach says: "This is your plan. Now go do the thing. When you come back, we'll help you capture what actually happened." (Seed the Learn phase)

**Why this is better:** The user *does* the loop instead of reading about it. They experience the payoff (a new document assembled from multiple sources) before they have to understand the vocabulary (blocks, receipts, lineage). The guided assembly takes ~2 minutes and produces something real.

**Implementation:** A new `GuidedFirstRun` component that wraps the existing workspace with a thin coach layer. Uses localStorage to track whether the user has completed the first run. The coach positions itself relative to the target element using refs and a small absolute-positioned tooltip. No modal, no overlay that blocks interaction — just a directional hint.

### Proposal 2: Build the "Learn" Surface — Post-Action Reflection

**What:** Add a structured reflection flow that appears when the user returns to the workspace after taking their assembled plan into the real world.

**How it works:**
1. When the user opens an assembly they've previously created, a gentle prompt appears: "You built this plan. How did it go?" with three options: "It went as planned" / "Some things changed" / "It didn't work out."
2. Choosing "Some things changed" or "It didn't work out" opens a lightweight reflection form:
   - **What happened?** (free text, 2-3 sentences)
   - **Which parts held up?** (the user can tap blocks in the assembly to mark them as "held" or "missed")
   - **What would you change?** (free text)
3. This generates a receipt automatically, with the reflection linked to the original assembly's lineage. The receipt captures the gap between plan and outcome.
4. The reflection can optionally create a new assembly pre-seeded with the "held" blocks, so the user can iterate.

**Why this matters:** This is the feature that turns AR from a document tool into a real-life operating system. The Learn phase is where the loop closes. Without it, the tool produces plans but never captures whether those plans worked. With it, every receipt tells a story: what was intended, what was tried, what happened, and what changed.

**Implementation:** A new `ReflectionFlow` component that triggers when viewing an assembly. State tracked per-document in localStorage and persisted server-side on the assembly record. Reflection entries become log entries (action: REFLECTED) and get bundled into receipt payloads. The block-level "held/missed" marking uses the existing `is-selected` pattern with a new `is-held` / `is-missed` visual treatment.

### Proposal 3: Make the Clipboard a Persistent Side Panel

**What:** Move the clipboard from a collapsible bottom tray to a persistent right-side panel (on desktop) or a swipeable sheet (on mobile).

**How it works:**
- **Desktop:** The workspace becomes a three-column layout: shelf (narrow left) / document (center) / clipboard (right, ~280px). The clipboard is always visible when blocks are selected, and collapses to a thin rail with a block count badge when empty.
- **Mobile:** The clipboard becomes a bottom sheet that can be swiped up to full height. A persistent "clipboard: N blocks" tab sits above the player bar.

**Why this is better:** The clipboard is where assembly happens. It deserves screen real estate proportional to its importance. The current implementation hides it until blocks are selected and then squeezes it between the content surface and the player bar. Making it a persistent panel means the user can see their growing assembly while browsing source documents — the two things they need to see simultaneously.

**Implementation:** Restructure the workspace layout from the current flex-column to a CSS grid:
```
grid-template-columns: 220px minmax(0, 1fr) 280px;
grid-template-rows: auto auto minmax(0, 1fr) auto auto;
```
The clipboard panel gets its own grid column. On screens narrower than 1100px, collapse to the bottom-sheet pattern. The player bar spans full width at the bottom.

### Proposal 4: Add an "AI Stitch" Operation for Assembly

**What:** Add a post-assembly AI operation that generates connective tissue between blocks — transitions, framing sentences, section headers — while preserving the original blocks intact.

**How it works:**
1. After assembling a document, a new button appears in the toolbar: "Stitch."
2. Clicking it sends the assembled blocks to the AI with a prompt like: "These blocks were assembled from multiple sources. Generate brief transition sentences between blocks where the topic or source changes. Do not modify the original blocks."
3. The AI returns interstitial blocks (marked as `author: ai`, `operation: stitched`) that are inserted between existing blocks.
4. The user can accept, edit, or remove each stitch block independently.

**Why this matters:** This bridges the gap between "playlist" and "composition." The original blocks maintain their lineage. The stitch blocks are clearly marked as AI-generated. The receipt trail shows exactly which blocks are original and which are connective tissue.

### Proposal 5: Add a "Compare" View for Two Documents

**What:** Allow the user to view two documents side by side.

**How:** Double-click a document in the shelf (or drag it) to open it in a split view. The left pane shows one document, the right pane shows another. The user can pick blocks from either side. The clipboard sits between them (or below).

This directly supports the core synthesis workflow: "I have research from Source A and notes from Source B. I need to see both to decide what to assemble."

### Proposal 6: Surface the "/" Shortcut and Other Keyboard Bindings

**What:** Add a small keyboard hint in the player bar or toolbar that says "/ for AI" and make the first AI interaction feel guided.

**How:** When the AI bar is closed, the AI button reads `AI /` instead of just `AI`. First time the user opens the AI bar, a one-line hint appears: "Try 'summarize' or 'extract' to get started." The hint disappears after the first AI operation.

### Proposal 7: Contextual Receipts — Show Provenance Where It Matters

**What:** Instead of requiring the user to switch to the LOG tab to see receipts, show block-level provenance inline.

**How:** When hovering or tapping the block metadata line (currently shows position, source, operation), expand a small card showing:
- Source document name and link
- When it was imported
- Whether it's been edited since import
- If it's in an assembly: which assembly and what position

This makes receipts feel like a natural part of working with blocks, not a separate reporting mode.

### Proposal 8: Real-World Templates

**What:** Provide starter templates for common real-world assembly tasks that make the concept immediately concrete.

**Examples:**
- **Trip Planning:** Pre-loaded with empty sections (flights, accommodation, activities, packing) and a prompt: "Upload your confirmations, recommendations, and research."
- **Meeting Prep:** Sections for agenda, background reading, key questions, and a reflection template for after the meeting.
- **Project Brief:** Sections for goals, constraints, research, and decisions.
- **Weekly Review:** A reflection-first template that asks "What was planned? What happened? What's next?"

**Why:** Templates answer the question "what do I do with this tool?" before the user has to figure it out. They also demonstrate the full loop: plan → live → reflect.

---

## Part 5: Priority and Sequencing

If I were implementing these, the order would be:

| Priority | Proposal | Effort | Impact |
|----------|----------|--------|--------|
| 1 | Guided First Assembly (replace intro) | Medium | Very High — fixes first-session abandonment |
| 2 | Learn Surface (reflection flow) | Medium | Very High — completes the loop, differentiates from every other doc tool |
| 3 | Persistent Clipboard Panel | Medium | High — fixes the assembly ergonomics |
| 4 | Real-World Templates | Low | High — makes the concept instantly tangible |
| 5 | AI Stitch | Low-Medium | Medium — improves assembly quality |
| 6 | "/" Shortcut Discovery | Low | Medium — low-hanging UX fruit |
| 7 | Contextual Receipts | Medium | Medium — makes receipts feel native |
| 8 | Compare View | High | Medium — nice-to-have for power users |

---

## Part 6: The Bigger Picture

The strongest thing about this project is the philosophical frame: **documents are not the product, real-world outcomes are the product, and the gap between plan and outcome is where learning lives.**

No other tool I know of treats this gap as a first-class concept. Todo apps track completion. Note apps track content. Project tools track progress. But none of them say: "You planned X, you did Y, here's the delta, and here's what you learned." That's what the receipt system does — and it's what makes AR genuinely novel.

The risk is that the current experience communicates the *mechanism* (blocks, assembly, receipts) without communicating the *meaning* (your plans meet reality, and the tool helps you navigate that gap). The proposals above are all aimed at one thing: making the meaning visible from the first interaction.

Think of it this way: Cursor doesn't succeed because it has a good code editor. It succeeds because the first time you use it, you type a question and get working code — and you think "I can build things faster with this." AR needs the same moment: the first time you upload two documents, pick the parts that matter, assemble a plan, take it into the real world, and come back to see what held up — that's when the user thinks "I can *do things* better with this."

The tool is ready for that moment. The UX just needs to clear the path to it.
