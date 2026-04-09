# Shape Card Agent — v2.5 (Build Spec)

**Status:** Buildable  
**Goal:**  
Produce a system that:
- returns **stable shape readings (≥80% reproducibility)**  
- produces **useful outputs (≥50% utility proxy)**  
- improves through **AI-to-AI evaluation before human exposure**

---

## 0. Ontology Target

This system models recurring process-forms the way chemistry models matter.

- **Primitive shapes** = elements (minimal transferable dynamics)  
- **Assembled shapes** = molecules (stable compositions of primitives)  
- **Assembly rules** = bonds (how shapes couple)  
- **Equivalence class** = motif | dynamical-class | isomorphism  
- **Promotion** = receipt-backed, not argument-backed  

**Principle:**  
Atoms transfer. Bonds explain. Assembly index ranks. Receipts admit.

---

## 1. System Principle

One engine, two front doors, one receipt gate.

- Human input → adaptive elicitation  
- AI input → structured query  
- Both → canonical IR → same engine → same gates  

---

## 2. Architecture

### A. Intake Layer
- Human protocol (adaptive, low friction)
- AI protocol (schema-first)

### B. Translation Layer
- Converts input → canonical IR

### C. Shape Engine
- Five Reads
- Gate checks
- Library search (primitive + assembly)
- Convergence

### D. Evaluation Engine
- Runs parallel simulations
- Measures reproducibility + utility
- Surfaces candidate primitives

---

## 3. Interpretation Contract

Every run must declare:

intent_layer: ontology | behavior | communication | intervention | evaluation  
assumption_status: explicit | inferred | repaired  

Rule: Wrong layer = invalid result

---

## 4. Human–AI Interaction Contract

### Human role
- Provide myths, analogies, fragments
- Confirm or correct intent
- Supply missing observables

### AI role
- Treat metaphors as search seeds
- Extract invariants without judging analogy
- Do not override user frame without consent
- Surface ambiguity

### Exploratory Mode
- Accept unstructured input
- Propose candidate invariants
- Transition to formal spec after

---

## 5. Input Requirements

Must include:
- Observables
- Timescale
- Constraints
- Resource/Budget
- Operational failure

---

## 6. Step 0 — Granularity Check

Determine:
- primitive
- assembly
- unknown

---

## 7. Step 1 — Five Reads

1. Match invariants  
2. Read joins  
3. Press for geometry  
4. Read failure  
5. Test repair  

---

## 8. Step 2 — Gate

### Structure Gate
Reject if not distinguishing

### Transfer Gate
Must include falsifiable prediction

---

## 9. Step 3 — Search

- primitive match  
- assembly match  
- candidate primitive  
- candidate assembly  
- rejection  

---

## 10. Canonical IR

intent_layer  
invariant  
variables  
resource_budget  
shape_class  
constituent_shapes  
join_pattern  
pressure_claim  
failure_signature  
repair_logic  
falsifier  
transfer_prediction  

---

## 11. Assembly Grammar

Nodes = primitives  
Edges = relations:
- amplifies
- inhibits
- gates
- saturates
- extracts

---

## 12. Evaluation Engine

### Episode

Includes:
- input
- intent_layer
- generator outputs
- judge output
- convergence score
- result type

---

## 13. Metrics

### Reproducibility ≥80%

### Utility ≥50%

### Compression

### Rejection Quality

---

## 14. Primitive Discovery

Cluster:
- invariants
- failure signatures
- mappings

Promote if stable

---

## 15. Assembly Rule

Promote only if:
- non-additive
- new failure
- new prediction

---

## 16. Stopping Condition

- reproducibility ≥80%
- utility ≥50%
- stable primitives
- healthy rejection rate

---

## 17. Constraints

System does NOT:
- confirm truth
- force single shape
- allow generator = judge
- skip falsifier

---

## 18. Canon

- Myth guides search; receipts decide truth  
- Humans need elicitation; machines need representation  
- Some problems are assemblies  
- Atoms transfer; molecules govern  
- Missing intent → prior substitution  
- No receipt, no promotion  

---

## 19. Build Plan

Week 1: IR + generator + judge  
Week 2: runs + logging  
Week 3: evaluation engine  
Week 4: scaling + clustering  

---

## Final Seal

Do not perfect the theory.  
Stabilize the engine.  
Run the episodes.  
Let recurrence reveal the shapes.
