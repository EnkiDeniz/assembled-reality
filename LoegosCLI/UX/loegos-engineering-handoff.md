# Lœgos Engineering Handoff

Date: April 9, 2026
Status: Ready for implementation
Author: Deniz Sengun, Intelligence Architect, Lakin.ai

---

## 1. What Lœgos Is

Lœgos is a coordination language for turning decisions into bounded, testable, receipt-bearing programs. It is not a chat tool, not a task manager, not a notebook. It is a language with a compiler, a runtime, and a receipt ledger.

The product has two user surfaces built on one compiled artifact:

- **Mirror** — for everyone. Box on top (aim / evidence / story / action), chat below. Talk naturally, see your structure, tap any sentence to reveal the Lœgos line underneath.
- **Editor** — for builders. Syntax-highlighted `.loe` source, file tree, domain rails, inline shape diagnostics.

Both surfaces consume the same compile output. Neither surface runs its own analysis. The compiler is the truth. The surfaces are renderers.

---

## 2. What to Build, in Order

### Phase 1: The Compiler Library

This is the foundation. Everything else depends on it.

**Input:** `.loe` source text (ASCII).

**Output:** A single JSON artifact containing:

```
{
  tokenizedLines:  [...],   // tokens with categories and source spans
  ast:             [...],   // parsed clauses: head, verb, positionals, keyword parts
  symbolTable:     {...},   // references with kinds, binding sites, usages
  diagnostics:     [...],   // SH/SW codes with severity, message, line, involved refs
  windowState:     "...",   // canonical state from precedence model
  stats:           {...}    // line count, clause count, error count, warning count
}
```

**Language:** Rust, Zig, or TypeScript. Must compile to WASM for browser use and run as CLI for testing.

**Spec:** The full grammar, verb signatures, kind system, and shape checker predicate logic are defined in the Compiler-Facing Spec v0.5 (attached). Key sections:

- Section 3: Grammar (ASCII, `HEAD VERB POSITIONAL* KEYWORD_PART*`)
- Section 7: Verb signatures with kind expectations
- Section 9: Kind pass with error codes KH001–KH006
- Section 13: Shape rules SH001–SH008, warnings SW001–SW006
- Section 10: Runtime contract (adapters, channels, window states, transitions)
- Section 11: Assembly graph JSON output schema

**Test corpus:** The 20 tiny programs (attached) plus the 4 canonical examples from the spec with expected parse/kind/shape results.

**Success criterion:** The compiler can parse all sample files, emit deterministic JSON, and the shape checker catches all known fake-convergence patterns (self-sealing, seal-without-return, unprovenanced strong closure, contradiction-before-seal).

### Phase 2: Mirror Surface

The primary user interface. Light mode. One screen, two layers.

**Top: The Box**

The box is the primary artifact. It shows:

| Region | Sigil | Content | Source |
|---|---|---|---|
| Aim | △ | One sentence | `DIR aim` from compile output |
| Evidence | ◻ | List of witnesses, constraints, measures | `GND` clauses |
| Story | ○ | List of interpretations, flags | `INT` clauses |
| Action | → ? ↩ | Moves, tests, returns with provenance | `MOV`, `TST`, `RTN` clauses |
| State | | Window state badge | `windowState` from compiler |

Evidence and Story sit side by side so the user can see the ratio. The visual weight of the two columns is itself a diagnostic — if Story is full and Evidence is empty, the imbalance is self-evident before any warning text appears.

The box is collapsible. Each region is tappable to expand detail. Items can be approved, edited, or removed.

**Bottom: Chat Intake**

The user types, speaks, or drops files. Seven (the AI layer) processes input and proposes box updates. Seven's replies appear as natural language with tappable sentence-level structure reveals.

When the user taps a sentence in Seven's reply:
1. The Lœgos line appears inline (e.g., `◻ GND witness @lender_notes from "stated"`)
2. The corresponding box region pulses briefly

**Critical architecture rule:** Seven proposes segments with domain tags and suggested box updates. The compiler validates and canonicalizes those proposals before they become box state. Seven does not directly mutate the artifact. The flow is:

```
User input → Seven proposes → Compiler validates → Box updates → Mirror renders
```

**State model:** The box state comes from the compiler output, not from UI heuristics. One state, one precedence rule:

```
shape_error > flagged > awaiting > rerouted > stopped > sealed > open
```

### Phase 3: Editor Surface

The builder interface. Dark mode. IDE-like.

- File tree on the left with state dots per file (color = window state from compiler)
- Tab bar across the top
- Syntax-highlighted source: heads in domain color with rendered glyph beside them, references in cyan, keywords in purple, strings in gold, adapters in green
- Domain rails: thin colored bar on left edge of each line showing which domain group the line belongs to. Clickable to fold/unfold domain groups
- Line numbers with error/warning dots in gutter
- Inline diagnostics: primary error visible without click, others on click
- Diagnostics panel at bottom with clickable errors that highlight source lines
- Status bar: clause count, error/warning tally, window state

**Critical architecture rule:** The editor renders compiler output. It does not run its own parser or checker. Same compiler library, same JSON artifact, different renderer.

### Phase 4: Ledger, Integrations, Runtime

- Sealed/flagged/stopped/rerouted boxes deposit traces to append-only ledger
- Move adapters: manual (user reports back), shell, HTTP, queue
- Return channels: user, system, service, stripe, substack, etc.
- Voice input as first-class intake mode
- Multi-box overview with state scanning

---

## 3. Key Design Decisions (Already Made)

**ASCII source, rendered sigils.** Source files use `DIR`, `GND`, `INT`, `XFM`, `MOV`, `TST`, `RTN`, `CLS`. The sigils △ ◻ ○ œ → ? ↩ 7 are rendering sugar. The editor shows both. The mirror shows only rendered forms.

**Shape errors are the invention.** Three error classes: syntax (malformed line), kind (wrong type pairing), shape (structurally valid program that fakes convergence). Shape errors are the most important. They catch self-sealing, story-without-ground, seal-without-return. This is what makes Lœgos different from every other tool.

**Receipt provenance is enforced.** Every return (`RTN`) in a strong-closure path must carry a `via` channel (user, system, service, stripe, etc.). Untethered receipts cannot seal. This is SH007.

**Witness versioning is enforced.** Every witness (`GND witness`) in a closure path must carry a `with` identity token (hash, version, date). Unanchored witnesses cannot close. This is SH006.

**No control flow.** The kernel has no if/else/loops. Every line declares assembly position. If conditionality enters later, it enters as guarded closure (`CLS seal target if condition`), not as branching.

**Compile-time and runtime are separate.** Compile-time turns source into inspectable structure. Runtime touches reality. The boundary is constitutional. If they collapse, fake coherence becomes undetectable.

**No silent overwrite.** A reference cannot change kind without explicit transformation. A witness cannot become a receipt by renaming. This is SH005.

---

## 4. What the Prototypes Got Right

- The box-on-top / chat-below layout is the correct product architecture
- Tappable sentence reveals bridging natural language to compiled structure
- Evidence and Story side by side so the ratio is visible
- Domain rails in the editor showing assembly shape at a glance
- Compiler as a separated module with a single `compile(source)` entry point
- Shape diagnostics surfaced one at a time, contextually, in plain language
- Window state as a single canonical computation with defined precedence

## 5. Where the Prototypes Are Deliberately Simplified

The prototypes contain a JavaScript compiler module that is a simplified placeholder. It must be replaced with the real compiler library. Specific gaps:

1. **Box model is shallow.** Prototypes track aim/evidence/story/moves. Production box must include tests, returns, closure, provenance, and full runtime state.

2. **Seven directly mutates box.** Prototypes let the AI model propose `boxRegion`/`boxAction`/`boxValue` that directly update state. Production must route Seven's proposals through the compiler/checker before they become canonical box state.

3. **State is inferred from content.** Prototype mirror infers state from what's present (has evidence → grounded, has moves → awaiting). Production state must come from the compiler's `windowState` output.

4. **Shape checker is incomplete.** Prototype implements SH001, SH002, SH004, SH006, SH007, SH008, SW001, SW002, SW003. Full spec has additional rules around `active_path`, `imported_receipt_origin`, `witness_drifted_since_compile`, and `awaiting_age`.

5. **No witness versioning at runtime.** Prototypes use `with` tokens in source but don't track version drift or recompile pressure.

6. **No real runtime.** Move adapters, return channels, and window state transitions are specified but not implemented.

---

## 6. Attached Files

| File | Purpose |
|---|---|
| `loegos-kernel-v0.1.md` | Language kernel spec — sigils, grammar, assembly law, error model |
| `loegos-compiler-spec-v0.5.md` | Compiler-facing spec — ASCII grammar, verb signatures, shape predicates, runtime contract |
| `loegos-tiny-programs-v0.2.md` | 20 test programs against real Lakin use cases with strain analysis |
| `loegos-user-experience.md` | Canonical UX philosophy — mirror, three responses, five-minute literacy |
| `loegos-ux-specification.md` | Full UX spec — box anatomy, input model, regions, action flow, shape checker surface, multi-box, design principles, prototype phases |
| `loegos-unified.jsx` | Working prototype — mirror view (box + chat) and editor view with compiler module |
| `loegos-editor-v2.jsx` | Full editor prototype with separated compiler, domain rails, diagnostics |
| `loegos-design-system-v4.1.jsx` | Design system — hex glyph, tokens, signal colors, assembled cards, convergence bar |

---

## 7. The One Sentence

Build the compiler first. If the shape checker works, everything else follows. If it doesn't, the symbols deserve to die.
