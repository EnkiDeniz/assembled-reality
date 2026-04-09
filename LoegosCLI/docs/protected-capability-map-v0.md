# Protected Capability Map v0

Date: 2026-04-09  
Milestone: M2 (Protected Capability Extraction)

## 1) Protected UI Capabilities

Only two UI capabilities are protected during shell reset:

1. Content intake
2. Voice-over player

All other UI surfaces are replaceable.

## 2) Content Intake Contract

## Required user actions

- upload files
- paste text
- import link

## Existing API routes (authoritative)

- `POST /api/workspace/folder` (bundle/file upload)
- `POST /api/workspace/paste` (paste intake)
- `POST /api/workspace/link` (link import)
- `POST /api/documents` (single file upload path)

## Required behavior

- intake creates source/witness records with provenance
- returns next openable document/project references when available
- errors are user-visible and non-silent

## Adapter boundary

LoegosCLI shell uses a dedicated intake adapter layer that calls these endpoints and normalizes responses.

## 3) Voice-Over Player Contract

## Required user actions

- play/pause
- skip/seek within queued items
- change provider/rate
- resume from saved listening session

## Existing API routes (authoritative)

- `POST /api/seven/audio` (cloud voice synthesis + provider fallback)
- `GET /api/reader/listening-session?documentKey=...`
- `PUT /api/reader/listening-session`

## Required behavior

- preserve active listening node + rate + provider preferences
- support cloud voice and device speech fallback paths
- handle provider failures with explicit user-safe errors

## Adapter boundary

LoegosCLI shell uses a dedicated voice adapter layer for synthesis and listening-session persistence.

## 4) Regression Smoke Checklist (run after UI milestones)

## Intake checks

1. Upload route can import at least one file and returns document/project handle.
2. Paste route persists source and returns openable document key.
3. Link route imports URL and returns openable document key.
4. Error handling works for invalid payload.

## Player checks

1. Audio request succeeds for valid text input.
2. Listening session GET/PUT roundtrip persists state.
3. Pause/resume behavior preserves current node.
4. Provider failure path shows clear non-crashing error.
