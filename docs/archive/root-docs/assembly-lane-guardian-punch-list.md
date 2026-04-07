# Assembly Lane Guardian Punch List

Compiled from initial review, precision visual pass, developer commits through
fe17ea7, protocol-visibility discussion, and mobile redesign audit on 2026-04-05.

Guardian scope: (1) product coherence, (2) UX and design precision.

---

## Priority framing

The lane's job is to make the user feel the protocol running:

**I declared → I shaped → I tested → I compared → I rerouted or sealed.**

The protocol strip and contextual verb are now shipped (fe17ea7). The focus
shifts to: (a) ensuring the redesign work doesn't break what we just built,
(b) extending design precision to the surfaces around the lane.

---

## Tier 1 — Protocol visibility (SHIPPED)

### T1.1 Protocol position strip — DONE (fe17ea7)
`Collecting · Shaping · Proving` with root-optional behavior. Active step
uses assembly gradient color. Public demo shows `Proving`, no contextual
action (correct — read-only).

### T1.2 Contextual lane verb — DONE (fe17ea7)
`Shape seed` / `Run Operate` / `Seal` — wired through existing flows.
Conservative selection from durable box facts only.

### T1.3 Per-entry protocol semantics — DEFERRED
Per developer agreement: surface on selection/inspection, not as badges.

### T1.4 Operator chain visibility — FUTURE MILESTONE
Depends on T1.3 and durable Operate/receipt history in the lane.

---

## Tier 2 — Mobile Redesign Audit (incoming work)

The parallel redesign audit covers 26 items across rendering bugs, layout,
interaction, color, and copy. Guardian notes on each batch:

### Batch 1 — Rendering bugs (audit items 1-4)

**Guardian concern on #1 (escaped markdown in titles):** This affects the
lane directly — source entries show `\# The Meaning Operator` as their
title. The fix should happen in the title normalization layer, not in every
rendering component. Check that the lane entries pick up the fix after it
lands — `entry.title` is set from `document.title` in `box-view-models.js`.

**#2 (No content yet):** Self-assembly pipeline uses this string in
`self-assembly.js` and `document-blocks.js`. Fix at the source — either
strip underscore wrapping or use a plain string. Affects both workspace
and public demo.

**#3 (Player scroll):** Not a lane issue. The listen controls have
`position: sticky` on `.assembler-listen__chrome` but the player transport
may need its own sticky/fixed positioning. Verify after fix — the listen
surface is the main surface users return to from lane entries.

**#4 — no comment, clear bug.**

### Batch 2 — Compress mobile chrome (audit items 4-8)

**Guardian concern on #4 and #5 (RootBar and top nav):** These sit above
the lane on mobile. The RootBar currently burns ~80px. Compressing it is
correct. BUT: the root text is protocol-significant — it's the "declared"
anchor of the whole lane. If it becomes too compressed or disappears on
mobile, the user loses the declared origin. Recommended: keep root text
visible but inline, not on its own row.

**#5 (nav bar):** Collapsing to `LŒGOS · [BOX NAME ▾]` is good. The
document title in the nav bar currently shows the escaped markdown title
(bug #1). After both fixes land, verify the popover pattern from #14
doesn't conflict with the box selector popover already in the instrument bar.

**#6-8 (confirmation dialog sizing):** The confirmation dialog is part of
the protocol — it's where the user decides what evidence matters. Reducing
tag buttons from 80px tiles to 28-36px chips is correct (they're selection
toggles, not action cards). But: the domain chips should still respect the
assembly domain system. Don't just show "applicable" domains based on root —
show applicable domains prominently, others dimmed but reachable. Hiding
domains entirely could cause the user to miss a relevant one.

### Batch 3 — Strip noise from cards (audit items 9-13)

**Guardian concern on #9 (source card badges):** NOTE: The lane entries
already show only 2 badges (stage + proof) as of fe17ea7. Item #9 appears
to reference the source library cards on the self-assembly page, which show
2-3 metadata chips (evidence basis, chronology authority, history kind).
These are NOT lane entry badges. Reducing them to 1 is fine for scanning
but verify the audit is targeting the right component. The lane entries
are already fixed.

**#10 (trust profile sentence):** Agree — remove from card surfaces. The
trust summary is still available in the lane entry as quiet text, which is
the right place for it. Don't remove it from `box-view-models.js` — just
stop rendering it on cards outside the lane.

**#11 (receipt buttons):** Agree — inline row. But: "Seal" is the most
important protocol verb. It should be visually primary (not just inline).
The lane's contextual verb already offers "Seal" — the receipt surface
buttons should feel like the same action, not a different interface.

**#12 (listen controls to Lucide icons):** Good — aligns with the
instrument bar pattern. Use same 32px/16px/1.7 convention. Verify that
the icons chosen (SkipBack, Rewind, Play/Pause, FastForward, SkipForward)
match what the controls actually do — the current PREV/NEXT skip between
blocks, not tracks, so `ChevronLeft`/`ChevronRight` might be more honest
than `SkipBack`/`SkipForward`.

**#13 (duplicate LOCAL ONLY):** Clear bug. One badge.

### Batch 4 — Interaction improvements (audit items 14-18)

**Guardian concern on #14 (document picker popover):** Good idea. This is
effectively Think-from-the-chrome — tap the document title, see your
sources, switch. This aligns with T2.3 (Think as a mode entered from the
lane/chrome, not a separate destination). When building, consider: the
popover should show documents sorted by lane relevance (linked entries,
stage status), not just recency.

**#15 (swipe navigation):** Good for mobile feel. Verify that the phase
order makes sense: Lane → Listen → Seed → Receipts. This maps roughly to
Collecting → Shaping → Proving. If the protocol strip exists, swiping
between phases should feel like moving through the protocol, not just
switching tabs.

**#17 (root bar edit affordance):** Agree — but keep it quiet. The root
is important but should not demand attention. A subtle dashed underline or
pencil icon is better than a pulse animation. The protocol strip already
shows the user they're in `Collecting` — adding a pulse to the root bar
would create competing "do this first" signals.

### Batch 5 — Color sweep (audit items 19-22)

**Guardian assessment:** All four items are Creep Law violations — colors
that encode no data or use legacy tokens instead of assembly tokens.

**#19 (Seven chips):** The `--purple` variable is actually `#339cff`
(same as `--accent-ready`/`--assembly-step-1`), so the color value is
already correct but the naming is misleading. Clean up by replacing
`var(--purple)` references with `var(--assembly-step-1-soft)` /
`var(--assembly-step-1-border)`. Only 1 usage of `var(--purple)` remains
in globals.css (block editor saving status).

**#20 (progress bar dot):** Should use assembly tone. The current assembly
state color would be ideal — the dot changes color as the box advances.
This is a small touch that encodes real data (box state = color).

**#21 (add link button):** Standard token swap.

**#22 (seed card highlight):** Use assembly tone. The seed is the live edge —
it should carry the assembly gradient color for its current state, not a
hardcoded blue.

### Batch 6 — Copy compression (audit items 23-26)

**Guardian assessment:** All correct. These are explanatory sentences where
the structure should be self-evident. The lane already demonstrates the
pattern: the protocol strip says `Collecting · Shaping · Proving` instead
of explaining what assembly means. The rest of the product should follow.

#25 is the most important: "Accumulating without sealing. Close the loop."
is the operator sentence version. The current sentence dilutes it. The
compressed version *is* the operator sentence — it should replace the
explanation, not sit next to it.

---

## Tier 3 — Architecture / Data (from original punch list)

### T2.1 Event audit — PARTIAL (fe17ea7)
Small context-shape fixes landed. Full audit still open:
- [ ] Consistent shape via `buildAssemblyIndexEvent` across all routes
- [ ] Source deletion and root changes still don't write events
- [ ] Event timestamp reliability for lane sort

### T2.2 Forward links — MOSTLY DONE
- [ ] `contributedToSeed: true` still not on source entries

### T2.3 Think as lane-mode — NOT STARTED
Item #14 from the redesign audit (document picker popover) is a step
toward this. If the user can switch documents from the chrome, Think
becomes "the surface you're on when you've selected a source from the
lane/chrome" rather than a destination you navigate to.

### T2.4 Group collapsibility — NOT NEEDED YET

---

## Tier 4 — Visual / Proportional (remaining from Porsche pass)

### V1. 3-tier spacing — STILL OPEN
Internal entry gap still uniform 10px. Lower priority now that badge
row is only 28px, but still the right future move.

### V2. Detail text clamp — DONE (fe17ea7)
### V3. Badge count — DONE (fe17ea7, 2 per entry)
### V4. Badge radius — DONE (fe17ea7, 12px)
### V5. Mobile padding — IMPROVED (16px/18px, 2px gap)
### V6. Seed card heights — STILL OPEN (cosmetic)
### V7. Detail text quality — STILL OPEN (excerpt logic)
### V8. Icon radius — DONE (fe17ea7, 12px)
### V9. Icon visual weight — RESOLVED (badge reduction balanced it)
### V10. Section divider spacing — STILL OPEN (cosmetic)

---

## Tier 5 — Hygiene

### L1. Lint errors (3 remaining)
- [ ] RootEditor.jsx: unused `rootWordCount`
- [ ] SeedSurface.jsx: unused `stageCount`
- [ ] InlineAssist.jsx: setState in effect

### L2. Build — PASSES

---

## Resolved

- [x] T1.1 Protocol strip (fe17ea7)
- [x] T1.2 Contextual lane verb (fe17ea7)
- [x] Dead ternary (e987a7d)
- [x] Undated entry sort (e987a7d)
- [x] Creep Law on color tokens (8ea554d)
- [x] Lucide icons (6273f0d, 13b034f)
- [x] 3-group lane (e987a7d)
- [x] Forward links (e987a7d)
- [x] Detail clamp (fe17ea7)
- [x] Badge count reduced to 2 (fe17ea7)
- [x] Badge/icon radius to 12px (fe17ea7)
- [x] Certainty downgrade on public demo (fe17ea7)
- [x] Seed proof status tightened (fe17ea7)

---

## Status key

- [ ] Not started
- [~] In progress / partial
- [x] Done
