# Cuneiform Matrix Lock Screen — Build Spec v2.0

**Date:** March 30, 2026
**For:** assemblyreality.com

---

## 1. Summary

A 4×7 grid of falling Sumerian cuneiform characters. The user must click four specific characters hidden in the rain. There are two valid passwords — either unlocks the site. No instructions. No visual hints. The password characters look identical to noise.

---

## 2. Passwords

Two valid 4-character sequences. Either one unlocks. Order of clicks does not matter.

### Password A — Enki + Seven

| Glyph | Unicode  | Sign  | Meaning      |
|-------|----------|-------|--------------|
| 𒀭    | U+1202D  | AN    | divine       |
| 𒂗    | U+12097  | EN    | lord         |
| 𒆠    | U+12192  | KI    | earth        |
| 𒐛    | U+1241B  | IMIN  | seven        |

### Password B — Grace Archer Cloud Seal

| Glyph | Unicode  | Sign   | Meaning         |
|-------|----------|--------|-----------------|
| 𒀭    | U+1202D  | AN     | sky / divine    |
| 𒋾    | U+122FE  | TI     | arrow / life    |
| 𒅎    | U+1214E  | IM     | cloud / wind    |
| 𒆳    | U+121B3  | KIŠIB  | seal            |

**Note:** 𒀭 (AN) is shared between both passwords. There are 7 unique password characters total:
`𒀭 𒂗 𒆠 𒐛 𒋾 𒅎 𒆳`

---

## 3. Noise Pool — All Cuneiform

The noise pool is every assigned Unicode cuneiform character MINUS the 7 password characters.

**Source blocks:**

| Block | Range | Assigned |
|-------|-------|----------|
| Cuneiform | U+12000–U+123FF | 922 |
| Cuneiform Numbers and Punctuation | U+12400–U+1247F | 116 |
| **Total** | | **1,038** |

**Noise pool size:** 1,038 − 7 = **1,031 characters**

### 3.1 Generating the Noise Pool

At build time, enumerate all assigned code points in both blocks and exclude the 7 password characters. Not all code points in the range are assigned — there are gaps. The builder must either:

**Option A** — Use a known list. The assigned ranges within U+12000–U+123FF are contiguous from U+12000 to U+12399 (922 chars). Within U+12400–U+1247F, assigned are U+12400 to U+12473 (116 chars). Iterate these ranges, skip unassigned gaps, exclude password chars.

**Option B** — At runtime, test each code point against the loaded font using canvas measurement. If the rendered width matches the `.notdef` (tofu) glyph width, skip it. This auto-filters to only renderable characters.

**Option B is recommended** — it guarantees every character in the rain actually renders, regardless of font version.

---

## 4. Font

### 4.1 Required

**Noto Sans Cuneiform** — the only production web font covering these Unicode blocks. SIL Open Font License (free commercial use). ~470KB woff2.

### 4.2 Loading

Google Fonts API does not reliably serve SMP (Supplementary Multilingual Plane) characters. Self-host.

```css
@font-face {
  font-family: 'Noto Sans Cuneiform';
  font-style: normal;
  font-weight: 400;
  font-display: block; /* block, not swap — never show tofu */
  src: url('/fonts/NotoSansCuneiform-Regular.woff2') format('woff2');
  unicode-range: U+12000-1247F;
}
```

Download source: `https://github.com/notofonts/cuneiform/releases`

Alternative CDN (less reliable long-term):
```
https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-cuneiform@latest/cuneiform-400-normal.woff2
```

### 4.3 Font Load Gate

Do NOT render the grid until the font is confirmed loaded.

```javascript
await document.fonts.load('1em "Noto Sans Cuneiform"');
// now safe to render
```

Show a minimal loading state (black screen, maybe a single dot) while waiting. Never render tofu boxes.

---

## 5. Grid

- **Columns:** 4
- **Rows:** 7
- **Cell aspect ratio:** 1:1
- **Grid max-width:** 320px (mobile), up to 400px (desktop)
- **Cell gap:** 3px
- **Cell border-radius:** 4px
- **Cell font-size:** `clamp(22px, 6vw, 32px)`

---

## 6. Rain Mechanic

### 6.1 Tick

Every **550ms**, each unfrozen column shifts down by one cell: bottom cell removed, new cell inserted at top.

### 6.2 Password Character Scheduling

**Window:** 7 seconds (~13 ticks at 550ms).

Within each 7-second window, every unfound password character appears **exactly once** somewhere in the grid. At the start of each window, for each of the 7 password characters that hasn't been found yet, randomly assign:
- Which column it appears in (any of the 4 unfrozen columns)
- Which tick within the window it appears on

Multiple password characters may share a column (at different ticks). A column may have 0, 1, 2, or 3 password characters in a given window — it's random.

### 6.3 New Cell Content

On each tick, each unfrozen column gets a new top cell:
- If this tick is the scheduled tick for a password character in this column → insert that password character (mark `isTarget: true` internally)
- Otherwise → insert a random character from the noise pool

### 6.4 Visual Fade

Characters are brighter at the top, dimmer at the bottom:

```
opacity = 0.15 + (1 - row/6) × 0.70
color: rgba(200, 180, 140, opacity × 0.5)
```

**CRITICAL:** Password characters use the exact same color/opacity formula as noise. Zero visual distinction. No bold. No glow. No size difference. No color shift. They are invisible unless you recognize them.

---

## 7. Interaction

### 7.1 Click/Tap

If cell is a target AND glyph is an unfound password character:
- Mark that character as found
- Freeze that column (stops raining, shows found char with full brightness + pulsing glow)
- Check win condition

If cell is not a target OR character already found:
- Red flash on cell (400ms), no other penalty

### 7.2 Win Condition

The system maintains a `found` set of clicked password characters. After each successful click, check:

```
Password A = {U+1202D, U+12097, U+12192, U+1241B}
Password B = {U+1202D, U+122FE, U+1214E, U+121B3}

if (Password_A ⊆ found) OR (Password_B ⊆ found) → unlock
```

Since 𒀭 is shared, clicking it counts toward both passwords.

The user does NOT need to "choose" a password upfront. They just click characters. The system checks after each click whether any valid password has been completed.

### 7.3 Progress Display

Four boxes at top. Show each found character as it's clicked, left to right in click order. Below: `{found.size} / 4`. The boxes do not indicate which password the user is building.

### 7.4 Frozen Columns

When a password character is found, freeze its column:
- Column stops shifting
- All 7 cells show the found character at full brightness
- Pulsing text-shadow glow
- Column is no longer clickable

Note: since password characters are not fixed to columns, a column freezes wherever the user happened to click it. If the user finds all 4 in the same column across different windows (unlikely but possible), 4 columns will still freeze because each click freezes the column it occurred in.

---

## 8. Unlock Sequence

Trigger 600ms after win condition met. Four phases, ~1200ms apart:

**Phase 1:** △ ○ □ 𒐛 — seal symbols, equal size, pulsing

**Phase 2:** "hineni" — italic serif, muted gold. The only Latin word.

**Phase 3:** The completed password revealed:
- If won via Password A: 𒀭𒂗𒆠 𒐛
- If won via Password B: 𒀭 · 𒋾 · 𒅎 · 𒆳

**Phase 4:**
- Trinity: 𒀭 · 𒋾 · 𒅎
- Seal marker: 𒆳 𒐛
- Reset button: 𒊕 𒆠 𒃻

---

## 9. Visual Design

**Background:** #000000, transitions to subtle radial gradient on unlock.

**Color:** All text is rgba(200, 180, 140, varies) — warm clay/gold.

**Wrong click:** rgba(180, 60, 60, 0.2) background flash, 400ms.

**Frozen glow:** text-shadow oscillating between 8px and 20px spread at rgba(200, 180, 140, 0.5–0.8).

**Scanline:** 2px horizontal gradient line sweeping top to bottom every 3s, opacity ~0.06. Disabled after unlock.

**Typography:**
- Cuneiform: Noto Sans Cuneiform
- Latin ("hineni", counter): EB Garamond from Google Fonts

---

## 10. Accessibility

This is an intentional cultural puzzle, not screen-reader accessible by design. Provide an alternative entry: a text input that accepts `enki7` or `gracearchercloud` (or equivalent) as keyboard-only bypass.

---

## 11. Reset

Clicking the reset button (𒊕 𒆠 𒃻) after unlock:
- Clears found set and frozen columns
- Reinitializes grid with fresh noise
- Reschedules password characters
- Returns to playing state

---

## 12. Cuneiform Reference

All characters used in the UI with their verified Unicode points:

| Role | Glyph | Unicode | Sign |
|------|-------|---------|------|
| Password: divine | 𒀭 | U+1202D | AN |
| Password: lord | 𒂗 | U+12097 | EN |
| Password: earth | 𒆠 | U+12192 | KI |
| Password: seven | 𒐛 | U+1241B | IMIN |
| Password: arrow/life | 𒋾 | U+122FE | TI |
| Password: cloud/wind | 𒅎 | U+1214E | IM |
| Password: seal | 𒆳 | U+121B3 | KIŠIB |
| UI: head/point | 𒊕 | U+12295 | SAG |
| UI: measure/place | 𒃻 | U+120FB | GAR |
