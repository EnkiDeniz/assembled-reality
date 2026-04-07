# Loegos User Story Audit

**Status:** Canonical story audit for live beta truth and north-star readiness  
**Scope:** Designed vs wired vs working coverage across the Box loop

---

## Summary

This audit answers one question for each important story:

**Is this story clearly designed, actually wired up, and behaving coherently in the live product?**

The audit is split into two tracks:

- `Track A` — live beta truth for the current desktop-first invite-only product
- `Track B` — north-star readiness for multimodal and multi-human Boxes

Runtime/manual verification is tracked separately in `docs/user-story-runtime-checklist.md`.

## Locked Vocabulary

### Story status

- `Designed and wired`
- `Designed but partial`
- `Wired but under-specified`
- `Specified only`
- `Broken`
- `Intentional future`

### Evidence result

- `confirmed`
- `partial`
- `missing`
- `contradictory`

### Severity

- `P0` breaks the core loop
- `P1` core loop works but confuses or misleads
- `P2` support-story or polish problem
- `P3` north-star or deferred architecture gap

## Track A — Live Beta Story Inventory

| ID | User type | Goal | Phase | Entry point | Expected outcome | Canonical design source | Runtime evidence | Status |
|---|---|---|---|---|---|---|---|---|
| `AUTH-01` | invited solo operator | sign in and land somewhere understandable | Auth / entry | `/` landing and auth UI | user authenticates and lands in the workspace without confusion | `README.md`, `docs/AR Version 1.0.md`, `docs/user-flows.md` | `src/app/page.jsx`, `src/components/IntroLanding.jsx`, `src/components/AuthTerminal.jsx` | `Designed and wired` |
| `BOX-01` | returning or first-time operator | open or create a Box from a clear index | Boxes | `Boxes` index | Box opens or new Box is created and opened | `README.md`, `docs/user-flows.md`, `docs/information-architecture.md` | `src/components/BoxesIndex.jsx`, `src/components/WorkspaceShell.jsx`, `src/app/api/workspace/project/route.js` | `Designed and wired` |
| `BOX-02` | operator inside the workspace | understand what is in the Box and what to do next | Box home | Box home | user sees next move, current position, proof state, and source inventory clearly | `README.md`, `docs/user-flows.md`, `docs/information-architecture.md` | `src/components/ProjectHome.jsx`, `src/lib/box-view-models.js`, `src/components/WorkspaceShell.jsx` | `Designed and wired` |
| `BOX-03` | operator maintaining containers | create, rename, and safely delete Boxes | Box management | Box management dialog | box actions feel intentional and deletion does not destroy work | `README.md`, `docs/user-flows.md` | `src/components/BoxManagementDialog.jsx`, `src/components/WorkspaceShell.jsx`, `src/lib/reader-projects.js`, `src/app/api/workspace/project/route.js` | `Designed and wired` |
| `THINK-01` | operator gathering material | add a source to the active Box | Think | box home actions, source intake, paste, link, Speak note | supported source becomes a readable source in the Box | `README.md`, `docs/user-flows.md`, `docs/source-model-spec.md` | `src/components/WorkspaceShell.jsx`, `src/app/api/documents/route.js`, `src/app/api/workspace/paste/route.js`, `src/app/api/workspace/link/route.js`, `src/lib/source-intake.js` | `Designed and wired` |
| `THINK-02` | operator trying to understand material | open a source, read it, and listen to it | Think | source rail, Box home source rows | source opens in a readable/listenable surface | `docs/user-flows.md`, `docs/think-create-operate-spec.md` | `src/components/SourceRail.jsx`, `src/components/WorkspaceShell.jsx`, `src/lib/listening.js` | `Designed and wired` |
| `THINK-03` | operator interpreting a source | ask Seven about the active source | Think | Seven rail / mobile sheet | Seven renders document-scoped conversation and keeps context | `docs/user-flows.md`, `docs/seven-operate-receipt-contract.md` | `src/components/AiUtilityRail.jsx`, `src/components/WorkspaceShell.jsx`, `src/app/api/reader/seven/thread/route.js`, `src/app/api/seven/route.js` | `Designed and wired` |
| `CREATE-01` | operator shaping material | move selected material into staging | Create | selection controls, Seven staging action, staging panel | staging updates with preserved lineage | `docs/user-flows.md`, `docs/think-create-operate-spec.md` | `src/components/StagingPanel.jsx`, `src/components/WorkspaceShell.jsx` | `Designed and wired` |
| `CREATE-02` | operator building a working artifact | assemble and edit the Assembly | Create | Create phase and assembly actions | Assembly becomes the active built artifact and can be edited | `docs/user-flows.md`, `docs/information-architecture.md` | `src/components/CreateSurface.jsx`, `src/components/WorkspaceShell.jsx`, `src/app/api/workspace/assemble/route.js`, `src/app/api/workspace/document/route.js` | `Designed and wired` |
| `OPERATE-01` | operator reading the box honestly | run Operate on the active Box | Operate | workspace header Operate action | Operate returns `Aim`, `Ground`, `Bridge`, trust, convergence, and next move | `docs/operate-spec-v2.md`, `docs/user-flows.md`, `docs/seven-operate-receipt-contract.md` | `src/components/OperateSurface.jsx`, `src/components/WorkspaceShell.jsx`, `src/app/api/workspace/operate/route.js`, `src/lib/operate.js` | `Designed and wired` |
| `OPERATE-02` | operator pressure-testing a box read | ask Seven to audit the Operate result | Operate | Operate result action | Seven opens against assembly or active document with Operate context | `docs/user-flows.md`, `docs/seven-operate-receipt-contract.md` | `src/components/WorkspaceShell.jsx`, `src/lib/operate.js`, `src/app/api/seven/route.js` | `Designed and wired` |
| `RECEIPT-01` | operator preserving proof | draft a local receipt | Receipts | Receipts surface or Operate result action | local-first receipt draft is created and visible | `docs/user-flows.md`, `docs/AR Version 1.0.md`, `docs/seven-operate-receipt-contract.md` | `src/components/ReceiptSurface.jsx`, `src/components/WorkspaceShell.jsx`, `src/app/api/workspace/receipt/route.js`, `src/lib/workspace-receipts.js` | `Designed and wired` |
| `RECEIPT-02` | operator with remote proof enabled | optionally sync or connect GetReceipts from the receipt moment | Receipts / settings | Receipts surface and account connection | receipt is drafted locally and remote proof remains optional | `docs/user-flows.md`, `docs/AR Version 1.0.md`, `docs/seven-operate-receipt-contract.md` | `src/components/ReceiptSurface.jsx`, `src/app/account/page.jsx`, `src/app/connect/getreceipts/route.js`, `src/app/api/workspace/receipt/route.js`, `src/lib/getreceipts.js` | `Designed and wired` |
| `RESUME-01` | returning operator | leave and return later with enough context to continue | Return / resume | Boxes index and Box home | user can understand current state and resume work | `docs/user-flows.md`, `docs/information-architecture.md` | `src/components/BoxesIndex.jsx`, `src/components/ProjectHome.jsx`, `src/lib/box-view-models.js` | `Designed and wired` |
| `SETTINGS-01` | operator managing profile and proof connection | connect or manage GetReceipts and profile settings | Settings / account | `/account` | user can save profile details and connect/manage GetReceipts | `docs/AR Version 1.0.md`, `docs/seven-operate-receipt-contract.md` | `src/app/account/page.jsx`, `src/components/AccountShell.jsx`, `src/components/AccountProfileForm.jsx`, `src/app/connect/getreceipts/route.js` | `Designed and wired` |
| `SUP-01` | operator maintaining workspace hygiene | rename/manage/delete a Box or document | Support | Box management, source rows, document tools | operator can manage objects without breaking state | `docs/user-flows.md`, `docs/component-architecture-plan.md` | `src/components/BoxManagementDialog.jsx`, `src/components/WorkspaceShell.jsx`, `src/app/api/workspace/document/route.js`, `src/app/api/workspace/project/route.js` | `Designed and wired` |
| `SUP-02` | operator recovering from a bad import | recover from failed intake and keep working | Support | upload, paste, link, Speak note, beta image/audio paths | user gets a clear reason and next step | `README.md`, `docs/AR Version 1.0.md` | `src/app/api/documents/route.js`, `src/app/api/workspace/paste/route.js`, `src/app/api/workspace/link/route.js`, `src/lib/source-intake.js`, `src/components/WorkspaceShell.jsx` | `Designed but partial` |
| `SUP-03` | operator editing under contention | recover from save conflict or stale document state | Support | block edit flow | user sees conflict, can load latest, and avoid silent overwrite | `README.md`, `docs/AR Version 1.0.md` | `src/components/BoxPhaseBar.jsx`, `src/components/WorkspaceShell.jsx`, `src/app/api/workspace/document/route.js`, `src/lib/workspace-documents.js` | `Designed and wired` |
| `SUP-04` | operator relying on listening | recover when playback or recording is unavailable | Support | listen controls and voice recorder | user understands what failed and can continue manually | `README.md`, `docs/user-flows.md` | `src/components/WorkspaceShell.jsx`, `src/lib/listening.js` | `Designed but partial` |
| `MOBILE-01` | mobile operator | use the loop coherently on mobile | Mobile parity | mobile toolbar, sheets, and overlays | user can still Think, Create, Operate, and reach Receipts | `docs/information-architecture.md`, `docs/user-flows.md` | `src/components/WorkspaceShell.jsx`, `src/components/BoxPhaseBar.jsx`, `src/components/AiUtilityRail.jsx`, `src/components/StagingPanel.jsx` | `Designed but partial` |

## Track A — Current Findings

The core loop is real and now aligned with the docs:

`sign in → open Box from Boxes → orient from Box home → Think → Create → Operate → draft receipt`

No `P0` blocker is visible in the code-level audit.

The main remaining live-beta gaps are:

- intake recovery and supported-vs-beta messaging
- playback / recorder fallback clarity
- full mobile runtime verification
- shell complexity inside `WorkspaceShell.jsx`

## Track B — North-Star Readiness Inventory

| ID | User type | Goal | Phase | Canonical design source | Runtime evidence | Status |
|---|---|---|---|---|---|---|
| `NS-01` | multimodal operator | start a Box from images alone | North-star source stories | `docs/loegos-product-spec.md`, `docs/source-model-spec.md`, `docs/user-flows.md` | `src/lib/image-intake.js`, `src/lib/source-model.js`, `src/app/api/documents/route.js` | `Specified only` |
| `NS-02` | voice-first operator | start a Box from voice alone | North-star source stories | `docs/loegos-product-spec.md`, `docs/user-flows.md` | `src/components/WorkspaceShell.jsx`, `src/lib/audio-intake.js`, `src/lib/source-model.js` | `Designed but partial` |
| `NS-03` | multimodal operator | mix text, voice, images, and links in one Box | North-star source stories | `docs/loegos-product-spec.md`, `docs/source-model-spec.md` | `src/lib/source-model.js`, `src/lib/operate.js`, `src/lib/reader-documents.js` | `Specified only` |
| `NS-04` | attributed multi-human operator | preserve who said or added what | North-star source stories | `docs/loegos-product-spec.md`, `docs/source-model-spec.md`, `docs/provenance-trust-policy.md` | `src/lib/source-model.js`, `src/lib/source-intake.js` | `Specified only` |
| `NS-05` | operator capturing explicit feeling/state | add a human-state source honestly | North-star source stories | `docs/loegos-product-spec.md`, `docs/source-model-spec.md`, `docs/provenance-trust-policy.md` | `src/lib/source-model.js` | `Intentional future` |
| `NS-06` | operator with a dense Box | see deeper analysis only when earned | North-star source stories | `docs/think-create-operate-spec.md`, `docs/operate-spec-v2.md`, `docs/information-architecture.md` | `src/components/ProjectHome.jsx`, `src/components/OperateSurface.jsx`, `src/lib/operate.js` | `Designed but partial` |

## Interface Sufficiency Check

| Interface / type | Current state | Story coverage assessment | Audit finding |
|---|---|---|---|
| `BoxViewModel` | implemented by `buildBoxViewModel` | sufficient for Box home and resume summaries | real helper now exists, but shell orchestration still leans on ad hoc composition around it |
| `ThinkViewModel` | thin helper via `buildThinkViewModel` | enough for phase summary work, not full Think ownership | Think still depends on shell orchestration for document loading, listening, and Seven lifecycle |
| `CreateViewModel` | thin helper via `buildCreateViewModel` | enough for counts and titles, not full Create ownership | staging and Assembly state remain shell-owned; Create is only partially extracted |
| `OperateViewModel` | thin helper via `buildOperateViewModel` | enough for `canRunOperate` and summary counts | adequate for `1.0`, but too thin for deeper Operate work |
| `OperateResult` | implemented and used | sufficient for live Operate result and receipt drafting | strongest current interface; only needs richer metadata if deeper analysis ships later |
| `SevenAuditContext` | documented, still implicit in runtime orchestration | partially covered by audit handoff behavior | handoff works, but the context object is still more implicit than explicit |
| `ReceiptDraftMetadata` | realized inside receipt drafting logic | sufficient for current document/assembly/operate flows | adequate for `1.0`, but proof visibility can still improve |
| `BoxSource` | implemented by source-model helpers | good substrate for source labeling and Operate inclusion | strongest current north-star substrate; should remain the base for multimodal growth |
| `SourceProvenance` | implemented as stored/source-derived metadata | sufficient for current live source paths | good in the substrate, still lightly surfaced in the UI |
| `SourceTrustProfile` | implemented as stored/source-derived metadata | sufficient for current live trust hints | structurally sound, but currently subtle outside Operate/source badges |

## Current Audit Conclusion

### Live beta truth

The core Box loop is real and the major launch-surface gaps have been closed.

### North-star readiness

The substrate for multimodal and provenance-aware work is present, but the runtime product is still a strong single-user text/link/voice-first workbench. The north-star stories should stay explicitly future-scoped until the UI catches up to the data model.
