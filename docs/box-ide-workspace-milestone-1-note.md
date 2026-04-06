# Box IDE Workspace Milestone 1

## What We Built

We turned the authenticated desktop workspace into the first real pass at **Box as an IDE**, not a dashboard.

The new shell now behaves like this:

- left rail = project tree for sources, seeds, runtime state, branch-like unfinished assembly, and receipts
- center = authored block editor
- right rail = diagnostics, compile state, seal preflight, trust/depth/settlement, and Seven input
- receipts = build output, not ordinary editable cards

This is not a backend/runtime rewrite. The route, auth, Operate API, and receipt/seal contracts stay intact. The change is primarily experiential: the product now reads more like authored work under compilation than a set of phase panels.

## The Product Boundary We Locked

This milestone also sharpened an important language boundary:

- **Seven infers**
- **humans interpret**
- **Seal commits**

That means:

- Seven can parse, classify, compare, diagnose, infer missing evidence, surface contradictions, and run preflight
- Seven does **not** interpret for the user
- the human remains the **interpreter of record**
- the human decides whether the weld is meaningful enough and whether the receipt should be sealed

This is now the correct mental model:

- `Lœgos` = the language
- `Box` = the runtime / workspace
- `Seven` = the inference + diagnostics agent
- `Seal` = the commit gate
- `Receipt` = the compiled artifact

## What Changed In The UI

### 1. Desktop opens into authorship

If a box already has live material, desktop resume/open now returns into the authored workspace instead of always bouncing through box home first.

Box home still exists as an orientation surface, but it is no longer the default desktop work posture.

### 2. The center is editor-first

The center pane now privileges the live seed/block stack as the authored object.

- blocks remain editable in a permissive hybrid way
- formal parsing is layered on top rather than forced as a rigid form
- inline annotations now show how a block currently reads in shape terms
- lightweight warnings appear near the block instead of being hidden in a separate panel

### 3. The right side is a diagnostics rail

The old sidecar/tab posture has been replaced, on desktop, with a diagnostics-first rail ordered by urgency:

1. seal preflight
2. blocking contradictions
3. shape / parse issues
4. convergence + Operate
5. trust / depth / settlement
6. build output
7. Seven inference input

This makes the right side behave more like a debugger/compiler rail than a conversation area.

### 4. Receipts are build output

Receipts are now treated more explicitly as compiled artifacts.

- they remain accessible from the workspace
- they no longer read like ordinary workbench cards
- the diagnostics rail points toward them as output, not just more content

### 5. The left rail now exposes runtime state

The project tree now includes a runtime summary showing:

- convergence
- trust floor
- branch-like unfinished assembly count
- receipt count
- settlement stage

This keeps runtime truth visible without turning the shell into KPI tiles.

## What We Reused Instead Of Rebuilding

We intentionally built this on top of the existing formal/runtime work instead of inventing a second system.

The shell now leans on:

- `buildFormalBoxState(...)`
- `buildFormalSealCheck(...)`
- existing Operate results
- existing receipt seal audit behavior

That means the new UI is not decorative theory. It is showing real runtime truth that the codebase already knows.

## What Is Still Milestone 1

This is a strong first pass, but it is not the whole IDE yet.

Still intentionally incomplete:

- mobile is still a Reality-first companion, not a full mobile IDE
- some internal symbols still say `interpret` even though the user-facing language now says `infer`
- the editor is still hybrid and permissive, not a fully formal structured editor
- branch/build concepts are still view-model/UI concepts, not persisted source-control objects
- the right rail still includes Seven input, but Seven is now clearly subordinate to diagnostics

## Why This Matters

This is the first version where the workspace starts to feel like:

- authored work is happening
- the system is checking that work
- Seven is helping debug that work
- a receipt can eventually be compiled from that work

That is the actual product category.

Not a dashboard.
Not a chat app.
Not a PM tool.

**An IDE for reality-facing coordination.**

## Recommended Next Moves

1. Tighten the editor engine:
   - better inline diagnostics
   - clearer block lineage/evidence linking
   - safer recast flow

2. Finish the Seven posture:
   - remove remaining interpret-language internally
   - keep inference/diagnostics primary everywhere

3. Improve mobile continuity:
   - stronger capture -> block append -> diagnostics handoff
   - clearer unresolved-issue and receipt access from phone

4. Strengthen build output:
   - make sealed receipts even more visibly separate from draft-state UI
   - add contradiction-after-seal flagging views

5. Continue reducing monolith pressure in `WorkspaceShell.jsx` by moving the IDE shell pieces into dedicated components once the behavior is proven.
