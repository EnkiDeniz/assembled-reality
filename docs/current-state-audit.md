# Loegos Current State Audit

**Status:** Canonical repo-grounded audit  
**Date:** April 2026  
**Purpose:** Compare the live product, current docs, and north-star Loegos model so implementation work can start from reality instead of assumption.

---

## Summary

The current product has the right core primitives and now exposes them more clearly than before:

- dedicated `Boxes` index
- separate `Box home`
- source reading and listening
- document-scoped Seven
- staging and Assembly
- box-level Operate
- proof-first Receipts
- first-class Box management

The main gaps are no longer basic naming or missing surfaces. They are:

1. shell complexity
2. incomplete runtime QA, especially on mobile
3. provenance and trust being stronger in the substrate than in the visible UI
4. multimodal and multi-human futures being documented ahead of the runtime

## Current State Matrix

| Surface / concept | Built now | Documented now | North-star desired | Gap | Recommended action |
|---|---|---|---|---|---|
| Boxes index | Users can open the current box, open any other box, create a new box, and open Box management from a dedicated surface. | Current docs now describe `Boxes` as a real first-run index outside the main loop. | Boxes should remain the stable entry point and later support richer summaries and source-entry shortcuts. | Core shape is now right; the remaining work is richer summaries, not basic structure. | Keep the index stable and expand only after deeper source/provenance work is ready. |
| Box home | Box home now acts as a resume-and-orient surface with next move, current position, proof state, and source inventory. | Docs now describe Box home as a separate orient/resume surface. | It should remain the clearest answer to `what is in this box?` and `what should I do next?` | Major clarity gap is closed; remaining work is refinement, not redesign. | Keep Box home focused on resume, proof, and source state. |
| Box management | Create, rename, and safe delete are live in a dedicated in-product management dialog. | Docs now reflect first-class Box management and safe move-to-default delete behavior. | Box management should continue feeling intentional without becoming a separate admin product. | Current runtime and docs now align. | Preserve current behavior and only deepen naming/autosuggestion later. |
| Source reading / listening | Source rail, block reading, listening, selection, and playback are live. | Listening remains central in the docs. | `Think` should continue to feel like the reading/orientation phase. | Strong primitive; main remaining issue is shell ownership. | Keep the reader strong and continue extracting Think behavior from the monolith. |
| Seven | Real document-scoped thread, replies rendered in rail/sheet, staging handoff exists, Operate audit handoff exists. | Docs correctly describe Seven as conversation plus audit. | Seven should help think and audit without collapsing into Operate. | Runtime behavior is aligned; only fine-grain handoff clarity can improve. | Preserve the document-scoped model and keep audit context explicit. |
| Staging / Create | Clipboard/staging exists and is usable for source blocks and Seven output. Create phase owns assembly and edit. | Docs now describe `Create` as staging plus Assembly, not just a utility zone. | Create should continue feeling like active construction rather than generic manipulation. | Current state is coherent. | Continue extraction and UI refinement rather than conceptual change. |
| Assembly | Assembly documents exist, can be created from staging, and are tracked per Box. | Docs treat Assembly as the active built artifact. | Assembly should remain the center of construction. | Runtime matches docs well. | Preserve the current model. |
| Operate | Box-level read route, result surface, Seven audit handoff, and receipt drafting are live. | Docs describe Operate as diagnosis + draft and box-scoped. | Operate should become the stable culmination of the loop without becoming chat. | Current product is aligned enough for `1.0`; deeper analysis remains future work. | Keep trust support limited to `L1–L3` and grow only when the engine earns it. |
| Receipts | Local-first drafts work, GetReceipts sync is optional, proof-first surface is live in the workspace, and connection is reachable from the receipt moment. | Docs now describe receipts as proof-first, not log-first. | Receipts should continue to feel like proof without competing with Assembly. | Core gap is closed. | Preserve current proof-first order and improve lineage visibility later. |
| Source intake | Live product supports PDF, DOCX, Markdown/TXT, paste, link import, and Speak note. Beta/future image/folder/audio paths still exist in code. | Docs accurately describe the supported `1.0` promise. | Full multimodal intake should eventually treat text, voice, images, and human-state signals as first-class. | Runtime truth and north-star ambition are still far apart. | Keep the public `1.0` promise tight while evolving the source substrate behind it. |
| Visual sources | Image flows exist in code and metadata helpers, but still sit outside the public promise. | Docs correctly keep visual sources as future-facing or beta-quality. | Visual-primary images should become true source-class citizens with signal-aware handling. | Productization is still pending. | Keep image work future-scoped until the full vertical slice lands. |
| Human-state sources | Not yet a visible source class in the runtime. | Canonical docs define bounded emotion/human-state sources. | Human-state should be allowed as attributed, low-trust source material. | Still a doctrine/runtime gap. | Keep documented but clearly future-scoped. |
| Multi-human input | Not a shipped collaboration feature; runtime is still solo-user in practice. | Docs describe multi-human attribution as future-facing architecture. | Boxes should preserve authorship across humans from the start when that work lands. | Still future-scoped. | Keep collaboration out of the live `1.0` product surface. |
| Think / Create / Operate framing | The shell now visibly uses Think, Create, Operate, and Receipts inside an opened box. | The framing is documented across the canonical docs. | Workflow framing should remain legible without turning into rigid wizard navigation. | Live product and docs are now aligned. | Preserve the current balance: workflow framing, not hardcoded doctrine navigation. |
| Analysis model | Docs say `△ □ œ × 1–7` is analysis, not navigation. Operate exposes only a modest live subset today. | This rule is consistent across current specs. | Deep analysis should appear only when earned by box contents. | No contradiction; this is a sequencing choice. | Keep advanced analysis gated to future Operate work. |

## Shell Reality

The current shell is functionally capable, but structurally expensive to evolve.

Current component reality:

- `WorkspaceShell.jsx` is still the monolith at roughly `7500` lines
- `BoxesIndex.jsx`, `ProjectHome.jsx`, `BoxManagementDialog.jsx`, `SourceRail.jsx`, `AiUtilityRail.jsx`, `StagingPanel.jsx`, `ReceiptSurface.jsx`, and `OperateSurface.jsx` are extracted
- `box-view-models.js`, `project-model.js`, `operate.js`, and `workspace-receipts.js` already act like early view-model and engine helpers

This means the product has already begun to separate concerns, but the main shell is still the primary bottleneck for:

- IA changes
- source/provenance visibility
- multimodal source support
- deeper mobile refinement
- cleaner phase ownership

## What Is Actually Shippable Today

The live product can credibly ship as:

- invite-only
- desktop-first
- single-user
- Box-based
- source-to-assembly
- Operate-enabled
- local-first proof with optional GetReceipts sync
- in-product Box management

It cannot yet honestly ship as:

- fully multimodal in the public promise
- multi-human in the product surface
- emotion-aware in a first-class way
- fully aligned to the deepest Loegos doctrine at runtime

## Current Truth

The current product is strongest when described this way:

Open Boxes. Choose a Box. Orient from Box home. Think through the sources. Create the Assembly. Run Operate. Preserve the proof.

The north-star Loegos system is broader than the current product, but it does not invalidate what is already built. It gives that runtime a clearer destination.
