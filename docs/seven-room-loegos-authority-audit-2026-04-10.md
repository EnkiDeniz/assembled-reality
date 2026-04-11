# Seven, Room, and Lœgos Authority Audit

Date: April 10, 2026  
Status: Formal diagnostic document  
Purpose: Determine why the live Room behaves incorrectly, and how much of that behavior comes from prompt debt, legacy system overlap, schema mismatch, or incomplete compiler/language authority.

---

## 1. Executive Diagnosis

The live Room is **not** currently using old `/api/seven` at runtime. The active `/workspace` UI posts to `/api/workspace/room/turn`, persists `assistantText` plus `room_payload`, and only mutates canonical `.loe` source through `/api/workspace/room/apply`. That part of the architecture is real and coherent.

The main problem is **split authority**, not a single broken prompt.

The current system has four meaning-producing layers:

1. a Room-specific Seven prompt and turn classifier
2. a legacy `/api/seven` instrument system that still exists and still powers legacy `phase1`
3. a prototype Anthropic schema that established a different sentence-to-structure contract
4. a `LoegosCLI` compiler/runtime/gate stack that is closer to the intended language authority, but not yet authoritative enough to carry most semantics on its own

That split creates three visible failures:

- **schema drift**: the live Room contract, the legacy Seven contract, and the prototype contract are materially different
- **prompt overreach**: the Room prompt still has to invent too much semantic behavior before the compiler ever sees anything
- **incomplete compiler authority**: the compiler validates and shapes clauses, but the Room still derives a meaningful amount of state and presentation in helper code instead of from a richer compiler-owned artifact contract

### Direct answers to the core audit questions

- **Is `/workspace` using old `/api/seven` at runtime?** No. The live Room uses `/api/workspace/room/turn` from the current Room UI.
- **Is the prototype schema compatible with the live Room system?** No. It assumes different fields, different provider behavior, and direct box-update helpers that the live Room does not use.
- **Is the live Room still carrying prototype/legacy assumptions conceptually?** Yes. The live Room still treats Seven as a sentence-segmenting structure author, which is a conceptual descendant of the prototype even though the fields changed.
- **Is the compiler already authoritative enough to carry most semantics?** No.
- **Is Shape Library in the live Room authority path?** No.
- **Is the Room route structurally weaker than adjacent AI routes?** Yes. It uses prompt-only JSON plus manual parsing, while neighboring routes use strict `json_schema`.

### Top 3 root causes

1. **Split authority across multiple Seven/schema systems**
2. **Weak structured-output enforcement in the Room route, forcing prompt and guardrail compensation**
3. **Compiler/runtime authority is incomplete relative to the Lœgos v0.5-draft goal**

Prompt debt is real, but it is a symptom of those deeper causes rather than the sole cause.

---

## 2. Current Authority Map

### Live Room path

```text
/workspace
  -> RoomWorkspace
  -> POST /api/workspace/room/turn
  -> buildRoomSystemPrompt()
  -> OpenAI Responses API
  -> parseJsonObject() + normalizeRoomTurnResult()
  -> applyRoomTurnGuardrails()
  -> runRoomProposalGate() if proposal segments exist
  -> persist assistantText + room_payload citations only
  -> canonical mutation happens later via POST /api/workspace/room/apply
  -> apply route re-runs gate
  -> saveRoomAssemblySourceForUser(... gate.nextSource ...)
  -> room-server recompiles source and rebuilds canonical Room view
```

### Boundary matrix

| System | Active in `/workspace` | Role today | Authority level |
|---|---:|---|---|
| Live Room Seven | Yes | conversational response + optional proposal metadata | high on turn generation, not canonical |
| Old `/api/seven` | No for live Room | legacy instrument/document assistant | legacy / parallel |
| Prototype Anthropic schema | No | historical design reference | inactive, but conceptually influential |
| `LoegosCLI` compiler/runtime/gate | Yes | compile, gate, runtime state, view-model helpers | canonical-ish, but incomplete |
| Shape Library | No | separate analyze/promote/drift system | parallel experimental |

### Proven live path

- `/workspace` renders the live Room page in [`src/app/workspace/page.jsx`](../src/app/workspace/page.jsx).
- The Room UI submits turns to `/api/workspace/room/turn` from [`src/components/room/RoomWorkspace.jsx:1461`](../src/components/room/RoomWorkspace.jsx#L1461).
- The Room route builds the current Room prompt in [`src/app/api/workspace/room/turn/route.js:86`](../src/app/api/workspace/room/turn/route.js#L86).
- The Room route normalizes turn payloads and applies guardrails in [`src/app/api/workspace/room/turn/route.js:221`](../src/app/api/workspace/room/turn/route.js#L221) and [`src/lib/room-turn-policy.mjs:290`](../src/lib/room-turn-policy.mjs#L290).
- Gate decisions happen in [`src/lib/room-canonical.js:152`](../src/lib/room-canonical.js#L152).
- Canonical `.loe` mutation happens only in the apply route, where `gate.nextSource` is saved in [`src/app/api/workspace/room/apply/route.js:352`](../src/app/api/workspace/room/apply/route.js#L352).
- Compiler/runtime truth enters the Room view in [`src/lib/room-server.js:172`](../src/lib/room-server.js#L172) and is projected into the Room view model in [`src/lib/room-canonical.js:483`](../src/lib/room-canonical.js#L483).

### Inactive / legacy paths

- The old phase shell still imports `fetchSevenProposal()` in [`LoegosCLI/UX/loegos-phase1-shell.jsx:23`](../LoegosCLI/UX/loegos-phase1-shell.jsx#L23) and calls it in [`LoegosCLI/UX/loegos-phase1-shell.jsx:1344`](../LoegosCLI/UX/loegos-phase1-shell.jsx#L1344).
- That legacy client hits `/api/seven` through [`LoegosCLI/UX/lib/seven-proposal-client.mjs:153`](../LoegosCLI/UX/lib/seven-proposal-client.mjs#L153).

**Conclusion:** direct runtime prompt bleed from old `/api/seven` into live `/workspace` is **not proven**. Conceptual bleed and contract drift are.

---

## 3. Seven Systems Comparison

### A. Live Room Seven

Source:
- [`src/app/api/workspace/room/turn/route.js:86`](../src/app/api/workspace/room/turn/route.js#L86)

Characteristics:
- Provider/model assumption: OpenAI Responses API
- Response shape: `assistantText`, `turnMode`, `segments[]`, `receiptKit`
- Visible text model: `assistantText` only by default
- Structural payload: hidden `segments[]`, later passed through guardrails and gate
- Clause proposal behavior: yes, through `suggestedClause` inside segments
- Box mutation helpers like `boxAction` / `boxValue`: no
- Compatibility with live Room pipeline: yes, this is the live Room pipeline

### B. Old `/api/seven` instrument/document Seven

Source:
- [`src/app/api/seven/route.js:74`](../src/app/api/seven/route.js#L74)
- [`src/app/api/seven/route.js:562`](../src/app/api/seven/route.js#L562)

Characteristics:
- Provider/model assumption: OpenAI Responses API
- Response shape: varies by instrument intent (`hypotheses`, `candidates`, etc.)
- Visible text model: formatted answer derived from instrument result
- Structural payload: instrument-specific, not Room-specific
- Clause proposal behavior: indirect; legacy `seven-proposal-client` maps candidates into clauses
- Box mutation helpers: no direct box mutation helpers in the API, but downstream legacy client turns candidates into aim clauses
- Compatibility with live Room pipeline: no

### C. Prototype Anthropic Room

Source:
- [`v1.1/files/loegos-v2-room.jsx:45`](../v1.1/files/loegos-v2-room.jsx#L45)

Characteristics:
- Provider/model assumption: Anthropic Claude direct call
- Response shape: `segments[]` with `text`, `domain`, `loe`, `boxRegion`, `boxAction`, `boxValue`
- Visible text model: segments themselves are the visible response
- Structural payload: direct sentence-by-sentence structure hints
- Clause proposal behavior: yes, via `loe`
- Box mutation helpers: yes, explicitly
- Compatibility with live Room pipeline: no

### Comparison summary

| Property | Live Room | Old `/api/seven` | Prototype |
|---|---|---|---|
| Provider | OpenAI | OpenAI | Anthropic |
| Structured shape | Room turn JSON | instrument-specific JSON | prototype segment JSON |
| Default visible text | `assistantText` | formatted answer | `segments[].text` |
| Clause carrier | `suggestedClause` | mapped from candidates | `loe` |
| Mutation helper fields | no | no | yes |
| Schema-compatible with current Room | yes | no | no |

### Findings

- **Prompt bleed at runtime:** not proven.
- **Schema drift conceptually:** yes, strongly.
- **Prototype assumptions still mimicked:** yes. The live Room still assumes that one AI turn can produce both conversational prose and sentence-level structural metadata, which is conceptually continuous with the prototype even though the concrete fields changed.

---

## 4. Compiler vs Spec Reality Check

The current `LoegosCLI` compiler is **closer to the Lœgos v0.5-draft than the prompt layer is**, but it is not yet the single authority described by the spec.

### What already aligns

- Grammar keywords match the draft surface in [`LoegosCLI/packages/compiler/src/constants.mjs:3`](../LoegosCLI/packages/compiler/src/constants.mjs#L3).
- Reserved heads/verbs largely match the draft in [`LoegosCLI/packages/compiler/src/constants.mjs:23`](../LoegosCLI/packages/compiler/src/constants.mjs#L23).
- Signature tables exist and are enforced in [`LoegosCLI/packages/compiler/src/constants.mjs:34`](../LoegosCLI/packages/compiler/src/constants.mjs#L34) and [`LoegosCLI/packages/compiler/src/kind.mjs:65`](../LoegosCLI/packages/compiler/src/kind.mjs#L65).
- Shape rules `SH001`–`SH008` and warnings `SW001`–`SW004` are materially present in [`LoegosCLI/packages/compiler/src/shape.mjs`](../LoegosCLI/packages/compiler/src/shape.mjs).
- Runtime states `open`, `awaiting`, `sealed`, `flagged`, `stopped`, `rerouted` exist in [`LoegosCLI/packages/runtime/src/index.mjs:1`](../LoegosCLI/packages/runtime/src/index.mjs#L1).

### High-impact divergences from the v0.5-draft

#### 1. Extra legacy closure semantics still exist

- The compiler still supports `CLS attest` / `attested` in [`constants.mjs:31`](../LoegosCLI/packages/compiler/src/constants.mjs#L31), [`constants.mjs:173`](../LoegosCLI/packages/compiler/src/constants.mjs#L173), and [`runtime/src/index.mjs:6`](../LoegosCLI/packages/runtime/src/index.mjs#L6).
- The pasted v0.5-draft does **not** include `attest`.

This is direct evidence of legacy semantics surviving past the newer spec.

#### 2. `XFM use` is still heuristic, not lawful enough

- In the kind pass, `XFM use` infers imported kind by checking whether the ref name contains `"receipt"` in [`kind.mjs:200`](../LoegosCLI/packages/compiler/src/kind.mjs#L200).

That is not compatible with the spec’s stated goal that kind execution should follow signatures, not ad hoc inference. This is one of the clearest examples where the compiler is still inventing semantics heuristically.

#### 3. Artifact contract is too thin for compiler-first authority

The current compile result in [`compile.mjs`](../LoegosCLI/packages/compiler/src/compile.mjs) emits:
- AST
- symbol table
- assembly graph
- diagnostics
- runtime/closure summary

It does **not** emit the richer compiler-owned contract described in section 11 of the spec:
- explicit box identity
- current aim
- witness set with source and identity
- moves/tests/returns as first-class structured outputs
- closure decision as a canonical object

Instead, the Room reconstructs those views in helper code:
- evidence in [`src/lib/room-canonical.js:230`](../src/lib/room-canonical.js#L230)
- story in [`src/lib/room-canonical.js:257`](../src/lib/room-canonical.js#L257)
- moves in [`src/lib/room-canonical.js:269`](../src/lib/room-canonical.js#L269)
- returns in [`src/lib/room-canonical.js:310`](../src/lib/room-canonical.js#L310)
- final Room mirror in [`src/lib/room-canonical.js:483`](../src/lib/room-canonical.js#L483)

This means the compiler is **validated truth**, but not yet **presentation-complete truth**.

#### 4. Room-specific semantics are still partly layered above the compiler

Examples:
- strict ping enforcement is duplicated in Room code with `RM001` in [`src/lib/room-canonical.js:194`](../src/lib/room-canonical.js#L194)
- semantic audit for aspiration / conversational MOV/TST / screenshot contamination lives in [`src/lib/room-turn-policy.mjs:320`](../src/lib/room-turn-policy.mjs#L320)

These are useful protections, but they prove that the current Room still depends on a non-compiler semantic layer to stay sane.

### Overall judgment

The compiler is **real** and **useful**, but it is not yet strong enough for “the language does most of the heavy lifting.”

Right now the system is closer to:

```text
prompt + route policy + semantic audit + compiler + view-model helpers
```

than to:

```text
thin translation prompt + compiler/runtime + canonical artifact contract
```

---

## 5. Shape Library Position

### What it does today

- Shape Library has its own client at [`src/lib/shapelibrary-client.js:1`](../src/lib/shapelibrary-client.js#L1).
- It exposes separate routes like `/api/shapelibrary/analyze`, `/candidates`, `/promote`, `/history`, `/drift`.
- The Room turn path does not import `shapelibrary-client` and does not call any `/api/shapelibrary/*` route.
- The Room canonical path imports only `LoegosCLI` compiler/runtime/gate/view-model helpers in [`src/lib/room-canonical.js:1`](../src/lib/room-canonical.js#L1).

### What it does not do

- It does not participate in live Room turn classification.
- It does not influence Room gating.
- It does not mutate Room `.loe` source.
- It does not directly shape the Room mirror or field-state chip.

### Conclusion

**Shape Library is currently a parallel experimental system with downstream/advisory potential, not an integrated authority in the live Room path.**

It is not reasonable to treat it as already doing structural governance for `/workspace`.

---

## 6. Schema Enforcement Quality Across AI Surfaces

### Live Room route

The Room route uses:
- prompt-only JSON instructions
- plain Responses API call
- manual text extraction
- manual JSON recovery
- post-generation normalization and guardrails

Evidence:
- request body has no `text.format.json_schema` in [`src/app/api/workspace/room/turn/route.js:266`](../src/app/api/workspace/room/turn/route.js#L266)
- output is parsed manually in [`src/app/api/workspace/room/turn/route.js:307`](../src/app/api/workspace/room/turn/route.js#L307)

### Neighboring routes

`/api/workspace/seed` uses strict schema:
- [`src/app/api/workspace/seed/route.js:326`](../src/app/api/workspace/seed/route.js#L326)

`/api/workspace/operate` uses strict schema:
- [`src/app/api/workspace/operate/route.js:522`](../src/app/api/workspace/operate/route.js#L522)

### Finding

The Room route is structurally weaker than adjacent AI routes.

That matters because the Room is the most semantics-sensitive AI surface in the product, yet it currently relies the most on:
- prompt discipline
- manual parsing
- local repair logic

This directly increases:
- response drift
- schema ambiguity
- pressure to over-specify prompts

---

## 7. Evidence Traces

The following traces are non-mutating code-path traces based on the current classifier and route policy.

### Trace A — Aspiration

Input: `I want to build Loegos`

- Classifier style: `aspiration`
- Classifier mode: `conversation`
- Evidence: [`src/lib/room-turn-policy.mjs:243`](../src/lib/room-turn-policy.mjs#L243) and local trace output
- Expected prompt posture: brief conversational narrowing, no clauses
- Expected structured output: `assistantText` only, `segments: []`, `gatePreview: null`
- Compiler/gate role: none on the happy path because no canonical proposal should be emitted
- Meaning source: mostly prompt-authored

### Trace B — General question

Input: `I want to understand what a monolith is`

- Classifier style: `general_question`
- Classifier mode: `conversation`
- Expected prompt posture: one short answer, then ask why it matters now
- Expected structured output: conversation-only
- Compiler/gate role: none unless the model wrongly emits clauses and guardrails must strip them
- Meaning source: mostly prompt-authored

### Trace C — Emotional/scoping turn

Input: `I'm scared to leave my job`

- Classifier style: `emotional_scope`
- Classifier mode: `conversation`
- Expected prompt posture: acknowledge, then narrow toward the actual decision
- Expected structured output: conversation-only
- Compiler/gate role: none
- Meaning source: prompt-authored

### Trace D — Concrete fact turn

Input: `The offer is $145k base, remote, 40-person Series B`

- Classifier style: `observation`
- Classifier mode: `proposal`
- Expected prompt posture: user-facing response plus optional proposal metadata
- Expected structured output: `assistantText` + possible `segments[]`
- Compiler/gate role: meaningful, if clauses are proposed
- Meaning source: mixed; prompt authors initial framing, compiler/gate constrain the clause layer

### Trace E — Low-signal turn

Input: `blorp maybe idk`

- Classifier style: `low_signal`
- Classifier mode: `conversation`
- Expected structured output: no clauses
- Compiler/gate role: none
- Meaning source: prompt-authored fallback conversation

### Trace F — Proposal/apply timing

Current code path:

1. user sends a message from [`RoomWorkspace.jsx:1452`](../src/components/room/RoomWorkspace.jsx#L1452)
2. `/api/workspace/room/turn` classifies mode in [`turn/route.js:214`](../src/app/api/workspace/room/turn/route.js#L214)
3. model returns candidate turn payload
4. route normalizes and guards output in [`turn/route.js:221`](../src/app/api/workspace/room/turn/route.js#L221)
5. if proposal exists, route runs gate in [`src/lib/room-canonical.js:152`](../src/lib/room-canonical.js#L152)
6. turn route persists conversation payload only
7. canonical `.loe` source is unchanged until apply
8. `/api/workspace/room/apply` re-loads the stored `room_payload`, re-runs the gate, and only then writes `gate.nextSource` in [`apply/route.js:352`](../src/app/api/workspace/room/apply/route.js#L352)

**Finding:** canonical mutation timing is correct. The main issue is not silent mutation. The main issue is what the system proposes and how much meaning it invents before the compiler takes over.

---

## 8. Conclusions

### Ranked root-cause list

#### 1. Split authority

The product still carries multiple Seven contracts and multiple structural vocabularies:
- live Room turn
- old instrument/document Seven
- prototype Anthropic schema
- `LoegosCLI` compiler/runtime/gate

This is the dominant problem.

#### 2. Schema drift and weak Room output enforcement

The Room route is the least schema-enforced AI surface in the workspace stack, despite being the most semantically sensitive. That forces prompt engineering and repair logic to carry too much load.

#### 3. Incomplete compiler authority

The compiler validates a lot, but it does not yet emit a rich enough canonical artifact to let prompts become thin and let helper code shrink away.

#### 4. Prompt overreach

Because the Room route sits above incomplete compiler authority and weak output enforcement, the prompt is forced to do too much:
- aim-seeking
- scoping
- witness/story distinction
- move/test suggestion
- receipt prompting
- sentence segmentation

This makes prompt behavior brittle.

#### 5. Shape Library misperception

Shape Library is not causing the live Room’s current behavior, because it is not in the authority path. The confusion comes from conceptual overlap and product ambition, not from live runtime integration.

---

## 9. Fix Directions (Diagnostic Only)

These are direction statements only, not implementation steps.

### A. Consolidate authority

Choose one Seven contract for the Room and quarantine the others as legacy/prototype. The Room should not be conceptually co-designed by three different response models.

### B. Strengthen Room output enforcement

Bring the Room route up to the same structured-output discipline as other AI routes so prompts stop compensating for weak schema guarantees.

### C. Move more meaning into compiler/runtime artifacts

The compiler should own more of what the Room currently reconstructs in helper code:
- box identity
- current aim
- witness inventory with source/identity
- move/test/return summaries
- closure decision and state

### D. Clarify Shape Library boundary

Either integrate it deliberately later or keep stating clearly that it is downstream/advisory only. It should not occupy a blurry “maybe governing” mental slot.

### E. Reduce prompt responsibility after authority cleanup

Only after the above: shrink Seven’s job toward:
- scoping conversation
- thin translation into candidate clauses
- minimal proof prompting

The language should then be doing most of the heavy lifting.

---

## 10. Final Judgment

The live Room is not failing because one prompt is slightly off.

It is failing because the system is in an intermediate state where:
- the Room architecture is newer than the legacy assistant systems,
- the compiler is real but not yet fully presentation-authoritative,
- the prototype’s conceptual model still haunts the product,
- and the Room route is still structurally too soft for the amount of meaning it is asked to carry.

That is why the behavior keeps changing without becoming stable.

The core diagnosis is:

**the product still has too many semantic authors.**

Until that number drops, prompt tuning alone will keep improving symptoms without resolving the disease.
