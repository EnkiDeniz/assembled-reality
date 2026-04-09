# LoegosCLI Scaffold (Stage 1)

This folder is the implementation zone for the compiler-first local cut.

## Included

- `apps/cli`: local CLI (`compile`, `run`, `status`, `return`, `fixtures`)
- `packages/compiler`: parser + kind pass + shape checker + graph emitter
- `packages/runtime`: minimal window state machine and event helpers
- `packages/fixtures`: starter lawful/failing/warning corpus
- `packages/schemas`: starter JSON schemas for compile output

## Quick Start

From `LoegosCLI/`:

```bash
npm test
npm run compile -- packages/fixtures/lawful-minimal.loe
npm run run -- packages/fixtures/lawful-minimal.loe
npm run return -- packages/fixtures/lawful-minimal.loe --verb receipt --channel user --value "confirmed"
npm run status -- packages/fixtures/lawful-minimal.loe
```

State is written under `.loe-state/` in this folder.
