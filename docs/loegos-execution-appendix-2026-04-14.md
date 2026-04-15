# Lœgos Execution Appendix

Date: April 14, 2026
Status: Compact handoff appendix
Audience: Engineering and design
Purpose: Provide the smallest actionable table set from the living constitution so implementation can move without carrying the full doctrine in working memory.

Primary reference:

- [loegos-living-constitution-and-planning-anchor-2026-04-14.md](/Users/denizsengun/Projects/AR/docs/loegos-living-constitution-and-planning-anchor-2026-04-14.md)

---

## 1. Bricks

## 0. Must Exist Now Filter

Do not build the whole topology at once.

The current implementation floor is:

1. one consequential `ArtifactVersion`
2. one visible scope identity
3. one `CompilerReadArtifact` keyed to subject version plus visible scope identity
4. one way to share or discuss that read
5. one honest recovery path for earlier version or staged bridge state
6. one way to compare what changed

Everything else in the constitution remains valid as direction, but not all of it is a mandate for immediate build.

If a proposed implementation step does not improve one of those six things, it is probably not on the shortest path.

---

## 1. Bricks

| Layer | Brick | What it is | V1 status |
|---|---|---|---|
| Language | `Projection` | aim, declaration, lone claim | conceptual |
| Language | `Crossing` | evidence-bearing contact that held | conceptual |
| Language | `Braid` | woven interpretation / structural read | conceptual |
| Language | `Seal` | closure / receipt / irreversible convergence | conceptual |
| System | `Artifact` | durable source object | active |
| System | `ArtifactVersion` | immutable versioned state of an artifact | active |
| System | `Box` | assembly container for local consequence | active |
| System | `ContextPack` | explicit visible scope for Seven | next core (runtime still uses lighter scope identity) |
| Derived | `CompilerReadArtifact` | structural read of one subject version under one visible scope | active, still tightening |
| Derived | `BridgePayload` | scoped carried material into Room | active |
| Derived | `Delta` | comparison between related reads/versions/scopes | active |
| Derived | `ReceiptArtifact` | returned evidence from reality | active |
| Emergent | `Pattern` | recurring structure across assemblies | later |
| Emergent | `GhostOperator` | recurring current inferred from move/return/perception data | later surface |
| Emergent | `ShapeClass` | promoted reusable topology | later |

---

## 2. Connectors

| Connector | Meaning | V1 status |
|---|---|---|
| `parent_version_of` | one version descends from another | active |
| `derived_from` | one artifact or read came from another | active |
| `attached_to_box` | a brick is in use by a box assembly | active / partial |
| `included_in_scope` | a brick is in the active Context Pack | next core (current runtime only exposes lighter scope identity) |
| `cites` | a read or artifact explicitly points to another brick | later / partial |
| `supports` | one brick strengthens another | later |
| `contradicts` | one brick weakens or falsifies another | later |
| `produced_by` | a brick was created by a move or runtime process | later / partial |

Anti-confusions:

- `pinned_canon` is not a connector
- `disputed` is not a connector

---

## 3. Scope Policies

| Policy | Meaning | V1 status |
|---|---|---|
| `pinned_canon` | Seven should treat this as foundational in the active scope | next core |
| `active_context` | this is the live material under examination | next core |
| `background_only` | visible context, but not primary driver | next core |
| `excluded` | deliberately removed for contrast or ablation | next core |

Scope laws:

- nothing enters Seven silently
- every scoped brick should be version-pinned
- scope should be visible before or with the read

---

## 4. Core Operations

| Operation | What it does | Why it matters | V1 status |
|---|---|---|---|
| `Import` | bring a brick into Library | creates durable source identity | active |
| `Type` | classify the brick | keeps categories honest | active / partial |
| `Version` | create a new immutable state | preserves lineage and reread integrity | active |
| `Read` | expose structure under visible scope | the read is the product | active |
| `Compile` | enforce language/runtime law | keeps closure honest | active |
| `Bridge` | carry scoped material into Room | connects source to live work | active / provenance and recovery still tightening |
| `Attach` | connect bricks to a box assembly | localizes consequence | active / partial |
| `Scope` | build the visible field for Seven | prevents mystic drift | next core (current runtime only shows lighter scope identity) |
| `Pin` | mark what is foundational in scope | stabilizes context | next core |
| `Compare` | show what changed | makes revision legible | active |
| `Ablate` | remove a brick and rerun the scene | reveals load-bearingness | next core |
| `Restore` | recover earlier version or state | preserves reversibility | active / partial (clone-forward for versions, staged recovery still tightening) |
| `Seal` | close with receipt-backed convergence | creates true closure | active / partial |

Smallest useful product path:

1. import a consequential document
2. version it
3. show the active scope identity
4. run Compiler Read
5. share or discuss the read
6. compare what changed
7. revise
8. reread

If a proposed feature does not make this path sharper, truer, or easier under visible scope, it is probably secondary.
