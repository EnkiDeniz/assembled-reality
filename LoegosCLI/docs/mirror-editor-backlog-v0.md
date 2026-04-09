# Mirror + Editor Backlog v0

Date: 2026-04-09  
Status: Prioritized

## P0 - Must Build First

0. **Protect intake + player before shell rewrite**
   - freeze requirements for add/import and voice-over playback flows
   - extract these as stable modules before replacing shell

1. **Compiler-backed mirror state**
   - remove heuristic state inference from mirror prototype
   - consume `windowState` directly from compile artifact

2. **Sentence reveal by source span**
   - each Seven segment maps to one or more clause lines
   - tapping segment highlights exact compiled line(s)

3. **Proposal gate (no direct mutation)**
   - input: Seven proposal payload
   - output: accepted patch set or rejection diagnostics
   - canonical state updates only after successful compile

4. **Editor reads artifact only**
   - remove local ad-hoc parsing from editor view
   - feed tokenized lines + diagnostics + state from compiler output

5. **Fixture-driven CI check**
   - every SH/SW reference in UX demos validated by fixture tests

## P1 - Strong Next Layer

1. **Multi-file workspace in editor**
   - file tree with state dots from each file artifact
   - active tab compile status

2. **Diagnostic UX refinement**
   - primary error inline
   - expandable secondary diagnostics
   - jump from diagnostics panel to line span

3. **Mirror evidence/story ratio indicator**
   - visual pressure indicator when story outweighs evidence
   - directly tied to clause counts in artifact

4. **Runtime handshake stubs**
   - `issueMove`, `appendReturn`, `applyClosure` service boundaries
   - no fake runtime transitions in UI

## P2 - After Core Stability

1. Ledger surface
2. Real adapter integrations (shell/http/queue)
3. Voice intake + segment proposal pipeline
4. Multi-box scan and filters

## Explicit Anti-Goals (for now)

1. No new free-form AI behaviors that bypass compiler gate.
2. No UI-only state sources.
3. No branching control-flow features.
4. No speculative runtime without receipt/event persistence.
5. No redesign that regresses content-intake or voice-over player reliability.

## First Sprint Checklist (5-day)

1. wire artifact contract into CLI output (`artifactVersion`, `tokenizedLines`, `windowState`)
2. add proposal gate stub module (`validateProposal -> compile -> apply`)
3. adapt prototype mirror to read contract output only
4. adapt prototype editor to read contract output only
5. add snapshot tests for 5 fixture files
