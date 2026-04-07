# Lœgos IDE Object-Model Diagnosis

**Date:** April 6, 2026  
**Status:** Canonical diagnosis memo for the current desktop workspace  
**Reference:** [loegos-ide-object-model-v0.1.md](/Users/denizsengun/Projects/AR/docs/loegos-ide-object-model-v0.1.md)

## Summary

The current desktop workspace claims the category of an IDE, but it does not yet obey the object hierarchy settled in the IDE object model.

The object model says:

- `Box` = repository
- `Artifact` = file
- `Source` = reference file
- `Block` = line of authored code
- `Seven` = debugger
- `Operate + preflight` = compiler / test pass
- `Receipt` = build artifact
- shapes = types, not folders

The current desktop workspace violates that model in one main way:

**the UI still foregrounds framework and workspace state before it foregrounds the open `Artifact`.**

That makes the desktop feel like an IDE-shaped dashboard instead of an editor-first runtime.

## Evidence Base

This diagnosis uses three kinds of evidence:

- current code structure in [WorkspaceShell.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceShell.jsx), [WorkspaceControlSurface.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceControlSurface.jsx), [SourceRail.jsx](/Users/denizsengun/Projects/AR/src/components/SourceRail.jsx), [RootEditor.jsx](/Users/denizsengun/Projects/AR/src/components/RootEditor.jsx), and [WorkspaceDiagnosticsRail.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceDiagnosticsRail.jsx)
- current repo screenshots:
  - [box-ide-workspace-desktop.png](/Users/denizsengun/Projects/AR/output/playwright/box-ide-workspace-desktop.png)
  - [box-native-loop-desktop.png](/Users/denizsengun/Projects/AR/output/playwright/native-assembly-loop/box-native-loop-desktop.png)
  - [loegos-workspace-box-home-desktop.png](/Users/denizsengun/Projects/AR/output/playwright/loegos-workspace-box-home-desktop.png)
- the side-by-side review against Cursor supplied during planning

## Direct Answers To The Required Questions

### Does the left rail behave like a project tree?

**Partially.**

What aligns:

- [SourceRail.jsx](/Users/denizsengun/Projects/AR/src/components/SourceRail.jsx) already separates `Sources` and `Seeds`
- it exposes the active Box title
- it includes a compact runtime summary with convergence, trust, branch-like unfinished state, receipt count, and settlement stage
- source rows already read more like reference entries than like editable cards

What violates the model:

- it still includes a prominent `Box home` action at the top, which competes with the project-tree role
- it does not yet visibly elevate the current `Artifact` as the main file-equivalent object
- `Receipts` are accessed through actions and summaries rather than as a clearly named output section in the tree

Diagnosis:

The left rail is the closest part of the workspace to the correct object model, but it is not yet a fully explicit project tree.

### Does the center pane behave like a file editor for the `Artifact`?

**No. This is the main failure.**

What aligns:

- the center does render the active editable document and block stack through `documentWorkbench`
- blocks are editable and carry block-level runtime annotations
- block actions already exist for draft, accept inference, recast, stage, and open witness

What violates the model:

- [WorkspaceShell.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceShell.jsx) wraps the default editor in `desktopIdeCenterContent`, which begins with an explanatory shell:
  - eyebrow: `Editor`
  - title: `Write the current block stack.`
  - explanatory copy about diagnostics and seal readiness
  - metadata chips above the artifact
- `documentWorkbench` itself begins with a large document header, metadata cluster, status chips, asset panel, tool buttons, and optional inline instrument before the first block
- block rows carry too much always-visible chrome around each editable block
- the workspace still treats editor explanation as primary above-the-fold content
- the current `RootEditor` remains a separate sheet/panel flow rather than the natural default way to edit the file-equivalent object

Diagnosis:

The center pane is still a structured block inspector containing an editor, not an editor containing structure.

### Does the right rail behave like compiler/debugger output?

**Yes, mostly.**

What aligns:

- [WorkspaceDiagnosticsRail.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceDiagnosticsRail.jsx) already follows a debugger-like order:
  - seal preflight
  - contradictions
  - parse / shadow-type findings
  - Operate
  - trust / depth / settlement
  - build output
  - Seven input
- Operate is framed as a structural read, not a generic chat answer
- receipt output is explicitly described as compiled output
- provenance-aware diagnostics already exist

What violates the model:

- Seven input is still visually present inside the same continuous rail instead of feeling like a subordinate debugger assistant at the bottom of the compiler stack
- some copy still explains the system instead of simply surfacing state

Diagnosis:

The right rail is already directionally correct and should be refined, not reinvented.

### Are `Sources`, `Artifact`, `Receipts`, and `History` visually separated according to the object model?

**Only partially.**

What aligns:

- `Sources` are separated in the left rail
- `Receipts` have moved toward build output treatment in the diagnostics rail and receipt surfaces
- receipt text now says receipts do not collapse back into draft cards

What violates the model:

- the `Artifact` is not visually dominant enough to feel like the main file
- `Box home` and concept-first chrome still compete with the `Artifact`
- `Receipts` are still easier to understand once you already know the product than at first glance
- `History` is present in lane/log behavior, but not yet surfaced in a way that reads as the history equivalent of an IDE

Diagnosis:

The object classes exist, but the current hierarchy does not yet separate them with enough clarity.

### Are shapes being rendered as types, or incorrectly promoted into navigation/folder-like UI?

**They are still over-promoted.**

What aligns:

- formal-core runtime and diagnostics already treat shapes as types
- block actions and diagnostics increasingly use shape language as parse/inference state

What violates the model:

- [WorkspaceControlSurface.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceControlSurface.jsx) still gives shapes a major navigation role
- [BoxHomeScreen.jsx](/Users/denizsengun/Projects/AR/src/components/BoxHomeScreen.jsx) still presents shape navigation and verb toolbar as hero-level workspace structure
- the workspace still visually teaches `Aim / Reality / Weld / Seal` before it foregrounds the open `Artifact`

Diagnosis:

Shapes are still being rendered too much like navigation rooms and not enough like type annotations, diagnostics categories, and block-level grammar.

## Current Shell Audit

### Current desktop entry posture

The desktop shell now has an IDE branch, but the default experience is still polluted by earlier overview-first layers.

Key problem:

- even when `showDesktopIde` is true, the first visible center content is not “here is the file”; it is “here is the editor concept”

### `BoxHomeScreen`

Current role:

- branded overview surface with shape nav, verb toolbar, and explanatory copy

Object-model issue:

- once the user is inside a Box, this should not compete with the file-equivalent object

### `WorkspaceControlSurface`

Current role:

- compact top workspace chrome for Box identity, shape nav, root button, summary line, confirmation count, and Operate action

Object-model issue:

- too much of the workspace’s conceptual grammar still lives here as primary orientation
- shapes still behave too much like room navigation

### `SourceRail`

Current role:

- closest existing analog to a project tree

Object-model issue:

- needs clearer promotion of the active `Artifact`
- needs `Receipts` and runtime/build state to feel like tree-adjacent output, not just summary actions

### `RootEditor`

Current role:

- separate sheet/modal for root naming and refinement

Object-model issue:

- editing the root of the assembly is still treated as a special side flow rather than part of the main file-equivalent editing experience

### `WorkspaceDiagnosticsRail`

Current role:

- compiler/debugger rail

Object-model issue:

- good foundation; mainly needs tightening and less explanatory tone

### Current center-pane block rendering

Current role:

- document header + metadata + status + asset context + tools + block stack

Object-model issue:

- the `Artifact` is buried under editor explanation, document chrome, persistent meta, and always-visible actions

## Current Alignment Vs Violation

### Already aligned with the object model

- `SourceRail` is structurally closer to a project tree than to a dashboard list
- `WorkspaceDiagnosticsRail` is structurally closer to a compiler/debugger than to a chat sidecar
- `Operate` is already framed like a structural read
- `Receipt` language has moved toward build output
- formal runtime, preflight, provenance, and receipt audit layers already support the right IDE metaphor underneath

### Violating the object model

- the center pane does not make the `Artifact` unmistakably dominant
- `Box home` still competes with the file-equivalent object
- shapes are still over-promoted into workspace navigation
- metadata and explanation appear before authorship
- `RootEditor` is still a separate flow instead of part of the main authored file experience
- `Receipts` and `History` are not yet placed as clearly as build output and log/history in the default desktop reading

## Main Structural Mistake

**The current desktop workspace renders the ontology of the system before it renders the open `Artifact`, so the user meets framework first and file second.**

## Final Diagnosis

The current workspace does not need a new philosophy, a new visual system, or a new runtime model.

It needs one structural inversion:

- keep the project tree direction
- keep the diagnostics rail direction
- stop giving overview and shape grammar hero-level prominence
- make the `Artifact` the unquestioned center of the desktop workspace

That is the main diagnosis through the lens of the settled IDE object model.
