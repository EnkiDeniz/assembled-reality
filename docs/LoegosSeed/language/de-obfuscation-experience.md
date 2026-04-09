# The De-obfuscation Experience  
**Status:** Product experience spec **Date:** April 6, 2026 **Author:** Deniz Sengun / Cloud (Claude) **Context:** The moment when the user sees the coordination code running underneath their prose. The transition from word processor to coordination IDE.  
  
## The Idea  
The user writes in natural language. They type sentences the way they always have. Then they press Operate. The prose reveals its hidden coordination structure. Flagged words surface first — the red deadlines, the unsupported claims, the vague consensus language. Deeper inference is available on inspection. The user is no longer reading a document. They are reading the diagnostic output of their own coordination.  
This is the de-obfuscation moment. The curtain pulls back. The code was always running underneath. Now you can see it.  
  
## Why It Matters  
Most coordination fails because of a red word nobody noticed was red.  
A sentence like "We will launch the prototype on Friday" looks fine in a Google Doc. It looks fine in Slack. It looks fine in an email. There is nothing visually wrong with it. But "Friday" has no evidence behind it. No calendar invite. No dev log. No confirmation from the person who has to do the work. The word is red. Nobody sees it because no tool shows them.  
Lœgos shows them.  
The de-obfuscation experience turns the act of reading a sentence into the act of debugging a coordination program. The user doesn't have to "feel" that something is wrong. The compiler shows them exactly where the null reality exception is.  
  
## Reveal Modes  
Four interaction states. Each progressively deeper.  
## Mode 1: Write (default)  
The user sees plain prose. No annotations. No shapes. No signals. Just their words on the screen, in a clean editor with a gutter showing block numbers.  
This is the word processor. Comfortable. Familiar. The user writes freely.  
```
001  We will launch the prototype on Friday.
002  Melih confirmed he can review it.
003  The funding question is still open but
     we're proceeding anyway.
004  Cost estimate was verified last week.

```
No color. No shapes. Just text.  
## Mode 2: Operate (the reveal)  
The user presses Operate. The prose transforms at the block level. Shape glyphs appear in the gutter. Only flagged words — red and amber — are highlighted in the text. Green words stay normal. The eye goes to the problems, not the passing grades.  
Operate defaults to block-level structure plus flagged words. Not full forensic annotation of every word. The user sees where the problems are without the screen becoming a Christmas tree.  
```
GUTTER          CONTENT
─────────────── ────────────────────────────────────────

001 △ amber     We will △launch the □prototype on 𒐛Friday.
    ⚠ WARN                                        ● RED
    Friday: no  
    evidence    
                
002 □ green     □Melih □confirmed he can □review it.
    ✓ CLEAR                    ● GREEN
    L2 trust    
    (email)     
                
003 œ red       The □funding question is 𒐛still open but
    ✕ BLOCK     we're œproceeding anyway.
    2 red words                ● RED    ● RED
    no reality  
    for proceed 
                
004 □ green     □Cost □estimate was 𒐛verified □last □week.
    ✓ CLEAR                        ● GREEN
    L3 trust    
    (document)  

```
The transformation is instant. The words don't change. The view changes. The user sees what the compiler sees.  
## Mode 3: Hover (spot-check)  
When the user hovers over or selects a single block, that block's annotations appear. The rest stays clean. For experienced users who want to spot-check without running full Operate.  
## Mode 4: Inspect (full diagnostic)  
The user clicks a flagged word or a gutter glyph. The inference receipt opens — the full reasoning chain. Why this shape was assigned. What evidence was checked. What's missing. What the user can do. This is opt-in depth. The user pulls the detail; the system doesn't push it.  
Full word-level annotation of every word in a block is available here for advanced users. But it is never the default Operate view.  
  
## Word-Level Annotation: Worked Examples  
## Example 1: The Hidden Red  
**Write mode (what the user typed):**  
Ship working prototype to Melih by Friday.  
Ship working prototype to Melih by Friday.  
**Operate mode (what the compiler sees):**  

| Word | Shape | Signal | Why |
| --------- | ----- | ------- | ----------------------------------------------------------------------------------------------------------- |
| Ship | △ | amber | Intention declared but action not yet taken |
| working | □ | green | Prototype exists and functions (photo evidence in sources) |
| prototype | □ | green | The object exists (L2, screenshot attached) |
| to | œ | neutral | Connector — no claim |
| Melih | □ | green | Person confirmed available (L2, email) |
| by | œ | neutral | Connector — no claim |
| Friday | 𒐛 | red | Deadline. No calendar event. No confirmation of timeline from engineering. No delivery mechanism specified. |
  
**What the user sees:**  
Six words are fine. One word is red. Friday.  
The diagnostic says: "No evidence found for this timeline. No calendar event, no engineering confirmation, no delivery plan. This deadline is an ungrounded seal."  
**What the user does:**  
**What the user does:**  
They click Friday. The IDE shows: "Add reality to resolve. Options: create calendar event, get engineering confirmation, or recast deadline."  
They add a calendar invite as a source. Friday turns from red to amber. They get Melih's email confirmation of the date. Friday turns from amber to green. The sentence compiles.  
**The lesson:** The user didn't "feel" that Friday was risky. The compiler showed them. Now they know: deadlines without evidence are red words. They'll notice this pattern next time.  
  
## Example 2: The Echo  
**Write mode:**  
We're aligned on the strategy. The team agrees with the direction.  
We're aligned on the strategy. The team agrees with the direction.  
**Operate mode:**  

| Word | Shape | Signal | Why |
| --------- | ----- | ------ | ----------------------------------------------------------------- |
| aligned | œ | amber | Weld word — claims convergence |
| strategy | △ | amber | Aim word — but which strategy? No specific aim block referenced |
| team | □ | amber | Reality word — but which team members? No individual confirmation |
| agrees | œ | amber | Weld word — claims convergence |
| direction | △ | amber | Aim word — same as "strategy," no additional specificity |
  
**Diagnostic:**  
```
⚠ SHADOW TYPE: "aligned" and "agrees" are two weld words 
  claiming the same convergence. This may be an echo — 
  the same claim stated twice without additional evidence.

⚠ WEAK REALITY: "team" has no provenance. Who specifically 
  agreed? No individual confirmations in sources.

⚠ DUPLICATE AIM: "strategy" and "direction" appear to 
  reference the same aim with different words. Consolidate 
  or specify.

```
**What the user sees:**  
No red words — but no green words either. The entire sentence is amber. It looks like progress but nothing is grounded. The diagnostic explains: you said the same thing twice with different words, and nobody specific confirmed it.  
**What the user does:**  
They realize: this sentence is the coordination equivalent of an untested function. It compiles syntactically but does nothing verifiable. They need to replace "the team agrees" with specific names and specific confirmations. They need to replace "the strategy" with the actual aim block it refers to.  
**The lesson:** Vague consensus language is all-amber. It looks active but proves nothing. The compiler can't distinguish agreement from assumption without evidence.  
**The lesson:** Vague consensus language is all-amber. It looks active but proves nothing. The compiler can't distinguish agreement from assumption without evidence.  
  
## Example 3: The Clean Compile  
**Write mode:**  
Prototype shared with Melih. Feedback received. Three alignment points confirmed.  
**Operate mode:**  
**Operate mode:**  

| Word | Shape | Signal | Why |
| --------- | ----- | ------- | -------------------------------------------------------- |
| Prototype | □ | green | Object exists (L2, screenshot) |
| shared | △ | green | Action completed (L2, send confirmation email) |
| with | œ | neutral | Connector |
| Melih | □ | green | Person confirmed (L3, direct feedback received) |
| Feedback | □ | green | Evidence exists (L3, Melih's actual response in sources) |
| received | 𒐛 | green | Closure — the exchange completed |
| Three | □ | green | Specific count (verifiable against feedback content) |
| alignment | œ | green | Convergence claimed AND supported by evidence |
| points | □ | green | Specific items (traceable in the feedback source) |
| confirmed | 𒐛 | green | Sealed — the claim is grounded |
  
**Diagnostic:**  
```
✓ ALL CLEAR
  Convergence: 100%
  Trust floor: L3
  Depth: 3 (proved — multi-source, Operate-survived)
  
  SEAL PREFLIGHT
  ✓ Weld exists (aim met reality)
  ✓ Convergence ≥ 70% (currently 100%)
  ✓ Trust ≥ L2 (currently L3)
  ✓ Depth ≥ 3 (currently 3)
  
  → Ready to seal. [Seal this block]

```
**What the user sees:**  
All green. Every word grounded. The seal button activates.  
**The lesson:** This is what a compiled coordination sentence looks like. Every claim backed by evidence. Every weld supported by both sides. The user now has a visual reference for "done."  
  
## Example 4: The Contradiction  
**Write mode:**  
Budget approved. Funding gap remains $40K.  
Budget approved. Funding gap remains $40K.  
**Operate mode:**  
**Operate mode:**  

| Word | Shape | Signal | Why |
| -------- | ----- | ------ | ------------------------------------------------------------------- |
| Budget | □ | red | Contradicted — |
| approved | 𒐛 | red | Seal word, but the next clause contradicts it |
| Funding | □ | red | Evidence shows gap exists |
| gap | □ | red | Direct evidence of shortage |
| remains | 𒐛 | red | Seal word — sealing the problem, not the solution |
| $40K | □ | amber | Specific number (verifiable), but the number contradicts "approved" |
  
**Diagnostic:**  
```
✕ CONTRADICTION DETECTED

  Block 1: "Budget approved" (𒐛 seal claim)
  Block 2: "Funding gap remains $40K" (□ reality)
  
  These two claims cannot both be true. Either the budget 
  was approved (and the gap is resolved) or the gap remains 
  (and the budget is not fully approved).
  
  SUGGESTED RECAST:
  → Split into two blocks:
    001 □ "Budget partially approved. $40K gap remains."
    002 △ "Next move: identify funding source for $40K."
  
  Or resolve the contradiction:
  → Add evidence that the gap has been covered.

```
**What the user sees:**  
Almost everything is red. The compiler caught something the user's own language was hiding: two contradictory claims in the same sentence, spoken as if they were compatible.  
**The lesson:** Natural language tolerates contradiction. Coordination code doesn't. The compiler surfaces what the prose obscures.  
**The lesson:** Natural language tolerates contradiction. Coordination code doesn't. The compiler surfaces what the prose obscures.  
  
## The Override: Force-Green  
Sometimes the user knows something the system doesn't. The evidence isn't in the box but the user has firsthand knowledge. They can force-green a red word.  
**How it works:**  
**How it works:**  
1. User clicks a red word.  
2. Diagnostic panel shows: "No evidence found for [word]."  
3. User clicks "Override — I have direct knowledge."  
4. System prompts: "Add a witness note explaining your basis."  
5. User types: "I confirmed the timeline verbally with the engineering lead."  
6. Word turns from red to green.  
**What the system records:**  
```
Block 005, Word "Friday"
  Signal: green (manual override)
  Trust: L1 (witness note, no external evidence)
  Override note: "Verbal confirmation from engineering lead."
  Overridden by: Deniz Sengun
  Timestamp: 2026-04-06T11:30:00Z

```
**What the seal preflight shows:**  
```
SEAL PREFLIGHT
  ✓ Weld exists
  ✓ Convergence ≥ 70%
  ⚠ Trust floor: L1 (1 manual override without external evidence)
  ✓ Depth ≥ 3

  WARNING: This seal contains 1 manually overridden word.
  The override is recorded but not externally verified.
  Proceed with seal? [Seal with override] [Add evidence first]

```
**The principle:** The user can suppress any warning. The system lets them. But the receipt remembers. A seal with overrides is still a seal — but it's an honest one. The override is part of the provenance chain. Anyone reading the receipt later can see exactly which claims were evidence-backed and which were manually asserted.  
This is the difference between deleting a compiler warning and actually fixing the bug. You can ship with warnings. But the build log shows them.  
  
## Click to Inspect: The Inference Receipt  
Every annotation is a claim made by Seven. Every claim should be inspectable. When the user clicks a word or block, they see the full reasoning — not just the label but the evidence chain that produced it.  
## Word-Level Inspection  
Click any annotated word. A diagnostic card appears:  
**Example: clicking "Friday" (red)**  
**Example: clicking "Friday" (red)**  
```
┌─────────────────────────────────────────────────┐
│ WORD DIAGNOSTIC                                  │
│                                                  │
│ "Friday"                                         │
│ ─────────────────────────────────────────────── │
│ Assigned shape:  𒐛 seal (deadline / closure)     │
│ Assigned signal: ● red                           │
│ Position:        7 / 7 (arrive)                  │
│                                                  │
│ WHY 𒐛 SEAL                                      │
│ "Friday" is a temporal boundary word.            │
│ Temporal boundaries are 𒐛-class (closed set).    │
│ Assignment: deterministic (Priority 1).          │
│                                                  │
│ WHY RED                                          │
│ Checked 13 sources in this box:                  │
│  ✕ No calendar event found for Friday            │
│  ✕ No engineering confirmation of timeline       │
│  ✕ No delivery mechanism specified               │
│  ✓ Melih confirmed availability (but not date)   │
│                                                  │
│ Evidence needed: 1 source confirming this date.  │
│                                                  │
│ ──────────────────────────────────────────────── │
│ [Add evidence]  [Override]  [Recast shape]       │
└─────────────────────────────────────────────────┘

```
**Example: clicking "Melih" (green)**  
```
┌─────────────────────────────────────────────────┐
│ WORD DIAGNOSTIC                                  │
│                                                  │
│ "Melih"                                          │
│ ─────────────────────────────────────────────── │
│ Assigned shape:  □ reality (person / evidence)   │
│ Assigned signal: ● green                         │
│ Position:        5 / 7 (maintain)                │
│                                                  │
│ WHY □ REALITY                                    │
│ "Melih" is a proper noun (person name).          │
│ Person names are □-class evidence.               │
│ Assignment: lexical inference (Priority 2).      │
│                                                  │
│ WHY GREEN                                        │
│ Checked 13 sources in this box:                  │
│  ✓ Email from Melih confirming availability      │
│    Source: "Melih Friday email"                   │
│    Trust: L2 (provenance: email thread)           │
│    Added: Apr 3, 2026                            │
│  ✓ Feedback message received from Melih          │
│    Source: "Melih prototype feedback"             │
│    Trust: L3 (identified person, direct reply)    │
│    Added: Apr 4, 2026                            │
│                                                  │
│ 2 independent sources confirm. Trust: L3.        │
│                                                  │
│ ──────────────────────────────────────────────── │
│ [View source]  [View source]                     │
└─────────────────────────────────────────────────┘

```
**Example: clicking "aligned" (amber, shadow type)**  
```
┌─────────────────────────────────────────────────┐
│ WORD DIAGNOSTIC                                  │
│                                                  │
│ "aligned"                                        │
│ ─────────────────────────────────────────────── │
│ Assigned shape:  œ weld (convergence claim)      │
│ Assigned signal: ● amber                         │
│ Position:        4 / 7 (amplify)                 │
│                                                  │
│ WHY œ WELD                                       │
│ "aligned" is a relational verb claiming          │
│ convergence between two parties.                 │
│ Assignment: lexical inference (Priority 2).      │
│                                                  │
│ WHY AMBER (not green)                            │
│ The weld claims convergence but:                 │
│  ⚠ No specific △ aim block referenced            │
│  ⚠ No specific □ reality block referenced        │
│  ⚠ "team" has no individual confirmations        │
│                                                  │
│ A weld requires both aim and reality in scope.   │
│ This weld has neither specified.                 │
│                                                  │
│ ⚠ SHADOW TYPE WARNING                            │
│ "aligned" and "agrees" (word 8) both claim       │
│ the same convergence. Possible echo —            │
│ same claim stated twice without new evidence.    │
│                                                  │
│ ──────────────────────────────────────────────── │
│ [Add aim reference]  [Add evidence]  [Recast]    │
└─────────────────────────────────────────────────┘

```
## Block-Level Inspection  
Click the gutter (the block number or shape glyph) to see block-level diagnostics:  
```
┌─────────────────────────────────────────────────┐
│ BLOCK DIAGNOSTIC                                 │
│                                                  │
│ Block 003                                        │
│ ─────────────────────────────────────────────── │
│ Shape:   œ weld                                  │
│ Signal:  ● red (2 red words, 0 green)            │
│ Depth:   1 (collected only)                      │
│ Trust:   L1 (no provenance)                      │
│                                                  │
│ WORD BREAKDOWN                                   │
│ 7 words: 0 green, 3 amber, 2 red, 2 neutral     │
│                                                  │
│ The □funding question is 𒐛still open             │
│     ● RED                  ● RED                 │
│ but we're œproceeding anyway.                    │
│                    ● RED                         │
│                                                  │
│ BLOCKING ISSUES                                  │
│  ✕ "funding" — no resolution evidence found      │
│  ✕ "still open" — seals a negative state         │
│  ✕ "proceeding" — claims weld without evidence   │
│    that proceeding is justified                  │
│                                                  │
│ CONVERGENCE IMPACT                               │
│ This block reduces box convergence by 12%.       │
│ If resolved, convergence rises from 67% to 79%.  │
│                                                  │
│ SUGGESTED ACTIONS                                │
│  → Split into two blocks:                        │
│    □ "Funding gap remains $40K."                 │
│    △ "Next move: identify funding source."       │
│  → Or add evidence that proceeding is grounded.  │
│                                                  │
│ ──────────────────────────────────────────────── │
│ [Split block]  [Add evidence]  [Recast]          │
└─────────────────────────────────────────────────┘

```
## What Makes This Different from a Tooltip  
This is not a tooltip. It is an inference receipt.  
A tooltip says: "This word is red." An inference receipt says: "This word is red because Seven checked 13 sources, found zero confirming evidence for this timeline, found one partial match (Melih confirmed availability but not the specific date), and determined that a deadline without a calendar event or engineering confirmation is an ungrounded seal."  
The difference:  

| Feature | Tooltip | Inference Receipt |
| -------------------------- | ------- | ----------------------------------------------- |
| Shows label | Yes | Yes |
| Shows reasoning | No | Yes |
| Shows sources checked | No | Yes — every source listed |
| Shows what's missing | No | Yes — specific gaps named |
| Shows assignment method | No | Yes — Priority 1/2/3 |
| Shows trust level | No | Yes — L1/L2/L3 with provenance |
| Shows shadow type warnings | No | Yes — with the echoing word |
| Shows convergence impact | No | Yes — "resolving this raises convergence by X%" |
| Offers actions | No | Yes — add evidence, override, recast, split |
| Is itself inspectable | No | Yes — click "View source" to see the evidence |
  
The inference receipt is Seven showing its work. The user can verify every step. If Seven is wrong — if the word IS grounded but Seven missed the evidence — the user can see exactly where the inference broke down and either add the missing source or override with a witness note.  
## The Trust Chain  
Every annotation links back to its evidence:  
```
Word "Melih" → green → because:
  → Source "Melih Friday email" (L2) → view email
  → Source "Melih prototype feedback" (L3) → view message

```
Every override links to its author:  
```
Word "Friday" → green (override) → because:
  → Manual override by Deniz Sengun
  → Witness note: "Verbal confirmation from engineering lead"
  → Timestamp: 2026-04-06T11:30:00Z
  → Trust: L1 (no external evidence attached)

```
The user can always ask: why does the system think this? And the system can always answer with a chain of evidence, not a vague explanation.  
## The Principle  
Seven infers. The inference receipt shows the work. The user inspects the work. The user interprets. The user decides.  
The diagnostic card is not Seven telling the user what to think. It is Seven opening its notebook and saying: "Here's what I checked, here's what I found, here's what I concluded. You decide if I'm right."  
That is the boundary. Infer, show work, let the human interpret.  
  
## The Reference Stack: What Seven Checks Against  
When Seven infers shape and signal on a word or block, it doesn't check one source. It checks against a layered stack of reference libraries, each at a different depth and timescale. The inference receipt shows which layer produced which finding.  
## Layer 1: Local Box Sources (ships first)  
The evidence the user imported into this box. Photos, emails, documents, voice memos, pasted text. This is the primary reference for any inference.  
When Seven flags "Friday" as red, it checked:  
* All 13 sources in the current box  
* Calendar integrations (if connected)  
* Communication history within the box  
The inference receipt shows: "Checked 13 sources. 0 confirming evidence for this timeline."  
**Status:** This is the core of the de-obfuscation experience. Buildable now. Ships first.  
**Status:** This is the core of the de-obfuscation experience. Buildable now. Ships first.  
## Layer 2: Project Assembly History (ships second)  
The box's own history. What has been sealed before. What patterns recur. What got rerouted. What ghost operators are running underneath.  
Ghost operators are invisible behavioral rules born from real experiences — detectable only through receipts, not introspection. Layer 2 surfaces them by comparing stated behavior against actual receipt trails.  
When Seven reads a box with Layer 2, it can say:  
* "You've made this kind of deadline promise three times before. Two went red."  
* "This box has a ghost operator: nothing ships without Melih's review, even when no rule requires it."  
* "Your convergence pattern shows evidence clustering in the last 24 hours before seal — you're cramming, not assembling."  
The inference receipt shows: "Checked project history. 3 prior deadline blocks: 1 sealed, 2 rerouted. Pattern: late evidence clustering."  
**Status:** Requires assembly history persistence. Buildable once the append-only log is real and receipts are accumulating.  
**Status:** Requires assembly history persistence. Buildable once the append-only log is real and receipts are accumulating.  
## Layer 3: Domain-Specific Libraries (ships third)  
External reference libraries matched to the content domain. Seven detects the domain from the box's content and pulls relevant reference frames.  

| Domain detected | Reference library | What Seven checks |
| --------------- | ------------------------------------------------ | ------------------------------------------------- |
| Medical | Merck Manual, clinical guidelines, FDA databases | Drug interactions, dosing, contraindications |
| Legal | Relevant statute, case law databases | Compliance, precedent, jurisdictional constraints |
| Engineering | Standards bodies (ISO, ASTM), manufacturer specs | Material limits, safety margins, code compliance |
| Financial | SEC filings, accounting standards, market data | Regulatory requirements, reporting obligations |
| Scientific | PubMed, preprint servers, replication databases | Study validity, sample size, replication status |
  
When Seven reads a box with Layer 3, it can say:  
* "You claim this medication schedule is safe. The Merck Manual lists a contraindication between Drug A and Drug B at this dosage."  
* "Your contract clause references Section 402(b). Current case law has narrowed this provision — see [source]."  
* "Your structural load calculation assumes Grade 50 steel. The supplier spec attached shows Grade 36."  
The inference receipt shows: "Checked Merck Manual (external, L3 trust). Contraindication found between [Drug A] and [Drug B]. Source: [link]."  
**Status:** Requires web search integration and domain detection. Buildable with current web search capabilities and targeted API connections to domain databases. The MCP connector spec already supports external tool integration.  
## Layer 4: The Shape Library (long-term vision)  
The deep reference. Patterns that survived selection across three media — biological, civilizational, and behavioral — each providing a different kind of structural evidence.  
**The Biological Library (DNA):** Conserved gene families that persist across species separated by hundreds of millions of years. They survive because the coordination problem they solve keeps recurring. Assembly Theory's native ground — high assembly index, high copy number, verified through evolutionary selection.  
**The Biological Library (DNA):** Conserved gene families that persist across species separated by hundreds of millions of years. They survive because the coordination problem they solve keeps recurring. Assembly Theory's native ground — high assembly index, high copy number, verified through evolutionary selection.  
What it provides to Seven: structural archetypes for coordination. Chemotaxis (sense → compare → adapt → respond) is the universal coordination algorithm. The seven archangels mapping (Gabriel=sense, Uriel=interpret, Raphael=diagnose, Raguel=resolve, Sariel=reroute, Remiel=sustain, Michael=seal) maps 1:1 onto chemotaxis proteins. When Seven runs an Operate, it's performing the same sequence a bacterium performs when navigating a chemical gradient.  
**The Civilizational Library (Scripture):** High-complexity, high-copy textual corpora whose patterns survived millennia of selection. Covenant, exodus, exile, return, the fourth point volunteering — coordination shapes that got replicated because people kept recognizing them as true. The Old Testament as a queryable ledger of coordination patterns with extraordinary assembly index and copy number.  
**The Civilizational Library (Scripture):** High-complexity, high-copy textual corpora whose patterns survived millennia of selection. Covenant, exodus, exile, return, the fourth point volunteering — coordination shapes that got replicated because people kept recognizing them as true. The Old Testament as a queryable ledger of coordination patterns with extraordinary assembly index and copy number.  
What it provides to Seven: archetypal pattern recognition. "This coordination pattern resembles an exodus shape — a group moving toward a promise with evidence of the old structure breaking down but the new one not yet established." Not as literal matching but as structural analogy that helps surface what phase the coordination is in.  
**The Behavioral Library (GitHub):** Twenty years of open-source coordination telemetry at millisecond resolution. Commits, forks, stars, issues, pull requests, reviews. Where scripture tells you what shapes humans assemble, GitHub tells you how they assemble them in real time. Queryable via GH Archive and BigQuery.  
What it provides to Seven: empirical coordination baselines. "Teams that shipped successfully had this shape distribution at this stage. Your box's shape distribution diverges here." Ghost operator detection across millions of projects: stated governance versus actual governance, measurable through PR review concentration, commit timing patterns, and contributor dynamics.  
**How the Shape Library appears in the inference receipt:**  
**How the Shape Library appears in the inference receipt:**  
```
LAYER 4: SHAPE LIBRARY (advisory)
─────────────────────────────────
Behavioral match:
  This box's convergence pattern resembles projects in 
  the 70th percentile for successful delivery. Main risk: 
  evidence clustering in final 20% of timeline.
  Source: GH Archive analysis, n=12,400 similar projects.
  Trust: statistical (not causal).

Structural match:
  Current phase maps to "preparation before crossing" —
  aim is declared, evidence is partial, one blocking 
  constraint remains. Common across coordination corpora.
  Trust: analogical (pattern recognition, not proof).

```
**Status:** This is a research program, not a sprint feature. The biological mapping exists as theory (the archangel-chemotaxis correspondence). The civilizational library exists as a document (the Shape Library v1.2). The behavioral library is empirically accessible through GH Archive. But turning all three into a queryable reference genome for Seven's inference engine is long-term work. It's the north star, not the next milestone.  
## How the Layers Compose  
Seven checks layers in order. Each layer adds depth to the inference but also adds uncertainty. The inference receipt marks which layer produced which finding and at what trust level.  
```
INFERENCE RECEIPT — Word: "Friday"

Layer 1 (Local sources):
  ✕ No calendar event found.
  ✕ No engineering confirmation.
  ✓ Melih confirmed availability (partial match).
  Trust: evidence-based. Confidence: high.

Layer 2 (Project history):
  ⚠ 2 of 3 prior deadline blocks were rerouted.
  ⚠ Evidence clustering pattern detected (late assembly).
  Trust: pattern-based. Confidence: medium.

Layer 3 (Domain library):
  ○ No domain-specific constraint found for this timeline.
  Trust: N/A.

Layer 4 (Shape library):
  ○ Deadline pressure pattern is common. 68% of similar 
     projects with this evidence distribution at this 
     stage delivered within 48 hours of stated deadline.
  Trust: statistical. Confidence: low (advisory only).

COMPOSITE SIGNAL: ● RED
  Primary reason: Layer 1 — no confirming evidence.
  Contributing: Layer 2 — historical pattern of late reroutes.

```
## Layer Priority and Trust  
The layers have a strict priority order for signal assignment:  

| Layer | Trust ceiling | Can turn a word red? | Can turn a word green? |
| ------------------- | ------------- | --------------------------------- | ----------------------------------- |
| 1. Local sources | L3 | Yes | Yes |
| 2. Project history | L2 | Yes (pattern warning) | No (patterns advise, don't confirm) |
| 3. Domain libraries | L3 | Yes (contraindication, violation) | Yes (compliance confirmed) |
| 4. Shape library | L1 | No (advisory only) | No (advisory only) |
  
Local sources always have the highest authority. The Shape Library never overrides local evidence — it only adds context. A word that is green from Layer 1 stays green even if Layer 4 shows a risky statistical pattern. The user sees the advisory. The signal doesn't change.  
This protects against the Shape Library becoming an oracle. It's a reference, not an authority. The user and their local evidence remain the interpreters of record.  
## The Echo Canon as Behavioral Compiler  
One special case: the Echo Canon isn't a reference library Seven consults. It's the disposition Seven operates under. The behavioral principles — "Hope is aim waiting to be tested," "Friction is testimony," "Tiny tests tame giant claims," "Failure is a map" — shape how Seven frames its diagnostics, not what it finds.  
Seven doesn't flag a word red because it violates the Echo Canon. Seven flags a word red because it lacks evidence. But the way Seven communicates that finding follows the Canon's posture: no shame, only signal. Red is a breakpoint, not a punishment. Rerouting is respect for truth, not failure.  
The Monolith Cosmology provides a structural lens: is this box extending its basis (adding a new dimension of evidence) or replicating within the plane (adding more of the same)? Seven can surface this as a pattern observation: "This box has 7 aim blocks and 2 reality blocks. The ratio suggests planar replication — more promises without new evidence. Consider adding a different kind of source."  
These frameworks don't show up as line items in the inference receipt. They show up in how the inference receipt talks to the user.  
  
## The Teaching Effect  
The de-obfuscation experience teaches the Lœgos language through use, not instruction.  
## What the user learns by seeing red words:  
* Deadlines without evidence are claims, not facts.  
* "The team agrees" without specific names is an untested assumption.  
* Contradictions hidden in natural language become visible under compilation.  
* Vague consensus language is all-amber — it looks active but proves nothing.  
## What the user learns by seeing green words:  
* Grounded claims have a specific structure: person confirmed, document attached, number verified.  
* Green sentences feel different from amber sentences. The user starts to recognize the pattern.  
* The visual feedback trains shape recognition: "Is this an aim or an observation? Is this grounded or aspirational?"  
## What the user learns by doing overrides:  
* Some knowledge can't be externalized. That's okay. But the system should know which claims rest on personal witness versus external evidence.  
* The override is not cheating. It's the system's way of saying: "I can't verify this, but I trust you. The receipt will show your name next to this claim."  
## The progression:  
1. **First Operate:** Surprise. "I didn't know those words were red."  
2. **Second Operate:** Recognition. "I see the pattern. Deadlines without evidence are always red."  
3. **Third Operate:** Anticipation. "I'm going to add the calendar invite before I Operate, because I know Friday will be red."  
4. **Fourth Operate:** Fluency. The user starts writing grounded sentences naturally. They've internalized the shapes.  
The language teaches itself through the gap between what the user wrote and what the compiler sees. That gap is the product.  
  
## The Entry Sequence  
This experience is how a new user learns Lœgos without reading a manual.  
1. **They write.** Normal prose. Comfortable. No learning curve.  
2. **They Operate.** The prose transforms. They see red words they didn't expect.  
3. **They click a red word.** The diagnostic explains what's missing.  
4. **They add evidence.** The word turns green.  
5. **They see the sentence compile.** All green. Seal button activates.  
6. **They seal.** Receipt emitted. The sentence is now accountable.  
At no point did anyone explain shapes, signals, types, convergence, or the formal core. The user discovered them by writing and debugging.  
That's the first day of school. Not a lecture. An entrance exam that teaches by doing.  
  
## Implementation Notes  
## When to show annotations  

| Mode | Trigger | What's visible | Who it's for |
| ------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Write | Default | Nothing. Clean prose. | Everyone, always. |
| Operate | User presses Operate | Block-level shapes in gutter. Only flagged (red/amber) words highlighted. Diagnostics panel opens. | The primary de-obfuscation moment. |
| Hover | Mouse over a block | That block's shape, signal, and summary diagnostic. | Experienced users spot-checking. |
| Inspect | Click a flagged word or gutter glyph | Full inference receipt. Evidence chain. Sources checked. Actions available. Optional full word-level annotation. | Deep diagnosis. Understanding why. |
  
****Annotation rendering****  
* Shape glyph appears in the gutter (△ □ œ 𒐛) next to block number.  
* Signal color appears as subtle text color on the word itself — green words are normal weight, amber words are slightly brighter, red words get a subtle underline.  
* Diagnostics appear in the gutter below the block, in gray mono, 11px.  
* The annotation should NOT obscure readability. The user should still be able to read the sentence as a sentence. The shapes and signals are a layer on top, not a replacement.  
## The Operate animation  
When the user presses Operate, the transformation should feel like a reveal, not a jump:  
1. A brief scan animation moves down the document (100-200ms per block).  
2. Shape glyphs fade in to the gutter.  
3. Signal colors fade in on words.  
4. Red words pulse once (subtle, not alarming).  
5. The diagnostics panel opens if it was closed.  
6. Total time: under 2 seconds for a 10-block document.  
This should feel like a scanner reading the document — because that's what's happening. Seven is parsing every word, checking every claim against the evidence in sources, computing convergence, and rendering the result.  
## The de-Operate  
The user can toggle back to Write mode at any time. The annotations disappear. The prose is clean again. They edit. They Operate again. The cycle continues.  
Write → Operate → Fix → Write → Operate → Fix → Seal.  
That's the development loop. Same as: Code → Compile → Debug → Code → Compile → Debug → Ship.  
  
## Connection to the Formal Core  
The de-obfuscation experience is the formal core made experiential.  

| Formal concept | User experience |
| ------------------------------- | ------------------------------------------------------ |
| Shape types (△ □ œ 𒐛) | Glyphs in the gutter |
| Signal states (green/amber/red) | Word colors |
| Type checking | Seal preflight |
| Convergence computation | The ratio of green to red |
| Shadow types | "This word is labeled △ but reads like □" |
| State transitions | Words changing color as evidence is added |
| Runtime contract | The system never changes words, only shows their state |
| Seal permanence | Once sealed, annotations are frozen into the receipt |
  
The formal core told us what the language IS. This document tells us what the language FEELS LIKE to use.  
  
## The Order: □ Before △ (Entry Sequence)  
For first contact and diagnosis, lead with □ before △. Let evidence speak before explanation. Let inference precede interpretation.  
## What this means for the product  
Do not explain the shape system to a new user before they've used it. Do not show a tutorial about △ □ œ 𒐛 on a splash screen. Do not hand them a philosophy document before they've written their first sentence.  
Let them write. Let the compiler infer. Show them the results. Then they interpret what they see.  
The explanation comes after the experience. Not before.  
## What this means for Seven  
Seven should read the box first (□ infer), then present findings. Not: "Here's what I think your box means, do you agree?" But: "Here's what's in the evidence. What do you think?"  
The user's interpretation is more honest when it responds to inference rather than confirming a pre-loaded frame.  
## What this means for onboarding  
The best onboarding sequence is:  
1. User writes a sentence. No instruction.  
2. User presses Operate. The words light up.  
3. User sees a red word they didn't expect.  
4. User clicks the red word. The inference receipt explains why.  
5. User adds evidence. The word turns green.  
6. User now understands shapes, signals, and evidence — without anyone explaining them.  
At no point did the system say "welcome to Lœgos, here are four shapes." The user discovered the shapes by seeing them applied to their own words. The discovery IS the onboarding.  
## Why this order matters  
When you give someone △ first (the aim, the thesis, the philosophy) and then show them □ (the evidence, the code, the product), they evaluate the evidence through the lens of the aim. They look for confirmation. Coherence builds fast. But convergence is untested.  
When you give someone □ first (the evidence, the experience, the raw output) and then let them form their own △ (their interpretation of what they just saw), the interpretation is grounded. They aren't confirming your thesis. They're building their own from evidence.  
The first path is a lecture. The second path is an entrance exam.  
The product should always take the second path. □ before △. Reality before aim. Show the code, then let them name it.  
## The principle stated as a rule  
**Never explain the system to someone who hasn't experienced it yet. Let the system explain itself through use. The gap between what they wrote and what the compiler showed them IS the explanation.**  
This applies to:  
* New user onboarding (no tutorial — write, operate, discover)  
* Seven's diagnostic output (show evidence, then suggest — don't lead with interpretation)  
* Sharing the product with investors or press (show one example first, explain the theory second)  
* Briefing new team members (let them read the repo before reading the philosophy)  
The same principle caught its own author in real-time: when preparing a briefing for a new developer agent, the instinct was to front-load the entire philosophy. The correction was: let the agent read the code first, form its own inference, then share the interpretation and see where they converge. That correction came from the product's own logic — □ before △.  
  
## The One-Line Summary  
**The user writes prose. The compiler shows them which words are grounded and which are floating. The gap between what they wrote and what the compiler sees is the product.**  
  
## The Reference Stack: What Seven Checks Against  
Seven doesn't just check words against the local box. It checks against a stack of reference libraries, each at a different depth and a different readiness level.  
## Layer 1: Local Box Sources (buildable now)  
The evidence the user imported into this box. Photos, emails, documents, voice memos, pasted text. This is what the earlier sections of this document describe.  
When Seven flags "Friday" as red, it checked 13 sources in the box and found no calendar event, no engineering confirmation, no delivery mechanism. The inference receipt shows exactly which sources were consulted and what was missing.  
This is the foundation. Everything else builds on top of it.  
**What the inference receipt shows:**  
* "Checked 13 sources in this box"  
* "Found: [list of matching sources]"  
* "Missing: [specific evidence gaps]"  
## Layer 2: Project Assembly History (buildable next)  
What has this box — and the user's other boxes — produced before? What patterns recur? What has been sealed, what got rerouted, what went red repeatedly?  
This is where ghost operators become detectable. A ghost operator is an invisible behavioral rule born from a real experience that persists after conditions change. It's only visible through receipts — through the pattern of what the user actually does versus what they say they'll do.  
**Example diagnostic:**  
* "You've set Friday deadlines in 4 previous boxes. 3 went red. Your Friday completion rate is 25%."  
* "This box's aim is structurally similar to Box 'Q2 Launch' which stalled at the funding weld. The same evidence gap (budget confirmation) is present here."  
* "Ghost operator detected: you consistently skip engineering confirmation before setting timelines. This pattern installed after [earliest receipt where it appears]."  
**What the inference receipt shows:**  
* "Checked user's assembly history across [N] boxes"  
* "Pattern match: [similar previous box, outcome]"  
* "Recurring gap: [evidence type consistently missing]"  
## Layer 3: Domain-Specific Libraries (buildable with web search)  
If the box is about a medical decision, Seven should check against clinical guidelines. If it's about a contract, check against relevant legal frameworks. If it's mechanical, check engineering standards. If it's financial, check regulatory requirements.  
This is where web search and external knowledge bases earn their place — not as generic lookup but as domain-aware evidence verification. Seven recognizes the domain from the content and pulls the relevant reference frame.  
**Example diagnostics:**  
* Medical box: "You claim this dosing schedule is standard. Checking against current clinical guidelines... The Merck Manual specifies a different interval for this medication. Your claim is amber — partially supported but may need verification with a clinician."  
* Legal box: "This contract clause references a 30-day notice period. Checking against [jurisdiction] statute... The statutory minimum is 60 days. Your clause is red — it may not be enforceable."  
* Engineering box: "This load tolerance claim has no supporting calculation in sources. Domain reference suggests this material has a lower rating than stated."  
**What the inference receipt shows:**  
* "Domain detected: [medical / legal / engineering / financial]"  
* "External reference consulted: [specific source, URL, date]"  
* "Finding: [alignment or contradiction with domain standard]"  
* "Confidence: [how authoritative the external source is]"  
**Important boundary:** Seven presents the external finding. The human interprets whether it applies to their specific case. A clinical guideline is a reference, not a verdict. The human remains the interpreter of record.  
## Layer 4: The Canon (behavioral alignment check)  
The Echo Canon and the Monolith Cosmology are the foundational behavioral frameworks that govern how the system thinks about coordination. They aren't features — they're dispositions. Seven should embody them, not cite them.  
**What the Echo Canon checks:**  
**What the Echo Canon checks:**  
* Is this aim being tested or protected from testing? ("Hope is aim waiting to be tested")  
* Is the user measuring or vibing? ("Squares don't argue; they measure")  
* Is there one obvious move or is the user generating options to avoid committing? ("One obvious move or none")  
* Has friction been treated as failure or as testimony? ("Friction is testimony")  
* Is the move small enough to be kind? ("Shrink the move until kind")  
**What the Depth Appendix checks:**  
* Is this box growing within the plane (replicating existing patterns) or extending the basis (adding a new dimension)?  
* Is the fourth point volunteering or being compelled? (Consent before compute)  
* Is this a cancer pattern (growth without basis extension) or a new trait pattern (genuine new axis)?  
These checks don't produce visible "Canon says..." diagnostics. They shape how Seven weighs evidence, frames suggestions, and decides what to flag. The canon is the compiler's character, not a source it cites.  
**Practical implementation:** These principles are encoded in Seven's system prompt and evaluation heuristics. They influence tone, prioritization, and diagnostic framing. They don't appear as a separate layer in the inference receipt unless the user specifically asks "why did Seven frame it this way?"  
**Practical implementation:** These principles are encoded in Seven's system prompt and evaluation heuristics. They influence tone, prioritization, and diagnostic framing. They don't appear as a separate layer in the inference receipt unless the user specifically asks "why did Seven frame it this way?"  
## Layer 5: The Shape Library (long-term research direction)  
The Shape Library is the deepest reference layer. It proposes that coordination patterns can be read across three media:  
* **Biological (DNA):** Conserved gene families that persist because the coordination problem they solve keeps recurring. Assembly Theory's native ground.  
* **Civilizational (Scripture):** Patterns like covenant, exodus, exile, return — coordination shapes that survived millennia of selection across cultures and languages.  
* **Behavioral (GitHub):** Timestamped telemetry showing how teams actually assemble, measured at millisecond resolution. The most empirically accessible of the three.  
The thesis: complexity × replication × selection = life. Patterns that are complex enough to encode real coordination (high assembly index) and universal enough to replicate across contexts (high copy number) are the canonical shapes. They are the coordination equivalent of conserved genes.  
**What this would eventually enable:**  
**What this would eventually enable:**  
* "This coordination pattern matches a shape that has recurred in open-source governance: the 'benevolent dictator' pattern appears in 23% of successful projects at this stage."  
* "Your team's current trajectory shows the 'exodus' shape — a founding group dispersing after initial delivery. This shape has known resolution patterns."  
* "The assembly index of this box is unusually low for its age. Similar boxes with this profile either seal within 2 weeks or stall permanently."  
**Honest assessment:** This layer is a research direction, not a near-term feature. The GitHub behavioral library is the most practically accessible — GH Archive and BigQuery make the data queryable today. The civilizational library is philosophically rich but not yet formally measured using Assembly Theory metrics. The biological library is scientifically grounded but connecting genomic patterns to coordination patterns requires significant cross-domain work.  
The Shape Library is what makes Lœgos potentially category-defining in the long run. It's not what ships in the next sprint. It should be held as the north star for what Seven's inference engine becomes over time, while Layers 1-3 deliver immediate value.  
## Summary: The Stack  

| Layer | What Seven checks | Readiness | Ships when |
| ------------------- | -------------------------------------------------------- | ---------------- | --------------------- |
| 1. Local sources | Evidence in this box | Ready | Now |
| 2. Assembly history | User's patterns across boxes, ghost operators | Buildable | Next milestone |
| 3. Domain libraries | External knowledge bases, web search, domain standards | Feasible | With domain detection |
| 4. Canon | Echo Canon, Depth Appendix — behavioral alignment | In system prompt | Ongoing, implicit |
| 5. Shape Library | DNA, scripture, GitHub — canonical coordination patterns | Research | Long-term |
  
****What the Inference Receipt Shows at Each Layer****  
When the user clicks a word and opens the diagnostic card, the receipt should show which layers contributed to the finding:  
```
┌─────────────────────────────────────────────────┐
│ WORD DIAGNOSTIC                                  │
│                                                  │
│ "Friday"                                         │
│ ─────────────────────────────────────────────── │
│ Assigned shape:  𒐛 seal (deadline)               │
│ Assigned signal: ● red                           │
│                                                  │
│ LOCAL SOURCES (Layer 1)                          │
│  ✕ No calendar event for Friday                  │
│  ✕ No engineering confirmation                   │
│  ✓ Melih confirmed availability (partial)        │
│                                                  │
│ ASSEMBLY HISTORY (Layer 2)                       │
│  ⚠ You've set Friday deadlines 4 times.         │
│    3 went red. Completion rate: 25%.             │
│                                                  │
│ DOMAIN CHECK (Layer 3)                           │
│  ○ No domain-specific check applicable.          │
│                                                  │
│ Evidence needed: 1 source confirming timeline.   │
│                                                  │
│ ──────────────────────────────────────────────── │
│ [Add evidence]  [Override]  [Recast]             │
└─────────────────────────────────────────────────┘

```
The layers are additive. Each one that fires adds a line to the receipt. The user sees the full reasoning chain — local evidence, historical patterns, domain checks — and decides what to do. Seven infers across the stack. The human interprets and commits.  
  
*Seven infers. Humans interpret. Reality replies. Receipts record.*  
*Convergence, not coherence only.*  
△ □ œ 𒐛  
