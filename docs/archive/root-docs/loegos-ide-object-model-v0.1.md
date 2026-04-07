# Lœgos IDE Object Model v0.1

**Date:** April 6, 2026
**Status:** Canonical mapping. Settles the structural correspondence
between a software IDE and the Box workspace before UI decisions.

---

## Why This Exists

"IDE for reality" is the product category. But an IDE is organized
around code objects — repo, file, function, module, branch, compile,
commit, publish. If those objects don't have native coordination
equivalents, the IDE metaphor stays inspiring but unbuildable.

This document defines the native object hierarchy so that every UI
decision downstream has a structural answer, not a philosophical one.

---

## The Correspondence Map

| Software IDE | Lœgos Box IDE | What it is | Where it lives |
|---|---|---|---|
| **Repository** | **Box** | The bounded runtime for one coordination object. Contains all sources, assemblies, receipts, and history for one piece of real work. | `ReaderProject` |
| **File** | **Artifact** | The main authored working object. A persistent document composed of typed blocks. The thing the user is always editing toward. | Assembly document (`isAssembly: true`) |
| **Reference file** | **Source** | Imported evidence. Read-only input to the assembly. Each source carries provenance, trust, and block structure. | `ReaderDocument` (non-assembly) |
| **Line of code** | **Block** | The smallest meaningful authored unit. Typed by shape (△ aim, □ reality, œ weld, 𒐛 seal). Carries confirmation status, tag, domain, provenance. | Block array inside document `contentMarkdown` |
| **Function / method** | **Card** | A grouped sequence of blocks that performs one coordination job: declare an aim, compare evidence, weld a relation, review for seal. | Not yet a first-class persisted object. Emerges from block grouping. |
| **Class / module** | **Shape room** | AIM, REALITY, WELD, SEAL. Each is a namespace that scopes what blocks can do and what verbs are available. Not a file — a type system. | `shapeSpec` in formal core |
| **Import / dependency** | **Source-to-seed link** | A block in the seed that references a source document. The lineage of where this block came from. | `sourceDocumentKey` on each block |
| **Type annotation** | **Shape tag** | The shape (△ □ œ 𒐛) assigned to a block. Determines what the block is doing in the assembly. | `primaryTag` on each block |
| **Branch** | **Weld in progress** | An unfinished assembly path. A not-yet-sealed convergence of aim and reality. The box can have multiple open threads. | Unresolved welds in the block stream |
| **Compiler** | **Operate + preflight + convergence checker** | Reads the box structurally. Catches invalid seals, missing evidence, shadow types, unsupported welds, low convergence, insufficient trust. | `/api/workspace/operate`, `buildFormalBoxState()`, `buildFormalSealCheck()` |
| **Type checker** | **Shape parser + signal system** | Checks whether blocks read as their declared shape. Catches misclassified blocks, ungrounded sentences, missing shape coverage. | `BlockFormalAnnotations`, signal state machine |
| **Runtime** | **Box state** | The live current state: blocks, trust levels, depth distribution, convergence, contradictions, open threads, sealed receipts. | `assemblyIndexMeta`, `metadataJson` on project |
| **Debugger** | **Seven diagnostics** | Inspects state, traces contradictions, explains failures, suggests next change. Does not mutate. Infers, does not interpret. | `WorkspaceDiagnosticsRail`, Seven API |
| **Commit** | **Seal** | An irreversible, human-consented state transition. The user declares the assembly strong enough to close. Cannot be undone. The receipt records what was sealed and when. | Receipt draft → SEALED status |
| **Build artifact** | **Receipt** | Portable proof that a specific assembly compiled against reality. Contains aim, outcome, evidence, operator sentence, timestamp, seal hash. Travels outside the box. | `ReadingReceiptDraft` with status SEALED |
| **Git history** | **Assembly lane / append-only history** | Not just text versions but structured coordination state over time: events, checkpoints, state transitions, sealed receipts. | `assemblyIndexMeta.events`, lane view model |
| **Publish / push** | **Share receipt / issue to GetReceipts** | The portable output leaving the box. A sealed receipt shared with external witnesses or the GetReceipts ledger. | GetReceipts integration, receipt export |
| **CI / build status** | **Settlement hex** | Six-edge computed inspection surface. Each edge carries an aspect (aim completeness, evidence quality, convergence, weld validity, depth, seal integrity). Stage 7 = fully settled. | `buildFormalBoxState()` → hex edges |
| **Test suite** | **Seal preflight** | A set of precondition checks that must pass before a seal can be applied. Convergence ≥ 70%, trust floor L2, at least one weld, evidence chain complete. | `buildFormalSealCheck()` |
| **Lint / style check** | **Shape parse + formal annotations** | Checks whether blocks are well-formed: correct shape, appropriate length, grounded in evidence, not semantically ungrounded. | Block formal annotations, shape parser |

---

## The Native Object Hierarchy

```
Lane
└── Box (= repo)
    ├── Source (= reference file)
    │   └── Block (= line of imported code)
    ├── Artifact / Seed (= main editable file)
    │   └── Block (= line of authored code)
    │       ├── Shape tag (= type annotation)
    │       ├── Signal state (= test status)
    │       ├── Trust level (= code coverage)
    │       └── Depth level (= edit history depth)
    ├── Weld (= branch / open merge)
    │   └── Linked aim + reality blocks
    ├── Receipt (= build artifact / commit)
    │   └── Sealed state + evidence + operator sentence
    └── History (= git log)
        └── Events, checkpoints, state transitions
```

---

## The Critical Answer: What Is the File?

The file-equivalent is the **Artifact** — the current working assembly
document (the seed).

This is the object that:
- the user is always authoring toward
- is composed of typed blocks (like a file is composed of lines)
- has sections (Aim / What's here / The gap / Sealed — like a file has functions)
- changes as the box assembles (like a file changes as you code)
- is the primary input to Operate (like a file is the primary input to the compiler)
- is what gets sealed into a receipt (like a file is what gets committed)

Sources are reference files — you read them, you pull blocks from them
into the seed, but you don't edit them directly in the main workflow.

The center pane of the IDE shows the **artifact/seed** as a continuous
block stream. Sources appear in the project tree (left rail). Receipts
appear as build output (diagnostics rail or dedicated output section).

---

## The Two Layers

| Layer | Software equivalent | Lœgos equivalent |
|---|---|---|
| **Surface layer** | Frontend | What the user authors and inspects: editor, rails, diagnostics, receipts, provenance views, compact grammar UI |
| **Runtime layer** | Backend | What computes and preserves coordination truth: parsing, shape inference, convergence computation, trust/depth state, append-only history, preflight engine, seal logic, provenance model |

The surface layer renders. The runtime layer computes. The surface
layer never silently changes runtime state. The runtime layer never
makes interpretation decisions for the user.

This is the same boundary as: **Seven infers. Humans interpret. Seal commits.**

---

## What This Settles for the UI

### The center pane shows the artifact

The center pane is the seed/assembly document rendered as a continuous
block stream. Like a file in Cursor. Blocks are lines. The gutter
shows block number + shape + status. The content fills the width.

### The left rail shows the project tree

Sources are files in the tree. The seed is the main file (highlighted
or pinned at top). Receipts are in a "build output" section. Runtime
metrics are compressed at the bottom.

### The right rail shows the compiler/debugger

Diagnostics rail = compiler output + debugger. Seal preflight = test
suite. Shape parse = linter. Convergence = build health. Seven =
debugger assistant.

### Shapes are types, not folders

AIM / REALITY / WELD / SEAL are type annotations on blocks, not
navigation categories. They appear in the gutter (like type annotations
in code), in diagnostics (like type errors), and in the status bar
(like which types are present). They are not folders in the project tree.

### Seal is commit, not save

Save is automatic (blur or Cmd+Enter). Seal is the deliberate,
irreversible, human-consented commit. The product must make this
distinction feel as clear as the difference between saving a file and
pushing to production.

---

## Open Questions

### Is the Artifact always the seed?

Currently yes. But in the future, a box might have multiple assembly
documents (like a project has multiple source files that all get
compiled). For v1, the seed is the only artifact and the center pane
shows it.

### Where do Cards live?

Cards (grouped block sequences that do one coordination job) are not
yet first-class objects. They emerge from block grouping. In the future,
they might become explicit — like functions that you can name, reuse,
and test independently. For now, they're implicit in the block stream.

### Is a Weld a branch or a merge?

Both. A weld is an open convergence between aim and reality. It's like
a branch that's being actively merged — not yet sealed, not yet
resolved, but actively being compared. When the weld is sealed, it's
like the merge being committed.

### Does the Lane contain multiple Boxes?

Conceptually yes — a lane is a sequence of related boxes. But for v1,
the lane is the assembly history within a single box. Multi-box lanes
are a future feature.
