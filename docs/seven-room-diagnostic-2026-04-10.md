# Seven Room Diagnostic

Date: April 10, 2026
Status: Completed diagnostic
Scope: `/workspace` Room turn/gate/render/apply pipeline

Raw live traces were captured locally in `/tmp/room-diagnostic-output.json` from the current prompt and gate. They are not committed. This report contains the durable findings, code paths, and fix map.

The live traces used a synthetic empty Room context:

- canonical source started from `GND box @room_diagnostic_box`
- no production box data was mutated
- post-apply behavior was inspected by evaluating `gate.nextSource` and gate/runtime summaries, not by writing into a live Room document

## Observed behavior

The Room is not leaking hidden chain-of-thought. The colored lines are currently **intentional, user-visible proposal segments**.

The actual problem is a stack of policy and presentation choices:

1. The prompt asks Seven for `assistantText` and `segments[]` in the same response.
2. The renderer shows `segments[]` by default inside the assistant bubble.
3. The prompt is too eager to turn weak or ambiguous user input into canonical-looking `GND witness`, `DIR aim`, and sometimes `MOV/TST`.
4. The fallback path is contaminated with screenshot-specific structure and can lawfully produce `awaiting`.

## End-to-end trace

### Pipeline

```text
LLM
  -> extractMessageText()
  -> parseJsonObject()
  -> normalizeRoomTurnResult()
  -> runRoomProposalGate()
  -> buildRoomPayloadCitations()
  -> appendConversationExchangeForUser(
       answer = assistantText,
       citations = room_payload
     )
  -> extractRoomPayloadFromCitations()
  -> ThreadMessage / ProposalSegments render
  -> /api/workspace/room/apply
  -> saveRoomAssemblySourceForUser()
```

Key code paths:

- Prompt + fallback: `src/app/api/workspace/room/turn/route.js`
- Normalizer + persisted payload: `src/lib/room.js`
- Gate + canonical artifact summary: `src/lib/room-canonical.js`
- Render path: `src/components/room/RoomWorkspace.jsx`
- Mutation path: `src/app/api/workspace/room/apply/route.js`

### Controlled traces

#### 1. Aspiration input

Input:

```text
I want to build Loegos
```

Observed live behavior:

- `assistantText` stays conversational.
- `segments[]` do not stay conversational.
- On one live pass, Seven produced:
  - `GND witness @user_goal_build_loegos from "user_stated" with v_turn_1`
  - `DIR aim "Clarify what 'build Loegos' means..."`
  - `INT story "..."`
  - `MOV move "...co-design an initial roadmap..." via manual`
  - `TST test "...confirm whether it matches intent..." via user`
- The gate rejected that specific pass because `TST` illegally carried `via user`.

What that means:

- Seven is eager to convert aspiration into witness.
- Seven sometimes escalates straight into `MOV/TST`.
- The gate can catch syntax/lawfulness problems, but not the deeper semantic mistake.

#### 2. Observational claim

Input:

```text
The lender said $780k.
```

Observed live behavior:

- Seven proposed:
  - `GND witness @lender_amount_quote from "user_stated" with v_turn_1`
  - `DIR aim "Clarify what the quoted $780,000 specifically represents..."`
- Gate result: accepted
- Gate diagnostics: `ground exists but no move forces contact`
- Canonical state if applied: still `open`/`fog`, not `awaiting`

What that means:

- User-stated reported facts are treated as witness immediately.
- The gate allows that, even though provenance is only `user_stated`.

#### 3. Clarification/scoping input

Input:

```text
I'm not sure what this is yet, I just know something is off.
```

Observed live behavior:

- Seven still proposed:
  - `DIR aim "...map what feels off..."`
  - `GND witness @ref from "user_stated" with v_turn_1`
  - `INT story "...pre-diagnostic phase..."`
- Gate result: accepted
- Gate diagnostics: `ground exists but no move forces contact`

What that means:

- There is no true scoping mode.
- Early ambiguity is still converted into canonical-looking aim/witness/story.

#### 4. Low-signal / gibberish input

Input:

```text
blorp maybe idk
```

Observed live behavior:

- Seven still proposed:
  - `GND witness @u1 from "user_stated" with v_turn_1`
  - `DIR aim "Invite the user to articulate..."`
  - `INT story "...testing the space / being playful / unsure..."`
- Gate result: accepted

What that means:

- Even weak nonsense input becomes witness + aim + story.
- The system currently has no threshold for “stay in plain conversation only.”

#### 5. Forced fallback

Input:

```text
I want to build Loegos
```

Fallback output:

- `DIR aim "I want to build Loegos"`
- `GND witness @user_turn_1 from "user_stated" with v_turn_1`
- `MOV move "Rerun one concrete example with the screenshot explicitly labeled static." via manual`
- `TST test "The output changes when the screenshot is labeled static."`
- `receiptKit.artifact.type = "paste"`

Gate result:

- accepted
- artifact summary becomes `awaiting`
- next action becomes `Capture one return with provenance to clear awaiting.`

What that means:

- Fallback is dangerous.
- It can produce a fully lawful but contextually bogus canonical ping.

## Prompt and response contract

### Exact Room system prompt

Source: `src/app/api/workspace/room/turn/route.js:86`

```text
You are Seven inside Loegos. You are responding inside the Room. Conversation comes first. Structure appears only as lawful clause proposals. Return strict JSON only. No markdown fences. No prose outside the JSON object. Use this exact top-level shape: {"assistantText":"...","segments":[{"text":"...","domain":"aim|witness|story|move|test|return|other","mirrorRegion":"aim|evidence|story|moves|returns","suggestedClause":"DIR aim \"...\"","intent":"declare|ground|interpret|move|test|observe|compare|capture|clarify"}],"receiptKit":null} assistantText must stay plain-language and calm. Seven proposes. It never mutates canonical state. Only propose lawful clauses from this set: DIR aim "<text>" GND witness @ref from "user_stated" with v_turn_<n> INT story "<text>" MOV move "<text>" via manual TST test "<text>" RTN observe|confirm|contradict "<text>" via user|third_party|lender_portal|service|system as text|score|bool|date|count Never propose MOV without also proposing TST in the same response unless both already exist in source. Keep witness separate from story. Clear firsthand user observations may become GND witness. Interpretation and hypotheses stay INT story. At most one Receipt Kit. Use it only when a concrete proof action is helpful.
```

### What the contract means today

- `assistantText` is the plain-language line meant for the user.
- `segments[]` are structured proposal previews.
- The prompt does **not** explicitly say that `segments[].text` is hidden or inspector-only.
- The prompt does **not** say desire/intention/hope must stay out of `GND witness`.
- The prompt does **not** say clarification inside the conversation is not a real-world `MOV/TST`.
- There is no scoping mode flag or first-turn suppression mode.

## Parser, persistence, and rendering

### Parser / normalizer

Source: `src/app/api/workspace/room/turn/route.js:375` and `src/lib/room.js:220`

- The API extracts plain response text with `extractMessageText()`.
- It parses JSON with `parseJsonObject()`.
- It normalizes with `normalizeRoomTurnResult()`.
- If parsing fails, or `assistantText` is empty, or `segments.length === 0`, the route falls back.

Important subtlety:

- `normalizeRoomTurnResult()` always creates a default `gatePreview` shell.
- The real gate result is only attached later in `finalizeTurn()`.

### Persistence

Source: `src/app/api/workspace/room/turn/route.js:265`

The turn is persisted as:

- `answer = turn.assistantText`
- `citations = buildRoomPayloadCitations(turn)`

This is crucial:

- the assistant’s plain chat line is stored in `answer`
- the visible proposal structure is stored separately in `room_payload` citations

The replay path is:

- `buildRoomPayloadCitations()` -> `room_payload`
- `extractRoomPayloadFromCitations()` -> reconstructed `roomPayload`

Source: `src/lib/room.js:365`

### Canonical mutation timing

The `.loe` Room document does **not** change during `/api/workspace/room/turn`.

- turn route persists chat + `room_payload` citations only
- canonical source changes only in `/api/workspace/room/apply`
- `apply_proposal_preview` re-runs the gate, then writes `gate.nextSource`
- the actual write happens in `saveRoomAssemblySourceForUser()`

Sources:

- `src/app/api/workspace/room/turn/route.js:265`
- `src/app/api/workspace/room/apply/route.js:276`
- `src/lib/room-documents.js:141`

### Renderer

Source: `src/components/room/RoomWorkspace.jsx:1027`

Current behavior is explicit:

- if assistant message has `segments[]`, `ThreadMessage` renders:
  - optional `messageLead` from `message.content`
  - `ProposalSegments`
  - `ProposalFooter`
- `Structure Waking` and `Preview Only` are hardcoded UI labels
- segment color is derived from each segment’s `domain`
- `Apply to Room` only appears for the active accepted proposal
- the latest accepted unapplied proposal is determined from `proposalWake`, which is derived from runtime events and thread messages

So the colored lines are not accidental spillover. They are the normal display path for `segments[]`.

## Gate semantics and truth boundaries

### What the gate does enforce

Confirmed in code and direct probes:

- `MOV` without `TST` is rejected
- hard compile/gate shape violations are rejected
- invalid clause syntax can be rejected

Evidence:

- `src/lib/room-canonical.js:151`
- direct probe: `DIR aim + MOV` without `TST` returns `ping_requires_test`

### What the gate does not enforce

Confirmed by live traces and direct probes:

- it does not reject desire/intention framed as `GND witness`
- it does not reject vague or low-signal `user_stated` witness
- it does not reject screenshot-specific bundles when screenshots are absent
- it does not know that “answer my question” is conversation, not a real-world ping
- it does not distinguish strong provenance from weak `user_stated`

### Policy gap matrix

| Problem | Prompt responsibility | Gate responsibility | Mode/UI responsibility |
| --- | --- | --- | --- |
| Desire becomes witness | Missing rule | Not checked | No scoping state |
| Clarification becomes MOV/TST | Missing rule | Not checked semantically | No scoping state |
| Gibberish becomes structure | Missing threshold | Not checked | No “conversation only” mode |
| Colored planning-like lines visible | Current contract allows it | N/A | Renderer shows segments by default |
| Screenshot fallback contamination | Hardcoded fallback | Not checked for context | N/A |

## Two Sevens boundary

### Room path

Room UI sends turns to:

- `fetch("/api/workspace/room/turn")`

Source: `src/components/room/RoomWorkspace.jsx:1458`

`/workspace` itself renders `RoomWorkspace` directly.

Source: `src/app/workspace/page.jsx:7`

### Old Seven path

The old document assistant lives at:

- `src/app/api/seven/route.js`

It has its own prompt builder, modes, and contract.

### Shared / non-shared

- prompts are not shared
- Room turn route has its own prompt
- old `/api/seven` does not directly render the Room
- the two systems share general app infrastructure, not a common visible-response contract

This means the current Room voice problem is not prompt bleed from `/api/seven`. It is in the Room route and Room renderer themselves.

## Appendix: UI-specific answers

- `SEVEN` / `YOU` labels are hardcoded in `ThreadMessage`
- timestamps are shown by default when `message.createdAt` exists
- `Listen` is not a voice pipeline here; it links to `view.deepLinks.reader`, and if absent it falls back to opening the attach/source surface
- the footnote `Plain language first. Structure wakes up only when it earns it.` is hardcoded

Relevant source:

- `src/components/room/RoomWorkspace.jsx:1048`
- `src/components/room/RoomWorkspace.jsx:1147`

## Root causes

1. **Generation policy error**
   - prompt permits over-grounding
   - prompt has no scoping mode
   - prompt does not distinguish clarifying dialogue from real-world ping

2. **Renderer exposure choice**
   - structured proposal segments are rendered as the default assistant message body

3. **Gate blind spots**
   - gate checks clause lawfulness, not epistemic strength
   - weak `user_stated` witness is treated as structurally acceptable

4. **Fallback contamination**
   - fallback contains screenshot-specific move/test language unrelated to current room context

## Fix map

1. **Immediate: replace fallback**
   - on LLM failure, return only calm plain conversation
   - no `segments[]`
   - no receipt kit
   - no canonicalizable structure

2. **Next: correct Room prompt policy**
   - desire/intention/hope -> not `GND witness`
   - clarification inside chat -> not `MOV/TST`
   - ambiguous first turns -> conversation or explicit `clarify` only

3. **Then: add scoping mode**
   - early turns stay non-canonical until concrete actionable signal exists

4. **Then: harden gate semantics**
   - reject weak/ambiguous witness proposals when they are clearly non-observational
   - reject `MOV/TST` that are only “answer my question”
   - reject context-free proposal references like screenshots when none exist in room context

5. **Finally: change default rendering**
   - do not render structured proposal lines as the default message body
   - keep them behind an inspect/reveal path or a lighter preview treatment

## Verification

Static verification run:

```text
node --test tests/room-first-workspace.test.mjs
```

Result: pass
