# Loegos User Flows

**Status:** Canonical user flow spec

---

## Summary

These flows define how the product should work as a Box-based system with `Think → Create → Operate` as the live loop.

Inside the Room, the critical product loop is:

`Talk → Working Echo → Move → Return`

The important design rule is that the user should not only read Seven's chat reply. They should also be able to see the visible working echo outside the transcript and answer against it.

Each flow describes:

- entry conditions
- user actions
- system responses
- resulting state
- success criteria

## 1. Open Or Create A Box

### Entry conditions

- user is authenticated
- user lands on the `Boxes` index

### User actions

- open the current Box
- open another Box
- or create a new Box

### System responses

- selected Box opens into Box home
- new Box is created and opened
- default title is `Untitled Box` until the user renames it

### Success state

- the user is inside a Box and can begin the loop

## 2. Orient From Box Home

### Entry conditions

- a Box is open

### User actions

- read Box home
- choose the strongest next move
- jump to current position, receipts, or a source

### System responses

- Box home shows next move, current position, proof state, and source inventory
- the user can move into Think, Create, Operate, or Receipts without confusion

### Success state

- the user understands where the box stands and what to do next

## 3. Manage Boxes

### Entry conditions

- user is on the Boxes index or inside Box home

### User actions

- create a Box
- rename a Box
- delete a non-default Box

### System responses

- create and rename happen in-product
- deleting a non-default Box moves its sources, assemblies, and receipt drafts into the default Box
- deleting a Box never hard-deletes the work inside it

### Success state

- box management feels intentional and safe

## 4. Add A Source To A Box

### Entry conditions

- a Box is open

### User actions

- upload a supported document
- paste text
- import a link
- capture a voice memo
- in future phases: add image or human-state sources

### System responses

- the source is normalized
- provenance is preserved
- the source appears in the Box as a source item

### Success state

- the Box contains a new readable source

## 5. Open A Source And Listen

### Entry conditions

- the Box contains at least one source

### User actions

- open a source
- switch into listen mode
- move through blocks

### System responses

- source opens in the reader surface
- listening controls stay available
- block focus and selection remain usable during playback

### Success state

- the user has engaged the source materially rather than only skimming it

## 6. Ask Seven About The Active Source

### Entry conditions

- an active source or Assembly is open

### User actions

- open Seven
- ask a question

### System responses

- Seven uses document-scoped context
- replies render as conversation
- useful replies can be staged explicitly

### Success state

- the user receives useful interpretation or audit help without leaving the Box context

## 7. See The Working Echo And Answer Against It

### Entry conditions

- the user has asked Seven something meaningful
- the system has enough signal to surface a provisional read

### User actions

- read Seven's answer
- inspect the visible working echo outside the transcript
- notice what seems real, what conflicts, and what would decide it
- answer back against that surfaced read

### System responses

- the working echo is visible and clearly marked as non-canonical
- the working echo only wakes up when enough grounded signal exists to surface a useful read
- the user can tell what is forming without mistaking it for accepted box truth
- the next reply can sharpen, correct, challenge, or extend the echo

### Success state

- the next turn becomes more specific, better grounded, or more honest because the user can see:
  - what seems real
  - what conflicts
  - what would decide it

## 8. Move Material Into Staging

### Entry conditions

- a source or Seven reply contains material worth keeping

### User actions

- select blocks from the source
- add Seven output to staging
- reorder or remove staged material

### System responses

- staging updates visibly
- source lineage is preserved

### Success state

- the Box now has an intermediate construction memory

## 9. Assemble A Working Artifact

### Entry conditions

- staging contains material

### User actions

- run assemble
- open the new or active Assembly
- edit and refine it

### System responses

- the Assembly document is created or updated
- it becomes the active built artifact in the Box

### Success state

- the user has shaped a working artifact, not just collected notes

## 10. Run Operate On The Box

### Entry conditions

- the Box has at least one real source or an Assembly

### User actions

- trigger Operate

### System responses

- Operate reads the Box across included sources and current Assembly
- result shows:
  - `Aim`
  - `Ground`
  - `Bridge`
  - `Gradient`
  - trust floor and ceiling
  - convergence state
  - next move

### Success state

- the user sees an honest diagnosis of the Box’s current position

## 11. Ask Seven To Audit The Operate Result

### Entry conditions

- an Operate result exists

### User actions

- choose `Ask Seven to audit`

### System responses

- Seven opens against the current Assembly if one exists, otherwise the active document
- Seven receives Operate context and helps explain, challenge, or upgrade the read

### Success state

- the user can move from diagnosis into interpretation and improvement

## 12. Draft A Local Receipt

### Entry conditions

- active document, Assembly, or Operate result exists

### User actions

- draft a receipt

### System responses

- local receipt draft is created
- receipt preserves lineage and metadata
- GetReceipts sync is attempted only if configured

### Success state

- proof exists locally even if remote sync fails

## 13. Review Proof And Connect GetReceipts

### Entry conditions

- Receipts surface is open

### User actions

- review latest proof
- inspect local-vs-remote status
- optionally connect GetReceipts

### System responses

- proof state remains legible in the workspace
- local drafts remain first-class
- the user can connect GetReceipts from the receipt moment without leaving the product model

### Success state

- the user understands current proof state and remote proof remains optional

## 13. Return To The Box Later

### Entry conditions

- user reopens the product later

### User actions

- open the Boxes index
- choose a Box

### System responses

- Box home shows next move, current position, receipts, and source state
- user can quickly resume thinking, creating, operating, or reviewing proof

### Success state

- the product supports return, not just one-session throughput

## North-Star Flows

These flows should be fully specified now even if runtime support lands later.

### Image-first Box

- user starts with visual references only
- visual sources are normalized into signal-bearing source records
- Operate can still read the Box honestly

### Voice-first Box

- user starts with voice memos only
- transcripts preserve voice provenance
- Box can move into Assembly without text-first assumptions

### Mixed multimodal Box

- text, voice, image, and links coexist
- Operate reads across modalities without flattening provenance

### Multi-human Box

- more than one person contributes sources
- authorship and importer identity remain visible
- Box can still be read with explicit attribution
