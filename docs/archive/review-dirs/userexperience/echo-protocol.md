# Echo Protocol
## Mechanics, Primitives, and Product Mapping
### The Engine Layer of Lœgos

**Status:** Working architecture document  
**Role:** Formal protocol and mapping layer  
**Companion:** [Echo Canon](./echo-canon.md)

---

## 0. Why Two Documents

Lœgos now has two distinct but related layers:

- **Echo Canon** is the human doctrine.
- **Echo Protocol** is the formal mechanics.

The canon says what the system believes.
The protocol says how the system computes.

If we merge them, the canon becomes too technical and the protocol becomes too poetic.
If we separate them, each can do its job cleanly.

This document defines the protocol layer and maps it directly onto the current product:

- Root
- Seed
- Block
- Receipt
- Seal
- Operate
- Assembly State
- Assembly Index

---

## 1. Thesis

Lœgos is a word-brick assembly system.

Words are the smallest durable compositional unit.
Blocks are the portable word-bricks.
The Seed is the current composition of those bricks.
Receipts are the witnessed proofs that reality answered.
The Assembly Index is the instruction manual that writes itself as the object is built.

In protocol terms:

- declaration creates the frame
- polarity creates direction
- vectors create exchange
- echo measures return
- seal marks closure under current priority
- structure is what survives time

---

## 2. Protocol Primitives

These are engine-layer terms. They are not all user-facing UI terms.

### 2.1 Monolith

A monolith is a discrete unit that can enter relation.

In the current product, a monolith is usually one of:

- a Box as a whole
- a source entering a Box
- a declaration standing as an object of commitment

We should be careful with this term in default UI because software teams already use "monolith" to mean a large codebase. Keep it protocol-facing unless we find a better runtime word.

### 2.2 Declaration

A declaration creates the frame against which motion can be measured.

Current runtime mapping:

- **Root** is the primary declaration primitive.
- The Root gloss expands the declaration without replacing it.

No declaration, no polarity.
No polarity, no direction.

### 2.3 Expectation

Expectation is the declared condition being tested.

It is not vague desire. It is the field-defining claim.

Current runtime mapping:

- Root + gloss together define the current expectation.
- The Seed interprets what that expectation looks like under present conditions.

### 2.4 Priority

Priority orders expectations when they compete.

Current runtime mapping:

- next requirement in Assembly State
- current gap language in the Seed
- receipt delta statements that declare what changed now

Future runtime implication:

- explicit priority ordering may become a first-class field in Box metadata

### 2.5 Polarity

Polarity is direction relative to a declared expectation.

It is not opposition.
It is orientation.

Current runtime mapping:

- **Aim** blocks (`△`) carry directional intent.
- Operate reads whether the current box is cohering toward the declared direction.

### 2.6 Vector

A vector is directed movement under a frame.

Current runtime mapping:

- a block can be treated as a vector-bearing sentence
- a receipt delta statement is an explicit vector statement
- a next move is a proposed vector

Not every sentence deserves vector status. The system should prefer one or two-sentence operational units because they can be moved, tested, and resealed.

### 2.7 Echo

Echo is measured return.

A vector goes out.
Reality answers back.
The answer is not the intent; it is the return.

Current runtime mapping:

- receipts are the durable echo surface
- Operate is the current echo reader
- gradient is the quality of motion under current evidence

### 2.8 Stop

Stop is unilateral suspension.

Relation is voluntary.
No echo is stop.

Current runtime mapping:

- pausing work
- discarding blocks
- choosing not to continue a line of assembly

Future runtime implication:

- Stop may deserve explicit representation distinct from failure

### 2.9 Terminal

Terminal is not Stop.
Terminal is field exhaustion.

Stop ends participation.
Terminal ends the expectation.

Current runtime mapping:

- not yet formalized
- closest current analog is a box reaching a final resolved release or being abandoned because the declared expectation is no longer live

This remains future-scoped.

### 2.10 Gradient

Gradient defines motion quality under current constraints.

It does not equal state.
It does not equal maturity.
It is the strength and coherence of the current read.

Current runtime mapping:

- Operate gradient (`1-7`)

### 2.11 Seal

Seal is declared closure under current priority.

It is not belief.
It is not optimism.
It is a witnessed closure event.

Current runtime mapping:

- sealed receipt
- receipt delta statement
- state transition event triggered by a sealed proof package

### 2.12 Relation

Relation is voluntary exchanged vectors under a shared frame.

Current runtime mapping:

- source + seed + receipt + box all exist in relation inside a declared box frame
- future multi-human and multi-observer models will extend this explicitly

### 2.13 Structure

Relation that survives time becomes structure.

Current runtime mapping:

- Seed state history
- sealed receipts
- confirmed blocks
- Assembly Index event stream

### 2.14 Invariant

Structure that survives pressure becomes invariant.

Current runtime mapping:

- Root as immutable declaration
- sealed receipt as immutable proof
- event history as durable trace

### 2.15 Engine

An engine is what remains stable under fresh entry.

Current runtime mapping:

- the Box model plus Root/Seed/Receipt/Index loop
- Seven decomposition
- Operate read
- receipt seal and state advance

---

## 3. Symbol Mapping

The canon symbols already line up with the current product.

| Symbol | Protocol Meaning | Current Runtime Meaning |
|---|---|---|
| `△` | directional declaration | aim / confirmed aim block |
| `□` | bounded evidence | confirmed evidence block |
| `○` | coherence / flow trace | story block / operational narrative |
| `7` | seal / validated closure | sealed receipt / closure event |
| `∞` | grace / reversible return | local-first drafts, retries, non-destructive editing |

This is a strong alignment and should remain stable.

---

## 4. Direct Mapping To The Current Product

This is the most important section for implementation.

### 4.1 Box

**Protocol role:** field of relation  
**Current role:** container for one Root, one Seed, sources, receipts, and state history

Interpretation:

- the Box is where declaration becomes trackable
- the Box is the unit of reality in the current product
- everything inside the box is relative to the declared expectation

### 4.2 Root

**Protocol role:** declaration + expectation frame  
**Current role:** immutable seven-word root plus editable gloss

Interpretation:

- Root is the frame-setting primitive
- Root text should remain compact, fixed, and hard to mutate
- Gloss can expand but should not replace the declaration

Design implication:

- Root should default to a compact live summary
- entering Root edit mode should feel deliberate

### 4.3 Block

**Protocol role:** word-brick / vector-capable unit  
**Current role:** operator sentence with tag, domain, provenance, and extraction lineage

Interpretation:

- Blocks are the compositional atoms
- A block is not yet evidence just because it exists
- A block becomes trustworthy through confirmation and relation to sources

Design implication:

- preserve compact block UI
- keep tag, stage, and domain machine-readable even when hidden by default

### 4.4 Seed

**Protocol role:** current composition under the declared frame  
**Current role:** live working object for the Box

Interpretation:

- Seed is the current built shape
- Seed is where blocks become compositional structure
- Seed is mutable because the composition is still under test

Design implication:

- Seed remains the primary working object in v1
- do not rename Seed away in the UI
- Root stays above it as the origin, not as the editable body

### 4.5 Source

**Protocol role:** fresh monolith entering the field  
**Current role:** uploaded, pasted, linked, spoken, or derived input

Interpretation:

- A source is new material entering relation
- Sources should remain immutable
- Re-extraction is a new pass, not a rewrite of the old material

Implementation implication:

- extraction pass lineage matters
- source truth should remain separate from Seed synthesis

### 4.6 Confirmation Queue (`⊘`)

**Protocol role:** unresolved vector candidates  
**Current role:** unconfirmed blocks waiting to become operational material

Interpretation:

- `⊘` means "not yet laundered into fact"
- `⊘` is a trust-preserving pause state
- `⊘` should remain ambient and easy to resolve

Design implication:

- treat `⊘` more like unread but more serious
- it should be visible from Home, Seed, Listen, and mobile navigation

### 4.7 Operate

**Protocol role:** current motion read under constraint  
**Current role:** box-level reading that returns aim, ground, bridge, gradient, convergence, trust bounds, next move

Interpretation:

- Operate is the gradient reader
- It does not declare truth; it reads current structure
- It should stay separate from receipt sealing

Design implication:

- keep gradient visible
- do not confuse gradient with state
- use Operate to expose mismatch between maturity, evidence, and direction

### 4.8 Receipt

**Protocol role:** witnessed echo record  
**Current role:** local-first proof object with optional GetReceipts push

Interpretation:

- Receipt is where the system moves from claim toward portability
- Draft receipts are reversible
- Sealed receipts are closure events

Implementation implication:

- a sealed receipt must snapshot the evidence package it used
- this is what makes the Assembly Index trustworthy later

### 4.9 Seal

**Protocol role:** closure under current priority  
**Current role:** explicit receipt sealing plus state transition event

Interpretation:

- Seal is not just status
- Seal is the point where claim, evidence, and witness meet

Implementation implication:

- sealing should stay hard enough to feel consequential
- local drafts should stay easy and reversible before seal

### 4.10 Assembly State

**Protocol role:** structural maturity across time  
**Current role:** Rooted -> Fertilized -> Sprouted -> Growing -> Structured -> Assembled -> Sealed -> Released

Interpretation:

- state is box-level maturity
- it is not the same as Operate gradient
- it is not the same as Seven stage on individual blocks

Design implication:

- keep one canonical state color scale
- use labels and color together

### 4.11 Assembly Index

**Protocol role:** structure that survives time  
**Current role:** evented internal record of root declaration, source intake, block confirmation, seed revision, receipt seal, state advance

Interpretation:

- this is the instruction manual writing itself
- this is where the build becomes transferable
- this is the long-term moat

Implementation implication:

- do not let receipts or events become lossy
- keep lineage and evidence references durable

---

## 5. What This Means For The Next Build Steps

### Adopt now

- Root as declaration
- Seed as current composition
- Receipt as witnessed echo
- Assembly Index as self-writing instruction manual
- color progression as maturity language
- ambient `⊘` as unresolved trust signal

### Keep engine-facing for now

- monolith
- polarity
- vector
- terminal
- field exhaustion
- observer B / multi-witness institutionality

These are powerful, but they should guide architecture before they guide mainstream UI copy.

### Future-facing, not default UI

- explicit witness models
- observer validation chains
- relation between multiple boxes or multiple actors
- terminal vs. stop as separate runtime states

---

## 6. Product Language Guidance

### Keep visible in the product

- Root
- Seed
- Receipt
- Seal
- Box
- Assembly Index

### Use selectively in high-context copy

- reality assembles
- evidence speaks
- keep the gap visible
- seal the receipt
- draft proof

### Keep out of default UI for now

- monolith
- polarity
- vector exchange
- field exhaustion
- invariant

These belong in protocol, architecture, and advanced explanatory writing until the runtime earns simpler visible translations.

---

## 7. Immediate Build Rules

When implementing from this point forward:

1. Do not add a new major noun unless it fits both canon and protocol.
2. Prefer compact compositions over explanatory panels.
3. Treat `⊘` as an ambient integrity signal, not a hidden workflow.
4. Treat receipt sealing as a true evidence event, not a formatting action.
5. Preserve lineage whenever blocks are regenerated.
6. Keep Root immutable, Seed mutable, Receipt sealable, and Index cumulative.

---

## 8. The Core Mapping In One Line

Lœgos is a box-scoped system where a declared Root frames expectation, Blocks act as word-bricks, the Seed holds the current composition, Receipts witness reality's echo, Seal marks closure under priority, and the Assembly Index preserves the structure that survives time.
