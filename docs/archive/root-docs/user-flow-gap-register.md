# Loegos User Flow Gap Register

**Status:** Prioritized findings from the user-story audit  
**Scope:** Gaps that matter to the live beta and to north-star evolution

---

## Summary

No `P0` blocker is visible in the code-and-doc audit. The core Box loop is real and the biggest launch-surface issues have already been closed.

The most important current work is now:

- reduce shell complexity
- finish runtime verification, especially on mobile
- make provenance and trust more visible
- keep multimodal and multi-human stories explicitly future-scoped until the UX catches up

## Gaps

| Gap ID | Story IDs | What breaks or confuses | Why it matters | Severity | Recommended next action | Blocks |
|---|---|---|---|---|---|---|
| `GAP-01` | `MOBILE-01`, `RESUME-01` | The current code expresses the right mobile model, but full runtime verification of phase switching, sheets, and resume behavior is still incomplete. | Mobile is secondary, but it still must preserve the product model and avoid surprising state changes. | `P1` | Complete the manual runtime checklist and tune mobile sheet choreography where needed. | live beta |
| `GAP-02` | `SUP-02`, `SUP-04` | Intake recovery and playback/recorder fallback copy are better than before, but still uneven across flows. | The trust bar depends on clearly saying what failed, what was preserved, and what to do next. | `P1` | Normalize recovery language and next-step guidance across intake, playback, voice capture, and Operate failure states. | live beta |
| `GAP-03` | `THINK-02`, `THINK-03`, `CREATE-02`, `OPERATE-01` | `WorkspaceShell.jsx` still owns too much orchestration even though many surfaces have been extracted. | Shell complexity is the main drag on future clarity, testing, and multimodal growth. | `P1` | Continue the component extraction plan and move more behavior behind Box/Think/Create/Operate view-model ownership. | live beta and north-star |
| `GAP-04` | `THINK-01`, `OPERATE-01`, `RECEIPT-01` | Source provenance and trust are present in the substrate, but still only lightly visible in the UI outside Operate and source badges. | Loegos promises honest signal handling, so provenance needs to become more legible over time. | `P2` | Add clearer provenance/trust hints in Think, Box home, and Receipts without overloading the `1.0` UI. | live beta and north-star |
| `GAP-05` | `NS-01`, `NS-03` | Image-first and mixed multimodal Boxes are conceptually defined and partially supported by substrate, but not productized in the live UI. | These stories are promising, but shipping them early would overstate what the product can currently support well. | `P3` | Keep them future-scoped until a visual-source vertical slice lands end-to-end. | north-star only |
| `GAP-06` | `NS-04`, `NS-05` | Multi-human attribution and human-state sources are spec-level only. | They matter to the doctrine, but they are not yet honest live-product stories. | `P3` | Keep them documented, but do not expose them in the live product until provenance, trust, and UI flows are implemented together. | north-star only |
| `GAP-07` | `NS-06` | Deep analysis is intentionally deferred, and the product still only exposes a light live subset through Operate. | This is the right sequencing choice, but it needs to stay explicit so doctrine does not leak into primary navigation. | `P3` | Keep advanced analysis inside future Operate work and avoid promoting it in the shell until it is truly earned. | north-star only |

## Recommended Order

1. Finish manual desktop/mobile runtime verification.
2. Normalize failure and fallback language across the loop.
3. Continue extracting shell behavior into clearer phase owners.
4. Improve provenance visibility in the existing UI.
5. Only then promote the first multimodal vertical slice.
