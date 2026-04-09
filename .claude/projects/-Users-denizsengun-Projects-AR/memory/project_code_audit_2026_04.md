---
name: Code audit — behind login (April 2026)
description: Combined three-reader audit of the authenticated product surface. Canonical reference for what's real, what's hollow, and what's fragile.
type: project
---

## What this product is

Behind login, Loegos is a **source-and-proof workbench** — not a notes app, not a reader, not a chat wrapper. The authenticated surface is one primary page (`/workspace`) driven almost entirely by `WorkspaceShell.jsx`, backed by a Postgres schema with 18+ models.

The core loop: **bring in source material → shape a live Seed → run an AI "Operate" read over the box → confirm blocks as evidence/story/aim → draft and seal receipts**. That loop is implemented end to end. It is not vapor.

`/read` is dead — both routes redirect into `/workspace`. `/library` redirects to `/workspace`. `/account` is a support surface (profile, connection status, drafts), not a second app. The entire logged-in product is the workspace.

**Auth boundary**: `getServerSession` + redirect. Signed-in users hitting `/` go to `/workspace`. Workspace and account redirect to `/` without a user id. First-time use is bootstrapped with an example project (`ensureLoegosOriginExampleForUser`). A mandatory disclaimer gate blocks the shell until `disclaimerAcceptedAt` is set via POST to `/api/reader/disclaimer`.

---

## What's working

### Auth and session (solid)
NextAuth with JWT (30-day expiry), Apple Sign-In + email magic links. Profile auto-creation on first sign-in. Token hydration in JWT callback. `auth.js`, `server-session.js` are clean and coherent.

### Data model (solid)
Prisma schema matches the product: users, profiles, documents, projects, project-document join, highlights, notes, bookmarks, evidence sets, evidence items, conversation threads, messages, reading progress, listening sessions, receipt drafts, GetReceipts connection, source assets. Relational structure is genuine and well-indexed.

### Source intake (strongest subsystem)
Upload, folder import, paste, link capture with readability extraction, image upload with OCR derivation, audio upload with transcription, voice memo recording with in-browser MediaStream. Format support: PDF, DOCX, DOC, TXT, Markdown, images (PNG, JPG, WebP, GIF, HEIC, HEIF, BMP), audio (MP3, WAV, M4A, WebM). 15MB upload limit. Asset storage via Vercel Blob. Processing pipeline: `source-intake.js` → `image-intake.js` / `audio-intake.js` / `link-intake.js` / `document-import.js`.

### Box/project CRUD (solid)
Boxes are real persisted objects with create, update, delete, pin, archive, root declaration, state history, and document membership. `reader-projects.js`, `project-model.js`. The workspace page does non-trivial project/document resolution with resume-session logic, mobile/desktop branching, and multiple fallback strategies.

### AI loops (implemented, env-gated)
- **Seven**: document-grounded assistant via `/api/seven`. Loads user content from DB, calls OpenAI Responses API. Returns 503 when `OPENAI_API_KEY` is missing.
- **Operate**: evaluates box assembly for convergence/divergence, trust levels (L1-L3), gradient (1-7). Produces aim/ground/bridge sentences. `/api/workspace/operate`.
- **Seed**: auto-generates structured seed from sources. `/api/workspace/seed`.
- **Audio**: TTS via OpenAI or ElevenLabs. `/api/seven/audio`.
- **Workspace AI**: `/api/workspace/ai` — dual-mode. With OpenAI: real Responses call. Without OpenAI: silently falls back to heuristic keyword matching and still returns success. This is a degradation the user never sees.

### Proof flows (real)
Confirmation queue, evidence sets with items, annotations (highlights/bookmarks/notes), reading progress, listening state. Receipt draft creation, pre-seal audit (`receipt-seal-audit.js`), sealing flow, optional GetReceipts OAuth sync (`receipt-remote-sync.js`). ~25 API routes with real auth checks, validation, and database calls.

### Assembly architecture (real state machine)
9 states: declare-root → rooted → fertilized → sprouted → growing → structured → assembled → sealed → released. 10 domains: vision, financial, legal, people, physical, technical, temporal, relational, risk, completion. 3 primary tags: aim, evidence, story. Confirmation statuses: unconfirmed, confirmed, discarded. 7-step Seven stages: Promise → Pattern → Test → Turn → Proof → Seal → Release (exist as constants; enforcement on actual LLM interaction is unclear).

---

## What isn't working

### The monolith (critical structural risk)
`WorkspaceShell.jsx` is 12,948 lines. ~100 `useState` calls, ~30 refs. It manages audio playback, voice recording, drag-and-drop, receipt sealing, project switching, document loading, AI chat, clipboard staging, assembly confirmation, and every other feature in one function. The "component architecture" around it is facade: `AssemblyWorkspaceScreen` is 7 lines, `ReceiptsScreen` is 3 lines, `OperateScreen` is 3 lines — pure div wrappers. All real logic is inline in the shell. A significant portion of the 12.9k lines is duplicated conditional rendering for mobile vs desktop (`isMobileLayout ?` ternaries throughout the return statement).

### No tests
No test suite in `package.json`. Manual/visual artifacts exist in `output/playwright` but no actual test files or runner. For a product with this much state logic and this many API routes, every change to WorkspaceShell is a blind deployment.

### Lint failures
`npm run lint` fails with real app-code issues: `InlineAssist.jsx:16`, `RootEditor.jsx:81`, `runtime.js:193`.

### External service fragility
Every "special" feature depends on configured secrets:
- Seven and Operate need `OPENAI_API_KEY` (503 without it)
- Image/audio derivation need AI and Vercel Blob storage
- GetReceipts needs OAuth secrets
- Email magic links need Resend
- Apple auth needs Apple credentials
- Some paths explicitly fail until migrations are current

The UI may expose Seven/Operate controls even when the backing service is unavailable.

### Silent AI degradation
`/api/workspace/ai` returns success using heuristic keyword matching when OpenAI is unavailable. The user gets a "result" that looks like AI output but is pattern-matched text. No indication of degradation.

### Vocabulary overload
A user encounters: boxes, seeds, roots, aims, shapes, verbs, lanes, phases, 9 assembly states, 10 domains, Seven, Operate, receipts, sealing, convergence, gradients, trust levels, confirmation queues, word layers, reality instruments, provenance, evidence sets, source rails, staging panels, sidecar panels, think surfaces, create surfaces. Internally consistent; externally opaque. The botanical metaphor (root/seed/fertilize/sprout) and geometric design system (shapes mapped to verbs) are coherent as a language but create a learning cliff.

### Schema drift
The code carries fallback logic around boxes/documents that indicates the product model changed recently and is still settling: `reader-projects.js`, `workspace-documents.js`. The vocabulary isn't stable — "box" and "project" coexist in code and UI.

### 13k lines of CSS
`globals.css` (9,334 lines) plus style partials. For a product with one primary screen, this suggests accumulated iteration without pruning.

---

## The diagnosis

The product behind login is **real** — genuine data model, real API surface, working intake pipeline, implemented AI loops, actual proof flows. It is not a prototype or a mockup.

The product is **architecturally brittle** — one 13k-line component, no tests, no clean lint, silent degradation paths, env-gated features with no graceful UI fallback.

The product is **conceptually overloaded** — the implemented mechanics (source → seed → operate → evidence → receipt) are concrete and strong. The naming system adds cognitive load that the current UI can't yet justify to a new user. The app is more mature as a source-and-proof workbench than as a coherent "language philosophy" product.

**Why:** The product model changed recently (box/project vocabulary shift, schema drift, hollow component shells from an extraction that started but didn't finish). The founder's mental model is ahead of the codebase's ability to communicate it.

**How to apply:** When making changes, treat the source→seed→operate→evidence→receipt pipeline as load-bearing. Treat the vocabulary/metaphor layer as negotiable. Treat WorkspaceShell decomposition as the highest-leverage structural work. Never trust that external services are available — check the UI path when they're not.
