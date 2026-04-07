# Loegos Provenance And Trust Policy

**Status:** Canonical provenance and trust policy

---

## Summary

Loegos accepts many kinds of source material, but it does not treat them as equally trustworthy.

The governing rule is:

**Everything can enter the box. Not everything carries the same weight.**

This policy defines how provenance and trust work across source types.

## Provenance

Provenance answers:

- where did this come from?
- who brought it in?
- when was it captured?
- how was it transformed?

Every source should preserve, when available:

- origin method
- author or speaker
- importer
- capture time
- source URL
- filename
- mime type
- whether metadata exists
- parent source if derived

If provenance is weak or absent, the source can still exist. Its trust should stay modest.

## Trust

Trust answers:

- how verified is this source?
- how much of its meaning is asserted vs grounded?
- what would it take to upgrade confidence?

The live product exposes only:

- `L1`
- `L2`
- `L3`

### L1

Use `L1` when the source is mostly self-reported, weakly attributed, or minimally grounded.

Examples:

- typed note
- aspirational image
- feeling statement
- unverified transcript

### L2

Use `L2` when the source contains supporting exhibit-level evidence.

Examples:

- geotagged photo
- link with stable source URL
- screenshot with timestamped origin
- file with meaningful metadata

### L3

Use `L3` only when the source or claim has been audited in a meaningful way.

Examples:

- Seven checked metadata and coherence
- timestamp and location plausibility were reviewed
- evidence across the source is consistent enough for cautious audited use

## Normalization Is Not Verification

This is a hard rule.

The system may:

- transcribe voice
- describe an image
- extract a link
- structure a document

None of that alone upgrades trust.

Normalization makes a source readable.

Verification changes how much weight the source carries.

## Emotion And Human-State

Human-state sources are allowed, but they are inherently low-trust unless grounded by surrounding evidence.

Allowed:

- explicit emotional statements
- attributed hesitation
- observed reaction
- speaker uncertainty markers

Not allowed:

- invented interior certainty
- mind-reading dressed as evidence
- unattributed psychological claims

Human-state can guide interpretation. It cannot silently impersonate external fact.

## Derived Material

Derived material must preserve lineage to the source that produced it.

This applies to:

- transcript summaries
- image descriptions
- extracted notes
- Operate-derived receipt metadata

Derived material may compress or interpret, but it must not erase:

- parent source
- derivation path
- model/process identity when relevant

## Multi-Human Attribution

When more than one human contributes to a Box, attribution must remain explicit.

Minimum rule:

- the system must be able to say who provided or authored a source

Even before full collaboration ships, the source model should preserve:

- author identity
- observer identity where relevant
- importer identity

This keeps future multi-human Boxes honest.

## Product Consequences

This policy should directly shape:

- source cards
- Operate inclusion rules
- trust display
- receipt metadata
- audit flows
- Box diagnostics

The product should never reward ambiguity with fake confidence.

## Acceptance Criteria

This policy is working when:

1. The team can explain trust across modalities without contradiction.
2. No one confuses normalization with verification.
3. Human-state sources stay allowed without becoming fake external proof.
4. Multi-human attribution remains compatible with the model from day one.
5. Operate outputs can point back to source provenance instead of flattening it away.
