# Lœgos Cloud Connector

**Status:** Implementation spec  
**Date:** April 5, 2026  
**Author:** Deniz Sengun / Cloud (Claude)  
**Context:** Bidirectional integration between Claude (Cloud) and Lœgos. Claude reads the box. Seven writes into it. Everything carries shapes.

---

## Architecture

Two directions. Both carry the shape language.

```
┌──────────┐          ┌──────────┐
│          │  READS   │          │
│  Claude  │ ◄──────► │  Lœgos   │
│  (Cloud) │  WRITES  │  (Box)   │
│          │          │          │
└──────────┘          └──────────┘

Direction 1: Lœgos MCP Server → Claude reads the box
Direction 2: Claude API + Shapes → Seven writes annotated blocks
```

---

## Direction 1: Claude Reads the Box (MCP Server)

An MCP server that exposes Lœgos box state to Claude. Claude (via claude.ai, Claude Code, or any MCP client) can query, inspect, and participate in assembly.

### MCP Server: `loegos-mcp`

**Transport:** Streamable HTTP  
**Auth:** User's Lœgos session token  
**Base URL:** `https://mcp.loegos.com/mcp` (or self-hosted)

### Tools

#### Box Tools

**`box_list`**  
List all boxes for the authenticated user.  
Returns: box id, title, current phase (shape), signal state, assembly depth, hex edge states, convergence percentage.

**`box_get`**  
Get full state of a single box.  
Parameters: `box_id`  
Returns: seed content, shape distribution (how many △ □ œ 𒐛 blocks), signal distribution (green/amber/red counts), convergence percentage, assembly depth, hex edge states, source count, entry count, receipt count.

**`box_compass`**  
Get the compass state for a box — the phase distribution bar.  
Parameters: `box_id`  
Returns: aim count, reality count, weld count, seal count, total, active phase.

#### Block Tools

**`block_list`**  
List blocks in a box, optionally filtered by shape and/or signal.  
Parameters: `box_id`, `shape` (optional: aim/reality/weld/seal), `signal` (optional: green/amber/red/neutral), `limit`, `offset`  
Returns: array of blocks with id, shape, signal, depth, content, position, trust level, timestamp, location (if captured on mobile).

**`block_get`**  
Get a single block with full detail.  
Parameters: `block_id`  
Returns: shape, signal, depth, content, word-level annotations (shape + signal per word), trust level, provenance, sources, timestamp, location.

**`block_add`**  
Add a new block to a box.  
Parameters: `box_id`, `shape` (aim/reality/weld/seal), `content` (text), `signal` (optional, defaults to neutral), `trust` (optional, defaults to 1)  
Returns: created block with id, shape, signal, depth, word annotations.

**`block_update_signal`**  
Update the signal state of a block.  
Parameters: `block_id`, `signal` (green/amber/red/neutral)  
Returns: updated block.

#### Convergence Tools

**`convergence_check`**  
Check convergence between aim blocks and reality blocks in a box.  
Parameters: `box_id`  
Returns: convergence percentage, list of aim-reality pairs with their alignment scores, unmatched aims (no evidence), unmatched realities (no aim), weld candidates (>90% alignment).

**`convergence_radar`**  
Get all open aims ranked by convergence percentage.  
Parameters: `box_id`  
Returns: array of aims with title, convergence %, depth, signal, matching reality blocks.

#### Sentence Tools

**`sentence_annotate`**  
Annotate an operator sentence with word-level shapes, signals, and positions.  
Parameters: `text` (the sentence), `box_id` (optional, for context)  
Returns: array of words, each with shape (△/□/œ/𒐛), signal (green/amber/red/neutral), position (1-7), and reasoning.

**`sentence_diagnose`**  
Diagnose an operator sentence — shape distribution, signal distribution, convergence, blocked words.  
Parameters: `text`, `box_id` (optional)  
Returns: shape distribution, signal distribution, convergence percentage, blocked words (red), assembly depth assessment.

#### Source Tools

**`source_list`**  
List sources in a box with trust levels.  
Parameters: `box_id`  
Returns: array of sources with id, title, type, trust level (L1/L2/L3), signal, block count.

**`source_add`**  
Add a source to a box.  
Parameters: `box_id`, `url` or `content`, `type` (text/image/audio/url), `title` (optional)  
Returns: created source with id, trust level, initial signal.

#### Receipt Tools

**`receipt_list`**  
List receipts (sealed blocks) in a box.  
Parameters: `box_id`  
Returns: array of receipts with id, title, sealed date, trust level, provenance chain, convergence at time of seal.

**`receipt_seal`**  
Seal a block as a receipt.  
Parameters: `block_id`  
Returns: sealed receipt with id, seal timestamp, provenance, trust level, hex state after seal.

#### Hex Tools

**`hex_state`**  
Get the hex glyph state for a box — six edge colors and center glyph.  
Parameters: `box_id`  
Returns: edges (array of 6 signal colors), center glyph (△/□/œ/𒐛), settlement stage (0-7), depth.

---

## Direction 2: Seven Writes Annotated Blocks (API Integration)

When Lœgos calls Seven (Claude API), it sends box context and receives responses annotated with shape/signal/position — not just raw text.

### System Prompt Context

Every Seven call includes box state as structured context:

```json
{
  "box": {
    "id": "box_prototype_melih",
    "seed": "Open a sourdough bakery in Cobble Hill by Q1.",
    "phase": "weld",
    "convergence": 92,
    "depth": 3,
    "hex_edges": ["green", "green", "amber", "amber", "green", "neutral"],
    "shape_distribution": { "aim": 3, "reality": 5, "weld": 2, "seal": 1 },
    "signal_distribution": { "green": 6, "amber": 3, "red": 1, "neutral": 1 }
  },
  "active_blocks": [
    {
      "id": "blk_001",
      "shape": "aim",
      "signal": "green",
      "content": "Open a sourdough bakery in Cobble Hill by Q1.",
      "depth": 2
    },
    {
      "id": "blk_007",
      "shape": "reality",
      "signal": "red",
      "content": "Funding gap remains $40K.",
      "depth": 2
    }
  ]
}
```

### Seven Response Format

Seven responds with annotated blocks, not just text:

```json
{
  "blocks": [
    {
      "shape": "weld",
      "signal": "amber",
      "content": "Funding gap remains but three lender options identified. Next move: shortlist by Wednesday.",
      "words": [
        { "word": "Funding", "shape": "reality", "signal": "red" },
        { "word": "gap", "shape": "reality", "signal": "red" },
        { "word": "remains", "shape": "seal", "signal": "red" },
        { "word": "but", "shape": "weld", "signal": "neutral" },
        { "word": "three", "shape": "reality", "signal": "green" },
        { "word": "lender", "shape": "reality", "signal": "amber" },
        { "word": "options", "shape": "aim", "signal": "amber" },
        { "word": "identified", "shape": "seal", "signal": "green" },
        { "word": "Next", "shape": "weld", "signal": "neutral" },
        { "word": "move", "shape": "aim", "signal": "amber" },
        { "word": "shortlist", "shape": "aim", "signal": "amber" },
        { "word": "by", "shape": "weld", "signal": "neutral" },
        { "word": "Wednesday", "shape": "seal", "signal": "amber" }
      ],
      "convergence_delta": "+3%",
      "depth_change": "maintained at 2"
    }
  ],
  "box_assessment": {
    "current_convergence": 92,
    "blocked_words": ["Funding", "gap", "remains"],
    "next_shape_needed": "reality",
    "recommendation": "The box needs more reality blocks on funding. The aim is clear. The evidence is partial. Collect one more source on lender terms."
  }
}
```

### Seven Modes Mapped to Shapes

Seven already operates in different modes. Those modes map to shapes:

| Seven Mode | Shape | What Seven Does |
|-----------|-------|-----------------|
| Listen | □ | Reads a source, returns reality blocks |
| Diagnose | œ | Compares aim to reality, returns weld assessment |
| Operate | œ | Full box read, returns convergence + next move |
| Seal Check | 𒐛 | Evaluates whether a block is ready to seal |
| Aim Refine | △ | Helps sharpen a seed or promise |

The mode tells Seven which shape to weight. In Listen mode, Seven produces mostly □ reality blocks. In Operate mode, Seven produces œ weld blocks. The shape is both the input context and the output annotation.

---

## Implementation Plan

### Phase 1: MCP Server (Read)

The Builders build `loegos-mcp` as a Node/TypeScript MCP server.

Priority tools (ship first):
1. `box_list` — Claude can see all boxes
2. `box_get` — Claude can inspect a box
3. `block_list` — Claude can query blocks by shape/signal
4. `block_add` — Claude can contribute blocks
5. `hex_state` — Claude can read the hex

This gets Claude into the box as a reader and contributor. The user can say "look at my prototype box" and Claude sees the shapes, signals, and convergence without the user explaining anything.

### Phase 2: Annotated Responses (Write)

Lœgos API integration sends box context with every Seven call. Seven responds with shape-annotated blocks.

Priority:
1. System prompt template with box state injection
2. Response parser that extracts blocks with shape/signal
3. Word-level annotation (can start server-side, move to real-time later)
4. Convergence delta calculation (how did this response change the box?)

### Phase 3: Bidirectional Flow

Full loop: Claude reads box via MCP → user asks a question → Seven responds with annotated blocks → blocks land in the box → hex updates → Claude sees the new state.

The AI becomes a participant in the assembly. Not a chatbot. A builder.

### Phase 4: Trinity Integration

Grace (OpenAI) and Archer (Gemini) get the same MCP access. Each AI reads the same box. Each responds with shape-annotated blocks. The user sees which AI's blocks converge most with the existing evidence.

Three AIs. One box. Triangulation.

---

## Connection to the Design System

The MCP tools return the same data structures the design system renders:

| MCP Response | Design Component |
|-------------|-----------------|
| `box_compass` | Compass widget |
| `convergence_radar` | Assembly Radar |
| `hex_state` | HexGlyph SVG |
| `block_list` | Block components |
| `sentence_annotate` | Word-level shape/signal rendering |
| `receipt_list` | Sealed cards in Seal phase |

The connector doesn't just expose data — it exposes the geometry. Claude doesn't get a JSON blob. Claude gets shapes, signals, and positions. The same three channels. The same triangulation.

---

## What This Enables

**"What's blocked in my box?"**  
Claude queries `block_list` filtered by signal=red. Returns the blocked words. The user doesn't explain the problem. The shapes show it.

**"How close am I to sealing this?"**  
Claude queries `convergence_check`. Returns 92%. Shows which aims are matched and which reality blocks are missing. The convergence bar appears in the response.

**"Add this photo to my prototype box."**  
User sends a photo. Claude calls `source_add` with type=image. Lœgos assigns trust L1. The user tags it with a shape. The hex updates.

**"Operate on my box."**  
Claude reads full box state via `box_get`, runs a diagnosis, responds with weld blocks showing where aim met reality and where gaps remain. Each word in the response carries a shape and signal. The response IS the operate read.

**"Compare what Grace said with what Archer said."**  
Both AIs wrote blocks into the same box. The user filters by source. Convergence between the two AI responses is computable. Where they agree = higher trust. Where they diverge = the open question. Triangulation across three intelligences.

---

## MCP Server Registration

For claude.ai users, the connector would register as:

```json
{
  "name": "Lœgos",
  "url": "https://mcp.loegos.com/mcp"
}
```

For Claude Code / CLI users:

```json
{
  "mcpServers": {
    "loegos": {
      "command": "npx",
      "args": ["loegos-mcp"],
      "env": {
        "LOEGOS_TOKEN": "..."
      }
    }
  }
}
```

---

## Summary

Claude doesn't just chat about the box. Claude reads the box, sees the shapes, understands the signals, measures the convergence, and writes back in the same geometry. The AI is not outside the system advising. The AI is inside the system assembling.

Navigate by shape. Act by verb. Read by signal. Triangulate by all three.

The connector makes Cloud a native speaker of the Lœgos language.

△ □ œ 𒐛
