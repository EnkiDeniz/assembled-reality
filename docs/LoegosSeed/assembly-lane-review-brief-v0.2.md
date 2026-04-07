# Assembly Lane Review Brief v0.2

This brief accompanies the Assembly Lane protocol-visibility slice that follows the chrome-alignment pass in commit `13b034f`.

## Why this exists

The last lane slices solved two real problems:

- they made the box render as one assembly lane instead of splitting forward and retrospective assembly into two different products
- they brought the lane into visual alignment with the new chrome guardrails

But the lane still had a deeper weakness:

**it showed evidence without clearly showing the protocol the user was inside**

That meant the lane was cleaner and more truthful than before, but it could still feel a little like a well-designed index rather than the box's working surface.

The product push after review was:

**the lane should make the user feel the Assembled Reality protocol running**

Not with big cards or marketing copy, but with two small, load-bearing signals:

- where am I in the protocol?
- what is the next honest move from here?

## The product logic behind this slice

The theory stack we discussed was:

- Assembly Theory
- Assembled Reality
- Operator Sentences

The current product is strongest in the middle layer. It already lets the user:

- collect sources
- shape a seed
- operate on the box
- draft and seal receipts

What it was missing was a compact way to show that protocol at the lane level.

So this slice tries to make the lane legible as:

**Collecting -> Shaping -> Proving**

That language is intentionally softer than a Root-first workflow. The lane must stay valid for rootless boxes and early boxes. Root is still important, but the strip should not punish collection/listening boxes for not having declared it yet.

## What I tried to do

I tried to make one focused move, not a full redesign.

The goals were:

- add a root-optional protocol strip to the shared lane
- add one contextual lane verb based on durable box facts only
- audit event coverage/certainty behavior and fix only small lane-relevant inconsistencies
- reduce lane noise so the new strip and verb become the primary signals

Just as important, I did **not** try to:

- add persisted Operate history
- add a Draft Receipt lane verb
- add more always-on metadata to every entry
- redesign the whole lane hierarchy again

## The main product decisions

### 1. Protocol position is box-level, not per-entry

The lane now exposes:

- `protocolPosition`
- `protocolStateLabel`
- `contextualAction`

The protocol strip uses:

- `Collecting`
- `Shaping`
- `Proving`

This sits above the entries as a box-level signal. I deliberately did not add another per-entry protocol badge layer because the entries were already dense.

### 2. The first lane verb is guided, not magical

The lane now offers only one contextual verb at a time, chosen from durable box facts:

- `Shape seed`
- `Run Operate`
- `Seal`

Behavior is intentionally conservative:

- `Shape seed` opens the create phase
- `Run Operate` uses the existing Operate flow directly
- `Seal` opens the existing receipt seal dialog for the latest unsealed draft

`Draft receipt` is deferred because the lane still does not persist enough Operate history to represent that move honestly.

### 3. The public self-assembly demo stays on the same grammar, but humbler

I kept the public demo on the shared lane model, but stepped back its certainty. It is still a curated reconstruction, so it should not label entries as `event_backed` just because the story is strong.

### 4. Event work in this slice is audit-first

The lane already had real events. The problem was not absence; it was consistency.

So this slice only makes small context-shape improvements where the lane depends on them:

- confirmation events now carry stronger document/source linkage
- receipt draft/seal events now consistently carry receipt IDs

This was meant to improve certainty/linking without turning the slice into a new event-system project.

## What changed in code

### Shared lane model

[box-view-models.js](/Users/denizsengun/Projects/AR/src/lib/box-view-models.js)

- added protocol derivation from durable facts only
- added contextual action derivation
- kept the actual assembly state visible as secondary metadata
- tightened one truthfulness edge so the seed only gets stronger proof language when it is linked to a sealed receipt, not just because some sealed draft exists elsewhere in the box

### Shared lane UI

[AssemblyLane.jsx](/Users/denizsengun/Projects/AR/src/components/AssemblyLane.jsx)

- added the protocol strip
- added one contextual lane action
- reduced visible entry badges to stage + proof
- moved evidence basis and certainty into quieter supporting text

### Workspace integration

[WorkspaceShell.jsx](/Users/denizsengun/Projects/AR/src/components/WorkspaceShell.jsx)

- wired contextual lane actions into the existing flows
- kept the public version read-only
- reused existing create / operate / seal behaviors instead of inventing new lane-only implementations

### Public self-assembly alignment

[self-assembly.js](/Users/denizsengun/Projects/AR/src/lib/self-assembly.js)

- added the shared protocol strip fields
- kept the demo read-only
- downgraded curated lane certainty from `event_backed` to `inferred`

### Minimal hierarchy cleanup

[globals.css](/Users/denizsengun/Projects/AR/src/app/globals.css)

- clamped entry detail text to 2 lines
- reduced badge prominence
- added protocol strip styling
- added contextual action styling
- normalized lane radius/padding behavior, including mobile cleanup

### Event consistency fixes

- [confirm/route.js](/Users/denizsengun/Projects/AR/src/app/api/workspace/confirm/route.js)
- [assemble/route.js](/Users/denizsengun/Projects/AR/src/app/api/workspace/assemble/route.js)
- [receipt/route.js](/Users/denizsengun/Projects/AR/src/app/api/workspace/receipt/route.js)

These are small context-shape fixes only, mostly around document keys, related source keys, and receipt IDs.

## What I think is strong in this slice

- The lane now tells the user where they are without bringing back dashboard cards.
- The lane now lets the user take one honest next move without leaving the lane as the home surface.
- The public demo and authenticated workspace still share one lane grammar.
- The certainty model is slightly more honest than before, especially in the public reconstruction case.
- The scope stayed narrow enough not to destabilize the larger architecture.

## What I think is still unresolved

### 1. `Run Operate` is useful, but still asymmetrical

It is the only contextual action that executes directly rather than just routing into another surface. I think that is fine for now, but it means the lane is only partially action-native.

### 2. The strip is protocol-visible, not yet protocol-rich

The lane now says where the user is in the protocol, but it does not yet preserve a durable Operate move or Draft Receipt move in the same way. That will matter if we want the strip and the lane to align more tightly later.

### 3. Entry density is better, but not solved forever

The badge row is calmer now, but entry rows still carry a lot of meaning. I would expect more review on whether the current balance is right.

### 4. Event-backed truth is better, not complete

This slice improves event consistency, but it does not finish the broader question of whether every meaningful lane move is represented as an intentional event with enough context to reconstruct causality cleanly.

## What feedback would be most useful

If you review this slice, the most valuable questions are:

1. Does the new strip actually make the protocol legible without reintroducing Root pressure?
2. Is the contextual action selection honest and useful, or does it still feel arbitrary?
3. Does the lane now feel more like the box's working surface, or just a cleaner summary?
4. Is the certainty handling more truthful, especially in the public self-assembly demo?
5. Is `Run Operate` the right first direct action, or should all contextual verbs behave more uniformly?

## Verification

I verified this slice with:

- `npx eslint src/components/AssemblyLane.jsx src/components/WorkspaceShell.jsx src/lib/box-view-models.js src/lib/self-assembly.js src/app/api/workspace/confirm/route.js src/app/api/workspace/assemble/route.js src/app/api/workspace/receipt/route.js`
- `npm run build`

Build passed. The only warning was the same pre-existing Turbopack NFT trace warning from `next.config.mjs -> src/lib/document.js -> src/app/api/seven/route.js`.
