# Loegos Design-System Audit And Unification Brief

**Status:** Canonical style-system audit  
**Date:** April 5, 2026  
**Audience:** Product design and frontend implementation  
**Scope:** Token sources, shell styles, alternate style references, and the final Loegos visual system

## Summary

Loegos already has a strong visual direction. The problem is not lack of identity. The problem is that the repo currently contains multiple overlapping style systems:

1. a documented graphite-and-blue portfolio system
2. a compact token layer in `src/app/styles/*.css`
3. a very large legacy/global style file in `src/app/globals.css`
4. an alternate elegance reference that carries useful hierarchy ideas but a conflicting visual language

The correct move is not to invent a new design system. It is to choose one canonical system, retire aliases and drift, and make component styling obey the same rules everywhere.

One additional conclusion from the runtime audit:

- trust should not become its own ornamental visual system in the shell
- the default shell expression should collapse trust into a compact three-signal pattern, with richer trust semantics reserved for Operate and receipt details

## Current Sources Of Truth

### Canonical

#### `docs/portfolio-style-guide.md`

Status:

- canonical intent

Why:

- clearly defines the desired family: graphite surfaces, restrained chrome, white text, one electric blue accent, rounded utility surfaces, tool-first tone
- gives usable token values and behavioral rules

Keep:

- graphite surface scale
- one-blue-accent rule
- operational copy tone
- role-based typography guidance
- restrained border/shadow rules

### Canonical but underused

#### `src/app/styles/tokens.css`

Status:

- canonical token base that should become the real implementation source of truth

Why:

- concise
- already aligned to the graphite family
- includes spacing, radii, shadow, typography, and semantic colors

Keep:

- surface scale
- text scale tokens
- spacing/radius/shadow tokens
- `--font-ui` and `--font-code`

Needs revision:

- semantic accent names such as `--accent-warning` currently map to the same blue as primary
- assembly-step color scale is too broad and specific to remain a general shell token layer

### Salvageable but conflicting

#### `src/app/globals.css`

Status:

- implementation-heavy legacy layer with duplicated tokens and too much ownership

Why:

- it redefines base colors and aliases already present in `tokens.css`
- it mixes foundational tokens, component styles, legacy utilities, and workflow-specific visuals in one file
- it is `8774` lines, which makes design drift likely and review expensive

Keep:

- only the styles that are not already covered by the smaller token/base/layout/surface layers

Retire:

- duplicate token declarations in `:root`
- semantic aliases that all point to the same blue
- component styling that should live in smaller, scoped files

### Salvageable as principle, not as visual source

#### `elegance/document-assembler-elegance-spec.md`
#### `elegance/document-assembler-elegance.jsx`

Status:

- concept reference, not canonical style source

Why:

- the strongest idea is structural: `one star, everything else supporting cast`
- the actual visual implementation conflicts with Loegos:
  - near-black base instead of graphite
  - green-forward action treatment
  - mono-only expression
  - alternate icon and screen language

Keep:

- the screen-star principle
- its stricter hierarchy instincts

Retire:

- its raw colors, icon treatment, and component styling as a system source

## Evidence Of Drift

### Duplicate token worlds

`src/app/styles/tokens.css` already defines:

- `--surface-0` through `--surface-4`
- `--text-primary`, `--text-secondary`, `--text-meta`
- `--radius-sm` through `--radius-xl`
- `--shadow-panel`

`src/app/globals.css` redefines parallel values as:

- `--bg`, `--panel`, `--panel-2`, `--panel-3`
- `--text`, `--muted`, `--soft`
- `--shadow`
- `--radius-md`, `--radius-lg`, `--radius-xl`

Impact:

- contributors can style the same concept with two naming systems
- refactors and component review become ambiguous

### Semantic color drift

In `src/app/globals.css`, all of these map to the same blue:

- `--green`
- `--cyan`
- `--blue`
- `--purple`

In `src/app/styles/tokens.css`, these also collapse:

- `--accent-ready`
- `--accent-ai`
- `--accent-warning`

Impact:

- the UI appears semantically rich while actually being visually flat
- status language and color language stop reinforcing each other

### Over-specialized workflow color scales

`tokens.css` contains `--assembly-step-0` through `--assembly-step-7` plus soft, border, glow, and text variants.

Current runtime use:

- most references cluster around step `1`, `3`, `4`, `5`, and `6`
- they are being used as internal styling pigments for chips, outlines, gradients, and status treatments
- there is no clear evidence in the audited runtime that all eight steps map to stable user-facing states
- the currently visible product language does not teach an eight-step color scale to the user

Conclusion:

- this is primarily an internal styling substrate, not a coherent user-facing state model
- if the product cannot name all eight states in user terms, the eight-step system should be removed
- if any of the colors represent real user-facing states, they should collapse into the final three-signal system below

Impact:

- the token layer is carrying product-specific workflow state rather than reusable system tokens
- this encourages isolated styling decisions instead of consistent component rules

### Style ownership is too centralized

Repo line counts:

- `src/components/WorkspaceShell.jsx`: `11202`
- `src/app/globals.css`: `8774`
- `src/app/styles/surfaces.css`: `1618`

Impact:

- UX complexity and visual drift reinforce each other
- design refinements are expensive because structure and styling are both over-concentrated

## Final Unification Brief

### 1. Color And Tokens

Adopt this as the only shell token family:

- surfaces: `--surface-0` to `--surface-4`
- text: `--text-primary`, `--text-secondary`, `--text-meta`
- accent: one primary blue, one danger red
- spacing, radius, and shadow from `tokens.css`

Rules:

- remove duplicate `--bg`, `--panel*`, `--text`, `--muted`, `--soft`, and `--shadow` aliases once dependent styles are migrated
- reserve additional accent hues only for content-specific data visualization, not general shell UI
- rename misleading semantic aliases if they remain blue; do not call a blue token `green` or `warning`

### 2. Typography

Final roles:

- primary UI: system sans via `--font-ui`
- metadata and technical labels: `--font-code`
- editorial serif: content-only, never shell chrome

Rules:

- remove ambiguous `--font-copy` indirection unless it is meaningfully different
- stop mixing editorial behavior into navigation chrome
- keep small uppercase/meta usage bounded and consistent

### 3. Surface Hierarchy

Final surface structure:

- canvas: `surface-0`
- rails and shell containers: `surface-1`
- primary contained panels: `surface-2`
- hover/active neutral states: `surface-3`
- strong neutral controls only when truly needed: `surface-4`

Rules:

- one screen should not use every surface level at once unless there is a clear containment reason
- shadows should indicate meaningful elevation, not be the default on every panel
- border and value separation should do most of the work

### 4. Controls And Status Styling

Buttons:

- exactly one primary button style
- one neutral secondary style
- one destructive style

Inputs:

- shared radius, border, background, and focus behavior

Chips/badges:

- use one canonical family for metadata
- use a second family only for trust or proof state if needed

Status:

- system status, trust status, and workflow phase must not all use the same visual treatment
- trust needs one compact canonical pattern across rail rows and detail surfaces

### 5. Trust And Proof Signal

Default shell trust should collapse into a compact three-signal system:

- verified
- partial
- unverified
- unknown as neutral fallback when evidence is absent

Recommended default rendering:

- one compact signal dot plus short label when needed
- neutral = unknown
- amber = partial
- green = verified
- red only when the product truly means contradicted or failed, not merely low confidence

Rules:

- the shell should not render trust as a separate decorative language of bespoke chips and tones
- detailed trust floors, ceilings, and provenance explanation belong in Operate, receipts, or details views
- source rows should use trust as guidance, not as a parallel taxonomy system

### 6. What Must Stop Diverging

- duplicate root token definitions across `tokens.css` and `globals.css`
- multiple semantic names for the same blue
- ad hoc workflow-specific colors in general shell components
- alternate style references being treated as equivalent sources of truth
- giant global CSS owning both foundational tokens and component-specific styles

## Prioritized Implementation Brief

### Immediate design-token unification work

1. Declare `src/app/styles/tokens.css` the only canonical shell token source.
2. Migrate `globals.css` color aliases to token-family names.
3. Remove misleading same-blue aliases and replace them with honest semantic names.
4. Remove the `assembly-step-0` through `assembly-step-7` system unless each step can be named as a real user-facing state.
5. If any `assembly-step` semantics survive, collapse them into the three-signal trust/proof model.
6. Define one canonical badge system for metadata, trust, and proof.

### Immediate shell-style simplification work

1. Split legacy component styles out of `globals.css` into scoped surface or feature files.
2. Reduce gratuitous panel shadows and stacked containment.
3. Normalize button and input families across workspace states.
4. Use the intro/login surface as the visual restraint benchmark for authenticated shell redesign.

### Later refinement work

1. Decide whether workflow-state colors should exist at all beyond proof/trust needs.
2. Introduce a small icon standard for shell controls.
3. Tighten animation/motion only after hierarchy and tokens are stable.

## Acceptance Criteria

- one token naming system exists for shell colors and spacing
- no duplicate graphite token families remain in active use
- accent color meaning is consistent across the product
- shell controls look like one product family
- elegance references influence hierarchy decisions, not raw visual styling
