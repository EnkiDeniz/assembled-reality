# Language

This folder is the canonical reference for Loegos as a visual coordination language.

Everything in here governs how the product renders text, what the rendering means, and why it works this way. The backend, the trust rules, and the API contracts are settled. This folder defines what the user sees.

## How to read this folder

**Start with first principles.** Then the spec. Read the origin story if you want to understand why it took this long to arrive here. Read the source lineage if you want to see where the language came from. Read the implementation guide when you're ready to build.

Return to `first-principles.md` whenever you feel the product drifting back into dashboard thinking. It is the reset point.

## Contents

### First principles (read this first)

- [first-principles.md](./first-principles.md)
  The setup: one human, one LLM, one shared language. The 90/10 rule (language does 90%, tool does 10%). Consent before compute. The verb set: translate, operate, compress. The Echo Canon as literal behavioral disposition. Return here when drifting.

### Canonical spec

- [loegos-language-spec-v1.1.md](./loegos-language-spec-v1.1.md)
  The current language specification. Single-buffer rendering, three dimensions (color/shape/weight), accessibility baseline, Founder Shell layering, implementation path.

### Origin and reasoning

- [how-we-arrived-here.md](./how-we-arrived-here.md)
  The full journey from dashboard to IDE to Founder Shell to language. Why each phase failed and what it taught. Why the spec wasn't obvious at the start and why it's obvious now.

### Source lineage

- [source-lineage.md](./source-lineage.md)
  The language spec didn't invent anything. It formalized what was already written in the founding documents. This file maps every language concept to its origin in the source texts.

### Language in use

- [language-in-use.md](./language-in-use.md)
  Living evidence file. Verbatim Lœgos phrases as they appear in real conversation, with attribution, context, and a plain-English gloss. Receipt of use, not a teaching document. Where source-lineage.md proves the concepts were always there, this file proves the spoken language is now here.

### Extensions

- [language-diffs.md](./language-diffs.md)
  Proposed v0.5 extension. Defines how Lœgos renders change between two states (counts, trajectory metrics, post-change state) without colliding with how it renders state itself. The collision rule is the load-bearing constraint: diff red ≠ signal red, ever, on the same surface without an explicit frame. Brief stage, not yet spec.

### Supporting specs

- [inference-authority-rules-v0.1.md](./inference-authority-rules-v0.1.md)
  What each inference layer can and cannot do. Governs signal assignment, seal blocking, and trust ceilings. The constitution for the rendering engine.

- [de-obfuscation-experience.md](./de-obfuscation-experience.md)
  The product experience that the language rendering enables. Write, Operate, Hover, Inspect. The worked examples that prove the language makes hidden coordination structure visible.

- [founder-shell-v0.1.md](./founder-shell-v0.1.md)
  The container the language renders inside. One artifact, one read panel, one player, one assistant, one next step. The language spec defines what the text looks like. The Founder Shell defines what surrounds it.

### Implementation guidance

- [implementation-guide.md](./implementation-guide.md)
  What to build, in what order, using what existing infrastructure. Maps the spec to the current codebase.

### Proof

- [user-story-competition.md](./user-story-competition.md)
  Five independent user stories written before the language spec existed. The stories that worked described the text itself changing state. The stories that didn't described panels showing analysis beside text. The competition surfaced the insight the spec formalizes.

## The rules

1. **The language renders on the text, not beside it.** If a proposed change puts Loegos information in a panel instead of on the text, it contradicts the spec. The text IS the analysis.

2. **Loegos rendering is the default. Plain text is an option.** Text is already coordination code. Plain text is the hidden state, not the natural one. Rendering is the act of reading the code.

3. **Consent before compute.** The system does not compute without declaration. Operate runs when the human asks. Seven speaks when the human opens it. No automatic computation on load or paste.

4. **The language does 90% of the work. The tool renders, triggers, and records.** The LLM already does math, graphs, cross-language reasoning, and code. The product does not rebuild any of it. It gives the human and the LLM a shared visual language for coordination and keeps receipts of what survived reality.

5. **The Echo Canon is the system's character, not its citation.** Friction is testimony. Consent before compute. Wipe the story, keep the receipts. Neither human nor AI is the ground — the ground is return.
