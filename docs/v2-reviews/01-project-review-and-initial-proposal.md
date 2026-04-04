# Review 1: Project Review and Initial Proposal

**Status:** Historical review from the pre-Box product phase.

This document captures an earlier review of the product before the Loegos branding and Box model migration. Terms like `Document Assembler`, `Assembled Reality`, and `project model` are preserved here as historical context.

**Date:** April 3, 2026
**Reviewer:** Claude (AI consultant)
**Branch:** `codex/mobile-reader-overhaul`
**Scope:** Full codebase review of V1 Document Assembler, assessment of purpose and UX, improvement proposals

---

## Context

This was the first review of the Assembled Reality project. The goal was to understand the codebase, assess the user experience, identify who the product is for, and propose improvements.

At this point in the project, the product was called "Document Assembler" and the workspace operated as a flat library of documents and assemblies without a project model.

---

## What the Review Found

### What Worked Well

1. **The block model is the right abstraction.** Decomposing documents into blocks with source tracking, author attribution, and operation type is architecturally correct for the assembly vision. Every block carries `sourceDocumentKey`, `sourcePosition`, `author`, and `operation`.

2. **The receipt system is genuinely original.** The receipt captures aim, tried, outcome, learned, and decision — a structured retrospective with evidence. `buildWorkspaceReceiptPayload()` and `buildWorkspaceBlockLineage()` create full provenance chains. Nothing in the consumer productivity space does this.

3. **Listening is a first-class interaction.** Block-scoped TTS with visual sync, multi-provider fallback (ElevenLabs > OpenAI > device), rate control, and auto-advance. The `playSequenceFromIndex()` function handles the full lifecycle with proper cleanup.

4. **AI as collaborator, not replacement.** AI generates staged blocks that the user must explicitly accept. The selection mechanism stays human. This preserves the integrity of the construction pathway.

5. **The visual design is cohesive.** Semantic color system: cyan = human active, amber = AI pending, green = accepted. IBM Plex Mono throughout. Dark terminal aesthetic that supports focused work.

### What Needed Work

1. **The intro explained the tool, not the outcome.** 7-step carousel taught mechanics (blocks, listening, picking) without showing a real payoff. Users learned vocabulary before experiencing value.

2. **The workspace assumed fluency.** 5-6 simultaneous UI regions (shelf, buffer, toolbar, clipboard tray, player bar, AI bar) with no progressive disclosure. Designed for the 10th session, not the 1st.

3. **"Live" and "Learn" had no surface.** The intro promised Plan > Live > Learn but only Plan was built. No way to take an assembly into the world and return with what happened.

4. **Assembly was concatenation, not composition.** Blocks placed end-to-end with no connective tissue.

5. **The clipboard was spatially awkward.** Bottom tray that appeared/disappeared, competing with content surface and player bar.

6. **No multi-document comparison.** Only one document visible at a time despite synthesis being the core use case.

### Proposals (Priority Order)

1. **Replace the intro with a guided first assembly** — hands-on, user does the loop in ~2 minutes
2. **Build the Learn surface** — structured reflection when returning to an assembly
3. **Make the clipboard a persistent side panel** — three-column layout on desktop
4. **Real-world templates** — trip planning, meeting prep, project brief, weekly review
5. **AI Stitch operation** — generate transitions between assembled blocks
6. **Surface the "/" shortcut** — keyboard hint discovery
7. **Contextual inline receipts** — block-level provenance on hover
8. **Compare view** — side-by-side documents

---

## Key Realization from This Review

The most important finding was that the product's deepest differentiators (provenance, receipts, intent-to-outcome gap) were cumulative, not immediate. The first-session experience needed to deliver value before the framework became relevant. This led directly to the "front door" strategy developed in later reviews.

---

## Outcome

This review informed the V2 direction document (`docs/AR Version 2.md`) and the build plan (`docs/AR Version 2 Build Plan.md`). Phase 0 was defined as a hardening pass to make the current product calmer and more trustworthy before adding the project model.
