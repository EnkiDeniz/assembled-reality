# AR Foundation

**Status:** Definitive product foundation document
**Date:** April 2026

**Companion documents:**
- `docs/AR Version 2.md` — V2 product direction
- `docs/AR Version 2 Build Plan.md` — V2 build sequence
- `docs/convergence-foundations.md` — theoretical framework
- `docs/operator-sentences.md` — operator sentence specification

---

## 1. The Bet

Assembly Theory, developed by Lee Cronin and Sara Imari Walker, makes a precise claim: a complex object that exists in abundance is proof that a selection process with memory produced it. The assembly index of an object is the minimum number of construction steps from basic parts, with reuse of intermediates. Below a threshold, random processes suffice. Above it, something is remembering how to build and repeating the construction. That is what distinguishes noise from life.

The bet is that this applies to human activity.

A vacation that goes well, a project that ships, a decision that holds — these are assembled outcomes. Constructed from parts, through selection, with memory. The parts were scattered across emails, documents, conversations, and experience. The selection was human. The memory was accumulated over previous attempts. The outcome was real.

But there is no tool for this. People plan in Google Docs, execute from memory, and reflect in their heads. The construction pathway is lost the moment the outcome occurs. There is no assembly index. There is no receipt.

That is what we are building.

---

## 2. How It Works

Every core concept maps to Assembly Theory:

| Concept | In Assembly Theory | In AR |
|---|---|---|
| **Basic parts** | Atoms, molecular fragments | Blocks — a paragraph, heading, quote, or AI output |
| **Intermediate memory** | Stored substructures reused in later steps | The clipboard — blocks picked from multiple sources, persisted and visible |
| **The constructed object** | A complex molecule | The assembly — a new document built from selected, ordered blocks |
| **The assembly pathway** | The minimum construction steps | The receipt — every UPLOADED, LISTENED, SELECTED, EDITED, ASSEMBLED step logged |
| **Selection** | The process that pushes objects past the complexity threshold | The human — listening, picking, rejecting, editing, ordering |
| **Evolution** | Accumulated construction memory across generations | Plan → Live → Learn → Repeat — each cycle starts from what was learned |
| **The measurement** | The gap between random chemistry and living systems | The gap between what was planned and what actually happened |
| **External verification** | Peer-reviewed publication | GetReceipts — external registry where receipts become sealed, verifiable proof |

The receipt is more valuable than the document. The document is the intermediate. The receipt is the construction information — what was inspected, what was selected, what was assembled, what happened when it met reality. The document can be reconstructed from the receipt. The receipt cannot be reconstructed from the document.

The receipt schema maps to the convergence foundations: **prior state** (sources before selection), **action** (each log entry), **operator** (the governing rule — left empty by design, derivable later from receipt patterns), **evidence** (block lineage, timestamps, source tracking). The empty operator field is the most important design decision. It makes the system a reader of convergence, not an enforcer of doctrine.

---

## 3. The Threshold

Assembly Theory identifies a complexity threshold. Below it, random processes explain the object. Above it, selection with memory is required.

The same threshold exists for human projects.

**Below:** A grocery list. A quick email. A single-source summary. Ad-hoc methods — your brain, tabs, copy-paste — are sufficient.

**Above:** Synthesizing eight research papers. Planning a multi-leg trip from scattered confirmations and recommendations. Preparing for a board meeting from five reports and three conversations. Managing an immigration process across twelve forms.

Above the threshold, you need persistent intermediate memory, deliberate selection, construction pathway recording, and feedback from reality. AR exists for projects above the threshold.

---

## 4. The Front Door

The entry point is dead simple: **upload a document, press play, listen.**

People have PDFs they haven't read. Research they've been meaning to get to. Briefs they skimmed. The immediate value: this tool reads it to you block by block while you watch it flow.

But something happens naturally. You're listening. A block hits you. You tap "+". You didn't plan to start assembling. You just saved something that mattered. You keep listening. You tap "+" two more times. The clipboard has three blocks. You see "Assemble." You tap it. A new document appears, made from the three parts that mattered to you. The receipt was created in the background.

**The loop happened without the user knowing the loop exists.**

Then at some point they notice the built-in document on the shelf — "Assembled Reality." They press play out of curiosity. They start hearing operator sentences. "Friction is not failure. Friction is testimony." They tap "+". "Wipe the story. Keep the receipts." Plus. They're assembling the framework document using the framework's own tool.

That is the product teaching itself. The document explains the tool the user has already been using. The theory arrives after the experience, not before.

This means the product's first priority is making the simple version — listen, pick, build — feel flawless. Everything else is discovered through use.

---

## 5. Why This Exists

### Nobody reads anymore

People scan, skim, and ask AI to summarize. They judge documents by whether they sound credible — processing fluency without actual processing. The convergence foundations predicted this: compression increases believability, but believability is not validity.

The result: people assemble reality from parts they never touched. In Assembly Theory terms, they claim a high assembly index with a construction pathway of zero steps. The assembly is counterfeit.

### The tool forces genuine engagement

**Blocks force you to see the parts.** A wall of text can be skimmed. Discrete blocks cannot. You engaged with block 7, 12, 15, and 23. The receipt knows. The blocks you skipped are also data.

**Listening forces you to stay with the text.** It moves at its own pace. Block by block. The current block lights up. The next one waits. You cannot skip ahead without a deliberate action.

**Picking forces you to commit.** The "+" is not a bookmark. It is a selection event — "this block is going into my assembly." If you pick 3 out of 40, the receipt shows your ratio. Picking makes the quality of your reading measurable.

**The clipboard makes your gathering visible.** Six blocks from three sources. Is it enough? You can see the answer because the intermediate memory is exposed.

### The receipt is the anti-slop credential

In a world where most text is an unpaid invoice — a claim no one checked against reality — the receipt is the settlement. It proves: these sources were inspected, these blocks were selected, this assembly was built, it was taken into the real world, and here is what happened. A receipt on GetReceipts makes this externally verifiable.

---

## 6. The Anti-Chat Thesis

The entire AI industry builds tools that keep humans in the chair. The loop is human → AI → human → AI, and it never leaves the screen.

AR's thesis is the opposite. **The product succeeds when the user closes the laptop and goes outside.**

The assembly is the setup, not the finish line. The moment of value is not "I produced a document." It is "I took it into the meeting and something real happened." The receipt is proof you left the building.

- Notion is for organizing what you know
- ChatGPT is for generating what you might say
- AR is for assembling what you will actually do, doing it, and coming back with proof

The competition is not other tools. The competition is the chair.

**Leaving should feel like progress.** The transition from Plan to Live should be as designed as the transition from Upload to Assemble. "Your assembly is ready. Go do the thing."

**Unsettled assemblies are a signal.** An assembly without a receipt is an invoice reality hasn't answered. The product should gently surface this: "You built this plan three weeks ago and haven't returned with what happened. Is it still active?" Not guilt. A reading.

---

## 7. The AI That Reads Your Receipts

The current AI sends the document's blocks to an endpoint that summarizes or extracts. That is what every AI tool does.

What makes AR's AI different is what it should eventually read: the user's entire construction history.

ChatGPT resets between sessions. Claude knows persistent files but not outcomes. Notion AI sees the page, not the gap between plan and reality. None of them know what you planned last time, what happened, where the gap was, or what ghost operators are running in your construction process.

AR's AI should know all of this. Its context includes: current sources, current clipboard, current assembly, previous assemblies for similar projects, previous receipts and reflections, the gaps from previous cycles, and patterns across receipts.

With this, the AI can do things no other AI can:

- **"Your last two projects like this underestimated logistics. Your receipts show transit time was the gap both times."**
- **"This block has appeared in three assemblies and held up in all three receipts. It's load-bearing."**
- **"You're building a plan structurally similar to one that had a large gap in stakeholder communication."**
- **"You've been here 40 minutes and haven't selected anything. You may be square-stalled."**

The AI gets more useful not because the model improves, but because the receipt history deepens. A user with fifty receipts gets fundamentally better assistance than a user with two, because the AI has fifty cycles of evidence about what this user plans, what happens, and where the delta lives.

**The sacred boundary:** AI operates inside Plan and Learn. Reality operates inside Live. The AI cannot go into the meeting. It cannot take the trip. If the AI generates the receipt, the loop is self-sealing. The receipt is counterfeit. The human acts. Reality answers. The AI reads the return.

This conversation is itself an example. We assembled this document together across multiple passes — I proposed, you selected, corrected, and directed. The document got richer because your input carried construction information mine did not have. That is what the AI in AR should feel like: a construction partner working inside the project, not a chat window beside it.

---

## 8. Settlement Logic and the Echo Canon

The convergence foundations define settlement as the protocol that separates claims from evidence:

- **Invoice** — a declared expectation. The assembly is an invoice: "this is my plan."
- **Receipt** — evidence that reality answered. The reflection is a receipt: "this is what happened."
- **Coherence** — the reconciled state where the gap is visible and construction memory is updated.
- **Seal** — portable, verifiable closure. A receipt on GetReceipts is sealed.

The **Echo Canon** maps the healthy process cycle: **Triangle** (Aim) → **Square** (Measure) → **Circle** (Connect) → **Seal** (Closure) → repeat.

In AR: upload and orient (Triangle) → listen and inspect (Square) → select and assemble (Circle) → receipt and export (Seal). The Learn phase starts a new Triangle, standing on the previous seal.

**Stall patterns the product should eventually detect:**

- **Square-stalled** — listens and reads but never selects. Measurement without integration. The clipboard stays empty.
- **Triangle-stalled** — uploads repeatedly but never inspects. The shelf grows. Nothing is assembled.
- **Skip** — assembles from a single source without inspecting. Aim → Seal with no measurement. Low assembly index.

The instrument reads. The human decides.

---

## 9. The Product Hierarchy

| Layer | Role | Analogy |
|---|---|---|
| **Project** | Container for a real-world assembly — a trip, proposal, research synthesis | The repo |
| **Sources** | Raw inputs — uploaded files, notes, transcripts, AI material | Source files and dependencies |
| **Assembly** | The current build — shaped from sources, taken into the world | The app or build output |
| **Receipts** | The construction pathway — how the assembly was made and what happened after | Commits, deploy history, and postmortems combined |
| **Reflection** | The Learn phase — captures the gap between plan and outcome | The retrospective that feeds the next sprint |

---

## 10. Depth, Growth, and Operator Derivation

**Planar growth** — doing more of the same. Same structure, same gaps. The assembly index stays flat.

**Volumetric growth** — incorporating new information that forces the construction process to evolve. The fourth point — something the prior chain could not have generated. The assembly index deepens.

Over time, receipts reveal **operators** — compressed rules governing the user's construction behavior. **Authored operators** are explicit: "I always check reviews before booking." **Ghost operators** are implicit, visible only in the receipt chain: "This user consistently selects for caution but says they want to be bold." The gap between authored and derived operators is the most valuable diagnostic the system can eventually provide.

The data model must support this future: every step logged with context, operator fields left empty by design, receipt chains preservable across projects and time.

---

## 11. What We Are Not Building

- **Not a document editor.** Documents are the medium, not the product. The product is the assembled real-world outcome.
- **Not a note-taking app.** Notes store for retrieval. AR assembles for action. Library vs. workshop.
- **Not an AI writing tool.** AI proposes staged blocks. The human selects. The human is the assembler.
- **Not a project management tool.** PM tracks progress. AR tracks construction.
- **Not a journal.** Journals are unstructured. AR reflections are structured settlements — comparing a specific assembly against a specific outcome.

---

## 12. Development Principles

These are constraints from the framework, not preferences.

1. **Preserve lineage always.** Every block carries source, position, author, operation. Severed lineage is a counterfeit receipt.
2. **Receipt over document.** If forced to choose, enrich the receipt. It carries the construction information.
3. **Human selects, AI proposes.** Staged, not applied. The receipt must reflect the human's pathway.
4. **Empty fields are correct.** Do not force articulation. Empty enables future derivation.
5. **Pebbles over breadcrumbs.** localStorage is perishable. Database records are better. GetReceipts is durable.
6. **Simplify before extending.** Each layer must be trustworthy before the next is added.
7. **Measure the gap, don't hide it.** A visible gap is a genuine receipt. An invisible gap is a counterfeit seal.
8. **Build for return.** The return from reality is the most important moment. If it's friction-heavy, the loop breaks.

---

## 13. What Success Looks Like

1. Import scattered source material
2. Listen to it block by block
3. Pick the parts that matter
4. Assemble a plan, brief, or artifact
5. Take it into the real world
6. Return with what happened
7. See the gap, tied to specific blocks and decisions
8. Preserve the construction pathway as a sealed receipt
9. Start the next cycle from what was learned
10. Over many cycles, see patterns in construction behavior

Steps 1–4 exist today. Steps 5–10 are the work ahead.

The product succeeds when the loop is real — when a user has gone through Plan → Live → Learn at least twice and can see their construction process improving. That is the moment the receipt becomes more valuable than the document. That is the moment the user is assembling reality.

---

## 14. The Name

Assembled Reality is not a metaphor. It is the thesis.

Reality is assembled. Every complex outcome in life was constructed from parts, through selection, with memory. The construction pathway exists whether or not anyone records it.

What we are building is the instrument that makes the assembly visible, the pathway durable, and the learning transferable.

> *Assembly is the universe's word for life.*

The assembly authored its own manual. We are making it legible.
