# Compiler Engineer Response: Room + Dream MVP

Date: April 13, 2026  
Audience: Driver, Designer, Engineering Team  
Status: Active engineering response  
Purpose: Answer the compiler-engineer handoff memo with the minimum honest contracts, build order, and honesty checks for the Room + Dream MVP.

Primary references:

- [projection-contact-loop-constitution-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/projection-contact-loop-constitution-2026-04-13.md)
- [team-realignment-memo-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/team-realignment-memo-room-dream-mvp-2026-04-13.md)
- [room-dream-foundation-design-proposal-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/room-dream-foundation-design-proposal-2026-04-13.md)
- [compiler-read-spec-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/compiler-read-spec-2026-04-13.md)

---

## A. Short Proposal

### A.1 MVP structure scope

The compiler/structure layer for this MVP should own five things:

1. `Compiler Read` honesty
2. `Bridge` continuity
3. `workingEcho` honesty
4. field-state / reason-for-open honesty
5. minimal carry-forward / receipt law

It should not try to solve the whole future system.

The goal is narrower:

**make Room, Dream, and the handoff structurally honest enough that the product can stay minimal without becoming fake.**

### A.2 Minimum honest `Compiler Read` contract

`Compiler Read` is a Dream action.
It is not a canonical mutation path.

Minimum contract:

- one Dream document in
- claim-by-claim extracted result out
- only the lawful subset translated
- the real compiler run on that subset when a subset exists
- an explicit distinction between:
  - `not_run`
  - `clean`
  - `blocked`
  - `unknown`

Mandatory extracted-claim fields:

- `id`
- `text`
- `claimKind`
- `translationReadiness`
- `provenanceClass`
- `supportStatus`
- `reason`
- `sourceExcerpt`
- `evidenceRefs`

Non-negotiable honesty rules:

- every surfaced claim must point back to a real source excerpt
- unsupported or philosophical material must remain visibly outside the lawful subset
- compile success does not imply truth
- compile failure does not imply the document is bad
- `not_run` must be explicit when no lawful subset was actually compiled

Minimum UI inspectability:

- plain-language summary
- claim list with classification
- generated `.loe` subset when one exists
- compile artifact summary
- omitted claims
- diagnostics or explicit `no compiler run` wording

What remains intentionally provisional:

- claim extraction
- claim classification
- chosen translation subset
- verdict language about what the structure can currently hold

### A.3 Minimum honest `Bridge` contract

`Bridge` is the Dream -> Room handoff seam.

Minimum payload:

- `kind`
  - `passage | note | witness`
- `documentId`
- `documentTitle`
- `anchor`
- `excerpt`
- `savedAt`

Minimum behavioral contract:

- `Send to Room` creates a source-backed composer draft
- the bridge payload remains visibly source-derived
- source identity and anchor remain inspectable
- the draft becomes a Room turn only when the user sends it
- provenance survives refresh / reload / later inspection

What `Bridge` must never do silently:

- auto-send a turn
- create canon
- create a receipt
- promote `Compiler Read` results into authority
- turn source-backed material into “machine-decided truth”

### A.4 Minimum honest `workingEcho` and field-state contract

`workingEcho` is the visible structure that keeps Room from collapsing into generic chat.

Minimum required fields:

- `loopState`
  - `open | contested | awaiting_return`
- `reasonForOpen`
- `aim`
- `whatSeemsReal`
- `openTension`
- `whatWouldDecideIt`
- `candidateMove`
- `returnDelta`

Minimum field-state rule:

- `open / contested / awaiting return` is derived
- it is not a canonical persisted truth object in MVP

Derivation standard:

- `awaiting_return` when the current field is waiting on reality to answer back
- `contested` when meaningful tension, weakening return, blocked preview pressure, or reroute pressure is live
- `open` otherwise

Reason-for-open standard:

- it must say why the loop is still open now
- it must not be decorative status language
- it must not become assistant summary in disguise

Fallback rule:

- structured, provenance-bearing, or canonical sources always win
- latest assistant prose may fill gaps only as fallback

### A.5 Minimum carry-forward / receipt law

For MVP, only these Dream -> Room objects travel:

- `passage`
- `note`
- `witness`

Allowed trust transitions:

- Dream source -> source-backed Room draft
- Room turn -> later structure only if later runtime/compiler behavior earns it

Forbidden trust transitions:

- `Compiler Read` result -> authoritative object
- bridge payload -> canon
- bridge payload -> receipt
- `workingEcho` -> canonical evidence
- derived field state -> persisted authoritative state

Receipts still matter, but in MVP they remain mostly quiet backend truth rather than a new primary UI surface.

### A.6 Non-goals

Not part of this slice:

- broad shell IA invention
- Recon runtime architecture
- Drive Tape runtime architecture
- Seven Terminal
- Shape Library UI
- new theory-heavy runtime surfaces
- more runtime nouns for their own sake

---

## B. Build Plan

### B.1 Phase 1: Lock `Compiler Read` honesty

Scope:

- explicit `not_run` contract
- explicit compiler execution state
- inspectable claim fields
- omission visibility
- honest UI framing when no lawful subset compiles

Likely modules:

- compiler-read helper and route
- Dream `Compiler Read` panel
- claim and route tests

Acceptance criteria:

- no empty translation can surface like a clean compile
- unsupported or philosophical material stays visibly outside the translated subset
- users can inspect what was translated and what was omitted

### B.2 Phase 2: Lock `Bridge`

Scope:

- shared `BridgePayload`
- Dream `Send to Room`
- Room turn persistence of bridge provenance
- Room rehydration of bridge context after refresh

Likely modules:

- Dream bridge helper
- Room turn / Room server seam
- Room composer / Dream notice surface
- bridge route tests

Acceptance criteria:

- Dream -> Room handoff remains source-backed
- a bridged item survives refresh without becoming a sent turn automatically
- source identity and anchor remain visible in Room

### B.3 Phase 3: Lock `workingEcho` and field state

Scope:

- thin user-facing loop state
- derived `reasonForOpen`
- `workingEcho` contract trimmed to the MVP steering set
- Room field chip and Room structure aligned to the same live state

Likely modules:

- working-echo builder
- Room field-state presentation
- Room steering UI
- working-echo contract tests

Acceptance criteria:

- Room no longer reads as generic chat plus optional structure
- `workingEcho` remains real but thin
- loop state and reason-for-open agree with the visible Room state

### B.4 Phase 4: Harden trust transitions

Scope:

- verify no silent authority upgrades
- verify `Compiler Read`, `Bridge`, and `workingEcho` stay provenance-first
- verify receipts remain quiet law, not premature UI gravity

Test lanes:

- unit tests for compiler-read and bridge helpers
- route tests for Room turn persistence
- contract tests for `workingEcho`
- focused e2e coverage for Dream -> Room handoff and Compiler Read framing

Acceptance criteria:

- no silent canon mutation
- no silent receipt creation
- no assistant-summary drift where structure should speak

### B.5 Recommended implementation order

Recommended order for the structure layer:

1. `Compiler Read` honesty
2. `Bridge` contract
3. `workingEcho` / field state
4. trust-hardening pass

This order keeps the most trust-sensitive boundaries stable before richer polish work accelerates.

---

## C. Honesty Checks

### C.1 What could overclaim

- `Compiler Read` sounding authoritative when no lawful subset compiled
- claims looking grounded without real source excerpts
- `Bridge` making source material feel already settled
- `workingEcho` sounding like truth instead of live structure
- field-state language sounding more final than the evidence allows

### C.2 What could silently mutate trust

- `Compiler Read` writing back into Room, canon, or receipts
- bridge payloads auto-sending or becoming authoritative without user send
- Room summaries upgrading assistant prose into structural fact
- derived field-state labels being persisted as canonical truth
- receipts being inferred from carry-forward alone

### C.3 What could make the machine look smarter than the structure really is

- hidden claim extraction magic
- hidden translation subset selection
- green compile chips without explicit execution
- vague “supported” language that outruns provenance
- `workingEcho` summarizing elegantly while source conflict stays unresolved
- return language that implies closure before reality has actually answered

### C.4 Operational standard

When in doubt, the structure layer should choose:

- explicit over magical
- provisional over sealed
- inspectable over smooth
- provenance-bearing over eloquent
- honest incompleteness over counterfeit closure

---

## One-Line Working Seal

**For the MVP, the compiler/structure layer should make Room, Dream, and the handoff inspectable and honest enough that the product can stay minimal without collapsing into chat, storage, or shadow authority.**
