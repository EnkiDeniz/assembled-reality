# Lœgos: A Coordination Language

**Status:** Language specification  
**Date:** April 5, 2026  
**Author:** Deniz Sengun / Cloud (Claude)  
**Claim:** Lœgos is not a design system with a shape metaphor. Lœgos is a formal language for coordination, the way Fortran is a formal language for computation and Swift is a formal language for building applications.

---

## What Makes Something a Language

A programming language is not code. A programming language is a formal system with:

1. **Primitives** — the smallest indivisible units
2. **Types** — categories that constrain what operations are valid
3. **Syntax** — rules for combining primitives into valid expressions
4. **Semantics** — what a valid expression means when evaluated
5. **State** — values that change during execution
6. **Control flow** — how execution moves from one expression to the next
7. **Data structures** — how primitives compose into larger objects
8. **Error handling** — what happens when something fails
9. **Input/Output** — how the program communicates with the outside world
10. **A runtime** — the environment that executes the program

Lœgos has all ten.

---

## 1. Primitives

Fortran has numbers and characters. Swift has Int, String, Bool. Lœgos has:

### Shapes (4)

```
△  Aim      — intention, direction, declaration
□  Reality  — evidence, constraint, measurement
œ  Weld     — convergence, connection, joint
𒐛  Seal     — closure, proof, receipt
```

### Signals (4)

```
●  Green    — resolved, confirmed, can proceed
●  Amber    — active, in progress, attention needed
●  Red      — blocked, contradicted, act now
○  Neutral  — unknown, no claim yet
```

### Positions (7)

```
1  Detect    — notice the signal
2  Compare   — establish contrast
3  Adapt     — adjust direction
4  Amplify   — add force or specificity
5  Maintain  — hold the structure
6  Prepare   — set up closure
7  Arrive    — seal
```

These 15 primitives (4 + 4 + 7) are the atoms. Everything in Lœgos is composed from them.

---

## 2. Types

In Swift, a variable has a type: `let name: String`. In Lœgos, every unit has a shape type:

```
△  — Aim type. Can contain: declarations, promises, seeds, vectors.
□  — Reality type. Can contain: evidence, captures, sources, measurements.
œ  — Weld type. Can contain: comparisons, convergences, diagnoses, operates.
𒐛  — Seal type. Can contain: receipts, proofs, closures, settled facts.
```

Type constrains valid operations:

- You cannot seal (𒐛) something that has no reality (□) blocks — sealing without evidence is a type error.
- You cannot weld (œ) without at least one aim (△) and one reality (□) — welding nothing to nothing is a type error.
- You can declare an aim (△) without evidence — that's valid. It's a promise. But its signal starts at neutral, not green.

Type checking in Lœgos is convergence checking. When aim and reality converge, the weld is valid. When they don't, the system reports a type mismatch — not as an error message, but as a red signal on the convergence bar.

---

## 3. Syntax

In Fortran: `PROGRAM HELLO` / `PRINT *, "Hello"` / `END PROGRAM`  
In Swift: `func greet() { print("Hello") }`  
In Lœgos:

### The Operator Sentence

The basic expression in Lœgos is the operator sentence: **7 words (±2), each carrying a shape and a signal.**

```
△Ship □prototype œto □Melih œby 𒐛Friday 𒐛sealed
```

This is a valid Lœgos expression. It has:
- At least one aim word (Ship)
- At least one reality word (prototype, Melih)
- At least one weld word (to, by)
- At least one seal word (Friday, sealed)

A sentence with all aim words and no reality words is syntactically valid but semantically unresolved — like declaring a variable you never use. The compiler (convergence check) will flag it.

### The Block

A block is an operator sentence with metadata:

```
block {
  shape: △
  signal: amber
  depth: 1
  content: "Ship prototype to Melih by Friday"
  position: 3
  trust: L2
}
```

This is equivalent to a statement in a program. It has a type (shape), a state (signal), a construction history (depth), and a position in the execution sequence.

### The Card (Function)

A card is a composed set of blocks — like a function is a composed set of statements:

```
card {
  shape: □
  label: "Reality"
  trust: L3
  convergence: 92%
  blocks: [
    block { shape: △, content: "Create listening experience..." }
    block { shape: □, content: "99 entries collected..." }
    block { shape: œ, content: "Evidence aligns with aim..." }
  ]
}
```

The card's shape is determined by the dominant shape of its blocks. Its convergence is computed from the alignment between its △ and □ blocks. The card IS a function that takes blocks as input and returns a convergence percentage as output.

### The Box (Program)

A box is a composed set of cards — like a program is a composed set of functions:

```
box {
  id: "prototype_melih"
  seed: "Open a sourdough bakery in Cobble Hill by Q1."
  phase: œ
  convergence: 92%
  depth: 3
  hex: [green, green, amber, amber, green, neutral]
  cards: [ ... ]
}
```

The box is the program. The seed is the main function. The hex is the program's exit status — six edges telling you the state of the entire execution.

---

## 4. Semantics

In Fortran, `2 + 3` evaluates to `5`. In Lœgos, meaning is evaluated through triangulation:

```
meaning = triangulate(shape, signal, position)
```

Three channels. One meaning. Fixed.

- A word that is △ (aim) + green (resolved) + position 7 (arrive) = **a kept promise.**
- A word that is □ (reality) + red (blocked) + position 1 (detect) = **a newly discovered problem.**
- A word that is œ (weld) + amber (active) + position 4 (amplify) = **a convergence gaining momentum.**

The semantics are compositional: the meaning of a sentence is the triangulation of all its words. The meaning of a card is the triangulation of all its blocks. The meaning of a box is the triangulation of all its cards.

---

## 5. State

In Swift, variables change: `var count = 0; count += 1`  
In Lœgos, signals change:

```
block.signal: neutral → amber → green
block.signal: amber → red  // blocked
block.depth: 1 → 2 → 3 → 4  // assembled deeper
box.convergence: 45% → 78% → 92% → 100%  // aim meeting reality
hex.edges: [neutral, neutral, neutral, neutral, neutral, neutral]
        → [green, green, amber, amber, green, neutral]
        → [green, green, green, green, green, green]  // settlement
```

State transitions are the execution of the program. When a block moves from amber to green, that's a line of code executing. When convergence moves from 78% to 92%, that's a function returning a result. When all hex edges go green, the program terminates successfully.

---

## 6. Control Flow

In Fortran: `IF (X .GT. 0) THEN ... ELSE ... END IF`  
In Swift: `if x > 0 { ... } else { ... }`  
In Lœgos, control flow is the seven-stage gradient:

```
Detect → Compare → Adapt → Amplify → Maintain → Prepare → Arrive
```

This is the execution order of every assembly. The gradient is not optional — it is how coordination computes. You cannot seal before you detect. You cannot amplify before you compare. Skipping stages is like skipping lines of code — the program may run but the output is unreliable.

Control flow can also branch:

- **Green path:** the block advances to the next gradient stage.
- **Amber path:** the block stays at the current stage, iterating.
- **Red path:** the block stops. Execution is blocked. The system must reroute or resolve before proceeding.

Rerouting is not failure. It is a conditional branch. "Reroute is respect for truth."

---

## 7. Data Structures

### Primitive → Block → Card → Box → Lane

This is the type hierarchy. Each level composes from the level below:

```
Word    = shape + signal + position                    // primitive
Block   = word[] + shape + signal + depth + trust      // statement
Card    = block[] + shape + convergence + hex           // function
Box     = card[] + seed + phase + convergence + hex     // program
Lane    = box[]                                         // workspace
```

In Swift terms:

```swift
struct Word {
  let shape: Shape        // △ □ œ 𒐛
  var signal: Signal      // green amber red neutral
  let position: Int       // 1-7
}

struct Block {
  let shape: Shape
  var signal: Signal
  var depth: Int          // 1-4
  let trust: TrustLevel   // L1 L2 L3
  let words: [Word]
}

struct Card {
  let shape: Shape
  var convergence: Float  // 0.0 - 1.0
  let blocks: [Block]
  var hex: HexState
}

struct Box {
  let seed: String
  var phase: Shape
  var convergence: Float
  var depth: Int
  var hex: HexState
  let cards: [Card]
}
```

### The Hex as Data Structure

The hex is a six-element array with a computed center:

```
struct HexState {
  var edges: [Signal; 6]              // six edges, each a signal color
  var center: Shape                    // computed from dominant phase
  var settlement: Int                  // 0-7, computed from edge states
}
```

The hex is the return type of the box. When you evaluate a box, the hex is what you get back. Six edges tell you the state. The center tells you the phase. The settlement stage tells you how far the seven-gradient has progressed.

---

## 8. Error Handling

In Swift: `do { try ... } catch { ... }`  
In Lœgos, errors are red signals:

```
// Type error: sealing without evidence
block { shape: 𒐛, content: "Sealed.", blocks: [] }
→ Error: cannot seal with zero reality blocks. Add □ evidence first.

// Convergence error: aim and reality diverge
box.convergence: 23%
→ Warning: aim and reality are far apart. Add more □ blocks or refine △ seed.

// Blocked: a specific word is red
block.words[0] = { word: "Funding", shape: □, signal: red }
→ Blocked at "Funding". This reality word contradicts the aim. Resolve or reroute.
```

Errors in Lœgos are not exceptions that crash the program. They are signals that redirect attention. A red word is a breakpoint. A low convergence is a warning. A type mismatch is a prompt to add the missing shape.

"Failure is a map." Red is not wrong. Red is where to look next.

---

## 9. Input/Output

### Input

- **Phone capture:** photo, voice, text → becomes a □ reality block
- **Typed operator sentence:** → parsed into words with shapes
- **Source import:** URL, document, paste → becomes a □ source with trust level
- **AI response:** Seven returns annotated blocks → written into the box
- **Voice:** spoken words → transcribed, shaped, signaled

### Output

- **Receipts:** sealed blocks that can travel as proof (𒐛 output)
- **Hex state:** the six-edge glyph summarizing the entire box (status output)
- **Convergence percentage:** how close aim is to reality (computed output)
- **Diagnostic:** which words are red, which shapes are missing (error output)
- **Shareable card:** an assembled card that can be sent to another person or system

### I/O is always shaped

Every input gets a shape on entry. Every output carries a shape on exit. There is no untyped data in Lœgos. If something enters the box, it must declare what it is: aim, reality, weld, or seal. If something leaves the box, it carries its shape and signal with it.

This is the equivalent of strong typing in Swift. You cannot pass an untyped value. The system knows what everything is.

---

## 10. Runtime

The Lœgos runtime is the box. It:

- **Holds state:** all blocks, their shapes, their signals, their depths
- **Computes convergence:** continuously, as blocks are added or updated
- **Updates the hex:** as signals change, the edges update
- **Enforces type rules:** warns when shapes are missing or mismatched
- **Tracks the gradient:** knows which stage each block is at
- **Manages trust:** tracks provenance and trust levels per source
- **Executes operates:** Seven reads the box state and returns a diagnosis

The runtime does not tell the user what to do. It shows the user the state of the program. The convergence bar is the debugger. The hex is the process monitor. The signal colors are the log output.

---

## Comparison Table

| Concept | Fortran | Swift | Lœgos |
|---------|---------|-------|-------|
| Primitive | Number, Character | Int, String, Bool | Shape (△□œ𒐛), Signal (●●●○), Position (1-7) |
| Expression | `2 + 3` | `x + y` | Operator sentence (7 words) |
| Statement | `PRINT *, X` | `let x = 5` | Block (shape + signal + content) |
| Function | `SUBROUTINE` | `func` | Card (composed blocks with convergence) |
| Program | `PROGRAM` | App | Box (seed + cards + hex) |
| Type | `INTEGER` | `Int` | Shape (△□œ𒐛) |
| Variable | `X = 5` | `var x = 5` | `block.signal = amber` |
| Condition | `IF ... THEN` | `if ... { }` | Signal check (green/amber/red) |
| Loop | `DO I = 1, N` | `for i in 1...n` | Gradient stages (1-7, iterate until arrive) |
| Error | `ERR=` | `throw` | Red signal on a word or block |
| Return | `RETURN` | `return` | Receipt (sealed block) |
| Compiler | Fortran compiler | Swift compiler | Convergence checker |
| Debugger | `PRINT` | Xcode debugger | Convergence bar, hex edges, word-level signals |
| IDE | Editor | Xcode | Lœgos workspace (desktop + mobile) |
| Package manager | — | SPM | Sources (imported with trust levels) |
| Version control | — | Git | Assembly depth (how many phases survived) |
| Output | Terminal | Screen | Receipt (𒐛) |

---

## What This Means

Fortran said: computation can be expressed formally.  
Swift said: application logic can be expressed formally.  
Lœgos says: **coordination can be expressed formally.**

The same rigor that lets a compiler check whether `2 + "hello"` is a type error lets Lœgos check whether a seal without evidence is a coordination error. The same structure that lets a program flow from input to output through functions lets a box flow from aim to receipt through convergence.

Lœgos is not a tool that uses a language metaphor. Lœgos is a language that happens to be the first one designed for coordination instead of computation.

The design system is the IDE.  
The operator sentence is the expression.  
The block is the statement.  
The card is the function.  
The box is the program.  
The receipt is the return value.  
The hex is the exit status.  

And the user is not "using an app." The user is writing a program in a coordination language and watching it compile in real time.

---

*"Fortran compiled numbers. Swift compiled interfaces. Lœgos compiles meaning."*

△ □ œ 𒐛
