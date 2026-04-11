# Future State System Architecture

Date: 2026-04-10
Status: Target-state architecture and product model
Purpose: Define the intended steady-state system so planning can happen against one coherent future model instead of a mix of current implementation, Room UX goals, and Shape Library aspirations.

---

## 0. Why This Document Exists

The project now has:

- a current-state implementation baseline,
- a Room-specific choreography/build spec,
- compiler/runtime law,
- Shape Library and BAT specs,
- Operate doctrine.

What has been missing is one document that says:

**when these pieces are all working together, what is the system actually supposed to be?**

This document is that answer.

It is the future-state target for planning.

---

## 1. One-Sentence System Definition

The system is a compiler-governed reality-assembly environment where a Box accumulates witness, conversation, visible working echo, lawful structure, world return, and later reusable shape knowledge without collapsing advice, preview, and proof into the same thing.

---

## 2. Core Product Purpose

The purpose of the system is to help a human move from:

- vague concern,
- messy evidence,
- conflicting interpretations,
- untested plans,

to:

- a clear current read,
- one lawful next move,
- one real receipt condition,
- an honest sense of what is known, what is hypothesized, and what has actually returned from reality.

The system should not only answer.
It should make the emerging read visible enough that the user's next turn becomes better.

The system is not primarily for:

- generic ideation,
- persuasive summarization,
- coaching theater,
- pretty notes,
- AI confidence without proof.

The product hinge is the visible working echo between conversation and canon.
That is the surface that should help a human or agent drive the next move more truthfully.

---

## 3. Primary Objects

## 3.1 Box

The **Box** is the primary truth-bearing object.

A Box contains, over time:

- sources,
- hidden canonical Room source,
- compiler artifact,
- runtime ledger,
- conversations,
- receipt history,
- Operate projections,
- Shape Library classifications and promotions that reference the box.

A Box is the main container of reality work.

## 3.2 Room

The **Room** is the default human surface into a Box.

The Room is where a user:

- talks,
- sees structure wake up,
- gets one lawful next move,
- records return,
- senses the field.

The Room should feel like being with the Box, but it is not identical to the whole Box.

## 3.3 Working Echo

The **Working Echo** is the session-scoped, visible, provisional read of what the conversation and witness currently seem to be assembling.

It should help the user see, outside the chat transcript:

- what seems real so far,
- what conflicts,
- what would decide it,
- the candidate move when one is actually justified,
- the current uncertainty state.

The Working Echo is:

- useful,
- visible,
- revisable,
- non-canonical.

It should also stay grounded:

- aim, tension, deciding split, and candidate move should carry visible provenance
- the builder should reuse the hidden good signals already present in Room `segments`
- the surface should only wake up once enough signal exists to make it genuinely steerable

The Working Echo is one of the main product objects.

## 3.4 Session

A **Session** is one conversation lane inside the Room around a Box.

A Session carries:

- thread continuity,
- handoff summary,
- local conversation memory,
- current active preview context.

A Session is not a separate canonical branch unless the product explicitly introduces branching later.

## 3.5 Field

The **Field** is the current live condition inside the Box.

It includes:

- aim,
- evidence,
- story,
- pings,
- tests,
- returns,
- closure condition,
- current clarity / fog / awaiting state.

The Field is sensed through the Room but governed by compile/runtime truth.

## 3.6 Receipt

A **Receipt** is a return-bearing object that marks real contact with reality.

A receipt is not just a stored note.
It is evidence of contact, comparison, surprise, contradiction, or confirmation.

## 3.7 Shape

A **Shape** is reusable structural knowledge.

Shapes begin as:

- starter-library priors,
- candidate structures,
- later promoted reusable patterns.

Shapes do not directly author local box truth.

---

## 4. Truth Layers

The future state depends on keeping these layers separate.

## 4.1 Witness layer

Question:

- what entered?

Objects:

- files
- links
- pasted text
- images
- transcriptions
- user-reported observations

Rule:

- witness is recorded before interpretation.

## 4.2 Conversational layer

Question:

- what is the human trying to articulate or clarify?

Objects:

- session turns
- handoff summaries
- conversational narrowing

Rule:

- conversation may shape attention, but does not directly become canon.

## 4.3 Working echo layer

Question:

- what is the conversation currently assembling, and what should the user see before canon changes?

Objects:

- visible session-scoped echo
- provisional aim signal
- evidence carried forward
- explicit unresolved tension
- candidate move signal

Rule:

- the working echo should help the next turn,
- the working echo is not yet accepted truth,
- the working echo must remain visibly revisable.

## 4.4 Preview layer

Question:

- what structure may be emerging?

Objects:

- turn-bound proposal preview
- receipt-kit preview
- inline structural cues

Rule:

- preview is alive,
- preview is useful,
- preview is not canonical.

## 4.5 Canonical language layer

Question:

- what structure is lawful?

Objects:

- hidden Room source
- compiler artifact
- proposal gate result

Rule:

- only lawful structure becomes canonical.

## 4.6 Runtime layer

Question:

- what actually happened?

Objects:

- move events
- test events
- returns
- closure records
- append-only runtime state

Rule:

- runtime answers whether reality replied.

## 4.7 Shape layer

Question:

- what pattern does this resemble, and what can be reused?

Objects:

- starter-library priors
- BAT reads
- candidate shapes
- promoted primitives/assemblies
- drift tracking

Rule:

- shapes may orient local work,
- shapes may later become reusable knowledge,
- shapes do not override local canon.

---

## 5. Authority Ladder

The future system should operate with a clear authority ladder.

## 5.1 Insufficient witness

Meaning:

- not enough evidence to name a read honestly.

Allowed output:

- one discriminating question,
- no structural inflation,
- no closure language.

## 5.2 Base library

Meaning:

- the system is using starter-library patterns as priors.

Allowed output:

- likely shape,
- main gap,
- one lawful next move,
- one receipt condition,
- one disconfirmation line.

Forbidden:

- confirmed truth claims,
- closure language,
- canonical mutation.

## 5.3 Personal field

Meaning:

- the read is local to this box and current evidence,
- but not yet return-backed enough to claim mapped truth.

Allowed output:

- local framing,
- local next move,
- local uncertainty,
- receipt need.

## 5.4 Live echo

Meaning:

- real return has entered and changed the local truth picture.

Allowed output:

- stronger local language,
- field updates,
- confirmation / surprise / contradiction language grounded in return.

## 5.5 Canonical field

Meaning:

- compile/runtime-backed accepted box state.

This drives:

- canonical mirror,
- state chip,
- lawful closure decisions.

## 5.6 Promoted shape knowledge

Meaning:

- reusable structure earned across multiple episodes/boxes.

Allowed output:

- priors for future first reads,
- recurrence and transfer guidance,
- drift alerts.

Forbidden:

- rewriting local box truth.

---

## 6. Product Surfaces In The Future State

## 6.1 Room

Primary surface.

Purpose:

- first conversation,
- local structure emergence,
- one next move,
- receipt capture,
- felt condition of the field.

## 6.2 Reader

Source-facing surface.

Purpose:

- inspect witness,
- read documents,
- verify provenance,
- understand what source actually says.

## 6.3 Operate

Box-level projection engine.

Purpose:

- compress the box into Aim / Ground / Bridge,
- place convergence and trust,
- name the next upgrade path,
- expose what the box currently amounts to as a whole.

## 6.4 Shape Library

Pattern and governance surface.

Purpose:

- first-read priors,
- candidate shapes,
- promotion,
- drift,
- recurrence,
- transfer.

## 6.5 Instrument

Advanced control/audit surface.

Purpose:

- diagnostics,
- trace,
- source inspection,
- explicit overrides where allowed,
- auditability.

The future product may expose these differently, but this functional decomposition should stay stable.

---

## 7. The Room's Future Role

In the future state, the Room is not:

- the entire box,
- the whole truth engine,
- just a chat app,
- just a session list.

The Room is the surface where:

1. the human enters plainly,
2. the system can either ask one better question or produce one bounded read,
3. structure can wake visibly,
4. the user can send one ping,
5. reality can answer,
6. the field can become more honest and more legible.

The Room should become the humanly livable junction of:

- BAT first-read guidance,
- inline preview choreography,
- canonical mirror truth,
- receipt-bearing field change.

---

## 8. Where Shape Library Enters

This is the clearest intended future integration.

Shape Library enters in **two different moments**.

## 8.1 Early: starter prior / BAT first read

When minimum witness exists, but before strong local return exists, the Room may use Shape Library to generate:

- likely shape hypothesis,
- assembly class,
- main gap,
- one lawful next move,
- one receipt condition,
- one disconfirmation line.

This is the future-state answer to:

- "what does the system say first?"

This early entry is:

- advisory,
- closure-blocked,
- non-canonical,
- helpful enough to move the human toward contact.

## 8.2 Later: downstream pattern governance

After boxes accumulate lawful structure and runtime history, Shape Library can:

- detect recurrence,
- compare against known shapes,
- create candidates,
- promote patterns with receipts,
- track drift.

This is the future-state answer to:

- "how does the system build reusable intelligence over time?"

## 8.3 Shape Library must not do these things

Even in future state, Shape Library must not:

- directly write Room canon,
- override runtime truth,
- claim local closure by library authority alone,
- substitute priors for returned evidence.

---

## 9. BAT's Future Role

BAT is the translator between structural read and human action.

BAT should become the standard way first-read and advisory outputs enter the Room.

BAT does:

- wall line / main gap,
- one next ping,
- one receipt condition,
- one disconfirmation line,
- tone class,
- closure language control.

BAT does not:

- invent truth,
- create canon,
- replace compiler/runtime,
- speak beyond the evidence and current read state.

In the future system:

- starter-library priors should enter the Room through BAT,
- local field advisory reads should also enter through BAT-like constraints,
- the Room should not become a freeform coaching interface.

---

## 10. Canonical Runtime Flow

The future target flow is:

### 10.1 First contact

```text
User enters Room
  -> if insufficient witness:
       ask one discriminating question
  -> else:
       produce bounded first read (starter prior / BAT)
```

### 10.2 Conversational shaping

```text
User continues speaking
  -> Seven narrows / reflects
  -> possible proposal preview appears inline
  -> no canonical mutation yet
```

### 10.3 Canonical mutation

```text
Preview is accepted
  -> gate
  -> compile
  -> apply
  -> canonical mirror updates
```

### 10.4 Field contact

```text
User sends ping / completes receipt kit
  -> runtime event appended
  -> return enters
  -> canonical field may shift
```

### 10.5 Reusable structure

```text
Box and runtime history accumulate
  -> Shape Library compares / evaluates
  -> candidates emerge
  -> promotion or drift decisions happen separately
```

---

## 11. Distinction Rules That Must Survive

The future system only works if these distinctions remain hard:

### 11.1 Preview vs canon

Preview can feel alive.
Canon must remain earned.

### 11.2 Prior vs return

Starter-library knowledge can orient.
Only real return hardens the field.

### 11.3 Session vs box

Many sessions can exist.
Canon remains box-level.

### 11.4 Shape vs local truth

Shapes can guide local reading.
Shapes do not override what happened in this box.

### 11.5 Advice vs closure

The system may often advise.
It must only rarely and honestly allow closure.

---

## 12. User Experience Over Time

The future-state user journey should feel like:

### Phase 1: arrival

"I can just say what is happening."

### Phase 2: first orientation

"The system can name what this may be and what I should do next."

### Phase 3: emergence

"The room is starting to show me what it hears."

### Phase 4: contact

"I sent a real ping and got a real return."

### Phase 5: trust

"The field is clearer because reality answered, not because the system sounded smart."

### Phase 6: reuse

"This pattern is not just mine now; the system knows it as a reusable shape."

That is the ideal experiential arc.

---

## 13. What Planning Should Optimize For

Planning should optimize for alignment between:

1. **current baseline**
   - compiler-first room sessions
   - one box, many conversations, one canon

2. **Room build target**
   - immediate preview
   - shared mirror
   - honest state
   - better first-turn experience

3. **future-state integration**
   - starter-library priors
   - BAT first reads
   - later shape governance

If planning focuses only on current implementation, the system stays flat.
If planning focuses only on the Room mock, the system loses lawfulness.
If planning focuses only on Shape Library doctrine, the Room stops feeling humane.

The future system needs all three.

---

## 14. What Is Still Explicitly Unknown

This target document does not resolve:

- whether sessions ever become true branches,
- whether Operate remains a separate surface or becomes more ambient,
- how much Shape Library enters the default Room versus a separate advanced mode,
- how promotion and drift are shown to ordinary users,
- what final visual language distinguishes base-library priors from local field reads.

Those are planning decisions, not assumptions.

---

## 15. Final Future-State Verdict

The future system should be:

- compiler-governed,
- conversation-first,
- preview-alive,
- receipt-bearing,
- Shape-Library-assisted,
- and explicit about what is prior, what is local, what is returned, and what is canon.

In its best form, the user experiences:

- one room,
- one box,
- one current field,
- one next move,
- and a system that grows from starter priors into real reusable knowledge without ever letting style replace proof.
