# Loegos User Story Runtime Checklist

**Status:** Manual QA checklist for the user-story audit  
**Scope:** Runtime/browser verification for the live Box loop

---

## How To Use This Checklist

This checklist is the runtime companion to `docs/user-story-audit.md`.

Use these statuses only:

- `Pass`
- `Pass with friction`
- `Fail`
- `Untested`

Unless a story has been manually exercised in a browser, leave it as `Untested`.

## Desktop Core Loop

| Story ID | Scenario | Entry point | Expected result | Status | Notes |
|---|---|---|---|---|---|
| `AUTH-01` | Sign in from landing with Apple | `/` | user reaches `/workspace` and sees a coherent first state | `Untested` |  |
| `AUTH-01` | Sign in from landing with magic link | `/` | magic link flow succeeds and lands coherently | `Untested` |  |
| `BOX-01` | Open an existing Box from `Boxes` | Boxes index | selected Box opens into Box home | `Untested` |  |
| `BOX-01` | Create a new Box | Boxes index / Box management | new Box appears and opens | `Untested` |  |
| `BOX-02` | Understand Box home at a glance | Box home | user can identify next move, current position, proof, and sources | `Untested` |  |
| `BOX-03` | Rename a Box | Box management | Box title updates cleanly | `Untested` |  |
| `BOX-03` | Delete a non-default Box | Box management | work moves into default Box and user is redirected coherently | `Untested` |  |
| `THINK-01` | Add a text or document source | Box home / intake | source appears in the Box and is readable | `Untested` |  |
| `THINK-01` | Add a link source | Box home / intake | link becomes a readable source | `Untested` |  |
| `THINK-01` | Add a voice source | Speak note | voice memo becomes a readable/listenable source | `Untested` |  |
| `THINK-02` | Open a source and listen | source row / source rail | source opens, playback works, block focus remains usable | `Untested` |  |
| `THINK-03` | Ask Seven about the active source | Seven panel | thread loads, response appears, context is document-scoped | `Untested` |  |
| `CREATE-01` | Stage selected source blocks | active source | staging updates and preserves lineage | `Untested` |  |
| `CREATE-01` | Stage Seven output | Seven panel | accepted reply appears in staging | `Untested` |  |
| `CREATE-02` | Assemble from staging | Create phase | Assembly is created or updated and becomes the working artifact | `Untested` |  |
| `CREATE-02` | Edit the Assembly | Create phase | block edit saves and save state is understandable | `Untested` |  |
| `OPERATE-01` | Run Operate on a populated Box | workspace header | Operate result shows diagnosis and next move | `Untested` |  |
| `OPERATE-02` | Ask Seven to audit Operate | Operate result | Seven opens with the correct document context | `Untested` |  |
| `RECEIPT-01` | Draft a local receipt from document or Assembly | Receipts / Operate | local receipt draft succeeds | `Untested` |  |
| `RECEIPT-02` | Connect GetReceipts from the receipt moment | Receipts surface | connect flow is discoverable and coherent | `Untested` |  |
| `RECEIPT-02` | Push a receipt to GetReceipts when connected | Receipts / Operate | local draft succeeds and remote push succeeds | `Untested` |  |
| `RESUME-01` | Return later and reopen the Box | Boxes index | Box home makes resume easy | `Untested` |  |

## Desktop Edge Cases

| Story ID | Scenario | Entry point | Expected result | Status | Notes |
|---|---|---|---|---|---|
| `BOX-02` | Empty Box | new Box | empty states are understandable and actionable | `Untested` |  |
| `BOX-02` | Guide-only Box | default Box with only built-in guide | Box does not overclaim readiness; next move is clear | `Untested` |  |
| `OPERATE-01` | Sparse Box with one real source | Box with single source | Operate runs honestly without overclaiming | `Untested` |  |
| `CREATE-02` | No current Assembly | Create phase | user can still understand what to do next | `Untested` |  |
| `SUP-01` | Delete a source document | source row / document tools | delete succeeds and Box state stays coherent | `Untested` |  |
| `SUP-02` | Unsupported or beta intake path | intake surface | user gets clear message and safe fallback | `Untested` |  |
| `SUP-02` | Failed upload or link import | intake surface | failure message includes useful next step | `Untested` |  |
| `SUP-03` | Save conflict / reload latest | block edit flow | conflict is visible and recovery path works | `Untested` |  |
| `SUP-04` | Playback unavailable | source reader | user understands fallback path | `Untested` |  |
| `RECEIPT-02` | GetReceipts remote failure | receipt draft flow | local draft still succeeds | `Untested` |  |

## Mobile Coherence

| Story ID | Scenario | Entry point | Expected result | Status | Notes |
|---|---|---|---|---|---|
| `MOBILE-01` | Open Box and switch between Think and Create | mobile workspace | phase change is legible and not cramped | `Untested` |  |
| `MOBILE-01` | Open Seven on mobile | mobile workspace | Seven sheet opens cleanly and thread remains usable | `Untested` |  |
| `MOBILE-01` | Open staging on mobile | mobile workspace | staging sheet is reachable and coherent | `Untested` |  |
| `MOBILE-01` | Run Operate on mobile | mobile workspace | Operate remains clearly reachable and result is usable | `Untested` |  |
| `MOBILE-01` | Reach Receipts on mobile | mobile workspace | Receipts are reachable without losing context | `Untested` |  |
| `MOBILE-01` | Playback while using sheets | mobile workspace | playback remains stable and understandable | `Untested` |  |

## North-Star Validation Placeholders

| Story ID | Scenario | Entry point | Expected result | Status | Notes |
|---|---|---|---|---|---|
| `NS-01` | Image-first Box | future visual-source intake | image behaves as a first-class source | `Untested` | future vertical slice |
| `NS-02` | Voice-first Box | Speak note | voice-only loop feels complete | `Untested` | currently partial |
| `NS-03` | Mixed multimodal Box | mixed intake | Operate and Create remain coherent across modalities | `Untested` | future vertical slice |
| `NS-04` | Attributed multi-human Box | future shared entry | attribution remains visible end-to-end | `Untested` | future architecture |
| `NS-05` | Human-state source | future source entry | explicit human-state source behaves honestly | `Untested` | future architecture |
| `NS-06` | Earned deep analysis | future Operate diagnostics | deeper analysis only appears when justified | `Untested` | future architecture |

## Audit Notes

- Desktop should be verified first.
- Mobile should be verified second, with the same Box fixtures.
- Any `Fail` or `Pass with friction` result should be copied into `docs/user-flow-gap-register.md`.
