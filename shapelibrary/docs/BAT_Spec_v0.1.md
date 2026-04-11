# BAT Spec v0.1

Date: 2026-04-09  
Status: Draft for implementation  
Owner: Shape Library / Seven integration layer

---

## 1) What BAT means

**BAT = Bounded Action Translation**

BAT is the contract that turns a structurally valid shape read into a human-usable next action without inflating closure.

In short:

- **Shape schema is the skeleton** (truth discipline)
- **BAT is the translator** (operator guidance)
- **Seven is the voice renderer** (tone + delivery)

BAT is not a new truth source. BAT never confirms anything. BAT only translates what the engine has earned into one bounded move and one receipt condition.

---

## 2) Why BAT exists

Without BAT:

- outputs read like taxonomy/reference manuals
- users do not know what to do next
- teams overfit UI to prose style instead of structural integrity

With BAT:

- operators receive concrete, testable next steps
- voice can stay warm and sharp without violating closure discipline
- schema and UX remain coupled through machine-checkable rules

---

## 3) Constitutional laws

1. **No closure inflation**
  BAT cannot claim `confirmed` unless runtime authority has earned it.
2. **One move rule**
  BAT must output exactly one next lawful move.
3. **One receipt rule**
  BAT must output one primary receipt condition for the next move.
4. **Disconfirmation required**
  BAT must always state how the current read could be wrong.
5. **Layer authority rule**
  Base Library suggestions are priors, never verdicts.

---

## 4) BAT data model

BAT output is attached to analyze/evaluate-facing reads as `operatorRead`.

```json
{
  "operatorRead": {
    "wallLine": "This looks like a likely wall people hit at this stage.",
    "whatToPingNow": "Map the handoff sequence and run one order-reversal test.",
    "whatWouldCountAsRealReturn": "A stage transition proof showing ordered sequence and before/after metric shift.",
    "howThisReadCouldBeWrong": "If sequence order changes do not affect outcomes, bottleneck is likely not the right read.",
    "toneClass": "pathology|gate|topology|behavioral",
    "closureLanguageAllowed": false
  }
}
```

### Required fields

- `wallLine` (string, 1-220 chars)
- `whatToPingNow` (string, 1-220 chars)
- `whatWouldCountAsRealReturn` (string, 1-240 chars)
- `howThisReadCouldBeWrong` (string, 1-240 chars)
- `toneClass` (enum)
- `closureLanguageAllowed` (boolean)

---

## 5) BAT input contract

BAT generator receives:

- `status` (`not_sealable_yet`, `candidate_*`, `*_match`, `rejection`)
- `assemblyClass`
- `requiredReceipts`
- structural fields:
  - `invariant`
  - `falsifier`
  - `repairLogic`
  - `disconfirmationCondition`
  - `failureSignature`
- authority metadata:
  - `sourceLayer` (`base_library`, `personal_field`, `live_echo`)
  - `closureAllowed` (bool)

BAT must not use hidden context not present in contract.

---

## 6) BAT generation rules

### R1: Derive from structure only

Every BAT sentence must be traceable to structural fields or current run state.

### R2: Receipt anchoring

`whatWouldCountAsRealReturn` must map to one member of `requiredReceipts`.

### R3: Disconfirmation anchoring

`howThisReadCouldBeWrong` must semantically align with `disconfirmationCondition` or `falsifier`.

### R4: Status-sensitive language

- `not_sealable_yet` / `candidate_*`: hypothesis language only
- `*_match`: can use stronger match language, still bounded by gate state
- `rejection`: repair language, no action inflation

### R5: Anti-therapy / anti-guru constraints

Disallow:

- motivational filler
- identity judgment
- authority claims beyond evidence
- multi-step strategic plans in a single BAT block

---

## 7) Voice policy (Seven layer)

BAT defines content slots; Seven renders tone.

### Tone classes

- `pathology`: candid, de-inflating
- `gate`: procedural, crisp
- `topology`: map-like, relation-aware
- `behavioral`: supportive but direct

### Style limits

- max 2 sentences per field
- no rhetorical sprawl
- no more than one imperative in `whatToPingNow`

### Forbidden phrases (initial list)

- "trust me"
- "you already know"
- "you got this"
- "just"
- "obviously"

---

## 8) Runtime authority integration

BAT must carry `closureLanguageAllowed`.

Policy:

- if `sourceLayer = base_library`, force `closureLanguageAllowed = false`
- if `status = not_sealable_yet`, force `closureLanguageAllowed = false`
- if `maturation.gate.passed = false`, force `closureLanguageAllowed = false`

Renderer must reject closure verbs when this flag is false.

---

## 9) API contract extensions

Add to analyze result shape (candidate, not-sealable, match branches where relevant):

- `operatorRead.wallLine`
- `operatorRead.whatToPingNow`
- `operatorRead.whatWouldCountAsRealReturn`
- `operatorRead.howThisReadCouldBeWrong`
- `operatorRead.toneClass`
- `operatorRead.closureLanguageAllowed`

Keep existing structural fields unchanged.

---

## 10) Validation + tests

### Schema tests

- BAT object present when status is user-actionable
- all required BAT fields present and bounded

### Cross-field integrity tests

- receipt mapping valid against `requiredReceipts`
- disconfirmation line aligns with structural disconfirmation/falsifier

### Honesty tests

- no closure language when `closureLanguageAllowed = false`
- no `confirmed` semantics for base-layer priors

### Style tests

- sentence count limits
- forbidden phrase lint
- exactly one next action

---

## 11) Minimal implementation plan

1. Add `operatorRead` schema block to analyze result contract.
2. Create BAT builder module in Shape Library (`shape-core/bat.js`).
3. Wire engine to produce BAT alongside current structural output.
4. Add validator checks for BAT integrity.
5. Add tests (schema + honesty + style + cross-field).
6. Update `/shapelibrary` UI to render BAT fields as first-class action guidance.

---

## 12) Non-goals (v0.1)

- No freeform conversational BAT generation
- No autonomous recommendation engine
- No replacement of structural fields with prose
- No multi-move planning in BAT output

---

## 13) One-line product law

**BAT translates earned structure into one lawful move and one receipt condition, without claiming more closure than the engine has earned.**