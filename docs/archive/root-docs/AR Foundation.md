# Loegos Foundation

**Status:** Current product foundation document  
**Date:** April 2026

**Companion documents:**
- `README.md` — current product source of truth
- `docs/AR Version 1.0.md` — shipped release posture
- `docs/current-state-audit.md` — repo-grounded truth of what is live now
- `docs/loegos-product-spec.md` — canonical end-to-end product model
- `docs/box-migration-plan.md` — canonical Box model and migration policy
- `docs/think-create-operate-spec.md` — canonical workflow framing
- `docs/source-model-spec.md` — canonical source and provenance model
- `docs/information-architecture.md` — canonical product IA
- `docs/user-flows.md` — canonical end-to-end behavior
- `docs/seven-operate-receipt-contract.md` — engine and proof boundary contract
- `docs/component-architecture-plan.md` — canonical extraction path from the current shell
- `docs/AR Version 2.md` — next-stage direction
- `docs/AR UI Style Lock.md` — current visual system

This document is conceptual truth. For implementation truth, use the canonical docs above before older review or vision materials.

---

## 1. The Bet

Complex human outcomes are assembled from parts.

A trip that works, a meeting that lands, a proposal that survives contact with reality, a decision that holds, a receipt that seals: none of these appear fully formed. They are built from source material, shaped through selection, tested by reality, and remembered through proof.

Loegos exists to make that construction legible.

The product is not trying to be a generic editor, a note app, or a chat window. It is trying to be a workbench for turning scattered material into a usable assembly and then preserving what actually happened.

That is why the product is built around:

- sources
- staging
- assembly
- receipts
- return

The output is not just a document. The output is a documented path from source material to an assembled result.

## 2. What The Product Is Today

Loegos `1.0` is an invite-only, desktop-first workbench for solo operators.

Its reliable loop is:

`import source → listen / ask Seven → stage blocks → assemble → operate → draft receipt`

The live product is organized around Boxes.

Each Box contains:

- sources
- one active assembly
- receipts
- a Seven surface tied to what the user is reading
- an Operate action that can read the box as it stands

This is the current truth of the product. Anything that contradicts it is historical.

## 3. The Box Model

### Box

The Box is the native top-level object.

It replaces the generic project idea in user-facing language because the user is not opening an abstract project. They are opening the actual container that holds the material, the active build, and the proof layer for one piece of real work.

### Sources

Sources are what enter the box.

They may begin as:

- PDF
- DOCX
- Markdown / TXT
- paste
- link import
- voice memo capture

The product's job is to normalize each of these into blocks that can be listened to, selected, staged, assembled, and receipted.

### Assembly

Assembly is the active built artifact in the box.

It is the thing being shaped from sources and selected blocks. The active built artifact is always called `Assembly` in the live product. The older phrase `Current assembly` is retired from the user-facing shell.

### Receipts

Receipts are the proof layer.

They preserve the construction pathway: what came in, what was selected, what was assembled, and what was captured afterward. In `1.0`, local receipt drafts are first-class even when GetReceipts is not connected.

### Seven

Seven is the contextual conversation layer.

Today, Seven is primarily tied to the active document:

- ask about what you are reading
- keep the thread tied to that document
- move useful replies into staging

Over time, Seven can become the box-reading intelligence layer. But that deeper role only matters when the box has enough material to support a real read.

### Operate

Operate is the box-read engine.

Operate is not chat, not summary, and not rewrite. It reads the active box across its non-built-in sources plus the current assembly, then returns the smallest honest structure that still carries what is in the box:

- `Aim`
- `Ground`
- `Bridge`
- `Gradient`
- trust `Floor` and `Ceiling` in `L1–L3`
- one convergence state
- one next move

In `1.0`, Operate is `diagnosis + draft`, not an automatic seal. It can draft a local-first receipt and optionally sync it to GetReceipts, but remote sync failure must never block the local draft.

## 4. Why Listening Matters

Listening is not decoration.

Loegos is different because it lets a user hear the material block by block while staying inside the same construction environment where they can select, stage, and assemble. This creates a stronger form of engagement than skim-reading a wall of text or pasting everything into an AI prompt.

Listening does three things:

1. slows the user down enough to actually touch the material
2. makes selection events meaningful
3. turns the source into something the user can carry while moving through real life

If listening becomes weak, the whole product collapses toward a generic editor.

## 5. Why Staging Exists

Staging is the intermediate memory of the box.

The user is not forced to jump directly from source to final output. They can gather fragments, AI replies, and copied material into a visible middle state. That is a real product invention, not a convenience feature.

The model is:

- Seven talks
- Staging collects
- Edit rewrites
- Operate reads the box

Those three verbs are the core mental model of the workbench.

## 6. What Seven Is And Is Not

Seven is not a hidden block generator and not a generic chatbot.

Seven is:

- a conversation tied to the active document
- a way to ask focused questions about what is in front of you
- a source of useful material that can be sent into staging

Seven is not yet:

- the primary navigation model
- the full `△ □ ○ × 1–7` coordinate system
- a free-floating chat detached from box context

The deeper coordinate system is analysis for reading what is in the box. It is not the first-run language of the app.

Operate is what turns that future analysis model into a concrete product action without making the coordinate system itself the app's navigation model.

## 7. Relationship To The Wider Lakin AI System

### Loegos

Loegos is the workbench, language system, and box model.

### Lakin

Lakin is the intelligence layer that reads the box.

### GetReceipts

GetReceipts is the remote proof layer.

It is optional in `1.0`, but strategically important because it lets local construction history become portable, external proof.

### PromiseMe

PromiseMe is another Lakin AI product that can eventually operate alongside the Box model as a commitment layer. It is not required for the current Loegos workbench loop.

## 8. What The Product Is Not

- Not a generic document editor.
- Not a note-taking app.
- Not a generic AI chat product.
- Not project management software.
- Not a library-first reader.

Documents are the medium. The box is the container. The assembly is the active artifact. The receipt is the proof.

## 9. Development Principles

1. Preserve lineage always.
2. Keep the user in control of selection.
3. Favor receipts over decorative output.
4. Keep the workbench calmer as it becomes more powerful.
5. Let the live product stay simpler than the doctrine behind it.
6. Use Box as the native top-level object in the UI.
7. Treat `△ □ ○ × 1–7` as analysis, not navigation.
8. Design for return from reality, not endless in-app activity.

## 10. What Success Looks Like

The product succeeds when a user can:

1. open a box
2. bring in source material
3. listen and ask Seven about it
4. stage what matters
5. shape an assembly
6. run Operate to read the box honestly
7. draft a receipt
8. return later with a clearer sense of what happened

The long-term goal is not just better documents. It is better construction memory.

That is the foundation the current product sits on.
