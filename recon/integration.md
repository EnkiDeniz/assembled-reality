# Ghost Recon — Integration Into Lœgos

Date: April 12, 2026 (updated: multi-source connector)
Status: Proposal
Purpose: Define how Ghost Recon becomes part of the Lœgos system by extending the language and the compiler, not by building machinery beside them.

---

## The mistake we keep making

Every time a new capability is needed, the instinct is to build a product feature: a new route, a new component, a new panel, a new prompt template. The documented lesson — captured in `language-first-build-rule-2026-04-11.md`, in Ghost Operator 2 of the project history analysis, and in the founder's own correction ("stop writing about Lœgos and start letting the engine speak Lœgos") — is that the language should do the work. The machine should import, persist, and render. The compiler should check.

This proposal follows that rule. The language does the analysis. The compiler detects ghost operators as compound patterns. The machine imports data from any source and formats it as compilable clauses.

---

## What the language already does

Ghost Recon's entire analytical method is expressible in existing Lœgos clauses:

| Analytical move | Lœgos clause | Example |
|---|---|---|
| Name the subject | `DIR aim` | `DIR analyze braid topology of godotengine/godot` |
| Record evidence | `GND witness` | `GND contributor akien-mga has 31,259 commits` |
| Note what contradicts | `GND witness` | `GND akien-mga concentration creates bus-factor risk` |
| Identify the stabilizer | `GND witness` | `GND stabilizer: community review + one integrator as gatekeeper` |
| Name the ghost operator | `GND witness` | `GND ghost operator: one person controls the merge` |
| Propose a structural read | `MOV move` | `MOV classify as community braid with single-integrator stabilizer` |
| Define what would test it | `TST test` | `TST does the project survive if akien-mga steps back?` |
| Record what came back | `RTN return` | `RTN forked-governance experiment showed community could self-organize` |
| Close the read | `CLS seal` | `CLS community braid confirmed at L2; integrator dependency at amber` |

Every move in the Ghost Recon methodology maps to an existing clause type. No new clause types are needed for the basic instrument.

---

## What the compiler needs to learn

The compiler currently checks single-clause violations. Ghost Recon needs **compound pattern detection** — violations that only become visible across multiple clauses or across multiple windows.

### Extension 1: Compound shape diagnostics

New diagnostic codes for multi-clause patterns:

| Code | Name | Pattern | Ghost Operator |
|---|---|---|---|
| `SH010` | Aim scope drift | `DIR` aim broadens across windows while `GND` witness count stays flat | GO1 |
| `SH011` | Explanation accretion | `SW002` recurs across 3+ windows without resolution | GO2 |
| `SH012` | Identity churn | `DIR` aim reframed 3+ times without corresponding `RTN` return | GO3 |
| `SH013` | External ground dependency | All `GND` witnesses share an external source classification | GO4 |
| `SH014` | Serial completion bias | `MOV` and `TST` absent from early windows, appearing only late | GO5 |
| `SH015` | Position seal | `CLS` seal on a state not re-tested in 3+ windows | GO6 |

**Implementation:** A `patterns.mjs` pass in the compiler pipeline, after the shape pass. Reads the full clause list and emits compound diagnostics. ~200-300 lines.

### Extension 2: Ghost operator as diagnostic category

New diagnostic severity: `pattern`. Advisory, not blocking. Surfaces in the working echo as "patterns detected" without preventing any operation.

**Implementation:** ~70 lines across `constants.mjs` and echo builder.

### Extension 3: Witness provenance classification

The compiler must distinguish evidence sources:

| Classification | Meaning | Examples |
|---|---|---|
| `internal` | Under the subject's control | Commits, test results, shipped features, internal metrics |
| `external` | Governed by outside forces | Market conditions, investor sentiment, sector trends, regulatory environment |
| `self-reported` | From the subject about itself | README, pitch deck, founder blog post, CEO memo, company about page |
| `independent` | From a source with no stake | Third-party review, community discussion, press investigation, benchmark, financial filing |

Syntax: `GND witness @akien-mga internal commit-history`

**Implementation:** ~70 lines across `parse.mjs` and `kind.mjs`.

### Extension 4: Severity grading

Severity = `count(simultaneous_violations) × (1 / window_index)`. More violations at the same time = higher severity. Earlier in the program = higher severity.

**Implementation:** ~40 lines in `patterns.mjs`.

---

## What the machine does (data import from any source)

The machine's job is importing data from any public coordination trail and formatting it as compilable `GND` witness clauses with provenance classification. The language then analyzes. The compiler then checks.

### The multi-source Recon importer

One route that handles multiple source types:

```
POST /api/recon/import
{
  "type": "github" | "web" | "search" | "fetch",
  "target": "godotengine/godot" | "https://..." | "Convoy shutdown postmortem"
}
```

Each type uses a different data source but produces the same output: formatted `GND` clauses ready for compilation.

### Source type: `github`

**Uses:** `gh` CLI (already authenticated)

**Fetches:**
- Repo metadata (name, description, stars, forks, language, license, created date)
- Commit log (last 200: date, message, author)
- Contributor list (top 20: login, commit count)
- Release history (last 10: tag, date)
- README (first 2000 chars)

**Formats as:**
```
GND witness repo-metadata internal repo-data
  godotengine/godot, created 2014-01-04, C++, 109k stars, MIT
GND witness contributor-distribution internal commit-history
  akien-mga: 31,259 · Repiteo: 5,546 · reduz: 3,906
GND witness release-cadence internal release-data
  4.6.2-stable 2026-04-01 · 4.5.2-stable 2026-03-19
GND witness readme-declaration self-reported project-description
  Multi-platform 2D and 3D game engine
```

**Implementation:** ~200 lines. Uses the authenticated `gh` CLI.

### Source type: `search`

**Uses:** Built-in web search

**Fetches:** Search results for a query. Returns titles, URLs, and snippets.

**Formats as:**
```
GND witness search-result independent press-coverage
  "Convoy collapse: Read CEO's memo" — GeekWire, 2023-10-19
GND witness search-result independent analyst-report
  "The fall of Convoy, explained" — Axios Seattle, 2023-10-26
GND witness search-result independent industry-analysis
  "Convoy's shutdown exposes the desperate state of trucking" — FreightWaves
```

**Implementation:** ~80 lines. Uses the built-in `WebSearch` tool.

### Source type: `fetch`

**Uses:** Built-in web fetch (any URL)

**Fetches:** Full page content from a specific URL. Extracts text, strips HTML.

**Formats as:**
```
GND witness ceo-shutdown-memo self-reported founder-statement
  "We spent over 4 months exhausting all viable strategic options..."
GND witness freightwaves-analysis independent industry-analysis
  "The business case for swapping out humans for computers in freight..."
```

The provenance classification is inferred from the source:
- Company blog / founder post → `self-reported`
- News outlet / analyst → `independent`
- Industry data / market report → `external`
- Community forum (HN, Reddit) → `independent`
- Government filing (SEC, EDGAR) → `independent`
- App store / registry data → `external`

**Implementation:** ~120 lines. Uses the built-in `WebFetch` tool + provenance inference.

### Source type: `web` (combined search + fetch)

**Uses:** Web search to find relevant URLs, then fetches the top results.

**Formats as:** Combined `GND` clauses from both search results and fetched content.

**Implementation:** ~50 lines. Composes `search` and `fetch`.

### What the importer does NOT do

- Does not analyze the data. The language does that.
- Does not classify the ghost operators. The compiler does that.
- Does not produce the structural read. Seven does that, under the user's declaration.
- Does not decide which sources to fetch. The user declares what to import.

The importer is a pipe: data in, `GND` clauses out. Everything downstream is the existing system.

### Total importer implementation

| Component | Lines | What it does |
|---|---|---|
| Route handler | ~60 | Parses request, dispatches to source handler |
| GitHub handler | ~200 | Fetches via `gh` CLI, formats clauses |
| Search handler | ~80 | Runs web search, formats result clauses |
| Fetch handler | ~120 | Fetches URL content, infers provenance, formats clauses |
| Web handler (composed) | ~50 | Combines search + fetch |
| Provenance inference | ~60 | Classifies source URL as self-reported/independent/external |
| **Total** | **~570** | |

---

## What else the machine does (and only the machine)

### Self-calibration trigger

After a Recon analysis is sealed, the system compiles the sealed receipt's content and checks it for the same violations it was looking for in the subject. If the analysis has SH004 (story + seal without ground), the system says so.

**Implementation:** ~30 lines. Triggers a compile pass on receipt content after seal.

### Receipt persistence

Already exists. No new code. A Recon analysis seals as a `ReadingReceiptDraft` like any other receipt.

---

## What this does NOT include

- **No Recon prompt templates.** The language structures the analysis through clauses.
- **No Recon box template.** A box with `DIR analyze {subject}` IS the template. The compiler's diagnostics guide the user.
- **No working echo adjustments.** The echo reads `DIR` clauses. If `DIR` says "analyze Convoy's braid," the echo's aim is "analyze Convoy's braid."
- **No Drive Tape label changes.** The shapes ARE the labels.
- **No new UI surfaces.** The Room renders Recon the same way it renders any box.

---

## Available data sources (what's connected right now)

The multi-source importer can draw from any of these without additional authentication or setup:

### Already authenticated
| Source | Access method | What it gives |
|---|---|---|
| GitHub API | `gh` CLI | Commits, contributors, releases, issues, PRs, README |

### Available via web search + fetch
| Source | What it gives | Provenance class |
|---|---|---|
| Press coverage (TechCrunch, GeekWire, Axios, etc.) | Postmortems, announcements, analysis | `independent` |
| Founder blog posts / CEO memos | Self-narrated histories, shutdown explanations | `self-reported` |
| Crunchbase / PitchBook (public pages) | Funding rounds, valuations, investors, status | `external` |
| SEC EDGAR filings | S-1, 10-K, proxy statements (public companies) | `independent` |
| Hacker News discussions | Community reactions, insider commentary | `independent` |
| Product Hunt launches | Initial positioning, founding narrative | `self-reported` |
| Archive.org / Wayback Machine | Historical website snapshots (identity drift over time) | `self-reported` (historical) |
| npm / PyPI / crates.io | Download counts, dependency graphs, maintenance signals | `external` |
| App store listings | User reviews, rating trajectories, update frequency | `independent` (reviews), `self-reported` (listing) |
| Wikipedia | Encyclopedic summary (for well-known subjects) | `independent` |
| Court filings / legal databases | Lawsuits, regulatory actions | `independent` |
| Glassdoor (limited) | Employee sentiment, cultural signals | `independent` |

### Available via browser tools (MCP)
| Source | What it gives |
|---|---|
| Any public web page | Full DOM, structured data extraction |
| Vercel deployments | Build logs, runtime logs, deployment history |

### Potential future connectors (not built yet)
| Source | What it would give | Effort |
|---|---|---|
| LinkedIn API | Team growth curves, hiring patterns, org structure | Medium (requires API key) |
| Twitter/X API | Founder public statements, announcement patterns | Medium (requires API key) |
| Slack export | Internal coordination trail (if subject provides) | Low (file import) |
| Calendar data | Meeting patterns, decision rhythms | Low (file import) |
| Email export | Communication trail (if subject provides) | Low (file import) |

The key insight: **the data sources are unlimited but the language is constant.** Every source produces `GND` witness clauses with provenance classification. The compiler checks the same patterns regardless of where the data came from. A Recon analysis grounded in SEC filings + HN discussions + GitHub commits is structurally the same as one grounded in just a README — it just has more witnesses at higher trust levels.

---

## Total new code

| Component | Lines | What it does | Language or machine? |
|---|---|---|---|
| Compound pattern pass | 200-300 | Detects GO1-GO6 as patterns | Language |
| Pattern severity | ~40 | Grades by co-occurrence × timing | Language |
| Witness provenance | ~70 | Classifies GND sources | Language |
| Pattern diagnostic category | ~70 | Surfaces patterns in echo | Language |
| Multi-source importer | ~570 | Fetches from GitHub/web/search, formats as GND clauses | Machine |
| Self-calibration trigger | ~30 | Compiles sealed receipt | Machine |
| **Total** | **~980-1080** | | **~48% language, ~52% machine** |

The ratio shifted from the previous proposal because the multi-source importer is larger than a single GitHub connector. But the machine work is all data plumbing — fetching, formatting, classifying provenance. The analytical intelligence is entirely in the language and compiler.

---

## Implementation sequence

| Step | What | Effort | Tests whether |
|---|---|---|---|
| 1 | Run one Recon manually in the Room using web search + paste (zero code) | 2 hours | The language can express the analysis as-is |
| 2 | Add `patterns.mjs` to compiler (SH010-SH015) | 1 day | Compound diagnostics fire on manually written Recon docs |
| 3 | Add witness provenance to parser | Half day | Compiler distinguishes internal/external/self-reported/independent |
| 4 | Build multi-source importer (GitHub + search + fetch) | 1 day | External data auto-formats as compilable GND clauses |
| 5 | Add self-calibration trigger | 2 hours | Instrument checks its own sealed output |
| 6 | Run 5 Recon analyses with the importer | 2-3 days | Full instrument works end-to-end across source types |
| 7 | Run one Recon using only web search (no GitHub) on a dead startup | Half day | The instrument works on narrative trails, not just code trails |
| 8 | Compare product reads to manual reads | Half day | Product converges with human analysis |

**Total: ~6-7 days.** Step 1 starts with zero code. Each subsequent step adds one piece. The sequence can stop at any step and the work done so far is useful.

---

## Success criteria

1. **A Recon analysis compiles and produces compound diagnostics.** If the pattern pass doesn't catch GO1 in a repo with extreme contributor concentration, improve the pattern. If it does, the language is working.

2. **Multi-source evidence produces different trust readings than single-source.** A Recon with GitHub + press + HN witnesses should produce a higher trust level than one with only a README. If the trust levels don't differentiate, the provenance classification isn't working.

3. **Self-calibration catches the instrument's own violations.** If a Recon seals with SH004 (story + seal without ground), the self-calibration compile should flag it.

4. **The narrative-trail Recon (Step 7) works.** If the instrument can read Convoy's death from press coverage + CEO memo + HN discussion — without any GitHub data — the instrument is substrate-agnostic. This is the test that proves Ghost Recon works on any coordination trail, not just code.

5. **No UI changes were needed.** If the Room handled Recon without frontend modifications, the language did the work.

---

## The language-first check

| Component | Language or machine? | In previous proposal? | In this proposal? | Correct? |
|---|---|---|---|---|
| Compound pattern pass | Language | Yes | Yes | ✓ |
| Witness provenance | Language | Yes | Yes | ✓ |
| Severity grading | Language | Yes | Yes | ✓ |
| Multi-source importer | Machine | GitHub only | GitHub + web + search + fetch | ✓ (expanded) |
| Self-calibration | Machine | Yes | Yes | ✓ |
| Prompt templates | Machine | Previous proposal | **Removed** | ✓ (language does this) |
| Box template | Machine | Previous proposal | **Removed** | ✓ (compiler diagnostics are the template) |
| Echo adjustments | Machine | Previous proposal | **Removed** | ✓ (echo reads DIR clauses as-is) |
| Drive Tape labels | Machine | Previous proposal | **Removed** | ✓ (shapes are the labels) |

Four things removed. The data connector expanded to cover all available sources. The language extensions stayed. The ratio is honest: ~48% language, ~52% machine, where the machine work is pure data plumbing.

---

## One-line position

Ghost Recon integrates into Lœgos by extending the compiler to detect ghost operators as compound patterns, classifying witness provenance in the parser, and building a multi-source data importer that pulls from GitHub, web search, URL fetch, and any public coordination trail — letting the language compile any evidence source the same way, regardless of where it came from.

△ on the proposal. □ when the first multi-source Recon receipt seals through the Room.
