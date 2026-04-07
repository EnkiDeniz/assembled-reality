# Loegos UX Brief Second Look

**Status:** Review note  
**Purpose:** Re-read `docs/loegos-ux-brief.md` as a source of salvageable product ideas, while separating those ideas from the parts of the brief that created confusion.

---

## Summary

The brief was directionally right about user intent, but too rigid about user classification.

Its strongest ideas are still valuable:

- the app should open to where you left off
- first-time users need a radically simpler entry
- the `Seed` should be the living current state of the Box
- returning users need orientation, not explanation
- power should come from faster access and deeper visibility, not from an entirely different product

The part that did not work well was treating experience level as if it should directly determine separate product surfaces all the time.

The better framing is:

- not `three users, three products`
- but `one Box system, different moments of use`

Those moments include:

- first session
- return/resume
- mobile capture
- desktop assembly
- proof/review

That reframing preserves the good ideas without making the product feel split or doctrinal.

---

## What The Brief Got Right

## 1. Open To Where You Left Off

This is one of the strongest statements in the brief.

> The app should open to where you left off, not where you started.

That remains correct.

What needs refinement is not the principle, but the implementation.

For the current product, `where you left off` should usually mean:

- on desktop: the most recent `Box home`, with a strong `Resume` action
- on mobile: the most relevant active source or seed in a source-friendly mode

The underlying idea is right:

- returning users need continuity
- the product should remember momentum
- re-entry is a first-class UX job

## 2. First-Time Users Need A Zero-Abstraction Start

The brief was right that first-time users do not need:

- Box launcher complexity
- management UI
- advanced diagnostics
- doctrinal concepts

They need:

- one clear entry
- one real signal
- one visible next move

The current first-box direction is still good. The main thing to preserve is the idea that first-time value comes from doing, not reading.

## 3. The Seed As The Living Working Position

This is the deepest insight in the document.

The most useful claim in the whole brief is not the user segmentation. It is this:

**the seed is the living answer to "where does this Box stand right now?"**

That remains extremely strong.

The best parts of the brief correctly position the seed as:

- the live working state of the Box
- the place where aim, ground, and gap can coexist
- the most legible object for returning users
- the thing Operate and Receipts should keep grounding over time

This should remain central to the product.

## 4. Returning Users Need Orientation Before Action

The brief correctly understood that returning users want:

- `Where was I?`
- `What is in this Box now?`
- `What should I do next?`

That is exactly what `Box home` is for.

The mistake was not the insight. The mistake was over-coupling that insight to a user persona taxonomy.

We should keep the orientation requirement while expressing it through product state, not identity labels.

## 5. Power Users Need Progressive Reveal, Not A Different App

The brief correctly noticed that advanced users want:

- speed
- source switching
- history
- richer diagnostics
- shortcuts

That is all true.

But those needs should usually be served by:

- better defaults
- faster access
- richer views on demand

not by making the system feel like it has a separate power-user product layer.

## 6. Adding Sources Should Feel Casual And Immediate

The brief was right that source entry should feel like dropping things into a Box, not administering uploads.

This is especially true on mobile.

The best ideas here are:

- source intake should feel low-friction
- modality should be visible
- image, voice, text, and link entry should feel native to the device
- the user should not have to navigate a heavy control structure just to capture something

This aligns directly with the mobile quick-actions direction.

## 7. Diagnostics Should Arrive When Earned

The brief was also right that deeper Box intelligence should not dominate early use.

The strongest principle there is:

- no heavy diagnostics on first use
- richer reads only after enough material exists
- advanced intelligence should often arrive through Seven or Operate, not static dashboards

That remains a strong sequencing rule.

---

## What Created Confusion

## 1. User Types Became Too Rigid

The document treats:

- first timer
- returning user
- power user

as if these are durable product identities that should strongly determine the whole interface.

That is where it started to break down.

In reality:

- a power user on mobile may still be in a quick capture moment
- a returning user may want orientation on desktop but instant listening on mobile
- a first-time user may become a returning user after one session

The product should respond to:

- context
- device
- current task
- Box maturity

more than to a fixed user label.

## 2. The Brief Mixed Entry Logic With Whole-Product Logic

The early sections are strongest when talking about entry and re-entry.

They get weaker when that same segmentation starts to imply permanently different product structures.

Entry rules and workspace rules should be related, but not identical.

## 3. The Document Over-Collapsed Desktop And Mobile

The brief intuited different needs, but still described a product that often sounded too unified in runtime expression.

The current clearer framing is:

- desktop = assembly-first
- mobile = source-first

This device distinction does more practical work than the user-type distinction.

## 4. Some Ideas Were Too Doctrinal For Core UX

The visualization and theory sections contain interesting material, but in several places they risk pushing abstract system meaning ahead of immediate usability.

The product should preserve the insights while reducing the cognitive load.

Good doctrine becomes good UX only when it helps the user act faster and understand more clearly.

## 5. The Brief Sometimes Over-Centered The Seed As The Only Open View

The seed should be central, but not every context should always open there.

Examples:

- on desktop cold-open, `Box home` may be better than dropping directly into the seed
- on mobile, resuming the last listened source may be better than always opening the seed

So the stronger rule is:

**the seed is the central live object, but not necessarily the universal first screen.**

---

## What To Keep

These ideas should survive into the current product direction.

### Keep 1

First-time users need a minimal, action-first entry.

### Keep 2

Returning users should not be forced back through generic launch structures before they can resume.

### Keep 3

The `Seed` should remain the living current state of a Box.

### Keep 4

Seven should be close at hand, not hidden behind heavy navigation.

### Keep 5

Source intake should feel immediate and device-native.

### Keep 6

Advanced diagnostics should appear only when there is enough Box material to justify them.

### Keep 7

The product should optimize for momentum, not explanation.

---

## What To Rewrite

These ideas should be reframed rather than kept literally.

### Rewrite 1

Replace `three users, three assembly paths` with:

- first session
- return/resume
- capture moment
- assembly moment
- proof moment

### Rewrite 2

Replace persona-first defaults with:

- device-aware defaults
- context-aware defaults
- Box-maturity-aware reveal

### Rewrite 3

Replace `power user gets a different experience` with:

- progressive disclosure
- richer shortcuts
- richer inspection
- faster resume

### Rewrite 4

Replace `seed is always the default open view` with:

- `Seed` is the central live object
- `Box home` is the orientation surface
- source resume is valid on mobile

---

## Revised Product Rules

Here is the cleaner version of the brief’s best ideas.

## Rule 1

The app should remember momentum.

## Rule 2

The first session should start with one signal, not one taxonomy.

## Rule 3

The `Seed` is the live current state of the Box.

## Rule 4

Desktop is where the user assembles.

## Rule 5

Mobile is where the user captures, reads, listens, and asks.

## Rule 6

Advanced visibility should emerge with Box maturity, not be front-loaded.

## Rule 7

The user should feel one coherent Box system across all moments of use.

---

## Best Ideas To Carry Forward Immediately

If we only keep a few ideas from the brief, they should be these:

1. `Open to where you left off.`
2. `The seed is the live current position of the Box.`
3. `First-time use must be radically simpler than returning use.`
4. `Adding sources should feel immediate and natural.`
5. `Power should come from speed and depth, not complexity by default.`

---

## Relationship To Current Proposal

This second-look note supports the newer workspace proposal rather than replacing it.

The current proposal keeps the strongest parts of the brief by translating them into:

- desktop/mobile role clarity
- state-based entry rules
- a stronger `Seed` model
- mobile quick actions
- a calmer desktop assembly workspace

In that sense, the old brief was not wrong. It was early.

Its best contribution was noticing real differences in user intent.

The next step is to express those differences through:

- product state
- device context
- Box maturity

instead of through rigid user buckets.

