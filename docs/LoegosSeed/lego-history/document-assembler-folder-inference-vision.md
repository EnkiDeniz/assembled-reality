# Document Assembler — Vision Note: Folder Drop & Project Inference

**"Give me the pile. Show me the shape."**  
**April 3, 2026**

---

## What This Idea Is

This feature is not really about folders.

Two lines should anchor the idea:

**Words are Legos.**  
**Drop anything to build something.**

It is about the moment when a user has a mess of related material, does not yet know what to call it, and needs the product to look at the pile with them and answer a simple question:

**"What am I looking at here?"**

That is the product move.

The user drops a folder or a bundle of files. The system converts everything it can into words. Then, before the user assembles anything, the AI gives them an outside view of the pile:

- what it seems to be
- what kinds of material are in it
- what a reasonable project name might be
- what a sensible starting structure might look like

This is not deep analysis. It is not judgment. It is not autonomous organization.

It is orientation.

The system says: "Here is the shape I think I see. Does that sound right?"

---

## Why It Matters

Most tools ask the user to organize before they understand.

They ask for:

- a project name
- a folder structure
- tags
- categories
- a destination

But in real life, people often start with a pile:

- contractor quotes
- screenshots
- photos
- PDFs
- notes
- a spreadsheet
- a few emails

The user knows the pile is related, but they do not yet know the best frame for it.

This feature flips the order:

**dump first, name second**

That is why it feels powerful. The product is not asking the user to perform certainty too early. It is helping them reach certainty.

---

## The Product Law

This idea fits the larger product law cleanly:

**Anything -> Source -> Blocks -> Assembly -> Receipt**

Folder inference does not replace that model. It reveals it.

What happens in order:

1. The user drops a bundle of material.
2. Each file becomes a source document when possible.
3. Each source document becomes blocks.
4. The AI scans the full pile of sources and blocks and proposes a project shape.
5. The human confirms or renames.
6. The project opens with that suggested structure as a starting point.

That middle step is important:

**the folder is not the document**

The folder is an intake package.

The system should preserve:

- the original files as provenance
- each converted file as its own source document
- the inferred structure as a project-level proposal

That keeps the product honest. Nothing disappears into a black box.

---

## What The User Should Feel

The feeling should be:

**"I dropped in a mess and the product helped me see what it is."**

Not:

- "the AI reorganized my life"
- "the system guessed too much"
- "my files got flattened into one blob"

The right tone is calm, useful, and lightly confident.

Good responses sound like:

- "Looks like a home renovation project."
- "This seems to be research for an essay."
- "I think these are product meeting materials."

Bad responses sound like:

- "This project is definitely about..."
- "I have fully analyzed..."
- "Here is the optimal structure..."

The model should propose, not declare.

---

## What The AI Is Actually Doing

The AI is not meant to deeply reason over every block at this stage.

It is performing a fast exterior read of the pile:

- filenames
- titles
- headings
- first lines
- image descriptions
- source types
- recurring terms
- structural patterns

From that, it generates four lightweight outputs:

1. A plain-language summary  
   A short answer to "what am I looking at here?"

2. An inventory  
   Grouped by material meaning, not just file extension

3. A proposed project name  
   Clear, compact, human

4. A suggested starting structure  
   Section headings that organize the pile into a usable first pass

The AI is not replacing assembly. It is preparing the ground for assembly.

---

## Trust Rules

This feature only works if it feels trustworthy.

That means a few rules should be absolute:

### 1. The AI proposes. The human confirms.

The user must see the inferred summary, inventory, and name before the project becomes "official."

### 2. Sources remain separate underneath the project.

A contractor quote should still be a source document. A photo should still be a source document. The project structure is a layer above them, not a destructive merge.

### 3. Uncertainty should be spoken plainly.

If the pile is mixed or ambiguous, the system should say so. No fake confidence.

### 4. Nothing should be silently discarded.

Junk, irrelevant items, and weakly related files should still be preserved unless the user removes them later.

### 5. The receipt should preserve authorship of the structure.

The log should show:

- what was dropped
- what was converted
- what the AI proposed
- what the human accepted or renamed

That matters because this is not just organization. It is the start of project formation.

---

## What It Changes In The Product

This idea upgrades folder import from a utility into a defining experience.

Without inference, folder import means:

**"I can process many files at once."**

With inference, folder import means:

**"I can understand the pile faster than I could on my own."**

That is a much stronger promise.

It also strengthens the overall product hierarchy:

- `Project` becomes the real top-level object
- `Sources` are the component parts inside the project
- `Inference` becomes the bridge from intake to project shape
- `Assembly` becomes intentional building, not initial sorting
- `Receipts` preserve how the project was formed

In that sense, folder inference is not a side feature. It is one of the clearest expressions of the product’s core idea.

---

## The Best Framing

The strongest framing is not:

- "upload a folder"
- "bulk import"
- "AI organization"

The strongest framing is:

**"Drop a folder. We’ll tell you what’s in it."**

And underneath that:

**"Give me your mess. I’ll turn it into words. Then you can build with them."**

And beneath the whole system, the shortest version is:

**Words are Legos.**  
**Drop anything to build something.**

That line works because it connects the full system:

- intake
- normalization
- listening
- assembly
- receipts

The user does not need to understand the architecture. They just need to feel the shift from mess to shape.

---

## What This Should Become Next

This vision should turn into a build spec that defines four layers clearly:

1. **Intake package**
   The dropped folder or mixed file bundle

2. **Converted sources**
   Each file as its own preserved source document

3. **Project inference**
   Summary, inventory, proposed name, suggested sections

4. **Confirmed project structure**
   The human-accepted starting organization that opens into playback and assembly

If those boundaries stay clean, the feature will feel powerful without becoming messy under the hood.

---

## The One-Sentence Version

**The user drops a pile of material, the system turns it into words, and the AI helps the user see what the pile is before they start building with it.**
