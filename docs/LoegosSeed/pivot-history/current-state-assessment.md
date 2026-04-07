# Current State Assessment

Date: 2026-04-06

## Summary

Loegos already contains a real backend product behind login. The authenticated surface is not a notes app, not a reader, and not a chat wrapper. It is a source-and-proof workbench centered on `/workspace`, with a concrete pipeline:

`source -> seed -> operate -> evidence -> receipt`

That pipeline is real, implemented, and load-bearing.

The main issue is not missing product substance. The main issue is that the primary surface and primary component do not yet present that substance with enough simplicity, clarity, or structural safety.

## What The Product Is

Behind login, the product is a box-based workspace for:

- bringing in source material
- shaping a live Seed
- running an AI box read through Operate
- confirming blocks as aim, evidence, or story
- drafting and sealing receipts

`/read` is no longer a separate product surface and redirects back into `/workspace`.

`/library` also redirects back into `/workspace`.

`/account` is a support surface for identity, preferences, proof connection, and drafts, not a second core product.

The logged-in center of gravity is:

- [src/app/workspace/page.jsx](../src/app/workspace/page.jsx)
- [src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx)

The workspace is gated by:

- auth redirect through NextAuth session checks
- example bootstrap through `ensureLoegosOriginExampleForUser`
- a mandatory disclaimer gate persisted through `disclaimerAcceptedAt`

## What Is Real And Working

### Auth and session

Auth is coherent and real:

- NextAuth with JWT session strategy
- Apple Sign-In and email magic links
- reader profile auto-creation
- server-side auth redirect into the workspace

Key files:

- [src/lib/auth.js](../src/lib/auth.js)
- [src/lib/server-session.js](../src/lib/server-session.js)
- [src/app/page.jsx](../src/app/page.jsx)

### Data model

The Prisma schema matches the actual product model:

- users
- reader profiles
- documents
- projects / boxes
- project-document memberships
- annotations
- evidence sets and evidence items
- conversation threads and messages
- reading progress
- listening sessions
- receipt drafts
- GetReceipts connection
- source assets

Key file:

- [prisma/schema.prisma](../prisma/schema.prisma)

### Source intake

Source intake is one of the strongest subsystems in the repo. It supports:

- file upload
- folder import
- paste
- link import with readability extraction
- image import with derivation
- audio import with transcription
- source asset storage

Key files:

- [src/lib/source-intake.js](../src/lib/source-intake.js)
- [src/lib/document-import.js](../src/lib/document-import.js)
- [src/lib/link-intake.js](../src/lib/link-intake.js)
- [src/lib/image-intake.js](../src/lib/image-intake.js)
- [src/lib/audio-intake.js](../src/lib/audio-intake.js)

### Boxes / projects

Boxes are real persisted objects with:

- create, update, delete
- pin and archive
- root declaration
- state history
- document membership
- current assembly / seed tracking

Key files:

- [src/lib/reader-projects.js](../src/lib/reader-projects.js)
- [src/lib/project-model.js](../src/lib/project-model.js)

### AI loops

The AI loops are implemented, not mocked:

- Seven chat
- Seven audio
- Seed generation
- Operate
- workspace AI transforms

Key routes:

- [src/app/api/seven/route.js](../src/app/api/seven/route.js)
- [src/app/api/seven/audio/route.js](../src/app/api/seven/audio/route.js)
- [src/app/api/workspace/seed/route.js](../src/app/api/workspace/seed/route.js)
- [src/app/api/workspace/operate/route.js](../src/app/api/workspace/operate/route.js)
- [src/app/api/workspace/ai/route.js](../src/app/api/workspace/ai/route.js)

### Proof flows

The proof layer is real:

- confirmation queue
- evidence set creation and deletion
- reader annotations
- reading progress
- listening session persistence
- receipt drafting
- pre-seal audit
- receipt sealing
- optional GetReceipts sync

Key files:

- [src/app/api/workspace/confirm/route.js](../src/app/api/workspace/confirm/route.js)
- [src/app/api/reader/evidence/route.js](../src/app/api/reader/evidence/route.js)
- [src/app/api/workspace/receipt/route.js](../src/app/api/workspace/receipt/route.js)
- [src/lib/receipt-seal-audit.js](../src/lib/receipt-seal-audit.js)
- [src/lib/receipt-remote-sync.js](../src/lib/receipt-remote-sync.js)

## Verified Repo Facts

These claims were checked directly in the codebase:

- [src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx) is 12,948 lines.
- [src/app/globals.css](../src/app/globals.css) is 9,334 lines.
- [package.json](../package.json) has no test script.
- `npm run build` succeeds.
- `npm run lint` fails.
- Lint fails in app-relevant code including:
  - [src/components/InlineAssist.jsx](../src/components/InlineAssist.jsx)
  - [src/components/RootEditor.jsx](../src/components/RootEditor.jsx)
  - [src/lib/formal-core/runtime.js](../src/lib/formal-core/runtime.js)
- [src/app/api/workspace/ai/route.js](../src/app/api/workspace/ai/route.js) silently falls back to keyword matching when OpenAI is unavailable.
- [src/app/workspace/page.jsx](../src/app/workspace/page.jsx) is the logged-in center of gravity, with auth redirect and example bootstrap.
- [src/app/read/page.jsx](../src/app/read/page.jsx) redirects to `/workspace`.
- [src/app/library/page.jsx](../src/app/library/page.jsx) redirects to `/workspace`.

## What Is Not Working Well

### 1. The monolith

The biggest engineering bottleneck is not missing features. It is that too much product truth is trapped inside one giant shell.

[src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx) owns:

- document loading
- project switching
- editing
- staging
- confirmation
- AI chat
- AI transforms
- audio playback
- voice recording
- Operate
- receipt drafting
- receipt sealing
- mobile and desktop variants

This makes the product powerful and brittle at the same time.

### 2. No automated protection

There is no meaningful test safety net for the logged-in product. The repo contains visual/manual artifacts in `output/playwright`, but not a real automated suite guarding the authenticated flows.

For this much state and orchestration, every change to the workspace shell is riskier than it should be.

### 3. External dependency fragility

The special intelligence layer is heavily env-gated:

- OpenAI powers Seven, Seed, Operate, and AI transforms
- Blob storage is required for some asset flows
- GetReceipts needs OAuth secrets
- magic links need email configuration
- Apple auth needs Apple configuration
- some paths depend on current DB migrations

The app still has a functioning non-AI spine, but some of its most important differentiated behaviors degrade or fail when services are unavailable.

### 4. Silent degradation

The most important trust problem in the repo is not just service unavailability. It is silent service substitution.

[src/app/api/workspace/ai/route.js](../src/app/api/workspace/ai/route.js) returns a successful result even without OpenAI by falling back to heuristic keyword matching. The user is not clearly told that the system has degraded from model-backed output to local fallback behavior.

That is a product trust issue, not just an implementation detail.

### 5. Vocabulary and surface overload

The implemented mechanics are concrete, but the surface still asks the user to metabolize too much language:

- boxes
- roots
- seeds
- lanes
- phases
- receipts
- Operate
- Seven
- gradients
- trust levels
- domains
- shapes
- verbs
- reality instruments

Internally this is consistent. Externally it creates a learning cliff.

### 6. Schema and naming drift

The code carries obvious signs of an in-progress model shift:

- `project` remains the persistence term
- `box` is the product-facing term
- migration and fallback logic exists throughout project/document handling

This does not make the product fake. It does indicate recent shape change and incomplete consolidation.

Key files:

- [src/lib/reader-projects.js](../src/lib/reader-projects.js)
- [src/lib/workspace-documents.js](../src/lib/workspace-documents.js)

## The Strongest Diagnosis

The issue is not only vocabulary overload.

It is a three-way misalignment:

1. the product truth is concrete
2. the interface still over-explains and over-symbolizes that truth
3. the code architecture makes safe simplification hard

That is why the product can feel both impressive and unstable at the same time.

The clearest restatement is:

**Loegos already has a real backend product, but its primary surface and primary component do not yet present that product with enough simplicity, clarity, or structural safety.**

## Converged Position

We strongly converge on the following:

- The product is real.
- The load-bearing truth is `source -> seed -> operate -> evidence -> receipt`.
- The app is more mature as a source-and-proof workbench than as a philosophy-forward language product.
- The biggest engineering bottleneck is not missing features; it is concentration of product logic inside the workspace shell.
- The current desktop problem should not be treated as design polish alone.

It should be treated as a:

**product-truth vs surface-truth mismatch**

with [src/components/WorkspaceShell.jsx](../src/components/WorkspaceShell.jsx) as the main technical choke point.

## Pivot Law

The highest-confidence operating rule from this assessment is:

- preserve the intake/data/proof spine
- treat vocabulary and metaphor as negotiable
- simplify the workspace around the actual pipeline
- stop adding conceptual surface area until the shell is decomposed
- remove silent degradation where the user cannot tell what is real AI vs fallback behavior

## Bottom Line

Loegos behind login is not vapor and not merely a prototype. It already contains a real product with a real pipeline and a real persistence model.

What is missing is not the core product.

What is missing is a primary surface and code architecture that present the existing product truth with enough clarity, restraint, and safety to let the product fully land.

## Source Documents

These source documents are preserved in `pivot/source documents` for future reference and next-step work:

- [pivot/source documents/assembled_reality_first_seed.md](./source%20documents/assembled_reality_first_seed.md)
- [pivot/source documents/assembled_reality_v07_final.md](./source%20documents/assembled_reality_v07_final.md)
- [pivot/source documents/echo_canon_first_seed.md](./source%20documents/echo_canon_first_seed.md)
- [pivot/source documents/echo_canon_userexperience.md](./source%20documents/echo_canon_userexperience.md)
- [pivot/source documents/loegos.md](./source%20documents/loegos.md)
- [pivot/source documents/monolith_canon.md](./source%20documents/monolith_canon.md)
