# The Atom

Date: April 6, 2026
Status: Canonical
Purpose: Name the unit of Lœgos rendering. One page. No commentary.

## The unit is the word.

Every word in a Lœgos document carries three properties:

- **Shape** — what role does this word play in coordination? (△ aim, □ reality, œ weld, 𒐛 seal, or none)
- **Signal** — how grounded is this word? (green, amber, red, neutral, attested)
- **Weight** — how verified and worked is this word? (light, normal, strong)

A block is a container for a sequence of typed words. Nothing more.

A document is a sequence of blocks. Nothing more.

The block's shape is whatever shape dominates its words. The block's signal is whatever signal its words average to. The block's weight is whatever weight its strongest word carries. All three are computed from the words, not assigned to the block.

## What this means for the renderer

The renderer iterates over words. Each word gets its own type, color, and weight applied to the characters themselves. The block container is a paragraph wrapper. The line number is gutter chrome. Everything else is layout.

When a word is selected, the inspect panel shows that word's evidence, rationale, and trust chain. Not the block's. The word's.

When the user runs Operate, the engine returns a list of words with type and state. Not blocks. Words. The block view is derived from the word list.

## What this means for the engine

The seed prompt asks the LLM to type and state every word, not every block. The LLM already knows what "Friday" is (temporal boundary, 𒐛). It knows what "Melih" is (proper noun, □). It knows what "agrees" is (convergence claim, œ). It knows what "want" is (aspiration verb, △). The shapes live in the language model already. The seed is the permission slip to use them on every word, not just on whole blocks.

## What this means for everything else in the language folder

Most of the existing documents describe block-level rendering. They are not wrong. They are coarser views of the same language. The block view is what you get when you average the word view. The word view is the truth.

When this contradicts a block-level claim elsewhere in the folder, this file wins.

## One-line position

The world is the atom. Every word carries its shape, its signal, and its weight. The block is the molecule. The document is the substance. The renderer reads atoms.
