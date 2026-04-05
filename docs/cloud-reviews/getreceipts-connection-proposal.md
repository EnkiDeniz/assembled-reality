# GetReceipts Connection & Experience Proposal

## Drop and Seal Through the Courthouse

**v0.1 — April 4, 2026**
**Deniz Sengun / Cloud**
**Companion to: Assembly Architecture v0.6, Assembly-to-GetReceipts Mapping v0.1**

---

## 0. The Problem

The GetReceipts connection exists but feels like plumbing. The user encounters it as a "Connect GetReceipts" button on the Receipt surface, a redirect to an OAuth page, a status pill that says "Connected" or "Not connected," and an occasional error message when sync fails. It works. It doesn't feel like anything.

The product has two gestures: Drop and Seal. GetReceipts is the courthouse that makes Seal real. But the courthouse is invisible until something goes wrong. The connection feels like a settings toggle, not like gaining access to a new capability.

This proposal redesigns the GetReceipts connection and receipt experience around three principles:

1. **The connection is a one-time ceremony, not a settings toggle.**
2. **Every sealed receipt should feel like it crossed a boundary — from local to portable.**
3. **GetReceipts status should be ambient, not buried in a panel.**

---

## 1. Current State

### What exists

| Component | Location | Current behavior |
|-----------|----------|------------------|
| Connect initiation | `GET /connect/getreceipts` | Redirects to GetReceipts OAuth. No context, no explanation. |
| OAuth callback | `GET /api/integrations/getreceipts/callback` | Exchanges code, stores token, redirects to `/account`. |
| Connection storage | `GetReceiptsConnection` model | Stores encrypted token, status (CONNECTED/DISCONNECTED/EXPIRED/ERROR), scopes. |
| Receipt creation | `POST /api/workspace/receipt` | Creates local draft. If connected, also creates remote draft. Errors are swallowed silently. |
| Receipt sealing | `PUT /api/workspace/receipt` | Seals locally with delta + audit. Does NOT seal on GetReceipts side. |
| Receipt surface UI | `ReceiptSurface.jsx` | Shows draft list, connection status pills, "Connect GetReceipts" button. |
| Payload builder | `workspace-receipts.js` | Builds GetReceipts-compatible payload with metadata, block lineage, operate results. |
| Seal audit | `receipt-seal-audit.js` | Three-check audit (root alignment, evidence contact, seed alignment) with Seven + fallback. |

### What's broken or missing

1. **Seal does not reach GetReceipts.** The PUT route seals locally but never calls `POST /api/v1/receipts/:rid/seal` on GetReceipts. The most important moment in the system — the seal ceremony — stops at the local database. The courthouse never stamps it.

2. **Evidence files are never uploaded.** The mapping doc specifies `POST /api/v1/evidence/upload` for attaching source files to receipts. No code calls this endpoint. Receipts arrive at GetReceipts as text-only drafts with no evidence attachments.

3. **No remote seal hash stored.** The local sealed receipt stores `sealedAt` and `deltaStatement` in the payload, but never receives or stores a `seal_hash` from GetReceipts. The receipt is not independently verifiable.

4. **Connection redirect goes to /account, not back to the box.** After OAuth, the user lands on the account page. They were working in a box. The connection ceremony interrupts their flow and drops them in the wrong place.

5. **No reconnection flow.** If the token expires (status: EXPIRED), the only way to reconnect is to click "Connect GetReceipts" again and redo the full OAuth. There's no token refresh, no graceful re-auth prompt.

6. **Sync errors are invisible.** When `createRemoteReadingReceiptDraft` fails, the error is stored in `payload.remoteError` but never surfaced to the user in a way they can act on. The receipt surface shows "Local only" but doesn't explain why or offer a retry.

7. **The metadata contract is split across two source apps.** `workspace-receipts.js` uses `source_app: "document_assembler"` for workspace/assembly receipts and `source_app: "loegos"` for operate receipts. The mapping doc specifies `source_app: "assembled-reality"`. Three different app identifiers for the same product.

8. **No receipt verification link.** GetReceipts provides `GET /api/v1/verify/:hash` for public verification. Loegos never stores or surfaces this URL. A sealed receipt cannot be independently verified from within the product.

---

## 2. Proposed Changes

### 2.1 Complete the Seal Ceremony — Remote Seal on GetReceipts

**The most critical change.** When a receipt is sealed in Loegos, the seal must also fire on GetReceipts.

**Flow:**

```
User writes delta statement
  |
User taps Seal
  |
Loegos runs pre-seal audit (existing, keep)
  |
If audit passes or user overrides:
  |
  +-- If no remote draft exists yet:
  |     POST /api/v1/receipts (create draft)
  |
  +-- POST /api/v1/receipts/:rid/seal
  |     -> receipt becomes immutable on GetReceipts
  |     -> returns seal_hash, level, sealed_at
  |
  +-- Store locally:
  |     - getReceiptsReceiptId (if new)
  |     - sealHash
  |     - getReceiptsLevel
  |     - verifyUrl (constructed from hash)
  |     - sealedAt (from GetReceipts, not local clock)
  |
  +-- Update assembly index event with seal_hash
  |
  +-- If GetReceipts is unreachable:
        - Seal locally (existing behavior)
        - Queue for remote seal retry
        - Surface: "Sealed locally. Will push to GetReceipts when connected."
```

**Changes to `PUT /api/workspace/receipt`:**

Add after the local seal succeeds:

```js
// Attempt remote seal
const connection = await getGetReceiptsConnectionForUser(session.user.id);
if (connection?.status === "CONNECTED" && connection?.accessTokenEncrypted) {
  const remoteReceiptId = draft.getReceiptsReceiptId || draft.payload?.remoteReceipt?.id;

  // Create remote draft if it doesn't exist yet
  if (!remoteReceiptId) {
    // rebuild payload with current data and create remote draft
  }

  // Seal the remote receipt
  if (remoteReceiptId) {
    const sealResult = await sealRemoteReceipt(connection, remoteReceiptId);
    // store sealHash, level, verifyUrl on the local draft
  }
}
```

**New function in `getreceipts.js`:**

```js
export async function sealRemoteReceipt(connection, receiptId) {
  const accessToken = decryptSecret(connection?.accessTokenEncrypted || "");
  const response = await fetch(
    `${appEnv.getReceipts.baseUrl}/api/v1/receipts/${receiptId}/seal`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );
  // return { seal_hash, level, sealed_at, verify_url }
}
```

---

### 2.2 Upload Evidence Files at Seal Time

When a receipt is sealed and contains confirmed evidence blocks that reference source documents with blob assets, upload those assets to GetReceipts.

**Flow:**

```
At seal time, before creating/sealing the remote receipt:
  |
  For each source document referenced by evidence blocks:
    |
    If the source has a ReaderSourceAsset with a blobUrl:
      |
      POST /api/v1/evidence/upload
        -> multipart/form-data with the file
        -> returns { url, content_hash, mime_type, size }
      |
      Attach returned evidence objects to the receipt
```

**Scope for milestone 1:** Upload only image and document assets (photos, PDFs, contracts). Audio and link assets can follow.

**What NOT to upload:** Sources that are thinking material (articles read for context, voice notes decomposed into blocks) should not become receipt evidence unless their blocks were confirmed as evidence. The filter is the same as it's always been: only confirmed evidence blocks reference sources that cross into GetReceipts.

---

### 2.3 Redesign the Connection Ceremony

The connection should feel like gaining access, not toggling a setting.

**Current flow:**
1. User sees "Connect GetReceipts" button on Receipt surface
2. Click -> redirect to GetReceipts OAuth
3. Approve scopes -> redirect to /account
4. User manually navigates back to their box

**Proposed flow:**
1. User sees "Connect the courthouse" prompt (only on first box that reaches a receipt-ready state, or when they first try to seal)
2. One-line explanation: "GetReceipts stamps, seals, and stores your receipts so they're portable and verifiable."
3. Click -> redirect to GetReceipts OAuth (same as now)
4. Approve scopes -> redirect back to the box they were in, not /account
5. Box shows a one-time confirmation: "Connected. Your next sealed receipt will be stamped by GetReceipts."

**Implementation:**

Change the OAuth callback redirect:

```js
// Current:
return NextResponse.redirect(new URL("/account?connected=getreceipts", origin));

// Proposed: Store return URL in state, redirect back to workspace
const returnUrl = payload.returnUrl || "/workspace";
return NextResponse.redirect(
  new URL(`${returnUrl}?connected=getreceipts`, origin),
);
```

Update `createSignedIntegrationState` to accept and encode a return URL:

```js
export function createSignedIntegrationState(userId, returnUrl = "/workspace") {
  const payload = JSON.stringify({
    userId,
    returnUrl,
    issuedAt: Date.now(),
  });
  // ...
}
```

Update `buildGetReceiptsConnectUrl` to accept the current workspace URL.

---

### 2.4 Ambient Connection Status

Move GetReceipts status out of the Receipt surface panel and into persistent ambient UI.

**Current:** Two status cards buried in ReceiptSurface showing "Receipt draft status" and "GetReceipts" with explanatory paragraphs.

**Proposed:** A single compact indicator visible from any surface where receipts are relevant.

**Where it appears:**

| Surface | What shows |
|---------|------------|
| Box Home (project home) | Small status line below receipt count: `3 drafts · 1 sealed · GetReceipts ●` |
| Receipt surface | The existing status cards compressed to a single row: `● Connected` or `○ Local only` or `⚠ Sync error — retry` |
| Workspace control bar | Nothing unless there's an actionable error. Then: a small warning dot on the receipt tab/phase indicator. |
| Sealed receipt card | Each sealed receipt shows: `Sealed · L2 · Verified ✓` (if remote seal succeeded) or `Sealed locally` (if not) |

**The key change:** "Connected" is not a status to celebrate. It's a background condition. "Not connected" is not a problem to warn about — local-first is a feature. The only status that deserves attention is "Sync failed — your last seal didn't reach the courthouse." That's actionable. Everything else is ambient.

---

### 2.5 Retry Queue for Failed Remote Operations

When GetReceipts is unreachable or returns an error during receipt creation or sealing, queue the operation for retry.

**Implementation:**

Add a `syncStatus` field to the `ReadingReceiptDraft` payload:

```js
syncStatus: "synced" | "pending_create" | "pending_seal" | "failed"
```

On the Receipt surface, drafts with `syncStatus: "pending_seal"` or `"failed"` show a "Retry" button. Tapping it re-attempts the remote operation.

**Automatic retry:** On workspace load, if any drafts have pending sync status and the connection is active, attempt the remote operation silently. If it succeeds, update the status. If it fails again, leave it pending. Don't retry more than once per session load.

**No background polling.** Retry happens on user action (tap Retry) or on workspace load. This keeps the system simple and avoids polling a potentially unreachable service.

---

### 2.6 Unify the Metadata Source App Identifier

Three different `source_app` values exist:
- `"document_assembler"` (workspace-receipts.js, workspace/assembly mode)
- `"loegos"` (workspace-receipts.js, operate mode)
- `"assembled_reality"` (mapping doc specification)

**Proposed:** Unify to `"loegos"` everywhere. The product name is Loegos. The app slug on GetReceipts is `assembled-reality` (for historical reasons), but the metadata should use the product name.

Update `workspace-receipts.js`:
- `source_app: "loegos"` for all modes
- `source_flow: "loegos_workspace_v2"` for workspace/assembly
- `source_flow: "loegos_operate_v1"` for operate (already correct)

---

### 2.7 Store and Surface Verification Links

After a remote seal succeeds, construct and store the verification URL:

```js
const verifyUrl = `${appEnv.getReceipts.baseUrl}/api/v1/verify/${sealResult.seal_hash}`;
```

Store `verifyUrl` on the local draft payload. Surface it in the UI:

**On the sealed receipt card:**
A small "Verify" link that opens the GetReceipts verification page in a new tab. One tap to prove the receipt is real.

**In the assembly index:**
Each state transition event that references a sealed receipt includes the verification URL. When the assembly index is eventually exported, every state transition is independently verifiable.

---

### 2.8 Token Refresh and Graceful Re-auth

**Current:** When the token expires, the connection status becomes EXPIRED and the user must re-do the full OAuth flow.

**Proposed:** Before any GetReceipts API call, check token expiry:

```js
async function getValidConnection(userId) {
  const connection = await getGetReceiptsConnectionForUser(userId);
  if (!connection || connection.status === "DISCONNECTED") return null;

  if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) {
    // Mark as expired
    await updateConnectionStatus(userId, "EXPIRED");
    return null;
  }

  return connection;
}
```

When a GetReceipts call fails with 401 (token revoked or expired):
1. Mark connection as EXPIRED
2. Surface a prompt on the Receipt surface: "Your GetReceipts connection expired. Reconnect to resume remote sealing."
3. The "Reconnect" button triggers the same OAuth flow but returns to the current box.

**No token refresh in v1.** The GetReceipts delegated app flow doesn't currently support refresh tokens. When it does, add silent refresh here. Until then, re-auth on expiry is the correct behavior.

---

### 2.9 The Seal Moment — What the User Sees

This is the most important UX change. The seal is the sacred gesture. It should feel like one.

**Current:** User clicks "Seal receipt" -> a text input appears for the delta statement -> clicks confirm -> local database updates -> the receipt card changes status to "SEALED" -> nothing else visible happens.

**Proposed:**

```
User has a draft receipt with confirmed ◻ evidence
  |
"Seal" button becomes available (only when pre-seal audit conditions are met)
  |
User taps Seal
  |
Delta input appears (one line, placeholder: "What changed?")
  |
User writes the delta statement and taps confirm
  |
Brief animation: the receipt card transitions visually.
The assembly state color shifts if a state transition was triggered.
  |
If GetReceipts connected:
  Receipt card shows: "Sealed · L2 · Verify ↗"
  The state chip updates with the new state label and color.
  |
If GetReceipts not connected:
  Receipt card shows: "Sealed locally"
  Same state update. No degraded feeling — local seals are first-class.
  |
If GetReceipts seal fails:
  Receipt card shows: "Sealed locally · Retry sync"
  One-tap retry available.
```

**The key principle:** The seal should feel complete regardless of GetReceipts status. Local-first is not a fallback. It's the primary experience. GetReceipts adds portability and verification — it doesn't add validity. A locally sealed receipt is a real receipt. GetReceipts makes it a verified receipt.

---

### 2.10 Witness Reference at Seal Time (Prepare the Surface)

The assembly-to-getreceipts mapping doc defines a `witness_protocol` metadata object. The architecture spec says the missing Me is judgment — external validation.

**Milestone 1:** Add an optional witness field to the seal dialog. Not required. Not prominent. Just available.

```
Delta statement: [_________________________]
Witness (optional): [_________________________]
  (Name or reference — "Clara Montez, architect" or "Email thread 03/12")
```

If provided, the witness data is stored in:
- Local receipt payload: `witnessReference: { name, relationship, source }`
- GetReceipts metadata: `witness_protocol.witness_reference`
- The receipt's trust level hint changes from L1 to L2

**No verification of the witness.** The user declares it. The system records it. L2 means "a witness was named." L3 (registered, independently verifiable) comes later.

---

## 3. Implementation Priority

### Ship now (critical path)

| # | Change | Why |
|---|--------|-----|
| 1 | Remote seal on GetReceipts (2.1) | The seal ceremony is incomplete without it. The courthouse never stamps. |
| 2 | Store seal hash + verification URL (2.7) | Without this, sealed receipts are not independently verifiable. |
| 3 | Redirect callback to workspace, not /account (2.3) | The connection ceremony breaks the user's flow. |
| 4 | Unify source_app to "loegos" (2.6) | Three identifiers for one product creates metadata confusion. |

### Ship next

| # | Change | Why |
|---|--------|-----|
| 5 | Evidence file upload at seal time (2.2) | Receipts without evidence are text-only. The proof should travel with the receipt. |
| 6 | Ambient connection status (2.4) | Compress the status cards. Surface errors where they're actionable. |
| 7 | Retry queue for failed syncs (2.5) | Failed remote operations should be recoverable without re-drafting. |
| 8 | Seal moment UX (2.9) | The gesture should feel sacred. Animation, state color shift, verify link. |

### Ship later

| # | Change | Why |
|---|--------|-----|
| 9 | Token expiry handling (2.8) | Graceful re-auth instead of silent failure. |
| 10 | Witness reference field (2.10) | Prepare the L2 trust surface. The witness is the missing Me. |

---

## 4. What Lives Where (Updated)

| Data | Current | Proposed |
|------|---------|----------|
| Seal hash | Not stored | Stored on local draft payload + assembly index event |
| Verification URL | Not stored | Constructed from seal hash, stored on local draft |
| GetReceipts level | Not stored | Stored on local draft payload after remote seal |
| Evidence files | Never uploaded | Uploaded at seal time for evidence sources with blob assets |
| Witness reference | Not stored | Optional field on local draft payload + GetReceipts metadata |
| Sync status | Implicit (has remoteReceiptId or not) | Explicit field: synced / pending_create / pending_seal / failed |
| Return URL after OAuth | Always /account | Encoded in signed state, returns to originating workspace |

---

## 5. Test Scenarios

1. Create a box, declare root, add sources, confirm blocks, draft a receipt, seal it — verify the seal reaches GetReceipts and the seal hash is stored locally.
2. Seal a receipt while GetReceipts is unreachable — verify local seal completes, sync status shows "pending_seal," and retry works when connection returns.
3. Connect GetReceipts from the Receipt surface — verify the user returns to their box, not to /account.
4. Seal a receipt with evidence source files (photo, PDF) — verify evidence is uploaded to GetReceipts and attached to the receipt before sealing.
5. View a sealed receipt — verify the "Verify" link opens the GetReceipts verification page and the receipt is independently verifiable.
6. Let the GetReceipts token expire — verify the Receipt surface shows a reconnect prompt, not a silent failure.
7. Seal a receipt with a named witness — verify the witness data appears in the local payload and in the GetReceipts metadata.
8. Seal a receipt from Operate — verify the Operate result (aim/ground/bridge/gradient) is included in the GetReceipts metadata alongside the delta statement and evidence snapshot.
9. Check that all receipts use `source_app: "loegos"` regardless of creation mode.
10. Reconstruct the assembly index from GetReceipts receipts alone — verify the receipt sequence, state transitions, domains, and evidence snapshots are all present in metadata.

---

## 6. What This Does Not Cover

- **Share links.** Requires `shares:create` scope expansion on the GetReceipts side. Separate coordination.
- **Cross-assembly analytics.** Querying patterns across multiple boxes via GetReceipts metadata. Future feature.
- **First-class witness endpoints.** When GetReceipts adds witness support to create/seal, promote from metadata to top-level fields.
- **Receipt editing after seal.** Sealed receipts are immutable. This is correct and intentional.
- **Bulk evidence upload.** Milestone 1 uploads evidence at seal time only. Background upload of all evidence sources is a future optimization.

---

---

## Appendix — The 911 Metaphor

Loegos is a Porsche 911. The user must feel the road.

The engine is in the back. The receipts are in the back. The weight that keeps you honest is behind you — you can't see it, but you feel it in every turn. The receipts don't steer. They give the rear axle grip. Without them, the back end swings out and you're telling stories about where you were going while you spin.

Seven gears. Seven states. PDK doesn't make you think about shifting — it reads the road and puts you in the right gear before you ask. Seven doesn't make you think about tagging blocks or computing domain coverage — it reads the box and puts you in the right state before you name it. The driver commits to the apex. Seven handles the drivetrain.

**Drop is the throttle.** You press it and material enters the box. No form, no fields, no "which box" dialog. The car doesn't ask "which gear would you like?" when you step on the gas. It reads your input and responds. Drop should feel like that — instant, mechanical, connected to the road.

**Seal is the apex.** The moment you commit to the exit trajectory. You can't seal halfway. You can't undo a seal. The physics don't allow it. In the 911, indecision at the apex doesn't produce a worse outcome — it produces instability. Same in Loegos. A draft that sits forever without sealing is a car coasting through the apex without committing. The arc breaks.

**The pre-seal audit is the car telling you the conditions.** Tire pressure, brake temperature, traction status. Root alignment, evidence contact, seed alignment. The car doesn't decide for you. It shows you the physics. You commit or you don't. The road doesn't care about your story. It cares about your line.

**The color gradient is the tachometer.** Cool blues through warm ambers. You feel the revs climb as the assembly advances. Steps 0-3 are low RPM, assembling, pull. Steps 4-7 are high RPM, pushing, committing. The gate at 3→4 is when the turbo spools. You feel the character change. The car goes from responding to propelling.

**The ⊘ queue is the suspension.** It absorbs the road surface — every bump, every imperfection in the source material — and translates it into information the driver can use. Without the suspension (without confirmation), the raw road surface reaches the driver unfiltered. With it, the driver feels what matters and ignores what doesn't.

**GetReceipts is the telemetry system.** The car runs without it. You can drive a 911 with no data logging and it's still a 911. But with telemetry, every lap is recorded. Every apex is timestamped. Every line is verifiable. You can prove you were there. You can prove you committed. The telemetry doesn't make you faster. It makes your driving real — to anyone who wasn't in the car.

Completing the remote seal (Section 2.1) is plugging in the transponder. Without it, you have a fast car with no lap times. With it, every seal is a verified lap.

### The Seven Gears

| PDK Gear | Assembly State | The Feel |
|---|---|---|
| 1st | Rooted | Launch. Maximum torque. The root grips. |
| 2nd | Fertilized | First source in. The road appears. |
| 3rd | Sprouted | First receipt. You feel the evidence. |
| **3→4** | **The gate** | **Turbo spools. Pull becomes push.** |
| 4th | Growing | Multiple receipts, multiple domains. Velocity. |
| 5th | Structured | 70% coverage. The line is clear. |
| 6th | Assembled | The thing exists. Cruising speed. |
| 7th | Sealed | The apex. You seal. The lap is done. |

Release is pulling into the pit. The box closes. The data downloads. The assembly index is the race report.

The whole product is man and machine. The human holds the wheel. Seven holds the drivetrain. The receipts hold the rear axle. The road holds everyone accountable.

---

*Loegos builds the case. GetReceipts stamps, seals, and stores it. Drop is the poke. Seal is the ceremony. The courthouse makes the ceremony portable. The 911 makes the road real.*
