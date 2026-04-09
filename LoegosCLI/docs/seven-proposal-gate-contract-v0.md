# Seven Proposal Gate Contract v0

Date: 2026-04-09  
Status: Draft

## 1) Purpose

Define the only lawful path for AI-assisted updates.

Rule:

`User input -> Seven proposal -> proposal gate -> compile -> apply -> render`

Seven cannot mutate canonical box state directly.

## 2) Proposal Payload

```json
{
  "proposalId": "string",
  "segments": [
    {
      "text": "string",
      "domain": "aim|evidence|story|move|test|observation|neutral",
      "suggestedClause": "string",
      "intent": "set|add|remove|replace"
    }
  ],
  "sourceContext": {
    "filePath": "string",
    "windowId": "string"
  }
}
```

## 3) Gate Outputs

## Accept

```json
{
  "accepted": true,
  "patches": [
    {
      "op": "insert|replace|delete",
      "line": 12,
      "content": "GND witness @lender_notes from \"lender_notes.pdf\" with v_apr9"
    }
  ],
  "compileArtifact": {}
}
```

## Reject

```json
{
  "accepted": false,
  "reason": "shape_error",
  "diagnostics": [
    { "code": "SH004", "message": "story cannot support seal without ground" }
  ]
}
```

## 4) Gate Validation Steps

1. structural validation of proposal JSON
2. clause-level sanitization (ASCII, known heads/verbs/keywords)
3. patch generation against current source
4. compile candidate source
5. reject on hard errors, return diagnostics
6. accept only with valid artifact and deterministic state

## 5) Hard Rejection Conditions

1. proposal attempts direct `windowState` override
2. proposal bypasses witness `with` identity in closure path
3. proposal introduces unprovenanced `RTN` in closure path
4. proposal introduces illegal ref kind mutation
5. proposal contains unknown head/verb combos

## 6) Audit Trail Requirements

Every accepted proposal must persist:

- `proposalId`
- `beforeSourceHash`
- `afterSourceHash`
- `compilationId`
- `appliedBy` (`human|seven|system`)
- timestamp

This makes AI-assisted changes replayable and inspectable.
