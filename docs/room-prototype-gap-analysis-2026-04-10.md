# Room Prototype Gap Analysis

Date: 2026-04-10

This note compares the prototype Room in `v1.1/files/loegos-v2-room.jsx` against the current canonical Room implementation in `src/components/room/RoomWorkspace.jsx`, plus the supporting Room turn/apply flow.

## Core verdict

The new Room code is much more correct about truth boundaries, but it still feels like a chat app with a proposal inspector attached, not yet like the Room itself waking up through conversation.

Architecturally, the correction is real:

- the Room is backed by a hidden canonical assembly document
- Seven proposes
- the gate decides
- apply mutates
- the UI renders compiler/runtime truth

Experientially, though, the prototype and the shipped UI still differ in where structure lives in the user's attention.

## Frame 1: Empty Room

In the prototype, the empty state is almost pure silence: centered welcome, bottom composer, and little else competing for attention.

In the current implementation, the empty state is close, but not as strict. The header, box title, `Boxes`, `Add Source`, and starter actions like `Create Box` and `Open Box` are still present.

Mismatch:

- prototype begins with conversation as the only invitation
- current Room begins with conversation plus workspace management

## Frame 2: First assistant turn

In the prototype, Seven's reply is already structurally alive. Message segments are tappable. Each sentence is tagged by domain. Tapping a sentence reveals the formal line inline and highlights the corresponding mirror region.

In the current implementation, the assistant speaks in plain paragraphs first, and the structure is tucked behind `Inspect proposal`.

Mismatch:

- prototype lets structure emerge inside the language itself
- current Room hides structure behind a separate inspection action

## Frame 3: First structure appears

In the prototype, the mirror starts appearing immediately after the first meaningful turn because Seven updates the box state directly inside the send loop.

In the current implementation, that does not happen until the user explicitly applies the proposal. The turn route stores conversation and preview but does not mutate canonical state. The apply route is the only mutation path.

Architecturally this is right. Rhythmically it changes the feel.

Mismatch:

- prototype feels like the Room is listening and taking shape in real time
- current Room makes the user stop and approve before the Room visibly wakes up

## Frame 4: Mirror behavior

In the prototype, the mirror is a compact strip at the top of the same room, progressively unfolding from the conversation.

In the current implementation, the mirror is a separate right-hand aside that appears only once `hasStructure` is true.

Mismatch:

- prototype mirror is one shared breathing surface
- current mirror is a sidebar readout

## Frame 5: State feeling

The prototype's state chip feels ambient and immediate. Once the box has content, the chip appears and the `awaiting` state breathes visually.

The current implementation computes state more lawfully from compile/runtime truth. That part is correct. But visually it is calmer and more static, and it only appears after canonical structure exists.

Mismatch:

- current state is more correct
- prototype state is more felt

## Frame 6: Return and receipt

This is one area where the new code is directionally right. Receipt Kits are inline under the assistant turn, not hidden in another tool. Completing them writes lawful clauses and local-first receipt drafts.

But the UI treatment is still form-heavy: dropdowns, buttons, and fields. It feels like a tool card, not yet like the Room naturally catching a return.

## What is correct in the current implementation

- hidden canonical Room document
- view rendered from compile/runtime truth
- Seven proposes and apply mutates
- mirror only appears after real structure exists

## What is still wrong in experience terms

- too much shell and chrome too early
- structure is inspected as an object instead of surfacing through the reply
- mirror is a side panel instead of a shared room surface
- proposal/apply is correct, but too visibly procedural
- receipts feel like forms, not like returns landing in the field
- the chat still feels slightly like it is operating the system, instead of being the system

## Plain statement

I fixed the truth boundary, but I have not yet fully fixed the phenomenology.

The prototype says:

`talk, and the room reveals itself`

The current implementation still says:

`talk, then inspect, then apply, then the room updates`
