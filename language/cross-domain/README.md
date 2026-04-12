# Cross-Domain Braid Analysis

Date: April 12, 2026
Purpose: Test whether Braided Emergence and Lœgos read external codebases across seven structural domains.

## Methodology

Each domain contains 6-7 top open-source repositories. For each repo, we collected: creation date, language, stars, contributors, commit distribution, release cadence, and governance topology. We then applied the same analytical framework used on our own project history:

- **Lœgos compilation:** △ aim, □ reality, œ weld, 𒐛 seal, signal (green/amber/red), trust (L1/L2/L3)
- **Braid analysis:** construction/constraint loops, crossing points, stabilizer identification, ghost operators
- **Cross-repo findings:** patterns visible only across the domain

## Contents

| # | Domain | File | Key question | Closest analog to Lœgos |
|---|---|---|---|---|
| 0 | Game Engines | [../game-engine-braid-analysis.md](../game-engine-braid-analysis.md) | Every engine needs a stabilizer | GDevelop (language-as-product, solo founder) |
| 1 | Compilers | [01-compilers.md](./01-compilers.md) | Does language-as-product hold? | Tree-sitter (rendering layer) or SWC (solo-founder compiler) |
| 2 | Editors | [02-editors.md](./02-editors.md) | Does rendering-on-text hold? | CodeMirror (solo-author rendering library) |
| 3 | Knowledge Tools | [03-knowledge-tools.md](./03-knowledge-tools.md) | Where does note-app end? | None — Lœgos is not a note app |
| 4 | Proof Systems | [04-proof-systems.md](./04-proof-systems.md) | Does our trust spine match? | Lean 4 (proof-as-stabilizer, language-first) |
| 5 | Collaboration | [05-collaboration-tools.md](./05-collaboration-tools.md) | Do coordination tools share our ghost operators? | Excalidraw (aesthetic-as-stabilizer) |
| 6 | AI Agents | [06-ai-agent-frameworks.md](./06-ai-agent-frameworks.md) | Does consent-before-compute distinguish us? | Claude Code (gated agentic tool) or none |
| 7 | Ledger/Receipt | [07-ledger-receipt-systems.md](./07-ledger-receipt-systems.md) | Is the receipt the atomic invariant? | Git (receipt chain for decisions) |

## Synthesis

See [synthesis.md](./synthesis.md) for the cross-domain findings.

## What this analysis is NOT

- Not a feature comparison
- Not a market positioning document
- Not a competitive analysis
- Not a reason to build more before shipping
