# Loegos Product Spec

**Status:** Canonical product spec  
**Scope:** End-to-end product model for Loegos  
**Date:** April 2026  
**Companion docs:**
- `README.md`
- `language/README.md`
- `docs/README.md`
- `docs/current-state-audit.md`
- `docs/think-create-operate-spec.md`
- `docs/operate-spec-v2.md`
- `docs/source-model-spec.md`
- `docs/source-normalization-table.md`
- `docs/provenance-trust-policy.md`
- `docs/user-flows.md`
- `docs/seven-operate-receipt-contract.md`
- `docs/phase-1-proof-runbook.md`

---

## 1. Product Definition

Loegos is a Box-based workbench built around a single object:

**the Box**

A Box is where meaningful human signal enters, becomes sources, gets shaped into an assembly, gets read by the system, and can be preserved as proof.

The long-term product is multimodal and attribution-ready.

The live `1.0` beta is narrower:

- single-user in practice
- desktop-first
- publicly promised around document, link, paste, and voice-memo flows
- ready for richer provenance, image, and multi-human work later

The product is not just a document editor, not just an AI assistant, and not just a receipt system.

It is a system for:

- taking in source material from many modalities
- preserving provenance
- externalizing a visible working echo while thinking
- shaping working artifacts
- reading the current position honestly
- drafting proof that can travel beyond the tool

The shortest correct description is:

**Loegos is a box where meaningful human signal becomes sources, a visible working echo, lawful structure, and receipts.**

## 2. Core Product Bet

Humans do not work only in text.

They think and decide through:

- words
- voice
- images
- links
- documents
- gestures of intention
- emotional signals
- memories
- evidence
- multiple people seeing the same thing differently

Loegos exists to let those signals enter one container, become structured enough to work with, and then be read together without flattening them into fake certainty.

The product is not only the answer Seven gives.
It is also the visible, provisional read that helps the user answer back better.

This means:

- everything meaningful can enter the box
- not everything carries the same weight
- provenance matters
- verification matters
- trust is not equal across modalities or sources

## 3. The Top-Level Object: The Box

A Box is the native top-level object in the product.

A Box holds:

- Sources
- one active Assembly
- Receipts
- Seven conversation context
- Operate results

A Box is not just a folder. It is a live container for one piece of real work.

Examples:

- a fundraising process
- a trip
- a product strategy
- a farm vision
- a negotiation
- an investigation

The Box is the place where the work becomes legible.

## 4. The Canonical User Loop

The top-level user loop is:

`Think → Create → Operate`

This is the live product loop inside an opened Box.

Inside the Room, the critical micro-loop is:

`Talk → Echo → Move → Return`

That micro-loop is where the product either becomes distinct or collapses back into chat.

### Think

The user understands what is in the box.

This includes:

- opening sources
- listening
- asking Seven questions
- reading block by block
- selecting what matters
- orienting to the material

### Create

The user shapes what should exist from what is in the box.

This includes:

- staging
- moving selected material into working memory
- assembling a document
- editing
- refining the Assembly

### Operate

The system reads the box and projects its current position.

This includes:

- running Operate
- producing `Aim`, `Ground`, `Bridge`
- naming `Gradient`
- naming trust floor and ceiling
- naming convergence state
- drafting a receipt
- letting Seven audit the result

This loop is the product framing.

It does not replace the Box structure underneath it.

## 5. Structural Product Model

The stable nouns in the product are:

- `Box`
- `Sources`
- `Working Echo`
- `Assembly`
- `Receipts`
- `Seven`
- `Operate`

### Sources

Sources are normalized units of incoming signal.

They are not automatically truth. They are structured inputs with provenance.

### Working Echo

Working Echo is the visible, non-canonical, revisable read of what the box conversation currently seems to be assembling.

It should help the user see:

- what seems real
- what conflicts
- what would decide it
- possible next move
- current uncertainty

It is not identical to canon and it should not be hidden inside the transcript.

It should stay grounded with visible provenance on the claims it makes, including:

- aim
- evidence carried
- open tension
- deciding split
- candidate move

### Assembly

Assembly is the active built artifact inside the Box.

It is the thing being shaped from sources and staged material.

### Receipts

Receipts are proof artifacts.

In `1.0`, they are local-first drafts that may optionally sync to GetReceipts. Over time they become more than logs: they become convergence objects.

### Seven

Seven is the contextual conversation and audit layer.

Seven helps the user think and helps audit Operate. It does not replace Operate.

### Operate

Operate is the box-read engine.

It is not chat, not summary, and not rewrite. It is the system reading the box as it stands.

## 6. Source Model

The core rule is:

**Any meaningful human signal can become a source.**

That does not mean every source is equal. It means every source can enter the box and be read with explicit provenance and trust.

### Live beta source promise

The current live `1.0` promise is still narrower than the full source model:

- PDF
- DOCX
- Markdown / TXT
- paste
- link import
- voice memo capture

Image, arbitrary audio-file, and broader human-state stories remain future-scoped or beta-quality even though the source model already anticipates them.

### Supported source classes

#### Text sources

- notes
- pasted text
- markdown
- docx
- pdf text extraction
- copied excerpts
- messages

#### Voice sources

- voice memos
- dictated notes
- spoken reflections
- interviews
- narrated observations

Voice becomes a normalized source through transcription plus preserved metadata about speaker, capture time, and modality.

#### Visual sources

- photos
- screenshots
- diagrams
- sketches
- mood references
- maps
- dashboard captures
- scanned pages

Visual sources are not just OCR targets. If they are visual-primary, they should be described and classified as signal-bearing sources.

#### Link-derived sources

- web pages
- listings
- articles
- references
- social posts

#### Human-state sources

This is where the product gets more powerful and also more delicate.

Human-state sources can include:

- explicitly stated feelings
- concern statements
- priorities
- hesitations
- confidence declarations
- emotional reactions captured in voice
- observations made by another participant

These are valid sources when they are captured honestly and attributed clearly.

They are not evidence of external reality by default. They are evidence of human state.

### The rule for emotion

Emotion belongs in the box, but only in the correct form.

Allowed examples:

- `I feel uneasy about this deal.`
- `Speaker sounds uncertain in this section.`
- `Two team members hesitated when cost came up.`
- `The image was added as aspiration, not evidence.`

Not allowed:

- fabricated psychological certainty
- invented motive
- false confidence claims
- model-inferred interior states presented as fact

Emotion is a source class, not a shortcut to truth.

## 7. Multi-Human Model

Loegos must support the idea that more than one human can contribute to the same Box, even before full collaboration ships.

The product model should already assume:

- multiple people may provide source material
- different humans may contribute different modalities
- attribution must be preserved per source
- trust depends partly on who provided what and how

### Source attribution fields

Every source should be able to carry:

- source modality
- author / origin
- capture method
- captured at
- imported by
- linked URL or file origin when available
- metadata availability

This is true for:

- user-uploaded files
- imported links
- spoken notes
- images
- future shared contributions

Multi-human does not require open collaboration on day one. It requires the data model and product philosophy to preserve authorship from the start.

## 8. Source Normalization

Loegos works because raw signals become usable sources.

### The normalization rule

Every source enters the box in its native modality, then gets normalized into a source record the system can read.

That normalized record should preserve:

- original modality
- original provenance
- original raw asset or reference when possible
- a readable structured representation

### Modality-specific normalization

#### Text

- clean structure
- preserve headings, lists, and source metadata

#### Voice

- transcript
- optional compression
- speaker metadata
- timing information

#### Image

- OCR if text-primary
- visual description if visual-primary
- inferred signal
- provisional shape
- metadata when available

#### Emotion / human-state

- keep it explicit
- keep it attributable
- keep it low-trust unless grounded

Normalization is not the same thing as verification.

Normalization makes the source readable. Verification determines how much weight it carries.

## 9. Provenance And Trust

The entire multimodal vision only works if the product stays strict about provenance.

### Core rule

**Everything can enter the box. Not everything should be treated equally.**

So every source must carry two different kinds of information:

#### Provenance

Where did it come from?

- user-entered
- imported from file
- imported from web
- derived from image
- transcribed from voice
- inferred from context

#### Trust level

How much verification depth does it have?

For the current live product, Operate only exposes:

- `L1`
- `L2`
- `L3`

This applies across modalities:

- a self-typed note can be `L1`
- a geotagged image can be `L2`
- a Seven-audited timestamped voice memo can be `L3`

Trust is not modality-specific. It is provenance-and-verification-specific.

## 10. Seven

Seven is the document-scoped and context-scoped conversation layer.

Seven’s jobs:

- help the user think
- answer questions about the active document
- help interpret sources
- generate useful material that can be staged
- audit Operate output

Seven is not:

- the box-read engine
- the receipt engine
- a hidden block generator pretending to be chat

Seven helps the user work with the box. It does not define the box’s state.

## 11. Operate

Operate is the box-read engine.

Operate reads the active box across:

- non-built-in sources
- the current Assembly

It excludes by default:

- the built-in guide
- staging
- receipt history
- Seven thread history

Operate returns:

- `Aim`
- `Ground`
- `Bridge`
- `Gradient`
- trust floor and ceiling
- convergence state
- next move

Operate should be understood as:

- the projection layer
- the diagnosis layer
- the pressure that turns construction into proof

## 12. Receipts And GetReceipts

Receipts are the proof layer for the box.

In the current product:

- receipt drafts are local-first
- GetReceipts sync is optional
- remote failure must never block local draft creation

In the broader architecture:

- Loegos builds and reads the box
- Operate projects the box
- Seven audits and helps
- GetReceipts stores portable proof

That relationship should stay stable even as the receipt model deepens.

## 13. The Deep Analysis Layer

The Box v3 model introduces the deeper coordinate system:

`△ □ œ × 1–7`

This is valid and important, but it is not the first-run navigation model.

It should be treated as:

- the diagnostic engine
- the shape-read model
- the long-term Lakin intelligence layer

It is appropriate in:

- Operate
- box diagnostics
- advanced audits
- deeper copy and doctrine

It is not appropriate as the primary user-facing shell structure for `1.0`.

## 14. Current Product Boundaries

The live product today should stay disciplined.

### Desktop-first

Desktop is the quality bar for:

- source reading
- listening
- Seven usage
- staging
- assembly
- Operate

### Mobile-secondary

Mobile should remain usable for:

- reading
- listening
- basic Seven interaction
- basic staging follow-up

### Invite-only beta

The product is still:

- invite-only
- noindex
- direct-support oriented
- warm-audience oriented

This matters because the product can still be deep without having to over-explain itself for broad public traffic.

## 15. Product Sentence

The current best plain-language definition is:

**Loegos is a box where text, voice, images, and other human signals become sources that can be shaped, read, and preserved as proof.**

Shorter internal truth:

**Any meaningful human signal can enter the box.**

Necessary qualification:

**Not every source carries the same weight.**

## 16. What This Spec Enables

This spec creates a stable base for:

- multimodal source ingestion
- multi-human attribution
- better visual source handling
- emotion as a legitimate but bounded source class
- Operate as the box-read engine
- Seven as the conversation and audit layer
- receipts as proof artifacts
- future Lakin diagnostics without wrecking the live UI

## 17. Acceptance Criteria

This spec is working if the team can use it to answer these questions consistently:

1. What is a Box?
2. What counts as a source?
3. Can voice, images, and emotions enter the box?
4. How are multi-human inputs preserved?
5. What is the difference between normalization and verification?
6. What is Seven for?
7. What is Operate for?
8. What is a receipt for?
9. How does GetReceipts relate to Loegos?
10. Why is the coordinate system analysis and not navigation?

## 18. Final Principle

The product should be built from this rule:

**Loegos does not reduce the human to text. It gives every meaningful signal a place in the box, then reads the box honestly.**
