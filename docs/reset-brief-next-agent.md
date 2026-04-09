# Reset Brief for Next Agent

Date: 2026-04-09
Context: Major project reset is planned.

## Mission

You are allowed to reset/refactor large parts of the app **except protected systems** listed below.

The reset goal is to simplify and re-shape product/UI direction without destroying core runtime capabilities or Shape Library integration.

---

## Absolute Non-Negotiables (Do Not Break)

### 1) Shape Library must be preserved exactly

Treat Shape Library as protected infrastructure.

**Do not delete, rename, or break:**

- `shapelibrary/**`
- `src/app/api/shapelibrary/**`
- `src/lib/shapelibrary-client.js`
- `src/lib/shapelibrary-transformers.js`
- `src/app/shapelibrary/**`
- `src/components/shapelibrary/**`
- `src/app/styles/shapelibrary.css`

**Critical rule:** if you must change any of these, only do additive/safe changes and re-verify all Shape Library flows and tests.

### 2) Auth/session/login must be preserved

**Protected areas:**

- `src/app/api/auth/[...nextauth]/route.js`
- `src/lib/auth.js`
- `src/lib/server-session.js`
- `src/components/Providers.jsx`
- account/auth entry surfaces (`src/app/account/page.jsx`, `src/components/SignOutButton.jsx`, etc.)

Do not remove authentication boundary, session checks, or sign-in/out flow.

### 3) Database/runtime persistence must be preserved

**Protected areas:**

- `src/lib/prisma.js`
- `src/lib/storage.js`
- `src/lib/reader-db.js`
- `src/lib/workspace-documents.js`
- `src/lib/workspace-receipts.js`
- `src/lib/reader-projects.js`
- `src/lib/reader-documents.js`

Do not introduce destructive schema/data changes during reset.

### 4) Disclaimer/settings compliance must be preserved

**Protected areas:**

- `src/app/disclaimer/page.jsx`
- `src/app/api/reader/disclaimer/route.js`
- `src/components/WorkspaceDisclaimerGate.jsx`
- `src/lib/disclaimer-content.js`

Do not remove or bypass disclaimer acceptance and related gating behavior.

### 5) File import and source intake must be preserved

**Protected API routes:**

- `src/app/api/documents/route.js`
- `src/app/api/workspace/folder/route.js`
- `src/app/api/workspace/paste/route.js`
- `src/app/api/workspace/link/route.js`
- `src/app/api/workspace/document/route.js`

**Protected libs:**

- `src/lib/document-import.js`
- `src/lib/source-intake.js`
- `src/lib/source-model.js`
- `src/lib/image-intake.js`
- `src/lib/audio-intake.js`
- `src/lib/source-assets.js`

Do not remove ability to add/import source content into workspace.

### 6) Audio/listening pipeline must be preserved

**Protected API/routes/libs:**

- `src/app/api/seven/audio/route.js`
- `src/app/api/reader/listening-session/route.js`
- `src/lib/listening.js`
- `src/lib/reader-player.js`
- `src/lib/voice-memo-drafts.js`
- `src/lib/seven.js`

Do not remove listening/audio playback/capture support.

---

## What You May Change

Outside protected areas above, you may reset/refactor aggressively:

- page structure
- navigation model
- component hierarchy
- presentation/UI copy
- layout modes
- non-protected feature surfaces

But maintain compatibility with protected systems.

---

## Safe Reset Protocol (Required)

1. **Inventory first**  
   Identify touched files and confirm none are in protected paths unless necessary.

2. **Preserve contracts**  
   Keep request/response behavior stable for protected APIs.

3. **Refactor by adapter**  
   If UI changes, adapt into protected services instead of rewriting protected services.

4. **Verify before handoff**  
   At minimum run:
   - `cd shapelibrary && npm run test`
   - lint for changed app files
   - smoke checks:
     - `/shapelibrary`
     - `/shapelibrary/history`
     - `/shapelibrary/drift`
     - auth/login path
     - disclaimer gate
     - source import route(s)
     - listening/audio route(s)

5. **No destructive deletes in protected paths**
   Do not remove protected files/directories during reset.

---

## Failure Conditions (Not Allowed)

Any reset is invalid if one or more of these happen:

- Shape Library no longer runs/tests
- Shape Library UI routes/proxy routes fail
- Auth/session flow breaks
- Disclaimer enforcement disappears
- Importing sources fails
- Audio/listening capability regresses

---

## Primary Intent Reminder

This reset is about product/UI re-architecture, **not** about dismantling core runtime infrastructure.

Keep the engine and mandatory substrate stable while redesigning everything else.
