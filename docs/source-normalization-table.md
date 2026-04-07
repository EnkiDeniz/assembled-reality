# Loegos Source Normalization Table

**Status:** Canonical modality-by-modality normalization table

| Source class | Raw input examples | Normalization output | Preserve from raw input | Default trust starting point | Notes |
|---|---|---|---|---|---|
| Text | markdown, pasted text, notes, docx, extracted PDF text | markdown source with blocks and structure | filename, source URL, import method, timestamps | `L1` unless grounded by source provenance | Text normalization is structural, not interpretive. |
| Voice | voice memo, dictated note, interview clip | transcript source plus capture metadata | speaker, capture time, recording origin, duration | `L1` by default, `L2` if strong metadata exists, `L3` only after audit | Voice keeps modality even after transcript generation. |
| Image (text-primary) | whiteboard photo, scanned page, text screenshot | OCR-derived markdown source | original image asset, mime type, capture metadata, visible text provenance | `L1` or `L2` depending on provenance | OCR is for text-primary images only. |
| Image (visual-primary) | photo, map, diagram, mood reference, dashboard image | visual source notes with description, signal, and provisional shape | original image asset, metadata, file/source URL | `L1` by default, `L2` if verifiable metadata or source URL exists | Visual-primary images are signal-bearing sources, not OCR leftovers. |
| Link | article, listing, web page, social post | extracted page source with title, body, metadata, URL | canonical URL, capture time, source metadata | `L1` or `L2` depending on extraction confidence and provenance | Links are imported pages, not just bookmarks. |
| Human-state | explicit feeling statement, hesitation report, concern note | attributed human-state source | speaker/observer identity, capture time, context | `L1` by default | Human-state is evidence of human state, not external fact. |
| Derived | transcript summary, image notes, extracted highlights, AI transformation | child source linked to parent source | parent source key, derivation method, model/process label | inherits floor from parent unless clearly weaker | Derivation never erases parent lineage. |
| Assembly | curated working document built from staged blocks | assembly document | source lineage, edit history, box context | trust depends on its inputs plus audit | Assembly is a product artifact, not just another source row. |
| Receipt | local draft or synced proof object | receipt artifact with payload and metadata | document/assembly/operate lineage, timestamps, sync status | trust depends on what it proves, not the fact of drafting | Receipt preserves proof and history, not raw source material. |

## Normalization Rules

1. Every normalization path preserves modality.
2. Every normalization path preserves provenance.
3. Normalization never silently upgrades trust.
4. Derived sources remain linked to their parent sources.
5. If the system cannot confidently normalize a source, it should fail explicitly rather than fabricate structure.
