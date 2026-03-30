/**
 * AI-AGENT READINESS: Learn articles are auto-surfaced in /llms.txt and served
 * as Markdown at /learn/{slug}.md. Adding or editing articles here updates both
 * automatically. No manual sync needed.
 */

export interface LearnArticle {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  content: string;
  next?: { slug: string; title: string };
}

export const articles: LearnArticle[] = [
  {
    slug: 'what-is-lakin',
    order: 1,
    title: 'What Is LAKIN?',
    subtitle: 'The 60-second version.',
    description:
      'LAKIN is a physics engine for intelligence. It measures whether a claim touched reality — and seals the proof when it did.',
    next: { slug: 'three-shapes', title: 'The Three Shapes' },
    content: `You've heard a thousand claims today. How many of them touched reality?

LAKIN is a physics engine for intelligence. It does one thing: it measures whether a claim touched reality — and seals the proof when it did.

Every day, billions of claims move through the world. "The project is on track." "Revenue grew 12%." "The shipment arrived." "I led a team of 50." Most of these claims are never checked against an independent system. They're stories. They might be true. They might not. There's no way to tell from the claim itself.

LAKIN changes that by routing claims to **walls** — independent systems that can push back. A bank ledger. A code repository. A GPS sensor. A payment rail. When a claim touches a wall, friction is generated. When someone is there to witness the contact, story surrounds it. When all three lock together, a **receipt** is created.

A receipt is not a story about what happened. It's structured evidence that a claim met reality, story surrounded the contact, and the signal came back.

**The short version:** LAKIN turns "trust me" into "check the receipt."

---

## Why Now

AI can now generate unlimited claims that look exactly like verified output. Reports, summaries, credentials, compliance documents — all of it can be produced at zero cost with zero verification. The world is flooding with convincing content that never touched reality.

LAKIN doesn't fight AI. LAKIN gives AI something to touch. An AI agent that routes its output through walls — and seals the evidence — is producing grounded intelligence, not slop.

---

## The Products

**GetReceipts.com** — The first product. Create, collect, and share receipts. This is where claims meet walls.

**Feel the Seal™** — The patented authentication layer. How you know a receipt is real.

**Lakin** — AI platform for 1–2 people. Think with AI, grounded by receipts.

**Box9** — Coordination platform for teams of 3+. Same engine, team scale.`,
  },
  {
    slug: 'three-shapes',
    order: 2,
    title: 'The Three Shapes',
    subtitle: 'Every claim in the world is made of the same three parts.',
    description:
      'Triangle, Square, Circle — the three shapes that make up every claim. Learn how aim, wall, and story combine into testimony.',
    next: { slug: 'seal', title: 'The Seal' },
    content: `## △ Triangle — The Aim

A triangle is a claim with direction. It points somewhere.

"I will deliver on time." "Revenue grew 12%." "The candidate is qualified." "The project is on track." Every sentence that describes a state of affairs or makes a promise is a triangle.

Triangles are necessary — without them, nothing moves. But triangles don't prove anything. They point at reality. They don't touch it.

**How to recognize a triangle:** If someone could say it without consulting any external system, it's a triangle.

**Examples:**
- A status update in a meeting
- A claim on a resume
- An AI-generated report
- A promise in an email
- A project estimate

---

## □ Square — The Wall

A square is an independent system that can push back. It doesn't care about your story. It resists — or it doesn't.

The wall is always external to the person making the claim. That's what makes it valuable. You don't control it. You can't argue with it. You can only touch it and see what happens.

**How to recognize a wall:** If the system is independent, can confirm or deny, and the claimant doesn't control it — it's a wall.

**Examples:**
- A bank ledger (confirms payment)
- A CI/CD pipeline (confirms deployment)
- A GPS sensor (confirms location)
- A payment rail (confirms transaction)
- A signed contract (confirms commitment)
- A lab instrument (confirms result)

---

## ○ Circle — The Story

The circle is what was happening when the aim touched the wall. Who was there. What evidence was presented. What conditions existed. What someone noticed.

Without the circle, a verified claim is just data — cold, true, but meaningless. The circle is what turns data into testimony. It's the context that makes verification matter.

**How to recognize story:** If you know not just *that* it happened, but *who was there, when, and what they found* — you have a circle.

**Examples:**
- "The CFO pulled the report on Tuesday, cross-referenced Q2, and flagged a discrepancy in APAC" — that's story surrounding a financial verification
- "The driver was Mehmet, it was raining, the pizza arrived in 28 minutes, the kids were at the door" — that's story surrounding a delivery
- "The compliance officer opened the document at 2:38 AM during quarterly review and noted three counterparty mismatches" — that's story surrounding an audit

The circle is the hardest shape to fake because it's made of **presence, not data.** You have to actually be there.

---

## Why Three

This isn't arbitrary.

Two points define a line — infinite positions. Two witnesses can disagree forever. A line is an argument, not a location.

Four points define a square — it can shear into a diamond. Four committee members can deadlock. A square deforms.

**Three points define a position.** A triangle cannot collapse without breaking. It is the minimum structure where ambiguity ends. GPS needs three satellites. Courts want more than two witnesses. Every stable structure in engineering is built from triangles.

Three is where truth gets an address.

---

## The Equations

**△ alone = a claim.** Direction without contact.

**△ + □ = data.** The claim touched a wall. True, but cold.

**△ + □ + ○ = testimony.** The claim touched a wall, and story surrounded it. Meaningful.

**△ + □ + ○ + 𒐌 = receipt.** All three locked together. Portable. Auditable. Real.`,
  },
  {
    slug: 'seal',
    order: 3,
    title: 'The Seal',
    subtitle: 'When the round trip completes, the receipt is born.',
    description:
      'The seal is the moment all three shapes lock together. Learn what a receipt contains, what it isn\'t, and what Feel the Seal means.',
    next: { slug: 'friction', title: 'Friction' },
    content: `## What the Seal Is

The seal (𒐌) is the moment all three shapes lock together.

It's not a stamp on top of a transaction. It's not an approval badge. It's not a signature. The seal is the **completion of the round trip** — the signal went out, touched a wall, gathered story, and came back.

Think of it like a network ping. You send a signal. If nothing comes back, the connection is dead — the server might not exist. If the signal returns, the connection is confirmed. The seal is that return.

When all three shapes are present — aim, wall, and story — the seal locks them into a single portable object: a **receipt.**

---

## What a Receipt Contains

A receipt is structured evidence. It carries:

**The aim (△)** — What was claimed. What direction was set. What someone said they would do or said happened.

**The wall's response (□)** — What the independent system reported when the claim was tested. Confirmed or denied. The raw friction data.

**The story (○)** — Who was there. When it happened. What conditions existed. What was observed. The context that makes the data meaningful.

**The seal (𒐌)** — Proof that all three were present at the same time and locked together. The round trip completed. The echo returned.

---

## What a Receipt Is Not

**A receipt is not a story.** Stories describe what happened in language. Receipts carry structured evidence of contact. A story says "the payment was made." A receipt carries the aim, the ledger's confirmation, who checked it and when, all locked together.

**A receipt is not a certificate.** Certificates are issued by authorities. Receipts are generated by contact with reality. No one "grants" a receipt. The wall pushes back. The story surrounds it. The seal closes. It happens — or it doesn't.

**A receipt is not permanent truth.** A receipt says "at this moment, these three shapes were present and locked." It doesn't claim the underlying reality will never change. It's timestamped evidence, not eternal decree.

---

## Feel the Seal™

Feel the Seal is LAKIN's patented authentication layer (U.S. Patent Application 63/865,338). It's how you know a receipt is real — not just that a receipt was generated, but that the round trip actually completed.

The name is literal: you don't just *see* that a receipt exists. You *feel* the signal come back.

---

## The Simple Test

For any claim, ask:

1. **Is there an aim?** Did someone state a direction? (If no — there's nothing to verify.)
2. **Did it touch a wall?** Was an independent system consulted? (If no — it's a triangle. Unsealed.)
3. **Is there story?** Was someone there? Is there context? (If no — it's data. Cold but real.)
4. **Are all three locked?** Did the seal fire? (If no — it's testimony. Meaningful but not portable.)

If all four are yes: you have a receipt. The signal went out and came back. It's real.`,
  },
  {
    slug: 'friction',
    order: 4,
    title: 'Friction',
    subtitle: 'The harder something is to fake, the more it tells you.',
    description:
      'Friction is LAKIN\'s word for realness — the measurable resistance generated when a claim touches an independent system.',
    next: { slug: 'trust-stack', title: 'The Trust Stack' },
    content: `## What Friction Is

Friction is LAKIN's word for realness. Specifically, it's the **measurable resistance generated when a claim touches an independent system.**

When you transfer money, the bank ledger resists — you can't fake the transfer without actually moving the money. That's high friction. When you check a box on a form saying "I reviewed this document," nothing resists — you can check the box without reading anything. That's low friction.

Friction isn't a feeling. It's a measurement. And it's the single most important signal for determining whether a claim is real.

---

## The Five Components

LAKIN measures friction across five dimensions:

**Independence** — Is the wall controlled by the person making the claim, or is it external? A self-reported metric has low independence. A third-party bank ledger has high independence.

**Cost to fake** — How much money, time, or legal risk would fabrication require? Saying "I delivered" costs nothing. Forging a wire transfer confirmation costs a lot and carries legal risk.

**Irreversibility** — Can the evidence be undone without leaving traces? An email can be deleted. A blockchain entry can't. A wire transfer can be reversed — but the reversal leaves its own trace.

**Witness quality** — What kind of observer confirmed the contact? A human witness, a calibrated instrument, or an automated attestation each carry different weight.

**Auditability** — Can a third party independently verify the evidence chain? If the proof only exists in one person's account of events, auditability is low. If a third party can retrace the same steps and reach the same conclusion, auditability is high.

---

## Friction Grades

These five components combine into a friction grade:

**HIGH** — The claim was verified against an independent system. Costly to fake. Irreversible or trace-leaving. Witnessed by a trusted observer. Auditable by a third party. The signal returned with proof.

**LOW** — Some contact occurred, but the wall is soft. A checkbox. A self-reported number. A verbal confirmation. Easy to fabricate. Hard to audit. The echo is weak.

**NONE** — No contact with any independent system. The claim was made. No wall was consulted. No friction was generated. The signal went out and nothing came back.

---

## Why Friction Matters Now

Before AI, producing low-friction claims had a natural cost: human labor. Someone had to write the report, attend the meeting, draft the email. That labor wasn't verification — but it was *something.* A weak proxy for engagement.

AI removed that last weak proxy. You can now produce unlimited convincing, detailed, professional claims with zero human engagement and zero verification. Friction-grade NONE content is now infinite and free.

This means the only reliable signal left is **actual friction** — actual contact with an independent system that actually pushed back. Everything else is noise.

---

## Examples

| Claim | Friction Grade | Why |
|---|---|---|
| "The project is on track" (said in a meeting) | NONE | No system consulted |
| "I reviewed the document" (checkbox) | LOW | Self-reported, no independent confirmation |
| "Payment confirmed" (bank ledger) | HIGH | Independent system, irreversible, auditable |
| "Code deployed" (CI/CD pipeline log) | HIGH | Independent system, timestamped, auditable |
| "Shipment arrived" (GPS + scanner + signature) | HIGH | Multiple independent systems, witnessed |
| "Revenue grew 12%" (AI-generated report) | NONE | No ledger consulted |
| "Revenue grew 12%" (sealed against ledger) | HIGH | Independent system confirmed, story captured |

The same claim can be friction-grade NONE or HIGH depending entirely on whether it touched a wall.`,
  },
  {
    slug: 'trust-stack',
    order: 5,
    title: 'The Trust Stack',
    subtitle: 'Most organizations make decisions from the wrong layer.',
    description:
      'Every organization operates on three layers of information. Most are upside down — making decisions from the layer with the least friction.',
    next: { slug: 'echo-vs-silence', title: 'Echo vs. Silence' },
    content: `## The Three Layers

Every organization operates on three layers of information. They look like this:

**Layer 3: Story** — Status updates. Presentations. Emails. Reports. Quarterly reviews. This is where most decisions are made. This is what the board reads. This is what fills meetings.

**Layer 2: Intent** — Jira tickets. Roadmaps. OKRs. Budgets. Promises. Plans. This is what organizations use to coordinate direction.

**Layer 1: Contact** — Ledgers. Code commits. Wire transfers. Sensor logs. GPS records. Payment rails. Signed contracts. This is where independent systems actually push back.

---

## The Problem

Most business communication lives in Layer 3. "The project is on track." "Revenue is growing." "The candidate is strong." "We're compliant." These are stories — and stories cost nothing to produce and nothing to fabricate.

Layer 1 — the contact layer — sits mostly unused. The ledgers exist. The commit logs exist. The payment rails exist. But they're disconnected from the applications people use daily. Nobody routes their status update through the CI/CD pipeline. Nobody seals their revenue claim against the accounting ledger. Nobody checks.

**The trust stack is upside down.** Decisions are made from the layer with the least friction, while the layer with the most friction goes ignored.

---

## What AI Did

AI didn't break the trust stack. It was already broken. AI just made it obvious.

Layer 3 was always frictionless. Stories were always easy to fabricate. The weak constraint was human labor — someone had to at least *write* the report, which took time and created a faint signal of engagement.

AI removed that constraint. Layer 3 is now infinite. You can generate unlimited stories at zero cost. Reports, summaries, updates, analyses — all of them convincing, all of them professional, none of them verified against Layer 1.

The layer where trust was already weakest just got flooded. And nothing changed in Layer 1. The walls are still there. They still push back. Nobody's asking them.

---

## Flipping the Stack

The fix is not better stories. The fix is not better AI. The fix is routing claims to Layer 1 before they get treated as real.

**Before:** Someone makes a claim → everyone trusts the story → decisions are made → occasionally someone checks.

**After:** Someone makes a claim → the claim is routed to a wall → the wall confirms or denies → story surrounds the contact → the receipt is sealed → decisions are made from friction data.

This isn't about adding bureaucracy. It's about connecting the layer that knows to the layer that decides. The walls already exist. The data is already there. What's missing is the infrastructure to route claims to walls, capture the story of the contact, and seal the result into something portable.

That's what LAKIN does. It connects Layer 3 to Layer 1 — and makes the return trip visible.

---

## A Real Example

**The status meeting (current state):**
PM says "we're on track." Everyone nods. Decision made from Layer 3.

**The status receipt (with LAKIN):**
PM's claim of "on track" is routed to the CI/CD pipeline, the QA system, and the deployment log. The pipeline shows a green build. QA shows 94% pass rate. Last deployment was Thursday. The PM reviewed these on Monday morning and noted that the APAC dependency shipped late but doesn't block launch.

That's three walls (pipeline, QA, deployment log), one circle (PM reviewed Monday, noted the dependency issue), and one seal (all locked together into a receipt).

No meeting needed. The wall answered.`,
  },
  {
    slug: 'echo-vs-silence',
    order: 6,
    title: 'Echo vs. Silence',
    subtitle: 'The only binary that survives the AI era.',
    description:
      'The old binary was human vs. machine. The new binary is echo vs. silence — did the signal go out and come back, or not?',
    next: { slug: 'getreceipts', title: 'GetReceipts' },
    content: `## The Old Binary

For decades, the implicit binary was **human vs. machine.** Humans create. Machines process. If a human wrote it, it carried implicit trust. If a machine generated it, it was suspect.

That binary is collapsing. AI output is already indistinguishable from human output in most contexts. Within two years, there will be no reliable way to tell who — or what — produced a piece of text, a report, or an analysis.

Every system built on the human-vs-machine binary — AI detection, watermarking, content provenance based on authorship — is on a clock. The clock is running out.

---

## The New Binary

The binary that replaces it is **echo vs. silence.**

**Echo:** The signal went out. It touched a wall. Story surrounded the contact. The signal came back. There is friction data. There is a receipt.

**Silence:** The signal went out. Nothing came back. No wall was consulted. No independent system confirmed or denied. There is no friction data. The claim exists in language only.

This binary doesn't decay with better AI models. It doesn't depend on statistical pattern matching. It doesn't produce false positives. And it answers the question people actually care about: **is this real?**

---

## What Echo Looks Like

"Revenue grew 12%" + the accounting ledger confirms + the CFO reviewed on Tuesday + all three sealed → **Echo.** The signal returned.

"Code deployed to production" + the CI/CD pipeline shows a passing build + the deployment log shows a timestamp + the engineer who merged reviewed the test results → **Echo.**

"Shipment arrived" + GPS log confirms the truck's location + warehouse scanner registered the package + receiving signature captured → **Echo.**

In each case, a claim was made, an independent system was consulted, someone was there, and the evidence was locked together. The round trip completed.

---

## What Silence Looks Like

"The project is on track" — said in a meeting. No system consulted. → **Silence.**

"I have 10 years of experience in machine learning" — written on a resume. No employer system, no code repository, no publication record consulted. → **Silence.**

"This report has been reviewed for accuracy" — stated at the top of a document. No ledger checked. No underlying data confirmed. → **Silence.**

"The patient's condition is stable" — entered in a chart. No vitals system consulted. No lab result confirmed. → **Silence.**

In each case, the claim might be true. It might be completely accurate. But it hasn't been tested. No wall pushed back. No signal returned. It's a triangle floating in space.

---

## Why This Binary Matters

The market is about to be flooded with silence. AI generates unlimited claims at zero cost. Most of those claims will never touch a wall. They'll look exactly like claims that were verified — because language doesn't carry friction data.

The organizations that thrive will be the ones that can instantly distinguish echo from silence — and that only make decisions on claims where the signal came back.

This isn't about being suspicious of everything. It's about having infrastructure that makes the distinction visible. Some claims need high friction — financial commitments, compliance attestations, clinical decisions. Some claims need low friction — brainstorming, early-stage planning, informal coordination. The point isn't to verify everything. The point is to know which claims have been verified and which haven't.

Right now, almost everything looks the same. Echo and silence are indistinguishable in language. LAKIN makes the difference visible.

---

## The Market

The market is not "AI vs. humans." That distinction is already collapsing.

The market is "echo vs. silence." That distinction is permanent.

And right now, almost everything is silence.`,
  },
  {
    slug: 'getreceipts',
    order: 7,
    title: 'GetReceipts',
    subtitle: 'The first product built on LAKIN. Where claims meet walls.',
    description:
      'GetReceipts.com is the refinery — the place where receipts are created, collected, and shared. The first product built on the LAKIN engine.',
    next: { slug: 'glossary', title: 'Glossary' },
    content: `## What It Is

GetReceipts.com is the refinery — the place where receipts are created, collected, and shared. It's the first product built on the LAKIN engine, and it's where the three shapes come to life.

If LAKIN is the physics engine, GetReceipts is the first application that runs on it.

---

## How It Works

### 1. State your aim (△)

Every receipt starts with a triangle — a claim, an intention, a commitment. "I completed the deliverable." "I reviewed the report." "I made the payment." "I read this document."

The aim has direction. It points at something specific. It's the signal going out.

### 2. Touch a wall (□)

The aim is routed to an independent system that can push back. This could be:

- A document you upload as evidence
- A link to a commit, a transaction, or a verified event
- A third-party confirmation
- An API connection to a system of record

The wall doesn't argue. It resists or it doesn't. The key is that it's independent — you don't control what it says.

### 3. Capture the story (○)

What was happening when you touched the wall? What did you notice? Who else was involved? What conditions existed? What notes do you have?

This is the context that turns data into testimony. It's what makes the receipt meaningful, not just true.

### 4. Seal it (𒐌)

When all three shapes are present, the seal locks them together into a portable receipt. The round trip completes. The echo returns.

The receipt is now a single, portable object that carries aim, evidence, and context — locked together with a timestamp and authentication.

---

## What You Can Do With a Receipt

**Share it.** Send a receipt to a colleague, a client, or a stakeholder. Instead of saying "I did the thing," send the receipt that proves it.

**Collect them.** Build a portfolio of receipts over time. Your track record becomes a collection of verified contacts with reality, not a collection of stories.

**Reference them.** Point to a receipt in a meeting, a report, or a negotiation. "Here's the receipt" replaces "trust me."

**Audit them.** Any receipt can be examined by a third party. The aim, the wall's response, and the story of the contact are all visible.

---

## Who It's For

**Individuals** who want a portable, verified track record. Your receipts travel with you.

**Teams** who want coordination grounded in reality instead of status meetings. The wall answers — no meeting needed.

**Organizations** that need compliance evidence, audit trails, or governance infrastructure. Receipts are structured evidence, not narratives.

**Anyone** who's tired of "trust me" and wants to say "check the receipt" instead.

---

## Getting Started

Go to [getreceipts.com](https://getreceipts.com).

Create your first receipt. The three shapes will guide you:

- **△** State your aim
- **□** Touch a wall
- **○** Capture the story
- **𒐌** Seal it

That first receipt is your first round trip with LAKIN — not as a concept, but as physics.`,
  },
  {
    slug: 'glossary',
    order: 8,
    title: 'Glossary',
    subtitle: 'Every LAKIN term in one place.',
    description:
      'The complete LAKIN glossary — every term, shape, and concept defined in one place.',
    content: `### Aim (△ Triangle)
A claim, intention, or commitment with direction. The signal going out. Every sentence, report, or promise that describes a state of affairs or makes a commitment about the future. An aim points at reality — it doesn't prove it arrived.

### Auditability
One of the five friction components. Whether a third party can independently verify the evidence chain. High auditability means anyone can retrace the steps and reach the same conclusion.

### Circle (○) — The Story
The context surrounding the moment a claim touched a wall. Who was there. What evidence was presented. What conditions existed. What was observed. The circle turns data into testimony. It's the hardest shape to fake because it's made of presence, not data.

### Contact
The moment when a claim (triangle) reaches an independent system (square). Contact generates friction — measurable resistance that indicates something real happened.

### Cost to Fake
One of the five friction components. The money, time, or legal risk required to fabricate the evidence. Higher cost to fake means higher friction.

### Echo
A signal that went out and came back. A claim that touched a wall, gathered story, and returned as a receipt. The opposite of silence. Echo is proof of a completed round trip.

### Echo Canon
The theoretical framework underlying LAKIN. The set of principles, shapes, and mechanisms that define how claims are verified against reality.

### Feel the Seal™
LAKIN's patented authentication layer (U.S. Patent Application 63/865,338). The mechanism by which you know a receipt is real — that the round trip actually completed.

### Friction
The measurable resistance generated when a claim touches an independent system. Friction is LAKIN's word for realness. It's composed of five components: independence, cost to fake, irreversibility, witness quality, and auditability.

### Friction Grade
A rating of how much resistance a claim generated. **HIGH:** costly to fake, independently verified, irreversible. **LOW:** some contact, but the wall is soft. **NONE:** no contact with any independent system.

### GetReceipts
The first product built on the LAKIN engine. The platform where receipts are created, collected, and shared. Found at getreceipts.com.

### Grounded Intelligence
AI output that has been routed through touch surfaces and sealed with friction data. The opposite of slop. An AI agent that touches walls and seals its work is producing grounded intelligence.

### Independence
One of the five friction components. Whether the wall is controlled by the person making the claim or is external. High independence means the claimant can't manipulate the wall's response.

### Irreversibility
One of the five friction components. Whether the evidence can be undone without leaving traces. An irreversible action (like a wire transfer) carries more friction than a reversible one (like an unsent email).

### LAKIN
The physics engine for intelligence. The underlying system of shapes, seals, and friction measurement that powers all LAKIN products. Named after the infrastructure layer that connects claims to reality.

### Layer 1: Contact
The bottom layer of the trust stack. Where independent systems live — ledgers, commits, sensors, payment rails. The layer with the most friction and the least attention.

### Layer 2: Intent
The middle layer of the trust stack. Where plans and commitments live — tickets, roadmaps, OKRs, promises.

### Layer 3: Story
The top layer of the trust stack. Where most decisions are made — status updates, presentations, emails, reports. The layer with the least friction and the most attention.

### Receipt
A portable, auditable object created when all three shapes lock together with a seal. Contains the aim (△), the wall's response (□), the story of the contact (○), and the seal (𒐌). A receipt is not a story — it's structured evidence that a claim met reality.

### Round Trip
The complete journey of a signal: out (aim), contact (wall), context (story), and return (seal). A receipt is the artifact of a completed round trip. If the signal never returns, the claim is silence.

### Seal (𒐌)
The moment all three shapes lock together. The completion of the round trip. The signal returning. The seal is not a stamp on contact — it's the closure that makes a receipt portable and verifiable.

### Silence
A signal that went out but never returned. A claim that was never tested against an independent system. The opposite of echo. Silence might be true, but it hasn't been verified. Most business communication is silence.

### Slop (AI Slop)
Output that never touched reality. Content that looks exactly like verified output but was never checked against an independent system. Slop is friction-grade NONE — triangles that never touched squares. Not defined by quality or origin, but by the absence of friction.

### Square (□) — The Wall
An independent system that can push back against a claim. The wall doesn't argue — it resists or it doesn't. Examples: bank ledgers, code repositories, GPS sensors, payment rails, signed contracts, lab instruments.

### Touch
The verb for what happens when a claim reaches a wall. "Did it touch?" means "was it tested against an independent system?" The core action in the LAKIN mechanism.

### Touch Surface
An independent system that can be touched — a wall that can push back. Banks, code repos, sensors, payment rails, GPS systems, payroll, contracts, inventory systems. LAKIN's validator adapters connect to these surfaces.

### Triangle (△) — The Aim
See: Aim.

### Trust Stack
The three-layer model of organizational information. Layer 1 (Contact) has the most friction. Layer 3 (Story) has the least. Most organizations are upside down — making decisions from Layer 3 while ignoring Layer 1.

### Untouched
A claim that has not been tested against an independent system. A triangle that never met a square. The claim might be true, but it carries no friction data.

### Validator Adapter
A pre-built connector between the LAKIN engine and a touch surface. Examples: GitHub, Stripe, DocuSign, Jira, Salesforce, GPS, payroll systems. Validator adapters are how claims get routed to walls.

### Wall
See: Square.

### Witness Quality
One of the five friction components. What kind of observer confirmed the contact. A human witness, a calibrated instrument, and an automated attestation each carry different weight.

---

*Missing a term? Let us know at [getreceipts.com](https://getreceipts.com).*`,
  },
];

export function getArticle(slug: string): LearnArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getAllSlugs(): string[] {
  return articles.map((a) => a.slug);
}
