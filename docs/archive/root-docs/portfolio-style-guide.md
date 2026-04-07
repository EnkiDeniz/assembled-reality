# Loegos Portfolio Style Guide

This guide is for developers bringing other sites in the portfolio into the same visual family as Loegos.

It is based on the live implementation in:

- `/Users/denizsengun/Projects/AR/src/app/styles/tokens.css`
- `/Users/denizsengun/Projects/AR/src/app/styles/base.css`
- `/Users/denizsengun/Projects/AR/src/app/styles/layout.css`
- `/Users/denizsengun/Projects/AR/src/app/styles/surfaces.css`
- `/Users/denizsengun/Projects/AR/src/app/globals.css`

## What We Are Standardizing

The portfolio should feel like one product family:

- dark graphite base, never pitch black
- quiet, desktop-grade chrome
- white primary text with muted secondary text
- one electric blue accent
- rounded utility surfaces
- restrained borders and shadows
- sparse, operational copy
- minimal decoration

This is not a glossy SaaS dashboard style.
This is not a bright marketing-brand system.
This is not editorial serif-led product chrome.

The overall feeling should be calm, precise, and tool-like.

## Brand Personality

Use these traits as the filter for design decisions:

- serious
- calm
- exact
- high-trust
- desktop-first
- utility-led

If a choice makes the UI feel louder, trendier, softer, or more promotional, it is probably off-brand.

## Core Visual Rules

### 1. Color

The default visual world is dark neutral with one blue accent.

- Canvas is charcoal, not black.
- Surfaces are separated by subtle value shifts.
- White is reserved for primary text and high-priority labels.
- Secondary information uses muted white, not gray-beige or colored text.
- Blue is the main accent for active, selected, focused, or primary states.
- Red is reserved for destructive/error states only.

Do not introduce a second brand accent unless the site has a very specific reason and it does not compete with the core blue.

### 2. Typography

The product family uses typography by role, not by taste.

- UI and shell text: clean sans or native-feeling system stack
- Metadata and technical labels: monospace
- Editorial/display serif: only for intentionally editorial content, never for app chrome

Current implementation notes:

- The shell styles currently rely on `var(--font-ui)` and `var(--font-code)`.
- The app layout also loads `Newsreader` and `IBM Plex Mono`.
- For portfolio alignment, developers should treat the shell standard as:
  - primary UI font: system sans stack
  - metadata/code font: mono stack
  - editorial serif: optional, content-only

### 3. Shape

- Panels use medium-large radius.
- Buttons and inputs are soft rectangles, not sharp or ultra-pill by default.
- Pills and badges can use full pill radius.
- Corners should feel controlled and consistent, never mixed randomly across the same page.

### 4. Motion

- fast
- quiet
- practical

Allowed:

- subtle hover value shift
- slight border strengthening
- tiny translateY lift
- simple opacity transitions

Avoid:

- large-scale parallax
- decorative entrance choreography
- bouncy interactions
- glowing animations

### 5. Copy

Interface copy should sound operational, not promotional.

Prefer:

- `Open box`
- `Add source`
- `Paste to staging`
- `Continue`
- `Recent assemblies`
- `Connected`

Avoid:

- inspirational slogans inside working product surfaces
- long explanatory hero copy on utility pages
- chatty labels
- language that makes the UI feel like a campaign site

## Canonical Tokens

Use these tokens when aligning a portfolio site.

```css
:root {
  --surface-0: #181818;
  --surface-1: #1f1f1f;
  --surface-2: #242424;
  --surface-3: #2a2a2a;
  --surface-4: #303030;

  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.68);
  --text-meta: rgba(255, 255, 255, 0.45);

  --accent-primary: #339cff;
  --accent-primary-soft: rgba(51, 156, 255, 0.08);
  --accent-primary-border: rgba(51, 156, 255, 0.22);
  --accent-danger: #ff6b6b;

  --line-soft: rgba(255, 255, 255, 0.06);
  --line-default: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.12);

  --focus-ring:
    0 0 0 1px rgba(51, 156, 255, 0.46),
    0 0 0 4px rgba(51, 156, 255, 0.14);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 22px;

  --shadow-panel: 0 14px 36px rgba(0, 0, 0, 0.22);

  --font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  --font-code: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
}
```

## Color Usage Rules

### Neutrals

Use the surface scale like this:

- `--surface-0`: page background
- `--surface-1`: major rails or elevated shell
- `--surface-2`: panels and cards that truly need containment
- `--surface-3`: hover state or stronger contained block
- `--surface-4`: active neutral controls

### Accent Blue

Use blue for:

- primary CTA
- active row
- selected filter
- focused field
- active toggle
- highlighted user/system-important state

Do not use blue for:

- all icons
- every badge
- section dividers
- decorative gradients
- general text emphasis

### Red

Use red only for:

- delete
- remove
- destructive confirm
- error state

## Typography Rules

### Size Bands

Use these as the default scale:

- small meta: `11px` to `12px`
- body UI copy: `13px` to `15px`
- section title: `15px` to `18px`
- page title: `30px` to `46px`

### Weight

- regular UI: `400` to `500`
- section headers: `500` to `600`
- page titles: `600`
- meta labels: `500`

### Letterspacing

- default: normal
- tiny uppercase labels: slight tracking only
- avoid over-tracked headlines

### Monospace Usage

Use monospace for:

- badges
- tiny labels
- timestamps
- technical metadata
- counts
- provenance/status details

Do not use monospace for:

- long paragraphs
- main headings
- CTA labels

## Layout Principles

### Overall Composition

Pages should feel stable and intentional.

- Use wide, calm canvases.
- Prefer grid-based structure.
- Let the main working area win visually.
- Use contained panels only where structure helps comprehension.

### Density

- generous outer spacing
- compact but breathable inner spacing
- avoid both cramped dashboards and oversized landing-page whitespace

### Alignment

- prefer left-aligned content in product surfaces
- use centered composition sparingly for landing and sign-in screens

## Component Patterns

### Panels

Standard panel treatment:

- background: `--surface-2`
- border: `1px solid var(--line-default)`
- radius: `22px` for larger shells, `18px` for standard panels
- shadow: `var(--shadow-panel)` only when the panel is meaningfully elevated

Panels should group content or controls.
Do not wrap every section in a panel just to make the page feel designed.

### Buttons

Secondary button:

- neutral dark background
- subtle border
- white or muted text
- small hover value increase

Primary button:

- blue-tinted background
- blue border reinforcement
- white text

Destructive button:

- neutral base until hover/focus
- red text or red hover treatment

### Inputs

- dark filled background
- soft border
- rounded corners
- white text
- blue focus ring

Inputs should feel integrated into the shell, not like bright form controls dropped onto a dark page.

### Rows and List Items

Common row pattern in Loegos:

- icon or quick action on the left
- title and meta in the middle
- badge or actions on the right
- hover uses `--surface-3`
- active/selected uses soft blue background + blue border

This row pattern should be reused across document lists, item lists, navigation rows, and inventory tables.

### Badges and Pills

- monospace or compact sans
- small size
- soft line border
- low-key background

Badges are for state or type labeling, not decoration.

### Empty States

Empty states should be quiet and capable.

- short title
- one or two sentences max
- one direct action
- optional secondary action

Never turn empty states into marketing blocks.

## Content and Marketing Pages

For portfolio sites that are more outward-facing than the core app, the same family still applies, but with slightly more room for composition.

Allowed:

- larger headline scale
- more atmospheric spacing
- stronger art direction
- editorial serif for content areas if the page truly benefits from it

Still required:

- graphite base
- restrained chrome
- blue accent discipline
- operational, intelligent tone

Not allowed:

- pastel brand pivots
- loud gradients as the main identity
- glassmorphism
- ultra-rounded consumer-app styling
- generic startup illustration style

## Accessibility and Interaction Rules

- Maintain strong contrast between primary text and background.
- Secondary text must still be readable.
- All interactive elements must have a visible focus state.
- Hover should never be the only affordance.
- Motion must respect `prefers-reduced-motion`.
- Hit areas should remain comfortable on mobile and trackpad-based desktop use.

## Migration Checklist For Other Sites

When aligning another portfolio site, developers should do this in order:

1. Replace the site background and surface palette with the canonical graphite scale.
2. Swap all brand accents to the portfolio blue unless a very specific exception is approved.
3. Normalize border colors, radii, and panel shadows.
4. Move UI text to the system sans stack and reserve mono for metadata.
5. Simplify any over-designed cards, glows, gradients, or decorative separators.
6. Rewrite CTA labels and section copy into concise operational language.
7. Standardize buttons, inputs, badges, and list rows to the shared patterns.
8. Verify focus, hover, error, and selected states use the same interaction language.
9. Check mobile layouts so the same calm density survives at smaller widths.

## Quick Do / Don't

Do:

- use charcoal-on-charcoal layering
- use one blue accent consistently
- keep the interface sparse and precise
- rely on spacing and hierarchy before effects
- make controls feel native and dependable

Don't:

- introduce bright brand color families per page
- use serif for shell UI
- over-card the page
- make every state colorful
- add decorative gradients to compensate for weak layout

## Reference Implementation Notes

Current source-of-truth patterns are easiest to study in:

- `/Users/denizsengun/Projects/AR/src/app/styles/tokens.css`
- `/Users/denizsengun/Projects/AR/src/app/styles/surfaces.css`
- `/Users/denizsengun/Projects/AR/src/components/IntroLanding.jsx`
- `/Users/denizsengun/Projects/AR/src/components/ProjectHome.jsx`

One implementation inconsistency to keep in mind:

- `layout.jsx` loads `Newsreader` and `IBM Plex Mono`, but the active shell token system still defines UI typography around the system stack.
- For portfolio handoff, treat the system sans + mono pairing as the default shell standard unless a site is intentionally editorial.

## Handoff Instruction For Developers

When adapting another site, the goal is not to copy Loegos screen-for-screen.

The goal is to make every site feel like it was designed by the same company using the same judgment:

- same palette logic
- same typography roles
- same interaction language
- same density
- same restraint

If a page still feels like a different company after the token swap, keep refining.
Alignment is not complete until the tone, hierarchy, and control language also match.
