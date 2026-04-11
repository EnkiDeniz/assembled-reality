# Room Truth-Path Test Report

Date: 2026-04-11
Status: Complete
Scope: Focused Room truth-path backend-first and route-level verification

---

## Summary

We ran the current focused Room truth-path suite and it passed cleanly.

- Command:

```bash
node --test tests/room-route-journeys.test.mjs tests/room-turn-journeys.test.mjs tests/room-first-workspace.test.mjs tests/room-preview-state.test.mjs tests/room-advisory-seam.test.mjs tests/room-adjacent-lanes.test.mjs tests/room-session-reset.test.mjs tests/room-turn-policy.test.mjs tests/echo-field-state.test.mjs tests/echo-ripple-signal.test.mjs LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs
```

- Total tests: `50`
- Passed: `50`
- Failed: `0`
- Cancelled: `0`
- Skipped: `0`
- Todo: `0`

The suite now proves:

- service-core Room truth path
- route-level Room truth path
- route-level receipt/runtime completion path
- preview vs canon separation
- session vs box separation
- runtime truth entering only through lawful return/apply paths
- contradiction blocking seal before canon change
- malformed model payload fallback through the live route
- conversation-mode stripping of illegal proposal structure
- stale preview apply blocked across concurrent conversations
- Shape Library remaining outside the live Room path

---

## Notes

- The run emitted Node module-type warnings for a few ES module files. These did not affect correctness.
- Journey dossiers are available under [test-results/room-turn-journeys](/Users/denizsengun/Projects/AR/test-results/room-turn-journeys).
- Route dossiers are available under [test-results/room-route-journeys](/Users/denizsengun/Projects/AR/test-results/room-route-journeys).

---

## Results By File

### [LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs](/Users/denizsengun/Projects/AR/LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs)

- PASS — `maps Seven root-suggest response into compiler-gated proposal clauses`
- PASS — `rejects empty mapped proposal at gate boundary`

### [tests/echo-field-state.test.mjs](/Users/denizsengun/Projects/AR/tests/echo-field-state.test.mjs)

- PASS — `echo field state shifts from awaiting to mapped after return compile cycle`

### [tests/echo-ripple-signal.test.mjs](/Users/denizsengun/Projects/AR/tests/echo-ripple-signal.test.mjs)

- PASS — `deriveDistantEchoSignal emits ripple when return maps field without new ping`
- PASS — `deriveDistantEchoSignal returns null without a field-clearing return`

### [tests/room-adjacent-lanes.test.mjs](/Users/denizsengun/Projects/AR/tests/room-adjacent-lanes.test.mjs)

- PASS — `room workspace carries focused witness and adjacent operate as non-canonical side lanes`

### [tests/room-advisory-seam.test.mjs](/Users/denizsengun/Projects/AR/tests/room-advisory-seam.test.mjs)

- PASS — `sparse advisory context resolves to insufficient witness`
- PASS — `starter-prior and personal-field adapters normalize into a stable non-canonical contract`
- PASS — `live room routes do not import the advisory seam yet`
- PASS — `advisory context builder stays pure and exposes the future seam shape`

### [tests/room-first-workspace.test.mjs](/Users/denizsengun/Projects/AR/tests/room-first-workspace.test.mjs)

- PASS — `workspace route and room api surface are wired for canonical room-first entry`
- PASS — `room canonical pipeline uses gate, compiler/runtime helpers, and hidden assembly documents`
- PASS — `strict ping rule, mirror regions, and receipt artifact support remain encoded in the room layer`

### [tests/room-preview-state.test.mjs](/Users/denizsengun/Projects/AR/tests/room-preview-state.test.mjs)

- PASS — `preview state marks latest accepted proposal active and earlier ones superseded`
- PASS — `applied latest preview does not resurrect older superseded previews`
- PASS — `preview messages do not alter canonical field state or mirror`

### [tests/room-route-journeys.test.mjs](/Users/denizsengun/Projects/AR/tests/room-route-journeys.test.mjs)

- PASS — `turn route exposes preview without mutating canon`
- PASS — `turn route keeps invalid ping blocked and non-canonical`
- PASS — `apply route is the canonical mutation boundary`
- PASS — `turn route passes handoff into prompt context without mutating canon`
- PASS — `turn route blocks seal when contradiction is unmediated`
- PASS — `turn route falls back safely when the model payload is malformed`
- PASS — `turn route strips illegal proposal structure when the requested mode is conversation`
- PASS — `blocked apply route does not mutate canon`
- PASS — `complete_receipt_kit route records return through the real apply path`
- PASS — `concurrent session previews do not fork canon and stale apply is rejected`

### [tests/room-session-reset.test.mjs](/Users/denizsengun/Projects/AR/tests/room-session-reset.test.mjs)

- PASS — `compiler-first reset and explicit room sessions are encoded in the workspace layer`

### [tests/room-turn-journeys.test.mjs](/Users/denizsengun/Projects/AR/tests/room-turn-journeys.test.mjs)

- PASS — `empty_box_aspiration stays conversational and non-canonical`
- PASS — `concrete_problem_emerges creates a lawful preview without mutating canon`
- PASS — `invalid_ping_rejected blocks before canon changes`
- PASS — `preview_then_apply changes canon only at apply`
- PASS — `report_return mutates runtime only through lawful apply`
- PASS — `same_box_new_conversation changes continuity without forking canon`
- PASS — `handoff_affects_prompt_not_canon changes prompt context without changing box truth`
- PASS — `contradicting_return_blocks_seal keeps closure non-canonical until mediated`
- PASS — `preview_reload_without_apply preserves preview while canon stays unchanged`
- PASS — `proposal_superseded_by_later_turn keeps earlier preview non-canonical and superseded`
- PASS — `authority_context_consistency stays aligned across initial, turn, and apply stages`
- PASS — `shape_library_not_in_room_path keeps the room truth path independent`

### [tests/room-turn-policy.test.mjs](/Users/denizsengun/Projects/AR/tests/room-turn-policy.test.mjs)

- PASS — `safe fallback returns plain conversation only`
- PASS — `classifier keeps early aspiration and low-signal turns in conversation mode`
- PASS — `classifier keeps general questions conversational even after structure exists`
- PASS — `classifier allows concrete observations and explicit structure requests into proposal mode`
- PASS — `semantic audit rejects conversational MOV/TST disguised as a real-world move`
- PASS — `semantic audit rejects screenshot references that are not present in room context`
- PASS — `semantic audit allows observational user-stated witness but marks it as weak provenance`
- PASS — `guardrails drop structure entirely when the requested turn mode is conversation`
- PASS — `guardrails keep only segment text that is an exact assistantText excerpt`
- PASS — `assistant text normalization trims list-heavy answers into brief prose`
- PASS — `assistant text normalization enforces seven-by-seven sentence compression`

---

## What This Run Proves

### 1. Conversation, preview, canon, runtime, and session are distinct tested layers

The suite exercises these as separate truths instead of letting them blur together.

### 2. Apply remains the only canonical mutation path

Preview can be visible, lawful, blocked, superseded, or active without mutating box canon.

### 3. Runtime truth only strengthens through lawful return-bearing paths

The field becomes more real only when return/apply behavior records runtime-bearing change.

### 4. Contradiction blocks premature closure

The Room and route layer both now prove that a contradiction on the active path prevents `CLS seal` from becoming canonical until it is mediated.

### 5. Route behavior matches service-core behavior

The API layer exposes the same truth-path that the backend-first journey harness already proved.

### 6. The live route now proves more than happy-path preview/apply

The route suite now covers malformed model output, blocked apply, real receipt completion, and concurrent conversations trying to orbit the same canon.

---

## Best Next Steps

1. Add `contradicting_return_blocks_seal` and concurrent-session dossier/report examples to team review material.
2. Add browser truth-path confirmation so the frontend is proven to present the same distinctions cleanly.
3. Add stronger multi-turn route journeys that combine:
   - preview supersession
   - apply
   - later return
   - contradiction / mediation / closure
