# Feedback Synthesis 07

## Combined Phase-1 Plan Review

Date: 2026-04-06
Status: Final combined feedback
Purpose: Convert the latest phase-1 plan review into one execution-facing note that is stable enough to carry into implementation planning.

## Document Under Review

- Phase 1 Plan — Inline Layer-1 Operate Workspace

## Related Inputs

- [Current State Assessment](../../current-state-assessment.md)
- [Solution Architecture v0.1](../Solution%20Architecture%20v0.1/Solution%20Architecture%20v0.1.md)
- [The De-obfuscation Experience](../The%20De-obfuscation%20Experience/The%20De-obfuscation%20Experience.md)
- [Inference Authority Rules v0.1](../Inference%20Authority%20Rules%20v0.1/Inference%20Authority%20Rules%20v0.1.md)
- [Feedback Synthesis 06](./06-developer-7-synthesis.md)

## Core Read

This is a strong phase-1 plan.

It is the first plan in the pivot set that feels simultaneously:

- product-correct
- architecture-aware
- narrow enough to execute

Its biggest success is that it does not pretend phase 1 is the whole future system.

Instead, it respects the real repo and chooses the right first move:

- preserve the existing `source -> seed -> operate -> evidence -> receipt` spine
- remove trust-breaking behavior
- make Operate an inline reveal
- keep phase 1 Layer-1-only
- ship the first honest de-obfuscation loop before building broader inference authority

That is the right sequence.

## Strongest Convergence

The following should now be treated as highly stable decisions.

### 1. Stage A before Stage B is correct

The plan is right to stabilize the shell and trust boundary before building the new document-first loop.

This matters because the current repo does not primarily need more features.
It needs:

- safer seams
- explicit service truth
- less behavioral ambiguity

### 2. `Bridge then replace` is the right rollout

The plan correctly avoids a hard switch.

Keep:

- legacy `listen`
- legacy launchpad access
- current receipt path

But remove them from the default desktop path while the new document-first path becomes primary.

That is the safest way to pivot a real product rather than restart it.

### 3. The existing seed / assembly document is the right phase-1 surface

This is a very strong decision.

Do not invent a new top-level artifact just to express the new idea.
The current assembly/seed document already carries the working truth of the product and is the right object to promote.

### 4. Inline Operate is the essential product move

This is the most important surface decision in the whole plan.

The product should feel like:

- I wrote something
- I pressed Operate
- I saw what was grounded, weak, missing, or contradicted

not:

- I navigated into another room
- I read a separate phase-specific surface

This is the transition from symbolic workspace to usable compiler.

### 5. Silent fallback removal is non-negotiable

This is not just implementation cleanup.
It is a trust rule.

The current fallback behavior in [route.js](/Users/denizsengun/Projects/AR/src/app/api/workspace/ai/route.js) is incompatible with the new inference posture.

Working rule:

- if OpenAI is unavailable, Operate fails visibly
- no heuristic substitute may masquerade as normal Operate behavior

### 6. `ReaderOperateRun` plus `ReaderAttestedOverride` is the right phase-1 persistence model

This is the right level of ambition.

It gives phase 1:

- persisted inspectability
- stale detection
- override auditability
- no premature normalization of every finding into separate tables

This matches the architecture doc’s discipline well.

## Best Planning Tightenings

These are not blockers.
They are the most important sharpenings to lock before implementation starts.

### 1. Do not overload the word `receipt`

This is the biggest naming problem in the plan.

In the product, `Receipt` already means the downstream compiled / sealed artifact.
If Operate payloads are also called `receipts`, the system will blur its own trust boundary.

Working recommendation:

- use `finding`, `inspect payload`, or `inference receipt` for Operate output
- reserve `receipt` for the final build artifact

### 2. Relax the `4k lines` Stage A target

The intent is correct.
The exact threshold is too rigid to be the gate.

The real success metric is not an arbitrary line count.
It is:

- a thinner orchestration shell
- stable seams
- removed silent fallback
- passing lint/build
- preserved source / Operate / receipt flow

Working recommendation:

- keep `4k` as directional pressure
- do not make it the only definition of done

### 3. Define `sourceFingerprint` exactly

The plan is right to make stale detection first-class, but the fingerprint inputs need to be explicit.

Working recommendation:

`sourceFingerprint = hash(working document content + ordered list of included source document keys + included source updatedAt values + active override ids/updatedAt values)`

If overrides affect trust and inspectability, they belong in staleness truth.

### 4. Version persisted Operate runs

`payloadJson` should not be schema-anonymous.

Working recommendation:

- `schemaVersion`
- `engineKind`
- `engineVersion`
- `modelName`
- optionally `promptVersion`

This will matter the moment overlay output evolves.

### 5. Make override rendering a distinct visible state

The plan correctly says overrides do not masquerade as source-grounded green.
That rule must be visible, not only stored.

Working recommendation:

- use a distinct override indicator
- keep it visually separate from normal green
- surface it in inspect, preflight, and final receipt context

If the user cannot instantly tell the difference, the trust rule is not really implemented.

### 6. Pin stale-run behavior on arrival

The plan should explicitly state what happens when the document changes while Operate is in flight.

Working recommendation:

- compare returned fingerprint against current fingerprint on response arrival
- if mismatched, persist the run but mark it stale immediately
- never silently apply stale output as current truth

### 7. Define span invalidation behavior

Span offsets are fragile.
The plan already assumes conservative span use, which is correct.
But edits will still invalidate offsets.

Working recommendation:

- store `blockId + spanStart/spanEnd + excerpt snapshot`
- when block text changes, mark affected span results and overrides stale or orphaned
- surface that clearly in inspect

## Architectural Read

This plan is strong because it stays aligned with the architecture instead of drifting back into concept expansion.

It correctly preserves:

- the load-bearing backend spine
- the Layer-1-first authority model
- the de-obfuscation experience as the user-facing north star

And it correctly defers:

- Layer 2 conviction
- domain enforcement
- canon as anything other than posture
- advisory pattern libraries
- full always-on word compilation

That means the plan is solving the right problem:

not missing features,
but the mismatch between product truth, surface truth, and shell architecture.

## Final Verdict

This plan is ready to carry into implementation planning.

The most important thing it does is simple:

**it turns Operate from a destination into a property of the document.**

That is the pivot.

If the architecture doc made the direction believable, this plan makes it executable.

## Carry Forward

Unless later evidence materially improves on these points, the following should now be treated as active guidance:

- phase 1 is desktop-first
- phase 1 is Layer-1-only for visible signal determination
- the existing assembly/seed document is the primary working surface
- Operate becomes inline, not separate-surface first
- silent fallback must be removed, not cosmetically hidden
- `ReaderOperateRun` and `ReaderAttestedOverride` are the correct phase-1 persistence additions
- `Receipt` naming should stay reserved for the downstream build artifact
- shell decomposition is part of the product solution, not background cleanup

The phase-1 plan should now move into execution planning, not another identity round.
