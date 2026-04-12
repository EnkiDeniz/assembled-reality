# Language First, Machine Second

Date: April 11, 2026  
Status: Steering rule  
Purpose: Prevent the product from drifting into machine-authored meaning when Lœgos itself already defines the loop.

---

## 1. The Core Rule

Before we build any new mechanism, ask:

> how does Lœgos itself already solve this?

If the language already provides the meaning, law, or loop shape, the machine should not invent a second intelligence layer beside it.

The latest founder / engineer reverse-trace reads strengthen this rule:

- the real thread was already behaving like the aimed reality loop
- the product is catching up to the language, not inventing the loop from scratch

That means the machine's next job is even more clearly:

- surface
- preserve
- annotate authority
- show survival

before it tries to "help" with more interpretation.

This now has a companion engineering rule:

before major product, testing, or runtime design changes, reread:

- [# Braided Emergence.md](/Users/denizsengun/Projects/AR/docs/#%20Braided%20Emergence/#%20Braided%20Emergence.md)
- [braided-emergence-implementation-crosswalk-2026-04-11.md](/Users/denizsengun/Projects/AR/docs/braided-emergence-implementation-crosswalk-2026-04-11.md)

Use them as an inspiration and audit pass, not as permission to add new ontology.
The standing engineering question is:

> did correction actually alter the next proposal, or only the surrounding explanation?

This now also has a second companion rule:

before major product, testing, or runtime changes, ask two questions:

1. does this fit the Braided Emergence law?
2. what is the Elden Ring equivalent of this?

The point of the second question is not style.
It is contact.

If we cannot answer what the equivalent is in Elden Ring terms, the idea may be:

- ornamental
- overexplained
- protecting the user from contact instead of making contact legible
- making the machine feel nicer without making the run more truthful

The practical Elden Ring translations are:

- the world = the problem field
- the player = the human / agent in the loop
- the boss = the real discriminating difficulty
- dying = return that disproves the current read
- the bonfire / site of grace = the echo / replay point that lets you re-enter without lying
- the lore on the walls = the deeper system law that only becomes readable after enough returns
- getting better = sharper reads, better timing, more honest contact

So the rule becomes:

> if it fits Braided Emergence but has no Elden Ring equivalent, it may still be too abstract.  
> if it has an Elden Ring equivalent but does not fit Braided Emergence, it may be a seductive metaphor without law.  
> we want both.

---

## 2. What The Language Already Does

Lœgos already contains the constitutional loop:

- `DIR` makes aim explicit
- `GND` grounds witness
- `MOV` + `TST` sends the ping
- `RTN` records what reality answered
- `CLS` governs closure

So the language already owns:

- meaning
- lawful movement
- aim formation
- return significance
- closure discipline

That is the first place we should look for truth.

---

## 3. What The Machine Is Still For

The machine is justified when it does one of these jobs:

1. translate natural language into lawful proposals or artifacts
2. render the current lawful or provisional state so a non-fluent user can steer
3. persist state across turns, sessions, and handoffs
4. bind external returns and receipts to the loop
5. keep preview, canon, and proof boundaries legible

That means:

- the language owns meaning
- the machine owns legibility, persistence, and binding
- reality owns proof

---

## 4. What The Machine Must Not Do

The machine must not:

- author a parallel aim that the language never earned
- manufacture a deciding split that the lawful artifact already knows
- invent closure outside the law path
- act like a second hidden narrator of truth

Heuristic bridge logic is acceptable as a transition layer for ordinary users.
It is not acceptable as the long-term source of truth when the lawful artifact already has the answer.

---

## 5. The Build Rule

Use this rule in order:

1. if the thing can be expressed directly in Lœgos or the compiled artifact, surface that
2. if it cannot, the machine may translate, persist, or attach reality to it
3. if the machine starts authoring parallel meaning, stop and rethink

This is the anti-overengineering rule.

---

## 6. What This Means For `workingEcho`

`workingEcho` should be:

- a rendering of lawful structure plus bounded provisional state
- not a second narrator

That means:

- `aim` should come from the language or artifact when available
- deciding split and missing witness should come from the lawful artifact when available
- evidence buckets should privilege grounded witness and returns over summary prose
- heuristics should stay clearly transitional

Pay special attention to return-heavy cases.

If return evidence is strong but `aim` or `whatWouldDecideIt` still reads mostly like assistant phrasing, the machine is preserving the evidence map without fully surfacing the corrected vector.
That is now a first-class engineering smell.

Every important surfaced field should eventually answer:

- did this come from lawful artifact?
- from bounded provisional conversation state?
- from runtime return?
- from bounded advisory?

If we cannot answer that, the echo is drifting.

---

## 7. What This Means For GetReceipts And Shape Library

### GetReceipts

GetReceipts adds proof status, not thought.

It should tell us:

- what has a draft receipt
- what has been sealed
- what has been externally verified

It should not become the thing that thinks for the Room.

### Shape Library

Shape Library adds bounded advisory, not authority.

It may help with:

- one likely deciding split
- one next lawful move
- one receipt condition
- one disconfirmation line

It should not become a rival truth path.

---

## 8. What This Means For Benchmarks

Benchmarks should not reward machine-authored parallel meaning.

They should prefer:

- surfaced lawful structure
- surfaced provisional state the product truly shows
- surfaced receipts or proof state when present

If the user cannot see it, the benchmark cannot see it.

If the lawful artifact already knows it, the benchmark should not reward a heuristic paraphrase more than the artifact-backed surface.

That means the next benchmark stack should explicitly separate:

1. `law`
2. `language fidelity`
3. `product short loop`
4. `product long loop`

The missing class today is `language fidelity`.
That lane should ask whether important surfaced fields come from:

- lawful artifact
- bounded provisional state
- runtime return
- bounded advisory
- heuristic bridge logic

---

## 9. Current Implementation Implication

The next implementation wave should audit each important `workingEcho` field and ask:

- can this be sourced directly from Lœgos or compiled artifact today?
- if not, what bridge logic is still needed?
- how do we mark that field so we know whether it is lawful, provisional, returned, or advisory?

The current highest-signal place to apply this rule is:

- return-heavy scenarios where `returnDelta` is strong
- but `aim` or `whatWouldDecideIt` is still too assistant-derived

The right direction is not:

- more machine narration

It is:

- more direct surfacing of language-shaped meaning
- better legibility of the lawful loop
- stronger proof travel

The next phase should also use reverse-pass legibility work to police this rule:

- Drive Tape v0 on current benchmark artifacts
- reverse-trace reads on real working threads

If those reveal that clearer rendering already explains most gains, then we should delay heavier advisory machinery even further.

---

## 10. One Line

Let the language do the meaning.  
Let the machine make that meaning usable.  
Let reality decide what held.
