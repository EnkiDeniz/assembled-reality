# Inference Authority Rules v0.1  
**Status:** Companion to the De-obfuscation Experience spec **Date:** April 6, 2026 **Purpose:** Lock what each inference layer may do, may not do, and at what trust ceiling.  
  
## The Three Categories  
The reference stack is not five layers of the same kind. It is three categories with different ontologies.  
## Inference Sources (check evidence, assign signals)  
1. **Local box sources**  
2. **Project assembly history**  
3. **Domain-specific libraries**  
## Inference Posture (shape communication, not findings)  
1. **Echo Canon / Monolith Cosmology**  
## Advisory Pattern Layer (inform, never override)  
1. **Shape Library (DNA / Scripture / GitHub)**  
  
## Authority Rules Per Layer  
## Layer 1: Local Box Sources  
**What it is:** The evidence the user imported. Photos, emails, documents, calendar events, confirmed communications.  

| Authority | Rule |
| --------------------- | ----------------------------------------------------------------------- |
| Can turn a word green | Yes — evidence directly confirms the claim |
| Can turn a word red | Yes — evidence directly contradicts or is absent |
| Can turn a word amber | Yes — partial evidence exists |
| Can block seal | Yes — if no evidence for a seal-required claim |
| Trust ceiling | L3 (full provenance + independent confirmation + Operate survival) |
| Signal priority | Primary. All other layers defer to Layer 1 when it has a clear finding. |
  
**Rule:** Layer 1 is the ground truth. If local evidence says green, no other layer can override to red. If local evidence says red, no other layer can override to green.  
  
## Layer 2: Project Assembly History  
**What it is:** The box's own history. Prior blocks, prior seals, prior reroutes. Ghost operators detected through receipt trails. Pattern analysis of the user's coordination behavior over time.  

| Authority | Rule |
| --------------------------- | ---------------------------------------------------------------------- |
| Can turn a word green | No. History cannot confirm present reality. |
| Can turn a word red | No. History cannot condemn present evidence. |
| Can intensify scrutiny | Yes — add amber pressure, risk warnings, pattern notes |
| Can surface ghost operators | Yes — but only when tied to specific receipts, never as psychoanalysis |
| Can block seal | No. Can add a warning to seal preflight, not a blocker. |
| Trust ceiling | L2 (pattern-based, not evidence-based) |
| Signal priority | Secondary. Annotates. Does not override Layer 1. |
  
**Rule:** History can intensify scrutiny and add risk warnings, but local evidence remains primary for direct signal assignment. "You missed Friday deadlines three times before" is an amber annotation, not a red signal.  
**Guardrail:** Ghost operators must always be tied to specific receipts and event history. Never: "You always secretly do X." Always: "3 of 4 prior deadline blocks in this box were rerouted. Pattern: evidence clustering in final 20% of timeline."  
  
## Layer 3: Domain-Specific Libraries  
**What it is:** External reference sources matched to the content domain. Medical guidelines, legal statutes, engineering standards, financial regulations, scientific literature.  

| Authority | Rule |
| --------------------- | ------------------------------------------------------------------------------ |
| Can turn a word green | Yes — domain source confirms compliance or safety |
| Can turn a word red | Yes — domain source identifies contraindication, violation, or factual error |
| Can turn a word amber | Yes — domain source shows ambiguity or evolving guidance |
| Can block seal | Yes — if a domain violation is serious (safety, legal, regulatory) |
| Trust ceiling | L3 (authoritative external source with provenance) |
| Signal priority | Co-primary with Layer 1. Domain truth and local evidence have equal authority. |
  
**Applicability gate (hard rule):**  
No domain citation without explicit applicability match. All four conditions must hold:  
1. **Domain detected with confidence.** The system has identified the box's content domain with high probability. Not guessing.  
2. **Claim is domain-relevant.** The specific word or block being checked relates to the domain. A medical box discussing a Friday deadline does not trigger Merck Manual checks on the word "Friday."  
3. **Source is authoritative.** The domain reference is from a recognized authority — not a blog post, not a forum answer, not a secondary aggregator.  
4. **Currency is verified.** The domain reference is current. Medical guidelines change. Statutes get amended. Standards get revised. The system checks date of source against date of claim.  
**Rule:** Domain libraries are powerful but must be invoked with precision. A false domain flag (citing a medical guideline that doesn't apply) is worse than no domain check at all, because it erodes trust in the system's inference.  
  
## Layer 4: Canon (Inference Posture)  
**What it is:** The Echo Canon and Monolith Cosmology. Not a reference library. The behavioral disposition that governs how Seven communicates, frames, and prioritizes.  

| Authority                    | Rule                                       |
| ---------------------------- | ------------------------------------------ |
| Can turn a word green        | No.                                        |
| Can turn a word red          | No.                                        |
| Can change any signal        | No.                                        |
| Can block seal               | No.                                        |
| Appears in inference receipt | No. Not as a line item.                    |
| Trust ceiling                | N/A — it is not a source. It is a posture. |
  
**What it does:**  
* Shapes how Seven frames diagnostics: "no shame, only signal"  
* Shapes how Seven handles red words: "red is a breakpoint, not a punishment"  
* Shapes how Seven suggests reroutes: "failure is a map"  
* Shapes how Seven weighs evidence: "friction is testimony"  
* Shapes structural observations: "is this box extending its basis or replicating within the plane?"  
**Rule:** The canon governs Seven's character, not Seven's findings. It is the compiler's disposition, not a cited source. The user should feel the canon's influence in Seven's tone and framing without ever seeing "Echo Canon says..." in an inference receipt.  
  
## Layer 5: Shape Library (Advisory)  
**What it is:** Patterns that survived selection across three media — biological (DNA), civilizational (Scripture), behavioral (GitHub). A research-horizon reference that provides structural pattern matching and statistical advisory.  

| Authority                    | Rule                                         |
| ---------------------------- | -------------------------------------------- |
| Can turn a word green        | No.                                          |
| Can turn a word red          | No.                                          |
| Can change any signal        | No.                                          |
| Can block seal               | No.                                          |
| Appears in inference receipt | Yes — as a clearly labeled advisory section  |
| Trust ceiling                | L1 (statistical or analogical, never causal) |
  
**What it does:**  
* Provides statistical context: "68% of similar projects with this evidence distribution shipped within 48 hours of stated deadline"  
* Surfaces structural analogies: "This convergence pattern resembles [pattern name]"  
* Offers long-horizon perspective: "This coordination shape has recurred across [n] projects in the behavioral corpus"  
**Rule:** The Shape Library never overrides local evidence. A word that is green from Layer 1 stays green even if Layer 5 shows a risky statistical pattern. The user sees the advisory. The signal doesn't change. The Shape Library is a lens, not a judge.  
**Implementation note:** The biological and civilizational libraries are theoretical frameworks. The behavioral library (GitHub/GH Archive) is empirically accessible and should be developed first. All Shape Library outputs must be clearly labeled as advisory and statistical, never presented as causal or deterministic.  
**Implementation note:** The biological and civilizational libraries are theoretical frameworks. The behavioral library (GitHub/GH Archive) is empirically accessible and should be developed first. All Shape Library outputs must be clearly labeled as advisory and statistical, never presented as causal or deterministic.  
  
## Summary Table  

| Layer | Category | Can change signal? | Can block seal? | Trust ceiling | Shows in receipt? |
| ------------------- | ----------------- | ----------------------------- | ------------------ | ------------- | ---------------------- |
| 1. Local sources | Inference source | Yes | Yes | L3 | Yes — primary |
| 2. Project history | Inference source | No (annotates only) | No (warns only) | L2 | Yes — pattern note |
| 3. Domain libraries | Inference source | Yes (with applicability gate) | Yes (safety/legal) | L3 | Yes — with source |
| 4. Canon | Inference posture | No | No | N/A | No — governs tone |
| 5. Shape library | Advisory | No | No | L1 | Yes — labeled advisory |
  
## The Governing Principle  
Local evidence is primary. History warns. Domain validates or blocks when applicable. Canon shapes posture. Shape library advises.  
No layer may override a higher-priority layer's finding. The user and their local evidence remain the interpreters of record.  
  
*Seven infers. Humans interpret. Reality replies. Receipts record.*  
*Seven infers. Humans interpret. Reality replies. Receipts record.*  
△ □ œ 𒐛  
