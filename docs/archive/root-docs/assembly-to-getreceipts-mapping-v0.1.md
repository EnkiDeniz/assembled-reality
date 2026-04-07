# Assembly Architecture → GetReceipts API Mapping
## How Every Primitive Touches the Infrastructure
### Companion to Assembly Architecture v0.6 + Witness Protocol v0.1

**v0.1 — April 4, 2026**
**Deniz Sengun / Cloud**
**For: The Builders**

---

## 0. The Two Layers

Loegos and GetReceipts are two layers of one system. They connect at the receipt.

| Layer | Owns | Runs |
|-------|------|------|
| **Loegos** (product) | Root, seed, box, blocks, operator sentences, composer, state progression, Seven, gap analysis, rapid confirmation | Loegos app (own Vercel project) |
| **GetReceipts** (infrastructure) | Receipt persistence, sealing, hashing, evidence storage, public verification, share links, trust levels | GetReceipts API at `getreceipts.com/api/v1` |

Loegos builds the case. GetReceipts stamps, seals, and stores it.

The connection uses the delegated external-app flow. The `assembled-reality` app slug is already wired in GetReceipts config. Auth is OAuth-style: user consents, auth code exchanged, delegated bearer token stored encrypted on the Loegos side.

---

## 1. Primitive-by-Primitive Mapping

### 1.1 The Root

| Assembly Architecture | GetReceipts |
|----------------------|-------------|
| Root declaration (max 7 words) | No direct counterpart. The root lives entirely in Loegos. |
| Gloss | No direct counterpart. Lives in Loegos. |
| Immutability | Loegos enforces. GetReceipts never sees the root directly. |

**Where it appears in GetReceipts:**
The root text is included in receipt metadata for provenance. Every receipt created from this box carries a reference back to the originating root.

```json
{
  "metadata": {
    "source_app": "assembled-reality",
    "assembled_reality": {
      "root": "Build a farmhouse upstate",
      "root_id": "root_abc123",
      "box_id": "box_def456"
    }
  }
}
```

The root is not a GetReceipts object. It is Loegos-side data that rides along as metadata on every receipt the box produces.

---

### 1.2 The Seed

| Assembly Architecture | GetReceipts |
|----------------------|-------------|
| Seed (live evolving working object) | No direct counterpart. The seed lives in Loegos. |
| State (0–7) | Tracked in Loegos. State transitions are triggered by receipts, which are GetReceipts objects. |
| State history | Loegos-side. Each state transition references a GetReceipts receipt ID. |
| Block composition | Loegos-side. Blocks are operator sentences stored and composed in Loegos. |

**Where it appears in GetReceipts:**
The seed's current state is included in receipt metadata so the assembly index can be reconstructed from the receipt chain.

```json
{
  "metadata": {
    "assembled_reality": {
      "seed_state_before": 2,
      "seed_state_after": 3,
      "state_transition": "Sprouted → Growing"
    }
  }
}
```

---

### 1.3 The Box

| Assembly Architecture | GetReceipts |
|----------------------|-------------|
| Box (container) | No direct counterpart. The box is Loegos-side. |
| Domain coverage map | Loegos-side. |
| ⊘ count, block count | Loegos-side metadata. |

**Where it appears in GetReceipts:**
The box ID is attached as metadata to every receipt it produces. GetReceipts can list all receipts from a specific box using `GET /api/v1/receipts?q=box_def456` or by filtering on metadata fields.

---

### 1.4 The Block

| Assembly Architecture | GetReceipts |
|----------------------|-------------|
| Block (operator sentence) | No direct counterpart as a standalone object in GetReceipts. |
| Primary tag (△ ◻ ○ ⊘) | Loegos-side. |
| Domain label | Loegos-side. |
| Seven stage | Loegos-side. |

**Where blocks appear in GetReceipts:**
Blocks are the building material of receipts. When a receipt is created, the confirmed ◻ blocks that form the evidence basis are encoded into the receipt's content fields:

| Block role in receipt | GetReceipts field |
|----------------------|-------------------|
| The delta statement (what changed) | `aim` |
| What the user attempted | `tried` |
| What actually happened (the evidence summary) | `outcome` |
| What the user learned from this step | `learned` |
| What happens next | `decision` |

The delta statement — the receipt's operator sentence — maps to `aim`. This is the most important mapping. The `aim` field in GetReceipts is the receipt's headline. The delta sentence is the assembly's headline for that state transition. They are the same thing.

**Full block data in metadata:**
The complete set of ◻ blocks used in the receipt can be stored as structured metadata for reconstruction:

```json
{
  "metadata": {
    "assembled_reality": {
      "blocks": [
        {
          "block_id": "blk_001",
          "text": "Architect confirmed scope and timeline.",
          "primary_tag": "evidence",
          "domain": "People",
          "source_id": "src_meeting_notes_0312"
        },
        {
          "block_id": "blk_002",
          "text": "Contract signed for $45,000 design phase.",
          "primary_tag": "evidence",
          "domain": "Financial",
          "source_id": "src_contract_0312"
        }
      ]
    }
  }
}
```

---

### 1.5 The Receipt

This is where the two layers meet. The receipt is the only primitive that exists in both systems.

| Assembly Architecture | GetReceipts API |
|----------------------|-----------------|
| Receipt creation | `POST /api/v1/receipts` |
| Receipt update (draft) | `PATCH /api/v1/receipts/:rid` |
| Receipt seal | `POST /api/v1/receipts/:rid/seal` |
| Receipt retrieval | `GET /api/v1/receipts/:rid` |
| Receipt listing | `GET /api/v1/receipts` |
| Evidence attachment | `POST /api/v1/evidence/upload` → attach to receipt |
| Public verification | `GET /api/v1/verify/:hash` |
| Share link | `POST /api/v1/receipts/:rid/share` |

**The receipt lifecycle in both systems:**

```
LOEGOS SIDE                          GETRECEIPTS SIDE
─────────────                        ────────────────

User prepares receipt in Composer
  ↓
Selects sources, reviews ◻ blocks
  ↓
Writes delta statement
  ↓
Names witness (optional)
  ↓
                                     POST /api/v1/evidence/upload
                                       → uploads evidence files
                                       → returns URLs + content hashes
  ↓
                                     POST /api/v1/receipts
                                       → creates draft receipt
                                       → aim = delta statement
                                       → evidence = uploaded files
                                       → metadata = full provenance
  ↓
User reviews draft in Composer
  ↓
                                     PATCH /api/v1/receipts/:rid
                                       → updates if user edits
  ↓
User seals
  ↓
                                     POST /api/v1/receipts/:rid/seal
                                       → receipt becomes immutable
                                       → seal_hash computed
                                       → trust level assigned
  ↓
Loegos records:
  - GetReceipts receipt ID
  - seal_hash
  - trust level
  - state transition
  ↓
Seed advances to next state
Assembly index updated
```

**Field mapping at receipt creation:**

| Assembly Architecture concept | GetReceipts field | Example value |
|------------------------------|-------------------|---------------|
| Delta statement | `aim` | "Architect confirmed scope and timeline." |
| What was attempted | `tried` | "Met with three architects. Reviewed portfolios and proposals." |
| What happened | `outcome` | "Selected Clara Montez. Signed design-phase contract." |
| What was learned | `learned` | "Farmhouse renovation requires 18-month timeline minimum." |
| Next step | `decision` | "Begin site survey and soil testing." |
| Who did the work | `owner` | "Deniz Sengun" |
| Temporal mode | `temporal` | `"retrospective"` (most receipts) |
| Visibility | `visibility` | `"private"` (default) |
| Status at creation | `status` | `"draft"` (seal separately) |
| Domain tags | `tags` | `["People", "Financial"]` |
| Evidence files | `evidence[]` | Uploaded via evidence endpoint |
| Full provenance | `metadata` | See below |

**Full metadata contract for a Loegos receipt:**

```json
{
  "metadata": {
    "source_app": "assembled-reality",
    "source_flow": "witness_protocol_v1",
    "assembled_reality": {
      "root": "Build a farmhouse upstate",
      "root_id": "root_abc123",
      "box_id": "box_def456",
      "seed_state_before": 2,
      "seed_state_after": 3,
      "state_transition": "Sprouted → Growing",
      "delta": "Architect confirmed scope and timeline.",
      "domains_covered": ["People", "Financial"],
      "receipt_sequence": 3,
      "blocks": [
        {
          "block_id": "blk_001",
          "text": "Architect confirmed scope and timeline.",
          "primary_tag": "evidence",
          "domain": "People",
          "source_id": "src_meeting_notes_0312"
        }
      ],
      "witness_protocol": {
        "protocol_level": "L2",
        "verification_mode": "named_witness",
        "witness_reference": {
          "type": "person",
          "name": "Clara Montez",
          "relationship": "architect",
          "source": "email_confirmation"
        },
        "independently_verifiable": false
      }
    }
  }
}
```

---

### 1.6 The Source

| Assembly Architecture | GetReceipts |
|----------------------|-------------|
| Source (raw material) | Evidence files when attached to a receipt |
| Source types (photo, voice, article, document) | Evidence `kind` (photo, document, video, audio, link) |
| Source immutability | Evidence files are immutable once uploaded. Content hash computed server-side. |

**Mapping:**

| Loegos source type | GetReceipts evidence kind |
|-------------------|--------------------------|
| Photo | `photo` |
| Voice note | `audio` |
| Document (PDF, contract) | `document` |
| Article / URL | `link` |
| Video | `video` |

**Upload flow:**

```
POST /api/v1/evidence/upload
  Content-Type: multipart/form-data
  
  → Accepts: JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF, PDF
  → Max: 20MB
  → Returns: url, content_hash (sha256), mime_type, size, original_name

Attach returned evidence object to receipt at creation or update.
```

Not every Loegos source becomes GetReceipts evidence. Sources that support the user's thinking (articles, voice notes for block extraction) stay in Loegos. Sources that prove real-world contact (contracts, photos, meeting notes) become receipt evidence. The filter is the ◻ tag — only confirmed ◻ blocks reference sources that cross into GetReceipts.

---

### 1.7 Trust Levels / Witness Protocol

| Assembly Architecture | GetReceipts |
|----------------------|-------------|
| L1 (self-reported) | GetReceipts level 1 (text-only) or level 2 (hashed evidence) |
| L2 (witnessed) | Stored in `metadata.assembled_reality.witness_protocol` |
| L3 (registered) | Stored in `metadata.assembled_reality.witness_protocol` |

**Current reality:**
GetReceipts computes its own `level` field (1, 2, or 3) based on evidence and internal witness data. The Loegos witness protocol (L1/L2/L3) is a parallel trust model stored in metadata, not a replacement for the GetReceipts level.

Both coexist. GetReceipts `level` is platform trust. Loegos `protocol_level` is assembly trust. They may agree or diverge — a receipt might be GetReceipts level 2 (has hashed evidence) but Loegos L1 (no named witness). Both are recorded. Both are useful.

**Future path:**
When GetReceipts adds first-class witness support to the create and seal endpoints, the Loegos witness protocol can promote from metadata to a top-level field. Until then, metadata mapping is the correct production pattern.

---

### 1.8 The Assembly Index

| Assembly Architecture | GetReceipts |
|----------------------|-------------|
| Assembly index (full record) | Reconstructable from the receipt chain |

The assembly index is a Loegos-side artifact. But it is built from GetReceipts receipts. Every state transition in the assembly index references a canonical GetReceipts receipt ID and seal hash.

**Reconstruction:**

The full assembly index can be reconstructed by:

1. Querying `GET /api/v1/receipts?q=box_def456` to get all receipts from a box
2. Ordering by `metadata.assembled_reality.receipt_sequence`
3. Reading `seed_state_before` and `seed_state_after` from each receipt's metadata
4. Reading `delta`, `domains_covered`, and `witness_protocol` from each receipt's metadata
5. Verifying each receipt's integrity via `GET /api/v1/verify/:hash`

The assembly index is therefore both a Loegos document and a verifiable chain of GetReceipts receipts. The Loegos side holds the rich context (blocks, tags, stages, gaps). The GetReceipts side holds the portable proof (sealed records, hashes, public verification).

---

## 2. The Seal Ceremony — End-to-End

The most important moment in the system. Here is the complete flow from Composer to sealed receipt.

```
COMPOSER (Seal Mode)
│
├── User selects sources from box
├── User reviews confirmed ◻ blocks
├── User writes delta statement (one operator sentence)
├── User assigns domain(s)
├── User optionally names witness or confirms L3 source
│
▼
LOEGOS BACKEND
│
├── Upload evidence files to GetReceipts
│   POST /api/v1/evidence/upload (for each file)
│   → store returned URLs and content_hashes
│
├── Create draft receipt on GetReceipts
│   POST /api/v1/receipts
│   → aim = delta statement
│   → tried, outcome, learned, decision from ◻ blocks
│   → evidence[] = uploaded files
│   → metadata = full provenance + witness protocol
│   → status = "draft"
│   → tags = domains covered
│   → owner = user name
│   → temporal = "retrospective"
│
├── Seal the receipt
│   POST /api/v1/receipts/:rid/seal
│   → receipt becomes immutable
│   → seal_hash computed by GetReceipts
│   → level computed by GetReceipts
│
├── Store in Loegos:
│   → GetReceipts receipt ID (canonical)
│   → seal_hash
│   → GetReceipts level
│   → canonical URLs (detail_url, share_url, public_url)
│
├── Update seed state
│   → state N → state N+1 (if hard gate met)
│   → record state transition in seed history
│
├── Update assembly index
│   → append receipt reference
│   → update domain coverage map
│   → update health indicators
│
▼
COMPOSER updates to show new state
```

---

## 3. What Lives Where

| Data | Lives in | Why |
|------|----------|-----|
| Root (7 words + gloss) | Loegos only | Product concept, not a receipt |
| Seed (live object) | Loegos only | Evolving composition, not a receipt |
| Box (container) | Loegos only | Organizational structure |
| Blocks (operator sentences) | Loegos primarily, copy in receipt metadata | Blocks are the thinking layer; receipts carry the evidence layer |
| Sources (raw materials) | Loegos for all sources; GetReceipts for evidence sources | Only ◻-confirmed sources cross into receipts |
| Receipts | GetReceipts (canonical) + Loegos (reference) | GetReceipts is the courthouse. Loegos stores the receipt ID and seal hash. |
| Seal hash | GetReceipts (computed) + Loegos (stored) | GetReceipts computes; Loegos references |
| Trust level (L1/L2/L3) | Both. GetReceipts `level` + Loegos `protocol_level` in metadata | Parallel trust models, both recorded |
| State (0–7) | Loegos only | Product state, not a GetReceipts concept |
| Assembly index | Loegos (primary), reconstructable from GetReceipts receipt chain | Loegos holds the rich version; GetReceipts holds the verifiable chain |
| Evidence files | GetReceipts (via Vercel Blob) | Canonical storage, content-hashed |
| Public verification | GetReceipts (`/verify/:hash`) | The courthouse verifies. Loegos links to it. |

---

## 4. Auth Setup for the Builders

The Loegos app connects to GetReceipts using the delegated external-app flow. The `assembled-reality` slug is already registered.

**Loegos-side environment variables needed:**

```
GETRECEIPTS_BASE_URL=https://getreceipts.com
GETRECEIPTS_CLIENT_SECRET=<shared-secret-from-getreceipts-side>
```

**GetReceipts-side environment variables already wired:**

```
FEATURE_ASSEMBLED_REALITY_CONNECT=true
ASSEMBLED_REALITY_REDIRECT_URIS=<loegos-callback-url>
ASSEMBLED_REALITY_CLIENT_SECRET=<shared-secret>
```

**Connect flow:**

1. Loegos sends user to `GET getreceipts.com/connect/assembled-reality?redirect_uri=<callback>&state=<state>&scope=receipts:read receipts:create receipts:update evidence:upload`
2. User signs in to GetReceipts (if needed) and approves scopes
3. GetReceipts redirects back to Loegos callback with auth code
4. Loegos backend exchanges code for delegated token via `POST /api/integrations/apps/assembled-reality/token`
5. Loegos stores token encrypted, uses it server-to-server

**Delegated token scopes available:**

```
receipts:read
receipts:create
receipts:update
evidence:upload
```

Note: `shares:create` is not in the default scope set. If Loegos needs to create share links, the scope config must be expanded on the GetReceipts side.

---

## 5. Implementation Priorities

### Build now

1. **Receipt creation flow.** Wire the Composer's Seal mode to create draft → upload evidence → seal via GetReceipts API. This is the critical path.
2. **Metadata contract.** Implement the full metadata structure from Section 1.5. Every receipt carries root reference, box ID, state transition, blocks, domains, and witness protocol.
3. **Receipt ID storage.** Store the canonical GetReceipts receipt ID and seal hash on every state transition in the seed's history.
4. **Evidence upload.** Wire source files to `POST /api/v1/evidence/upload` when they are used in a receipt. Only ◻-confirmed sources cross over.

### Build next

5. **Public verification links.** Surface the `GET /api/v1/verify/:hash` URL in the assembly index so any receipt can be independently verified.
6. **Assembly index reconstruction.** Build the query that reconstructs the full assembly path from GetReceipts receipt chain using metadata sequence numbers.
7. **Share links.** Request `shares:create` scope expansion, then wire share link creation for individual receipts or full assembly index exports.

### Build later

8. **First-class witness endpoint.** When GetReceipts adds witness support to create/seal endpoints, promote from metadata mapping to top-level fields.
9. **Cross-assembly analytics.** Query patterns across multiple boxes using GetReceipts receipt metadata to populate the Shape Library.
10. **L3 auto-detection.** Seven suggests L3 flag when source type matches registered/institutional patterns. One-tap confirmation at seal time.

---

*Loegos builds the case. GetReceipts stamps, seals, and stores it. The architecture is the product. The API is the courthouse. The receipt is the bridge.*
