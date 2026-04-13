# Team Realignment Memo: Room + Dream MVP

Date: April 13, 2026  
Audience: Driver, Compiler Engineer, Designer, Engineering Team  
Status: Active alignment memo  
Purpose: Realign the team on the MVP center before further design and implementation work.

---

## 1. Why This Memo Exists

We now have a clearer center than we did even a few days ago.

That is good news, but it creates a new risk:

- design can run ahead of the MVP
- engineering can over-preserve old surfaces
- the compiler layer can be asked to solve problems the product has not earned yet

This memo is meant to reduce that drift.

---

## 2. The Current Center

The MVP is not “all the valid concepts in the repo.”

The MVP is:

- `Room`
- `Dream`
- the handoff between them

And the governing line remains:

**The human proposes, the machine structures, reality returns, and receipts decide what can travel.**

This means:

- `Room` is the live steering surface
- `Dream` is the source re-entry surface
- `Bridge` is how source contact becomes live work
- `workingEcho` is what keeps Room from collapsing into generic chat
- `Compiler Read` is a Dream action, not a third mode

Everything else must re-earn its place later.

---

## 3. MVP Definition

For this phase, MVP means a tool that works reliably and feels coherent in daily use.

### 3.1 Room must provide

- active thread identity
- thread view
- composer
- source attachment / source entry
- a **thin but real `workingEcho`**
- visible field status:
  - `open`
  - `contested`
  - `awaiting return`

The key rule:

**If Room becomes only messages plus input, it is no longer Lœgos.**

### 3.2 Dream must provide

- upload / paste documents
- persistent document access
- active document stage
- `Compiler Read`
- `Send to Room`
- listening

But the sequencing rule matters:

**Dream must first be solid as a document-contact and Compiler Read surface.**

Listening is important, but it must not dominate the critical path before:

- the document stage is right
- Compiler Read is honest and inspectable enough for provisional use
- the Dream -> Room handoff is clean

### 3.3 Shell must provide

- `Room | Dream`
- subordinate utility for account, settings, and sign out
- reliable navigation
- reliable session handling
- mobile responsiveness
- loading and error visibility
- no silent failure paths

---

## 4. What Is Not In The MVP Center

These may remain in the codebase, backend, or future planning, but they are not allowed to define the rebuild:

- boxes as visible destination
- sessions as visible workspace region
- witness as a permanent section
- operate as a permanent section
- mirror as a permanent section
- receipt kit as a first-class area
- Recon as a runtime mode
- Drive Tape as a runtime mode
- Shape Library as a runtime mode
- Seven Terminal as a runtime mode
- design-proposal surfaces inside the main signed-in app

The rule is simple:

**defer runtime nouns before adding runtime nouns**

---

## 5. Team-Specific Alignment

### 5.1 Driver

Hold the product line.

Primary job now:

- protect the MVP from sprawl
- keep Room and Dream as the only durable surfaces
- keep `workingEcho` and `Bridge` from being designed out
- keep status language honest

Driver should keep asking:

- is this foundational or just interesting?
- does this sharpen the next move?
- does this help return matter?

### 5.2 Compiler Engineer

Protect the machine’s role.

Primary job now:

- keep the compiler in the middle
- keep `Compiler Read` read-only
- keep provenance inspectable
- keep trust gradients honest
- avoid shadow seal paths

Compiler Read must remain:

- provisional
- pressure-oriented
- non-canonical
- inspectable claim-by-claim

### 5.3 Designer

Design the smallest correct product, not the most complete imagined system.

Primary job now:

- make `Room` feel like live work
- make `Dream` feel like source contact
- make `Bridge` feel intentional
- keep shell minimal
- prevent dashboard/panel drift

Design should not currently optimize for:

- extra destinations
- ontology exposure
- design-system expressiveness for its own sake
- audio sophistication before document-pressure clarity

---

## 6. Sequencing Rule

This is the specific realignment point for current design work:

### Build order

1. `Room`
   - thread
   - composer
   - source entry
   - thin `workingEcho`
   - field state

2. `Dream`
   - document stage
   - document access
   - Compiler Read
   - Send to Room

3. `Bridge`
   - one clean Dream -> Room handoff
   - preserved source identity and anchor
   - no hidden mutation or silent canon effects

4. `Listening`
   - integrated well
   - but not allowed to outrank the document-pressure loop

5. polish / earned contextual objects

If there is a tradeoff, we choose:

- better Room steering over more shell complexity
- better Dream document contact over richer library furniture
- better Compiler Read honesty over slicker output
- better Bridge continuity over new runtime nouns

---

## 7. Non-Negotiable Product Truths

These should survive all redesign work:

1. `workingEcho` is load-bearing.
2. `Compiler Read` is an action inside Dream, not a mode.
3. `Bridge` is first-class, not incidental plumbing.
4. `Receipts` matter in the trust spine even when visually quiet.
5. The app must be easy to leave and easy to resume.
6. The UI should teach through behavior, not theory exposition.

---

## 8. Practical Review Questions

Before any design direction or implementation slice moves forward, ask:

1. Does this make Room a stronger steering surface?
2. Does this make Dream a stronger source-contact surface?
3. Does this improve the Dream -> Room handoff?
4. Does this preserve `workingEcho` as real structure rather than summary furniture?
5. Does this keep Compiler Read honest, provisional, and read-only?
6. Does this reduce drift, or add another runtime noun that now has to be defended?

If the answer is no, the work is probably not on the MVP path.

---

## 9. One-Line Working Seal

**For this MVP, we are building one calm instrument with two durable surfaces: Room for live steering, Dream for source contact, and a real handoff between them.**
