# Ghost Recon

The invisible rules that run the coordination you think you're running.

**Lakin.ai · April 2026**

---

## What this folder is

Everything about the Ghost Recon feature in one place: the core instrument, the research corpus, the startup postmortems, the integration proposal, the build proposal, and the theoretical extensions. A new agent or team member starts here and has the full picture.

---

## How to read this folder

**Start with the build proposal** if you want to know what to build.
**Start with the core instrument** if you want to understand what Ghost Recon does.
**Start with the research** if you want to see the evidence behind it.

---

## Contents

### Build documents

| File | What it is | Read when |
|---|---|---|
| [build-proposal.md](./build-proposal.md) | What to build, features, architecture, phases, success criteria. The build plan. | You're ready to implement. |
| [integration.md](./integration.md) | How Ghost Recon integrates into the Lœgos system. Language extensions, compiler diagnostics, multi-source importer, self-calibration. | You need the technical architecture. |

### Core instrument

| File | What it is | Trust level |
|---|---|---|
| [files/ghost-recon.md](./files/ghost-recon.md) | The core document. Three universal ghost operators. The shape checker. Worked examples. Written in arrive → ground → declare → test → return → seal rhythm. | Green |
| [files/ghost-recon-startups.md](./files/ghost-recon-startups.md) | Five dead startups (Kite, Convoy, InVision, The Messenger, SciFi Foods) read through the instrument. | Green |
| [files/ghost-recon-research-directions.md](./files/ghost-recon-research-directions.md) | Where to point the instrument next. Three new candidate operators (GO4-GO6). Pre-registration of GO7. Seven research directions. Self-calibration protocol. | Amber |
| [files/seven-shadows.md](./files/seven-shadows.md) | Archangel mapping of ghost operators to emergence stages. Symbolic compression. | Attested — not sealed |

### Research corpus

| File | What it analyzed | Repos | Key finding |
|---|---|---|---|
| [research/project-history-analysis.md](./research/project-history-analysis.md) | Our own project: 20 repos, 286 commits, 7 phases | 20 | Three ghost operators; the project discovers it is not what it thinks it is |
| [research/game-engine-braid-analysis.md](./research/game-engine-braid-analysis.md) | 7 game engines | 7 | GDevelop is our structural twin; language-as-product solo founders have the tightest braids |
| [research/loegos-recon.md](./research/loegos-recon.md) | The unified report across all domains | 75 | Stabilizer form predicts durability better than any other property |
| [research/cross-domain/01-compilers.md](./research/cross-domain/01-compilers.md) | 7 compilers and language toolchains | 7 | The language IS the stabilizer in compiler projects; LLVM's IR outlasts everything |
| [research/cross-domain/02-editors.md](./research/cross-domain/02-editors.md) | 7 code editors and IDEs | 7 | Every surviving editor renders analysis ON the text; CodeMirror is our analog |
| [research/cross-domain/03-knowledge-tools.md](./research/cross-domain/03-knowledge-tools.md) | 6 note-taking / knowledge tools | 6 | Lœgos is NOT a note app; no note tool has an Operate equivalent |
| [research/cross-domain/04-proof-systems.md](./research/cross-domain/04-proof-systems.md) | 7 proof and verification systems | 7 | Proof-as-stabilizer is the maximum-strength stabilizer; our trust spine is a weaker analog |
| [research/cross-domain/05-collaboration-tools.md](./research/cross-domain/05-collaboration-tools.md) | 6 collaboration / coordination tools | 6 | Features accrete until the tool becomes the work; no coordination tool compiles coordination |
| [research/cross-domain/06-ai-agent-frameworks.md](./research/cross-domain/06-ai-agent-frameworks.md) | 6 AI agent frameworks | 6 | 5 of 6 are structurally unbraided (Loop A without Loop B); consent-before-compute is our differentiator |
| [research/cross-domain/07-ledger-receipt-systems.md](./research/cross-domain/07-ledger-receipt-systems.md) | 6 ledger / receipt / provenance systems | 6 | The receipt IS the universal atomic invariant; Git is our structural analog |
| [research/cross-domain/synthesis.md](./research/cross-domain/synthesis.md) | Cross-domain synthesis | All 75 | 5 universal patterns; the emergent finding (stabilizer form predicts durability) |
| [research/cross-domain/README.md](./research/cross-domain/README.md) | Index and methodology for cross-domain analyses | — | — |

### Superseded (kept for lineage)

| File | What it was | Why it's superseded |
|---|---|---|
| [research/loegos-recon-next-steps.md](./research/loegos-recon-next-steps.md) | Early next-steps proposal | Superseded by build-proposal.md |
| [research/loegos-recon-integration-proposal.md](./research/loegos-recon-integration-proposal.md) | Early integration proposal (before language-first correction) | Superseded by integration.md |

---

## The numbers

- **75 external repositories** analyzed across 8 domains
- **20 internal repositories** analyzed across the project's own history
- **5 dead startups** read through the instrument
- **3 confirmed ghost operators** (GO1-GO3), 3 candidate operators (GO4-GO6), 1 pre-registered prediction (GO7)
- **6 compound compiler diagnostics** proposed (SH010-SH015)
- **4 witness provenance classes** defined (internal, external, self-reported, independent)
- **~1,000 lines of new code** estimated for the full build
- **7 build phases**, starting with zero code changes
- **~6-7 days** total implementation effort

---

## The rule

The language does the analysis. The compiler does the checking. The machine imports data and persists receipts. If a proposed feature cannot be expressed as a language extension or a compiler diagnostic, it is building beside the language instead of extending it.

---

## Quick reference: Ghost operators

| # | Name | What it is | Compiler code |
|---|---|---|---|
| GO1 | Builder outruns codebase | The builder's understanding exceeds what the code can express | SH010 |
| GO2 | Explanation accretes | Documentation grows faster than outcomes | SH011 |
| GO3 | Identity churn | The project discovers it is not what it thinks it is | SH012 |
| GO4 | Environment as ground | Favorable conditions mistaken for earned receipts | SH013 |
| GO5 | Serial completion bias | Stages must fully complete before the next begins | SH014 |
| GO6 | Position as permission to stop | An achieved state treated as permanent | SH015 |
| GO7 | Hope as faith | Hope substitutes for evidence (pre-registered, not confirmed) | TBD |

---

## Where to start

1. Read [build-proposal.md](./build-proposal.md)
2. Run Phase 0: one manual Recon in the Room with zero code changes
3. If it works, proceed to Phase 1 (compiler extensions)
4. If it doesn't, the gap tells you what the language needs

𒐛
