# Chewie Calculations: Build Brief For The Championship Benchmark

Date: 2026-04-11  
Status: Build brief  
Purpose: turn the championship testing proposal into an executable engineering sequence

---

## 1. Why "Chewie calculations"

This brief uses the Star Wars hyperspace scene as a shorthand because it matches the product exactly:

- plain chat says "just jump"
- the operator knows a fast jump without a route is reckless
- the compiler does the silent calculations that decide whether the jump is survivable

So this brief is the calculation phase before we benchmark who "arrives alive."

---

## 2. What this brief is for

This document is the navigation math before the jump.

It is not another strategy memo.
It is the build brief for implementing the benchmark stack described in:

- [championship-working-echo-testing-proposal-2026-04-11.md](/Users/denizsengun/Projects/AR/docs/championship-working-echo-testing-proposal-2026-04-11.md)

The goal is to answer one product question honestly:

`Does the visible working echo help the next turn become better, while the truth-law substrate stays sound?`

---

## 3. The build order

Do this in order.
Do not skip ahead.

### Step 1: Freeze the surfaced object

Before benchmarking, decide exactly what the evaluator is allowed to see.

There are only two honest modes:

- `current_surface`
- `product_intent_surface`

For `current_surface`, bind to what the app really shows today.
For `product_intent_surface`, ship the Preview Echo Panel first, then benchmark that real surfaced object.

Do not benchmark an invented middle state.

### Step 2: Build the paired reveal harness

The same first-turn Loegos output must drive:

- `loegos_sighted`
- `loegos_blindfolded`

Only visibility changes.
Nothing else.

### Step 3: Define gold-labeled scenario packs

Each scenario pack must include:

- evidence bundle
- counterfeit explanation
- contradiction
- lawful second-turn behaviors
- disallowed second-turn behaviors
- justified move
- premature move
- return

Without this, second-turn scoring is not trustworthy.

### Step 4: Build deterministic second-turn scoring

This is the core of the working-echo benchmark.

The scorer must grade:

- did the second turn improve
- did it resist counterfeit
- did it notice contradiction
- did it avoid false-forward moves
- did it propose or enable a better next move

### Step 5: Build the report writer

Every serious run must write one self-contained Markdown dossier.

### Step 6: Run the first benchmark family

Run only the Working Echo Benchmark first.

Do not start with compounding or human usability claims.

### Step 7: Only then build the Echo Accuracy Benchmark

Once the working-echo effect is proven, move to the stronger return-backed benchmark.

---

## 4. The first engineering choice

My recommendation is:

start with `current_surface` first.

Reason:

- it is honest
- it binds to the shipped product
- it avoids proving gains on a synthetic board
- it is cheaper to implement
- it tells us whether the current UI already helps at all

Then:

1. run the current-surface benchmark
2. inspect the delta
3. if the surface is too weak, ship the Preview Echo Panel
4. rerun as `product_intent_surface`

That sequence prevents self-deception.

---

## 5. What the surfaced object is right now

Based on the current codebase, the user-visible surface today is roughly:

- `assistantText`
- preview banner
- inline preview chips / proposal segments
- preview status
- witness panel when opened
- mirror panel only when structure exists

This comes from:

- [RoomWorkspace.jsx](/Users/denizsengun/Projects/AR/src/components/room/RoomWorkspace.jsx:1192)
- [RoomWorkspace.jsx](/Users/denizsengun/Projects/AR/src/components/room/RoomWorkspace.jsx:1346)
- [RoomWorkspace.jsx](/Users/denizsengun/Projects/AR/src/components/room/RoomWorkspace.jsx:318)
- [room-canonical.js](/Users/denizsengun/Projects/AR/src/lib/room-canonical.js:459)

Important truth:

the system computes richer preview structure than the UI fully renders today.

So the benchmark must not hand the evaluator hidden preview sections unless those sections are actually surfaced in the chosen mode.

---

## 6. Contracts to freeze

We need five contracts.

### 5.1 Surface contract

This is what the evaluator can see.

```ts
type SurfacedRoomState = {
  mode: "current_surface" | "product_intent_surface";
  assistantAnswer: {
    text: string;
    previewStatus: "none" | "active" | "blocked" | "superseded" | "applied";
  };
  previewSurface: null | {
    visible: true;
    bannerSummary?: string;
    previewStatusLabel?: string;
    visibleSegments?: Array<{
      text: string;
      mirrorRegion: "aim" | "evidence" | "story" | "moves" | "returns";
      suggestedClauseVisible: boolean;
    }>;
  };
  witnessSurface: null | {
    visible: true;
    title: string;
    excerptBlocks: Array<{ kind: string; text: string }>;
  };
  mirrorSurface: null | {
    visible: true;
    aim?: string;
    evidence?: Array<{ title: string; detail?: string }>;
    story?: Array<{ text: string; detail?: string }>;
    moves?: Array<{ text: string; detail?: string; status?: string }>;
    returns?: Array<{ label?: string; actual?: string; result?: string }>;
  };
  fieldStateLabel?: string;
};
```

Rule:

- if it is not visible in the product mode, it is not in this object

### 5.2 Paired-first-turn contract

This is the fairness contract.

```ts
type PairedFirstTurn = {
  scenarioId: string;
  pairId: string;
  roomTurnRecord: {
    assistantText: string;
    rawTurnMode: string;
    openaiCalls: Array<{
      requestId: string;
      model: string;
      latencyMs: number;
      inputTokens?: number;
      outputTokens?: number;
    }>;
  };
  surfacedSighted: SurfacedRoomState;
  surfacedBlindfolded: SurfacedRoomState;
};
```

Rule:

- same Room turn
- same model call(s)
- same scenario
- only visibility differs between the two variants

### 5.3 Scenario pack contract

```ts
type WorkingEchoScenario = {
  id: string;
  title: string;
  family: "incident" | "human_decision" | "operational_debugging";
  initialUserTurn: string;
  evidenceBundle: Array<{
    id: string;
    title: string;
    body: string;
  }>;
  counterfeitClaims: string[];
  contradictions: string[];
  justifiedMoves: string[];
  prematureMoves: string[];
  returns: Array<{
    id: string;
    title: string;
    body: string;
    effect: "sharpens" | "contradicts" | "reroutes";
  }>;
  secondTurnGold: {
    shouldNotice: string[];
    shouldCarryForwardEvidenceIds: string[];
    shouldResist: string[];
    allowedMoveFamilies: string[];
    disallowedMoveFamilies: string[];
    lawfulClarifications: string[];
  };
};
```

### 5.4 Scoring contract

```ts
type SecondTurnScore = {
  specificityGain: number;
  evidenceAlignment: number;
  contradictionAwareness: number;
  counterfeitResistance: number;
  falseForwardAvoidance: number;
  moveReadiness: number;
  total: number;
  flags: {
    noticedContradiction: boolean;
    repeatedCounterfeit: boolean;
    attemptedPrematureMove: boolean;
    referencedRequiredEvidenceIds: string[];
  };
};
```

### 5.5 Report contract

```ts
type BenchmarkReport = {
  benchmarkId: string;
  runAt: string;
  mode: "current_surface" | "product_intent_surface";
  prerequisites: Array<{ suite: string; status: "pass" | "fail"; reportPath?: string }>;
  scenarios: WorkingEchoScenario[];
  runRecords: Array<{
    arm: "plain_chat" | "structured_chat" | "loegos_blindfolded" | "loegos_sighted" | "schema_board";
    scenarioId: string;
    pairId?: string;
    surfacedState: SurfacedRoomState;
    secondTurnInputSeenByEvaluator: string;
    secondTurnOutput: string;
    secondTurnScore: SecondTurnScore;
    performance: {
      wallClockMs: number;
      inputTokens?: number;
      outputTokens?: number;
      costEstimateUsd?: number | null;
    };
  }>;
  aggregates: Record<string, unknown>;
};
```

---

## 7. Harness architecture

Extend the existing benchmark infrastructure.
Do not build a second disconnected testing world.

### Reuse

- `tests/helpers/run-phase1-room-benchmark.mjs`
- `tests/helpers/openai-telemetry.mjs`
- Room route/service harnesses already in the repo

### Add

#### A. Surface extractor

Responsibility:

- take a real Room turn result
- derive the exact `SurfacedRoomState` for the chosen mode

For `current_surface`, this should read from the same view model and visible UI semantics the user sees today.

#### B. Paired reveal runner

Responsibility:

- run one Loegos turn
- freeze the result
- emit two evaluator inputs:
  - sighted
  - blindfolded

#### C. Scenario pack loader

Responsibility:

- load scenario fixtures
- validate gold labels
- reject incomplete packs before a run starts

#### D. Second-turn scorer

Responsibility:

- score second-turn behavior deterministically against gold labels

#### E. Schema-board generator

Responsibility:

- create the generic board control surface
- make it visible and structured
- keep it free of Loegos-specific law or hidden internals

#### F. Markdown dossier writer

Responsibility:

- write the canonical report
- include surfaced objects exactly as shown to evaluators

---

## 8. How each arm should work

### Arm A: `plain_chat`

Input:

- initial user turn
- evidence bundle

Evaluator sees:

- assistant answer only

### Arm B: `structured_chat`

Input:

- same scenario
- same model family
- structured prompt

Evaluator sees:

- assistant answer only

### Arm C: `loegos_blindfolded`

Input:

- real Room path

Evaluator sees:

- the exact first-turn assistant answer from Loegos
- none of the visible side surface

### Arm D: `loegos_sighted`

Input:

- same exact first-turn Loegos result as Arm C

Evaluator sees:

- the exact same assistant answer
- the exact surfaced object for the chosen mode

### Arm E: `schema_board`

Input:

- same scenario
- same model family if model-assisted

Evaluator sees:

- assistant answer
- generic structured board

Important:

- no Loegos-specific hidden state
- no proposal/apply/runtime law under the hood

---

## 9. Scoring rules

Second-turn scoring must be deterministic first.
Supplemental LLM judging can exist only as explanation, not as the win condition.

### Deterministic checks

- did the second turn mention at least one required contradiction
- did it resist the planted counterfeit
- did it carry forward required evidence
- did it avoid a disallowed premature move
- did it move toward a justified move family
- did it improve precision relative to the first turn

### Supplemental scoring

Allowed:

- blind auditor summary
- qualitative explanation of why one second turn was better

Not allowed:

- headline verdict decided only by LLM taste

---

## 10. Report format

One primary Markdown file per benchmark run.

Recommended path:

- `test-results/room-benchmarks/working-echo-master-report.md`

Required sections:

- executive verdict
- benchmark mode
- repo metadata
- prerequisite suite status
- exact surfaced-object contract used
- arm definitions
- scenario packs and gold labels
- paired-first-turn records
- evaluator-visible inputs
- second-turn outputs
- deterministic scores
- efficiency table
- blind-auditor appendix
- failures / retries / exclusions

The report must embed machine-readable JSON for:

- surfaced object
- scenario pack
- paired first turn
- second-turn score
- aggregate tables

---

## 11. Recommended file plan

This is the smallest clean slice I would build.

### New files

- `tests/fixtures/room-benchmarks/working-echo/*.mjs`
- `tests/helpers/extract-surfaced-room-state.mjs`
- `tests/helpers/run-working-echo-benchmark.mjs`
- `tests/helpers/score-working-echo-second-turn.mjs`
- `tests/helpers/build-schema-board-surface.mjs`
- `scripts/run-working-echo-benchmark.mjs`
- `tests/working-echo-benchmark.test.mjs`

### Maybe later

- `src/components/room/PreviewEchoPanel.jsx`

Only if we move to `product_intent_surface`.

---

## 12. Acceptance gates

Do not call the benchmark valid unless all are true:

1. prerequisite suites are green
2. surfaced mode is declared
3. paired reveal is used for sighted vs blindfolded
4. scenario pack has gold labels
5. schema-board control is present
6. deterministic second-turn scores are populated
7. report is generated successfully

If any of those fail, the run is informative but not championship-valid.

---

## 13. Suggested first milestone

### Milestone 1: Honest current-surface benchmark

Ship:

- surface extractor for current UI
- paired reveal runner
- 2 gold-labeled scenarios
- deterministic second-turn scorer
- report writer

Run:

- `plain_chat`
- `structured_chat`
- `loegos_blindfolded`
- `loegos_sighted`
- `schema_board`

This gives us the first honest answer to:

`Does the current visible surface help at all?`

---

## 14. Suggested second milestone

### Milestone 2: Preview Echo Panel benchmark

Only if Milestone 1 shows the current surface is too weak or partial.

Ship:

- real Preview Echo Panel
- surfaced-object contract for that panel
- rerun the same benchmark in `product_intent_surface`

This isolates whether the missing gain is a product design problem rather than a core-system problem.

---

## 15. What not to do

Do not:

- rerun Seven separately for sighted and blindfolded comparisons
- leak hidden segments to the evaluator in current-surface mode
- benchmark an imagined board that users do not see
- leave the schema-board control out
- let LLM judging decide the headline verdict
- hardcode stale suite counts into the brief or final report

---

## 16. Final engineering verdict

The machine is ready for benchmark implementation, but not for reckless jumping.

The correct jump sequence is:

1. freeze the surface
2. pair the reveal
3. label the scenarios
4. score the second turn
5. write the dossier
6. run the current-surface benchmark
7. only then decide whether the Preview Echo Panel must ship before the next jump

That is the calculation Chewie has to finish before we hit lightspeed.
