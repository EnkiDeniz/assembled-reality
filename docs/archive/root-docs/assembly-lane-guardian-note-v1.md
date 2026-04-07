# Guardian Note to Developer — Assembly Lane Next Moves

**From:** Assembly Lane Guardian (Claude)
**Date:** 2026-04-05
**After:** commit 13b034f, protocol-visibility discussion with Deniz
**Punch list:** `docs/assembly-lane-guardian-punch-list.md`

---

## What you got right

The last five commits moved the lane from a proof-of-concept to a real
product surface. The strongest decisions:

1. **Creep Law.** "Every color must encode data" is a real design principle.
   It will prevent the surface from becoming decorative noise. Hold this.

2. **Event vocabulary in the view model.** Ten event types readable. Three
   groups. Forward links. Certainty kind. This is the data layer the lane
   needed. The architecture is now ahead of the rendering.

3. **Instrument bar.** Replacing text-pill chrome with a compact icon bar
   was the right trade. The lane surface gained vertical real estate and
   the chrome stopped competing with the content.

4. **Removing the masthead.** The old masthead with PRODUCT_SENTENCE and
   primary action buttons was marketing copy pretending to be UI. Stripping
   it was correct. But something was lost in the same cut — see below.

---

## What I think is next

After the discussion with Deniz about the three-layer theory stack
(Assembly Theory → Assembled Reality → Operator Sentences), my read on
what the lane needs shifted. The lane's job is not "show history" or
"display evidence." Its job is to make the user feel the protocol running:

**I declared → I shaped → I tested → I compared → I rerouted or sealed.**

That is the Assembled Reality protocol. The lane is the surface where it
should become visible. Everything below flows from that.

### 1. Show protocol position (highest priority)

The meta-strip currently tells the user how much stuff is in the box.
It does not tell them where they are in the protocol. The old summary
cards (Root / Live Edge / Proof Closure) were a rough version of protocol
position — they showed three states: "you declared," "you're shaping,"
"you sealed." They were removed, and nothing replaced that signal.

**Suggested move:** Add a compact protocol-position indicator to the
meta-strip or just below it. Not cards — something denser. Three states
with the current one active:

```
Declared → Shaping → Proving
```

Map the box's assembly state to protocol language the user can feel:

```
Collecting · Shaping · Proving
```

The data already exists in `stateSummary.chipLabel`. Render it as a
compact strip of chips with the current position visually distinct.

**Important constraint (from developer):** The strip must stay
root-optional. For early boxes it should not scream `DECLARE ROOT`.
`Collecting` is a valid starting position. The user already has the
freedom to work without root — don't reintroduce pressure.

### 2. Make one protocol verb reachable from the lane

The user should be able to take the next natural action without leaving.
Not all five verbs — just the one that matches their current position:

- Box has sources but no seed → **"Shape seed"**
- Seed exists but hasn't been Operated → **"Run Operate"**
- Operate ran but no receipt drafted → **"Draft receipt"**
- Receipt exists but not sealed → **"Seal"**

This is a single contextual button on the meta-strip or at the top of
the entries panel. The data to determine which verb applies already
exists in `stateSummary` and `receiptSummary`.

### 3. Audit event coverage and certainty rules

**Correction:** Events are already being written in multiple places:
source intake in `reader-documents.js`, block confirmation in
`confirm/route.js`, seed create/update in `workspace-documents.js`
and `seed/route.js`, receipt draft/seal in `receipt/route.js`.

The problem is not "no events." It is: are all event types written
with a consistent shape? Does `certaintyKind` correctly flip to
`"event_backed"` when events exist? Are there user actions that still
don't write events (e.g., source deletion, root changes, reroutes)?
Are timestamps reliable enough for the lane sort?

This is an audit pass, not a build-from-scratch task.

### 4. Visual pass (after the above)

The proportional issues are real but subordinate. Once protocol position
and a contextual verb are on the lane, the visual hierarchy will shift —
the protocol indicator and verb button will be the most important elements,
entry badges will become secondary, and detail text will become tertiary.
The spacing/clamping/badge fixes in V1-V10 should happen after that
hierarchy is established, not before.

The one visual fix I'd do now: **clamp detail text to 2 lines** (V2).
It doesn't depend on any structural decision, it reduces entry height
variance from 261-373px to ~280-310px, and it makes the lane immediately
less noisy. Two lines of CSS.

---

## Agreed execution order (after developer feedback)

1. Add a compact protocol-position strip (root-optional, quiet highlight).
2. Add one contextual verb from the lane.
3. Audit event vocabulary and certainty rules (events are partial-but-real).
4. Quick visual cleanup (2-line clamp first).

Per-entry protocol semantics deferred — entries are already dense. Protocol
step should surface on selection/inspection, not as another always-on badge.

---

## What I would not do next

- **Don't add more entry metadata.** The entries already carry 5 metadata
  dimensions (kind, stage, proof, evidence, certainty) rendered as 4 badges.
  That is already too dense. The next move should reduce visible metadata,
  not add more.

- **Don't make groups collapsible yet.** The 3-group split (Origin /
  Assembly / Proof) is new. Let it settle. Collapsibility adds interaction
  complexity that the lane doesn't need until it has 40+ entries.

- **Don't bring back the old masthead or summary cards.** They were the
  right shape (protocol position) in the wrong density (3 large cards
  with product copy). The replacement should be compact — a single row
  that tells you where you are, not a section that explains the product.

---

## Summary

The architecture is now ahead of the rendering. The lane knows about
events, groups, links, and certainty. But the user can't see where they
are in the protocol, and they can't take the next verb from where they
stand. Those two things — protocol position and one contextual verb —
are the moves that will make the lane stop feeling like a dashboard and
start feeling like the box's own working surface.

The visual polish comes after. But if you want one quick win while
thinking about the structural moves: clamp the detail text.

---

*Guardian role assigned by Deniz Sengun on 2026-04-05.*
*Full punch list: `docs/assembly-lane-guardian-punch-list.md`*
