# Loegos Guardianship

**Status:** Living document. Updated as principles are tested and refined.
**Scope:** Every surface in the product. Not just the assembly lane.
**Role:** The guardian checks every commit, screenshot, and design proposal
against these principles before it ships.

---

## 1. Product Principles

These define what the product is trying to be.

### 1.1 The box is a path-dependent evidentiary state machine

The box does not snapshot. It preserves lineage: how sources entered,
how blocks were confirmed, how the seed was shaped, how receipts closed
moves. The construction history is more valuable than the current state.
Every feature must preserve lineage. Never discard path information to
simplify a view.

### 1.2 The protocol is: declare, shape, test, compare, reroute or seal

The user should feel this sequence running. The product makes it visible
through the protocol strip (`Collecting · Shaping · Proving`) and the
contextual verb. Every surface either advances this protocol or gets out
of the way.

### 1.3 The receipt is more valuable than the document

The document is an intermediate artifact. The receipt is the proof that
contact happened. Prioritize receipt-producing actions over document-
editing actions. The empty operator field in receipts enables future
derivation of ghost operators — protect it.

### 1.4 Human declares, AI assists, reality returns

Seven talks, interprets, audits. Operate reads the box structurally.
Receipts preserve proof. AI never silently mutates box state. Seed
generation is "current working object, not a final truth claim." The
user is the selection mechanism. The ground is return, not agreement.

### 1.5 Root-optional

Root is important but never required to start working. The protocol strip
shows `Collecting` for rootless boxes without pressure. A box without root
is a valid box in early assembly. Never punish collection.

---

## 2. Design Principles

These define how the product looks, feels, and communicates.

### 2.1 Creep Law

Every color must answer: "what data does this encode?" If there is no
data, use surface or text tokens. No decorative color. No gradients that
encode nothing. No accent colors used as decoration.

The 8-step assembly gradient exists to show assembly state progression:
gray → blue → cyan → teal → green → gold → orange → deep orange. Each
step maps to a real state. If a color from this gradient appears on
screen, it must be because the element is in that state.

### 2.2 Color goes on the text, not the border

On dark backgrounds (#181818–#242424), a 1px border at 30% opacity is
nearly invisible. The user cannot scan border colors. But text color is
immediately scannable.

**Rule:** If a color distinction matters, put it on the text. A badge
that says PRESENT in gray text with a green border is wasted color. A
badge that says PRESENT in green text is instantly scannable.

This extends Creep Law: not just "every color must encode data" but
"the color must be perceptible where it is placed."

### 2.3 Porsche precision

Token compliance is necessary but not sufficient. Proportions, rhythm,
visual weight, whitespace consistency, and typographic hierarchy must
all be checked at precision level.

Specific checks on every review:
- **Proportional relationships:** heading-to-body ratio creates clear
  hierarchy, not visual noise
- **Whitespace rhythm:** gaps between sections are consistent, cards
  breathe equally
- **Visual weight:** badges and metadata support content, never compete
  with it
- **Eye flow:** the eye moves naturally down the page — where does it
  snag?
- **Density:** information-to-pixel ratio is right — not cramped, not
  sparse
- **Name the number:** "the 8px gap between X and Y is too tight
  relative to the 16px gap above Z" — never say "looks off"

### 2.4 Three-tier spacing inside components

Uniform gaps create monotone rhythm. Use three tiers:
- **4–6px** — tight coupling (eyebrow→title, kind→time within a row)
- **10px** — default sibling gap (title→detail, detail→trust)
- **14–16px** — section break (content→badges, badges→next section)

### 2.5 The badge test

Before adding a badge, chip, or pill to any surface:
1. Can the user tell what it means at scanning speed?
2. Does it help the user take their next move?
3. Is it the only way to communicate this, or could the structure
   communicate it instead?

If any answer is no, don't add it. Two meaningful badges beat four
that require a legend.

---

## 3. Experience Principles

These define what the user should feel.

### 3.1 Every string is an operator sentence or deleted

If text appears in the product, it passes two gates:

**Gate 1 — Is this needed?** Could Seven answer this if asked? If the
user can get this information on demand, it doesn't need to be always
visible. Delete it.

**Gate 2 — Is this compressed?** Is it the operator sentence version —
the smallest human-readable unit that still runs? If not, compress it
until it is.

Examples of failure:
- "Source text preserved in the box. Normalization is separate from
  verification." → Delete. Documentation, not UI.
- "Preserve the current workspace state as a draft receipt for later
  review and export." → Delete. The button says "Draft receipt."
- "Start a thread about this document. Seven keeps the conversation
  tied to what you are reading." → Delete. The suggestion chips are
  self-explanatory.

Examples of success:
- "Accumulating without sealing. Close the loop." → Operator sentence.
  Says what's happening and what to do.
- `Collecting · Shaping · Proving` → Protocol position in three words.
- "No seal, no commit." → Settlement rule. Changes behavior.

### 3.2 The user should feel the protocol, not read about it

The product teaches operator thinking through structure, not through
explanation. If the user has to read a paragraph to understand what a
surface does, the surface has failed. The protocol strip works because
it shows three words, not because it explains what assembly means.

### 3.3 The next move should be obvious

On any surface, the user should know what to do next without searching.
The contextual verb on the lane (`Shape seed`, `Run Operate`, `Seal`)
is the pattern: one action, derived from durable facts, placed where
the user is already looking.

### 3.4 Metadata on demand, not on display

The distinction between what the user needs to scan and what the user
needs to inspect:

- **Scan level:** title, stage status, proof status. Always visible.
  These answer "what is this?" and "where is it in the protocol?"
- **Inspect level:** evidence basis, certainty kind, trust profile,
  linked entries. Available on tap/selection. These answer "how
  confident should I be?" — a question the user asks sometimes,
  not always.

Never promote inspect-level data to scan level. It creates density
without clarity.

### 3.5 Dark theme is an asset, not a constraint

The product runs on dark surfaces. This means:
- White and colored text are the primary visual tools — they pop
- Borders and shadows are secondary — they recede
- Background fills at low opacity create depth without noise
- Use the dark to create negative space, not to hide information

When something is hard to see on dark, the answer is not "add a
brighter border." The answer is "move the signal to the text."

---

## 4. Technical Guardrails

### 4.1 Token system

All colors from `src/app/styles/tokens.css`. No hardcoded hex/rgb in
components or CSS rules. The only exception is fallback values in
CSS custom property declarations.

### 4.2 Assembly gradient

8 steps, each with: base, soft, border, glow, text, tint variants.
Only used when encoding assembly state. Never used for decoration.

### 4.3 Typography scale

- Metadata: `--font-code`, 10–12px, uppercase, letter-spacing 0.08em+
- Body: `--font-ui`, 13–15px, line-height 1.5–1.75
- Labels: 12px, letter-spacing 0.02em
- Headings: fluid sizing with clamp()

### 4.4 Spacing scale

4 / 8 / 12 / 16 / 20 / 24 / 32px. Use `--space-N` tokens.

### 4.5 Radius scale

sm=10, md=14, lg=18, xl=22. Badges and small elements currently at
12px (between sm and md). Padding must be ≥ radius on any container.

### 4.6 Semantic symbols

△ = Aim, ◻ = Evidence, ○ = Story, ⊘ = Unconfirmed.
Used in confirmation and block tagging. Not decorative.

### 4.7 Component naming

`.assembler-[component]__[element]` (BEM-like). Interactive elements
minimum 36px height. Icon buttons 32x32 with 16px Lucide icons at
strokeWidth 1.7.

---

## 5. Guardian Access

The guardian has a dev-only API route for authenticating into the
workspace without email or Apple sign-in.

**Route:** `GET /api/auth/dev-guardian`

**How to use:**
1. Start the dev server
2. Navigate to any page (the login page is fine)
3. For a true fresh-state audit, run:
   `fetch('/api/auth/dev-guardian?action=reset').then(r => r.json())`
4. Then authenticate:
   `fetch('/api/auth/dev-guardian').then(r => r.json())`
5. Navigate to `/workspace` — the session is now active
6. To clear only the cookie:
   `fetch('/api/auth/dev-guardian?action=clear')`

**Constraints:**
- Returns 403 in production (`NODE_ENV === "production"`)
- Creates a local user `guardian@loegos.local` with a reader profile
- Uses NextAuth's own `encode()` for JWE token compatibility
- `action=reset` purges guardian-owned workspace state and clears the session
- `action=clear` clears the cookie only
- After `action=reset`, the guardian account starts empty — no sources, no seed, no receipts
- To test with a populated box, add sources through the intake surface

**File:** `src/app/api/auth/dev-guardian/route.js`

This route must never be committed to production or deployed. It exists
so the guardian can inspect every authenticated surface without depending
on external access or user screenshots.

---

## 6. Guardian Checklist

Run on every update, commit, or screenshot review.

### Coverage (do this first)
- [ ] Authenticated workspace checked — not just the public demo
- [ ] If auth pages are unreachable, ask the user for screenshots or
      browser access. Never silently baseline from public pages only.
- [ ] Explicitly state which surfaces were checked and which were not
- [ ] Surfaces to check: lane, listen, confirmation, seed, receipts,
      source rail, instrument bar, mobile bottom nav
- [ ] Both desktop and mobile viewports checked

### Code
- [ ] Zero hardcoded colors in changed files
- [ ] All new CSS uses token variables
- [ ] `npm run audit:guardian` passes
- [ ] Build passes
- [ ] Lint clean on changed files
- [ ] No regressions to lane badges (still 2: stage + proof)
- [ ] Protocol strip renders correctly (desktop + mobile)
- [ ] Contextual verb still wired

### Text
- [ ] Every new UI string passes Gate 1 (needed?) and Gate 2 (compressed?)
- [ ] No documentation sentences rendered as UI copy
- [ ] No explanatory text where structure is self-evident

### Visual
- [ ] Color on text, not borders, for scannable distinctions
- [ ] Proportional relationships checked (heading > body > metadata)
- [ ] Whitespace rhythm consistent within and between sections
- [ ] Badges pass the badge test (scannable? actionable? necessary?)
- [ ] Mobile padding ≥ radius
- [ ] Eye flow: where does it snag?

### Product
- [ ] Does this preserve lineage?
- [ ] Does this advance the protocol or get out of the way?
- [ ] Is the next move obvious?
- [ ] Could this metadata be inspect-level instead of scan-level?
- [ ] Does the self-assembly demo still work as a valid box?
