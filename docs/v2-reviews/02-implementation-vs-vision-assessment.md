# Review 2: Implementation vs. Vision Assessment

**Status:** Historical review from the pre-Box product phase.

This document reflects the product during the transition out of the older AR/project model. References to `Project`, `Current assembly`, or earlier naming remain here as historical analysis rather than current product language.

**Date:** April 3, 2026
**Reviewer:** Claude (AI consultant)
**Branch:** `codex/mobile-reader-overhaul`
**Commit range:** `6f591eb` (Phase 0) through `f0dcbc9` (current HEAD)
**Scope:** Audit of all changes since Phase 0, assessment against the AR Foundation document

---

## Context

This review was conducted after significant development work following Phase 0. The AR Foundation document had been written, establishing the product's grounding in Assembly Theory. The goal was to assess what had been built, how it mapped to the vision, and what to do next.

The diff since Phase 0 was +4,672 / -368 lines across 24 files.

---

## What Was Built

### 1. The Project Model (Phase 1 delivered)

**Data layer:**
- `ReaderProject` table with `projectKey`, `title`, `subtitle`, `currentAssemblyDocumentKey`
- `ReaderProjectDocument` join table with `role` (SOURCE/ASSEMBLY) and `position`
- Two Prisma migrations applied
- `reader-projects.js` (439 lines): CRUD, automatic migration of existing documents into default projects, project-document membership management
- `project-model.js` (178 lines): client-side project hydration, document grouping by role, smart document resolution per mode

**UX:**
- Workspace URL accepts `?project=` and `?mode=` parameters
- Launchpad shows project hierarchy: project title, source count, assembly count, receipt count
- Projects list with "New" button for creating projects
- Per-project receipt listing via `listReadingReceiptDraftsForProjectForUser()`

**Assessment:** This is real infrastructure. The hierarchy from the Foundation (Project > Sources > Assembly > Receipts > Reflection) is implemented in the data model and visible in the UI. Not a veneer.

### 2. Two Workspace Modes: Listen and Assemble

**Listen mode** (`ListenSurface`, `ListenPicker`):
- Immersive view: document title, block index numbers, block text, player bar. No shelf, no toolbar, no edit controls.
- Browse panel showing Sources, Current Assembly, Earlier Assemblies — organized by project hierarchy
- Source-first document resolution: `getProjectListenDocumentKey()` prefers the most recent user-uploaded source

**Assemble mode:**
- Full workspace: shelf, toolbar, DOC/LOG tabs, edit mode, AI bar, clipboard tray
- All existing V1 features preserved

**Mode switching:**
- Launchpad presents "Listen" and "Assemble" as primary action cards
- Listen mode has "Assemble" button to switch; shelf has mode awareness
- Mode persisted per project key via `lastModeByProjectKey` state

**Assessment:** Listen mode is the most important thing that shipped. It is the front door described in the Foundation — immersive, distraction-free, source-first. The user uploads a PDF, the workspace takes them to it, they press play. This is the Trojan Horse experience.

### 3. Paste-First Intake

- New `/api/workspace/paste` route with two modes: "paste as source" (creates document) and "paste to clipboard" (stages blocks)
- `ingestPastedDocument()` handles HTML-to-markdown conversion
- Launchpad has "Paste source" and "Clipboard" action cards
- `hiddenFromProjectHome` flag for clipboard-pasted documents (staging material, not visible sources)

**Assessment:** Smart addition that lowers friction. Maps to the assembly model: adding raw material vs staging intermediates.

### 4. Source Cleanup and Polish

- New `/api/workspace/polish` route for automated formatting cleanup
- `SourceCleanupTray` with find-and-replace and delete-matching-blocks
- Unescape markdown, clean formatting action buttons on source documents
- Block-level delete in edit mode for source documents
- `polishWorkspaceSourceDocument()` for automated fixes

**Assessment:** Practical hardening. PDFs import messy. Users need cleanup tools before they can meaningfully listen to and select from source material. Respects "simplify before extending" principle.

### 5. AI Scope Selection

- AI bar now has DOC / BLOCK / CLIP scope options
- User can choose what context the AI operates on

**Assessment:** Good refinement. Different AI operations need different context. Extracting from a full document vs operating on a specific block vs synthesizing clipboard contents are different tasks.

### 6. Receipt History Per Project

- `listReadingReceiptDraftsForProjectForUser()` queries receipts scoped to project's document keys
- Receipt count shown in launchpad

**Assessment:** Correct scoping. Receipts should be per-project, not per-session or per-document.

---

## Mapping to the AR Foundation

| Foundation concept | Status | Assessment |
|---|---|---|
| Blocks as basic parts | Built | Unchanged, solid |
| Clipboard as intermediate memory | Built | Enhanced with paste-to-clipboard |
| Assembly as constructed object | Built | Project tracks current assembly |
| Receipt as construction pathway | Partially built | Document-scoped, project-listed. No reflection layer. |
| Selection = human | Built | AI staged, explicit accept. Unchanged. |
| Plan-Live-Learn loop | Plan only | **Biggest gap.** Live and Learn have no surface. |
| The gap measurement | Not built | No plan-vs-outcome comparison |
| GetReceipts verification | Built | Local/remote draft distinction exists |
| The front door (listen first) | **Built** | Immersive listen mode, source-first. Strongest alignment. |
| Forcing function (blocks/listen/pick) | **Built** | Listen mode forces block-by-block engagement |
| Anti-chat thesis | Partial | No departure moment, no return prompt, no unsettled surfacing |
| AI reads receipts | Not built | AI reads doc/block/clipboard only |
| Echo Canon | Implicit | Product follows cycle but doesn't detect stall patterns |
| Settlement logic | Structural | Receipts as local drafts and remote seals exist. No invoice-receipt comparison. |
| Project hierarchy | **Built** | Project > Sources > Assembly > Receipts in data model and UI |
| Depth and growth | Not built | No cross-project pattern detection |
| Operator derivation | Not built | Correct by design — empty fields, data accumulating |

---

## What's Strong

1. **Listen mode is the front door.** Immersive, source-first, distraction-free. Exactly the experience the Foundation describes: upload, play, listen. The Trojan Horse works.

2. **The project model is real infrastructure.** Prisma tables, membership relations, role tracking, project-scoped queries. Phase 1 of the build plan actually delivered.

3. **The hierarchy is visible.** Launchpad shows project > sources > current assembly > receipts. The user can see the structure the Foundation describes.

4. **Source cleanup makes the tool trustworthy for real documents.** Find/replace, block delete, format polish. Practical hardening.

5. **Paste intake lowers friction.** Two paths (source vs clipboard) map directly to the assembly model.

---

## What's Missing

### Critical (blocks the full loop)

1. **The departure moment.** No way to mark an assembly as "taken into the world." No transition from Plan to Live.

2. **The return prompt.** No "How did it go?" when the user comes back to a project with an active assembly.

3. **Unsettled assembly awareness.** The launchpad shows "Current assembly" but doesn't surface age or missing receipts.

### Important (differentiates the product)

4. **Receipt-aware AI.** The AI operates on current context only. No construction history, no gap prediction, no pattern detection from previous receipts.

5. **Reflection as receipt.** No structured comparison between plan (assembly) and outcome (what happened).

### Future (builds on the loop)

6. **Cross-project patterns.** What the user is consistently right/wrong about.
7. **Operator derivation.** Ghost operators from receipt chains.
8. **Stall detection.** Echo Canon pattern reading from receipt sequences.

---

## Recommended Next Steps

In priority order, based on impact and effort:

### 1. The departure moment (small effort, high impact)

Add a "Take this live" action on assembly documents. When tapped:
- Mark the assembly as `status: "in-flight"` with a `liveAt` timestamp
- Show a brief confirmation: "Your assembly is ready. Go do the thing."
- Optionally generate a LIVE log entry

This creates the Plan > Live transition described in the Foundation.

### 2. The return prompt (small effort, very high impact)

When the user opens a project with an in-flight assembly, show a prompt:
- "You took [Assembly Title] into the world on [date]. How did it go?"
- Three options: "Still in progress" / "Done — went as planned" / "Done — things changed"
- Choosing "Done" options creates a REFLECTED log entry and optionally prompts for a brief note

This closes the loop. Even the simplest version creates the first real reflection receipt.

### 3. Unsettled assembly awareness (tiny effort, medium impact)

In the launchpad "Current assembly" section, add context:
- "Created 12 days ago · No receipt yet"
- Or "In flight since April 1"

Not guilt. A reading. The Foundation says: make the unsettled state visible.

### These three changes complete the Plan > Live > Learn cycle with minimal new infrastructure.

Everything after that — receipt-aware AI, operator derivation, cross-project patterns — builds on top of a working loop. The loop is the foundation. Build the loop first.

---

## Summary

The product is in a strong position. The front door is right (listen mode). The project model is real (data and UI). The source tools are practical (cleanup, paste). The gap is the same gap that has been identified in every review: the moment the user leaves, and the moment they come back. Three small features close it.
