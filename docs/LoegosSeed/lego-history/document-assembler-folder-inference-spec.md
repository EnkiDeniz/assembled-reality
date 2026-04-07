# Document Assembler — Add-On Spec: Folder Drop & Inference

**"What are we looking at here?"**
**April 3, 2026**

---

## The Core Idea

Words are Legos.

This tool has exactly two jobs:

**Job 1: Turn everything into words.** A photo of a house becomes words describing the house. A PDF becomes words. A voice memo becomes words. A screenshot of a Slack thread becomes words. A spreadsheet becomes words. The input is chaos — mixed formats, mixed media, mixed quality. The output is always the same thing: sentences. Sentences become blocks. Blocks are Lego.

**Job 2: Let you build with those words.** Once everything is the same material, you can do anything. Listen to it. Rearrange it. Combine pieces from different piles. Ask the AI to find patterns across all of it. Assemble something new. The assembly history is the receipt.

The format doesn't matter. A photograph and a legal contract and a whiteboard sketch all become the same thing once they pass through the gate. They become words. And words are blocks. And blocks are Lego.

Every feature in this product — uploading, converting, listening, selecting, assembling, AI queries, folder drops, image descriptions — is one of those two jobs. Either it's turning something into words, or it's letting you build with the words.

---

## What This Spec Adds

The folder drop. Instead of uploading one file at a time, the user dumps an entire folder. The system eats everything, converts it all to blocks, and then the AI looks at the full pile and tells the user what it sees. Not interpretation. Inventory. A plain-language description of what the pile looks like from the outside, a proposed project name, and an auto-generated structure.

The user dumps. The shape reveals itself.

---

## The Problem It Solves

Every project tool asks you to name and organize before you start. That's backwards. Most people don't know what their project is until they see all the pieces in one place. They have a folder with 15 files and a vague sense of "this is all related." They can't summarize it yet because they haven't looked at all of it yet.

This feature flips the order: dump first, name comes from the material.

---

## The Flow

### Step 1: Drop

The user drops a folder or selects multiple files from any input method (file picker, drag-and-drop, camera roll, screenshots, clipboard). No format restrictions. The system accepts everything it can process.

**Accepted inputs:**
- PDF
- DOCX
- MD / TXT
- Images (PNG, JPG, HEIC, screenshots)
- Spreadsheets (XLSX, CSV) — converted to descriptive text tables
- Unknown formats — best-effort text extraction, skip if impossible

**During ingestion, the user sees:**

```
Ingesting...

contracts.pdf           ✓ converted · 12 blocks
kitchen-photo.jpg       ✓ described · 1 block
floor-plan.png          ✓ described · 1 block
budget.xlsx             ✓ converted · 4 blocks
permit-email.docx       ✓ converted · 6 blocks
paint-samples.jpg       ✓ described · 1 block
...

8 of 12 files processed
```

Each file shows its name, a checkmark when done, and how many blocks it produced. Files that fail show a dim `✗ skipped` with a one-line reason ("unsupported format" or "file was empty"). No error modals. No interruptions. The pipeline keeps going.

### Step 2: Inference

After all files are converted, the AI scans the full set of blocks. It does not read every word deeply — it samples headings, first sentences, image descriptions, filenames, and structural patterns. This is fast: 2-5 seconds.

The AI produces three things:

**1. A plain-language summary of what the pile looks like.**

Not a report. Not an analysis. One to three sentences that answer "what am I looking at?" in the way a person would if you handed them a stack of papers.

Examples:
- "Looks like a home renovation project. I found contractor quotes, floor plans, material samples, and some permit-related emails."
- "This seems to be research for an essay on coordination theory. There are academic papers, personal notes, and some highlighted screenshots."
- "Looks like meeting materials from a product team. I see agendas, a slide deck converted to text, decision logs, and a few photos of whiteboards."

**2. An inventory — what types of material are in the pile.**

A short list. Not file-by-file (the user already saw that during ingestion). Grouped by what the AI thinks each thing *is*:

```
WHAT I'M SEEING

· 3 contractor quotes (PDF)
· 2 floor plan images
· 4 material/color samples (images)
· 2 emails about permits (DOCX)
· 1 budget spreadsheet
```

The grouping is by content type, not file format. "3 contractor quotes" is more useful than "3 PDFs." The format is shown in parentheses only when helpful for context.

**3. A proposed project name.**

One short name derived from the content. Not generic ("Untitled Project"). Not overly specific ("Home Renovation Q2 2026 Main Contractor Comparison"). Just clear:

- "Home Renovation Project"
- "Coordination Theory Research"
- "Product Team Q1 Materials"

### Step 3: Confirm

The user sees the summary, inventory, and proposed name on one screen. Two actions:

**"Sounds right"** — accepts the name and structure. The project is created with this name and the AI-generated sections become the table of contents.

**"Change name"** — the name field becomes editable. The user types their own name. Everything else stays.

There is no "reorganize" step. The AI's grouping becomes the section order. If the user wants to change it later, they can do that inside the project using the normal assembly tools.

---

## What Happens After Confirmation

### The project appears on the shelf.

It shows the confirmed name, the file count, and the block count:

```
Home Renovation Project
12 files · 47 blocks
```

### The document is pre-structured.

When the user opens the project, the blocks are already organized into sections based on the AI's inventory grouping:

```
# Home Renovation Project

## Contractor Quotes
[blocks from contracts.pdf, quote-1.pdf, quote-2.pdf]

## Floor Plans
[blocks described from floor-plan.png, layout.jpg]

## Materials & Colors
[blocks described from paint-samples.jpg, tile-photo.jpg, ...]

## Permits
[blocks from permit-email.docx, permit-reply.docx]

## Budget
[blocks from budget.xlsx]
```

Each section heading is generated. Each block within the section carries its normal identity (origin file, position, author, operation). The section structure is a proposal — the user can move blocks between sections, delete sections, or create new ones.

### Playback works immediately.

The user can press play and hear: "Home Renovation Project. Starting with contractor quotes..." The AI-generated section headings become spoken transitions. The entire folder is now listenable in the order the AI proposed.

---

## The Inference Receipt

This step generates a new receipt type:

```
14:03:01  DROPPED      12 files from folder "house-stuff"
14:03:08  CONVERTED    12 files → 47 blocks (0 skipped)
14:03:12  INFERRED     AI summary: "Home renovation project"
14:03:12  INFERRED     AI grouped into 5 sections
14:03:15  CONFIRMED    User accepted name: "Home Renovation Project"
```

The receipt proves:
- What was uploaded and when
- That the AI proposed the structure (not the user)
- That the user confirmed (consent before compute — the AI proposes, the human accepts)
- What the AI's exact summary and grouping were

If the user changes the name, the receipt logs both:

```
14:03:12  INFERRED     AI proposed name: "Home Renovation Project"
14:03:18  RENAMED      User changed to: "The House"
```

---

## Edge Cases

### Empty folder
"This folder is empty. Try dropping one with files in it."

### All files fail conversion
"None of these files could be converted. We support PDF, Word, Markdown, text, images, and spreadsheets."

### Only one file
Skip the inference step. Just open the file directly. No need to name a project for a single document. It goes straight to the listening view.

### Very large folder (50+ files)
Show a warning: "This folder has 73 files. This might take a minute." Then proceed normally. Cap at 100 files per drop for v1. If the folder has more, ingest the first 100 and note: "Ingested 100 of 147 files. You can add the rest later."

### Mixed relevance (junk in the folder)
The AI's summary should note this naturally: "Looks like project files mixed with some unrelated items. I found 8 documents about home renovation and 4 files that don't seem related (a recipe, a meme, two app screenshots)." The unrelated files still become blocks — the user can remove them later. The AI doesn't delete anything.

### Ambiguous content
If the AI can't confidently infer what the pile is, it says so: "I'm not sure what ties these together. I see legal documents, vacation photos, and a grocery list. Want to name this yourself?" The name field opens for editing. No fake confidence.

---

## UI Components Needed

### 1. Drop Zone
The upload area accepts folders, not just files. On desktop: drag-and-drop a folder. On mobile: "Select files" allows multi-select from Files app or camera roll. The drop zone text:

```
Drop a folder or select files.
PDFs, docs, images, screenshots — anything.
```

### 2. Ingestion Progress
A live-updating list showing each file being processed. Simple checkmarks. No progress bars per file — just ✓ done or ✗ skipped. A counter at the bottom: "8 of 12 files processed."

### 3. Inference Screen
The "What am I looking at?" screen described above. Summary, inventory list, proposed name, and two buttons: "Sounds right" and "change name."

### 4. Updated Home Screen
The source list on the home screen should now show projects (named, multi-file collections) alongside individual source documents. Projects get a folder-style icon or a block count badge.

```
PROJECTS
┌──────────────────────────────────┐
│ 📁  Home Renovation Project      │
│    12 files · 47 blocks          │
└──────────────────────────────────┘

SOURCES (not in a project)
Leader                         TXT
The Thesis                    DOCX
```

---

## Impact on Existing Features

### Listening
No change. Blocks are blocks. The player doesn't know or care if the blocks came from a single PDF or a folder of 12 mixed files.

### Assembly
The section structure created by inference is a starting point. The user can select blocks from any section, mix them with blocks from other projects, and assemble as usual.

### Receipts
The new Inference Receipt type is additive. It logs alongside Consumption, Assembly, and Synthesis receipts in the same timeline.

### AI Bar
The AI bar now has richer context — it knows the project name, the file inventory, and the section groupings. Queries like "compare the three contractor quotes" become possible because the AI already knows which blocks are contractor quotes.

---

## Priority

This is a **v0.3 feature**. It depends on:
- Multi-file upload working (v0.2)
- Image-to-MD conversion working (v0.2)
- The AI bar being wired to real AI (v0.2)

Once those are in place, this feature is approximately:
- Folder/multi-file drop zone: 1 day
- AI inference endpoint (scan blocks, produce summary + grouping): 1 day
- Inference UI screen: half a day
- Auto-section-structuring: half a day
- Receipt logging for inference: a few hours

**Estimated total: 3 days.**

---

## The Line

The product message:

**"Give me your mess. I'll turn it into words. Then you can build with them."**

That's the whole product. Raw material goes in one end. Lego bricks come out the other. You play with them. You build something. The receipt says what you built and what you built it from.

For the landing page: **"Drop a folder. We'll tell you what's in it and read it to you."**

For Fahri: **"Give me your stuff. I'll read it to you."**

For investors: **"We turn any input — documents, images, voice, screenshots — into one universal building material: listenable, selectable, assemblable blocks of text. Every assembly produces a verifiable receipt."**

For the intro screen: **"You've got stuff everywhere. Drop it here. We turn all of it into words, and words are Legos."**
