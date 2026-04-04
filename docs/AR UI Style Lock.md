# Loegos UI Style Lock

## Purpose

This document locks the visual language for the Loegos application shell.

The goal is not "dark mode with tasteful cards." The goal is a calm, native-feeling, desktop-grade tool UI in the same visual family as the Codex/Cursor references:

- dark graphite canvas
- system UI typography
- restrained chrome
- one cool accent
- sparse, utility-first copy
- the tool is the hero, not any individual document

If a new screen does not look like it belongs beside the reference images, it is wrong even if it is technically polished.

## Product Rule

Loegos is a tool for working with source material.

The built-in `Lœgos` guide is one source inside that tool.

That means:

- the app chrome must never visually worship the built-in document
- the built-in guide can be pinned, but it cannot dominate the screen
- the first impression should be workspace, controls, recent material, and next action
- documents are rows, panels, tabs, and working surfaces, not billboard heroes

## Visual Thesis

Native desktop workbench.

The interface should feel like a serious Mac app with custom product taste, not a marketing site, not an editorial essay, and not a glassmorphism dashboard.

## Reference Traits To Match

From the provided Codex-style references, the look is defined by:

- near-black background, not true black
- very soft panel separation
- rounded rectangles with medium radius
- thin lines instead of loud borders
- system fonts for all chrome
- white text with low-contrast secondary text
- one blue accent, used sparingly
- a lot of open space
- centered or calmly aligned composition
- no decorative gradients
- no green-as-brand accent
- no serif UI headlines
- no oversized marketing copy on product screens

## Non-Negotiables

1. App chrome uses system UI fonts.
2. Monospace is reserved for code, metadata, timestamps, and small technical labels.
3. Serif typography is for document content only, not the product shell.
4. The default accent is blue, not green.
5. Cards are rare. Panels exist only when they are structurally useful.
6. The home screen is a launcher/workbench, not a content showcase.
7. The built-in guide appears as a pinned source row, not a hero card.
8. Empty states must feel quiet and capable, never promotional.

## Token Set

Use this as the canonical shell palette unless a future document explicitly replaces it.

```css
:root {
  --ar-bg: #181818;
  --ar-bg-elevated: #1f1f1f;
  --ar-bg-panel: #242424;
  --ar-bg-panel-hover: #2a2a2a;
  --ar-bg-input: #202020;

  --ar-fg: #ffffff;
  --ar-fg-secondary: rgba(255, 255, 255, 0.68);
  --ar-fg-tertiary: rgba(255, 255, 255, 0.45);
  --ar-fg-quiet: rgba(255, 255, 255, 0.28);

  --ar-line: rgba(255, 255, 255, 0.08);
  --ar-line-strong: rgba(255, 255, 255, 0.12);
  --ar-line-focus: rgba(51, 156, 255, 0.5);

  --ar-accent: #339cff;
  --ar-accent-soft: rgba(51, 156, 255, 0.14);
  --ar-accent-strong: rgba(51, 156, 255, 0.24);

  --ar-danger: #ff6b6b;
  --ar-danger-soft: rgba(255, 107, 107, 0.14);

  --ar-radius-sm: 10px;
  --ar-radius-md: 14px;
  --ar-radius-lg: 18px;
  --ar-radius-xl: 22px;

  --ar-shadow-panel: 0 12px 32px rgba(0, 0, 0, 0.18);
}
```

## Typography

### Shell Typography

Use:

- UI font: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`
- Code/meta font: `ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace`

Do not use:

- Newsreader in app chrome
- IBM Plex Mono for large shell copy
- any display serif for panel titles, launchers, or app controls

### Size Scale

- app body: `13px`
- panel title: `13px` to `15px`
- secondary/meta: `11px` to `12px`
- large launcher title: `32px` to `44px`, but only on centered empty/workbench screens
- row title: `14px` to `15px`

### Weight Rules

- default UI text: `500`
- section headers: `500`
- large launch text: `600`
- meta labels: `500`

### Letterspacing Rules

- avoid aggressive tracking for product UI
- only tiny uppercase labels may use subtle tracking
- never track out large titles the way editorial posters do

## Layout System

### Global Window

- the application sits on a single continuous dark canvas
- sidebar is a slightly elevated strip, not a separate themed world
- top chrome is thin and quiet
- the main canvas should feel open, not boxed in

### Primary Shell

Structure:

1. sidebar or source rail
2. main working canvas
3. optional inspector or staging rail
4. bottom composer or player when relevant

The main surface should always win visually.

### Panel Rules

Panels are allowed when they serve one of these jobs:

- navigation
- composer
- inspector
- grouped settings
- structured recent items

Panels are not allowed as decorative wrappers around every region.

## Surface Behavior

### Background

- use charcoal layers, not gradients
- rely on value shifts, not effects

### Borders

- use 1px soft lines
- do not use glowing outlines for resting state
- accent borders appear only on active or focused elements

### Radius

- panels: `18px`
- inputs/composer: `18px` to `22px`
- pills/chips: full pill
- tiny rows/buttons: `10px` to `14px`

### Shadows

- subtle and broad
- never cinematic
- never used to fake depth when spacing would solve it

## Interaction Language

### Accent Use

Blue accent is for:

- active selection
- focus
- primary action
- toggles and controls

Blue accent is not for:

- every badge
- every icon
- every divider

### Hover

- small lift in value
- slightly stronger border
- no neon glow

### Focus

- visible blue ring or border reinforcement
- consistent across buttons, inputs, rows, and toggles

### Motion

- quiet and fast
- opacity, translateY, scale 0.98 to 1.0
- no theatrical stagger unless explicitly justified

## Copy Rules

Product UI copy must sound operational.

Use:

- `Import source`
- `Paste to staging`
- `Assembly`
- `Receipt drafts`
- `Open source`
- `Continue working`

Avoid:

- `The product teaching itself`
- `Words are Legos` inside the authenticated workspace
- `Start from a source and build toward a working assembly` as large hero copy
- narrative explanation where a label would do

The landing page may remain aphoristic.

The workspace may not.

## Screen Archetypes

### 1. Landing

- minimal
- operator sentence
- integrated auth
- no explanatory product page in this phase

### 2. Workspace Home

- centered or calmly aligned launcher
- one primary next action
- a short row of secondary actions
- recent sources and current assembly beneath
- built-in guide as a pinned source row

### 3. Listen Mode

- low-noise canvas
- reading surface is dominant
- player is quiet and precise
- side navigation is present but visually recessed

### 4. Assemble Mode

- document surface in center
- source rail on left
- staging/AI inspector on right
- restrained controls

### 5. Dialogs / Sheets

- compact
- rounded
- dark elevated panel
- no native browser dialogs when product UI can handle it

## AR-Specific Mapping

### Home Screen

The home screen should feel closer to a launcher than a dashboard.

Correct:

- box name
- next action
- recent sources
- assembly
- receipts as a secondary status area

Incorrect:

- giant hero for a document
- duplicated guide treatment
- multiple equal-weight large cards
- marketing copy blocks inside the tool

### Built-In Guide

Correct:

- pinned first row in sources
- subtle `Guide` badge
- open and listen actions

Incorrect:

- giant headline card
- duplicate guide cards
- guide used as the main visual identity of the app shell

### Source Rows

Rows should be compact and calm:

- title
- small metadata
- kind badge
- optional quick listen button
- optional overflow/delete action

They should look closer to a desktop file list than to a promotional tile.

## Anti-Rules

Do not ship any of the following:

- editorial serif home screens
- green primary accent in app chrome
- glowing borders around major sections
- giant document-title heroes
- card stacks as the default layout
- copy that sounds like a product pitch inside the workspace
- duplicated treatment of the same document

## Implementation Checklist

Before approving a new UI pass, verify:

1. Does it use system UI fonts for shell chrome?
2. Is blue the only accent?
3. Is the workspace mostly open canvas instead of stacked cards?
4. Is the built-in `Lœgos` guide just one source in the list?
5. Can the screen be understood by scanning labels only?
6. Does the home feel like a tool launcher?
7. Would this sit naturally next to the Codex/Cursor screenshots?

If any answer is no, revise before shipping.
