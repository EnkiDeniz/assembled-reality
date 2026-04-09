# IDE Pivot Reset Foundation (Stage 0)

Date: 2026-04-09  
Owner: Next implementation agent  
Status: Ready for incoming IDE specifications

## 1) Why this document exists

This is the reset command document for the next build phase.

It bridges:

- the current running system in this repo
- the reset constraints in `docs/reset-brief-next-agent.md`
- the strategic pivot canon in `version 1/`

Its job is to prevent re-discovery and keep the reset safe while we pivot toward an IDE-like experience.

---

## 2) Current system in one page

The repo currently runs as two connected systems:

1. Next.js App Router product runtime in `src/`
2. Shape Library standalone engine in `shapelibrary/` (proxied by app API routes)

The live spine is still:

`source -> witness/document -> seed/assembly -> operate -> receipt`

Two workspace shells currently coexist:

- `src/components/WorkspaceShell.jsx` (large legacy/control shell)
- `src/components/reality-assembly/RealityAssemblyShell.jsx` (newer preview shell mounted at `/workspace/v1`)

Both are fed by:

- `src/lib/workspace-page-data.js`

This means the data substrate is shared while shell identity is still split.

---

## 3) Absolute protected substrate (do not break)

From the reset brief, the following are protected and must remain compatible:

1. Shape Library integration and routes
2. Auth/session/login boundaries
3. DB/runtime persistence contracts
4. Disclaimer acceptance/gating
5. Source import and intake paths
6. Audio/listening pipeline

Implementation rule:

- Pivot the product shell aggressively if needed
- Keep protected request/response contracts stable
- Use adapters around protected libs, not rewrites of protected systems

---

## 4) Repo reality map (what exists now)

## 4.1 Frontend routes

- Primary product: `/workspace`
- Preview alternative: `/workspace/v1`
- Shape Library surfaces: `/shapelibrary`, `/shapelibrary/history`, `/shapelibrary/drift`
- Redirect legacy surfaces: `/read`, `/read/[documentKey]`, `/library`
- Account/compliance/public surfaces: `/account`, `/disclaimer`, `/terms`, `/privacy`, `/trust`, `/about`, `/intro`, `/self-assembly`

## 4.2 API domains

- Auth: `src/app/api/auth/**`
- Workspace object lifecycle: `src/app/api/workspace/**`
- Source import intake: `src/app/api/documents/route.js`, plus workspace import routes
- Reader/listening/disclaimer/evidence: `src/app/api/reader/**`
- Seven chat/audio: `src/app/api/seven/**`
- Shape Library proxy bridge: `src/app/api/shapelibrary/**`

## 4.3 High-coupling implementation hubs

- `src/components/WorkspaceShell.jsx` (very large orchestrator)
- `src/lib/workspace-page-data.js` (entry routing/session/load policy)
- `src/lib/workspace-documents.js` (document persistence and conflict semantics)
- `src/lib/document-blocks.js` (block identity/normalization/markdown rebuild)
- `src/components/workspace/WorkspaceDocumentWorkbench.jsx` (block interaction + overlay rendering)
- `src/components/reality-assembly/RealityAssemblyShell.jsx` (new shell direction)

---

## 5) What the pivot already says (version 1 alignment)

The `version 1/` canon is consistent on these points:

- Product center is not "many screens"; it is a bounded loop
- Mobile and desktop have different dominant jobs
- Witness and compiled structure must remain distinct
- Compile boundary must be explicit and inspectable
- Operate is a bounded read, not generic chat
- Receipt is runtime proof, not decorative export
- Existing substrate should be reused, not discarded

The current codebase already contains most substrate needed for this pivot.
The main remaining problem is shell architecture and interaction model clarity.

---

## 6) Reset diagnosis (what must change first)

1. Shell identity is split and conceptually noisy (`/workspace` vs `/workspace/v1`)
2. Main workspace shell has excessive coupling and mode sprawl
3. Product objects exist in code but are not consistently first-class in UI
4. IDE-like interaction is partial (workbench exists; full navigation/state model does not)
5. Testing currently validates many invariants but not yet a single clean IDE loop

---

## 7) IDE pivot framing for next stages

Treat the next product as a domain IDE around explicit objects, not view-first screens.

Primary object ladder (already compatible with repo substrate):

`Box -> Witness -> Block -> Marked Block -> Compiled Structure -> Move/Test -> Receipt`

Primary IDE posture:

- left: object tree / project state
- center: work surface (witness, compare, structure editing)
- right: diagnostics/evidence/assistant/receipt context
- bottom or persistent rail: listening/playback + state cues

Key boundary laws to keep explicit:

1. Witness edit does not silently mutate compiled structure
2. Compile/recompile is an explicit commitment action
3. Operate findings stay inspectable and override-aware
4. Receipt path remains local-first and non-blocking on remote sync

---

## 8) Stage plan (pre-spec baseline)

## Stage 0 - lock foundation (this document)

- complete repo/state inventory
- freeze protected boundaries
- define IDE pivot execution law

## Stage 1 - choose canonical shell entry

- choose one primary route/shell for the pivot path
- keep the other path as temporary fallback if needed
- avoid dual-product behavior drift

## Stage 2 - extract shell composition seams

- split orchestration from UI rendering in `WorkspaceShell`
- isolate data controllers, playback controller, and view-state controller
- prepare explicit IDE layout zones

## Stage 3 - object-first navigation model

- formalize "open object" semantics (box/witness/structure/receipt)
- unify query param and state transitions
- guarantee resumability by object identity, not fragile tab state

## Stage 4 - IDE workspace surfaces

- stable tree + editor + diagnostics rails
- witness mode, compare mode, structure mode as object states
- preserve existing workbench and listening behavior while simplifying entry flows

## Stage 5 - bounded runtime loop in-IDE

- move/test/receipt cycle becomes first-class in shell
- maintain protected receipt and override contracts
- ensure return-to-state loop is visible and honest

---

## 9) Non-negotiable implementation guardrails

1. No destructive changes in protected paths
2. No schema-destructive migrations during reset
3. Keep auth and disclaimer gating intact
4. Preserve source import and listening capabilities across refactors
5. Keep Shape Library routes and bridge operational
6. Verify by smoke checks + lint + key route checks before major handoff

---

## 10) What to read first before coding each stage

1. `docs/reset-brief-next-agent.md`
2. `README.md`
3. `version 1/README.md`
4. `version 1/loegos-v1-product-redefinition.md`
5. `version 1/loegos-v1-kickoff-build-plan.md`
6. `docs/current-runtime-state-2026-04-09.md`
7. `src/lib/workspace-page-data.js`
8. `src/components/WorkspaceShell.jsx`
9. `src/components/reality-assembly/RealityAssemblyShell.jsx`
10. `src/components/workspace/WorkspaceDocumentWorkbench.jsx`

---

## 11) Ready state for incoming IDE specifications

This repo is ready for IDE specification intake with the following confidence:

- substrate readiness: high
- shell clarity readiness: medium
- pivot risk: manageable with strict boundary discipline

Next input expected from product/spec side:

1. canonical IDE information architecture
2. required interaction flows (mobile vs desktop)
3. exact first milestone acceptance criteria
4. whether `/workspace` or `/workspace/v1` becomes canonical base
5. any new object model fields needed at UI layer (without breaking protected persistence)

Once specs are provided, this document should be extended into a concrete implementation backlog with file-by-file change sets.
