# Lœgos Elegance Pass

## Inline Assist, Surface Compression, and Visual Language Unification

**v0.2 — April 5, 2026**
**Deniz Sengun / Cloud**

---

## 0. Context

### What is Loegos

Loegos is a desktop-first workspace for solo operators. It tracks how intended objects become real. The user declares a Root (a seven-word immutable intention), drops sources into a Box (the container), confirms Blocks (operator sentences tagged as Aim/Evidence/Story), shapes a Seed (the live working position), and seals Receipts (proof that the intention made contact with reality). An AI engine called Seven assists with decomposition, tagging, and auditing.

### The product's visual language today

The product uses a dark interface (`--surface-0: #181818`) with an 8-step color gradient tied to the assembly state (step 0 = gray, step 7 = warm orange). The state chip shows the current step color. A faint color wash tints the workspace background at 5% opacity. Surfaces show an eyebrow label + title with no explanatory subtitle. A pinned Root bar in the workspace chrome shows the root text, state chip, phase label, and unconfirmed block count.

### What this pass does

This pass introduces one new interaction pattern (+7 inline assist) and unifies every surface under a strict visual grammar. It is subtraction plus consistency, not invention.

### Files that matter (for orientation)

| File | Role |
|---|---|
| `src/app/styles/tokens.css` | All CSS custom properties: colors, spacing, radii, typography |
| `src/app/globals.css` | All component styles (single CSS file, ~7000 lines) |
| `src/lib/assembly-architecture.js` | Assembly state, color tokens, block tags, domains, state computation |
| `src/lib/reality-instrument.js` | Issue severity model, tone computation, view model builder |
| `src/components/WorkspaceControlSurface.jsx` | Top chrome bar: mode buttons, actions, RootBar, Reality Instrument |
| `src/components/RootBar.jsx` | Compact one-line root display pinned in chrome |
| `src/components/RootEditor.jsx` | Full root editing sheet: text, gloss, domains, Seven assist |
| `src/components/WorkspaceShell.jsx` | Main orchestrator: state management, issue building, routing |

### Design tokens reference

```css
/* Surfaces */
--surface-0: #181818;  --surface-1: #1f1f1f;  --surface-2: #242424;
--surface-3: #2a2a2a;  --surface-4: #303030;

/* Assembly gradient (8 steps, 0-7) */
--assembly-step-0: #7f8793;   /* gray — declare root / zero */
--assembly-step-1: #5ea7ff;   /* blue — rooted */
--assembly-step-2: #43c7ff;   /* cyan — fertilized */
--assembly-step-3: #2fd1bb;   /* teal — sprouted */
--assembly-step-4: #61c96a;   /* green — growing */
--assembly-step-5: #d6b34f;   /* gold — structured */
--assembly-step-6: #e19a3f;   /* amber — assembled */
--assembly-step-7: #f08a45;   /* warm orange — sealed */

/* Each step has 5 variants: fill, soft, border, glow, text */
/* Example for step 3: */
--assembly-step-3: #2fd1bb;
--assembly-step-3-soft: rgba(47, 209, 187, 0.15);
--assembly-step-3-border: rgba(47, 209, 187, 0.3);
--assembly-step-3-glow: rgba(47, 209, 187, 0.24);
--assembly-step-3-text: #58dcc9;

/* Danger */
--danger-fill: rgba(255, 107, 107, 0.22);
--danger-soft: rgba(255, 107, 107, 0.12);
--danger-border: rgba(255, 107, 107, 0.38);
--danger-glow: rgba(255, 107, 107, 0.26);
--danger-text: #ffc9c9;

/* Text */
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.68);
--text-meta: rgba(255, 255, 255, 0.45);

/* Spacing */
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;  --space-7: 32px;

/* Radii */
--radius-sm: 10px;  --radius-md: 14px;  --radius-lg: 18px;  --radius-xl: 22px;

/* Typography */
--font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
--font-code: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
```

### How assembly colors are applied in JS

```js
import { getAssemblyColorTokens } from "@/lib/assembly-architecture";

// Returns { step, fill, solid, soft, border, glow, text }
// Each value is a CSS variable reference like "var(--assembly-step-3)"
const tokens = getAssemblyColorTokens(3);

// Applied as inline style:
style={{
  "--assembly-tone": tokens.fill,
  "--assembly-tone-soft": tokens.soft,
  "--assembly-tone-border": tokens.border,
  "--assembly-tone-glow": tokens.glow,
  "--assembly-tone-text": tokens.text,
}}
```

---

## 1. The +7 Inline Assist Pattern

### 1.1 What the user sees

When the user makes an error or needs guidance on a form field, this sequence plays:

**Step 1 — Error whisper.** A single line of small red text appears directly below the problem field. At the end of the line, `+7` appears in the current assembly step color.

```
Keep the root to seven words or fewer.                    +7
```

The error text has a subtle shimmer — a slow light-leak animation flowing left-to-right through the letterforms. The shimmer says "this line is alive and can help you."

**Step 2 — Tap +7.** The `+7` text is tappable. Tapping it expands a compact panel directly below the error line — inline, not a popup or dialog.

**Step 3 — Assist panel.** The panel shows:
- One summary sentence from Seven (e.g., "Compress the core aim into a small, operational root.")
- 2-3 suggestion cards, each with: bold heading, detail line, "Use this" text link
- A close control to collapse the panel

**Step 4 — Resolution.** User taps "Use this" → the field updates → error disappears → panel collapses. Two taps total: open +7, apply suggestion.

### 1.2 New components to build

#### `InlineAssist.jsx`

**File:** `src/components/InlineAssist.jsx`

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `error` | string | yes | The error whisper text. One operator sentence. |
| `visible` | boolean | yes | Whether the whisper + trigger are visible. |
| `assemblyStep` | number | no | Current assembly step (0-7). Drives +7 color. Default: 0. |
| `assistAvailable` | boolean | no | Whether +7 trigger should show. Default: true if `onRequestAssist` is provided. |
| `assistPending` | boolean | no | Whether Seven is currently generating suggestions. Default: false. |
| `suggestions` | array | no | Array of suggestion objects from Seven. Default: []. |
| `assistSummary` | string | no | Seven's one-line summary of what it did. Default: "". |
| `onRequestAssist` | function | no | Called when user taps +7. Should trigger Seven call. |
| `onApply` | function | no | Called with the selected suggestion when user taps "Use this". |
| `onDismiss` | function | no | Called when user closes the assist panel without applying. |

**Suggestion object shape:**

```js
{
  key: "suggestion-1",        // unique key
  heading: "Build the homestead",  // bold primary text
  detail: "Sustainable, off-grid, for two families in Vermont.",  // secondary text
  rationale: "Keeps the essence while making it concrete.",  // italic meta text (optional)
}
```

**Render structure:**

```jsx
<div className="assembler-inline-assist" data-step={assemblyStep}>
  {/* Error whisper line */}
  <div className="assembler-inline-assist__whisper">
    <span className="assembler-inline-assist__error">{error}</span>
    {assistAvailable ? (
      <button
        type="button"
        className="assembler-inline-assist__trigger"
        onClick={onRequestAssist}
        disabled={assistPending}
        role="button"
        aria-label="Open Seven assist"
        style={{
          "--assist-tone": `var(--assembly-step-${assemblyStep}-text)`,
        }}
      >
        {assistPending ? "…" : "+7"}
      </button>
    ) : null}
  </div>

  {/* Assist panel (expanded) */}
  {panelOpen ? (
    <div
      className="assembler-inline-assist__panel"
      style={{
        "--assist-panel-soft": `var(--assembly-step-${assemblyStep}-soft)`,
        "--assist-panel-border": `var(--assembly-step-${assemblyStep}-border)`,
      }}
    >
      {assistSummary ? (
        <p className="assembler-inline-assist__summary">{assistSummary}</p>
      ) : null}

      <div className="assembler-inline-assist__suggestions">
        {suggestions.map((suggestion) => (
          <div key={suggestion.key} className="assembler-inline-assist__card">
            <strong className="assembler-inline-assist__heading">
              {suggestion.heading}
            </strong>
            {suggestion.detail ? (
              <span className="assembler-inline-assist__detail">
                {suggestion.detail}
              </span>
            ) : null}
            {suggestion.rationale ? (
              <em className="assembler-inline-assist__rationale">
                {suggestion.rationale}
              </em>
            ) : null}
            <button
              type="button"
              className="assembler-inline-assist__apply"
              onClick={() => onApply?.(suggestion)}
              style={{ color: `var(--assembly-step-${assemblyStep}-text)` }}
            >
              Use this
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="assembler-inline-assist__close"
        onClick={handleClose}
      >
        Close
      </button>
    </div>
  ) : null}
</div>
```

**Internal state:** One boolean `panelOpen`. Toggled by +7 tap. Reset to false when `visible` becomes false or when `onApply` fires.

### 1.3 CSS for InlineAssist

Add to `globals.css`:

```css
/* ── Inline Assist ── */

.assembler-inline-assist {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: var(--space-2);
}

.assembler-inline-assist__whisper {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 24px;
}

.assembler-inline-assist__error {
  font-size: 13px;
  line-height: 1.4;
  color: var(--danger-text);
  background:
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 201, 201, 0.18) 50%,
      transparent 100%
    )
    no-repeat;
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: assist-shimmer 3s linear infinite;
}

@keyframes assist-shimmer {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.assembler-inline-assist__trigger {
  flex: 0 0 auto;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--assist-tone, var(--assembly-step-0-text));
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 100ms ease-out;
}

.assembler-inline-assist__trigger:hover {
  opacity: 1;
}

.assembler-inline-assist__trigger:disabled {
  opacity: 0.4;
  cursor: default;
}

.assembler-inline-assist__panel {
  margin-top: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--assist-panel-border, var(--surface-4));
  border-radius: var(--radius-md);
  background: var(--assist-panel-soft, var(--surface-2));
  max-height: 280px;
  overflow-y: auto;
  animation: assist-panel-enter 200ms ease-out;
}

@keyframes assist-panel-enter {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
  }
  to {
    opacity: 1;
    max-height: 280px;
    padding-top: var(--space-4);
    padding-bottom: var(--space-4);
    margin-top: var(--space-3);
  }
}

.assembler-inline-assist__summary {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  line-height: 1.5;
}

.assembler-inline-assist__suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.assembler-inline-assist__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--surface-3);
  border-radius: var(--radius-sm);
  background: var(--surface-1);
  transition: border-color 100ms ease-out;
}

.assembler-inline-assist__card:hover {
  border-color: var(--assist-panel-border, var(--surface-4));
}

.assembler-inline-assist__heading {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.assembler-inline-assist__detail {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.assembler-inline-assist__rationale {
  font-size: 12px;
  color: var(--text-meta);
  font-style: italic;
  line-height: 1.4;
}

.assembler-inline-assist__apply {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  margin-top: var(--space-1);
  transition: color 100ms ease-out;
}

.assembler-inline-assist__apply:hover {
  text-decoration: underline;
}

.assembler-inline-assist__close {
  display: block;
  margin-top: var(--space-3);
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  color: var(--text-meta);
  cursor: pointer;
}

.assembler-inline-assist__close:hover {
  color: var(--text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .assembler-inline-assist__error {
    animation: none;
    color: var(--danger-text);
    background: none;
    -webkit-background-clip: unset;
    background-clip: unset;
  }

  .assembler-inline-assist__panel {
    animation: none;
  }
}

@media (max-width: 640px) {
  .assembler-inline-assist__panel {
    max-height: 240px;
  }

  .assembler-inline-assist__error {
    font-size: 12px;
  }
}
```

### 1.4 Where to integrate +7

#### In RootEditor.jsx

**Current state (lines 401-431):** A status section with a colored block showing validation messages, word count, and two assist buttons ("Compress with Seven", "Use operator form"). This section uses `assembler-root-editor__status` classes and spans the full width of the editor.

**Target state:** Remove the entire status block (lines 401-431). Remove the Seven assist results section (lines 490-515). Replace both with:

1. Below the root text input (after line 443): render `<InlineAssist>` when `rootValidationMessage` is truthy.
2. Below the gloss textarea (after line 459): render `<InlineAssist>` when `glossValidationMessage` is truthy.
3. Below the rationale textarea (after line 487): render `<InlineAssist>` when `rationaleValidationMessage` is truthy.

Each `InlineAssist` receives:
- `error`: the validation message
- `assemblyStep`: from `stateSummary?.colorStep || 0`
- `onRequestAssist`: calls `handleRunSevenAssist` with the appropriate intent ("root-compress", "root-rewrite", etc.)
- `suggestions`: from `assistResult?.candidates` mapped to the suggestion shape
- `assistSummary`: from `assistResult?.summary`
- `onApply`: calls `applyAssistCandidate`
- `assistPending`: the existing `assistPending` state

**Lines to remove from RootEditor.jsx:**
- Lines 401-431 (entire `assembler-root-editor__status` section)
- Lines 490-515 (entire `assembler-root-panel__assist` section)
- The `rootInstrumentIssue` and `rootInstrumentViewModel` useMemo blocks (lines 88-203) and the `RealityInstrument` render (lines 496-528) — these are replaced by inline assists
- The `onInstrumentChange` effect (lines 206-220) — no longer needed since we don't emit instrument issues

**Lines to add:**
- After the root input (line 443): `<InlineAssist>` for root validation
- After the gloss textarea (line 459): `<InlineAssist>` for gloss validation
- After the rationale textarea (line 487): `<InlineAssist>` for rationale validation

**Imports to add:** `import InlineAssist from "@/components/InlineAssist";`
**Imports to remove:** `import RealityInstrument from "@/components/RealityInstrument";` and `import { buildRealityInstrumentIssue, buildRealityInstrumentViewModel } from "@/lib/reality-instrument";`

#### In ReceiptSealDialog.jsx

**Current state (lines 52-65):** Delta textarea with label "Delta" and hint "One operator sentence". No inline assist.

**Target state:** Below the delta textarea, add `<InlineAssist>` that shows when:
- `deltaStatement` is empty and the user has attempted to run the audit
- OR the audit returned with a `warn` or `fail` on the delta-related check

The +7 assist for delta calls Seven to draft a delta statement from the evidence snapshot (the `evidenceSnapshot` is available from the audit result).

**Lines to add:** After line 65 (closing `</textarea>` tag), add an `<InlineAssist>` block.

---

## 2. Visual Grammar — Strict Standards

Every component must follow these rules. No exceptions. A developer picking up any component file should be able to verify compliance by checking these standards.

### 2.1 Typography Hierarchy

| Level | Font Size (desktop) | Font Size (mobile) | Weight | Color Token | Letter Spacing | Transform | CSS Class Pattern |
|---|---|---|---|---|---|---|---|
| Eyebrow | 11px | 11px | 500 | `--text-meta` | 0.08em | uppercase | `__eyebrow` |
| Title | 16px | 15px | 600 | `--text-primary` | normal | none | `__title` |
| Body | 14px | 14px | 400 | `--text-secondary` | normal | none | `__body`, `__detail` |
| Meta | 12-13px | 12px | 400 | `--text-meta` | normal | none | `__meta`, `__hint` |
| Error | 13px | 12px | 400 | `--danger-text` | normal | none | `__error` |

**Rule:** No text element uses a size, weight, or color outside this table unless it is a chip label or a button label (see those standards below).

### 2.2 Spacing

| Context | Token | Value | Usage |
|---|---|---|---|
| Between sections | `--space-6` | 24px | Gap between major content sections within a surface |
| Between elements within a section | `--space-3` | 12px | Gap between cards, rows, form fields |
| Chip internal padding | `--space-2` h / `--space-1` v | 8px / 4px | Inside chips and badges |
| Form field gap | `--space-4` | 16px | Between input/textarea fields in a form |
| Panel/card padding | `--space-4` | 16px | Internal padding of cards and panels |
| Sheet content padding | `--space-5` | 20px | Internal padding of sheet/dialog content area |

### 2.3 Border Rules

| Element | Border | Radius | Shadow |
|---|---|---|---|
| Chip / badge | 1px solid `var(--assembly-tone-border)` | `--radius-sm` (10px) | `0 1px 6px var(--assembly-tone-glow)` |
| Card / panel | 1px solid `--surface-3` | `--radius-md` (14px) | none |
| +7 assist panel | 1px solid assembly step `--border` | `--radius-md` (14px) | none |
| Sheet / dialog panel | none (has shadow) | `--radius-lg` (18px) | `--shadow-panel` |
| Form input / textarea | 1px solid `--surface-4` | `--radius-sm` (10px) | none |
| List row | none (background change on hover) | 0 | none |

**Rule:** Never use `border: 1px solid white`, `border: 1px solid rgba(255,255,255,X)`, or any hardcoded gray. Always use a token.

### 2.4 Chip and Badge

Every chip or badge in the product uses this exact CSS pattern:

```css
.assembler-assembly-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  background: var(--assembly-tone-soft);
  border: 1px solid var(--assembly-tone-border);
  color: var(--assembly-tone-text);
  box-shadow: 0 1px 6px var(--assembly-tone-glow);
}
```

**Color source by context:**

| Chip Context | Color Source | Example |
|---|---|---|
| Assembly state | `getAssemblyColorTokens(stateSummary.colorStep)` | "Sprouted · Assembling" in teal |
| ⊘ badge (normal) | step 0 tokens (gray) | "⊘ 12" in gray |
| ⊘ badge (looping) | pulsing amber border animation | "⊘ 12" pulsing |
| Tag symbols (△◻○) | step 0 tokens (neutral) | "△ Aim" in gray |
| Domain chip (inactive) | step 0 tokens (neutral) | "Financial" in gray |
| Domain chip (active) | current assembly step `--soft` background | "Financial" highlighted |
| Trust level (L1-L3) | L1 = step 1, L2 = step 3, L3 = step 5 | "L2" in teal |
| Gradient badge | `getAssemblyColorTokens(gradientValue)` | "4" in green |
| Convergence | convergent = step 4 (green), divergent = step 6 (amber), hallucinating = danger red | "Convergent" in green |
| Courthouse status | connected = step 4 (green), disconnected = step 0, error = danger | "Connected" in green |
| Receipt status | LOCAL_DRAFT = step 0, REMOTE_DRAFT = step 1, SEALED = step 4 | "Sealed" in green |

### 2.5 Buttons

Three tiers. Every button in the product is one of these.

**Primary button** — one per visible context. The most important action.

```css
.terminal-button.is-primary,
.assembler-sheet__primary {
  background: var(--assembly-tone, var(--accent-ready));
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  cursor: pointer;
  transition: opacity 100ms ease-out;
}
```

**Secondary button** — supporting actions.

```css
.terminal-button {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--surface-4);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  cursor: pointer;
  transition: background-color 100ms ease-out, border-color 100ms ease-out;
}

.terminal-button:hover {
  background: var(--surface-2);
  border-color: var(--surface-3);
}
```

**Text link** — inline actions like "Use this", "Close", "Edit gloss", "Verify".

```css
/* No dedicated class — these are plain <button> elements styled inline */
background: none;
border: none;
padding: 0;
font-size: 13px;
font-weight: 500;
color: var(--assembly-tone-text, var(--text-secondary));
cursor: pointer;
text-decoration: none;
/* text-decoration: underline on :hover */
```

**Disabled state** — same for all tiers:

```css
opacity: 0.4;
cursor: not-allowed;
pointer-events: none;
```

**Rule:** Count the primary buttons visible at once. If more than one, demote one to secondary. Two primary buttons on the same screen is a visual conflict.

### 2.6 Sheet / Dialog Layout

Every sheet and dialog follows this structure:

```
+------------------------------------------+
|  BACKDROP (click to close)               |
|  +--------------------------------------+|
|  | HEADER                               ||
|  | [eyebrow]              [Close / Done]||
|  | [title]                              ||
|  +--------------------------------------+|
|  | CONTENT (scrollable)                 ||
|  |                                      ||
|  | [section 1]                          ||
|  |   [section head: label + action]     ||
|  |   [section body]                     ||
|  |                                      ||
|  | [section 2]                          ||
|  |   ...                                ||
|  +--------------------------------------+|
|  | FOOTER (sticky)                      ||
|  | [primary button]  [secondary button] ||
|  +--------------------------------------+|
+------------------------------------------+
```

**CSS classes:**
- Backdrop: `assembler-sheet__backdrop`
- Panel: `assembler-sheet__panel`
- Header: `assembler-sheet__header`
- Content: `assembler-sheet__content`
- Footer: `assembler-sheet__footer`
- Primary button: `assembler-sheet__primary`
- Close: `assembler-sheet__close`

**Backdrop:** `rgba(0, 0, 0, 0.5)`. Click to close unless a destructive or pending operation is in progress.

**Header bottom border:** `1px solid var(--surface-3)`.
**Footer top border:** `1px solid var(--surface-3)`.
**Content padding:** `var(--space-5)` (20px).
**Section gap:** `var(--space-6)` (24px).

**Currently compliant:** ReceiptSealDialog, ConfirmationQueueDialog, RootEditor.
**Needs verification:** BoxManagementDialog — currently uses `assembler-image-chooser` classes instead of `assembler-sheet` classes. Update to use `assembler-sheet` pattern.

### 2.7 List Row

Every list row (source rows on ProjectHome, receipt rows, box rows on BoxesIndex) follows one pattern:

```
+------------------------------------------+
| [title]                        [badge(s)] |
| [meta line]                               |
+------------------------------------------+
```

**The entire row is one `<button>` element.** Not a `<div>` with nested buttons.

| Property | Value |
|---|---|
| Element | `<button type="button">` |
| Height | 56-64px |
| Padding | `var(--space-3)` vertical, `var(--space-4)` horizontal |
| Title | 14-15px, `--text-primary`, weight 500, single line, `text-overflow: ellipsis` |
| Meta | 12-13px, `--text-meta`, single line |
| Badges | max 2, flush right, `assembler-assembly-chip` style |
| Hover | background → `var(--surface-2)` |
| Active/loading | badge text changes to "Loading..." |
| Border | none (rows are separated by visual spacing, not borders) |

**No per-row action buttons.** No inline delete. No inline listen. No pin/unpin toggle. Tap opens the item. All actions live inside the detail view.

**Currently compliant:** ProjectHome source rows (post-compression pass).
**Needs update:** BoxesIndex `BoxRow` — currently has pin tool, archive tool, and "Open Box" button per row (lines 114-223). These should be removed. The row body is already a clickable button. Per-row management actions move to the BoxManagementDialog.

### 2.8 Motion

| Element | Animation | Duration | Easing | Trigger |
|---|---|---|---|---|
| Sheet open | translateY(100%) → translateY(0) | 250ms | ease-out | Dialog `open` becomes true |
| Sheet close | translateY(0) → translateY(100%) | 150ms | ease-in | Close button or backdrop click |
| +7 panel expand | max-height: 0 → 280px, opacity: 0 → 1 | 200ms | ease-out | +7 tapped |
| +7 panel collapse | max-height → 0, opacity → 0 | 150ms | ease-in | Close or apply |
| +7 suggestion cards | opacity: 0 → 1, stagger 50ms | 150ms each | ease-out | Panel opens |
| Error whisper shimmer | background-position translate | 3000ms | linear, infinite | Error visible |
| Assembly wash transition | background-color | 800ms | ease-in-out | State changes |
| State chip color | all color CSS vars | 300ms | ease-in-out | State changes |
| Chip hover | background opacity | 100ms | ease-out | Hover |
| Row hover | background-color | 100ms | ease-out | Hover |
| ⊘ looping pulse | border-color opacity | 2000ms | ease-in-out, infinite | `isLooping` true |

**`prefers-reduced-motion`:** All animations become instant (duration: 0ms). The shimmer stops. The wash transition is instant. The looping pulse stops.

---

## 3. Component-Specific Changes

### 3.1 OperateSurface.jsx

**File:** `src/components/OperateSurface.jsx`

**Current state:** The gradient badge already uses assembly step colors via `getAssemblyColorTokens(getGradientColorStep(result.gradient))`. The convergence, floor, and ceiling values are rendered as plain text inside summary cards.

**Changes:**

1. **Convergence badge (lines ~137-142):** Wrap the convergence value in an `assembler-assembly-chip` span. Color: convergent → step 4 tokens (green), divergent → step 6 tokens (amber), hallucinating → danger tokens (red).

```jsx
// Before:
<span className="assembler-operate__summary-value">
  {formatConvergenceLabel(result.convergence)}
</span>

// After:
<span
  className="assembler-assembly-chip"
  style={{
    "--assembly-tone": convergenceTone.fill,
    "--assembly-tone-soft": convergenceTone.soft,
    "--assembly-tone-border": convergenceTone.border,
    "--assembly-tone-glow": convergenceTone.glow,
    "--assembly-tone-text": convergenceTone.text,
  }}
>
  {formatConvergenceLabel(result.convergence)}
</span>
```

Add a helper to compute convergence tone:

```js
function getConvergenceTone(convergence) {
  const normalized = String(convergence || "").trim().toLowerCase();
  if (normalized === "convergent") return getAssemblyColorTokens(4);
  if (normalized === "divergent") return getAssemblyColorTokens(6);
  if (normalized === "hallucinating") return {
    fill: "var(--danger-fill)", soft: "var(--danger-soft)",
    border: "var(--danger-border)", glow: "var(--danger-glow)",
    text: "var(--danger-text)",
  };
  return getAssemblyColorTokens(0);
}
```

2. **Trust level badges (lines ~148-151):** Wrap floor and ceiling values in `assembler-assembly-chip` spans. Color: L1 → step 1 (blue), L2 → step 3 (teal), L3 → step 5 (gold).

```js
function getTrustLevelStep(level) {
  const normalized = String(level || "").trim().toUpperCase();
  if (normalized === "L1") return 1;
  if (normalized === "L2") return 3;
  if (normalized === "L3") return 5;
  return 0;
}
```

3. **Sentence card left borders (lines ~116-118):** Add a `border-left: 3px solid` using the trust level color for each sentence's level.

```css
.assembler-operate__sentence {
  border-left: 3px solid var(--sentence-trust-tone, var(--surface-4));
  padding-left: var(--space-4);
}
```

Apply inline: `style={{ "--sentence-trust-tone": getAssemblyColorTokens(getTrustLevelStep(sentence.level)).fill }}`

### 3.2 SeedSurface.jsx

**File:** `src/components/SeedSurface.jsx`

**Current state:** Hero section has BoxObjectVisualization, a copy section with eyebrow/title/body, and conditional mobile action buttons. The body text reads "Aim. What's here. The gap." when a seed exists, or "The first real source creates the first seed." when no seed.

**Changes:**

1. **Remove the body paragraph (line ~60-63).** The eyebrow ("Current seed") and title (seed title) are sufficient. The body text is explanatory. Remove it.

2. **Compress mobile actions (lines 65-79).** Keep only: "Stage" (secondary) and "Operate" (primary). Remove the conditional staged count from the button label — the control surface already shows this in the meta.

3. **Empty state (lines 94-122):** Rewrite the text to operator sentences:
   - Current: "Keep staging blocks until the seed takes shape." → Target: "Stage. Shape. Seal."
   - Current: "Open the seed. Keep shaping." → Target: "Open seed."

### 3.3 ReceiptSurface.jsx

**File:** `src/components/ReceiptSurface.jsx`

**Current state:** Hero section can show up to 8 conditional buttons: Draft receipt, Operate (mobile), Retry sync, Verify, Connect GetReceipts, Export receipts, Export doc, Seal receipt.

**Changes:**

1. **Group secondary actions.** Keep visible: Draft receipt (primary), Seal receipt (if applicable), Retry sync (if applicable), Verify (if applicable). Move behind a "More" text-link button that reveals: Export receipts, Export doc, Connect GetReceipts.

2. **Courthouse status as chip.** Replace the `assembler-receipt-surface__courthouse-line` paragraph (line 83-87) with a single `assembler-assembly-chip` using the courthouse tone.

3. **Draft list per-row actions (lines 164-193).** The "Retry sync" and "Verify" buttons per draft row are acceptable — they're contextual to each draft. Keep them but style as text links, not `terminal-button`.

### 3.4 BoxesIndex.jsx

**File:** `src/components/BoxesIndex.jsx`

**Current state:** Each `BoxRow` (lines 114-223) has a clickable body area PLUS separate pin tool, archive tool, and "Open Box" button in the aside section. The masthead has four large action cards (Resume, Open Box Home, Add Source, Manage Boxes).

**Changes:**

1. **BoxRow:** Remove pin tool, archive tool, and "Open Box" button from the aside. The row body is the click target. Keep badges ("Pinned", "Archived", "Current") as read-only indicators. Pin/archive/delete actions move to BoxManagementDialog only.

2. **Masthead action cards:** Compress the four action cards into a single row of secondary buttons: "Resume", "Home", "Add", "Manage". No icons, no detail text, no eyebrows. Just text buttons in a horizontal row.

3. **Masthead copy:** Keep title and meta. Remove the subtitle "Calm entry. Fast capture. Recent work where you can reach it." — this is explanatory text.

### 3.5 BoxManagementDialog.jsx

**File:** `src/components/BoxManagementDialog.jsx`

**Current state:** Uses `assembler-image-chooser` CSS classes. Has create form, manage list, and selected box detail sections.

**Changes:**

1. **CSS class migration:** Replace `assembler-image-chooser` classes with `assembler-sheet` classes to match the standard sheet layout (header with eyebrow + title + close, content area, footer).

2. **Create form:** The root text input (placeholder "Root (7 words or fewer)") should get an `<InlineAssist>` for root validation, matching the RootEditor pattern.

3. **Selected box section (lines 162-243):** Keep the rename input and primary actions (Open, Save, Pin/Unpin). Move Archive and Delete behind a "Danger zone" disclosure — not always visible, expandable on tap.

### 3.6 BoxObjectVisualization.jsx

**File:** `src/components/BoxObjectVisualization.jsx`

**Current state:** Uses stages "dormant", "wireframe", "solid", "tension" to drive SVG polygon opacities. Color tokens are applied via CSS variables from the `state.colorTokens` prop.

**Changes:**

1. **Map stages to assembly states.** Currently the stage names are visual states, not assembly states. The visualization should feel warmer/more complete as the assembly advances. The `colorTokens` prop already carries the assembly step color — ensure the SVG fill polygons use these tokens as their fill color, not just as CSS variables for other elements.

2. **The center circle (lines 185-201):** Scale and opacity should respond to the assembly step, not just the stage. At step 0 (gray), the circle is small and dim. At step 7 (warm orange), it's full and bright. This makes the glyph a visual tachometer.

---

## 4. Implementation Sequence

### Pass 1: Build +7 pattern (estimated: 1 session)

1. Create `src/components/InlineAssist.jsx` with the component code from Section 1.2
2. Add the CSS from Section 1.3 to `globals.css`
3. Integrate into `RootEditor.jsx`:
   - Remove the `assembler-root-editor__status` section (lines 401-431)
   - Remove the `assembler-root-panel__assist` section (lines 490-515)
   - Remove the `RealityInstrument` import and render
   - Remove the `rootInstrumentIssue` and `rootInstrumentViewModel` useMemo blocks
   - Remove the `onInstrumentChange` effect
   - Add `<InlineAssist>` after root input, gloss textarea, and rationale textarea
4. Add `<InlineAssist>` to `ReceiptSealDialog.jsx` below the delta textarea

### Pass 2: Surface alignment (estimated: 1 session)

5. OperateSurface: convergence chip, trust level badges, sentence card borders (Section 3.1)
6. SeedSurface: remove body text, compress actions, operator-sentence empty state (Section 3.2)
7. ReceiptSurface: group hero actions, courthouse chip, draft row text links (Section 3.3)
8. BoxesIndex: remove per-row tools, compress masthead actions, remove subtitle (Section 3.4)
9. BoxManagementDialog: migrate to sheet classes, add InlineAssist, danger zone disclosure (Section 3.5)
10. BoxObjectVisualization: assembly step color mapping on center circle (Section 3.6)

### Pass 3: Consistency sweep (estimated: 1 session)

11. Walk every sheet/dialog and verify header/content/footer structure matches Section 2.6
12. Walk every list (sources, receipts, boxes) and verify single-button row standard matches Section 2.7
13. Walk every chip/badge and verify color source matches Section 2.4 table
14. Walk every button and verify it is one of the three tiers in Section 2.5 — count primary buttons per screen
15. Test all animations against Section 2.8 table
16. Test `prefers-reduced-motion` globally
17. Verify assembly color wash responds to state changes on both desktop and mobile

---

## 5. Test Scenarios

### +7 Pattern

1. Open RootEditor on a box with no root. Type 10 words. Verify: red shimmer text "Keep the root to seven words or fewer." appears below the input. `+7` shows in the current assembly step color (gray for step 0). Tap +7. Verify: panel expands below with Seven suggestions. Each suggestion shows bold root text, detail gloss, italic rationale, and "Use this" link. Tap "Use this". Verify: root input updates, error disappears, panel collapses.

2. Open RootEditor with a declared root. Clear the gloss. Verify: red shimmer text "Add a gloss so the root can breathe." appears below the gloss textarea. +7 shows. Tap +7. Verify: Seven suggests glosses from box context.

3. Open RootEditor, toggle off a Seven-suggested domain, clear the rationale field. Verify: red shimmer text "Explain why this domain does not apply." below rationale textarea. +7 shows. Tap +7. Verify: Seven drafts a rationale.

4. Open ReceiptSealDialog, leave delta empty, tap "Refresh audit". Verify: error whisper below delta textarea. +7 available. Tap +7. Verify: Seven drafts a delta from the evidence snapshot.

5. Enable `prefers-reduced-motion`. Repeat test 1. Verify: no shimmer animation, panel appears instantly.

### Visual Grammar

6. Navigate between all surfaces (Home, Think, Seed, Operate, Receipts). Verify: every surface shows only eyebrow + title. No subtitle paragraphs anywhere.

7. Open every sheet/dialog (RootEditor, ReceiptSealDialog, ConfirmationQueueDialog, BoxManagementDialog). Verify: each has header (eyebrow + title + close), scrollable content, sticky footer with primary button. Backdrop closes on click unless pending.

8. View source list on ProjectHome. Verify: every row is one button. No per-row listen/delete buttons. Tap opens the source.

9. View box list on BoxesIndex. Verify: every row is one button. No per-row pin/archive/open buttons. Badges are read-only. Tap opens the box.

10. Count primary buttons on each screen. Verify: never more than one primary button visible at once per screen or dialog.

### Assembly Colors

11. Create a box at state 0 (no root). View workspace. Verify: gray color wash, gray state chip, gray ⊘ badge, gray +7 trigger.

12. Declare a root, add sources to reach state 2 (Fertilized). Verify: cyan color wash, cyan state chip, cyan +7 trigger. The workspace feels cooler.

13. Seal receipts to reach state 5 (Assembled). Verify: gold color wash, gold state chip, gold +7 trigger. The workspace feels warmer.

14. Run Operate. Verify: gradient badge uses assembly step color for the value (e.g., gradient 4 = green badge). Convergence chip is colored (green/amber/red). Trust floor and ceiling are colored chips (L1=blue, L2=teal, L3=gold). Sentence card borders are colored by trust level.

15. View ReceiptSurface with a connected GetReceipts account. Verify: courthouse status is a green chip "Connected", not a paragraph. Sealed receipts show "Sealed" in green chip.

### Motion

16. Open and close RootEditor five times. Verify: consistent slide-up 250ms on open, slide-down 150ms on close. No jank, no flash.

17. Open +7 assist panel. Verify: panel height animates from 0, suggestion cards fade in with stagger. Close panel. Verify: smooth collapse.

18. Change assembly state (by confirming blocks or sealing receipts). Verify: background wash color transitions over 800ms. State chip color transitions over 300ms. No abrupt color jumps.

---

## 6. Off-System Element Audit

Every element in the product must derive its color from either the assembly step tokens, the surface tokens, or the danger tokens. Nothing else. If an element uses a hardcoded blue, a default platform color, or any color not in `tokens.css`, it is off-system and must be corrected.

### 6.1 Known Off-System Elements

| Element | File | Current Color | Problem | Fix |
|---|---|---|---|---|
| **Add button (mobile center)** | `MobileBottomNav.jsx` | Hardcoded blue (`~#7aaef5` or similar, likely `--accent-ready: #339cff`) | Flat opaque blue that doesn't match the assembly-tone pill pattern used by neighboring elements in the same chrome bar | Use the same `assembler-assembly-chip` pattern: `background: var(--assembly-tone-soft)`, `border: 1px solid var(--assembly-tone-border)`, `color: var(--assembly-tone-text)`, `box-shadow: 0 1px 6px var(--assembly-tone-glow)`. The Add button should look like it belongs to the same family as the "UNTITLED" and "SEVEN" pills. The `+` icon and "ADD" label inherit the tone text color. |
| **"ADD SOURCE" button (Reality Instrument bar)** | `WorkspaceControlSurface.jsx` or parent | Gray/neutral pill that doesn't use assembly tone | Lacks the subtle glow and border treatment of the nav pills | Apply `assembler-assembly-chip` pattern or the secondary button standard. If it's a primary action, use the primary button standard with `var(--assembly-tone)` as background — NOT a hardcoded blue. |
| **"OPEN" button (Reality Instrument bar)** | Same | Appears as a white/gray outlined pill | Correct as secondary style. Verify it uses `border: 1px solid var(--surface-4)` not a hardcoded gray. |
| **PLAY / PREV / NEXT buttons (listen controls)** | Listening surface in `WorkspaceShell.jsx` | Gray outlined pills | Acceptable as secondary buttons. Verify they use `--surface-4` border, not hardcoded values. The active/playing state should use assembly step `--soft` as background to indicate engagement. |
| **Progress bar (listen slider)** | Listening surface | Blue accent dot on gray track | The dot should use the current assembly step fill color, not `--accent-ready`. The track should use `--surface-3`. This makes the progress bar feel like part of the assembly — as you listen, you're at a certain point in the assembly, and the color tells you where. |
| **"1x" speed badge** | Listening surface | Plain text in a chip | Apply `assembler-assembly-chip` pattern with step 0 (neutral) tokens. |
| **"Seven" dropdown** | Listening surface | Plain text with chevron | Apply secondary button standard. |
| **Any `--accent-ready: #339cff` usage** | Multiple files | `#339cff` blue is used as the generic accent | Replace all instances where `--accent-ready` is used for interactive elements with `var(--assembly-tone)` (which inherits from the current assembly step). `--accent-ready` should only survive as a fallback for contexts where no assembly step is available (e.g., the login page, account settings). Inside the workspace, everything uses assembly colors. |

### 6.2 The Rule

**Inside the workspace, no element uses a color that isn't one of:**
- A `--surface-N` token (backgrounds)
- A `--text-*` token (text)
- An `--assembly-step-N-*` token (assembly-colored elements)
- A `--danger-*` token (errors and destructive states)
- `transparent` or `inherit`

**No hardcoded hex values.** No `#339cff`. No `rgba(51, 156, 255, ...)`. No `#7aaef5`. If a color appears in a component's inline style or CSS and it's not a `var()` reference to a token, it's a bug.

**The accent-ready migration:** `--accent-ready` is the legacy generic blue. It was appropriate before the assembly color system existed. Now it should be replaced:
- Primary buttons inside workspace: `background: var(--assembly-tone, var(--accent-ready))` — the assembly tone takes precedence, accent-ready is the fallback
- Focus rings: can keep `--accent-ready` for now (accessibility standard, doesn't need to be assembly-colored)
- Links outside workspace (login, account, public pages): keep `--accent-ready`

### 6.3 How to Audit

Run this check across the codebase:

1. Search `globals.css` for any hardcoded `#` color values inside component class rules (not inside `:root` token definitions). Each one should be a `var()` reference instead.
2. Search all `.jsx` component files for `style={{` with hardcoded color values. Each should use a token.
3. Search for `--accent-ready` usage inside workspace components. Each should be replaced with `var(--assembly-tone, var(--accent-ready))` or removed.
4. Visually compare every interactive element against the three standards: chip (assembly-tone), primary button (assembly-tone background), secondary button (surface-4 border). If it doesn't match any of the three, it's off-system.

### 6.4 The Add Button — Specific Fix

The mobile center Add button is the most visible off-system element. Here's the exact fix:

**Current CSS (approximate):**
```css
.assembler-mobile-nav__add {
  background: #339cff; /* or --accent-ready */
  color: white;
  border-radius: 50%;
  /* ... */
}
```

**Target CSS:**
```css
.assembler-mobile-nav__add {
  background: var(--assembly-tone-soft, rgba(127, 135, 147, 0.12));
  border: 1px solid var(--assembly-tone-border, rgba(127, 135, 147, 0.26));
  color: var(--assembly-tone-text, var(--text-primary));
  border-radius: 20px;
  box-shadow: 0 1px 6px var(--assembly-tone-glow, transparent);
  /* same padding and sizing as current */
}

.assembler-mobile-nav__add:active {
  background: var(--assembly-tone, rgba(127, 135, 147, 0.3));
}
```

The Add button inherits the assembly step color from the workspace. At state 0 (gray), it's a subtle gray pill. At state 3 (teal), it has a teal tint. At state 6 (amber), it glows warm. The button belongs to the box. It changes with the box. It's not a platform element — it's an assembly element.

The `+` icon inside the button uses `var(--assembly-tone-text)`. The "ADD" label uses the same color.

---

## 7. What This Pass Does Not Cover

- New product features or API routes
- Seven-powered operator-sentence decomposition (replaces keyword-based `suggestBlockTag`)
- The public box concept (separate spec)
- GetReceipts remote seal, evidence upload, or retry (separate proposal, already shipping)
- Mobile-specific responsive redesign beyond what `isMobileLayout` already handles
- Accessibility audit beyond `prefers-reduced-motion` and ARIA labels on interactive elements

---

*The car is stripped. This pass paints it. One color system. One interaction pattern. One language. The driver feels the road and reads the instruments. Nothing else is on the dash.*
