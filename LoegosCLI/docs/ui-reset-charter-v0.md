# UI Reset Charter v0

Date: 2026-04-09  
Status: Locked product guidance

## 1) Core Rule

The existing UI may be fully replaced except for two protected interaction capabilities:

1. **Content intake** (add/import content flow)
2. **Voice-over player** (listening/playback flow)

Everything else in the current UI is replaceable.

## 2) What Must Survive Through UI Reset

## Content Intake

Must preserve:

- fast add/import entry
- upload/paste/link pathways
- provenance-preserving source creation
- clear intake success/failure feedback

## Voice-Over Player

Must preserve:

- reliable play/pause/seek behavior
- source-following listening flow
- resume-safe listening state
- explicit provider/rate state handling

## 3) What May Be Nuked

Allowed:

- existing layout composition
- panel/tabs/navigation model
- legacy shell metaphors and route-specific UI structures
- non-essential visual scaffolding around intake/player flows

## 4) Design System Rule

New UI must stay aligned with project design system conventions as much as possible:

- use existing tokens, spacing, radius, surfaces, and text treatments
- avoid ad-hoc inline visual systems unless explicitly justified
- keep visual language calm, legible, and consistent with current product tone

## 5) Engineering Translation

During refactor:

1. Treat **intake** and **player** as protected UI capabilities.
2. Refactor by extraction:
   - isolate intake and player into stable reusable modules first
   - rebuild shell around those modules
3. Validate these two flows before every major UI milestone.

## 6) Acceptance Gate for UI Reset

A reset is invalid if either fails:

1. User cannot add/import source content reliably.
2. User cannot use the voice-over player reliably with preserved listening continuity.

If both survive and design-system alignment is maintained, full UI replacement is acceptable.
