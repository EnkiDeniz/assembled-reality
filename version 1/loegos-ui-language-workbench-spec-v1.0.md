# Lœgos v1
## UI / Language Workbench Spec
### Final draft for planning

**Purpose:** define the user-facing workbench target for the first real Lœgos proving surface  
**This is not:** an implementation plan, architecture proposal, or task breakdown  
**This is:** the UI and language-surface spec the first build should aim at

---

## 1. Core claim

The first proving surface must not feel like:

- a visualization demo
- a colorized prose converter
- an AI editor with extra labels

It must feel like:

**an ordinary human document became more operable when expressed in Lœgos, and the user can now read, inspect, manipulate, and commit structure that was not usable in the original prose.**

That is the claim this workbench must prove.

---

## 2. Primary stance

### 2.1 The default surface is for fluent reading

The default surface should be optimized for the serious, repeat user:

- dense
- stable
- line-addressable
- visually calm
- semantically rich

It should not constantly explain itself inline.

### 2.2 Explanation exists, but off the main line

If a user is confused, the system should support:

- learner mode
- hover explanations
- inspect panel
- glossary/help surface

But the default surface should trust the language itself.

### 2.3 The language must carry the truth

Meaning must live in the language pane itself.

The user should not have to open a side panel to know the basic structural condition of a line.

Diagnostics, evidence, and rationale can support the read.  
They cannot be the only place where the read becomes intelligible.

### 2.4 The first sacred commitment boundary

For v1, the first commitment boundary is:

**ordinary source witness -> active Lœgos structure**

This crossing must be unmistakable.

The user must be able to tell:

- this was source witness
- this was compiled into Lœgos structure
- this structure is now active and editable in a different way

### 2.5 What active structure means

`Active structure` is not just visible converted text.

For v1, active Lœgos structure means the user can now:

1. inspect compiler findings against the line
2. re-type the line
3. re-stage the line
4. split, merge, or compress the line
5. inspect attached witness support
6. explicitly override the compiler with attested human judgment
7. move the line toward committed, relied-upon language

By contrast, witness prose remains:

1. readable
2. listenable
3. comparable
4. inspectable as source

but not the main object that the user stages, re-types, overrides, or commits.

---

## 3. Default reading surface

### 3.1 What the default surface is

The default workbench surface is the compiled Lœgos document, not the original source prose.

The source remains available as witness material, but the main working object is the Lœgos form.

### 3.2 Default layout

The workbench should be organized into four stable regions:

1. left file/tree view
2. main language pane
3. right inspect/diagnostics side surface
4. lightweight bottom or floating listening/control surface

The visual center of gravity is the main language pane.

### 3.3 Overall feel

The surface should feel closer to:

- VS Code
- a compiler workbench
- a structured language editor

and farther from:

- a card-based app
- a dashboard
- a tutorial surface
- a block feed

The workbench should feel like a file-based project environment tied to a box.

---

## 4. Main pane

### 4.1 What the main pane contains

The main pane contains:

- line-addressable Lœgos structure
- line numbers
- inline type rendering
- inline stage rendering
- inline support/trust rendering
- inline exceptional-state rendering
- inline diff/rewrite visibility when active

It should contain very little explanatory prose beyond the language itself.

### 4.2 What it should not contain by default

The main pane should not be dominated by:

- large action buttons embedded in the text flow
- long metadata stacks
- repeated explanatory labels
- card shells around every unit
- oversized status pills that interrupt reading rhythm

### 4.3 The visible unit

The visible primary unit is the line.

The runtime may remain block-backed underneath for a while, but the user should experience the surface as line-first.

Blocks may exist as light grouping containers, but lines should be:

- addressable
- selectable
- typable
- stageable
- inspectable
- rewritable

### 4.4 Inline density rule

If the same meaning is being expressed by:

- icon
- label
- pill
- metadata line
- side-panel explanation

the default surface is over-translating itself.

The design should remove duplicate translation until the language reads fluently.

---

## 5. Gutter

### 5.1 What the gutter contains

The gutter should contain the stable positional grammar of the language.

Each line’s gutter should support:

1. line number
2. type symbol
3. compact stage marker
4. compact exceptional-state marker when present
5. compact action affordances on hover or selection

### 5.2 Gutter priorities

The gutter should be where the user learns:

- where the line is
- what kind of line it is
- where it sits in lifecycle
- whether something unusual is happening

It should not become a toolbar wall.

### 5.3 Hover-only gutter actions

Operational actions should mostly appear:

- on hover
- on line focus
- on selection
- in command palette or keyboard shortcuts

not as always-visible large buttons.

This preserves language fluency while keeping power available.

---

## 6. Left file/tree view

### 6.1 Purpose

The left side should be radically simplified into a box-tied file tree.

This reduces clutter and helps the workbench feel like a serious project environment rather than a flow of unrelated UI panels.

### 6.2 What the tree contains

At minimum, the left tree should contain:

1. the current Box as the root
2. `Witnesses`
3. `Language`
4. `Receipts`

### 6.3 Witnesses

`Witnesses` contains source material tied to the box.

Examples:

- imported documents
- pasted sources
- linked sources
- voice-derived sources
- source witnesses produced by prior work

These should read as source files, not as cards.

### 6.4 Language

`Language` contains:

- compiled Lœgos files
- active structure files
- rewrites or alternates if those become first-class

This is where the current active language object lives.

### 6.5 Receipts

`Receipts` contains:

- runtime returns
- draft receipts
- sealed receipts

### 6.6 What the tree should not contain

The tree should not try to teach the whole ontology inline.

No long descriptions by default.  
No dashboard metrics embedded into every node.  
No cluttered badges unless they carry actual file- or state-level meaning.

### 6.7 Minimal per-file signals

Each file row may carry compact signals such as:

- type of file
- active/open state
- weak/changed/receipt-bearing status
- compare source linkage when relevant

But these should stay minimal and scannable.

---

## 7. Side panels

### 7.1 Right side panel purpose

The right side supports the main language pane.

It exists for:

- inspect
- diagnostics
- evidence
- compare details
- rewrite rationale

It does not replace the main pane.

### 7.2 Right side panel sections

The right side should support pinned or switchable sections:

1. `Inspect`
2. `Diagnostics`
3. `Evidence`
4. `Compare`

### 7.3 Inspect

`Inspect` shows the currently selected line’s deeper read:

- type
- stage
- support status
- rationale
- linked witness material
- authorship or stance info when available
- override status if present

### 7.4 Diagnostics

`Diagnostics` shows the current compiler-like findings list:

- missing reality
- weak weld
- move without test
- unsupported support
- overclaimed closure
- bloated/compressible line

The list should be compact, navigable, and tied to lines.

### 7.5 Evidence

`Evidence` shows what witness material supports or challenges the selected line.

This is where the user can read source linkage in detail without cluttering the main pane.

### 7.6 Compare

`Compare` shows the conversion relationship between:

- original witness line or source passage
- compiled Lœgos line
- rationale for change

Compare is not optional in the first proving flow.

For v1, the minimum compare mode is fixed:

1. left pane: witness source
2. main pane: compiled Lœgos form
3. synchronized selection between witness and compiled structure
4. right-side compare rationale inside the side surface

The first proof should not rely on a toggle-only compare experience.

---

## 8. Visibility rules

### 8.1 Visible by default

The default fluent view should show:

- line number
- type symbol
- compact stage marker
- inline support/trust rendering
- exceptional-state rendering when present
- selection/focus state
- minimal tree/file structure
- compact diagnostics count or status

### 8.2 Visible in learner mode

Learner mode may expand the surface with:

- spelled-out type labels
- spelled-out stage labels
- grammar legend
- more explicit inline explanations
- more visible affordance labels

Learner mode should be optional and reversible.

The default surface should not depend on it.

### 8.3 Visible on hover

Hover may reveal:

- compact action controls
- short rationale summaries
- linked witness preview
- rewrite preview
- compact stage/type labels if hidden in fluent mode

### 8.4 Visible in inspect

Inspect is where full explanation belongs:

- why the line was classified this way
- what changed during conversion
- what evidence is attached
- why the compiler flagged it
- what override is doing

---

## 9. Grammar channels

The UI should use distinct channels so meaning does not blur.

The grammar channel ownership for v1 is fixed:

1. `type` = shape + gutter position
2. `stage` = compact gutter lifecycle marker
3. `support/trust` = inline text treatment
4. `exception` = special gutter marker + inline exception styling

These are hard grammar assignments for the first proof, not loose design suggestions.

### 9.1 Type

Type is communicated by:

- symbol family
- symbol position in the gutter
- stable associated accent treatment

The semantic set for v1 is:

- `△` Aim
- `□` Reality
- `œ` or weld mark for Weld
- seal mark for Seal

Type is the primary job of shape and gutter position.
It should be shape-first and stable enough to become readable through repetition.

### 9.2 Stage

Stage is communicated by:

- compact lifecycle marker in the gutter
- fixed positional placement relative to the type symbol

Stage is the primary job of the compact lifecycle marker.
It should not compete visually with type.
It should be legible but quieter.

The v1 lifecycle is:

1. Declare
2. Observe
3. Weld
4. Move
5. Test
6. Receipt
7. Seal

### 9.3 Support / trust

Support/trust is communicated in the language itself.

The channel should live in:

- inline text treatment
- inline highlighting
- local emphasis or de-emphasis

Support/trust is the primary job of inline text treatment.
This is where the user can see:

- unsupported
- weakly supported
- supported

The key rule:

support must be readable from the line without needing the diagnostics panel open.

### 9.4 Override / stale / contradiction

Exceptional states need their own channel so they do not get confused with ordinary support.

These are rendered through a combination of:

- special gutter marker
- inline accent or exception styling
- inspect-panel explanation

This channel covers:

- attested override
- stale
- contradiction

Exception state is the primary job of the special gutter marker plus inline exception styling.
These states should feel exceptional and inspectable, not merged into normal support coloring.

### 9.5 Channel separation rule

No single channel should carry all meaning at once.

The workbench should not rely on color alone.

The user should be able to parse the language through:

- shape
- position
- density
- inline emphasis
- exception markers

Color helps, but does not carry the entire grammar.

---

## 10. Operations without breaking fluency

Operations must remain powerful without turning the workbench into a button field.

### 10.1 Stage

A user stages lines by:

- line selection
- compact contextual action
- keyboard command
- command palette

The visual result of staging must be immediate and obvious in the language itself.

### 10.2 Commit

Committing should feel like a state change in the language, not like clicking a generic app CTA.

The user must feel when language crosses from:

- visible
- to active
- to relied upon

### 10.3 Rewrite

Rewrite should support:

- proposed operative rewrite
- diff visibility
- replay/readback after rewrite
- accept or reject

The system must never quietly replace prose.

### 10.4 Inspect

Inspect should be available through:

- click
- hover
- keyboard navigation

and should open rationale, evidence, and conversion history without shifting the user away from the line they are reading.

### 10.5 Override

Override should be explicit and first-class.

Override is not a minor convenience feature.
It is one of the safeguards that prevents the workbench from collapsing into machine authority.

The user should be able to:

- preserve a line
- mark that human judgment currently outruns machine support
- attach a note
- see that this line is now attested rather than machine-grounded

Override must never masquerade as strong proof.
Override must also be visible enough in the first proof that the user understands the compiler is not the final sovereign.

---

## 11. First proving flow

The first proving flow is compile-first.

### 11.1 Flow shape

The proving sequence is:

**human document -> Lœgos form -> compare -> manipulate**

### 11.2 Step 1: witness input

The user starts from an ordinary human-written document.

That document remains witness material.

It is not silently transformed in place.

### 11.3 Step 2: compile to Lœgos

The system compiles the witness into Lœgos structure.

The output becomes a new active language object.

The user must be able to see that a crossing happened.

### 11.4 Step 3: compare

The user enters a compare-capable surface where they can see:

1. what the original said
2. what the Lœgos form now says
3. why specific lines changed
4. which structural conditions became visible

For v1, compare should be explicit and side-by-side:

1. witness source on the left
2. compiled Lœgos form in the main pane
3. synchronized selection between the two
4. compare rationale in the right-side panel

### 11.5 Step 4: manipulate

The user must then be able to do something with the Lœgos form that was not possible in the original prose.

At minimum, that means the user can:

1. inspect compiler findings
2. re-type a line
3. re-stage a line
4. split or compress a line
5. inspect evidence
6. override one line explicitly
7. hear the line or structure aloud

This is the moment where the first commitment boundary becomes felt rather than merely described.

### 11.6 Step 5: active structure

After compare and first manipulation, the user should be left in the Lœgos workbench with the compiled form as the active working object and the original source preserved as witness.

---

## 12. Minimum mandatory compiler set for the first proof

The first proving surface should keep the compiler set small and unmistakable.

Mandatory checks:

1. missing reality
2. weak weld
3. move without test
4. unsupported support
5. overclaimed closure
6. bloated/compressible line

This is enough to prove that the language is doing real structural work.

Recommended seventh check if it is cheap enough to include without delaying the first proof:

7. stage confusion

---

## 13. Listening in the first proof

Listening should be present, but lightweight.

The user should be able to:

1. hear the original line or passage
2. hear the compiled Lœgos line
3. hear the rewritten line

The point is not full media complexity.

The point is to let the user detect hollowness, pressure, bloat, or increased operability by ear.

---

## 14. Failure conditions for the first proof

The first proof should be considered unsuccessful if:

1. the result feels like relabeled prose rather than more operable language
2. the user cannot tell what changed and why
3. the user cannot do a meaningful structural operation on the Lœgos form
4. the crossing into active structure feels ambiguous
5. the compiler read feels arbitrary or overconfident
6. the main pane still depends on side panels to make meaning legible
7. override is missing or feels discouraged

---

## 15. Short version

The v1 workbench should feel like a real language environment where:

- the box owns a simple file tree
- witness files stay simple
- the compiled Lœgos file becomes the main working object
- the main pane carries type, stage, support, and exception truth inline
- actions stay powerful but secondary to reading fluency
- compare is mandatory
- override is explicit
- listening is available

If the user can feel that the document crossed from witness prose into active Lœgos structure, and can immediately manipulate that structure as language, the first proof is working.
