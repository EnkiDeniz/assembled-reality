# Ghost Recon — Build Proposal

Date: April 12, 2026
Status: Build-ready proposal
Purpose: What to build, what features it has, how the user experiences it, and how it ships.

---

## What Ghost Recon Is

Ghost Recon is a structural analysis instrument built into Lœgos. It reads any coordination trail — a codebase, a startup, a team, a project, a person's decision history — and surfaces the invisible behavioral rules (ghost operators) running underneath. It does this by compiling the trail into Lœgos clauses, running compound pattern detection through the compiler, and producing a sealed receipt of the structural read.

It is not a dashboard. It is not a report generator. It is a conversation in the Room where the human and Seven analyze a subject together, with the compiler checking the analysis and the working echo tracking the evolving structural read.

---

## What the user experiences

### The entry

The user opens Lœgos. They create a new box or say to Seven: "I want to analyze Godot's governance structure" or "Run a recon on Convoy" or "Read my startup's coordination health."

Seven asks: "What sources should I pull?" The user says: "Get the GitHub data" or "Search for their postmortem" or "Here, I'll paste their pitch deck."

### The import

The system fetches data from whatever sources the user declared:

- A GitHub repo's commit history, contributors, releases, README
- Web search results for press coverage, postmortems, analyst reports
- A specific URL's content — a blog post, a CEO memo, a filing
- Or the user pastes text directly

Each piece of evidence lands as a `GND` witness clause with provenance classification. The user can see: this is `internal` evidence (from the subject's own repo), this is `independent` evidence (from a journalist), this is `self-reported` evidence (from the founder's blog), this is `external` evidence (from market data).

### The analysis

Seven proposes a structural read. The read uses the Lœgos clause system:

- `DIR` — what are we analyzing and why
- `GND` — what evidence do we have, from what sources, at what provenance level
- `MOV` — what structural classification are we proposing
- `TST` — what would confirm or falsify this read
- `RTN` — what came back when we checked
- `CLS` — what can we close, and at what trust level

The compiler runs on the analysis in real time. It checks:

- Are there enough witnesses? (basic shape check)
- Are the witnesses from diverse provenance? (provenance classification)
- Is the aim drifting without corresponding evidence? (SH010 — GO1 detection)
- Is the explanation growing faster than the evidence? (SH011 — GO2 detection)
- Has the identity been reframed without reality forcing it? (SH012 — GO3 detection)
- Are all witnesses externally governed? (SH013 — GO4 detection)
- Are moves and tests deferred to later? (SH014 — GO5 detection)
- Is a position being treated as permanent? (SH015 — GO6 detection)

The diagnostics surface in the working echo alongside the structural read.

### The refinement

The user and Seven go back and forth. The user adds more evidence. Seven refines the read. The compiler updates its diagnostics. The working echo tracks:

- **Aim:** what structural hypothesis are we testing
- **Supports:** what evidence confirms the read
- **Weakens:** what evidence contradicts the read
- **Missing:** what evidence we'd need to be more confident
- **Deciding split:** what would change the classification
- **Ghost operators detected:** which compound patterns the compiler found
- **Provenance balance:** how much evidence is internal vs external vs self-reported vs independent

### The seal

When the analysis is confident enough, the user seals a receipt. The receipt records:

- The declared aim (what was analyzed)
- The evidence chain (every `GND` witness with provenance)
- The structural read (braid topology, stabilizer form, ghost operators found)
- The trust level (L1/L2/L3 based on evidence quality and diversity)
- The deciding split (what would change the read)
- The self-calibration result (the compiler's check on its own analysis)

The sealed receipt can become a source in another box. A Recon receipt from Godot can inform a box about governance design. A Recon receipt from Convoy can inform a box about risk assessment.

### The self-check

After sealing, the system compiles the receipt itself and checks whether the analysis committed the same violations it was looking for. If the Recon of Convoy seals with SH004 (story + seal without ground), the system surfaces it: "Your analysis of Convoy has the same structural violation you identified in Convoy."

---

## Features

### Feature 1: Multi-source data import

**What:** One command that pulls structured evidence from any public coordination trail.

**Source types:**

| Type | What it fetches | How |
|---|---|---|
| `github` | Repo metadata, commits, contributors, releases, README | `gh` CLI |
| `search` | Press coverage, postmortems, analyst reports | Web search |
| `fetch` | Full text from any URL | Web fetch |
| `web` | Combined search + fetch | Composed |
| `paste` | User-provided text | Direct input (already exists) |

**Output:** Formatted `GND` witness clauses with automatic provenance classification:
- `internal` — evidence from the subject's own operations
- `external` — evidence governed by outside forces
- `self-reported` — evidence from the subject about itself
- `independent` — evidence from sources with no stake

**User experience:** "Get the GitHub data for Godot" → system fetches → clauses appear as sources in the box. Or: "Search for Convoy postmortem" → system searches → results appear as witness clauses with provenance labels.

### Feature 2: Compound ghost operator detection

**What:** The compiler detects ghost operators as multi-clause patterns, not just single-clause violations.

**Detectable patterns (v1):**

| Ghost Operator | Compiler code | What triggers it |
|---|---|---|
| GO1: Builder outruns codebase | `SH010` | DIR aim broadens across windows while GND count stays flat |
| GO2: Explanation accretes | `SH011` | SW002 recurs across 3+ windows without resolution |
| GO3: Identity churn | `SH012` | DIR reframed 3+ times without corresponding RTN |
| GO4: Environment as ground | `SH013` | All GND witnesses share external classification |
| GO5: Serial completion bias | `SH014` | MOV/TST absent from early windows, appear only late |
| GO6: Position as permission to stop | `SH015` | CLS seal on a state not re-tested in 3+ windows |

**User experience:** After Operate or during conversation, the working echo shows: "Pattern detected: SH013 — all evidence sources are externally governed. If the external environment shifts, this read becomes unreliable regardless of internal coordination quality."

### Feature 3: Witness provenance classification

**What:** Every piece of evidence is classified by where it came from and how much to trust it.

**Classifications:**

| Class | What it means | Trust implication |
|---|---|---|
| `internal` | From the subject's own operations | High relevance, potential bias |
| `external` | From outside forces | Context, not proof of the subject's coordination |
| `self-reported` | The subject describing itself | Highest bias risk — pitch decks, READMEs, founder posts |
| `independent` | No-stake third party | Highest trust — press, filings, community, benchmarks |

**User experience:** Each witness clause in the analysis shows its provenance badge. The working echo tracks the provenance balance: "This analysis has 8 witnesses: 5 self-reported, 2 external, 1 independent. Trust ceiling is L1 until more independent witnesses are added."

### Feature 4: Severity grading

**What:** Two violations with the same code can have vastly different severity. The compiler grades by co-occurrence and timing.

**Formula:** `severity = simultaneous_violation_count × (1 / window_index)`

**User experience:** "SH002 (seal without return) at severity 0.3 — slow burn, one violation in a late window" vs "SH002 + SH003 + SH004 at severity 9.0 — catastrophic, three simultaneous violations in window 1."

### Feature 5: Self-calibration

**What:** After sealing, the system compiles the analysis itself and checks for the same violations.

**User experience:** "Self-check: your Recon analysis has SH011 (explanation growing faster than evidence) — you added 4 interpretation clauses in the last turn but no new GND witnesses. Consider adding independent evidence before treating this read as grounded."

### Feature 6: Receipt portability

**What:** A sealed Recon receipt can become a source in any other box.

**User experience:** User has a box about governance design for their own startup. They import the sealed Godot Recon receipt as a source. The receipt's finding — "community braids need one integrator as stabilizer" — becomes a `GND` witness in the governance box. The trust level transfers: if the Recon was L2, the imported witness is L2.

### Feature 7: Narrative trail analysis (no code required)

**What:** Recon works on narrative trails (postmortems, pitch decks, board updates, founder blogs) — not just code trails.

**User experience:** "Search for Convoy postmortem" → system finds press articles and CEO memo → user and Seven analyze the narrative trail using the same Lœgos clauses and the same compiler. The ghost operators fire on the narrative the same way they fire on a commit log.

This is what makes Ghost Recon substrate-agnostic. A GitHub repo and a CEO shutdown memo both produce `GND` witness clauses. The compiler doesn't know the difference. The language works on both.

---

## What is NOT a feature

- **No Recon dashboard.** The Room is the surface. No new UI.
- **No Recon mode toggle.** A Recon box is a regular box with `DIR analyze {subject}` as the aim. The compiler handles it the same way.
- **No special Recon prompts for Seven.** The clauses structure the analysis. Seven proposes clauses like it proposes any other structural change in the Room.
- **No Recon-specific echo panel.** The working echo reads the same DIR/GND/MOV/TST/RTN/CLS clauses it always reads.
- **No export format.** The sealed receipt IS the export. It's already a Lœgos artifact that can travel between boxes.

---

## Architecture

```
User declares: "Analyze {subject}"
         │
         ▼
    Multi-source importer
    (github / search / fetch / paste)
         │
         ▼
    GND witness clauses with provenance
    (internal / external / self-reported / independent)
         │
         ▼
    Room conversation
    (user + Seven develop the structural read as DIR/GND/MOV/TST/RTN/CLS)
         │
         ▼
    Compiler
    (parse → kind → shape → patterns)
         │
         ▼
    Diagnostics
    (single-clause violations + compound ghost operator patterns + severity)
         │
         ▼
    Working echo
    (aim + supports + weakens + missing + deciding split + ghost operators + provenance balance)
         │
         ▼
    Seal
    (receipt with evidence chain + structural read + trust level + self-calibration)
         │
         ▼
    Receipt travels to other boxes as GND witness
```

Every component except the multi-source importer already exists. The importer is the only new infrastructure. Everything else is a compiler extension (language improvement) or existing system reuse.

---

## Build plan

| Phase | What | Effort | What it proves |
|---|---|---|---|
| **Phase 0** | Run one full Recon manually in the Room. Write clauses by hand. Paste evidence manually. Seal a receipt. Zero code changes. | 2 hours | The language can express structural analysis as-is. The Room handles it. |
| **Phase 1** | Add `patterns.mjs` to the compiler. SH010-SH015 compound diagnostics. Severity grading. | 1 day | Ghost operators are detectable by the compiler as compound patterns. |
| **Phase 2** | Add witness provenance to the parser. `internal`/`external`/`self-reported`/`independent` on GND clauses. | Half day | The compiler distinguishes evidence quality by source. |
| **Phase 3** | Build the multi-source importer. GitHub + search + fetch + web handlers. Provenance inference. | 1 day | External data auto-formats as compilable GND clauses from any source. |
| **Phase 4** | Add self-calibration. Compile the sealed receipt. Surface self-diagnostics. | 2 hours | The instrument checks its own output. |
| **Phase 5** | Run 5 Recon analyses end-to-end. Mix of GitHub repos and narrative trails. | 2-3 days | Full instrument works across source types and substrates. |
| **Phase 6** | Run one Recon using ONLY narrative sources (no code). A dead startup from web search + press + founder memo. | Half day | The instrument is truly substrate-agnostic. |
| **Phase 7** | Import a Recon receipt into another box as a GND witness. Verify trust level transfers. | 1 hour | Receipts are portable. |

**Total: ~6-7 days.**

Phase 0 starts with zero code. Every subsequent phase adds one capability. Any phase can be the stopping point — the work done so far is useful.

---

## Success criteria

| # | Criterion | How to test |
|---|---|---|
| 1 | A Recon written in Lœgos clauses compiles and produces meaningful diagnostics | Run the compiler on a manually written Recon doc |
| 2 | Compound patterns distinguish healthy from unhealthy subjects | Compare diagnostics for Godot (healthy) vs a dead startup (unhealthy) |
| 3 | Multi-source evidence produces higher trust than single-source | Compare trust levels for GitHub-only vs GitHub+press+HN |
| 4 | Self-calibration catches the instrument's own violations | Seal a Recon with known SH004 and verify the self-check catches it |
| 5 | Narrative-trail Recon works without any code data | Analyze Convoy from press + CEO memo + HN only |
| 6 | Receipts travel between boxes with trust levels intact | Import a sealed Recon receipt into a different box |
| 7 | No UI changes were needed | Verify the Room rendered Recon without frontend modifications |
| 8 | The instrument finds something the manual analysis missed | Compare product-generated reads to the existing manual Recon corpus |

---

## What ships when

| Milestone | What the user can do | When |
|---|---|---|
| **Phase 0 complete** | Analyze any subject manually in the Room using Lœgos clauses | Day 1 |
| **Phase 2 complete** | Get ghost operator diagnostics from the compiler on any Recon analysis | Day 2 |
| **Phase 3 complete** | Import evidence from GitHub, web search, or any URL with one command | Day 3 |
| **Phase 4 complete** | See self-calibration results after sealing a Recon receipt | Day 3 |
| **Phase 6 complete** | Analyze a dead startup from narrative sources alone — no code needed | Day 5 |
| **Phase 7 complete** | Carry Recon receipts into other boxes as portable evidence | Day 5 |

After day 5, Ghost Recon is a working instrument. After day 7 (5 full analyses complete), there's enough evidence to publish.

---

## What this makes possible

**For the founder:** Analyze your own startup's coordination trail. Import your board updates, your pitch deck history, your GitHub repo. See what ghost operators the compiler finds. Compare to the dead startups. Know what the shape checker would have said in week 3.

**For investors / accelerators:** Analyze portfolio companies or cohort members. Import weekly check-ins. Run the shape checker. See which companies have structural violations early enough to reroute.

**For open-source maintainers:** Analyze your project's governance health. Import your contributor data, release history, and community discussions. See your braid topology, your stabilizer form, your ghost operators.

**For anyone making a decision:** Import the evidence trail. Write the aim. Let the compiler check whether your coordination is honest. Seal a receipt of what you found. Carry that receipt forward.

**For the product:** Ghost Recon is the first use case where Lœgos compiles something other than the user's own coordination text. It proves the language is an instrument, not a journal. It produces publishable receipts that demonstrate the product's capability. And it continuously improves the compiler's diagnostic vocabulary through every new analysis.

---

## One-line position

Ghost Recon is a structural analysis instrument that reads any coordination trail — code, narrative, or mixed — through the Lœgos compiler, detects ghost operators as compound patterns, classifies evidence by provenance, self-calibrates after sealing, and produces portable receipts that travel between boxes. It ships in 7 days by extending the language and building one multi-source data importer. The Room is the surface. The compiler is the brain. The receipt is the output.

△ declared. □ when Phase 0 completes and the language proves it can express the analysis without code changes.
