# Document Assembler — Add-On Spec v2: Folder Drop, Inference, and Confirmation

**"Words are Legos."**  
**April 3, 2026**

---

## Operator Sentence

**Words are Legos.**

**Drop anything to build something.**

That is the product.

Everything that enters the system gets turned into words.
Those words become blocks.
Those blocks become the material the user can listen to, select, rearrange, assemble, and receipt.

A photo becomes words.  
A PDF becomes words.  
A screenshot becomes words.  
A voice memo becomes words.  

Once they pass through the gate, they are all the same building material.

Internally, the system calls them `blocks`.  
Externally, the user should feel something simpler:

**words are Legos**

---

## The Core Idea

This feature is not just folder upload.

It is the moment the product looks at a pile of material and answers:

**"What am I looking at here?"**

The user drops a folder or mixed bundle of files.
The system converts everything it can into sources and blocks.
Then the AI does one useful thing before the user starts building:

- summarizes what the pile seems to be
- inventories the kinds of material inside it
- proposes a project name
- proposes a starting structure
- proposes a listening order

Then the human confirms.

That confirmation matters. The AI proposes. The human accepts or renames.

---

## What This Adds

This spec adds the missing layers after bulk intake:

1. A temporary `intake session`
2. AI `project inference`
3. A human `confirmation step`
4. A `confirmed project` created from the accepted proposal

This is what turns folder import from a utility into a product experience.

Without this layer, folder drop means:

**"I can ingest many files at once."**

With this layer, folder drop means:

**"I can understand the pile before I build with it."**

---

## Why It Matters

Most tools ask the user to organize too early.

They ask for:

- a project name
- a category
- a structure
- a destination

But real work often starts as a pile:

- a few PDFs
- screenshots
- photos
- notes
- a spreadsheet
- some emails

The user knows the materials are related, but does not yet know the clearest name or shape.

This feature flips the order:

**dump first, name second**

The system helps the user see the shape before asking them to commit to it.

---

## Product Law

This feature should preserve the existing product hierarchy:

**Anything -> Source -> Blocks -> Assembly -> Receipt**

More specifically:

**Folder / file bundle -> Intake session -> Converted sources -> Inference draft -> Confirmed project**

That middle structure is important.

The folder is not the document.
The folder is not the assembly.
The folder is an intake package.

The system should preserve:

- the original dropped files
- each converted file as its own source document
- the AI inference as a proposal
- the confirmed project as a separate accepted state

Nothing should be flattened into one opaque blob.

---

## Object Boundaries

### 1. Intake Session

A temporary state created when the user drops a folder or mixed bundle.

It should contain:

- dropped file list
- per-file conversion result
- skipped file list
- total block count
- derived source document references
- inference draft once generated

This is not yet a finalized project.

### 2. Source Documents

Each successfully converted file becomes its own source document.

Examples:

- `contracts.pdf` -> source document
- `kitchen-photo.jpg` -> source document
- `budget.xlsx` -> source document

Each source document keeps normal provenance:

- filename
- source asset
- derivation mode
- block identity

### 3. Inference Draft

The AI-generated proposal produced from the full pile.

It includes:

- plain-language summary
- grouped inventory
- proposed project name
- suggested sections
- suggested listening order

This is not yet authoritative.

### 4. Confirmed Project

Created only after the user accepts the proposal or renames it.

This project contains:

- confirmed project name
- attached source documents
- starting section structure
- project-level listening order
- receipts showing what the AI proposed and what the human confirmed

---

## The Flow

### Step 1: Drop

The user drops a folder or selects multiple files from any intake method:

- file picker
- drag-and-drop
- screenshots
- clipboard imports
- camera roll

Accepted inputs for v1:

- PDF
- DOCX
- MD / TXT
- images
- screenshots
- voice memos
- spreadsheets where supported
- unknown formats only if best-effort extraction works

During this step, the system creates an `intake session`.

### Step 2: Convert

Each file is processed independently.

The user sees live file-by-file status:

```text
Ingesting...

contracts.pdf           ✓ converted · 12 blocks
kitchen-photo.jpg       ✓ described · 1 block
floor-plan.png          ✓ described · 1 block
budget.xlsx             ✓ converted · 4 blocks
permit-email.docx       ✓ converted · 6 blocks
paint-samples.jpg       ✓ described · 1 block

8 of 12 files processed
```

Rules:

- successful files keep going
- failed files do not stop the batch
- skipped files show a short reason
- no modal interruptions

At the end of this step, the system has a full pile of sources and blocks.

### Step 3: Infer

Once conversion completes, the AI scans the full pile.

This is not deep analysis of every sentence.
It is fast project inference based on:

- filenames
- headings
- first sentences
- image descriptions
- source types
- recurring terms
- structural patterns

The AI returns five things.

#### 1. Plain-language summary

A short answer to:

**"What am I looking at here?"**

Examples:

- "Looks like a home renovation project. I found contractor quotes, floor plans, material samples, and permit-related emails."
- "This seems to be research for an essay on coordination theory. There are academic papers, personal notes, and highlighted screenshots."
- "Looks like product-team working materials. I see agendas, decision logs, a slide deck converted to text, and whiteboard photos."

#### 2. Inventory

A grouped list of what kinds of material appear to be in the pile.

Example:

```text
WHAT I'M SEEING

· 3 contractor quotes (PDF)
· 2 floor plan images
· 4 material / color samples (images)
· 2 permit-related emails (DOCX)
· 1 budget spreadsheet
```

The grouping should be by meaning, not just extension.

#### 3. Proposed project name

A short, clear name.

Good:

- `Home Renovation Project`
- `Coordination Theory Research`
- `Product Team Q1 Materials`

Bad:

- `Untitled Project`
- `Home Renovation Q2 2026 Main Contractor Comparison`

#### 4. Suggested sections

A starting structure for the project.

Example:

- `Contractor Quotes`
- `Floor Plans`
- `Materials & Colors`
- `Permits`
- `Budget`

This is a proposal, not a lock.

#### 5. Suggested listening order

This is new and should be explicit.

The inference step should recommend where the user should start listening.

Example:

- "Start with the contractor quotes to understand the cost picture."
- "Then review the floor plans to understand the layout."
- "Finish with the budget to see whether the numbers align."

This makes the project immediately playable in a meaningful order, not just alphabetical order.

### Step 4: Confirm

The user sees one confirmation screen with:

- summary
- inventory
- proposed name
- suggested sections
- suggested listening order

Actions:

- `Sounds right`
- `Change name`

If the user chooses `Change name`, only the name needs to become editable.
The rest remains visible.

There is no forced reorganize step here.
The user can refine later inside the project.

### Step 5: Create Confirmed Project

Once the user confirms, the system creates the final project state.

That project should:

- appear on the shelf
- show file count and block count
- open with suggested sections
- preserve all source provenance
- play immediately in the recommended order

---

## What The User Sees After Confirmation

### Shelf Entry

```text
Home Renovation Project
12 files · 47 blocks
```

### Project Structure

```text
# Home Renovation Project

## Contractor Quotes
[blocks from contracts.pdf, quote-1.pdf, quote-2.pdf]

## Floor Plans
[blocks described from floor-plan.png, layout.jpg]

## Materials & Colors
[blocks described from paint-samples.jpg, tile-photo.jpg]

## Permits
[blocks from permit-email.docx, permit-reply.docx]

## Budget
[blocks from budget.xlsx]
```

Each block still carries:

- origin file
- source position
- author
- operation

The sectioning is just the starting structure.

### Playback

Playback should begin in the suggested listening order.

The system can speak transitions like:

- project title
- section headings
- start-of-section cues

That makes the folder immediately listenable as a coherent project, not just a bag of files.

---

## Receipt Model

This feature should introduce a true inference receipt chain.

Example:

```text
14:03:01  DROPPED      12 files from folder "house-stuff"
14:03:08  CONVERTED    12 files → 47 blocks (0 skipped)
14:03:12  INFERRED     AI summary: "Home renovation project"
14:03:12  INFERRED     AI proposed 5 sections
14:03:12  INFERRED     AI suggested listening order
14:03:15  CONFIRMED    User accepted name: "Home Renovation Project"
```

If the user renames:

```text
14:03:12  INFERRED     AI proposed name: "Home Renovation Project"
14:03:18  RENAMED      User changed to: "The House"
```

The receipt must prove:

- what was dropped
- what converted successfully
- what the AI proposed
- what the human accepted or changed

This is essential to the trust model.

---

## Tone Rules

The AI must not over-claim.

Good:

- "Looks like..."
- "This seems to be..."
- "I think these are..."
- "I'm not sure what ties these together..."

Bad:

- "This definitely is..."
- "I fully analyzed..."
- "The optimal structure is..."

This feature works only if the AI sounds observant, not grandiose.

---

## Edge Cases

### Empty folder

"This folder is empty. Try dropping one with files in it."

### All files fail conversion

"None of these files could be converted. We currently support PDFs, Word docs, Markdown, text, images, and supported audio files."

### Only one file

Skip inference entirely.
Just open the source directly.

### Very large folder

Warn, then continue.

Example:

"This folder has 73 files. This might take a minute."

Cap v1 at 100 files.

### Mixed relevance

The AI should acknowledge it naturally:

"Looks like home-renovation materials mixed with a few unrelated files."

The system should not silently discard the unrelated ones.

### Ambiguous content

If there is no clear theme, say so plainly:

"I'm not sure what ties these together. Want to name this yourself?"

That should open the name field for editing.

---

## What Is Already True vs What This Unlocks

The current anything-to-blocks pipeline already makes Step 1 possible:

- multi-file intake
- image-to-words
- voice-to-words
- mixed file conversion

What this feature adds is the missing middle layer:

- the system sees the full pile
- the system proposes shape
- the human confirms

That is what turns bulk import into a differentiated experience.

---

## Product Lines

Internal:

**Anything becomes words. Words become blocks. Blocks become assemblies.**

External:

**Words are Legos.**

Action line:

**Drop anything to build something.**

Feature line:

**Drop a folder. We’ll tell you what’s in it.**

User line:

**Give me your mess. I’ll turn it into words. Then you can build with them.**

---

## Build Implication

This should be treated as the next major feature after the anything-to-blocks foundation stabilizes.

The infrastructure for conversion is mostly here.
The missing work is:

- streaming or progressive multi-file status
- inference endpoint
- confirmation screen
- suggested listening order
- project creation from confirmed inference
- inference receipt logging

That is the layer that makes the product feel like it reads the pile with the user, not just stores it.
