# Document Assembler — Concept Description

## What It Is

A tool for reading, editing, listening to, and assembling documents from multiple sources — with a built-in receipt system that proves what you read, how you thought about it, and what you built from it.

Everything uploaded (PDF, Word, Markdown) is converted into Markdown as the canonical format. Once in Markdown, every document becomes a collection of addressable **blocks** — paragraphs, headings, lists, quotes. Blocks are the atomic unit. Documents are named assemblies of blocks.

---

## Core Experience

### 1. Upload and Listen

Users upload PDF, DOCX, or MD files. The system converts them to Markdown and renders them in an editable view. Users can listen to any document or any selected section using high-quality text-to-speech (ElevenLabs). Reading and listening activity is logged automatically.

### 2. Edit in Place

Users can edit any document directly within the tool — modifying text, restructuring sections, adding new content. All edits are tracked. The document is always live and always listenable after changes.

### 3. Assemble New Documents from Existing Ones

This is the core differentiator. Users can compose a new document by selecting blocks from multiple source documents. Like building with Lego:

- Take the introduction from Document A
- Add the summary from Document B
- Include a synthesis generated from Documents C, D, and E
- Rearrange, remove, and add until the shape is right

The result is a new document (Document F) that carries the full lineage of where each block came from.

### 4. AI-Assisted Operations

Users can chat with their documents and ask the AI to perform operations:

- **Extract:** "Find every mention of X in this document" → produces a set of blocks
- **Summarize:** "Give me a three-paragraph summary of this section" → produces a new block
- **Synthesize:** "Compare the conclusions of these three documents" → produces a new block
- **Search for evidence:** "Find evidence that supports the claim Y" → produces tagged snippets

AI-generated blocks are clearly marked as such. Users curate, edit, reorder, and finalize. The AI proposes; the human composes.

### 5. Assembly as Receipt

Every action in the tool is logged — not as hidden metadata, but as a visible, exportable record. Every session produces two outputs:

**The Document** — what you made.

**The Receipt** — how you made it.

Three types of receipts emerge from normal use:

- **Consumption Receipt** — Proof that a document was read or listened to. Which sections, for how long, in what order. Not a checkbox — a witnessed record.
- **Assembly Receipt** — The chain of custody for every block in an assembled document. Where it originated, what operation produced it (import, AI extraction, human edit), and when.
- **Synthesis Receipt** — Proof of thought. The sequence of AI queries, human selections, edits, and arrangements that produced the final document. This is not "did you read it" — it is "what did you do with what you read."

---

## Block Identity

Each block carries a minimal identity:

- **Origin** — which source document it came from
- **Position** — where it sat in the original
- **Timestamp** — when it was created or modified
- **Author** — human or AI
- **Operation** — how it got here (imported, extracted, summarized, synthesized, edited)

This identity travels with the block wherever it goes. When blocks are assembled into a new document, their lineage is preserved.

---

## Summary of Features

1. Upload PDF, DOCX, and MD files
2. Auto-convert everything to Markdown
3. Listen to documents or selections via ElevenLabs TTS
4. Edit documents in place
5. Select and assemble blocks across multiple documents into new documents
6. Chat with documents — ask AI to extract, summarize, synthesize, and find evidence
7. AI-produced blocks are clearly labeled and human-editable
8. Every action is logged into a receipt
9. Three receipt types: Consumption, Assembly, Synthesis
10. Two outputs per session: the document and its receipt
11. Receipts are exportable, shareable, and verifiable

---

## One-Line Summary

Read it, think about it, build something new from it — and prove that you did.
