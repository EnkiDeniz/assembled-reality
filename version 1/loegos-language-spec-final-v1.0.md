# Lœgos Language Specification
## Engineering Build Brief
### Final v1.0

**Audience:** engineers designing and building the Lœgos language surface and its supporting compiler-like workspace

**Purpose:** define what the Lœgos language is, what the language workbench must allow a user to do, what the system should parse and evaluate, what the language objects are, and what kinds of outputs the system should produce.

This document is not trying to specify every implementation detail.  
It is trying to define the build target clearly enough that engineering can respond with architecture, system design, and phased execution.

---

## 1. Product claim

Lœgos should be buildable and usable as a real language workspace.

The user should be able to enter a dedicated surface and feel, immediately, that they are not merely editing prose.  
They are working in a typed coordination language.

The right mental model is closer to:

- a code editor
- a compiler surface
- a structured notebook
- a block-and-text hybrid language workbench

and farther from:

- a note app
- a word processor
- a chat thread
- a generic AI editor

The core “aha” should be:

**this behaves like a language.**

Not because it imitates developer aesthetics superficially, but because:

- units have types
- structure matters
- invalid or weak constructions can be inspected
- execution stages are visible
- evidence affects confidence
- output changes when reality returns

---

## 2. What the language is for

The language exists to help a human turn messy thought and gathered material into reality-testable coordination.

At minimum, the language should help a user:

1. declare an aim
2. name reality
3. connect aim and reality
4. define a move
5. define a test
6. record a receipt
7. update the state honestly

This is the core loop.

The language surface should make that loop inspectable and editable the way code makes computation inspectable and editable.

---

## 3. What must feel true in the editor

A user sitting in the language surface should feel several things.

### 3.1 Text is not flat

Not all sentences are the same kind.  
Some are declarations.  
Some are observations.  
Some are bridge logic.  
Some are moves.  
Some are tests.  
Some are receipts.  
Some are closure.

The editor should help make that visible.

### 3.2 Structure matters

Reordering, compressing, splitting, combining, or relabeling sentences should have meaningful effect.  
The language should not merely decorate finished prose.  
It should help shape the prose into something more operative.

### 3.3 State matters

The user should be able to tell whether a line is:

- just written
- typed
- weak
- unsupported
- contradicted
- attested
- stale
- receipt-bearing
- seal-ready

### 3.4 The system is reading along

Like a compiler or linter, the system should evaluate what is being written and help the user understand what is structurally strong, weak, or missing.

### 3.5 Language can be manipulated like code

A user should be able to:

- edit lines directly
- split a line into smaller units
- merge units
- change type assignment
- move units through execution stages
- review evidence attached to a line
- inspect why the system classified a line the way it did
- compare alternative rewrites
- stage or commit language into a more active state

This is the “Lego-like” part, but it should feel more precise than toy-like.  
The right feel is: **composable, inspectable, strongly shaped text.**

---

## 4. Core language model

The minimum build target should center on two layers:

1. semantic type
2. execution stage

### 4.1 Semantic types

At minimum, the language should support these core types:

- **Aim** — directional, declarative, intentional
- **Reality** — observed, constrained, evidenced, returned
- **Weld** — connects aim and reality into an operative relation
- **Seal** — closure / committed state after contact

These may be rendered visually as symbols, labels, or both.  
The exact presentation can vary, but the semantic distinction should remain stable.

### 4.2 Execution stages

At minimum, the language should support the lifecycle:

1. Declare
2. Observe
3. Weld
4. Move
5. Test
6. Receipt
7. Seal

A user should be able to understand that a sentence may have both:

- a type
- a place in the lifecycle

These are related but not identical.

### 4.3 Why this distinction matters

Example:

- “Ship a working login screen.” is usually an Aim sentence at Declare.
- “The app has no authentication entry point.” is usually a Reality sentence at Observe.
- “Email-first login closes the access gap.” is usually a Weld sentence at Weld.
- “Tap Continue with a valid email.” may be Move or Test depending on framing.
- “Magic link sent successfully.” is receipt-bearing reality.
- “Core login works; next move is failure handling.” is seal-like closure.

The system should support this richer read instead of collapsing everything into one flat label.

---

## 5. Primary language objects

The exact storage model can vary, but the user-facing language should operate through a small set of clear objects.

### 5.1 Line

A line is the primary editing unit.  
It is the closest analog to a line of code or a single structured statement.

A line should be able to carry:

- text content
- semantic type
- execution stage
- confidence / support state
- provenance / authorship info
- evidence links
- notes or rationale

### 5.2 Span

A span is a sub-line region.  
The system may need span-level analysis when only part of a line is weak, overclaimed, pressured, stale, or evidence-bearing.

This is important if the language eventually moves toward word-level or phrase-level typing.

### 5.3 Block

A block is a grouped set of lines.  
This can function like a paragraph, function body, or logical unit.  
A block may represent one coherent move in the language.

### 5.4 Module / Document

A document is the composed language object the user is actively working on.  
It should behave more like a source file than like a rich-text page.

### 5.5 Box context

The language surface does not exist in total isolation.  
It operates inside a box or project context that affects:

- evidence availability
- source corpus
- prior receipts
- current aim context
- trust conditions

Engineers should preserve the difference between the language file itself and the larger box context around it.

---

## 6. The language workbench

The dedicated language surface should feel like the place where Lœgos is actually written, inspected, and compiled.

This is the “compiler UI” in spirit, whether or not that becomes the final product name.

### 6.1 Minimum interaction goals

The workbench should let the user:

- open a language document
- edit lines directly
- see line numbers or stable positional references
- see syntax-like highlighting by type / stage / state
- inspect why a line has been classified a certain way
- manipulate the language structure
- review compiler-like findings
- compare before / after rewrites
- hear lines aloud quickly
- inspect evidence and support
- move from draft language to more committed language states

### 6.2 The right visual analogy

Think closer to VS Code than to Google Docs.  
Not because it needs code-guy aesthetics for their own sake, but because VS Code gets several things right:

- lines feel addressable
- text is structured
- colors mean something
- side panels hold diagnostics and references
- edits are inspectable
- code and feedback coexist in one surface

Lœgos should aim for that level of clarity, but tuned for coordination language rather than software syntax.

### 6.3 What should be visible in the main editing pane

The main pane should privilege the language itself.  
That means the user should primarily be looking at:

- their lines
- line numbers or references
- type / stage rendering
- state / support cues
- inline weak spots or highlights

The center of gravity should remain the language, not side commentary.

### 6.4 What should be visible in the side surfaces

Side surfaces may hold:

- diagnostics
- evidence links
- rationale for classifications
- available rewrites
- attached sources
- receipt history
- listening / playback controls
- current box or file status

But these should support the language surface, not displace it.

A key lesson from prior work is that meaning should not live only in a side rail.  
The language itself should visibly carry the language.

---

## 7. Editing operations the system should support

The language workbench should not only display classifications.  
It should support active manipulation.

At minimum, the user should be able to do the following.

### 7.1 Direct editing

The user can write and revise lines normally.

### 7.2 Re-type

The user can manually change or challenge the type of a line.  
For example:

- reclassify a line from Aim to Reality
- mark a line as Weld instead of vague narrative

The system can disagree, but the disagreement should be inspectable.

### 7.3 Re-stage

The user can move a line forward or backward in the execution lifecycle.  
This is important because many weak documents are weak due to stage confusion.

### 7.4 Split

A single overloaded line can be split into multiple clearer lines.

Example:

> We need a better login flow because users are confused and I think a magic link will solve it.

May need to become:

- Users are confused at login.
- Email-first login may reduce confusion.

### 7.5 Merge

Several weak or repetitive lines can be compressed into one stronger line.

### 7.6 Compress / rewrite

The system should be able to propose a more operative rewrite.  
Not merely a more polished one.

### 7.7 Attach / inspect evidence

A user should be able to inspect what supports a line.

### 7.8 Attest / override

A user should be able to preserve a line while explicitly marking that human judgment currently outruns machine support.

### 7.9 Stage / commit

The workbench should support movement from exploratory language into more active, relied-upon language.

This boundary must be very clear.

---

## 8. Compiler behavior

The system should behave enough like a compiler that the user feels they are writing in a real formal environment.

This does not mean pretending coordination is code in a naive way.  
It means providing compiler-like discipline.

### 8.1 Core checks

The language engine should be able to ask:

- Is there a real aim?
- Is reality named?
- Is there a real weld?
- Is there a concrete move?
- Is there a test?
- Is there a receipt path?
- Is closure overclaimed?
- Is this line bloated or compressible?
- Is this line unsupported?
- Is this line merely decorative relative to the active aim?
- Is the line in the wrong stage?
- Is the document coherent but not yet reality-bearing?

### 8.2 Output style

Compiler outputs should help the user act.  
They should not feel like abstract model dumps.

Examples of useful compiler outputs:

- Missing reality.
- Weld is rhetorical, not operative.
- Move exists but no test is defined.
- This line claims support stronger than attached evidence.
- These two lines conflict.
- This paragraph repeats prior structure.
- This closure is not yet earned.

### 8.3 Compile-time vs runtime

The compiler should preserve a central distinction:

- compile-time strength
- runtime confirmation

A document may be structurally strong and still unproven.  
A line may be well-typed and still unsupported by receipts.

That distinction must remain visible throughout the system.

---

## 9. Rendering model

The language workbench should visually reinforce that this is not flat prose.

### 9.1 Type rendering

Type should be visible in the text itself and/or immediately adjacent to it.  
This can include:

- color
- symbol
- label
- background emphasis
- gutter marker

### 9.2 Stage rendering

Stage should be visible enough that the user can understand lifecycle flow.  
This does not need to dominate the screen, but it should not be hidden.

### 9.3 Support / trust rendering

The user should be able to distinguish:

- unsupported
- weakly supported
- supported
- attested
- stale
- contradicted

### 9.4 Inline priority

Meaningful rendering should live in or near the language itself.  
The user should not have to leave the main text to understand the basic structural condition of a line.

### 9.5 Diff / rewrite visibility

When the system proposes compression or rewrites, the user should be able to compare the old line and the new line clearly.

The workbench should support a feeling of “I am editing a living language structure,” not “the AI quietly replaced my prose.”

---

## 10. Reading and listening

The language should be inspectable both visually and aurally.

### 10.1 Why listening matters

Some defects are easier to hear than to see:

- bloat
- weak authorship
- coercion tone
- false confidence
- hollowness
- emotional mismatch
- weirdness

### 10.2 Minimum listening support

The workbench should support:

- quick play of the current line
- play by block
- play by selected range
- replay after rewrite
- stable return to the same point in the document

### 10.3 Why this matters for the build

Listening is not just a media feature.  
It is part of the language inspection model.

---

## 11. Authorship and stance

The language cannot assume that every line entered by a user is fully endorsed by the self.

A line may be:

- believed
- exploratory
- reported
- pressured
- strategic
- coerced
- unclear

This means the language may eventually require not only:

- type
- stage
- support state

but also:

- stance / authorship relation

Engineers do not need to solve the full stance model in the first build unless they believe it is necessary to preserve the aim.  
But they should design in a way that does not make this extension impossible.

---

## 12. Relationship to evidence and receipts

The language should remain tied to reality contact.

That means:

- evidence should be inspectable from the line it supports
- receipts should be visible as returned runtime contact, not just narrative confirmation
- seal-like language should remain weaker when reality has not actually answered

A key failure mode to avoid is letting the system produce beautiful closure without external contact.

---

## 13. Minimal developer target

If the team needs a minimal first target for the language workbench, it should probably include:

1. a dedicated document-like language surface
2. line-addressable editing
3. visible type rendering
4. visible stage rendering
5. inline support / weakness cues
6. a diagnostics panel
7. inspectable evidence links
8. split / merge / compress operations
9. attested human override
10. quick listening
11. a clear staged vs committed language boundary

That would be enough for a user to feel, maybe for the first time, that they are not just writing text but working in an actual coordination language.

### 13.1 Immediate proving experience

The first strong demonstration should likely be:

- a user starts with an ordinary human-written document
- the system converts or compiles it into Lœgos structure
- the user can compare the original and the Lœgos form
- the user can inspect why lines changed in role, stage, support, or clarity
- the user can directly manipulate the Lœgos version afterward

This is likely the simplest way to create the “this is a real language” wow moment.

---

## 14. What this spec is asking engineering to do

We are not asking engineering to merely add labels to text.  
We are asking engineering to create a real language workbench in which Lœgos can be written, inspected, manipulated, and compiled with the same seriousness that a developer feels when writing in a real code editor.

The key question is:

**What system shape will make this feel unmistakably like a language while preserving the actual aim of the language — helping a human move from aim to reality contact honestly?**

That is the build problem.

---

## 15. Closing statement

Fortran made numbers writable.  
Swift made applications writable.  
Lœgos is trying to make coordination writable.

The language workbench should let a person see that happening.  
Not as metaphor.  
As an actual editable, inspectable, typed environment for turning language into reality-tested structure.
