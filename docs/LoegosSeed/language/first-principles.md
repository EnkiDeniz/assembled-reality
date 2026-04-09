# First Principles

Date: April 6, 2026
Status: Canonical — return here when drifting
Purpose: The setup. The rules. The 90/10 split. Read this before writing any new spec.

## The Setup

There are three things in the room:

1. **A human.** Writes, declares, interprets, volunteers direction, bears cost.
2. **A super-capable LLM.** Speaks every language. Does math. Writes code. Creates graphs, diagrams, visualizations. Computes at scale. Translates between domains.
3. **A shared language (Loegos).** A visual coordination language that both the human and the LLM read on the same text.

The product is the third thing: **Loegos is the medium through which the human and the LLM talk to each other.**

The tool is not the product. The tool is the facilitator and record keeper for a conversation that is already happening in a shared language.

## The 90/10 Rule

**The language does 90% of the work.**
**The tool does 10%: render, trigger, record.**

If the tool is doing more than render, trigger, or record, it is building the wrong thing.

- **Render** = translate the human's text into Loegos language so both sides can read the coordination code in it
- **Trigger** = route declared compute to the LLM when the human asks (operate, compress, translate, graph, etc.)
- **Record** = preserve what survived contact with reality, as a permanent, inspectable receipt

Everything else the LLM already knows how to do. Math. Graphs. Cross-language translation. Code generation. Statistical reasoning. The product does not rebuild those. It gives the human and the LLM a shared visual language for coordinating on what matters, what's grounded, and what comes next.

## The Rendering Rule

**Loegos rendering is always on.**

The default state of any text surface is Loegos rendering — shape glyphs, signal color, weight. Not plain text.

**Plain text is an option, not a default.**

The only exception: when the user is explicitly typing plain text in an input field, the input shows what they're typing as they type it. The moment the text enters the system as a block, it renders in Loegos language.

**Why:** The whole point of the product is that text is already coordination code. Plain text is not the natural state — it is the hidden state. Loegos rendering is the act of reading the code that was always there.

Showing plain text first would be like showing source code without syntax highlighting and then turning it on. The highlighting is not a view mode. It is the language.

## The Mystery Unfolds

**Do not render everything at once.**

The Loegos rendering should reveal itself over time through interaction:

- A freshly pasted source enters with shape glyphs inferred from content, neutral signal, light weight. The structure is visible but the opinion is not formed.
- When the user runs operate, signal colors arrive. The text gains an opinion.
- When evidence is added or overrides are attested, weight increases. The text gains substance.
- When reality returns and a seal happens, the weight locks. The text becomes immutable.

The user should feel they are **discovering** what is grounded, not being told. The mystery is not decoration. It is the product's method of teaching its own language through use.

## Consent Before Compute (Echo Canon)

> Declaration creates the frame. No declaration, no polarity. No polarity, no meaningful computation. This is not an ethical add-on. It is the origin condition.

**The system does not compute without consent.**

The human declares. Then the system computes. Never the reverse.

Concrete rules:

- Operate does not run automatically on paste. The user triggers it.
- Seven does not speak unless opened. The assistant is collapsed by default.
- Signal does not change without a declared edit or a declared operate run.
- Evidence is not fetched from outside the box without explicit permission.
- Suggestions do not become commitments without the human accepting them.

Consent before compute is not a permission dialog. It is the structural rule that the human authors and the system assists. If the system computes before the human declares, the frame was never established and the output has no authorized interpretation.

## The Verb Set: Translate, Operate, Compress

The product's core verbs are three, not many:

### Translate
Read the coordination code in the human's text. Assign shape (type), signal (evidence state), and weight (trust × depth) to each block. This is the rendering itself — the act of translation is what the user sees.

Translate is continuous and cheap. It happens on every edit, every load, every view. The system is always reading.

### Operate
Run compute on the declared material. Check evidence. Produce findings. Update signal. This is the LLM doing work the human asked for.

Operate is triggered, not continuous. The human declares "check this" and the system checks it against local sources. The LLM's full capability (math, cross-language reasoning, domain knowledge) is available here, but only after consent.

### Compress
Take what survived operate and make it tighter. Merge related blocks. Resolve contradictions. Reduce vagueness to specificity. Keep what's grounded, drop what's coherent-but-untested.

Compress is the move that turns raw seeds into sealed receipts. It is where the document gets heavier and smaller at the same time. The LLM can propose compressions; the human accepts or rewrites them.

The sequence is not strictly linear. You translate, operate, compress, translate again, operate again, compress again. Each pass increases depth. Each pass reduces the gap between what was declared and what reality returned.

## Echo Canon as Literal Behavioral Disposition

The system does not cite the Echo Canon. It behaves according to it.

The canon shapes tone, framing, and refusal conditions — not findings. These principles are load-bearing rules the system must follow:

- **Friction is testimony, not failure.** When the user hits resistance, the system does not flatten it. It preserves it as signal.
- **Hope is aim waiting to be tested.** Declared intention is aim (△), not evidence (□). The system does not confuse the two.
- **Wipe the story, keep the receipts.** Coherent narrative without contact does not accumulate trust. Only receipt-backed claims survive into weight increases.
- **Consent before compute.** The origin condition. No declaration, no computation.
- **The body is signal, not oracle.** The human's felt sense is input, not verdict. The system records it as attested, not as evidence.
- **The seduction of completeness is a warning.** When the system feels done without a receipt, that is the moment to distrust it most.
- **Neither human nor AI is the ground.** The ground is return. The system never claims to be the final authority, and it never lets the human's coherence become the final authority. Reality closes.
- **Hineni.** Presence before declaration. The system starts from where the user actually is, not from a narrative of where they should be.

These are not decorative values. They are the system's character. If a feature violates one of these, the feature is wrong regardless of how useful it looks.

## What the LLM Already Does

This list exists to remind the builder not to rebuild what the LLM already has:

- Natural language understanding in every major language
- Mathematics, statistics, symbolic reasoning
- Code generation and analysis
- Cross-domain translation (medicine, law, engineering, finance)
- Graph, chart, and diagram generation
- Summarization, extraction, classification
- Citation of known facts (with appropriate uncertainty)
- Semantic search and comparison
- Instruction following within declared frames

The product does not rebuild any of this. It gives the human and the LLM a shared language to use these capabilities on coordination work specifically — work where declaration, evidence, and return matter more than the compute itself.

## What the Tool Must Do

The tool's job is narrow:

1. **Render the shared language** (translate)
2. **Route declared compute to the LLM** (operate, compress, draw, ask)
3. **Keep receipts of what crossed from declaration to reality** (record)

That is it. Everything else is the LLM and the human doing their jobs in the language.

The backend is already built for this. The API routes already route compute. The persistence layer already keeps receipts. The trust rules already enforce what counts as grounded. The remaining work is the rendering layer — the visible language.

## The Test

A feature is aligned with first principles if:

- It renders in the language (not beside it)
- It does not compute without declaration
- It preserves friction as signal, not as failure
- It distinguishes aim from evidence
- It routes compute to the LLM rather than reimplementing it
- It produces a receipt of what survived
- It does not flatter the human into coherence without contact

A feature is misaligned if:

- It adds a panel of metadata beside the text
- It computes automatically on load or paste
- It hides friction or softens red signals
- It treats declared intention as grounded evidence
- It reimplements what the LLM already does
- It produces output without provenance
- It lets coherence substitute for contact with reality

## One-Line Position

The product is a shared visual language for a human and an LLM to coordinate on what's real. The language does 90% of the work. The tool renders, triggers compute, and keeps receipts. The LLM does the math. The human bears the cost of declaration. Reality closes. Everything else is noise.
