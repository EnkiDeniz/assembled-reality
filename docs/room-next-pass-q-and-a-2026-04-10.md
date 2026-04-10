# Room Next Pass Q&A

Code-grounded notes captured on 2026-04-10 from the current `/workspace` Room implementation.

## 1. Empty box on `/workspace`

You see:
- a subtle fixed top-right overflow trigger
- centered welcome copy:
  - `Room`
  - `What's on your mind?`
  - `A decision. A question. Something you're carrying. Just start talking.`
- the bottom composer:
  - attachment button
  - text input
  - `Send`
  - `Listen`
  - helper line: `Plain language first. Structure wakes up only when it earns it.`

You do **not** see the mirror, state chip, header, tool row, box panel, or source panel.

The only extra element beyond prompt+composer is the overflow trigger, because box/source/create controls now live in the overlay.

## 2. First message: how the mirror appears

The canonical mirror does **not** appear immediately.

Sequence:
1. assistant reply renders inline
2. if the proposal is accepted and unapplied, `proposalWake` appears
3. only after `Apply to Room` does the canonical mirror strip mount

There is no staged timing between aim and evidence/story. Whatever sections are present in the returned proposal wake show together, and whatever compiled canonical sections exist after apply mount together.

## 3. Gibberish input

There is currently no nonsense detector.

If the message is non-empty, the fallback logic still tends to produce:
- an aim candidate
- a story or witness segment
- usually a move + test

So:
- the canonical mirror still stays hidden until apply
- an accepted proposal wake may still appear
- if the user applies gibberish, canonical structure can still mount from it

## 4. Move without test

If Seven proposes `MOV` without `TST`:
- the gate rejects it
- the proposal still reaches the UI as a blocked proposal
- the user sees diagnostics
- there is no Apply button

Current diagnostic text:
- `Ping requires both MOV and TST clauses.`

## 5. Send -> box update flow

Current flow:
1. client posts to `/api/workspace/room/turn`
2. server loads current Room view
3. server ensures hidden Room assembly document exists
4. server reads current Room source
5. server reconstructs runtime window
6. server asks Seven, or falls back to heuristic proposal building
7. server normalizes the proposal
8. server runs proposal gate against current Room source
9. server persists the conversation turn with proposal payload in citations
10. server rebuilds Room view from unchanged canonical source
11. UI shows reply / blocked state / proposal wake
12. only on `Apply to Room` does `/api/workspace/room/apply`:
   - reload canonical source
   - rerun the gate
   - compile
   - update runtime ledger
   - save the new Room source into the hidden Room document
   - return fresh canonical Room view

The `.loe` document changes only in the apply route.

## 6. If user never presses apply

Canonical structure does **not** persist.

What persists:
- the conversation thread
- the proposal payload stored in thread citations

What does not persist:
- canonical Room clauses
- canonical mirror state
- canonical field state changes

So the user can leave and come back and still see the thread and the latest unapplied accepted proposal wake, but the box itself stays unchanged until apply.

## 7. Where status chip state comes from

Current path:
1. hidden Room document markdown
2. `getRoomAssemblySource()`
3. `compileRoomSource()`
4. `createOrHydrateRoomRuntimeWindow()`
5. `buildFieldStateLabel()`
6. `view.fieldState`
7. `FieldStateChip`

The UI does not independently compute semantic field state. It only renders the already-derived state.

## 8. If conversation feels grounded but compiled state says open

Compiled truth wins.

There is no override layer that can make the canonical chip say grounded while compiled/runtime truth says open.

Conversation can wake preview structure, but canonical state still comes only from compile/runtime outputs.

## 9. Pasting a number into a receipt kit

Current clause shape for plain paste path:

```loe
RTN observe "780000" via user as score
```

For something like `$780k`, current inference is text rather than numeric score:

```loe
RTN observe "$780k" via user as text
```

This line carries:
- `via`
- `as`

It does **not** carry:
- `from`
- `with`

`user_entered` provenance is kept in the runtime receipt entry, not encoded into the clause itself.

## 10. Saying `the lender said $780k` in conversation

There is no strong lender-specific provenance extraction in Room chat right now.

In the deterministic fallback:
- it is usually treated as `INT story "..."`
- not `GND witness`
- not a receipt return

So there is a visible difference:
- conversational claim usually lands in Story
- receipt-kit return lands in Returns with predicted / actual / result / provenance

## 11. Sealing with story but no evidence

The current Room does not expose sealing at all, so the user cannot attempt this inside `/workspace`.

In the older receipt seal flow, the blocking text is:
- `Seal a receipt only after confirmed ◻ evidence exists in the box.`

The primary button label becomes:
- `Seal blocked`

## 12. Contradiction arrives and user tries to seal anyway

Again, the current Room does not provide this interaction.

In the older seal audit flow, the closest implemented warning is drift-oriented rather than contradiction-specific:
- `The Seed Aim and the current evidence are drifting apart. Seal only if you are intentionally changing the line.`

That path can still allow:
- `Seal anyway`

if there is no hard-blocking failure.

## 13. Compass

There is no compass surfaced in the current Room path.

So:
- not visible on first use
- no trigger in current Room UI
- user cannot force it on from Room

## 14. Viewing compiled `.loe` source from Room

Not implemented in current Room.

The Room view model includes:
- `roomDocument`
- `roomSourceSummary`

But the Room UI does not render a source inspector for them.

Current surfaced deep links go to `/workspace/phase1`:
- Reader
- Compare
- Operate
- Receipts
- Workbench

Compare opens the current assembly doc, not the hidden Room doc.

## 15. Ripple across boxes with imported receipts

Not implemented yet in the Room path.

What exists:
- local runtime events
- local receipt appends
- local distant echo detection when one box's own artifact changes

What does not exist:
- cross-box dependency graph
- imported receipt invalidation
- automatic recompilation of downstream boxes
- user-visible ripple in second box when first box witness changes

Conclusion:
- the echo field ripple across boxes is the right destination
- it is **not real yet** in the current implementation

## Main gaps for next pass

1. nonsense resistance / lawful refusal for weak input
2. Room-native seal / shape / closure affordances
3. Room-visible source inspection for hidden canonical Room doc
4. stronger provenance extraction from conversational claims
5. cross-box receipt ripple / import invalidation / downstream recompilation
