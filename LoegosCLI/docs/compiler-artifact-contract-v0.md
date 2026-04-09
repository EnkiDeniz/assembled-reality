# Compiler Artifact Contract v0.5

Date: 2026-04-09  
Status: Draft-to-lock

## 1) Purpose

Define the canonical JSON artifact produced by `compile(source)` and consumed by all renderers and runtime orchestration.

This contract is the only allowed state bridge between:

- source `.loe`
- Mirror
- Editor
- runtime window state

## 2) Top-Level Shape

```json
{
  "artifactVersion": "0.5.0",
  "compilationId": "string",
  "filename": "string",
  "tokenizedLines": [],
  "ast": [],
  "symbolTable": [],
  "assemblyGraph": {},
  "diagnostics": [],
  "compileState": "clean|warning|blocked",
  "runtimeState": "open|awaiting|returned|closed",
  "closureType": "seal|flag|stop|reroute|attest|null",
  "mergedWindowState": "shape_error|flagged|awaiting|attested|rerouted|stopped|sealed|open",
  "stats": {
    "lineCount": 0,
    "clauseCount": 0,
    "errorCount": 0,
    "warningCount": 0,
    "symbolCount": 0
  },
  "metadata": {}
}
```

## 3) Field Definitions

## `artifactVersion`

- semantic version of the artifact schema
- required for compatibility checks

## `compilationId`

- deterministic identifier for same input (at same compiler version)

## `tokenizedLines[]`

Each item:

```json
{
  "line": 1,
  "raw": "GND witness @x from \"x.md\" with v1",
  "type": "blank|comment|clause|unknown",
  "head": "GND",
  "verb": "witness",
  "tokens": [
    {
      "text": "GND",
      "category": "head|verb|keyword|ref|string|scalar|adapter|identifier|comment|ws",
      "span": { "line": 1, "startCol": 1, "endCol": 3 }
    }
  ]
}
```

## `ast[]`

Each clause:

```json
{
  "line": 1,
  "head": "GND",
  "verb": "witness",
  "positional": [{ "type": "ref", "value": "x" }],
  "keywords": {
    "from": { "type": "string", "value": "x.md" },
    "with": { "type": "identifier", "value": "v1" }
  },
  "span": { "line": 1, "startCol": 1, "endCol": 42 }
}
```

## `symbolTable[]`

Each symbol:

```json
{
  "name": "x",
  "kind": "witness",
  "bindingLine": 1,
  "metadata": {
    "identity": "v1",
    "source": "x.md",
    "imported": false
  }
}
```

## `diagnostics[]`

Each diagnostic:

```json
{
  "code": "SH007",
  "severity": "error|warning|info",
  "phase": "parse|kind|shape|runtime",
  "message": "closure attempt requires provenance-bearing return on the active path",
  "span": { "line": 12, "startCol": 1, "endCol": 24 },
  "refs": ["@receipt_a"]
}
```

## `compileState`

Structural compiler verdict:

- `blocked`: one or more hard errors
- `warning`: zero hard errors, one or more warnings
- `clean`: no hard errors, no warnings

## `runtimeState`

Runtime lifecycle state represented in compile-facing artifact:

- `open`
- `awaiting`
- `returned`
- `closed`

## `closureType`

Terminal closure verb when present:

- `seal|flag|stop|reroute|attest|null`

## `mergedWindowState`

Computed by compiler precedence:

`shape_error > flagged > awaiting > attested > rerouted > stopped > sealed > open`

No renderer may override this.

## `assemblyGraph`

Minimum:

```json
{
  "nodes": [],
  "edges": [],
  "activeClosureLine": 0
}
```

## 4) Compatibility Rules

1. Additive optional fields: no required version bump, but changelog entry required.
2. Breaking changes (rename/remove/type or required-field changes): version bump + migration doc required.
3. Renderers must fail closed on incompatible `artifactVersion`.

## 5) Runtime Interaction Rules

Compiler artifact is read-only input for runtime orchestration.
Runtime outputs (events, receipts, state transitions) are separate append-only records and must reference:

- `compilationId`
- `windowId`
- `source hash`

## 6) Validation Strategy

1. JSON schema validation in CLI path.
2. Snapshot tests on fixture corpus.
3. Contract test asserting:
   - deterministic `windowState`
   - deterministic diagnostic ordering
   - stable spans for unchanged source
