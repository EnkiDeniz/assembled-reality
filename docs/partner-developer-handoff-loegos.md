# Loegos Partner Developer Handoff

**Status:** External developer brief  
**Audience:** Engineers in another product who need to either:
- replicate the Loegos artifact creation + save flow inside their own app, or
- connect to Loegos as the source of truth for source, seed, Operate, and receipt state

---

## 1. What Loegos Is

Loegos is a box-based content and proof platform.

The core loop is:

`source -> seed -> operate -> evidence -> receipt`

In product terms:

- a **Box** is the top-level container for one piece of work
- **Sources** are imported human signal with provenance
- a **Seed** is the active shaped artifact inside the box
- **Operate** is the system read of the current box/seed state
- **Receipts** are proof artifacts drafted from the current work

Loegos is not just a document editor and not just an AI assistant. It is a structured pipeline for turning captured content into a shaped artifact, reading that artifact honestly, and preserving proof.

---

## 2. The Minimum Object Model

If your team is trying to understand the platform quickly, these are the only nouns you need first:

### Box

The workspace container.

Holds:
- sources
- one active seed / assembly
- Operate runs
- receipt drafts
- optional conversation/audit context

In the current codebase, “Box” maps closely to the project model. The default runtime title is `Untitled Box`.

### Source

Any imported signal that enters the box with provenance.

Current live source paths include:
- upload document
- paste text
- link import
- voice capture

Important rule:

**A source is not proof.** It is normalized input with provenance and trust metadata.

### Seed / Assembly

The active shaped artifact in the box.

This is the working document the user is building from sources. In many docs this is called the **Assembly**. In newer founder-facing flows, this is the **Seed**.

For integration purposes, treat these as the same product role:

- the editable, current, derived artifact inside the box

### Operate Run

A structured read of the current box/seed state.

Operate is not chat and not summary for its own sake. It is the system’s current read of:
- aim
- ground
- bridge
- convergence
- trust floor / ceiling
- next move

Newer work also supports overlay-style block findings and attested overrides.

### Receipt

A proof artifact drafted from:
- a document
- the current seed / assembly
- or an Operate result

Current rule:

**receipt drafting is local-first**  
remote sync is optional and must not block local draft creation

---

## 3. The Creation and Saving Lifecycle

This is the most important part for another team to understand.

### Step 1: Create or open a Box

The user starts work in a box.

Current route:
- `POST /api/workspace/project`

Typical result:
- create a new box/project
- return the box key and display metadata

### Step 2: Add a Source

A source enters the box from upload, paste, link, or voice.

Current routes:
- `POST /api/documents`
- `POST /api/workspace/paste`
- `POST /api/workspace/link`
- `POST /api/workspace/folder`

What gets saved:
- normalized content
- provenance metadata
- trust floor metadata
- document type / modality
- block structure when available

### Step 3: Shape or save the Seed

The seed/assembly is the active derived artifact inside the box.

Current route:
- `POST /api/workspace/seed`

Related document persistence:
- `POST /api/workspace/document`

What matters here:
- the seed is a real saved object
- it belongs to the box
- it is the main artifact Operate reads

### Step 4: Run Operate

Operate reads the box and/or active seed.

Current route:
- `POST /api/workspace/operate`

Related routes:
- `GET /api/workspace/operate`
- `POST /api/workspace/operate/overrides`

What gets produced:
- box-level read
- block-level findings
- evidence references
- trust/convergence state
- optional attested overrides

### Step 5: Draft and optionally sync a Receipt

Current routes:
- `POST /api/workspace/receipt`
- `POST /api/workspace/receipt/remote-sync`
- `POST /api/workspace/receipt/audit`

What matters:
- local receipt draft is created first
- remote sync is best-effort / optional
- the proof object should preserve lineage back to document/seed/Operate state

---

## 4. The Two Integration Options

There are two sane ways another product can work with Loegos.

## Option A: Replicate the flow in your own product

Use Loegos as the reference architecture and implement your own version of:

- box creation
- source ingestion
- seed persistence
- Operate-style read
- receipt drafting

Choose this if:
- you need full product control
- your artifact model must live entirely in your own database
- your UI/product language is meaningfully different

What you should carry over exactly:
- local-first save behavior
- provenance preservation
- trust does not silently inflate
- Operate is separate from chat
- receipts are proof artifacts, not just exports

What you do **not** need to copy exactly:
- current frontend shell
- naming/metaphor
- internal component structure

## Option B: Use Loegos as the system of record

Your product creates or sends content, and Loegos stores/returns:

- sources
- seed/assembly state
- Operate reads
- receipt/proof state

Choose this if:
- you want the Loegos content/proof spine without rebuilding it
- your product mainly needs artifact creation, persistence, and readback
- you are comfortable integrating against Loegos routes/contracts

This is the better choice if your main need is:

**“create content in our app, but persist and read it back through the Loegos pipeline.”**

---

## 5. Recommended Sync Model

If the two products need to work in sync, the cleanest model is:

### Loegos owns

- box identity
- source records
- active seed / assembly record
- Operate results
- attested override state
- receipt drafts and proof lineage

### Partner product owns

- its own UI and local editing experience
- product-specific workflows
- optional mirrored view state
- optional local cache

### Synchronization contract

Your app should think in these transitions:

1. create/open box
2. create source
3. create or update seed
4. request Operate read
5. request receipt draft / sync

In other words:

**sync objects, not screens**

Do not try to mirror Loegos page structure. Mirror the lifecycle of the artifact.

---

## 6. Current Behavioral Rules That Matter Externally

These are not implementation details. They are product laws.

### 1. Source is not proof

Imported content is input, not verified truth.

### 2. Operate is not chat

Operate is the box-read engine. Seven/chat is explanatory and contextual, but it is not the canonical box-read result.

Reference:
- `docs/seven-operate-receipt-contract.md`

### 3. Receipt creation is local-first

Remote failures must not block local draft creation.

### 4. Overrides must stay visible

If a human overrides a finding, the override must remain explicit and must not visually masquerade as machine-grounded green.

### 5. Trust must fail loudly, not silently

If a prerequisite is missing, the system should fail or disclose clearly. It should not pretend success.

---

## 7. What Another Team Probably Needs to Ask First

If the partner team is evaluating whether to replicate or integrate, these are the right technical questions:

### Artifact identity

- What is the stable external identifier for a box?
- What is the stable external identifier for a source?
- What is the stable external identifier for the active seed?
- What is the stable external identifier for a receipt?

### Save semantics

- Is seed save full-replace or patch-based?
- How is optimistic concurrency handled?
- What version or timestamp should a partner send back on update?

### Operate semantics

- What input does Operate require?
- Does it read only the active seed, or all included sources too?
- What parts of the response are stable enough to integrate against?

### Receipt semantics

- What exact payload is needed to draft a receipt?
- What is required before sealing?
- Which fields are local-only vs portable to a remote proof system?

### Source provenance

- Which provenance fields are mandatory?
- How should a partner distinguish original vs derived content?
- How should trust floor be initialized for external imports?

---

## 8. Minimal Mental Model For an Outside Developer

If a new engineer only remembers one thing, it should be this:

### Loegos is not organized around pages.

It is organized around state transitions:

```text
Box
  -> Source added
  -> Seed shaped
  -> Operate read
  -> Evidence / overrides
  -> Receipt draft
  -> Optional remote sync
```

That is the integration spine.

---

## 9. Suggested Decision Framework

Use this when deciding whether the other project should replicate or integrate.

### Replicate if

- the other product wants the product ideas but not the platform dependency
- the other team needs a different canonical data model
- the other team wants full autonomy over trust semantics and proof storage

### Integrate with Loegos if

- the other product mainly needs artifact persistence and lifecycle
- you want shared box/source/seed/proof state
- you want to ask Loegos for the current read instead of rebuilding Operate

### Hybrid is also possible

The partner app may:
- author content locally
- sync sources/seeds into Loegos
- fetch Operate/receipt results back
- render those results inside its own frontend

That is likely the most practical sync model if the partner app already has a strong UX of its own.

---

## 10. Recommended Starter Reading For the Other Team

Give them this order:

1. `docs/partner-developer-handoff-loegos.md`
2. `docs/loegos-product-spec.md`
3. `docs/source-model-spec.md`
4. `docs/seven-operate-receipt-contract.md`
5. `docs/LoegosSeed/Connectors/loegos-cloud-connector-spec.md`

If they need the language/rendering direction too:

6. `docs/LoegosSeed/language/README.md`
7. `docs/LoegosSeed/language/loegos-language-spec-v1.1.md`

---

## 11. The Short Version You Can Send in Slack

Loegos is a box-based content and proof platform.

The stable lifecycle is:

`source -> seed -> operate -> evidence -> receipt`

If you want to replicate it, copy the lifecycle and trust rules.  
If you want to integrate with it, sync against the box/source/seed/Operate/receipt objects, not the UI.

The most important distinction is:

- Seven/chat explains
- Operate reads
- Receipts preserve proof

Remote sync should never block local draft creation.

---

## 12. Current Shape Library integration state (2026-04-09)

The project now includes a dedicated Shape Library UI slice inside the Next.js app.

### UI routes

- `/shapelibrary`
- `/shapelibrary/history`
- `/shapelibrary/drift`

### App-level bridge routes

- `POST /api/shapelibrary/analyze`
- `GET /api/shapelibrary/candidates`
- `POST /api/shapelibrary/promote`
- `GET /api/shapelibrary/history`
- `GET /api/shapelibrary/drift`

These proxy routes forward to the standalone Shape Library service (default `http://localhost:4310`) and keep browser integration inside the app boundary.

### Design alignment note

The Shape Library UI has been refactored to use project tokens/styles rather than isolated inline styles. See:

- `shapelibrary/docs/shape-library-ui-refactor-2026-04-08.md`
- `docs/current-runtime-state-2026-04-09.md`

