# Lœgos vs Chat Comparison Benchmark

Date: April 11, 2026

Purpose: Run one end-to-end backend-first journey three ways and answer the actual product question:

> Is the Room with Lœgos better than a comparable conversation without Lœgos?

The comparison modes were:

1. `loegos`
   - current Room law path
   - preview, apply, canonical mutation, runtime truth, contradiction handling

2. `schema_only`
   - generic draft/apply workflow state
   - explicit intermediate structure
   - no semantic law for contradiction/closure

3. `plain_chat`
   - rolling conversational truth only
   - no preview/apply separation
   - no semantic law

## Benchmark Journey

All three modes ran the same end-to-end path:

1. user arrives vague:
   - `I want to develop an app.`
2. concrete observation emerges:
   - `We observed beta users fail after permissions.`
3. system proposes a ping-like next move
4. proposal is accepted/applied where the mode supports that
5. return comes back:
   - `The trace shows a drop at permissions.`
6. contradiction arrives:
   - `A second trace showed permissions were not the real blocker.`
7. closure is attempted:
   - `Seal this now.`
8. a second conversation opens:
   - `What is the current aim?`

## Command Run

```bash
node --test tests/room-comparison-benchmark.test.mjs
```

Result:
- `1 passed`
- `0 failed`

Artifact folder:
- [end_to_end_app_journey](/Users/denizsengun/Projects/AR/test-results/room-comparison-benchmark/end_to_end_app_journey)

Raw generated benchmark report:
- [02-report.md](/Users/denizsengun/Projects/AR/test-results/room-comparison-benchmark/end_to_end_app_journey/02-report.md)

## Scorecard

### `loegos`
- proposal requires apply: `yes`
- return requires apply: `yes`
- contradiction blocks seal: `yes`
- fresh session sees canon, not draft: `yes`
- explicit intermediate state exists: `yes`

### `schema_only`
- proposal requires apply: `yes`
- return requires apply: `yes`
- contradiction blocks seal: `no`
- fresh session sees canon, not draft: `no`
- explicit intermediate state exists: `yes`

### `plain_chat`
- proposal requires apply: `no`
- return requires apply: `no`
- contradiction blocks seal: `no`
- fresh session sees canon, not draft: `no`
- explicit intermediate state exists: `no`

## What Happened

### With `loegos`

After the concrete observation, the system created a preview, but canon did not change yet.

After apply, canon changed and the field moved into an awaiting state.

After the observed return, canon and runtime changed only through lawful apply.

After the contradictory return, canon recorded the contradiction.

When closure was attempted, the seal was blocked:
- preview status: `blocked`
- diagnostic: `contradiction must be mediated before seal`
- blocked apply returned `400`
- canon did not change

When a second conversation entered later, it saw:
- the same aim
- the contradiction still present
- no false seal

### With `schema_only`

The system preserved a draft/apply distinction:
- proposal did not immediately become canon
- return did not immediately become canon

But once contradiction was present, there was no semantic closure law.

So when closure was proposed and then applied:
- state became `sealed`
- contradiction remained in the record
- second conversation inherited that sealed state anyway

This means schema alone gave useful structure, but it did not know what a contradiction means for closure.

### With `plain_chat`

There was no meaningful preview/apply boundary:
- proposal became current truth immediately
- return became current truth immediately

Contradiction could be mentioned, but the later seal attempt still overwrote the state into `sealed`.

The second conversation inherited the sealed interpretation.

This is the most familiar failure mode of ordinary chat systems:
- proposal inflates into truth
- contradiction gets discussed but not governing
- later confidence wins

## What This Lets Us Say

This benchmark is strong enough to support these claims:

1. Lœgos is doing real work beyond plain conversation.
   - It preserves proposal/canon and return/canon boundaries that plain chat collapses.

2. Lœgos is doing real work beyond generic schema.
   - Schema can preserve a draft/apply boundary.
   - But Lœgos adds semantic law that stops invalid closure under contradiction.

3. The end-to-end journey matters.
   - The difference is not visible on the first turn.
   - It becomes visible when the journey accumulates:
     - proposed action
     - accepted plan
     - return from reality
     - contradiction
     - attempted closure
     - later handoff

## The Practical Product Meaning

If we only compared Lœgos to plain chat, the win would be:
- better truth boundaries
- less fact inflation
- better handoff

If we compare Lœgos to a serious schema-only baseline, the remaining win is narrower but more important:
- Lœgos knows when a contradiction is not just another field value
- it makes contradiction govern closure

That is the part that starts to make it feel less like “structured chat” and more like “intelligence under law.”

## Short Conclusion

This benchmark does not prove that every future user journey will be better with Lœgos.

But it does prove something important:

> On a meaningful end-to-end journey, Lœgos preserved the right boundaries and blocked a bad closure that both plain chat and a schema-only workflow allowed.

That is enough to say:
- the system works on a real journey, not only on isolated pieces
- and it is already better than a conversation without Lœgos in at least one decisive way

