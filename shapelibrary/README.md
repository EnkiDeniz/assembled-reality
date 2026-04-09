# Shape Library

This folder is a working place for the shape language behind Loegos.

It starts with a summary of the understanding reached through product, language, and workbench discussions during the v1 planning and Founder workbench build.

## What We Understood

Loegos is not just a document product and not just an AI assistant.
It is a language-based box system for moving from witness material into active structure, then into constrained read, proof, and next move.

The core lifecycle remains:

`source -> seed -> operate -> evidence -> receipt`

But the important shift in our discussions was this:

Loegos should increasingly be experienced as a language workbench, not as a dashboard that explains a language from the outside.

## Main Product Understanding

- A box is the top-level container for one piece of work.
- Sources are witness material with provenance. They are input, not proof.
- The seed or assembly is the current active shaped artifact in the box.
- Operate is the box-read engine. It is not the same thing as Seven.
- Receipts are proof artifacts that preserve lineage and should draft locally before any remote sync.

## Main UI and Language Understanding

- The first proof should not feel like a visualization demo or colorized prose converter.
- The first proof should feel like a witness document became more operable when expressed in Loegos.
- The first sacred commitment boundary is:

  `witness prose -> active Loegos structure`

- The witness should remain readable and immutable.
- The compiled Loegos form should become the editable, inspectable, stageable, overridable working object.

## Reading Surface Principles

- The main pane should carry the truth.
- Side panels should support interpretation, not become the only place meaning lives.
- The default surface should be designed for fluent reading of Loegos, not constant beginner explanation.
- Explanations belong in learner mode, hover, inspect, and secondary surfaces.
- The interface should trust the language more and translate it less.

## Shape and Grammar Principles

The language should be learnable the way people learn to read code:

- through stable symbols
- through positional grammar
- through repeated visual rules
- through compact, high-signal surfaces

The current and intended grammar channels are:

- type = shape symbol plus gutter position
- stage = compact lifecycle marker
- support or trust = inline text treatment
- exception state = distinct gutter and inline exception styling

Color should not carry every meaning alone.
Shape, position, state, and exception need their own channels.

## Pro User Bias

One of the strongest conclusions from discussion was that Loegos should be designed for the serious, returning user more than the endlessly guided beginner.

That does not mean cryptic.
It means:

- dense but consistent
- calm enough to learn
- stable enough to internalize
- not over-explained on every line

## Compare and Commitment Boundary

Compare is not optional polish.
It is part of the proof.

The first convincing compare flow is:

`human document -> Loegos form -> compare -> manipulate`

The user should be able to see:

- what the witness said
- what the compiled line now says
- why the change happened
- what operations are now possible on the compiled structure

## Human Sovereignty

Another key understanding:

The compiler read is not the final sovereign.

Human override must remain explicit from the beginning.
Attested override is not a side feature.
It is one of the safeguards that prevents the product from collapsing into machine authority.

## Current Workbench Direction

The current Founder workbench direction reflects these conclusions:

- witness fixed on one side
- active structure on the other
- line-first reading
- compiler truth rendered inline and in inspect
- compact line operations
- attested override visible
- Seven secondary to the main language surface

This is still in progress, but the direction is clear:

Loegos should feel more like a real language environment and less like an annotated content management UI.

## What This Folder Is For

This folder should hold future artifacts related to:

- shape grammar
- shape semantics
- glyph usage
- positional meaning
- state rendering
- examples of good and bad shape communication

In other words:

the shape library is for preserving and refining the readable visual grammar of Loegos as a language.

---

## Standalone implementation (v0.2)

The runnable subsystem lives in this folder:

- **Spec:** [ShapeLibrary_Standalone_System_Spec_v0.1.md](./ShapeLibrary_Standalone_System_Spec_v0.1.md)
- **Upgrade map:** [ShapeLibrary_v0.2_Upgrade_Map.md](./ShapeLibrary_v0.2_Upgrade_Map.md)
- **Assembly classes:** [docs/Assembly_Classes.md](./docs/Assembly_Classes.md)
- **Code:** `shape-core/`, `shape-store/`, `shape-eval/`, `shape-api/`, `schema/`, `fixtures/episodes/`, `tests/`, `docs/`

From `shapelibrary/`:

```bash
npm install
npm run test
npm run dev
```

API default: `http://localhost:4310` (see [docs/api-contract.md](./docs/api-contract.md)).

**Results on disk:** analyze/evaluate/promote responses are also written under `results/` (`analyze/`, `evaluate/`, `promote/`) as JSON unless you set `SHAPELIBRARY_EXPORT_RESULTS=0`. Override folder with `SHAPELIBRARY_RESULTS_DIR`. Responses include `exportedTo` when a file was written.

**v0.2 feature flags:** `SHAPELIBRARY_ENABLE_V01_FIDELITY` (default on), `SHAPELIBRARY_ENABLE_MYTH`, `SHAPELIBRARY_ENABLE_KERNEL`, `SHAPELIBRARY_ENABLE_CROSS_DOMAIN` (defaults off). See the API contract doc.

**Smoke fixtures:** `fixtures/episodes/myth.smoke.episodes.json`, `fixtures/episodes/crossdomain.smoke.episodes.json` (pass as `episodes` in `POST /v1/evaluate` or enable flags and integrate into your corpus).

## Why this system exists

Shape Library is the truth-discipline layer for structural claims in Loegos.

- It turns witness material into operable structure, not polished prose.
- It keeps a shared vocabulary of recurring shapes (bottleneck, feedback loop, gate dependency, etc.).
- It requires explicit IR fields (`invariant`, `falsifier`, `operationalFailure`, `granularity`) before analysis can pass.
- It uses reads/gates to reject weak claims instead of laundering them into named matches.
- It uses evaluation episodes to measure pipeline stability and optional expected alignment.
- It classifies assembly path (`combinable`, `path_dependent`, `developmental_embodied`) so maturation demands are explicit.
- It uses receipt-backed promotion plus library closure (`link` | `mint` | `pending`) so promotion is evidence-traceable.

## What errors it is designed to prevent

- Narrative laundering (vague stories turned into authoritative labels).
- Category inflation (every intuition becoming a new primitive).
- Metric confusion (stable output mistaken for correctness).
- Evidence bypass (promotion without runtime receipts).
- Corpus drift (engine behavior changes without benchmark visibility).

## Concrete examples

**Should be rejected by gates**

- `invariant`: "our team lacks alignment"
- no `falsifier`
- no `transferPrediction`
- generic/empty observables

Expected outcome: gate failures (`missing_falsifier`, `missing_transfer_prediction`, weak structure).

**Should advance**

- `invariant`: "one approval lane caps throughput"
- observables include queue depth and cycle time
- falsifier runs parallel low-risk approvals for one sprint
- transfer prediction expects queue depth/cycle time improvement
- receipts include runtime observation + falsifier outcome

Expected outcome: candidate or match from analyze, then evidence-backed promotion and explicit library closure.

---

## Roadmap

Further additive work is tracked in [ShapeLibrary_v0.2_Upgrade_Map.md](./ShapeLibrary_v0.2_Upgrade_Map.md) (e.g. embeddings / `ShapeAlias`, richer kernel semantics). The current codebase implements the phased plan through library closure, myth path, kernel/cross-domain stubs, and eval alignment metrics unless noted as deferred in that file.
