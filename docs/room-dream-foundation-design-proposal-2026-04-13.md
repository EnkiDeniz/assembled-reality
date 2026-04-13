# Room + Dream Foundation Design Proposal

Date: April 13, 2026  
Status: Design proposal  
Purpose: Define the MVP runtime design direction for the rebuild beneath the constitutional layer and above implementation details, so design and engineering can build the same product shape without drifting beyond the current center.

Primary references:

- [projection-contact-loop-constitution-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/projection-contact-loop-constitution-2026-04-13.md)
- [team-realignment-memo-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/team-realignment-memo-room-dream-mvp-2026-04-13.md)
- [design-reference-stack-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/design-reference-stack-room-dream-mvp-2026-04-13.md)
- [compiler-engineer-response-room-dream-mvp-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/compiler-engineer-response-room-dream-mvp-2026-04-13.md)
- [minimal-runtime-foundation-proposal-2026-04-13.md](/Users/denizsengun/Projects/AR/docs/minimal-runtime-foundation-proposal-2026-04-13.md)
- [loegos-design-system-v6.jsx](/Users/denizsengun/Projects/AR/loegos-design-system-v6.jsx)
- [working-echo-and-911-north-star-2026-04-11.md](/Users/denizsengun/Projects/AR/docs/working-echo-and-911-north-star-2026-04-11.md)

---

## 1. Summary

The signed-in product should be rebuilt as one instrument with:

- one live working surface: `Room`
- one source re-entry surface: `Dream`
- one first-class seam between them: `Bridge`
- one live structural object inside Room: `workingEcho`
- one pressure instrument inside Dream: `Compiler Read`

Everything else should be treated as deferred, contextual, or utility.

This proposal is not trying to design every future feature.
It is trying to define the smallest visual and interaction foundation that can hold the MVP honestly now and scale later without fragmenting.

The discipline for this document is simple:

- design the current center
- do not design the whole imagined system

---

## 2. The Product Shape

The constitutional layer says:

> the human proposes, the machine structures, reality returns, and receipts decide what can travel

This design proposal turns that into a usable runtime silhouette.

The silhouette is:

- `Room` for live steering
- `Dream` for source contact
- `Bridge` for carryover
- `workingEcho` for visible steering structure
- `Receipt` for quiet portability law

This is not:

- a dashboard
- a panel system
- a tools gallery
- a document storage app with chat attached
- a chat app with analysis cards attached

It is one loop rendered through two durable surfaces.

---

## 3. Design Thesis

### 3.1 Room

Room is where proposal meets limit.
It should feel like live work, not system management.

### 3.2 Dream

Dream is where source is re-entered under attention.
It should feel like immersion, not storage.

### 3.3 Bridge

Bridge is how something found in Dream becomes actionable in Room without losing provenance or continuity.

### 3.4 workingEcho

`workingEcho` is the visible steering object that keeps Room from collapsing back into chat.

### 3.5 Receipt

Receipt is the quiet law that determines what carries forward with trust.
It should remain load-bearing even when visually subtle.

---

## 4. Permanent Runtime IA

Only two permanent runtime surfaces should exist in the MVP rebuild:

- `Room`
- `Dream`

The signed-in shell should therefore be:

```text
Top bar
├── mode switch: Room | Dream
└── utility trigger

Active surface
├── Room
│   ├── thread
│   ├── workingEcho
│   ├── composer
│   └── contextual source entry
└── Dream
    ├── library shelf or sheet
    ├── active document stage
    ├── listening controls
    └── Compiler Read
```

Utility remains separate:

- account
- settings
- sign out

No additional top-level product destinations should be introduced in this rebuild.

This proposal should be read with one hard reminder:

**the shell is not the product center.**
The shell exists to make `Room`, `Dream`, and their handoff feel reliable and calm.

---

## 5. Interaction Model

### 5.1 Entry

The signed-in user should open directly into `Room`.

The first thing they should perceive is:

- active thread identity
- current thread
- current live structural state
- place to speak

They should not have to first interpret a set of sections, modes, or control panels.

### 5.2 Room to Dream

The user moves to Dream explicitly through a visible binary switch in the top bar.

This must be:

- always visible
- simple
- not buried in overflow
- not represented as one choice among many equal destinations

### 5.3 Dream to Room

The user must be able to carry something from Dream back into Room intentionally:

- a passage
- a note
- a witness

That handoff must preserve:

- origin
- anchor
- provenance
- continuity of the active document

### 5.4 Leave and Return

The app must be easy to leave.
Reality contact is part of the loop.

The app must also be easy to re-enter:

- Dream restores document and playback state
- Room restores thread and workingEcho state
- the user should feel resumed, not re-onboarded

---

## 6. Room Design

### 6.1 What Room Must Contain

- top bar
- active thread identity
- thread
- workingEcho
- composer
- one source entry affordance
- visible field state

### 6.2 What Room Must Not Become

- a dashboard of system nouns
- a permanent box/session management area
- a place where witness, operate, mirror, and receipts each demand their own visible region
- a place where the user must understand ontology before speaking

### 6.3 Thread

The thread is the forward motion of the live loop.
It should feel calm, legible, and sparse.

Design rules:

- one visual hierarchy for user messages
- one visual hierarchy for assistant messages
- no extra framing that competes with content
- inline actions only when they matter
- no duplicate transport metaphors in the composer

### 6.4 workingEcho

`workingEcho` is not optional panel furniture.
It is the visible steering object of Room.
For this MVP, it should be **thin but real**.

It should surface only the strongest useful structure:

- what seems real
- what conflicts
- what would decide it
- how return bent the read
- the cautious next move if one exists
- current field state

The minimum honest field-state language for the MVP is:

- `open`
- `contested`
- `awaiting return`

It should feel:

- external to the transcript
- lighter than a dashboard
- stronger than decorative summary

It should not feel:

- like a second assistant answer
- like another scrollable workspace
- like a giant box-status panel

### 6.5 Composer

The composer should be reduced to:

- text entry
- source entry
- send

Optional controls should remain subordinate.

The placeholder and tone should encourage honest unfinished entry, not theatrical prompting.

### 6.6 Source Entry

Source entry in Room should mean:

- bring material into the live conversation
- not “enter witness ontology”
- not “open a file workflow”
- not “navigate to a source management product”

If deeper source management is needed, use a temporary sheet.

---

## 7. Dream Design

### 7.1 What Dream Must Be

Dream is the source re-entry surface.
It should be strong enough to stand as a reason to use the product on its own.

### 7.2 What Dream Must Contain

- top bar shared with Room
- document library access
- active document stage
- Compiler Read action
- Send to Room
- listening controls

### 7.3 What Dream Must Not Become

- a generic library manager
- a settings page
- a panel of buttons around a document
- a second Room with diagnostics pasted into it

### 7.4 Library

The library should be quiet.

Desktop:

- a narrow shelf or rail
- enough metadata to scan
- not a dominant control column

Mobile:

- a sheet, drawer, or compact toggle
- easy to open and dismiss
- never dominating the document stage

### 7.5 Document Stage

The active document must dominate Dream.

Design rules:

- text stays primary
- title and minimal identity stay visible
- the reading surface feels spacious
- playback state feels integrated, not bolted on

The MVP sequencing rule matters here:

**Dream must first be solid as a document-contact and Compiler Read surface.**

That means the document stage and the document-pressure loop take priority over richer library furniture or more expressive playback chrome.

### 7.6 Listening

Listening is central, not ornamental.
But for this MVP it should not outrank the document-pressure loop.

When playing:

- document text remains visible
- one play/pause control is clearly primary
- progress is visible
- rewind/forward are present but subordinate
- secondary controls recede

The interface should feel like:

- reading with voice

It should not feel like:

- operating an audio panel
- a more polished feature than the document stage itself

In tradeoffs, choose:

- better document contact over richer playback chrome
- better Compiler Read honesty over more audio sophistication

### 7.7 Compiler Read

Compiler Read belongs inside Dream because it is a source-pressure action.

It should appear as:

- a serious action on the focused document
- clearly read-only
- clearly provisional
- clearly separated from canon and receipt creation

Its visual treatment should be stronger than utility, but quieter than the document itself.

It should not create the feeling that Dream has split into two products.

---

## 8. Bridge Design

`Bridge` is a first-class seam in the rebuild.

### 8.1 Bridge must do

- move a passage, note, or witness from Dream into Room
- preserve where it came from
- make it legible inside the Room as source-derived material
- allow return to the same Dream anchor
- carry identity and anchor cleanly enough that the user feels continuity, not export

### 8.2 Bridge must not do

- auto-create canon
- silently create receipts
- turn Dream into a staging ground for hidden mutations
- erase the identity of the source object

### 8.3 Bridge should feel like

- intentional carryover
- continuity of attention
- movement from source contact into live work

Not:

- export
- duplication
- mode switching by side effect

---

## 9. Utility Design

Utility should remain visible enough to access and quiet enough not to distort the IA.

Utility includes:

- account
- settings
- sign out

Utility should live in:

- top-bar overflow
- avatar menu
- or a subordinate trigger

It should not sit inside the primary mode switch.
It is subordinate utility, not a third equal surface.

---

## 10. Visual Language

This rebuild should use the v6 design system as discipline, not as decoration.

### 10.1 Surfaces

Use glass and raised surfaces where appropriate, but do not turn every region into a glass card.

The room should feel like a space.
The surfaces should breathe.
The product should not become a tray of containers.

### 10.2 Cards

Receipt-card logic is reusable, but it should be applied carefully.

Use layered disclosure when:

- the front can present a verdict
- the back can reveal evidence or detail

Do not use receipt-card logic for everything by default.
The main thread and main document should not dissolve into card soup.

### 10.3 Type

Honor the system law:

- sans for humans
- mono for systems
- never cross

That means:

- user-facing reading and conversation in sans
- system labels, states, and micro-signals in mono

### 10.4 Color

Keep the semantic split sharp:

- blue = brand / active structural focus
- green / amber / red = signal states
- one signal color per state

Do not mix signal colors for drama.

### 10.5 Shapes

The shape language should continue informing meaning, but it should not overload the shell.

Use shapes where they:

- compress meaning
- reinforce structural roles
- help runtime literacy

Avoid turning every icon or control into symbolic ceremony.

---

## 11. Mobile and Desktop

Desktop and mobile should feel like the same product.
Desktop may breathe more.
It should not become a different ontology.

### 11.1 Mobile

Mobile should prioritize:

- thread
- document stage
- focused controls
- temporary overlays

The user should never feel trapped under stacked panels.

### 11.2 Desktop

Desktop may allow:

- a more visible Dream shelf
- more persistent workingEcho presence
- contextual side objects when truly earned

But desktop must not revert to:

- split-pane dashboard thinking
- permanent parallel workspaces
- “main content plus tool farm”

---

## 12. What To Remove From The Design Center

The following should no longer define the primary runtime silhouette:

- boxes as visible destination
- sessions as visible workspace region
- witness as permanent section
- operate as permanent section
- mirror as permanent section
- receipt kit as main-shell destination
- shape library as top-level mode
- Recon as runtime center
- Drive Tape as runtime center
- Seven Terminal as runtime center
- design-proposal surfaces inside the main signed-in app

These may survive as:

- hidden infrastructure
- future instruments
- contextual overlays
- temporary sheets
- later-phase products

They should not dictate the current rebuild.

---

## 13. Build Sequence For Design And Engineering

This section should be read as MVP sequence, not abstract future-state order.

### Phase 1

Lock the IA:

- only Room and Dream are permanent surfaces
- Bridge is first-class seam
- utility is subordinate

### Phase 2

Rebuild Room:

- thread first
- composer second
- source entry third
- thin `workingEcho` fourth
- field state fifth
- remove shell clutter

### Phase 3

Rebuild Dream:

- make document stage dominant
- make document access quiet and reliable
- make Compiler Read integrated and quiet
- make Send to Room clean and explicit

### Phase 4

- Build listening in:

- integrated well
- but not allowed to outrank the document-pressure loop

### Phase 5

Re-home the uncertain nouns:

- move them into sheet, contextual, or deferred status

Only after this foundation is strong should future instruments like Recon or Drive Tape be reconsidered in runtime terms.

---

## 14. Success Criteria

This proposal succeeds if:

- a user opens the app and immediately feels where live work is
- Room feels like a steering surface rather than chat plus bureaucracy
- Dream feels like source contact rather than storage
- `workingEcho` is present, thin, and clearly real
- field state is honest and legible
- Compiler Read feels serious without stealing the center
- moving from Dream to Room feels natural
- mobile and desktop feel like the same product
- the shell no longer suggests five equal products

This proposal fails if:

- the shell stays cluttered even after simplification
- Room still needs visible ontology before the user can work
- Room collapses into only messages plus input
- Dream still feels like a control panel
- Bridge feels like hidden plumbing rather than a real user seam
- listening becomes more polished than the underlying document-contact loop
- future concepts continue distorting the current runtime center

---

## 15. One-Line Seal

**The rebuild should produce one calm instrument with two durable surfaces: Room for live steering, Dream for source contact, Bridge between them, workingEcho as the live hinge, and receipts quietly deciding what carries forward with trust.**
