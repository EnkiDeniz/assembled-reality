# Loegos Source Model Spec

**Status:** Canonical source model spec  
**Scope:** Source classes, interfaces, normalization model, and Box ingestion rules

---

## Summary

The Loegos source model is built on one rule:

**Any meaningful human signal can become a source.**

That does not mean every source is equal.

A source is:

- normalized enough to be usable
- still tied to its modality
- still tied to provenance
- still assigned trust according to verification depth

The source model exists so the Box can accept reality without flattening it.

## Live Beta Scope

The full source model is broader than the current public `1.0` promise.

Shipped and publicly supported now:

- `text`
- `voice`
- `link`
- `assembly`
- `receipt`

Present in substrate or beta-quality paths, but not yet part of the core public promise:

- `image`
- `derived`
- `human-state`

## Canonical Source Classes

Every source belongs to one primary source class:

- `text`
- `voice`
- `image`
- `link`
- `human-state`
- `derived`
- `assembly`
- `receipt`

### Text

Examples:

- markdown
- pasted text
- PDFs after text extraction
- DOCX after structure extraction
- notes
- copied excerpts

### Voice

Examples:

- voice memo
- dictated note
- spoken reflection
- narrated observation
- interview excerpt

### Image

Examples:

- photograph
- screenshot
- diagram
- sketch
- map
- mood reference
- scanned page

### Link

Examples:

- article
- listing
- web page
- external reference
- social post

### Human-state

Examples:

- explicit feeling statement
- hesitation report
- confidence statement
- concern statement
- observed reaction attributed to a person

### Derived

Examples:

- image-derived source notes
- compressed transcript
- extracted highlights
- structured summary created from another source

### Assembly

The active built artifact inside the Box.

### Receipt

A proof artifact drafted from a document, Assembly, or Operate result.

## Core Interfaces

These are planning-level interfaces. They do not require immediate schema migration, but they should guide all future implementation.

```ts
type SourceModality =
  | "text"
  | "voice"
  | "image"
  | "link"
  | "human-state"
  | "derived"
  | "assembly"
  | "receipt";

type SourceOrigin =
  | "upload"
  | "paste"
  | "link-import"
  | "voice-capture"
  | "image-derivation"
  | "ai-derivation"
  | "human-entry"
  | "receipt-draft"
  | "system";

interface SourceProvenance {
  origin: SourceOrigin;
  authorId?: string | null;
  authorLabel?: string | null;
  capturedAt?: string | null;
  importedByUserId?: string | null;
  sourceUrl?: string | null;
  sourceFilename?: string | null;
  sourceMimeType?: string | null;
  metadataAvailable: boolean;
}

interface SourceTrustProfile {
  floor: "L1" | "L2" | "L3";
  reasons: string[];
  auditable: boolean;
}

interface NormalizedSource {
  title: string;
  summary?: string | null;
  blocks?: unknown[];
  rawMarkdown?: string | null;
  mediaSummary?: string | null;
}

interface BoxSource {
  sourceKey: string;
  boxKey: string;
  modality: SourceModality;
  provenance: SourceProvenance;
  trust: SourceTrustProfile;
  normalized: NormalizedSource;
  hiddenFromBoxHome?: boolean;
  parentSourceKey?: string | null;
}
```

## Source Rules

### 1. Sources are not truth

A source is structured input with provenance.

The product must never imply:

- that ingestion equals proof
- that normalization equals verification
- that richer modality equals higher trust

### 2. Every source keeps modality

Even after normalization, the source still knows what it was:

- text
- voice
- image
- link
- human-state

This matters for:

- Box summaries
- Operate inclusion
- trust behavior
- future diagnostics

### 3. Derived sources are not originals

If a source comes from another source, the link must remain explicit.

Examples:

- image -> derived source notes
- voice memo -> transcript source
- document -> extracted highlights

Derived material does not erase lineage.

### 4. Assembly and receipts are source-shaped but not ordinary sources

They should use the same provenance and trust thinking, but their product role is different:

- `Assembly` is the active construction artifact
- `Receipt` is the proof artifact

## Inclusion Rules For Operate

Default Operate inclusion should be:

- include: non-built-in sources
- include: current Assembly
- exclude: built-in guide
- exclude: receipt history
- exclude: Seven thread history
- exclude: staging

Future modality support should not change that rule. It should only expand what counts as a valid source inside the included set.

## Human-State Source Policy

Human-state sources are allowed, but bounded.

Valid human-state sources are:

- attributed
- explicit
- time-bound when possible
- low-trust unless grounded

Examples:

- `I feel uneasy about this deal.`
- `Speaker hesitated when pricing came up.`
- `Team member reported uncertainty about the timeline.`

Invalid human-state sources include:

- invented motive
- unattributed psychological inference
- certainty claims based on tone alone

Human-state belongs in the box as signal, not as fabricated certainty.

## Multi-Human Requirement

The source model must preserve authorship even before collaboration becomes a full product surface.

That means:

- every source can carry author identity
- every source can carry importer identity
- every source can carry capture context
- future shared Boxes can reuse the same source model without rewriting provenance later

## Acceptance Criteria

The source model is correct when:

1. The team can say what counts as a source without drifting back to “just documents.”
2. The team can explain the difference between normalization and verification.
3. Text, voice, image, link, and human-state sources fit in the same Box model without pretending they are identical.
4. Derived sources preserve lineage to originals.
5. Operate can read across source types without losing provenance.
