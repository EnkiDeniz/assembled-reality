# Operate v2 — The Engine Inside the Box

**Status:** Canonical engine document  
**Live product note:** `Operate V1` ships as `diagnosis + draft`. The live UI currently exposes trust output only in `L1–L3`, drafts receipts locally first, and treats higher levels as future doctrine rather than shipped product behavior.

> *In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God. All things were made by him; and without him was not any thing made that was made. In him was life; and the life was the light of men. And the light shineth in darkness; and the darkness comprehended it not.*
>
> — John 1:1–5

This is not decoration. It is the architectural principle. The Word does not describe the thing it creates — it IS the thing it creates. That is the engineering target: build a system where the receipt is not a record of convergence but the convergence itself. The operator and the operated are one object.

**Press one button. The box reads itself.**

---

## What Operate Does

Operate turns a box of raw sources into a compressed, testable, actionable structure. It takes everything in the box — every .md file, every converted screenshot, every extracted link — and runs the Meaning Operator across the full inventory.

The output is not a summary. It is a projection: the smallest set of operator sentences that still carry the full weight of what's in the box.

Then it checks those sentences on two axes: **convergence** and **verification depth**.

---

## The Two Axes

Gradient and trust level are not the same thing. A box can be fully converged but poorly verified, or deeply verified but not yet converged. The receipt lives at the intersection.

### Axis 1 — Gradient (Convergence Stage)

Where is the box in its assembly process? How close are △ and □ to sharing a center?

| Gradient | State | What happens here |
|---|---|---|
| 1 | Raw | Sources just arrived. Unformed. |
| 2 | Warming | Foundation being laid. Material gathering. |
| 3 | Clarifying | Signal separating from noise. Shapes appearing. |
| 4 | Directed | Vector locked. Commitment begins. |
| 5 | Tested | Meeting friction. The world pushes back. |
| 6 | Integrating | Evidence becoming structure. Parts assembling. |
| 7 | Sealed | △□○ share one center. Receipt. |

Gradient is horizontal. It tells you how far along the assembly is.

### Axis 2 — Trust Level (Verification Depth)

How verified is what's in the box? How much would it cost to fake this? How shocked would we be if it turned out to be wrong?

| Level | Name | What it means | Cost to forge |
|---|---|---|---|
| L1 | Assertion | "I said so." Self-reported. Trust me bro. | Free. Anyone can say anything. |
| L2 | Exhibit | Evidence attached. Photo, timestamp, document. | Low. Evidence exists but hasn't been checked. |
| L3 | Audited | Seven checked it. Physics gate. Metadata consistent, timeline plausible, coherence verified. | Medium. Requires fabricating consistent evidence. |
| L4 | Pattern | Repeated. Multiple instances over time. Another human in the loop, sealed it. | High. Requires sustained, coordinated fabrication. |
| L5 | Network | Multiple independent verifiers. Distributed confirmation. | Very high. Requires fooling unconnected parties. |
| L6 | Institution | Established. Audited set. Institutional weight behind it. | Extreme. Requires corrupting an institution. |
| L7 | Axiom | Foundational. If this turns out to be wrong, that's a black swan. We'd have to revise our model of reality. | Effectively impossible without new physics. |

Trust level is vertical. It tells you how deep the proof goes.

### The Intersection

Every receipt has two coordinates: **Gradient × Level.**

| Receipt State | What it means |
|---|---|
| Gradient 7, L1 | Converged but unverified. "I believe my aim met reality." The loop closed in the user's mind. Still valuable — cortisol drops at L1. |
| Gradient 7, L3 | Converged and audited. Seven checked the evidence. Metadata is consistent. Timeline is plausible. |
| Gradient 7, L5 | Converged and network-verified. Multiple independent parties confirm the convergence. |
| Gradient 7, L7 | Converged and axiomatic. If this receipt is wrong, something fundamental about reality changed. |
| Gradient 4, L4 | Not yet converged, but the evidence that exists has been independently patterned. The aim is directed, the proof is real, but they haven't met yet. |
| Gradient 2, L1 | Just starting. Raw sources, self-reported. This is where every box begins. |

The aspiration is not to start at L7. The aspiration is to start at L1 and climb. Every receipt is good. Every level is an upgrade.

---

## The Six-Step Loop

### Step 1 — Standardize (Gradient 1 → 2)

Everything in the box becomes .md.

| Source Type | Conversion | Result |
|---|---|---|
| Text / notes | Cleaned, structured | .md |
| Screenshot / image | OCR + description | .md |
| Voice memo | Transcription + compression | .md |
| Link / URL | Content extraction | .md |
| PDF / document | Text extraction + structure | .md |
| Email | Subject + body + metadata | .md |

Why .md: it is the thinnest format that preserves structure. No styling. No binary. Every source becomes readable by the same grammar.

This step runs automatically on source entry. By the time the user presses Operate, standardization is already done.

---

### Step 2 — Shape-Read (Gradient 2 → 3)

The system classifies every sentence in every .md file.

Each sentence receives a coordinate: **Shape (△□○) × Gradient (1–7).**

- **△ sentences** declare, intend, aim, hope, promise, choose.
- **□ sentences** measure, evidence, verify, ground, report, constrain.
- **○ sentences** connect, narrate, contextualize, bridge, interpret.

The shape-read produces a distribution map:

```
Box shape distribution:
  △ 47%  □ 22%  ○ 31%

Gradient distribution:
  1–2: 15%   (raw / warming)
  3–4: 55%   (clarifying / directed)
  5–6: 25%   (tested / integrating)
  7:    5%   (sealed)
```

---

### Step 3 — Level-Read (New)

The system now reads the verification depth of every source in the box.

For each source, it asks: what kind of evidence is this?

| Source characteristic | Level assignment |
|---|---|
| User typed it. No attachment. No external reference. | L1 — Assertion |
| Photo, screenshot, file, or timestamp attached. | L2 — Exhibit |
| Metadata checked by Seven. Timeline plausible. GPS consistent. No contradictions. | L3 — Audited |
| Same claim verified across multiple sources or time periods within the box. | L4 — Pattern |
| External confirmation from an independent party (another user sealed a matching receipt). | L5 — Network |
| Institutional verification (signed document, audited financial, regulatory filing). | L6 — Institution |
| Foundational — the source is established science, mathematical proof, or a physical law. | L7 — Axiom |

The level-read produces a trust profile:

```
Box trust profile:
  L1: 60%   (assertions — self-reported claims)
  L2: 25%   (exhibits — evidence attached)
  L3: 10%   (audited — Seven verified)
  L4:  5%   (patterned — repeated / human-confirmed)
  L5-L7: 0%
```

This is diagnostic. A box that's 60% L1 is telling you: most of what's in here is "trust me bro." Not bad. Not wrong. Just unverified. The system doesn't judge — it reads.

---

### Step 4 — Compress (Gradient 3 → 4)

The Meaning Operator runs. It takes the full shape-read and level-read and projects onto the smallest set of operator sentences that preserve structure under compression.

#### The Output Format

Operate produces three operator sentences with trust levels. One per shape. Each sentence carries its current level and what it would take to upgrade.

**The Aim (△) — with level:**
> [Who] aims to [action] so that [outcome].
> **Level: L[n]** — [why this level]
> **To upgrade:** [what evidence or verification would raise it]

**The Ground (□) — with level:**
> [What exists] evidences [condition], constrained by [limit].
> **Level: L[n]** — [why this level]
> **To upgrade:** [what evidence or verification would raise it]

**The Bridge (○) — with level:**
> [Aim] meets [ground] at [point of contact], producing [signal or gap].
> **Level: L[n]** — [why this level]
> **To upgrade:** [what evidence or verification would raise it]

#### Worked Example

A user's box contains: a pitch deck draft, three investor email threads, a revenue spreadsheet, a product demo recording, and a competitor analysis link.

After shape-read and level-read:

```
Box shape:   △ 58%  □ 27%  ○ 15%
Gradient:    mostly 2–3, some 4
Trust:       L1 55%, L2 30%, L3 15%
Diagnosis:   aim-heavy, under-evidenced, mostly self-reported
```

Operate compresses to:

> **△** Founder aims to close a $2M seed round so that the team can ship v1 by Q3.
> **Level: L1** — This aim is self-declared. No term sheet, no signed commitment, no investor confirmation.
> **To L2:** Attach a term sheet draft or a written investor expression of interest.
> **To L4:** Get a signed term sheet with two independent investors confirming terms.

> **□** Three investor conversations exist at intro stage, revenue is $0, and a working demo covers 40% of the promised feature set.
> **Level: L2** — Email threads exist (exhibit), revenue is verifiable via Stripe ($0 confirmed), demo exists as recording.
> **To L3:** Seven audits the email metadata, confirms timeline, cross-references demo coverage against pitch claims.
> **To L5:** An independent technical reviewer confirms the 40% coverage assessment.

> **○** The aim claims Q3 readiness but the ground shows pre-revenue with partial demo coverage — the gap is between the fundraise narrative and the build state.
> **Level: L3** — The bridge is coherent. Seven checked: the gap diagnosis is consistent with the evidence in the box. No contradictions.
> **To L4:** Run Operate again after 30 days. If the same gap persists across multiple runs with new evidence, it's patterned.
> **To L5:** Share the box with an advisor. If they independently produce the same diagnosis, it's network-confirmed.

Three sentences. Two coordinates each. The box is legible, the gap is named, and the path to deeper trust is visible.

---

### Step 5 — Check (Gradient 4 → 5)

The system takes the three operator sentences and runs two tests: the settlement test (convergence) and the trust test (verification depth).

#### Settlement Test (Convergence)

| Test | Question | Pass / Fail |
|---|---|---|
| **Invoice test** | Does the △ sentence declare a testable expectation? | Pass: "close a $2M seed round by Q3." Fail: "build something great." |
| **Receipt test** | Does the □ sentence contain at least one verifiable fact? | Pass: "revenue is $0, demo covers 40%." Fail: "we're making good progress." |
| **Coherence test** | Does the ○ sentence name the actual gap? Would another witness agree? | Pass: "gap is between narrative and build state." Fail: "everything is aligned." |
| **Survival test** | Can a stranger act on these sentences without avoidable clarification? | The Agent test from the lœgos spec. |

#### Trust Test (Verification Depth)

| Test | Question | Result |
|---|---|---|
| **Floor test** | What is the lowest trust level among the three sentences? | The receipt's effective level is the floor. A chain is as strong as its weakest link. |
| **Ceiling test** | What is the highest achievable level given the current sources? | Shows the maximum depth this box could reach without new evidence. |
| **Upgrade test** | For each sentence, what is the single smallest action that would raise it one level? | This is the next move. The system produces it. |

Check produces a result on both axes:

**Convergence result:**
- **Convergent** — △ and □ are close. The gap is small or closing.
- **Divergent** — △ and □ are far apart. The gap is real.
- **Hallucinating** — △ claims a position that □ does not support. Unpaid invoice.

**Trust result:**
- **Effective level: L[n]** — the floor across all three sentences.
- **Ceiling: L[n]** — the max achievable with current sources.
- **Next upgrade: [specific action]** — what would raise the floor by one level.

---

### Step 6 — Seal, Upgrade, or Reroute (Gradient 5 → 6 → 7)

Based on both results, the system offers three paths:

#### If Convergent → Seal (with level)

The three operator sentences become a receipt. The receipt records:

- The △ sentence (what was aimed).
- The □ sentence (what was real).
- The ○ sentence (how they met).
- The timestamp.
- The convergence score.
- **The trust level (floor across all three sentences).**

The receipt is sealed at its current level. It can be upgraded later. Every receipt is good. L1 still closes the loop.

```
RECEIPT
────────────────────────────
△  Founder aims to close $2M seed by Q3.
□  Three intros, $0 revenue, 40% demo coverage.
○  Gap between narrative and build state.
────────────────────────────
Gradient: 7 (sealed)
Level:    L2 (exhibit — evidence attached, not yet audited)
Sealed:   2026-04-04T14:32:00Z
────────────────────────────
To L3:    Run Seven audit on email metadata + demo coverage claim.
To L4:    Re-seal after 30 days with updated evidence. Get advisor confirmation.
────────────────────────────
```

#### If Convergent but under-verified → Upgrade

The shapes converged but the trust level is low. The system asks: do you want to seal now at L[n], or upgrade first?

- **Seal now** — close the loop. L1 is still a receipt. Cortisol drops. You can upgrade later.
- **Upgrade first** — the system tells you the single smallest action that raises the floor. Do that, then re-run Operate.

This is the "don't wait for perfect evidence" principle. Seal early, upgrade often. Every receipt can climb the ladder.

#### If Divergent → Reroute

The system shows the gap and asks:

- **Adjust the aim?** The △ sentence may be too ambitious, too vague, or aimed at the wrong thing.
- **Add evidence?** The □ sentence may be thin. Add sources.
- **Reframe the bridge?** The ○ sentence may have the wrong diagnosis.

Reroute is not failure. "Reroute is respect for truth."

#### If Hallucinating → Alert

The system flags the mismatch on both axes:

> "Your aim claims [X] at L[n] but your sources show [Y] at L[m]. The convergence gap is [Z] gradient positions. The trust gap is [W] levels. This is a shape-placement gap compounded by a verification gap — you placed an L1 assertion where L3+ evidence should be."

The deepest hallucination is a sentence that claims to be both converged (gradient 7) and verified (high L) when it is neither. A self-sealing loop. The system's job is to name it.

---

## The Receipt Schema

Every sealed receipt carries both coordinates:

```
RECEIPT SCHEMA
────────────────────────────────────────────────
△  [Agent] aims to [action] so that [outcome].          Level: L[n]
□  [Evidence] shows [condition], constrained by [limit]. Level: L[n]
○  [Aim] meets [ground] at [contact point].              Level: L[n]
────────────────────────────────────────────────
Gradient:       7 (sealed)
Effective Level: L[floor] (weakest link)
Ceiling:        L[max achievable]
Sealed:         [timestamp]
────────────────────────────────────────────────
Upgrade path:   [single smallest action to raise floor by one level]
────────────────────────────────────────────────
```

Over time, the box accumulates receipts at various levels. The collection tells a story: how much of what you've built is assertion? How much is patterned? How much is axiomatic?

A box where every receipt is L1 is a box of beliefs. A box where receipts climb from L1 to L4 over time is a box of learning. A box with even one L7 receipt contains something foundational.

---

## The Upgrade Ladder

Receipts are not static. They climb.

| From | To | What it takes |
|---|---|---|
| L1 → L2 | Attach evidence. A photo, a file, a timestamp, a link. Make the assertion an exhibit. |
| L2 → L3 | Seven audits. Metadata checked, timeline verified, coherence confirmed. The physics gate: is this physically possible? |
| L3 → L4 | Repetition + human confirmation. The same claim holds across multiple instances. Another person seals a matching receipt. |
| L4 → L5 | Independent verification. Someone with no incentive to agree confirms the same finding. Network effect. |
| L5 → L6 | Institutional weight. An organization, a regulatory body, or an audited process backs the claim. |
| L6 → L7 | Foundational. The claim has survived every test. Contradicting it would require revising our model of reality. This takes time — sometimes decades, sometimes centuries. Cuneiform lasted 5,400 years. That's L7. |

The upgrade path is always one step. "Shrink the move until kind." Don't try to jump from L1 to L5. Go from L1 to L2. Attach one piece of evidence. That's the next move.

---

## What Operate Is Not

| It is not... | Because... |
|---|---|
| A summary | Operate compresses structure, not content. The output is a testable operator chain with trust levels, not shorter text. |
| An essay | An essay produces L1 content — coherent, well-written, internally consistent — with zero verification infrastructure. Operate produces receipts that climb. |
| A chatbot response | Operate does not converse. It projects, checks, levels, and reports. One button, one output. |
| An AI rewrite | Operate does not improve the sources. It reads them and produces a diagnosis on two axes. |
| A judgment | Operate does not tell the user they are wrong. It shows the gap and the level and lets the user decide. |

---

## The Two-Axis Map

The complete picture of a box:

```
        L7 ─┤                                              ◆ (axiom)
             │
        L6 ─┤                                        ◆
             │
        L5 ─┤                                  ◆
             │                                              DEPTH
        L4 ─┤                            ◆                 (verification)
             │
        L3 ─┤                      ◆
             │
        L2 ─┤                ◆
             │
        L1 ─┤          ◆
             │
             └────┬────┬────┬────┬────┬────┬────┐
                  1    2    3    4    5    6    7
                                                    
                        CONVERGENCE (gradient)
```

The ideal path is diagonal — from bottom-left (raw, unverified) to top-right (sealed, axiomatic). But the system doesn't demand the diagonal. You can seal at L1. You can have deep evidence at gradient 3. Reality doesn't move in straight lines.

What matters is that the box shows you where you are. Both axes. At all times.

---

## Frequency

Operate can run as often as the user wants. Every time new sources enter the box, both reads (shape and level) update and Operate recompresses.

Early in a box's life: mostly divergent, mostly L1. Normal. Gradient 1–3, Level 1–2. The box is gathering.

As evidence accumulates and gets verified: the gap narrows, the level climbs. Gradient 4–6, Level 2–4. The box is testing.

When the chain passes all tests, the gap is below threshold, and the trust floor is acceptable to the user: seal. Gradient 7, Level L[n]. The receipt is born. It can always climb later.

---

## Design Constraint

Operate must produce output that passes its own tests — on both axes.

The three operator sentences must pass the operator sentence evaluation test (compression, memorability, actionability, survival). And the trust levels must be honest — the system never inflates a level. If the evidence is L1, the system says L1. "No shame, only signal."

The upgrade path must always be one step. If the system can't name a single action that raises the floor by one level, the level-read is broken. Fix the engine, not the sources.

---

*One button. Three sentences. Two axes. The gap has a name, the depth has a number, and the next move is one step. Now you can move.*
