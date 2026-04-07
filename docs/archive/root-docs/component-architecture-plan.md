# Loegos Component Architecture Plan

**Status:** Canonical component architecture plan  
**Scope:** Extraction path from current runtime shell to product-aligned surfaces

---

## Summary

The current runtime shell is capable but still too centralized.

Current extracted components:

- `BoxesIndex.jsx`
- `ProjectHome.jsx`
- `BoxManagementDialog.jsx`
- `BoxPhaseBar.jsx`
- `SourceRail.jsx`
- `ThinkSurface.jsx`
- `CreateSurface.jsx`
- `OperateSurface.jsx`
- `ReceiptSurface.jsx`
- `AiUtilityRail.jsx`
- `StagingPanel.jsx`

Current bottleneck:

- `WorkspaceShell.jsx` at roughly `7500` lines remains the orchestrator for almost every surface and state transition

The goal of this plan is to keep extracting the current shell into product-aligned surfaces without changing the underlying Box model or near-term routes.

## Current Runtime Shape

### Entry layer

- `BoxesIndex`
- `ProjectHome`
- `BoxManagementDialog`

### In-box layer

- `ThinkSurface`
- `CreateSurface`
- `OperateSurface`
- `ReceiptSurface`

### Shared support

- `SourceRail`
- `AiUtilityRail`
- `StagingPanel`
- `BoxPhaseBar`

## View-Model Layers

These should sit between persistence and UI.

- `BoxViewModel`
- `ThinkViewModel`
- `CreateViewModel`
- `OperateViewModel`
- `SourceSummaryViewModel`
- `ReceiptSummaryViewModel`

## Data Ownership

### Persisted Box state

Owns:

- box identity
- source membership
- current Assembly document key
- receipt drafts / summaries
- source metadata and provenance

### Entry / Box home state

Owns:

- current Box summary
- next move
- resume target
- Box-management selection state

### Source / Think state

Owns:

- active document
- loaded document content
- selection state
- playback position
- document-scoped Seven thread

### Create state

Owns:

- staging clipboard
- accepted Seven output pending assembly
- Assembly composition actions
- edit mode state

### Operate state

Owns:

- Operate pending state
- Operate result
- Operate audit handoff
- receipt drafting from Operate

### Receipt state

Owns:

- latest proof summary
- local vs remote draft state
- GetReceipts connection summary
- evidence trail

### Pure UI state

Owns:

- sheet / modal visibility
- temporary disclosure state
- desktop/mobile presentation state

## Extraction Order

### Phase 1 — Entry split

Already landed in the live runtime:

- separate `BoxesIndex` from `ProjectHome`
- make `Boxes` and `Box home` distinct concerns
- make Box management first-class

### Phase 2 — Strengthen Think ownership

- move more source-reader orchestration, listening, and Seven lifecycle behind a stronger `ThinkViewModel`
- reduce shell ownership of document loading and document-scoped AI state

### Phase 3 — Strengthen Create ownership

- move more staging, clipboard, assembly, and edit orchestration behind `CreateViewModel`
- make Create the real owner of assembly construction behavior

### Phase 4 — Strengthen Operate ownership

- move Operate trigger, result handling, and audit handoff behind a thicker `OperateViewModel`
- keep receipt drafting from Operate inside stable view-model boundaries

### Phase 5 — Strengthen Receipt ownership

- pull proof summary state and receipt-entry actions fully into `ReceiptSurface`
- reduce shell knowledge of receipt presentation

## Boundaries To Enforce

### Seven boundary

Seven remains document-scoped. It should not directly own box-wide state.

### Operate boundary

Operate remains box-scoped. It should not mutate conversation state directly except through explicit audit handoff.

### Receipt boundary

Receipt drafting should accept stable inputs and not depend on incidental UI state.

### Source boundary

Source provenance and modality must not live only inside UI components. They belong in shared view-model or domain helpers.

## Current Reality Notes

Current supporting modules already hint at the right shape:

- `box-view-models.js` acts like an early Box / phase adapter layer
- `project-model.js` acts like an early Box adapter
- `operate.js` acts like an early Operate domain helper
- `workspace-receipts.js` acts like an early receipt builder layer

These should be expanded into clearer view-model and domain boundaries rather than bypassed.

## Acceptance Criteria

This architecture plan is successful when:

1. No single component owns the whole product loop.
2. `Boxes`, `Box home`, `Think`, `Create`, `Operate`, and `Receipts` each have one clear owner.
3. Persisted Box state, source state, receipt state, and pure UI state are distinguishable.
4. Multimodal source work can be added without making `WorkspaceShell.jsx` even bigger.
