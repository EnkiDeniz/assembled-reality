# Lœgos Recon — Integration Proposal

Date: April 12, 2026
Status: Proposal for review
Purpose: Define how Lœgos Recon fits into the current system, what it proves about the product, and what improvements it requires.

---

## 1. What Lœgos Recon Is

Lœgos Recon is the product's first external-facing analytical use case. It applies the Lœgos coordination language — the Room, the compiler, the working echo, the receipt kit, and the seal — to read the structural DNA of open-source projects.

It is not a new product. It is the existing product pointed outward.

The v1 manual exercise analyzed 75 repositories across 8 domains and produced five universal findings, the strongest being: **the form of a project's stabilizer predicts its durability better than star count, contributor count, or release cadence.**

The proposal: take that manual exercise and run it through the actual product, then make the product better at it, then publish the results as the first public proof that Lœgos works.

---

## 2. Where Recon Sits in the System

Recon runs through every existing subsystem. No new subsystem is required.

| System component | Role in Recon | Status |
|---|---|---|
| **Room** | The surface where the human and Seven analyze a repo | Exists. Works as-is. |
| **Source intake** | Import repo data (commit log, contributors, releases, README) as sources | Exists. Manual paste works. Connector needed for automation. |
| **Compiler** | Validate the structural read as typed Lœgos clauses | Exists. Works on any text. |
| **Working echo** | Track the evolving structural read (aim, supports, weakens, missing, deciding split) | Exists. Works on any box content. |
| **Turn policy** | Gate Seven's proposals (MOV requires TST, sentences capped) | Exists. Applies to Recon proposals the same way. |
| **Receipt kit** | Capture evidence (paste contributor data, upload commit graphs, link to PRs) | Exists. All 6 artifact types (upload, paste, link, draft_message, checklist, compare) apply. |
| **Seal** | Commit the structural read as a permanent receipt with trust enforcement | Exists. Override acknowledgment, 409/200 contract, fingerprint staleness — all apply. |
| **Shape Library** | Advisory: classify the coordination pattern, name the assembly class, suggest receipt conditions | Exists. Engine works on any coordination situation. |
| **Operate overlay** | Deeper block-level evidence analysis with trust levels | Exists. Can be run on the sealed Recon receipt. |

**The gap:** One automated connector to import GitHub repo data as sources. Everything else is built.

---

## 3. What Recon Proves About the Product

### 3.1 The language is substrate-agnostic

The compiler parses Lœgos clauses regardless of whether they describe the user's own project or an external repo. DIR is DIR. GND is GND. MOV is MOV. If the compiler produces valid diagnostics on a Recon analysis, the language works on external coordination artifacts — which is the claim the product needs to make.

### 3.2 The working echo reads any coordination signal

The working echo extracts aim, supports, weakens, missing, and deciding split from whatever is in the box. In Recon, the "aim" is the structural hypothesis ("Godot has a community braid with one integrator as stabilizer"). The "supports" are contributor data that confirm the hypothesis. The "weakens" are counter-evidence. The "missing" are what you'd need to look at to be more confident. The echo doesn't need to be told it's reading a repo instead of a personal project. It reads coordination structure.

### 3.3 Receipts are portable across contexts

A sealed Recon receipt can become a source in another box. A receipt that says "Godot's stabilizer is the community review process plus one integrator" can inform a box about governance design. A receipt that says "solo-founder projects share three ghost operators" can inform a box about succession planning. Receipts travel. That is the product's deepest architectural claim, and Recon is the use case that tests it.

### 3.4 The system resists self-sealing

Braided Emergence's forbidden move is self-description that self-seals. The first Recon pass was done manually — the frameworks reading themselves. The next pass must be done through the product — the product reading external projects. If the product produces honest reads (including reads that disagree with the manual analysis), the system resists self-sealing. If the product only confirms what the manual analysis said, something is wrong.

---

## 4. What Needs to Improve

### 4.1 The GitHub data connector (new, ~200 lines)

**What:** A new API route at `/api/recon/github` that takes a repo URL and returns structured source documents for import into a box.

**What it fetches:**
- Repo metadata (name, description, stars, forks, language, license, created date)
- Commit log (last 200 commits: date, message first line, author)
- Contributor list (top 20: login, commit count)
- Release history (last 10: tag, date, name)
- README content (first 2000 characters)

**What it returns:** A formatted markdown document that lands as a source in the box. One document per repo, containing all five data sections.

**Implementation:**
- Uses the `gh` CLI or GitHub REST API (already authenticated)
- One server route, one formatter function
- No new Prisma models
- No new frontend components (the Room's existing intake handles the import)

**Definition of done:** `POST /api/recon/github` with `{ repo: "godotengine/godot" }` returns a markdown source document that can be pasted or auto-imported into a box.

### 4.2 Recon prompt templates for Seven

**What:** A set of scoped turn instructions that tell Seven how to analyze repo data structurally rather than conversationally.

**Templates needed:**

1. **Braid topology read.** Given contributor distribution and release cadence, identify the construction loop, constraint loop, stabilizer form, and braid topology (solo-founder, corporate, community, committee, inherited).

2. **Ghost operator identification.** Given commit history and governance patterns, identify behavioral rules that persist without being explicitly encoded. Look for: single-person concentration, reactive competitive positioning, explanation-over-shipping patterns, inherited architectural constraints.

3. **Signal assessment.** Given release history, test coverage indicators, and contributor activity, assign a Lœgos signal (green/amber/red) and trust level (L1/L2/L3) to the project's structural health.

4. **Structural analog matching.** Given the project's properties, identify which other analyzed projects share the most structural similarity and explain why.

5. **Working echo extraction.** Given all of the above, produce the Recon echo: aim (what kind of project is this?), supports (what confirms the structural read?), weakens (what contradicts it?), missing (what would make the read more confident?), deciding split (what would change the classification?).

**Implementation:**
- These are prompt context injections in `room-turn-service.js`, not new routes
- They activate when the box is tagged as a Recon box or when the user asks for a structural read
- They use the existing Seven system prompt scaffolding plus a Recon-specific context section

**Definition of done:** When a user says "analyze this repo structurally" in a Recon box, Seven produces a typed structural read using the five templates, and the read compiles through the compiler without shape violations.

### 4.3 Recon box template

**What:** A pre-configured box template that sets up a Recon analysis with the right structure.

**What it contains:**
- Box title: `Recon: {repo name}`
- Pre-structured seed sections: Braid Topology, Ghost Operators, Stabilizer Assessment, Structural Analogs, Signal Assessment
- Turn context pre-loaded with Recon prompt templates
- Receipt kit configured for structural analysis evidence types

**Implementation:**
- Similar to `ensureLoegosOriginExampleForUser` — a template function that creates a box with the right structure
- One new function in `room-documents.js` or a new `recon-template.js`
- No new Prisma models (uses existing `ReaderProject` + `ReaderDocument`)

**Definition of done:** User clicks "New Recon" and gets a box pre-configured for structural analysis with the right seed sections and prompt context.

### 4.4 Working echo improvements for analytical use

**What:** The working echo currently optimizes for personal coordination (the user's own aim, their own evidence). For Recon, the echo needs to work as an analytical instrument — reading a subject's coordination patterns rather than the user's own.

**Specific improvements:**

1. **Subject-aware aim extraction.** When the box is analyzing an external project, the "aim" in the echo should be the analytical hypothesis about the subject, not the user's personal aim. Example: "This project has a solo-founder braid with weekly release cadence as the stabilizer" — not "My aim is to analyze this project."

2. **Evidence source classification for external data.** The echo's source classification (`runtime return`, `bounded provisional state`, `bounded advisory`) should extend to external data types: `commit history`, `contributor distribution`, `release cadence`, `README declaration`, `PR review pattern`. These map naturally to existing source classification but need explicit labels for Recon context.

3. **Comparative echo.** When multiple Recon boxes exist, the echo should be able to surface cross-box patterns: "This project's stabilizer matches the pattern found in Recon: Godot." This uses the existing receipt-as-source mechanism — a sealed receipt from one Recon box becomes a source in another.

**Implementation:**
- Modifications to `room-working-echo.js` (the `buildWorkingEcho` function already handles source classification)
- Conditional logic based on box type or tag
- No new data models

**Definition of done:** A Recon box's working echo reads as an analytical instrument (subject-focused) rather than as a personal coordination surface (user-focused).

### 4.5 Drive Tape for Recon sessions

**What:** Drive Tape currently replays conversation traces to show signal survival. For Recon, Drive Tape should also be able to replay the analytical session: what structural hypothesis was proposed, what evidence confirmed or weakened it, where the read changed, what survived to the seal.

**This is already what Drive Tape does.** The only adjustment is labeling: the tape labels should reflect analytical moves (hypothesis → evidence → correction → refined hypothesis) rather than coordination moves (aim → move → return → update). The underlying data structure is the same.

**Implementation:**
- Label adjustments in `drive-tape.js`
- Conditional labels based on box type
- No new infrastructure

---

## 5. What Recon Does NOT Require

To keep scope honest:

- **No new Prisma models.** Recon boxes, documents, receipts, and overrides all use existing models.
- **No new frontend surfaces.** The Room renders Recon the same way it renders any box. No special Recon UI.
- **No new compiler features.** The compiler already parses structural analysis text the same way it parses coordination text.
- **No new seal contract.** The trust spine applies as-is.
- **No new Shape Library features.** The engine already analyzes coordination patterns regardless of source.
- **No new infrastructure.** Next.js, Prisma, OpenAI, Vercel — all the same stack.

The total new code is:
- GitHub connector: ~200 lines (one API route + one formatter)
- Recon prompt templates: ~100-150 lines (context injection in turn service)
- Recon box template: ~50-100 lines (one template function)
- Working echo adjustments: ~50-100 lines (conditional labels and classification)
- Drive Tape label adjustments: ~20-30 lines

**Total: ~420-580 lines of new code.** Everything else is reuse.

---

## 6. Implementation Sequence

| Step | What | Effort | Dependencies |
|---|---|---|---|
| 1 | Run one Recon analysis manually through the Room (no code changes) | 1-2 hours | Room works (it does) |
| 2 | Build the GitHub connector | Half day | `gh` authenticated (it is) |
| 3 | Add Recon prompt templates to turn service | Half day | Step 2 |
| 4 | Build the Recon box template | 2 hours | Step 3 |
| 5 | Adjust working echo for analytical use | Half day | Step 1 informs what adjustments are needed |
| 6 | Adjust Drive Tape labels | 1 hour | Step 5 |
| 7 | Run 5 Recon analyses through the product and seal receipts | 1-2 days | Steps 2-6 |
| 8 | Compare product-generated reads to manual reads | Half day | Step 7 |
| 9 | Publish | 1 week | Step 8 shows convergence |

**Total: ~1 week of focused work** to go from manual Recon to product-generated Recon with sealed receipts.

---

## 7. Success Criteria

### 7.1 The product generates reads that match manual analysis

When the product analyzes Godot through the Room, the sealed receipt should converge with the manual finding: "community braid with one integrator as stabilizer." If it diverges, either the manual analysis was wrong (unlikely for well-known projects) or the product's analytical capability needs sharpening (likely for the first pass).

### 7.2 The product generates reads the manual analysis missed

The strongest success is when the product finds something the manual analysis didn't. A ghost operator the manual pass overlooked. A stabilizer the manual pass miscategorized. An evidence pattern that changes the braid assessment. This would prove the product adds value beyond what a human analyst can do alone — which is the entire product thesis.

### 7.3 The sealed receipts are portable and useful

A Recon receipt should be importable into a different box as a source. If the user is building a governance model for their own project, a Recon receipt that says "solo-founder braids share three ghost operators" should inform that work. If the receipt can't travel, it's a report, not a Lœgos artifact.

### 7.4 The working echo helps the analyst steer

During a Recon session, the working echo should surface: "your current hypothesis is X, evidence Y supports it, evidence Z weakens it, you haven't yet checked W." If the echo helps the analyst place the next investigative move, it's working. If the analyst ignores the echo and does the analysis from chat alone, the echo isn't adding value for this use case.

### 7.5 The Braided Emergence check passes

Does the Recon feature itself exhibit healthy braiding?
- **Loop A (construction):** the analysis (propose structural reads)
- **Loop B (constraint):** verification against the repo's actual history
- **Stabilizer:** the sealed receipts (measurement of whether the read converged with reality)
- **Correction alters the vector:** each analysis refines the prompts for the next one

If the Recon feature's own development does not exhibit braiding, it fails its own test.

---

## 8. What This Makes Possible After v1

If Recon works through the product:

**8.1 A living structural atlas of open source.** Every sealed Recon receipt becomes a data point. Over time, the corpus grows into a queryable map of how coordination works across the open-source ecosystem. Which governance models produce the most durable projects? Which stabilizer forms survive founder departure? Which domains have the weakest constraint loops?

**8.2 Recon as a service.** A user pastes a GitHub URL and gets a structural read in minutes. Not a feature comparison. Not a popularity metric. A braid analysis: how healthy is this project's construction-constraint loop? Where is it vulnerable? What would strengthen it? This is something no existing tool provides.

**8.3 The first publishable proof.** A blog post or paper that says: "We analyzed 75 open-source projects through a coordination language and found that stabilizer form predicts durability better than any other metric. Here are the sealed receipts." The receipts link back to the product. The publication IS the demo.

**8.4 A benchmark for the product itself.** Every Recon analysis is a test of the product's analytical capability. If the product's read of a well-known project is wrong, we know the product needs to improve. If it's right, we know the product works. The Recon corpus becomes the product's own external stabilizer — the measurement of whether the product's coherence (elegant reads) and convergence (accurate reads) are held together.

---

## 9. Risks

**9.1 Recon analysis becomes explanation instead of shipping.** Ghost Operator 2 from our own history. The mitigation: Step 1 is running a manual analysis through the Room with zero code changes. If the Room can't handle it as-is, we learn what's actually missing. If it can, Steps 2-6 are incremental improvements, not prerequisites.

**9.2 The product's reads are too generic.** If Seven produces "this is a healthy open-source project with good governance" for every repo, the read is worthless. The mitigation: the prompt templates must be specific enough to produce differentiating reads (e.g., "solo-founder braid with weekly release as stabilizer" vs "committee braid with RFC process as stabilizer"). The manual analysis already shows this level of specificity is achievable.

**9.3 Recon distracts from the core product priorities.** The current priorities are: close the return-authored vector gap, run a human drive, make the stabilizer visible. The mitigation: Recon is a parallel track that exercises the same components. It doesn't compete with the priorities — it exercises the Room, the echo, and the seal on different content. If anything, it stress-tests the components the priorities depend on.

**9.4 The GitHub data is too thin for deep analysis.** Commit messages, contributor counts, and release dates are proxies, not full evidence. The manual analysis acknowledged this limitation. The mitigation: Recon v1 produces "structural hypothesis at L2 trust, requires deeper investigation for L3." The trust levels exist precisely for this — the read is honest about its confidence.

---

## 10. The Braided Emergence Check

- **Does correction alter the next proposal?** Yes — each Recon analysis refines the prompts and sharpens the methodology for the next one.
- **Is the stabilizer visible?** Yes — sealed receipts ARE the stabilizer. Each receipt measures whether the read converged with the project's actual history.
- **Are both loops present?** Yes — Loop A is the analysis (propose a structural read), Loop B is verification against real data (does the read match?).
- **Does it fit the Elden Ring equivalent?** The boss is a well-known project the analyst already understands (can the product match human expert judgment?). The failed run is a generic or inaccurate read. The bonfire is the sealed receipt. The lore on the wall is the universal findings that only become readable after enough analyses accumulate.

---

## 11. One-Line Position

Lœgos Recon is ~500 lines of new code that turns the existing product into an analytical instrument for reading the structural DNA of any coordination artifact — proving the language works outward, not just inward, and producing the first publishable receipts of the product's own capability.

△ on the proposal. □ when the first automated Recon receipt seals through the Room.
