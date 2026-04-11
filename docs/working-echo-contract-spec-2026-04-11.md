# Working Echo Contract Spec

Date: April 11, 2026  
Status: Proposed implementation spec  
Purpose: Define `view.workingEcho` as a first-class product object so the server, UI, and benchmarks all point at the same surfaced thing.

---

## 1. Why This Spec Exists

The current system already has:

- conversation
- preview
- apply
- canon
- return
- contradiction law

What it does **not** yet have is one explicit surfaced object for:

> what this conversation currently seems to be assembling

Right now that provisional read is scattered across:

- Seven's answer
- inline preview segments
- preview banner
- canonical mirror

That makes the product harder to steer and the benchmark harder to interpret.

So this spec defines a new object:

## `view.workingEcho`

This should become the shared contract for:

- server view construction
- Room UI rendering
- surfaced-state extraction in benchmarks

---

## 2. What Working Echo Is

`workingEcho` is:

- session-scoped
- visible
- provisional
- revisable
- non-canonical

It is the current joint read of:

- what aim seems to be forming
- what evidence is carrying weight
- what tension remains open
- what would decide it
- what move might be justified next
- how uncertain the situation still is

It is the thing the user should be able to answer against.

---

## 3. What Working Echo Is Not

### 3.1 Not the same as preview

Preview is narrower.

Preview is about:

- structured proposal emergence
- gate-aware proposal status
- possible apply path

Working echo is broader.

It can exist:

- before any lawful proposal is ready
- when no apply action is earned
- when the main value is simply making the current read visible

So:

- preview may feed the working echo
- working echo must not be reduced to preview

### 3.2 Not the same as mirror

The mirror remains canonical-only.

It should reflect:

- what the box has lawfully accepted
- what runtime/return has really changed

Working echo should never pretend to be mirror truth.

### 3.3 Not hidden implementation metadata

Working echo should not expose:

- hidden raw segments the UI does not truly render
- internal gate diagnostics unless explicitly surfaced
- hidden canon/runtime internals
- suggested clauses unless the surfaced design intentionally shows them

If the user cannot see it, the benchmark cannot see it.

### 3.4 Not a raw courthouse object

GetReceipts is the remote proof layer, not the local thinking engine.

So `workingEcho` should not expose:

- raw GetReceipts objects
- full courthouse payloads
- remote proof internals as if they were the echo itself

If receipt state is surfaced, it should be surfaced as a small bounded provenance summary.

### 3.5 Not another authority mouth

Shape Library should not speak directly as if it were canon or a second Room speaker.

If Shape Library informs the echo, it should do so through a bounded advisory seam that strengthens the working echo without competing with:

- Seven's answer
- preview/apply law
- canonical mirror truth

---

## 4. Product Rules

The following rules should govern `workingEcho`.

### Rule 1

`workingEcho` is always non-canonical.

### Rule 2

`workingEcho` is always session-scoped.

Different conversations around the same box may have different working echoes.

### Rule 3

`workingEcho` may exist without an active preview.

### Rule 4

`workingEcho` must visibly distinguish:

- what is being carried
- what is unresolved
- what would decide it
- what is merely candidate movement

### Rule 5

`workingEcho` must be recomputed after each turn and after meaningful state changes such as:

- apply
- receipt completion
- contradiction arrival
- session switch

### Rule 6

The benchmark-visible surfaced object must be derived from the same contract the UI renders.

No richer hidden benchmark board is allowed.

---

## 5. Product Priorities

When evolving this contract, optimize in this order:

1. `steering feel`
   - does the object help place the next move better?
2. `road contact`
   - does it clearly show what supports, what weakens, what is missing, and what would decide it?
3. `reality loop`
   - does return visibly change the surfaced read?
4. `proof travel`
   - can the read carry bounded proof status cleanly across time and handoff?
5. `braking`
   - does contradiction and premature-closure resistance remain obvious?

Do not optimize this object primarily for:

- prettiest summary
- lowest token count
- quietest interface
- softest friction

Those are guardrails, not the core job.

---

## 6. Proposed Contract

```ts
type WorkingEchoStatus =
  | "forming"
  | "grounded"
  | "contested"
  | "move_ready"
  | "awaiting_return";

type WorkingEcho = {
  visible: true;
  id: string;
  sessionId: string;
  turnId: string;
  updatedAt: string;
  status: WorkingEchoStatus;

  aim: null | {
    text: string;
    source: "conversation" | "witness" | "mixed";
    sourceRefs: string[];
  };

  evidenceCarried: Array<{
    id: string;
    title: string;
    detail?: string;
    sourceKind: "recent_source" | "focused_witness" | "conversation_observation" | "return";
    weight: "primary" | "secondary";
    sourceRefs: string[];
  }>;

  openTension: Array<{
    id: string;
    text: string;
    kind: "contradiction" | "uncertainty" | "counterfeit_risk" | "missing_witness";
    sourceRefs: string[];
  }>;

  whatWouldDecideIt: {
    text: string;
    kind:
      | "timeline"
      | "first_divergence"
      | "rollout_scope"
      | "cohort_split"
      | "compare"
      | "log_check"
      | "capture_missing_witness";
    sourceRefs: string[];
  };

  candidateMove: null | {
    text: string;
    kind: "clarify" | "inspect" | "compare" | "test" | "capture";
    justified: boolean;
    readiness: "not_ready" | "clarify_first" | "ready";
    sourceRefs: string[];
  };

  uncertainty: {
    label: "low_signal" | "mixed_signal" | "grounded_but_open" | "awaiting_return";
    detail?: string;
  };

  // Future bounded extension. Not required for current Test Drive II surface.
  provenance: null | {
    receiptStatus: "none" | "draft" | "sealed" | "verified";
    draftId?: string;
    sealHash?: string;
    verifyUrl?: string;
    evidenceCount?: number;
    lastReceiptedReturn?: string;
  };

  // Future bounded extension. Not required for current Test Drive II surface.
  advisory: null | {
    source: "shape_library";
    prior?: string;
    nextLawfulMove?: string;
    receiptCondition?: string;
    disconfirmation?: string;
  };

  previewLink: null | {
    assistantMessageId: string;
    previewStatus: "active" | "blocked" | "superseded" | "applied";
  };
};
```

And at the Room view level:

```ts
type RoomWorkspaceView = {
  // existing fields
  activePreview?: unknown;
  roomIdentity?: unknown;
  focusedWitness?: unknown;
  adjacent?: unknown;

  // new field
  workingEcho: WorkingEcho | null;
};
```

---

## 7. Contract Semantics

### 6.1 `status`

This is the top-level state of the provisional read.

- `forming`
  - signal exists but is still loose
- `grounded`
  - a stable read is forming from multiple signals
- `contested`
  - meaningful contradiction or counterfeit pressure is present
- `move_ready`
  - a next move looks justified
- `awaiting_return`
  - a move has been accepted and the box is waiting on reality

Implementation rule:

- `status` should be computed, not hand-authored in the UI
- `uncertainty.label` remains the more local descriptive state
- `status` is the higher-level rollup used for panel state and benchmark interpretation

Suggested derivation order:

1. if the field/runtime state is awaiting return, `status = "awaiting_return"`
2. else if there is a justified candidate move with readiness `ready` and `whatWouldDecideIt` is present, `status = "move_ready"`
3. else if there is meaningful contradiction or counterfeit pressure, `status = "contested"`
4. else if there is a stable provisional aim plus at least one carried evidence item, `status = "grounded"`
5. else `status = "forming"`

### 6.2 `aim`

This is not canonical aim.

It is:

- the best current statement of what the conversation appears to be orienting toward
- always backed by visible `sourceRefs`

### 6.3 `evidenceCarried`

This is the key part the current surface is missing.

It should make it obvious what the system is actually carrying forward, not just what Seven mentioned in prose.

Every evidence item should carry visible `sourceRefs`.

### 6.4 `openTension`

This is where contradiction, uncertainty, and counterfeit pressure stay visible.

If this disappears too early, the product will drift back into chat optimism.

Every tension item should carry `sourceRefs` so it does not become a floating smart-summary claim.

### 6.5 `whatWouldDecideIt`

This field is mandatory when `workingEcho` exists.

It is the current best deciding split, deciding question, or deciding retrieval step.

This is one of the most important steering rows in the surface because it keeps the panel from becoming a clever summary with no operational bite.

It should also carry `sourceRefs`, so the deciding split remains visibly grounded in surfaced signal rather than hidden inference.

### 6.6 `candidateMove`

This is not canon.
It is not an applied plan.

It is the current best next movement signal as seen from the working echo.

It should carry `sourceRefs` too, so the candidate move remains visibly grounded in the same surfaced signal.

### 6.7 `previewLink`

This is how working echo stays connected to preview without collapsing into it.

If a lawful preview exists, the working echo may point to it.
But the working echo must still stand as its own surfaced object.

### 6.8 `provenance`

This is the receipt-backed summary lane.

It exists so the echo can say, in bounded product language:

- this part of the read is still local-only
- this part has a local draft
- this part is sealed
- this part is externally verifiable

This field should summarize proof state without turning GetReceipts into the intelligence layer.

### 6.9 `advisory`

This is the bounded advisory seam.

If present, it should strengthen the working echo with a compact shape-oriented assist such as:

- one prior
- one next lawful move
- one receipt condition
- one disconfirmation line

It should not compete with canon, preview, or the working echo's own visible evidence model.

---

## 8. Server Responsibilities

The server should build `workingEcho` in the Room view layer, next to:

- `roomIdentity`
- `focusedWitness`
- `adjacent`
- `authorityContext`

Recommended location:

- [room-server.js](/Users/denizsengun/Projects/AR/src/lib/room-server.js)

Recommended builder:

- `buildWorkingEcho({ canonicalView, messages, recentSources, focusedWitness, activeSession, activePreview })`

Server rules:

1. derive from current visible Room state and session context
2. reuse the hidden good signals already present in Room `segments` rather than inventing a parallel intelligence layer
3. never mutate canon while building
4. fail closed to `null` if not enough signal exists
5. do not include hidden internals the UI will not render
6. if receipt state is included, summarize it as bounded provenance rather than raw courthouse objects
7. if advisory shape help is included, keep it bounded and clearly subordinate to surfaced evidence and deciding split

### Empty-state threshold

"Enough signal" should be deterministic:

- if the field/runtime state is awaiting return and there is at least one carried evidence item, `workingEcho` may exist
- otherwise `workingEcho` should exist only if there is at least one `evidenceCarried` item and at least one of:
  - a non-empty provisional `aim`
  - at least one `openTension` item
  - a non-empty `whatWouldDecideIt`
- or if there is at least one `openTension` item and a non-empty `whatWouldDecideIt`

If none of those conditions are met, `workingEcho` should be `null`.

This keeps the panel from flickering into view as thin decorative junk.

---

## 9. UI Responsibilities

The UI should render `workingEcho` as its own persistent panel.

Recommended component:

- `WorkingEchoPanel`

Recommended file:

- [RoomWorkspace.jsx](/Users/denizsengun/Projects/AR/src/components/room/RoomWorkspace.jsx)

Design rules:

1. it must live outside the transcript
2. it must be visibly non-canonical
3. it must coexist with the canonical mirror without impersonating it
4. it must be useful even when no preview/apply action is present
5. it must stay visible enough that the next reply can be shaped against it
6. it must foreground:
   - what seems real
   - what conflicts
   - what would decide it

Desktop default:

- persistent side or top panel in the main Room canvas

Mobile default:

- collapsible but easy-to-reopen panel, not hidden behind deep inspector friction

---

## 10. Relationship To Existing Surfaces

### Keep

- `ActivePreviewBanner`
- inline proposal segments
- canonical mirror
- focused witness panel

### Change

These should become supporting surfaces, not the only place provisional structure lives.

The working echo panel should become the main provisional read.

### Do not do

- do not let the mirror display non-canonical state
- do not let the preview banner try to do all the work
- do not keep the working echo buried inside one message card
- do not let GetReceipts become another conversational speaker
- do not let Shape Library become another authority path inside the Room

---

## 11. Benchmark Binding

The benchmark should consume exactly what the UI renders from `workingEcho`.

That means:

### Current rule

`extract-surfaced-room-state.mjs` must derive the surfaced object from the same fields the panel uses.

### Future rule

Once `WorkingEchoPanel` exists, the benchmark-visible surfaced object should map directly from `view.workingEcho`.

No synthetic richer board is allowed for the Loegos sighted arm.

---

## 12. Acceptance Criteria For The Feature

The revised working echo build is successful when:

1. a user can see a non-canonical external read outside the transcript
2. that read includes carried evidence, open tension, and a deciding split, not just a summary sentence
3. the panel exists even when no applyable preview is ready
4. it remains visibly distinct from canonical mirror truth
5. Test Drive II sighted vs blindfolded can consume this exact surfaced object

---

## 13. Testing Sequence

Yes: we should run Test III after we build this, but not immediately.

The right order is:

### Step 1

Build `view.workingEcho`

### Step 2

Build `WorkingEchoPanel`

### Step 3

Bind surfaced benchmark extraction to that real panel contract

### Step 4

Rerun **Test Drive II**

Why first:

Test Drive II is the direct product test for:

> does the visible surface improve the next reply?

That is the immediate thing the new panel should change.

### Step 5

Only after that, run **Test Drive III**

Why second:

Test Drive III is the longer loop:

- next reply
- valid move signal
- return
- re-echo
- handoff

If the new surface does not improve Test Drive II first, Test Drive III will just produce a longer failure.

---

## 14. Immediate Success Condition

After the revised build, the first thing we want to see is:

- `loegos_sighted > loegos_blindfolded`

in the current-surface benchmark.

After that, the stronger success condition is:

- `loegos_sighted` also beats or meaningfully narrows the gap with `schema_board`

That would tell us the product surface is finally beginning to earn its own category.

---

## 15. Short Version

`workingEcho` should become a first-class object, not a rename of preview.

It should be:

- visible
- session-scoped
- non-canonical
- evidence-carrying
- tension-preserving
- useful before apply

And yes:

we should run Test III after building it,
but we should rerun Test II first, because Test II is the cleanest proof that the revised surface is actually helping the next turn.
