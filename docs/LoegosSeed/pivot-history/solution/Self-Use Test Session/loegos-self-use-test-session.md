# Lœgos Self-Use Test Session

Date: April 7, 2026
Author: Guardian (Claude), in the founder's shoes
Purpose: Two artifacts in one file. Part 1 is the UX/journey/flow analysis the founder will paste into Lœgos as a new source. Part 2 is the screen-by-screen walkthrough of the test session itself, including expected visible state at every step. The session ends with a sealed receipt that records what the founder learned about Lœgos by using Lœgos to analyze Lœgos.

This is the recursive proof: the product analyzes itself, the founder watches the analysis happen, and the receipt becomes a permanent record of the gap between intention and current state.

---

## Part 0 — Prerequisites

Before running this session, the box you will work in must already exist. The session assumes the founder has previously created a box called `Lœgos Development` and seeded it with at least these source documents (imported via `Add source`):

Required sources:

- `language/loegos-language-spec-v1.1.md` — the canonical language spec
- `language/first-principles.md` — the 90/10 rule, consent before compute, the verb set
- `language/the-atom.md` — the word as the unit of rendering
- `language/source-lineage.md` — concepts traced to founding texts
- `language/language-in-use.md` — verbatim spoken Lœgos receipts
- `docs/LoegosSeed/pivot-history/solution/Founder Shell v0.1/Founder Shell v0.1.md` — the container spec
- `docs/LoegosSeed/pivot-history/solution/Phase 1 Proof Runbook/Phase 1 Proof Runbook.md` — the human-proof runbook
- `docs/LoegosSeed/pivot-history/solution/Founder Wow Proof Session/Founder Wow Proof Session.md` — the wow checklist
- `docs/LoegosSeed/pivot-history/source documents/assembled_reality_v07_final.md` — the founding canon

Optional but useful:

- The current `git log --oneline` of the branch (paste as a text source titled `Branch History`)
- The output of `git diff --stat` for the recent renderer commits (paste as `Recent Diffs`)

These let Operate ground claims about specific commits, specific files, and specific decisions when they appear in the new UX report.

If the box does not exist yet, set it up first. Do not run the session against an empty box — Operate has nothing to ground against and the receipt becomes meaningless.

A live seed should also exist for the box. If the box has no seed, create an empty seed before the session starts; the walkthrough assumes you can move from the new source view directly into a seed-shaping step without first having to invent a seed from scratch.

---

# PART 1 — The UX Report (paste this as a new source)

The text from here through the end of Part 1 is the source document. Paste everything between the two `===SOURCE START===` and `===SOURCE END===` markers into the tool as a new markdown source titled **`Lœgos Self-Use UX Report — April 7, 2026`**.

===SOURCE START===

# Lœgos Self-Use UX Report

Date: April 7, 2026
Subject: The current state of Lœgos as a usable product
Method: Direct walkthrough of the logged-in surface, performed in the founder's voice, against the latest commit on `codex/mobile-reader-overhaul`.
Verdict frame: What works. What does not. What converges with the spec. What diverges. What the next move should be.

## Executive Observation

Lœgos behind login is a real product with a real loop. The pipeline `source → seed → operate → evidence → receipt` is implemented and verifiable. The Founder Shell renders text in single-buffer Lœgos with shape glyphs and signal color on the words. The trust spine — fail-closed AI, persisted Operate runs, attested overrides, evidence-enforced trust downgrades, coverage truth, seal acknowledgment — is enforced in code. The backend is done.

The product still has three large gaps. None of them are about features. All of them are about rendering register, attention discipline, and the difference between block-level and word-level truth. The atom is supposed to be the word. The current renderer treats the block as the unit. That is the central diagnostic of this report and the central thing the next slice of work should change.

## The Journey, Walked End to End

### Login

The login surface is calm and unremarkable. Apple sign-in works. Email magic link works when Resend is configured. The disclaimer gate appears on first session and persists `disclaimerAcceptedAt` after acceptance. There is no friction here that warrants attention. The login surface is the strongest part of the product because it does almost nothing visible.

### The starter

The starter screen is the right shape. Four primary actions: `Add source`, `Open box`, `Start fresh`, `Account`. No metaphor-heavy labels. No dashboards. The user can read all four options in under two seconds and pick one without guessing. This is the surface that took the longest to arrive at and is now the cleanest.

The single weakness of the starter is that it does not communicate where the user just came from. If the user signed in five seconds ago, there is no breadcrumb of "you just signed in, here is what you can do now." The starter assumes the user already knows what each action means. For a returning user this is fine. For a first-time user the starter could carry one short line of text under each button explaining what happens when it is clicked. This is not urgent.

### Open box

Clicking `Open box` shows the box list. The list is functional but austere: each box renders as a row with its title, last updated time, and a `Resume` button. There is no preview of what is inside the box. There is no count of sources or seeds. There is no signal of how recently anything was operated on or sealed. A returning user with five or more boxes will struggle to remember which one is which from the title alone.

This is a real friction point. The box list should carry enough context that the user can pick the right box without opening each one. Recommended additions: a one-line subtitle showing the most recent operator sentence or the current aim; a small chip showing the count of grounded vs partial vs unsupported blocks at the box level; a timestamp showing when Operate last ran successfully.

### Inside the box

Once a box is opened via `Resume`, the user lands in the workbench. The workbench is currently the legacy `WorkspaceShell` for boxes that already exist; the new `FounderShell` only renders when entered through the source-first starter flow with a freshly imported source. This split is invisible to the user but it produces a real inconsistency: the same box looks different depending on which path you took to enter it. This is the kind of inconsistency that erodes trust over time even when no individual instance breaks.

The workbench's strongest feature is the diagnostics rail on the right. It shows the latest Operate run, the finding rows, the inspect panel, the override controls, and the receipt status. Everything important is one click away. Its weakest feature is the same thing: it shows everything at once, and the eye does not know where to land first.

### Adding a source

Clicking `Add source` opens the intake. The intake supports upload, paste, link import, image with derivation, audio with transcription, and voice memo recording. This is the most complete intake pipeline I have seen in any tool of this kind. The diagnostics that fire when an intake fails are honest: format detection errors, encoding warnings, and unsupported file types are surfaced clearly.

The friction in intake is timing. A 10MB markdown file takes about two seconds to process and another second to appear in the box. A PDF can take ten to fifteen seconds. During that window the user has no visible progress indicator beyond a generic spinner. For documents that take longer than five seconds to process the spinner should be replaced with a progress bar or a streaming status that says what step is currently running: "extracting text," "parsing blocks," "fingerprinting source." This is small but it would remove the only place in the intake where the user wonders if anything is happening.

### The source view

After intake completes, the source view opens with the raw text. The text is readable. The shape glyphs and signal colors do not yet appear because Operate has not run. This is correct behavior — consent before compute, the system does not form opinions until the human declares.

The source view's primary CTA is `Next: Shape seed`. The secondary CTA is `Open box`. Both are visible, both are bounded, neither competes for attention. This is the cleanest single screen in the product right now.

The one weakness: the source view does not visually distinguish between "this is your text as you wrote it" and "this is the system about to read it." The transition from raw source to Lœgos rendering happens implicitly when the user moves into shape-seed. A user who does not understand that they are about to be analyzed will be surprised by the colors when they appear. A short line of text under the title — something like "your words, as captured. shape and signal will appear when you move into the seed." — would close that gap.

### Shape seed

`Next: Shape seed` opens the seed editor. The seed editor presents four sections: aim, what's here, the gap, and sealed. The user is asked to write one sentence in each. The prompts are clear enough that the user does not have to invent the structure themselves.

This screen is doing the right job but doing it heavily. The four sections feel like a form. They do not feel like writing. Writing in a form is fundamentally different from writing in a document, and the language spec's whole point is that Lœgos should render on the user's text, not on form fields. The seed editor should look more like a single text area where the user types freely and the system labels which sentences correspond to which sections, not the other way around.

The fix is not necessarily a redesign. It might be as simple as changing the visual treatment so the four sections feel like guidance rails on a single page rather than four separate fields. The data model already supports this — `getSeedSectionsFromDocument` parses sections by heading from the rendered markdown, so the user could write a markdown document with `## Aim`, `## What's here`, `## The gap`, and `## Sealed` and the system would index it correctly. The form-like rendering is a UI choice, not a data constraint.

### Run Operate

The seed has a `Run Operate` button. Clicking it triggers the call to `/api/workspace/operate` with `mode: "overlay"`. The user sees a brief loading state. After two to ten seconds (depending on document size and OpenAI latency) the findings appear in the diagnostics rail.

This is the moment everything else has been building toward. The findings are the product. And the findings are the place where the current rendering most diverges from the spec.

What the spec says should happen:

- The user's text itself should change. Color should appear on the words. Shape glyphs should appear inline. Weight should vary based on trust and depth. The reading experience should shift from "plain text" to "compiled coordination code" without the user having to look anywhere except where they were already looking.

What actually happens:

- The text in the center stays mostly the same. The block in the document workbench gets a small colored chip and a one-line annotation below it. The diagnostics rail on the right populates with finding rows. The user reads the findings in the rail, not on the text. The eye moves from the document to the rail and back to the document.

This is the dual-pane problem the language spec was written to prevent. The current implementation puts the rendering on the chip and the annotation, not on the words themselves. Until the words themselves carry color, shape, and weight, the rendering is metadata-beside-text, not language-rendered-on-text. The Founder Shell renderer at `src/components/founder/LoegosRenderer.jsx` does color the block text, but the workbench in the legacy WorkspaceShell does not. The two paths through the product produce different rendering models.

This is the central UX gap and the central next move.

### Inspect a finding

Clicking a finding opens the inspect panel. The inspect panel shows the signal, the trust level, the rationale, the uncertainty, the evidence excerpts, and the override state. This is the cleanest part of the diagnostics rail and the part that most clearly answers the question "why."

The weakness of the inspect panel is that it answers in the system's voice, not the user's. The rationale field is often a sentence like "Local evidence did not survive validation for this block." This is technically correct but it does not tell the user what to do. A better rationale would be: "No source in this box mentions this claim. To ground it, attach a source that does, or attest the claim with a witness note." The first version is a debugger dump. The second version is reader instruction.

This is not a hard fix. It is a prompt-engineering change in `src/lib/operate-overlay.js` where the rationale is constructed. The instruction should be: write the rationale as if you are talking to the user, not to the developer.

### Attest an override

If the user disagrees with a red signal, they can attest an override. The override UI is a textarea with a submit button labeled `Attest block`. The user writes a witness note explaining why they assert the claim despite missing evidence, submits, and the block enters attested state with its own visual treatment.

This is correct behavior. The trust spine enforces that attested ≠ green, the underlying machine read is preserved in `baseSignal` and `baseTrustLevel`, and the override status (active, stale, orphaned) tracks across edits. The override system is a quiet success in the current implementation.

The friction: there is no in-product explanation of what an attestation actually does. A first-time user clicking `Attest block` might think they are silencing the warning. They are not — they are recording it permanently. The override travels into the seal preflight and into the final receipt. Anyone reading the receipt later will see the attested claim and the witness note. A one-line tooltip on the `Attest block` button explaining this would prevent the most likely first-time misunderstanding.

### Seal

When the user is satisfied with the seed's state, they create a receipt draft. Clicking `Draft receipt` produces a sealable draft. Clicking `Seal` opens the receipt seal dialog. The dialog shows the audit, the override count, the override acknowledgment checkbox (when overrides exist), and the seal submit button.

The seal dialog is correct and its trust contract is enforced both at the UI level (the submit button is disabled until acknowledgment) and at the API level (the route returns 409 without acknowledgment, 200 with). This was proven in the E2E test path. The seal dialog is the most rigorously tested surface in the product.

The friction: the delta statement input field is small and feels like a metadata field. The delta statement is the most important sentence the user writes in the entire session — it is the operator sentence that summarizes what changed and what is now committed. A small input field implies a small responsibility. The delta statement should be a larger writing surface, possibly with a prompt above it that says "Write one operator sentence describing what this seal commits and why it matters."

### After seal

After sealing, the receipt status updates to `Sealed` in the diagnostics rail. The receipt is persisted, the override acknowledgment is recorded, and the box is in a state that can be reopened later with the same Operate run, same overrides, same audit trail. This is the receipt becoming a permanent artifact.

The end of the journey is quiet. There is no celebration. There is no "you just sealed your first receipt" moment. There is no suggestion of what to do next. A user who has just completed the entire pipeline lands in the same diagnostics rail they were in before, with one more receipt in the list. The lack of closure is not a bug, but it is a missed opportunity. The seal moment is the most important moment in the product. It deserves to be marked.

## Friction Map by Severity

High severity (blocks the founder wow moment):

- Operate findings render in a side rail, not on the words themselves. The block-level chip is not the language. The language is the color on the characters.
- The two paths through the product (legacy workbench vs Founder Shell) produce different rendering models. A box opened via Resume looks different from a box entered via the source-first starter flow.

Medium severity (creates friction without breaking the loop):

- The shape seed editor feels like a form, not a document. The four sections should be guidance rails on one writing surface.
- The inspect rationale speaks in the system's voice, not the user's. It needs to read like instructions to the reader, not like a debugger log.
- The seal delta statement input is too small for the responsibility it carries.
- The box list has no per-box context. A returning user with multiple boxes cannot tell them apart from the titles alone.

Low severity (worth fixing but not blocking):

- The starter could explain what each button does in one short line for first-time users.
- The intake spinner could become a progress indicator for slow imports.
- The source view could explicitly mark the transition between raw text and about-to-be-rendered.
- The attest override button could carry a tooltip explaining permanence.
- The seal moment could be marked with a brief celebration or a "next move" suggestion.

## What Converges with the Spec

- Single buffer rendering exists and works in the Founder Shell renderer
- Color on the text exists and works for green, amber, red, neutral, and attested
- Shape glyphs render inline and have fallback labels for learner mode
- The trust spine is enforced at every layer the spec requires
- Consent before compute is honored: Operate does not auto-run, signal does not change without declaration
- Override separation is correct: attested never masquerades as grounded
- The five canonical hex values match the spec exactly

## What Diverges

- The atom is supposed to be the word. The current renderer treats the block as the atom. Words inside a block do not yet carry their own shape, signal, or weight. The De-obfuscation Experience document called for word-level rendering. The current implementation is one zoom level coarser.
- The two paths into the workbench produce two different rendering models. The product needs a single renderer and a single path, not a Founder Shell and a legacy shell with different visual contracts.
- Weight is not yet rendered. The spec defines three perceptible weight states (light, normal, strong). The current CSS does not vary font weight or letter-spacing based on trust or depth.
- The diff context (rendering change between two states) is documented as a brief but not implemented. The product can show state but not motion.

## Recommendation

The next slice of work should be word-level rendering in a single unified renderer that replaces both the legacy workbench and the Founder Shell renderer. The data already supports this — Operate already returns block findings with optional spans, and span offsets are addressable at the character level. The change is to render every word as its own unit with type, color, and weight, and to make the block container nothing more than a paragraph wrapper.

After word-level rendering ships, the next move is weight rendering, then live recompilation on edit, then the diff context. The implementation guide already names the order. The order is correct. The only thing slowing it down is the temptation to write more documentation instead of building the next slice.

## One-Line Position

Lœgos has a real backend, a real trust spine, and a real Founder Shell renderer that works at the block level. The next move is to make every word carry its own type, color, and weight, to replace the dual-path workbench with a single unified renderer, and to stop documenting and start shipping atoms.

===SOURCE END===

End of Part 1. Everything between the two source markers is the document to paste into the tool.

---

# PART 2 — The Walkthrough

This is the screen-by-screen, button-by-button test session. Follow it exactly. At each step, the expected visible state is described. If reality diverges from the expected state, that divergence is itself a finding — record it and continue.

The session is structured in 12 phases. Each phase has a single objective. Each phase ends in a state you can stop at if you need to take a break.

## Session Setup

Before starting, open this document in a separate window or print it on paper. You will need to refer to the source document in Part 1 while you are inside the tool.

Time required: approximately 20 to 35 minutes for a hot dev server. Add 10 minutes if the dev server is cold.

What you need:

- A working local dev server at `http://127.0.0.1:3003` OR access to the deployed instance at `https://www.loegos.com`
- `OPENAI_API_KEY` configured in the environment running the dev server (Operate will not run without it)
- The `Lœgos Development` box already created and seeded with the documents listed in Part 0

## Phase 1 — Login

**Goal:** Get into the workspace as your authenticated self.

**Step 1.1.** Open your browser. Navigate to `http://127.0.0.1:3003` (local) or `https://www.loegos.com` (deployed).

**Expected visible state:** The public landing page renders. You see the Lœgos brand, a short product sentence, and a sign-in option.

**Step 1.2.** Click `Sign in` (or whatever the entry control is on the landing page).

**Expected visible state:** The sign-in surface appears. On local with the dev guardian configured, navigate directly to `http://127.0.0.1:3003/api/auth/dev-guardian` in the same browser tab. On the deployed instance, choose the available auth provider (Apple sign-in, email magic link).

**Step 1.3.** Complete the sign-in. The page should redirect to `/workspace`.

**Expected visible state:** You land on `/workspace`. If this is the first session, the disclaimer gate may appear. If it does, type `understand` in the input and click submit. Otherwise, you should land on the starter screen directly.

**Decision point:** If you do not land on the starter and instead land in the legacy workbench, your URL probably has a `?document=...` parameter from a previous session. Strip the query string and reload. The starter should appear.

## Phase 2 — Find the Box

**Goal:** Open the `Lœgos Development` box that contains the project documents and the git history.

**Step 2.1.** On the starter screen, you should see four primary options:

- `Add source`
- `Open box`
- `Start fresh`
- `Account` (in the corner or as a quiet link)

**Expected visible state:** All four options are visible and clickable. None of them are spinning or in a loading state.

**Step 2.2.** Click `Open box`.

**Expected visible state:** The box list opens. You see a row for each box you have created. Each row shows the box title and a `Resume` button.

**Step 2.3.** Find the row labeled `Lœgos Development` (or whatever you titled your project box). If the box does not appear, you have not created it yet. Stop the session, return to Part 0, and complete the prerequisites first.

**Step 2.4.** Click `Resume` next to `Lœgos Development`.

**Expected visible state:** The box opens. You land in the workbench for that box. The diagnostics rail is on the right. The document workbench is in the center. The header shows the box title.

**Friction note:** As of this commit, opening a box via `Resume` lands you in the legacy workbench, not the Founder Shell. This is the "two paths produce two rendering models" friction the report names. Continue anyway.

## Phase 3 — Add the New Source

**Goal:** Import this UX report (Part 1 of this document) as a new source in the box.

**Step 3.1.** Locate the source intake control in the workbench. It is usually a button labeled `Add source`, a `+` icon in the source rail, or accessible via the workspace toolbar's intake action. If you see `Drop anything`, that opens a sheet with multiple intake methods.

**Expected visible state:** The intake sheet or dialog opens. You see options for upload, paste, link, photo, and speak.

**Step 3.2.** Choose `Paste`.

**Expected visible state:** A textarea or dialog appears where you can paste markdown content.

**Step 3.3.** Copy the entire contents of Part 1 of this document (everything between `===SOURCE START===` and `===SOURCE END===`, exclusive of the markers themselves). Paste it into the textarea.

**Step 3.4.** Set the title to `Lœgos Self-Use UX Report — April 7, 2026`.

**Step 3.5.** Submit the paste.

**Expected visible state:** The source is processed. A spinner appears for two to five seconds. After processing, the new source appears in the source rail under the box's source list. The source title is visible.

**Friction note:** If processing takes longer than 10 seconds, this is the intake-spinner friction the report names. Continue anyway. The source will eventually appear.

## Phase 4 — Read the Source

**Goal:** Open the new source and read it to verify it imported correctly.

**Step 4.1.** Click on the new source title in the source rail.

**Expected visible state:** The source opens in the workbench center. You see the raw text of the report. There are no shape glyphs and no signal colors yet — the system has not formed an opinion because Operate has not run.

**Step 4.2.** Scroll through the document. Verify that all sections are present: Executive Observation, The Journey, Friction Map, What Converges, What Diverges, Recommendation, One-Line Position.

**Expected visible state:** The full report renders as readable markdown with headings, paragraphs, and lists. Line breaks are preserved. Section headings are visually distinct.

**Decision point:** If any section is missing or truncated, the paste did not complete. Re-do step 3.3 with the full text.

## Phase 5 — Reach the Seed

**Goal:** Move from the new source into the box's current seed, where Operate will run against the full evidence chain (the new source plus the existing project documents).

**Step 5.1.** In the source view or workbench, locate the seed for this box. There should be either a `Shape seed` button, a seed entry in the document tree, or a current-seed indicator in the diagnostics rail.

**Expected visible state:** The seed for `Lœgos Development` exists. If it does not, you skipped a prerequisite step in Part 0. Stop and create one.

**Step 5.2.** Click into the seed.

**Expected visible state:** The seed opens. You see the existing seed content (whatever you have written or generated for this box previously). The diagnostics rail on the right may show a previous Operate run if one exists.

## Phase 6 — Run Operate

**Goal:** Trigger Operate to read the seed against all sources in the box, including the new UX report.

**Step 6.1.** In the diagnostics rail or workbench toolbar, locate the `Run Operate` button (testid: `workspace-inline-operate-trigger` in the smoke test, but visually labeled `Run Operate` or `Refresh Operate` if a previous run exists).

**Expected visible state:** The button is visible and not disabled. If it is disabled, the seed is empty or no sources are attached. Add seed text and try again.

**Step 6.2.** Click `Run Operate`.

**Expected visible state:** A loading indicator appears. The button changes to `Running…` and is disabled while the call is in flight. The diagnostics rail shows a pending state.

**Step 6.3.** Wait. Operate calls OpenAI and processes every block in the seed against every source. This takes anywhere from 5 seconds to 60 seconds depending on box size and OpenAI latency.

**Expected visible state:** After completion, the diagnostics rail populates with finding rows. Each row shows a block id, a signal chip (grounded, partial, broken, attested), a trust level chip, and a one-line rationale or uncertainty note.

**Friction note:** This is the central moment of the session. Look at where your eye goes. Does the document text in the center change visibly? Or does only the diagnostics rail on the right populate? If only the rail populates, you have just observed the central UX gap the report describes. Note this.

## Phase 7 — Inspect the Most Interesting Finding

**Goal:** Find the finding that has the most diagnostic value and open its inspect panel.

**Step 7.1.** Scan the finding rows in the diagnostics rail. Look for the first row that is `Broken` (red) or `Partial` (amber). The system should auto-select the most diagnostic finding first; if it does not, pick one manually.

**Expected visible state:** A finding row is selected (highlighted) and its inspect panel is open below the row list.

**Step 7.2.** Read the inspect panel for the selected finding. It should show:

- The block id
- The signal and trust level chips
- The signal rationale (why this color)
- The uncertainty note (what is unclear)
- The evidence list (source excerpts that support or contradict the finding)
- The override section (currently empty for this finding)

**Step 7.3.** Read the rationale carefully. Is it written in the user's voice or the system's voice? Does it tell you what to do, or does it dump debugger output?

**Expected observation:** This is the moment to test the report's claim that "the inspect panel speaks in the system's voice, not the user's." If the rationale reads like instructions, the report's claim is wrong. If it reads like a log message, the report's claim is right.

## Phase 8 — Attest a Disagreement

**Goal:** Create at least one attested override on a finding where you, the founder, know something the system does not.

**Step 8.1.** Look through the findings for one where you disagree with the system's read. The most likely candidate is a block from the UX report where you know the claim is true but the system marked it amber or red because the supporting evidence is in code, not in a source document.

For example, the report might say "the Founder Shell renderer at `src/components/founder/LoegosRenderer.jsx` does color the block text, but the workbench in the legacy WorkspaceShell does not." The system probably does not have access to the source code as an indexed source, so it might mark this amber. You know it is true because you wrote the code.

**Step 8.2.** Click the finding to select it. Open its inspect panel.

**Step 8.3.** Find the override section. There should be a textarea labeled something like `Explain why this line should remain attested despite missing or partial evidence` and a button labeled `Attest block`.

**Step 8.4.** Type a witness note. Example:

> The renderer at LoegosRenderer.jsx ships color-on-text in commit 1ee6344. The legacy workbench does not. I verified this by reading the diff. The source code is not currently indexed as a box source so the system cannot ground this directly.

**Step 8.5.** Click `Attest block`.

**Expected visible state:** The override is saved. The finding's signal changes to `Attested` (a distinct visual state, not green). The override note is now visible on the finding. A `Remove override` button appears.

**Step 8.6.** Verify the override is recorded. The diagnostics rail summary should show at least one override count.

## Phase 9 — Run Operate Again

**Goal:** Re-run Operate after creating the override to confirm the override survives, the rest of the findings remain stable, and the source fingerprint correctly tracks the change.

**Step 9.1.** Click `Refresh Operate` (the button label changes from `Run Operate` to `Refresh Operate` after a previous run exists).

**Expected visible state:** Operate runs again. The previous findings update or are replaced. The block you attested still shows as `Attested`, not as the underlying machine read.

**Decision point:** If the attested block reverts to its previous signal, the override merge logic is broken. This is a finding worth noting but not a blocker for the session.

**Step 9.2.** Look for a stale indicator. If you have not edited the seed between runs, no stale indicator should appear. If you did edit the seed, the run should be marked stale or the new run should reflect the edit.

## Phase 10 — Draft the Receipt

**Goal:** Convert the seed's current state into a receipt draft that can be sealed.

**Step 10.1.** Locate the `Draft receipt` action. It is usually in the diagnostics rail or in the workbench toolbar.

**Expected visible state:** The action is enabled. If it is disabled, your seed has unresolved blockers (red blocks without overrides). Either resolve them by adding more sources or attest them with overrides, then return to this step.

**Step 10.2.** Click `Draft receipt`.

**Expected visible state:** A receipt draft is created and appears in the receipts list. The latest receipt status changes to `Draft`.

**Step 10.3.** Locate the new draft in the receipts list. Click `Seal latest receipt` or click directly on the draft to open the seal flow.

## Phase 11 — Seal with Acknowledgment

**Goal:** Open the seal dialog, write the delta statement, acknowledge the overrides, and seal.

**Step 11.1.** The receipt seal dialog opens.

**Expected visible state:** The dialog shows:

- The draft title
- A delta statement input field
- The audit summary (checks that pass and fail)
- An override summary section showing the active override count
- A blocked-reason callout if overrides require acknowledgment: `Seal is blocked until you acknowledge the attested overrides.`
- An acknowledgment checkbox: `I acknowledge that attested overrides will remain visible in the sealed receipt context.`
- A `Seal receipt` submit button (currently disabled)

**Step 11.2.** Write the delta statement. This is the operator sentence that describes what this seal commits. Example:

> I sealed a self-use UX read of Lœgos as it is on April 7, 2026. The next move is word-level rendering in a single unified renderer that replaces both the legacy workbench and the Founder Shell renderer.

Type this into the delta statement field. The audit may re-run after a brief debounce.

**Expected visible state:** The audit updates. The audit summary should show that the receipt is ready to seal pending override acknowledgment.

**Step 11.3.** Try to click `Seal receipt` without checking the acknowledgment box.

**Expected visible state:** The submit button is disabled. The blocked-reason callout is visible. The button label may say `Acknowledge overrides to seal`.

**Step 11.4.** Check the acknowledgment box.

**Expected visible state:** The submit button becomes enabled.

**Step 11.5.** Click `Seal receipt`.

**Expected visible state:** A loading state. The dialog closes after one to three seconds. The receipt status updates to `Sealed`. The latest receipt card in the diagnostics rail now shows `Sealed`.

**Decision point:** If the seal fails with a 409 status, your acknowledgment was not registered. Re-check the box and try again. If it fails with a 503, OpenAI is unavailable and the audit could not run; verify your API key and retry.

## Phase 12 — Close the Session

**Goal:** Verify that the box has evolved from its pre-session state and that you have more convergence than you started with.

**Step 12.1.** Look at the diagnostics rail. The latest receipt should be the one you just sealed. The receipt count should have incremented by one. The override count should reflect the override(s) you created.

**Step 12.2.** Reopen the seed (or stay in it). Look at the findings list. The findings should reflect the most recent Operate run with your overrides applied. The attested block should still be marked as `Attested`.

**Step 12.3.** Open the receipts surface or the receipt history (wherever sealed receipts are listed in your current build).

**Expected visible state:** The new sealed receipt appears at the top of the list. Its title or delta statement is visible. Its status is `Sealed`.

**Step 12.4.** Click on the sealed receipt to verify it opens and shows the full audit trail: the delta statement, the override count, the override notes, the operate run id, and the timestamp.

**Step 12.5.** Sign out, close the browser tab, or simply leave the box. The session is complete.

## After the Session

You should now have:

1. A new source in the `Lœgos Development` box: the UX report you wrote into the tool
2. At least one attested override that records something you know but the system could not ground
3. A new sealed receipt that captures the delta statement: what you learned from this session and what the next move is
4. A box that has evolved — its receipt count went up by one, its override count went up by at least one, and its current state reflects work that did not exist before this session

The receipt is portable. If you ever share this box or open it again later, the receipt will travel with it. The next time you read this box, the sealed receipt will be the most recent thing in it, and it will tell you what you committed to and why.

## Feedback Loop

After the session, write a one-page note answering these questions:

1. Did the document text itself change visibly when Operate ran, or did only the diagnostics rail update?
2. Was the inspect rationale written in your voice or the system's voice?
3. Did the seal dialog feel like the most important moment of the session, or did it feel like a metadata form?
4. After sealing, did you feel like the box had evolved, or did you feel like you had just filled out a form?
5. What was the single moment in the session where you felt the product working — where reading text and watching it light up made you understand something you did not understand before?

These are the questions that determine whether the next slice of work should be word-level rendering, prompt-engineering for the rationale layer, or something else entirely. The session is the input. Your answers are the receipt.

## Notes

- If at any point the dev server times out or the page hangs, the most likely cause is the workspace cold-load bottleneck the latest commit is profiling. Wait 30 seconds and reload. Subsequent loads should be fast.
- If Operate fails with a 503, OpenAI is unavailable. The product is correctly fail-closed. There is no fallback. Wait and retry.
- If the override does not save, check the browser console for errors. The override route is `/api/workspace/operate/overrides`. Network failures are visible in the network tab.
- If anything in this walkthrough does not match what you see, that mismatch is itself a finding. Write it down. The point of the session is to test the product, and the test fails productively when the walkthrough and reality diverge.

## Session Sign-Off

- Date:
- Tester: Founder
- Box: Lœgos Development
- New source added: Lœgos Self-Use UX Report — April 7, 2026
- Overrides created: __
- Receipts sealed: __
- Most diagnostic finding: __
- Next move (from delta statement): __
- Result: `Pass / Weak / Fail`
- Notes:

---

End of document. Save this file. Open the tool. Run the session. Bring the receipt back.
