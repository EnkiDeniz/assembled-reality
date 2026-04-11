# Capability -> Interface Contract (Phase 2)

Date: 2026-04-09  
Audience: Design + Product + Engineering  
Purpose: Ensure UI reflects system capability, not just visual quality.

---

## 1) Core product law

**Do not let the interface claim more closure than the engine has earned.**

If the engine is in hypothesis mode, the UI must read as hypothesis mode.  
If closure is blocked, the UI must render blocked closure explicitly.

---

## 2) What must be visible (always)

### A) Authority state (non-negotiable)

Every read must show:

- `Source layer` (base prior / personal field / live echo)
- `Status` (suspected / confirmed / not sealable yet / rejected)
- `Closure allowed` (yes/no)

If this is hidden, users over-trust.

### B) BAT discipline block (non-negotiable)

Show all four BAT fields together:

1. `wallLine`
2. `whatToPingNow` (one move only)
3. `whatWouldCountAsRealReturn` (one receipt condition)
4. `howThisReadCouldBeWrong` (disconfirmation)

These four fields are the anti-guru system.

### C) Evidence contract

Show:

- required receipt type
- current receipt presence/missing
- what exact return would upgrade the state

### D) Mode distinction

`candidate` / `not_sealable_yet` must be visually distinct from `match`.

No visual style should let a hypothesis feel like a verdict.

---

## 3) What must never be hidden

- Why this read is still unsealed
- What single move advances it
- What could falsify it
- Whether closure language is currently forbidden
- Whether required receipts are still missing

If any of these are collapsed into tooltips or secondary tabs by default, legibility fails.

---

## 4) Recommended module set (phase-2 UI)

### Module 1: Authority Chip Row

Compact row at top of read card:

- `Layer`
- `Status`
- `Closure allowed`

### Module 2: BAT Card (primary panel)

Primary action panel with the four BAT fields in fixed order.

### Module 3: Ping Contract Panel

Shows:

- one next move (editable to execute)
- one receipt condition
- one disconfirmation condition

### Module 4: Gate / Receipt Ledger

Shows:

- required receipt list
- present/missing state
- promotion readiness

### Module 5: Structural Basis Drawer (secondary)

Expandable panel for:

- invariant
- falsifier
- failure signature
- repair logic

This stays available for rigor, but does not replace BAT as the operator-facing primary.

---

## 5) Interaction rules

1. One click from read -> ping action.
2. One click from ping result -> receipt submission.
3. No multi-step strategy generation in first read.
4. Promotion action disabled until receipt and threshold gates are truly met.
5. Disconfirmation line always shown, never hidden.

---

## 6) Anti-patterns (do not ship)

- Telemetry-only UI (state dump without action contract)
- “Smart coach” language that bypasses BAT constraints
- Multiple suggested moves in one read
- Green/positive styling for hypothesis states
- Confirmation language while `closureLanguageAllowed = false`
- Hiding falsifier/disconfirmation in advanced mode only

---

## 7) Design success criteria

A first-time user should be able to answer these immediately:

1. **What does the system currently think this is?**
2. **What single action should I take next?**
3. **What would count as a real return?**
4. **How could this read be wrong?**
5. **Am I allowed to close this yet?**

If any answer takes more than one panel-hop, the interface is under-communicating system capability.

---

## 8) Engineering acceptance mapping

Design is acceptable only if interface behavior is consistent with runtime fields:

- BAT fields map 1:1 from `operatorRead`
- status/layer chips map 1:1 from engine authority output
- closure affordance maps 1:1 to `closureLanguageAllowed`
- promote enablement maps 1:1 to gate + receipt readiness

No inferred UI optimism beyond runtime state.
