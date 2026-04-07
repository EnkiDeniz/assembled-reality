# Seven Operate Receipt Contract

**Status:** Canonical engine-boundary contract  
**Scope:** Role boundaries, interfaces, and internal route map

---

## Summary

This document exists to prevent the product from collapsing conversation, diagnosis, and proof into one ambiguous AI surface.

The stable rule is:

- `Seven` talks, explains, interprets, audits
- `Operate` reads the Box and projects structure
- `Receipts` preserve proof
- `GetReceipts` stores portable proof
- `Lakin` is the deeper intelligence layer behind the box-read and diagnostics

## Role Boundaries

### Seven

Seven is:

- document-scoped conversation
- interpretive help
- audit help
- contextual explanation
- a source of material that can be moved into staging

Seven is not:

- the canonical box-read result
- the receipt object
- the place where box state is silently mutated

### Operate

Operate is:

- a box-scoped read
- a compressed diagnosis
- a convergence and trust projection
- the step that pressures the Box toward proof

Operate is not:

- chat
- rewrite
- summary for its own sake

### Receipts

Receipts are:

- proof artifacts
- local-first drafts
- lineage-preserving records of document, Assembly, or Operate outcomes

Receipts are not:

- another editing mode
- a substitute for source material

## Core Interfaces

```ts
interface SevenThread {
  threadId: string;
  boxKey?: string | null;
  documentKey: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    citations?: Array<{
      id?: string;
      sectionLabel?: string;
      excerpt?: string;
    }>;
    createdAt: string;
    pending?: boolean;
    error?: boolean;
  }>;
}

interface SevenAuditContext {
  boxKey: string;
  documentKey: string;
  assemblyDocumentKey?: string | null;
  operateResult?: OperateResult | null;
}

interface OperateInput {
  projectKey: string;
  documentKey?: string;
  includeAssembly?: boolean;
  includeGuide?: boolean;
}

interface OperateSentence {
  sentence: string;
  level: "L1" | "L2" | "L3";
  rationale: string;
}

interface OperateResult {
  boxKey: string;
  boxTitle: string;
  ranAt: string;
  aim: OperateSentence;
  ground: OperateSentence;
  bridge: OperateSentence;
  gradient: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  convergence: "convergent" | "divergent" | "hallucinating";
  trustFloor: "L1" | "L2" | "L3";
  trustCeiling: "L1" | "L2" | "L3";
  nextMove: string;
  includedDocuments: Array<{
    documentKey: string;
    title: string;
    role: "source" | "assembly" | "guide";
    blockCount: number;
    truncated: boolean;
  }>;
  includedSourceCount: number;
  includesAssembly: boolean;
}

interface OperateReceiptMetadata {
  source_flow: "loegos_operate_v1";
  box_key: string | null;
  box_title: string;
  included_document_keys: string[];
  includes_assembly: boolean;
  gradient: number;
  convergence: "convergent" | "divergent" | "hallucinating";
  trust_floor: "L1" | "L2" | "L3";
  trust_ceiling: "L1" | "L2" | "L3";
}

interface ReceiptDraftSource {
  mode: "workspace" | "assembly" | "operate";
  documentKey: string;
  boxKey?: string | null;
  operateResult?: OperateResult | null;
}
```

## Behavioral Rules

### Seven conversation

- starts from the active document
- stays tied to that document
- may stage useful assistant output explicitly

### Operate read

- starts from the active Box
- reads real sources plus current Assembly by default
- excludes built-in guide, staging, receipt history, and Seven thread history by default

### Ask Seven to audit

- always begins from an Operate result or active document context
- targets current Assembly if present, otherwise the active document
- does not replace Operate output with conversational prose

### Draft receipt

- may start from:
  - active document
  - active Assembly
  - Operate result
- must remain local-first
- remote GetReceipts failure must never block local draft creation

## Current Internal Routes

These routes already exist and should remain the near-term foundation:

| Route | Role |
|---|---|
| `GET /api/reader/seven/thread` | load document-scoped Seven thread |
| `POST /api/seven` | ask Seven about the active document |
| `POST /api/workspace/operate` | run Operate on the active Box |
| `POST /api/workspace/receipt` | create local-first receipt draft and optional remote sync |
| `POST /api/workspace/project` | create/open Box-backed project record |
| `POST /api/documents` | upload/create supported source documents |
| `POST /api/workspace/link` | import link as source |
| `POST /api/workspace/paste` | create pasted source or stage pasted blocks |
| `POST /api/workspace/folder` | batch-import folder contents |

## Future Internal Contract Direction

Keep public surface area stable for now. Prefer evolving internal contracts first:

- richer `BoxSource` payloads
- stronger source provenance
- multimodal source summaries
- richer `OperateResult` metadata
- explicit audit context between Operate and Seven

Do not add public route sprawl before the data contracts are locked.

## Acceptance Criteria

This contract is correct when:

1. The team can explain Seven and Operate without overlap.
2. Receipt drafting works from document, Assembly, and Operate result without semantic drift.
3. GetReceipts remains the remote proof layer, not the local drafting engine.
4. The route map is stable enough to support future multimodal source work.
