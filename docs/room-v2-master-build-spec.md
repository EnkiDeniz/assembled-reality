# Room V2 Master Build Spec

Date: 2026-04-10
Status: Master source of truth for the next Room build
Scope: Product behavior, UX choreography, authority boundaries, and implementation guardrails for the Room experience

---

## 0. Purpose

This document is the master build reference for the next Room.

It exists to do three things:

1. preserve the experiential truth of the mock experience,
2. preserve the compiler/runtime truth boundaries already established in the live system,
3. prevent another failed replication attempt caused by copying the mock's look while losing either the feeling or the law.

This document is not a replacement for the compiler spec, proposal-gate contract, echo-field contract, or Shape Library contracts. Those remain authoritative for their own layers.

This document is authoritative for:

- what the Room is supposed to feel like,
- what the user should see first,
- how structure should emerge,
- how preview and canonical state must relate,
- what the next implementation must not do.

This document should be treated as the **Room choreography authority**.

It sits between:

- the lawful backend/core system,
- and the lived Room experience.

It does not replace the compiler spec, runtime contracts, or Shape Library contracts.
It tells the team how those truths must be made livable in the Room.

---

## 1. One-Sentence Product Definition

The Room is a calm conversational surface where messy human thought becomes visible structure and one lawful next move, without letting conversation pretend to be proof.

### 1.1 Naming Clarification: Box, Room, Field

These three terms are related, but they are not identical.

#### Box

The **Box** is the full truth-bearing container.

It may include:

- sources,
- hidden canonical Room source,
- compiler artifact,
- runtime ledger,
- receipt history,
- later Operate outputs,
- later Shape Library reads and governance outputs.

The Box is the larger object.

#### Room

The **Room** is the primary human surface into the Box.

It is where the user:

- speaks,
- sees structure wake up,
- gets one lawful next move,
- encounters the current condition of the field.

The Room should feel like being inside the Box, but it is not identical to the Box's full underlying reality.

#### Field

The **Field** is the current live condition inside the Box.

It is the evolving state of:

- aim,
- evidence,
- story,
- pings,
- returns,
- receipt-bearing clarity,
- canonical field condition.

The status chip and canonical mirror are reading the Field, not defining it.

#### Product law from this distinction

1. The Room must feel immediate enough that the user experiences it as "being with the Box."
2. The Room must not pretend it owns the whole truth of the Box.
3. The Field is what becomes clearer through return, not through interface confidence alone.
4. UI must not collapse Box, Room, and Field into one ambiguous object.

---

## 2. What The Mock Actually Captured

The mock in [loegos-v2-breathing-room.jsx](../LoegosCLI/UX/Mock%20experience/loegos-v2-breathing-room.jsx) is valuable as an experiential artifact, not as an implementation model.

What it gets right:

1. The Room begins as conversation, not as a dashboard.
2. The mirror feels like living working memory, not like a separate admin panel.
3. Structure appears progressively and in place.
4. The system sharpens thought without sounding like a generic assistant.
5. The user can immediately see the difference between:
   - aim
   - evidence
   - story
   - next ping
6. The status signal feels ambient, not procedural.
7. The interaction feels like:
   - talk
   - room listens
   - structure surfaces
   - one next move appears

The mock succeeds because it turns the system from "a chat app with tools" into "a room that becomes more legible as you talk."

---

## 3. What The Mock Is Not Allowed To Mean

The mock is not valid as a data model or authority model.

It cheats in two important ways:

1. model output mutates box state directly inside the send loop,
2. the mirror and chip update from preview structure rather than canonical compile/runtime truth.

Those shortcuts are acceptable in a mock because they create the right felt experience quickly.

They are not acceptable as production authority rules.

The next Room must preserve the feeling without inheriting those shortcuts.

---

## 4. Core Build Thesis

The next Room must reconcile two truths:

1. the user should feel that the Room is waking up in real time,
2. canonical state must still be earned through proposal -> gate -> compile -> apply.

The previous replication effort failed because it preserved the second truth while losing the first.

The result became:

- truthful,
- auditable,
- architecturally better,
- experientially flatter,
- procedurally visible,
- too much like "inspect proposal, then apply."

The next build must remove that felt procedural seam without breaking the real truth boundary.

---

## 5. The Problem We Are Solving

The current Room is directionally correct but experientially wrong.

It also still has too many semantic authors above the law:

- prompt logic,
- helper code,
- preview interpretation,
- parallel vocabularies,
- surface-level inference.

The next Room must reduce semantic authorship above compiler/runtime truth without flattening the experience.

It currently says:

"talk, inspect, apply, then the Room updates."

The target Room must say:

"talk, and the Room starts to reveal what it is hearing."

That does not mean direct mutation from model output.
It means the user must experience preview structure as part of the same conversational act, not as a separate inspection workflow.

---

## 6. Non-Negotiable Product Laws

These laws are binding.

### 6.1 Conversation first

The first experience is one conversation space, not a workspace dashboard.

### 6.2 Compiler/runtime authority remains real

Canonical Room truth must continue to come from:

- canonical source,
- compiler artifact,
- runtime window,
- lawful apply path.

No direct model write-back to canonical Room state.

### 6.3 Preview and canon are different things

The Room may surface proposal structure immediately.
It may not silently treat preview as canonical.

### 6.4 Structure must appear in place

The user should not need to open an inspector to understand what structure is emerging.

### 6.5 One next move

The Room should converge toward one lawful next move, not dump plans or dashboards.

### 6.6 Only returned evidence clears fog

Story can orient. It cannot claim mapped truth.

### 6.7 The Room is not a form tool

Receipt, return, and source capture should feel embedded in the room's conversational flow, not like switching to another product mode.

### 6.8 Shape Library may enter early as a starter prior

The Room may use Shape Library's starter library and BAT layer to produce a bounded first read.

This means the Room is allowed to say:

- what shape this may resemble,
- what the main gap is,
- what one lawful next move is,
- what would count as a real return,
- how the read could be wrong.

This early read is:

- advisory,
- hypothesis-bearing,
- non-canonical,
- closure-blocked by default.

If minimum witness is missing, the Room must not force a starter-library read.
It must instead return an insufficient-witness response or one discriminating question.

### 6.9 Shape Library remains non-mutating and non-canonical

Shape Library may advise.
It does not mutate Room truth.

Its allowed roles in the Room are:

1. starter prior / first-read guidance,
2. later downstream classification, promotion, and drift governance.

Its forbidden role is:

- direct mutation of Room source, Room runtime state, or canonical field truth.

---

## 7. UX Invariants From The Mock

These are the experiential invariants the next build must preserve.

### 7.1 Empty state purity

At first load, the user should see:

- one calm room,
- one centered invitation,
- one composer.

Not:

- dashboard chrome,
- box management as the main event,
- tool rows competing with the prompt,
- heavy law explanation banners.

### 7.2 The mirror is shared surface, not side furniture

The mirror must feel like it belongs to the same room as the conversation.

It cannot feel like:

- a separate right rail,
- an admin sidebar,
- a secondary analytics panel.

### 7.3 Structure resolves progressively

The mirror should not appear all at once as a static block.

The intended order is:

1. Aim can surface first.
2. Evidence and story can arrive as a pair.
3. Ping / move can arrive as the next actionable contour.
4. Returns can later harden the field.

The visual rhythm matters.

### 7.4 Structure lives inside the assistant turn

The assistant response should carry visible structural charge.

The user should be able to feel:

- what sentence is aim,
- what sentence is evidence,
- what sentence is story,
- what sentence is a ping suggestion.

The structure should not be hidden behind "Inspect proposal" as the primary reveal path.

### 7.5 The state chip must feel ambient

The chip should feel like the room's condition, not a ticket status.

It must be small, calm, ever-present when relevant, and emotionally legible.

### 7.6 The room must discipline vague thinking

The assistant should do what the screenshot does well:

- refuse vague context,
- ask for the actual problem,
- convert abstraction into something testable,
- keep the user close to what is really happening.

### 7.7 The user should stay in one cognitive lane

The user should not feel they are switching between:

- chatting,
- inspecting,
- managing artifacts,
- opening tools,
- applying edits,
- filing receipts.

The room can contain those actions, but must not feel mode-fragmented.

---

## 8. Truth Invariants From The Live System

These are the implementation truths that must survive.

### 8.1 Seven proposes, not legislates

The live apply path is correct in principle and must remain:

User input -> proposal preview -> gate -> compile -> apply -> canonical render

### 8.2 Canonical source mutates only through lawful apply

No direct preview mutation of the hidden Room document.

### 8.3 Canonical chip and mirror state come from compile/runtime truth

The visible canonical state may not drift from compiler/runtime outputs.

### 8.4 Runtime receipts remain append-only and auditable

Return history and closure logic must remain auditable and provenance-bearing.

### 8.5 No parallel semantic state machine in the UI

The frontend may stage preview state.
It may not invent an unsourced canonical world-model.

---

## 9. Authority Ladder In The Room

The Room must make these authority layers legible, even when the user never sees the jargon.

This ladder is the intended Room authority model for the next build, even if current helper code does not yet express every layer explicitly.

### 9.1 Insufficient witness

Meaning:

- there is not enough evidence to name even a starter-library read honestly.

Allowed output:

- one discriminating question,
- no canonical inflation,
- no closure language.

### 9.2 Base library

Meaning:

- the system is comparing the case against preloaded, tested starter shapes.

Examples:

- bottleneck
- feedback loop
- gate dependency
- saturation
- extraction

Allowed output:

- plausible shape hypothesis,
- main gap,
- one lawful next move,
- one receipt condition,
- one disconfirmation line.

Forbidden:

- closure language,
- confirmed/mapped truth claims,
- canonical state mutation.

### 9.3 Personal field

Meaning:

- the read is shaped by the user's current box, local evidence, and current conversational situation,
- but has not yet been strengthened by returned world contact.

This is the intended middle layer between generic library prior and return-backed local truth.

Allowed output:

- sharper local framing than base-library prior,
- local next move,
- receipt need,
- explicit uncertainty.

Forbidden:

- closure language unless later runtime rules permit it,
- pretending the field is already mapped.

### 9.4 Live echo

Meaning:

- real return has entered,
- the room now has return-backed local truth.

Allowed output:

- stronger local language,
- field clarity updates,
- return-grounded disconfirmation or confirmation.

### 9.5 Canonical field

Meaning:

- compile/runtime-backed Room state,
- hidden Room source + artifact + runtime window + lawful apply path.

This is what drives:

- canonical mirror,
- status chip,
- canonical field condition.

The Room may feel fluid across these layers, but it may not collapse them.

---

## 10. The Correct Mental Model

There are six distinct things in the Room:

1. **Conversation**
   - plain-language exchange
   - emotional and cognitive scaffolding

2. **Starter Prior / BAT Read**
   - a bounded first read from base library or personal field
   - useful for first orientation
   - never canonical by itself

3. **Proposal Preview**
   - structure the Room believes may be earned
   - tied to a specific assistant turn
   - still non-canonical

4. **Canonical Mirror**
   - structure the compiler/runtime has actually accepted

5. **Receipt / Return**
   - the concrete world-contact object that can move the field

6. **Field State**
   - the room's current condition based on compile/runtime and returns

The next Room fails if any two of these become visually or conceptually indistinguishable.

The next Room also fails if these become so separated that the user experiences them as separate products.

The design job is to make them distinct in authority, but continuous in feeling.

---

## 11. Source-Of-Truth Mapping For The Next Build

### 11.1 Conversation text

Authority:
- assistant/user messages

### 11.2 Starter prior / BAT read

Authority:

- Shape Library analyze result,
- starter library,
- BAT-generated operator read,
- current box-level evidence when available.

Meaning:

- "this is the current first read"
- "this is what the room thinks may be happening"

Not:

- "this is canonical"
- "this is sealed"

### 11.3 Inline structure reveal / preview

Authority:
- proposal preview payload from the current assistant turn

Meaning:
- "this is what the Room is hearing"

Not:
- "this is already canon"

### 11.4 Canonical mirror

Authority:
- compile/runtime-backed Room view

Meaning:
- "this is what the Room has actually accepted"

### 11.5 Status chip

Authority:
- compile/runtime-backed field state only

Meaning:
- "this is the condition of the field"

### 11.6 Receipt / return cards

Authority:
- receipt kit preview before completion,
- runtime-backed return after completion and apply.

---

## 12. Preview Object Semantics

Preview must be treated as a first-class system object, not an accidental UI side effect.

Preview rules:

1. Preview is always tied to a specific assistant turn, proposal id, or receipt-kit completion path.
2. Preview is ephemeral and non-canonical.
3. Preview may update visible choreography.
4. Preview may not mutate canonical source, canonical mirror, or canonical field state.
5. Preview can be:
   - active,
   - dismissed,
   - superseded,
   - expired,
   - applied.
6. Only one primary preview should be active at a time unless explicitly designed otherwise.
7. A preview may survive in history, but it must never silently masquerade as active canonical structure.

Preview object minimum semantics:

- `previewId`
- `sourceAssistantMessageId`
- `sourceLayer`
- `createdAt`
- `status`
- `segments`
- optional `receiptKit`
- optional `gatePreview`

The purpose of preview is not to become a second state machine.
Its purpose is to let the room feel alive while the truth boundary stays real.

---

## 13. Visual Truth Distinction Rule

The Room must make this distinction obvious at a glance:

- what the room is hearing
- what the room has accepted

Non-negotiable distinction rules:

1. Preview uses lighter, more ephemeral treatment than canon.
2. Canon uses the stable mirror surface.
3. The status chip reflects canon only.
4. Preview energy must be expressed through:
   - inline structure,
   - subtle wake/resolve motion,
   - preview labels or tone,
   - localized affordances,
   never through canonical chip or canonical field claims.
5. If a user can mistake preview for accepted truth after one second of looking, the design is failing.

Recommended default:

- preview = inline, breathable, sentence-level, clearly current-turn-bound
- canon = persistent mirror region, stable typography, no ambiguity about acceptance

---

## 14. Canonical Turn Choreography

The next Room must preserve these five turn patterns.

### 14.1 Conversation-only turn

```text
User turn
  -> Seven responds conversationally
  -> no structural preview
  -> no canonical mutation
  -> chip unchanged
```

### 14.2 First-read / starter-prior turn

```text
User turn
  -> if minimum witness missing:
       return one discriminating question
  -> else:
       Shape Library/BAT may produce bounded first read
       (possible shape, main gap, one next move, one receipt condition)
  -> no canonical mutation
  -> closure blocked by default
```

### 14.3 Proposal-preview turn

```text
User turn
  -> Seven produces assistant text + preview structure
  -> preview appears inline in the turn
  -> room feels the wake of structure
  -> canonical mirror and chip remain unchanged until lawful apply
```

### 14.4 Apply turn

```text
User applies preview
  -> gate
  -> compile
  -> save canonical source/runtime
  -> rebuild canonical room view
  -> canonical mirror updates
  -> chip updates if field truth changed
```

### 14.5 Receipt-kit completion turn

```text
User completes receipt kit
  -> build lawful completion proposal
  -> gate
  -> apply
  -> append receipt/runtime event
  -> canonical field may shift (for example awaiting -> mapped)
```

If an implementation cannot clearly say which of these turn types it is handling, it is not ready.

---

## 15. The Main Design Correction

The next Room must move from:

- hidden structure in an inspector,
- explicit proposal inspection,
- visible procedural apply step as the center of the experience

to:

- structure visible inline with the assistant turn,
- canonicality still visually distinct,
- apply feeling lightweight and inevitable when lawful,
- the mirror resolving in tandem with conversation rather than living behind a separate reveal.

This is the heart of the build.

---

## 16. Why We Failed So Far

### 16.1 We copied architecture instead of choreography

We preserved gate/apply truth but did not preserve the way the mock made conversation and structure feel like one motion.

### 16.2 We copied safety but not emergence

The live Room hides proposal structure behind a disclosure and a separate "Apply to Room" action.
That is safe, but it destroys the mock's core rhythm.

### 16.3 We treated structure as inspector content

In the mock, structure is visible in the utterance itself.
In the live Room, structure is mostly tucked behind a preview panel.

### 16.4 We made the mirror an output panel instead of a shared surface

The mock's mirror feels like the room's memory.
The live Room mirror behaves more like a compiled sidebar.

### 16.5 We exposed workflow seams that the mock hides

The mock collapses:

- speak,
- structure,
- mirror update,
- state update

into a single perceived moment.

The real Room exposes:

- turn submit,
- proposal persistence,
- proposal inspection,
- gate status,
- apply,
- canonical refresh

as separate perceived steps.

### 16.6 We tried to preserve the mock's feeling without naming the mock's cheat

The mock feels alive partly because it lets model output update UI structure immediately.

We rejected that shortcut, correctly.
But we did not replace it with a new truthful preview choreography.

That was the real gap.

---

## 17. Build Direction: The Right Reconciliation

The next build should follow this principle:

**preview should feel immediate, canon should remain earned.**

That means:

1. the assistant turn itself should expose structure inline,
2. the user should be able to tap or hover sentences to see structural meaning,
3. the room should visually start resolving around that preview,
4. canonical mirror regions should still distinguish accepted structure from waking structure,
5. apply should exist, but should not be the main theatrical event.

The user should feel:

"the room is showing me what it hears"

before:

"the room has formally accepted this."

That is the correct experiential sequence.

---

## 18. Concrete UX Requirements

### 18.1 First load

Must show:

- centered invitation,
- composer,
- almost nothing else.

Must not foreground:

- box management,
- source management,
- diagnostic rails,
- multi-tool rows.

### 18.2 First assistant turn

If no structure is earned:

- assistant responds plainly,
- no fake mirror emergence,
- no canonical state inflation.

If structure is earned:

- structural cues appear inside the assistant turn,
- not hidden as the default behind a proposal inspector.

### 18.3 Mirror emergence

The mirror should:

- feel top-of-room,
- appear progressively,
- be collapsible,
- read as living structure, not a separate application surface.

### 18.4 Proposal visibility

Proposal structure should be visible by default when materially present.

It may be lightweight and subtle.
It may not require explicit inspection as the primary path.

### 18.5 Apply affordance

Apply must exist for canonical mutation.

But:

- it should not dominate the interaction,
- it should not make the room feel like a code review tool,
- it should not be the only moment when the room becomes legible.

### 18.6 Receipts

Receipt kits should feel like conversational scaffolds, not mini-forms stapled under a message.

The user should experience:

- one thing to get,
- why it matters,
- what would count,
- what surprise would matter.

### 18.7 State

The state chip must remain authoritative.
If preview is active but canon is unchanged, the chip still reflects canonical truth.

If needed, preview energy should be shown elsewhere, not by lying with the chip.

---

## 19. Vocabulary Lock For The Room Path

The Room path must operate in one runtime ontology by default.

Default Room runtime terms:

- aim
- evidence / witness
- story
- ping / move
- test
- return
- receipt
- field
- preview
- canon

Shape Library first-read terms may appear only when explicitly scoped as a first read:

- shape
- assembly class
- stage
- main gap
- next lawful move
- receipt condition
- disconfirmation

Terms from other subsystems must not leak into ordinary Room behavior unless explicitly mapped and labeled:

- Root
- Seed
- Bridge
- Gradient
- ghost operator
- Lakin moments
- legacy parallel metaphors

If these appear in the Room path without explicit mapping, remove them or map them.

---

## 20. Concrete Implementation Guardrails

### 20.1 Forbidden

The next build must not:

1. mutate canonical state directly from model output,
2. compute canonical field state in the frontend,
3. require a proposal inspector as the primary way to perceive emerging structure,
4. make the mirror a right-sidebar admin object,
5. bury disconfirmation, receipt need, or next move behind secondary panels,
6. turn receipt capture into a detached form-builder experience,
7. allow vague or nonsense input to create canonical-looking structure without resistance,
8. let starter-library priors masquerade as local proof,
9. let Shape Library terminology drift into default Room turns without explicit scope,
10. let more than one unsignaled primary preview compete for the user's attention.

### 20.2 Required

The next build must:

1. distinguish preview from canonical state visually and semantically,
2. keep compiler/runtime as the authority for canonical mirror and field state,
3. surface proposal structure inline in the conversation when earned,
4. make the room's next lawful move obvious,
5. preserve provenance and return logic,
6. remain compatible with the current gate/apply model unless explicitly replaced by a stronger lawful model,
7. support starter-library/BAT first reads without confusing them for canonical truth,
8. keep the status chip brutally honest,
9. preserve the insufficient-witness path as a real first-class outcome.

---

## 21. Relationship To Existing Specs

This document depends on and must remain compatible with:

- `LoegosCLI/docs/loegos-v2-shell-spec.md`
- `LoegosCLI/docs/echo-field-contract-v1.md`
- `LoegosCLI/docs/seven-proposal-gate-contract-v0.md`
- `LoegosCLI/docs/compiler-artifact-contract-v0.md`
- `docs/operate-spec-v2.md`
- `shapelibrary/docs/Product_Law_Interface_Contract.md`
- `shapelibrary/docs/BAT_Spec_v0.1.md`

Priority rule:

1. compiler/runtime/receipt law remains authoritative for truth,
2. this document remains authoritative for the Room build experience and choreography,
3. dated diagnostics remain supporting analysis, not the primary build contract.

---

## 22. Acceptance Criteria For The Next Room

The next Room is successful when all are true:

1. A new user can enter with only one visible invitation: talk.
2. The first meaningful assistant turn can make structure feel present without pretending it is already canonical.
3. The user does not need to open an inspector to understand what the room is hearing.
4. The canonical mirror still reflects compile/runtime truth only.
5. The state chip never lies.
6. The assistant reliably sharpens vague thought into one clearer problem contour or one lawful next move.
7. The room feels like one continuous surface, not chat plus tools plus admin panels.
8. Receipt capture feels embedded, not bureaucratic.
9. The user can feel the room getting clearer over time.
10. The Room can produce a bounded first read from starter priors when enough witness exists.
11. The Room can also honestly say "not enough witness yet" and ask one discriminating question.
12. The build preserves the lawfulness gains of the current Room while recovering the felt immediacy of the mock.

---

## 23. Final Build Commandment

Do not build "the mock, but safer."

Build a Room where:

- preview breathes,
- starter priors help without pretending to know,
- canon stays honest,
- the mirror lives with the conversation,
- and the user feels the system helping them make contact with reality rather than operate a workflow.
