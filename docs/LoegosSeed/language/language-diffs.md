# Lœgos Diffs

Date: April 6, 2026
Status: Extension brief — proposed for v0.5 of the language spec
Purpose: Define how Lœgos renders change between two states without colliding with how it renders state itself.

## The collision problem (read this first)

The base language spec assigns meaning to color on text:

- Green = grounded by local evidence
- Red = unsupported or contradicted

Standard diff conventions assign different meaning to the same colors:

- Green = added line
- Red = removed line

**These two color schemes cannot run on the same surface in the same visual context.** A red line in a diff and a red line in Lœgos rendering would mean opposite things — "removed" versus "unsupported." Reading the wrong meaning at a glance is worse than reading no meaning at all, because it trains the wrong reflex and erodes trust in the rendering.

The diff extension must therefore treat **diff rendering as a separate visual context** with explicit disambiguation. The two schemes can coexist in the same product, but never in the same glance.

## The disambiguation rules

Three rules govern when diff rendering may appear and how it must be marked.

### Rule 1: Diff context is explicitly framed

Diff rendering only appears inside a surface labeled as a diff. The label can be:

- A tab ("Changes" vs "Reading")
- A header strip ("Diff: Operate run #3 → #4")
- A modal or panel with a "Diff" eyebrow
- A section break with `↔` or `Δ` or `Diff:` as a visual marker

A user must never see diff colors without first seeing the frame that says "you are now reading change, not state."

### Rule 2: Diff rendering uses prefixes, not just color

Inside a diff context, every changed line carries a structural prefix in addition to color:

| Change type | Prefix | Diff color | Meaning |
|---|---|---|---|
| Added | `+` | Green | This block was added since the previous state |
| Removed | `−` | Red | This block was removed since the previous state |
| Modified | `~` | Amber | This block existed before but its content or state changed |
| Unchanged | (none) | Neutral text | Carried forward unchanged |

The prefix carries the meaning even when color is unavailable (color blindness, low contrast, screen readers). A line that says `+ Melih confirmed Friday` is unambiguously "this block was added," regardless of how it renders visually.

### Rule 3: Inline state colors stay out of the delta strip

The diff context shows two kinds of information:

1. **The delta strip**: the visual elements that say what changed (counts, prefixes, gutter marks, header summaries)
2. **The post-change state**: what the box looks like *after* the change

The delta strip uses diff colors (green-add / red-remove / amber-modified). The post-change state uses signal colors (green-grounded / amber-partial / red-unsupported / neutral / attested).

A user reading a diff sees the delta strip and the post-change state side by side, but the strip is clearly framed as "what changed" and the state is clearly framed as "what it now is." The two never bleed into each other inside one row or one chip.

**Concrete example:**

```
Diff: Operate run #3 → #4
─────────────────────────────────────
+2 □   −1 △   ~3 blocks   convergence 67% → 74%   trust L2 → L3
─────────────────────────────────────

+ □ Melih confirmed Friday by WhatsApp.            [grounded · L2]
+ □ Calendar event created for prototype review.    [grounded · L2]
~ △ Build a workspace that reveals coordination.    [partial · L2]
                                                     was: [partial · L1]
− △ Hack the code of reality.                       [removed]
```

The `+`, `−`, `~` carry the change type. The diff colors (in the prefix and the strip) say "added/removed/modified." The signal chips on the right (`[grounded · L2]`) say what the post-change state of the surviving blocks is. The two systems are visually distinct because the delta information is on the left and the state information is on the right, and the labels are explicit.

## The compression rule

Like state rendering, diff rendering must be readable in three seconds. The minimum legible diff carries:

- **Counts** of what changed, broken out by shape (`+2 □`, `−1 △`)
- **One trajectory metric**: convergence delta (`67% → 74%`) or trust step (`L2 → L3`)
- **Optional**: which specific blocks changed, listed below the strip

If a diff cannot be compressed to one line of counts plus one trajectory metric, it is not a Lœgos diff — it is a full state view that should be labeled as such.

## The minimum v0.5 surface

The first version of diff rendering should ship narrow:

1. **Box header strip** showing the delta since the user last viewed this box
   - `+N □  −N △  ~N blocks   convergence X% → Y%`
   - One line. No expansion. Tap to drill into the full diff.

2. **Operate run history** showing run-to-run deltas
   - Each historical run shows `Δ` from the previous run
   - Same counts + convergence + trust step format

3. **Receipt header diff** showing what changed between two receipt states
   - Only when comparing two sealed snapshots
   - Bounded to receipt bundle deltas, not free-form prose diff

The v0.5 surface explicitly excludes:

- Word-level prose diff (too much surface, no clear receipt model)
- Diff as a sealable artifact (requires stable snapshot infrastructure beyond what exists)
- Inline diff annotations on the Lœgos renderer itself (collision risk too high)
- Real-time diff between unsaved edits and persisted state (adds latency and reroute complexity)

These can come later. They are not v0.5.

## The data this needs (already exists)

Diff rendering computes from data the backend already persists:

| Diff input | Backend source |
|---|---|
| Operate run N vs run N−1 | `ReaderOperateRun` rows ordered by `createdAt` |
| Block-level signal deltas | `payloadJson.blocks[]` between two runs |
| Coverage deltas (truncation changes) | `payloadJson.coverage` between two runs |
| Trust ceiling step | `payloadJson.summary` trust counts |
| Override additions/removals | `ReaderAttestedOverride` updates between two timestamps |
| Receipt bundle deltas | `ReadingReceiptDraft` with `payload.sealAudit.operateRunId` |

No new schema. No new API routes. The diff is a pure derived view over data that already exists. The renderer reads two snapshots and produces a delta. The delta is presentational — it does not need its own persistence in v0.5.

## Where this fits in the spec hierarchy

Diff rendering is an **extension** of the base language spec, not a replacement. It carries the same dimensions (shape, signal, weight) but applies them to motion instead of state.

| Concept | State rendering (v1.1) | Diff rendering (v0.5 extension) |
|---|---|---|
| **What it shows** | What this block currently is | What changed between two snapshots |
| **Color semantics** | Signal: grounded / partial / unsupported | Change: added / removed / modified |
| **Prefix** | Shape glyph (△ □ œ 𒐛) | Change marker (+ − ~) followed by shape glyph |
| **Visual context** | Single buffer, default rendering | Explicitly framed diff context only |
| **Compression unit** | One block per line | Counts + trajectory metric per box |
| **Persistence** | Operate runs persist; rendering is derived | Pure derived view over persisted runs |

The two systems share dimensions but never share a surface without an explicit frame. The base spec governs how text is read. The diff extension governs how change between reads is read.

## Implementation order

If this becomes a real build, the order matters:

1. **Box header strip first.** One line at the top of any box. Counts + convergence delta + trust step. Computed from the latest two operate runs. No interaction beyond display. This is the minimum proof that diff rendering carries meaning at a glance.

2. **Operate run history second.** A simple list of past runs with `Δ` between each. Same format as the box header strip. No drill-down yet. This proves diffs are useful as trajectory, not just as snapshot.

3. **Receipt header diff third.** Only when comparing two sealed receipt states. Read-only. Bounded to receipt bundle metadata. This proves diffs can become part of the sealed record without requiring full prose diff infrastructure.

4. **Founder wow integration fourth.** When the user adds evidence and re-runs Operate, show a brief diff toast: "Block 5 went from amber to green because you added the WhatsApp screenshot." This is the moment where diffs become the cause-and-effect surface, not just a report.

Each step is a discrete slice. Each one ships before the next is started. The collision rule applies at every step.

## What gets added to language-in-use.md when this lands

The field note that triggered this extension is itself an entry. Add it:

> Founder, looking at a GitHub diff badge in chat, said "lœgos language may be able to show diff like this too as an idea."
>
> Gloss: The founder recognized that the +/− with green/red color compression on a code diff is structurally the same compression Lœgos applies to state, and that the language could naturally extend to render coordination change with the same scannability.

That entry belongs in `language-in-use.md` as pattern recognition evidence — the founder reading a GitHub diff as proto-Lœgos. The normative rules for how that recognition becomes a feature belong here, in `language-diffs.md`.

## Open questions for v0.5 planning

These should be resolved when the extension moves from brief to spec section:

1. **Which exact disambiguation channel ships first** — tab labels, header strip, modal, or section eyebrow? Pick one for v0.5 and standardize.

2. **What does "modified" mean for a block?** Does an edit count as a modification, or only a signal/trust change? Rules need to be explicit.

3. **How are diff colors specified in the design tokens?** New hex values, or reuse the existing palette with different semantic names? If reuse, the names must make collision impossible at the CSS level (`--diff-add` not `--green`).

4. **Does the founder wow toast survive page reload?** If so, where is it persisted? If not, is it only shown on the in-session re-run?

5. **What is the receipt diff's compression target?** Two sentences? One sentence? A single delta line?

These are planning-phase questions, not brief-phase questions. The brief is to lock the collision rule and the minimum scope. Everything else follows.

## One-line position

Diff rendering is a real extension of the language because trajectory carries meaning that state cannot. It must ship as a separate visual context with explicit disambiguation, because the same colors mean opposite things in diff space and signal space, and the product cannot afford to teach the wrong reflex.
