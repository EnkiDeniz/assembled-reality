# Lœgos Unified Architecture v1.1

Date: April 9, 2026
Status: Canonical draft (tightened)
Author: Deniz Sengun, Intelligence Architect, Lakin.ai

---

## 1. One Sentence

Lœgos separates local truth, world return, and reusable structure — and every surface reads from artifacts produced by truth layers; no surface authors truth directly.

---

## 2. System Overview

```
                    ┌─────────────────────────────────────────┐
                    │            USER SURFACES                │
                    │                                         │
                    │   Mirror        Editor        Shape     │
                    │   (everyone)    (builders)    Library   │
                    │                               Operator  │
                    └────────┬──────────┬──────────────┬──────┘
                             │          │              │
                         reads from  reads from    reads from
                             │          │              │
                    ┌────────▼──────────▼──────────────────────┐
                    │          ASSEMBLY ARTIFACT               │
                    │   (canonical compiler output object)     │
                    └──┬─────────────┬─────────────────────────┘
                       │             │
                  produced by   referenced by
                       │             │
              ┌────────▼───┐  ┌──────▼──────┐
              │  COMPILER  │  │   RUNTIME   │
              │  ENGINE    │  │   / LEDGER  │
              │            │  │   ENGINE    │
              └────────────┘  └──────┬──────┘
                                      │
                                consumed by
                                      │
                                ┌─────▼───────┐
                                │    SHAPE    │
                                │   LIBRARY   │
                                │   ENGINE    │
                                └─────────────┘
                       ▲             ▲
                       │             │
                  source from    events from
                       │             │
              ┌────────┴─────────────┴────────────────────────┐
              │           WITNESS INGESTION                    │
              │     (source intake, file processing,           │
              │      API capture, user statements)             │
              └────────────────────────────────────────────────┘
```

---

## 3. Truth Layers

Four engines. Each answers one question. None overlap.

### 3.1 Witness Ingestion

**Question:** What entered?

**Input:** Files, PDFs, CSVs, API exports, screenshots, voice memos, user statements, pasted text.

**Output:** Witness objects with source origin, identity token (hash/version/date), and raw content.

**Boundary rules:**

- Witness objects are immutable once created.
- A witness may be versioned (new snapshot creates a new identity, does not overwrite the old one).
- Witness Ingestion does not interpret, classify, or judge. It records what entered and anchors its identity.

### 3.2 Compiler Engine

**Question:** Is this program lawful?

**Input:** `.loe` source text (ASCII).

**Output:** Assembly Artifact (JSON):

- Tokenized lines with categories and source spans
- AST: parsed clauses with head, verb, positionals, keyword parts
- Symbol table: references with kinds, binding sites, usages
- Diagnostics: SH/SW codes with severity, message, line, involved references
- Compile state: canonical structural state from precedence model
- Assembly graph: structural edges (transforms, comparisons, imports)

**Boundary rules:**

- The compiler is deterministic. Same source → same artifact. Always.
- The compiler does not access runtime state, return history, or the Shape Library.
- The compiler answers structural legality only. It does not know whether a move was executed or a return arrived.
- No surface may run its own parser or checker. All surfaces consume the Assembly Artifact.

### 3.3 Runtime / Ledger Engine

**Question:** Did reality answer?

**Input:** Assembly Artifact (from compiler) + external events (move executions, return arrivals, state transitions).

**Output:** Runtime record object:

- Runtime state (open -> awaiting -> closure_eligible -> sealed/flagged/stopped/rerouted)
- Move records with adapter type and timestamp
- Return records with provenance channel, timestamp, and scalar value
- Closure record with verb, rationale, and timestamp
- Append-only event log

**Boundary rules:**

- Runtime state transitions follow defined rules (Section 10 of Compiler Spec).
- A window may not transition to `sealed` unless the compiler's shape pass has cleared.
- Runtime records are append-only. A sealed receipt is never modified.
- Runtime does not judge structure. It records what happened.
- Runtime state is separate from compile state and never rewrites compiler diagnostics.

### 3.4 Shape Library Engine

**Question:** What structural class did this represent, and is it stable enough to promote?

**Input:** Assembly Artifacts + Runtime traces from closed (sealed/flagged/rerouted) boxes.

**Output:** Structural classifications, candidate shapes, promoted primitives, drift alerts.

**Boundary rules:**

- The Shape Library is strictly downstream. It consumes artifacts and traces. It does not produce them.
- The Shape Library may classify and promote structure, but it may not override local runtime truth or closure history.
- The Shape Library may advise surfaces (e.g., "this pattern has appeared 5 times and succeeded 4 times"). It may not author or mutate box state.
- Promotion follows internal stages: detect recurrence → create candidate → compare against existing shapes → test transfer/stability → promote or reject → monitor drift.

**Enforcement controls:**

- Shape Library service credentials are read-only for artifact/runtime stores.
- Shape Library APIs have no write path into box/source/runtime mutation routes.
- Shape outputs are persisted in separate governance stores (`shape_classifications`, `shape_promotions`, `shape_drift`) with foreign-key references only.
- All advisory outputs must include lineage (`sourceCompilationId`, `sourceRuntimeEventRange`).

---

## 4. The Assembly Artifact

The Assembly Artifact is the single canonical object that flows between all layers and surfaces. It deserves a stable name because everything references it.

**Name:** Assembly Artifact

**Contents:**

```
{
  box:           { ref, name },
  aim:           "...",
  witnesses:     [{ ref, source, identity, kind }],
  interpretations: [{ text, verb, flagged }],
  transforms:    [{ op, from, into }],
  moves:         [{ verb, target, adapter }],
  tests:         [{ verb, target }],
  returns:       [{ verb, ref, channel, scalar_kind, value }],
  closure:       { verb, target, guard },
  compileState:  "...",
  diagnostics:   [{ id, severity, message, line, refs }],
  stats:         { lines, clauses, errors, warnings, symbols }
}
```

**Rule:** Mirror and Editor read this object directly. No surface writes to it directly. Changes flow back through source -> compiler -> new artifact.

## 4.1 Runtime Record (separate object)

```
{
  windowId:        "...",
  compilationId:   "...",
  runtimeState:    "...",
  events:          [...],
  receipts:        [...],
  closureRecord:   {...}
}
```

**Rule:** Runtime Record is append-only and references Assembly Artifacts by `compilationId`.

---

## 5. User Surfaces

Three surfaces. Each serves a different relationship with the system. None author truth.

### 5.1 Mirror

**Who:** Everyone.
**What:** Box on top (aim / evidence / story / action / state), conversational intake below.
**Input mode:** Natural language, voice, file drops.
**Structure visibility:** Rendered shapes (△ ◻ ○). Tappable sentences reveal Lœgos lines. Evidence-vs-story ratio visible at a glance.
**Rule:** Mirror reads from Assembly Artifact + Runtime Record. User edits flow back through source -> compiler -> artifact.

### 5.2 Editor

**Who:** Builders, power users, auditors.
**What:** IDE-like surface. Syntax-highlighted `.loe` source, file tree, domain rails, inline diagnostics, shape checker output.
**Input mode:** Direct source editing.
**Structure visibility:** Full compiled source with token categories, domain grouping, and diagnostic codes.
**Rule:** Editor reads from Assembly Artifact + Runtime Record. Source edits trigger recompilation. The editor never runs its own analysis.

### 5.3 Shape Library Operator

**Who:** System designers, researchers, structural governance.
**What:** Pattern analysis, candidate management, promotion decisions, drift monitoring.
**Input mode:** Query and review.
**Structure visibility:** Cross-box structural patterns, recurrence counts, stability scores, promotion history.
**Rule:** Operator surface reads Shape Library governance outputs derived from Assembly Artifacts and Runtime Records. It may trigger classification or promotion workflows. It may not alter individual box artifacts or runtime history.

---

## 6. Seven

Seven is not an engine. Seven is an agent operating on top of Compiler + Runtime + Witness truth, primarily through Mirror.

**What Seven does:**

- Listens to natural language input
- Proposes structural updates (aim, witnesses, stories, moves, tests)
- Surfaces shape observations in plain language
- Suggests closure type based on return analysis

**What Seven does not do:**

- Does not author truth. Seven proposes; the compiler validates; the box updates from the validated artifact.
- Does not override the shape checker. If the shape pass fails, Seven cannot force closure.
- Does not have its own memory or state. Seven's context comes from the Assembly Artifact and conversation history.
- Does not speak in Lœgos jargon. Seven speaks like a sharp friend.

**Flow:**

```
User speaks → Seven proposes segments → Compiler validates → Assembly Artifact updates → Mirror renders
```

Seven may also operate in Editor mode (suggesting completions, explaining diagnostics), but its primary surface is Mirror.

---

## 7. Contracts Between Layers

### Witness Ingestion → Compiler

- **In:** Witness objects with source, identity, content
- **Out:** Nothing. Ingestion feeds source files that contain `GND witness ... from ... with ...` lines.
- **Forbidden:** Ingestion may not emit compiled structure or diagnostics.

### Compiler → All Surfaces

- **In:** `.loe` source text
- **Out:** Assembly Artifact (JSON)
- **Forbidden:** Surfaces may not supplement, override, or simulate the artifact.

### Compiler → Runtime

- **In:** Assembly Artifact (structure to execute against)
- **Out:** Nothing directly. Runtime references the artifact to validate state transitions.
- **Forbidden:** Runtime may not recompile. If source changes, a new compile must occur first.

### Runtime → Ledger

- **In:** Events (move issued, return received, closure decided)
- **Out:** Append-only event log, receipt records
- **Forbidden:** Ledger records are never modified. Append-only is constitutional.

### Runtime → Shape Library

- **In:** Closed-box traces (artifact at closure + runtime events + receipts)
- **Out:** Nothing directly. Shape Library consumes completed traces.
- **Forbidden:** Shape Library may not write back into runtime or modify closure records.

### Shape Library → Surfaces

- **In:** Structural classifications, candidate shapes, drift alerts
- **Out:** Advisory guidance (not commands)
- **Forbidden:** Shape Library output may not mutate any artifact, runtime record, or box state.

---

## 8. Hard Laws

1. **The compiler is the truth.** If the compiler doesn't say it, no surface may show it.
2. **No surface authors truth directly.** All changes flow through source → compiler → artifact.
3. **Runtime records are append-only.** A sealed receipt is never modified.
4. **Shape Library is downstream.** It classifies and promotes. It does not override, author, or mutate.
5. **Seven proposes; the compiler validates.** Seven may not bypass the shape checker.
6. **Witness identity is immutable.** A versioned witness creates a new snapshot, not an overwrite.
7. **Closure is earned, not checked off.** The seal button does not appear unless the shape pass clears.
8. **One compiler artifact, many renderers.** Mirror and Editor read the same compiled object. Divergence between these two surfaces is a system bug.
9. **Runtime is separate but linked.** Runtime records reference artifacts by `compilationId`; they do not redefine compiler truth.
10. **Shape governance is read-only downstream.** Shape outputs may annotate and advise; they may never mutate source, artifacts, or runtime logs.

---

## 9. Phased Build Roadmap

### Phase 1: Compiler + Mirror

Build the compiler library. Build the mirror surface consuming its output. Seven proposes, compiler validates, box renders from artifact. This is the minimum viable product.

**Deliverables:**

- Compiler library (WASM + CLI)
- Mirror surface (box + chat)
- 20-program test corpus passing
- Shape checker catching all known fake-convergence patterns

### Phase 2: Editor + Runtime

Build the editor surface consuming the same artifact. Build the runtime engine for move/test/return execution with manual adapter. Window state transitions become real.

**Deliverables:**

- Editor surface (file tree, syntax highlighting, domain rails, diagnostics)
- Runtime engine (manual adapter, window state machine, append-only event log)
- Mirror and Editor sharing one artifact source

### Phase 3: Ledger + Integrations

Build the receipt ledger. Add move adapters beyond manual (HTTP, shell, queue). Add return channels (Stripe, email, API). Add voice input.

**Deliverables:**

- Append-only ledger with search and export
- Automated return sources
- Multi-box overview with state scanning

### Phase 4: Shape Library Integration

Integrate the existing Shape Library as structural governance downstream of compiler/runtime truth. Expand pattern detection, candidate promotion workflows, and drift monitoring against LoegosCLI artifacts.

**Deliverables:**

- Shape Library integration adapter (artifact/runtime -> shape inputs)
- Operator surface
- Promotion workflow (detect → candidate → compare → test → promote/reject → monitor)
- Advisory feedback to Mirror and Editor

---

## 10. Closing

The product is not the mirror. The product is not the editor. The product is not the shape library.

The product is the interplay between local truth, world return, and reusable structure — with clear boundaries, one canonical artifact, and the hard rule that no surface authors truth without passing through the engines.

Build the compiler. If the shape checker works, everything else follows.