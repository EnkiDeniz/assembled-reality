# Operate — The Engine Inside the Box

**Press one button. The box reads itself.**

---

## What Operate Does

Operate is the single action that turns a box of raw sources into a compressed, testable, actionable structure. It takes everything in the box — every .md file, every converted screenshot, every extracted link — and runs the Meaning Operator across the full inventory.

The output is not a summary. It is a projection: the smallest set of operator sentences that still carry the full weight of what's in the box.

Then it checks those sentences against reality.

---

## The Five-Step Loop

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

Why .md: it is the thinnest format that preserves structure. No styling. No binary. Every source becomes readable by the same grammar. A voice memo and a spreadsheet become the same material — stackable blocks.

This step runs automatically on source entry. By the time the user presses Operate, standardization is already done.

---

### Step 2 — Shape-Read (Gradient 2 → 3)

The system classifies every sentence in every .md file.

Each sentence receives a coordinate: **Shape (△□○) × Gradient (1–7).**

- **△ sentences** declare, intend, aim, hope, promise, choose.
- **□ sentences** measure, evidence, verify, ground, report, constrain.
- **○ sentences** connect, narrate, contextualize, bridge, interpret.

The shape-read produces a distribution map of the entire box:

```
Box shape distribution:
  △ 47%  □ 22%  ○ 31%

Gradient distribution:
  1–2: 15%   (raw / warming)
  3–4: 55%   (clarifying / directed)
  5–6: 25%   (tested / integrating)
  7:    5%   (sealed)
```

This is diagnostic. The box knows what it contains before compression begins.

---

### Step 3 — Compress (Gradient 3 → 4)

The Meaning Operator runs. It takes the full shape-read inventory and projects it onto the smallest set of operator sentences that preserve structure under compression.

The compression follows the operator sentence design rules:

1. One operator per sentence.
2. Cut any word that does not strengthen the operation.
3. If removing one word breaks the line, the density is right.
4. The sentence must survive outside the box where it was produced.

#### The Output Format

Operate produces three operator sentences. One per shape. Together they form an operator chain — the minimum executable description of the box.

**The Aim (△):**
> [Who] aims to [action] so that [outcome].

This is the invoice. It declares what the box is trying to do. It opens an account with reality.

**The Ground (□):**
> [What exists] evidences [condition], constrained by [limit].

This is the current reality. What's actually in the box that touches the world. Not what's hoped for — what's already there.

**The Bridge (○):**
> [Aim] meets [ground] at [point of contact], producing [signal or gap].

This is the diagnostic. Where does the triangle touch the square? What's the delta?

#### Worked Example

A user's box contains: a pitch deck draft, three investor email threads, a revenue spreadsheet, a product demo recording, and a competitor analysis link.

After standardization and shape-read:

```
Box shape: △ 58%  □ 27%  ○ 15%
Gradient:  mostly 2–3, some 4
Diagnosis: aim-heavy, under-evidenced, low story integration
```

Operate compresses to:

> **△** Founder aims to close a $2M seed round so that the team can ship v1 by Q3.

> **□** Three investor conversations exist at intro stage, revenue is $0, and a working demo covers 40% of the promised feature set.

> **○** The aim claims Q3 readiness but the ground shows pre-revenue with partial demo coverage — the gap is between the fundraise narrative and the build state.

Three sentences. The box is now legible. The gap is named.

---

### Step 4 — Check (Gradient 4 → 5)

The system takes the three operator sentences and runs the settlement test.

For each sentence, it asks:

| Test | Question | Pass / Fail |
|---|---|---|
| **Invoice test** | Does the △ sentence declare a testable expectation? Can someone outside the box verify whether it happened? | Pass: "close a $2M seed round by Q3." Fail: "build something great." |
| **Receipt test** | Does the □ sentence contain at least one verifiable fact? Is there evidence that reality answered? | Pass: "revenue is $0, demo covers 40%." Fail: "we're making good progress." |
| **Coherence test** | Does the ○ sentence name the actual gap, not paper over it? Would another witness with no incentive to agree reach the same diagnosis? | Pass: "gap is between narrative and build state." Fail: "everything is aligned." |
| **Survival test** | Do all three sentences survive contact with a stranger who has never seen the box? Can they act on these sentences without avoidable clarification? | This is the Agent test from the lœgos spec. |

Check produces a result:

- **Convergent** — △ and □ are close. The gap is small or closing. The box is approaching seal conditions.
- **Divergent** — △ and □ are far apart. The gap is named but real. The box needs more evidence, a rerouted aim, or both.
- **Hallucinating** — △ claims a position that □ does not support. The operator sentence sounds settled but the invoice is unpaid. This is the failure mode the settlement logic was built to catch.

---

### Step 5 — Seal or Reroute (Gradient 5 → 6 → 7)

Based on the Check result, the system offers two paths:

#### If Convergent → Seal

The three operator sentences become a receipt. The receipt records:

- The △ sentence (what was aimed).
- The □ sentence (what was real).
- The ○ sentence (how they met).
- The timestamp.
- The convergence score (how close △ and □ were).

The receipt is a sealed operator chain. It is portable — it can leave the box and still make sense to someone who wasn't in the room. "Evidence makes authority portable."

The box moves to gradient 7. The receipt names the box if it was previously untitled.

#### If Divergent → Reroute

The system shows the gap and asks:

- **Adjust the aim?** The △ sentence may be too ambitious, too vague, or aimed at the wrong thing. The user can rephrase.
- **Add evidence?** The □ sentence may be thin. The user can add sources that ground the aim.
- **Reframe the bridge?** The ○ sentence may have the wrong diagnosis. The user can reinterpret.

Reroute is not failure. "Reroute is respect for truth." The box stays at gradient 4–5 and the user runs Operate again after the adjustment.

#### If Hallucinating → Alert

The system flags the specific mismatch:

> "Your aim claims [X] but your sources show [Y]. The distance is [Z] gradient positions. This is a shape-placement gap — a △ word is sitting where a □ word should be."

This is the hallucination delta. The core diagnostic that the coordinate system was built to detect. The system does not fix it. It names it. The user decides what to do.

---

## The Operator Chain as Receipt Schema

Every sealed receipt in the box follows the same three-sentence schema:

```
△  [Agent] aims to [action] so that [outcome].
□  [Evidence] shows [condition], constrained by [limit].
○  [Aim] meets [ground] at [contact point], producing [signal].
```

This is the receipt format. It is an operator chain with exactly three links — one per shape. The chain is the minimum unit that captures the full loop: intention, reality, and the bridge between them.

Over time, the box accumulates receipts. Each receipt is a sealed operator chain. The collection of receipts IS the assembly history of the box — a manifest of every convergence that happened inside it.

---

## What Operate Is Not

| It is not... | Because... |
|---|---|
| A summary | A summary compresses content. Operate compresses structure. The output is not shorter text — it is a testable operator chain. |
| A chatbot response | Operate does not converse. It projects, checks, and reports. One button, one output. |
| An AI rewrite | Operate does not improve the sources. It reads them as they are and produces a diagnosis of what they actually say. |
| A judgment | Operate does not tell the user they are wrong. It shows the gap between aim and reality and lets the user decide. |

---

## Frequency

Operate can run as often as the user wants. Every time new sources enter the box, the shape-read updates and Operate can recompress. The operator chain evolves as the box fills.

Early in a box's life, Operate will mostly show divergence — lots of aims, little evidence. This is normal. Gradient 1–3.

As evidence accumulates, the gap narrows. The operator chain tightens. The system approaches convergence. Gradient 4–6.

When the chain passes all four tests and the gap is below threshold, the system offers the seal. Gradient 7.

The arc of a box IS the arc of the gradient: raw → warming → clarifying → directed → tested → integrating → sealed. Operate is the engine that moves the box along that arc.

---

## Design Constraint

Operate must produce output that passes its own tests.

The three operator sentences it generates must be:

- Understandable without a lecture. (Operator sentence evaluation test, item 1.)
- Repeatable a week later. (Item 2.)
- Able to guide an actual choice. (Item 3.)
- Able to survive contact with evidence. (Item 4.)
- Useful outside the box where they appeared. (Item 5.)
- Clarifiable under challenge without losing force. (Item 6.)

If the output of Operate cannot pass the operator sentence evaluation test, the engine is miscalibrated. The output is not lœgos-compliant. Fix the engine, not the sources.

---

*One button. Three sentences. The gap has a name. Now you can move.*
