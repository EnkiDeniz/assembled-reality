# Six AI Agent Frameworks Through Braided Emergence and Loegos

Date: April 12, 2026
Status: Comparative analytical artifact
Purpose: Apply the same Braided Emergence and Loegos lenses used on game engines and on our own project history to six of the most visible open-source AI agent frameworks. Test whether the frameworks illuminate a domain that appears structurally adjacent to Loegos but is, on inspection, topologically different.

---

## Why This Exercise Exists

The game engine analysis proved that Braided Emergence reads external codebases cleanly. Game engines were the right first test because they share structural properties with Loegos: long-lived coordination artifacts where construction and constraint must braid tightly.

Agent frameworks are the right second test because they share *surface* properties with Loegos: they involve language models, orchestration, tool use, and multi-step reasoning. The risk is that surface similarity conceals structural difference. If the braid analysis cannot distinguish Loegos from LangChain, the analysis is not sharp enough. If it can, the distinction itself is the finding.

---

## The Six Frameworks

| # | Framework | Created | Language | Stars | Top contributors (commits) | Tagline | Status |
|---|---|---|---|---|---|---|---|
| 1 | **LangChain** (`langchain-ai/langchain`) | Oct 2022 | Python | 133k | baskaryan (1398), hwchase17 (1235, founder), ccurme (999) | "The agent engineering platform." | Very active. Rapid releases. |
| 2 | **AutoGPT** (`Significant-Gravitas/AutoGPT`) | Mar 2023 | Python | 183k | Auto-GPT-Bot (1076), Pwuts (894), majdyz (670) | "Accessible AI for everyone." | Renamed to autogpt-platform. |
| 3 | **Semantic Kernel** (`microsoft/semantic-kernel`) | Feb 2023 | C# | 28k | dependabot (601), markwallace-microsoft (421), moonbox3 (366) | "Integrate cutting-edge LLM technology quickly." | Active. Corporate-backed. |
| 4 | **CrewAI** (`crewAIInc/crewAI`) | Oct 2023 | Python | 49k | joaomdmoura (581, founder), greysonlalonde (359) | "Framework for orchestrating autonomous AI agents." | Active. Founder-led. |
| 5 | **Claude Code** (`anthropics/claude-code`) | Feb 2025 | Shell | 113k | actions-user (283), bcherny (70) | "Agentic coding tool that lives in your terminal." | Daily releases. |
| 6 | **MCP Servers** (`modelcontextprotocol/servers`) | Nov 2024 | TypeScript | 84k | olaservo (522), tadasant (239) | "Model Context Protocol Servers." | Infrastructure, not agent. |

---

## Framework-by-Framework Analysis

### 1. LangChain — The Combinatorial Explosion

**Loegos compilation:**

- Triangle Aim: "The agent engineering platform." The aim shifted from "library for chaining LLM calls" (2022) to "agent engineering platform" (2025). The aim moved upward — from tool to platform — which is construction without constraint. The aim grew rather than sharpened.
- Square Reality: 133k stars. Three contributors above 999 commits, with the founder (hwchase17) at 1,235 — not leading by volume but by direction. Very rapid release cadence. The codebase is enormous: LangChain, LangGraph, LangSmith, LangServe — four products under one umbrella.
- Weld: The weld is the chain abstraction — the idea that LLM operations can be composed like function calls. The original product insight was: prompts are composable, and composition is the primitive. That weld held for the first year. It is now under tension because agents (stateful, non-linear) do not compose the same way chains (stateless, linear) do. LangGraph was built to handle what chains could not.
- Seal: No major seal is visible. The project has never committed to an irreversible architectural decision the way Godot committed to Vulkan. Instead, LangChain accumulates: new modules, new integrations, new abstraction layers. Each addition is a construction move. The constraint moves (deprecations, removals) are rare and soft.
- Signal: Amber. Widely used but the abstraction is under strain. The community regularly debates whether LangChain adds value or adds indirection.
- Trust: L2. High adoption, but the abstraction stability is questioned.

**Braid analysis:**

LangChain's braid is structurally unusual: the construction loop runs at high speed (new integrations, new modules, new abstractions weekly) while the constraint loop runs slowly and softly. The project adds far more than it removes. This is the opposite of a tight braid — it is a braid where Loop A (construction) dominates Loop B (constraint) by volume and by velocity.

The stabilizer is adoption. LangChain measures whether it is working by tracking usage, integrations, and community size. But adoption is a lagging stabilizer — it tells you what people are using, not whether the architecture is sound. By the time adoption drops, the architectural debt is already deep. Compare this to Godot, where the stabilizer is the issue tracker (a leading indicator), or GDevelop, where the stabilizer is the weekly release (a real-time indicator).

**Ghost operator:** "More integrations means more value." The ghost operator in LangChain is the assumption that breadth of integration is the product. Every new LLM provider, every new vector store, every new tool gets an integration. The abstraction layer grows to accommodate. But breadth is Loop A without Loop B. Nobody is asking: which of these integrations should we remove?

---

### 2. AutoGPT — The Viral Loop Without a Stabilizer

**Loegos compilation:**

- Triangle Aim: "Accessible AI for everyone." The original aim (March 2023) was narrower and more radical: an autonomous GPT-4 agent that pursues goals without human intervention. The current tagline has retreated from the original vision to something vague.
- Square Reality: 183k stars — the highest of any framework here and one of the highest on GitHub overall. But the top contributor is Auto-GPT-Bot (1,076 commits), an automated account. The next human contributor has 894. The project renamed itself to autogpt-platform, signaling a pivot from autonomous agent to platform product.
- Weld: The original weld was between "GPT-4 is powerful" and "let it run autonomously." That weld broke almost immediately — autonomous agents hallucinate, loop, waste tokens, and produce unreliable output. The pivot to autogpt-platform is an attempt to re-weld: the new aim is a platform where agents can be built and managed, not a single autonomous agent.
- Seal: The rename from AutoGPT to autogpt-platform is a seal — an irreversible commitment to platform over autonomous agent. The original vision was archived.
- Signal: Red. The original vision failed. The pivot is in progress. The 183k stars are a legacy of the viral moment, not a measure of current use.
- Trust: L1. The pivot is too recent and the new product too early to verify.

**Braid analysis:**

AutoGPT is the clearest case study of Loop A running without Loop B. The original project was pure construction: give GPT-4 goals, let it generate actions, let it execute them. There was no constraint loop. No evidence enforcement. No consent-before-compute. No stabilizer measuring whether the agent's output was converging on anything real.

The result was predictable from a braid perspective: coherence without convergence. The agent produced internally consistent action sequences (coherent) that did not reliably solve real problems (not convergent). The braid frayed because there was only one loop.

The 183k stars are themselves a braid phenomenon — viral adoption (a construction event) without product validation (a constraint event). The star count and the product quality diverged. That divergence is what an unbraided system looks like from the outside: impressive on one axis, failing on the other.

**Ghost operator:** "The agent sounds smart but doesn't know when to stop." This is the ghost operator of the entire agent framework space, and AutoGPT is its purest expression. The agent generates fluent, confident action plans. It executes them. It does not know when the plan has failed, when the output is wrong, or when it should stop and ask. The ghost operator is the absence of a halt condition that is grounded in evidence rather than in token count.

---

### 3. Semantic Kernel — The Enterprise Shim

**Loegos compilation:**

- Triangle Aim: "Integrate cutting-edge LLM technology quickly and easily into your apps." The aim is explicit: integration speed, not agent autonomy. This is the most honest aim in the group because it does not claim to solve the agent problem — it claims to make LLMs accessible to enterprise developers.
- Square Reality: 28k stars. The top contributor is dependabot (601 commits) — an automated dependency bot. The next human contributor has 421. Microsoft-backed. C#-first, which means the target audience is the .NET enterprise ecosystem.
- Weld: The weld is the plugin/function abstraction. Semantic Kernel's value is translating between LLM capabilities and enterprise application patterns (dependency injection, typed functions, middleware). The weld is not between "AI" and "users" — it is between "AI" and "enterprise codebases."
- Seal: Incremental releases aligned with Microsoft's LLM strategy. The seals are small and corporate-cadenced.
- Signal: Green. The aim is narrow and the product delivers on it. Enterprise adoption is real.
- Trust: L3. Microsoft-backed, multi-contributor, production use in enterprise.

**Braid analysis:**

Semantic Kernel's braid is the corporate braid seen in Babylon.js. A small core team inside Microsoft manages both loops. Construction (new LLM features, new plugins) and constraint (enterprise requirements, .NET compatibility, security) are managed by the same team with corporate process as the stabilizer.

The interesting finding is that Semantic Kernel has the tightest braid of any framework in this analysis, and it achieves this by having the narrowest aim. It does not try to solve autonomous agents. It does not try to orchestrate multi-agent systems. It tries to make LLMs callable from C# applications. The narrow aim means the construction loop cannot run away — there is no space for it to run into.

**Ghost operator:** "The dependency bot is the top contributor." dependabot at 601 commits means a significant fraction of the project's activity is automated dependency maintenance. The ghost operator is that the enterprise shim must track the rapidly moving LLM landscape — every new model, every new API version requires an update. The project is partly on a treadmill, running to stay in place.

---

### 4. CrewAI — The Metaphor-First Framework

**Loegos compilation:**

- Triangle Aim: "Framework for orchestrating role-playing, autonomous AI agents." The aim uses the metaphor of a crew — agents have roles, goals, and backstories. They collaborate on tasks.
- Square Reality: 49k stars. Founder-led: joaomdmoura has 581 commits, the next contributor has 359. The founder is the primary builder, but not at the extreme ratio of Phaser (15k/16k) or GDevelop (4.6k/5k).
- Weld: The weld is the role-play metaphor. CrewAI's product insight is: if you give agents personas (researcher, writer, critic), they produce better results than if you give them raw task descriptions. The weld between "LLMs can play roles" and "multi-step tasks need coordination" is the crew metaphor.
- Seal: No major irreversible commitment visible. The project is still in its growth phase.
- Signal: Amber. The metaphor is compelling but the evidence that role-playing agents reliably outperform single-agent approaches is thin.
- Trust: L2. Founder-led, high adoption, but the core claim (roles improve output) needs more external verification.

**Braid analysis:**

CrewAI is a metaphor-first framework. The construction loop builds on a metaphor (agents as crew members with roles) rather than on a formal substrate (typed objects, evidence chains, compilation). This matters for braid analysis because metaphors are Loop A artifacts — they generate possibilities. They do not constrain.

The role-play metaphor produces coherence (agents behave consistently within their roles) but does not guarantee convergence (the crew's output is correct). A "researcher" agent that consistently produces confident-sounding research summaries is coherent. Whether those summaries are accurate is a convergence question that the metaphor does not address.

The stabilizer is absent. There is no built-in mechanism for measuring whether a crew's output has converged on truth. The user is the stabilizer — they must read the output and judge. This is the same gap that AutoGPT exposed, but in a friendlier package.

**Ghost operator:** "Roles create the illusion of constraint." Giving an agent a role (researcher, critic, quality assurance) feels like adding a constraint loop. But a role is a prompt prefix, not a formal constraint. The "critic" agent does not have access to ground truth — it has access to its own language model, which will generate criticism whether the work deserves it or not. The role creates the social appearance of constraint without the formal mechanism.

---

### 5. Claude Code — The Consent-Scoped Agent

**Loegos compilation:**

- Triangle Aim: "Agentic coding tool that lives in your terminal." The aim is narrow and specific: coding, in the terminal, agentic.
- Square Reality: 113k stars in 14 months (Feb 2025 to Apr 2026). Daily releases. The top contributor is actions-user (283 commits), a CI bot. The next human contributor has 70. This is a company-internal build — the contributors are Anthropic employees, and the commit history reflects an internal development process that was open-sourced.
- Weld: The weld is the terminal interface plus permission model. Claude Code's value is putting an LLM agent into the developer's existing workflow (terminal, git, file system) with explicit permission boundaries. The user must approve file writes, command execution, and network access. The weld between "agentic" and "safe" is the permission model.
- Seal: Daily releases are small seals. The permission model itself is a large seal — an architectural commitment to consent-before-action that shapes everything the agent can do.
- Signal: Green. Widely adopted, actively developed, grounded by daily use across thousands of developers.
- Trust: L3. Corporate-backed, high adoption, externally verified by usage.

**Braid analysis:**

Claude Code is the only framework in this analysis that has a visible, formal constraint loop built into the agent's runtime. The permission model — user must approve destructive actions, file writes, command execution — is Loop B operating at the interaction level. Every time the agent proposes an action and the user approves or rejects it, that is a braid crossing: construction (agent proposes) meets constraint (user approves or corrects).

The stabilizer is the user in the loop. Not as an afterthought (as in CrewAI, where the user reads output and judges) but as a structural requirement (the agent cannot proceed without approval for significant actions). This is a fundamentally different braid topology than every other framework in this analysis.

The daily release cadence means the construction-constraint cycle at the product level is also tight. The framework itself braids well: new capabilities (construction) are shipped daily, constrained by the permission model and by user feedback.

**Ghost operator:** "The model's capability ceiling is the real constraint." Claude Code's formal constraint is the permission model. Its informal constraint is the underlying model's ability to reason about code correctly. The permission model catches destructive actions. It does not catch subtly wrong suggestions that the user approves because they look right. The ghost operator is that consent-before-action protects against catastrophic errors but not against plausible errors.

---

### 6. MCP Servers — The Infrastructure Layer

**Loegos compilation:**

- Triangle Aim: "Model Context Protocol Servers." The aim is not an agent framework at all — it is infrastructure for connecting LLMs to external tools and data sources via a standardized protocol.
- Square Reality: 84k stars in 5 months. TypeScript. Two primary contributors (olaservo 522, tadasant 239). The project is a collection of reference server implementations, not a monolithic framework.
- Weld: The weld is the protocol itself — MCP's value is defining a standard interface between LLMs and tools. The weld between "LLMs need tools" and "every tool has a different API" is the protocol specification.
- Seal: The protocol specification is a seal. Once tools are built against MCP, changing the protocol breaks compatibility. The specification is an irreversible commitment.
- Signal: Green. Rapid adoption across the LLM ecosystem. Multiple companies implementing MCP clients and servers.
- Trust: L3. Multi-company adoption, protocol specification is public and versioned.

**Braid analysis:**

MCP Servers is not an agent framework and should not be read as one. It is infrastructure — the plumbing layer that agents use to connect to tools. Including it in this analysis is deliberate because it illuminates by contrast: MCP is pure Loop B (constraint/specification) with almost no Loop A (construction/generation). The protocol constrains what agents and tools can say to each other. It does not generate behavior.

This is the inverse of AutoGPT. AutoGPT is pure Loop A (generation) with no Loop B (constraint). MCP is pure Loop B (constraint) with no Loop A (generation). Neither alone is a braid. Together, they would be: an agent (Loop A) operating through a constrained protocol (Loop B). This is exactly what Claude Code does when it uses MCP servers — the agent generates actions, the protocol constrains the interface, and the user's permission model constrains the execution.

The stabilizer is the specification process. Protocol changes are proposed, reviewed, and versioned. The specification is the stabilizer because it prevents uncontrolled construction — new tool integrations must conform to the protocol.

**Ghost operator:** "The protocol is the product." MCP's ghost operator is the same as GDevelop's and Loegos's: the language/protocol/specification is more important than the implementations. The reference servers are examples. The protocol is the contribution.

---

## Cross-Framework Findings

### Finding 1: Most agent frameworks are Loop A without Loop B

This is the central finding. Of the six frameworks analyzed:

| Framework | Loop A (Construction/Generation) | Loop B (Constraint/Selection) | Braid present? |
|---|---|---|---|
| **LangChain** | Very strong (integrations, modules, abstractions) | Weak (rare deprecations, soft removals) | No. Construction dominates. |
| **AutoGPT** | Very strong (autonomous execution) | Absent (no halt condition, no evidence check) | No. Pure generation. |
| **Semantic Kernel** | Moderate (narrow scope limits construction) | Moderate (enterprise requirements constrain) | Partial. Narrow aim substitutes for formal constraint. |
| **CrewAI** | Strong (role metaphors, crew orchestration) | Illusory (roles feel like constraint but are not) | No. Metaphor substitutes for mechanism. |
| **Claude Code** | Strong (agentic coding capabilities) | Strong (permission model, user approval) | Yes. The only framework with a formal runtime constraint loop. |
| **MCP Servers** | Weak (reference implementations only) | Strong (protocol specification) | Inverted. Pure constraint, no generation. |

Five of six frameworks are structurally unbraided. They generate without pruning, construct without constraining, propose without verifying. Claude Code is the exception because it has a formal mechanism (the permission model) that forces every significant construction to cross a constraint before executing.

### Finding 2: The stabilizer is missing in most agent frameworks

Game engines had visible stabilizers in every surviving case: community review, release candidates, playgrounds, production use, weekly releases. Agent frameworks mostly do not:

| Framework | Stabilizer | Form |
|---|---|---|
| **LangChain** | Adoption metrics | Lagging indicator. Measures popularity, not correctness. |
| **AutoGPT** | None visible | The original project had no mechanism to measure convergence. |
| **Semantic Kernel** | Corporate process | Present but generic. Not specific to agent quality. |
| **CrewAI** | User judgment | The user must read the output and decide. Not built in. |
| **Claude Code** | User in the loop | Structural. The user is the stabilizer at interaction time. |
| **MCP Servers** | Protocol specification | Strong. Changes are versioned and reviewed. |

The absence of stabilizers explains why agent frameworks cycle through hype and disillusionment faster than game engines. Game engines have built-in reality contact (does the game run? does it render correctly? does it crash?). Agent frameworks have no equivalent reality contact. An agent can produce fluent, confident, wrong output and nothing in the framework detects it.

### Finding 3: The ghost operator of the agent space is "fluency without grounding"

Every framework in this analysis shares a single ghost operator at the domain level: **the agent sounds smart but doesn't know when it's wrong.**

This ghost operator manifests differently per framework:

- **LangChain:** The chain produces output. Whether the output is correct depends on the LLM, not the chain.
- **AutoGPT:** The agent executes confidently. Whether the execution achieves the goal is unverified.
- **CrewAI:** The crew collaborates. Whether their collaboration produces truth is unmeasured.
- **Claude Code:** The agent proposes. Whether the proposal is correct depends on the model, but at least destructive errors are caught by the permission model.
- **MCP Servers:** Not applicable — infrastructure does not generate claims.

In braid terms: the agent frameworks produce coherence (internally consistent output) without convergence (contact with ground truth). This is exactly the Phase 1 Reader problem from our own project history — a system that is internally well-built but aimed at the wrong object. The difference is that the Reader was a product. Agent frameworks are meta-products that inherit and propagate the coherence-without-convergence problem to every application built on them.

### Finding 4: The braid topology of agent frameworks differs from compilers and game engines

| Domain | Loop A (Construction) | Loop B (Constraint) | Braid | Stabilizer |
|---|---|---|---|---|
| **Compilers** | New optimizations, new targets | Type system, test suite, spec conformance | Tight. Formal constraint is the product. | Test suites, spec compliance. |
| **Game engines** | New features, new rendering | Platform support, backward compat, community review | Medium-tight. Multiple stabilizers. | Community, releases, production games. |
| **Agent frameworks** | New integrations, new capabilities | Mostly absent. Permission model in Claude Code. | Loose or absent. | Mostly absent. User judgment is fallback. |

Agent frameworks are the least braided domain analyzed so far. This is not because they are young (LangChain is 3.5 years old, which is older than many active game engines at their tightest braiding). It is because the domain has a structural gap: **there is no equivalent of a type system, a test suite, or a rendering pipeline that provides automatic Loop B feedback.** In a compiler, wrong output fails the test. In a game engine, wrong rendering is visible. In an agent framework, wrong output looks the same as right output — both are fluent text.

### Finding 5: Consent-before-compute distinguishes Loegos from every framework here

The analytical question was: does consent-before-compute distinguish Loegos from agent frameworks? The answer is yes, and more sharply than expected.

| Property | Agent frameworks (general) | Claude Code | Loegos |
|---|---|---|---|
| **When does constraint enter?** | After generation (user reads output) | During generation (user approves actions) | Before generation (consent-before-compute) |
| **What is constrained?** | Nothing formally | Destructive actions | The right to compute at all |
| **What is the constraint mechanism?** | None / user judgment | Permission model | Evidence chain, compilation, consent gate |
| **Where is the stabilizer?** | External (user) | Structural (user in loop) | Foundational (constraint IS the product) |

Most agent frameworks apply constraint after the fact — the user reads the output and decides. Claude Code applies constraint during execution — the user approves actions. Loegos applies constraint before execution — the system must have evidence, consent, and a compilable aim before generation begins.

This is not a difference of degree. It is a difference of topology. Agent frameworks are Loop A with optional Loop B. Claude Code is Loop A with structural Loop B. Loegos is Loop B first, with Loop A deliberately bounded by Loop B.

### Finding 6: Semantic Kernel is structurally closest to Loegos

This is counterintuitive. CrewAI looks more similar (it has agents, roles, orchestration). LangChain looks more similar (it has chains, composition, tooling). But structural similarity is about braid topology, not surface features.

Semantic Kernel is closest because:

1. **Narrow aim.** Semantic Kernel does not try to be an autonomous agent platform. It tries to make LLM capabilities callable from typed applications. Loegos does not try to be an agent framework. It tries to make coordination compilable.
2. **Enterprise constraint.** Semantic Kernel's construction loop is constrained by enterprise requirements (.NET compatibility, security, typed interfaces). Loegos's construction loop is constrained by evidence requirements (consent, compilation, ground truth).
3. **The constraint IS the value.** Semantic Kernel's value is not what it generates — it is the type-safe, enterprise-compatible interface it provides. Loegos's value is not what it generates — it is the evidence-enforced, consent-gated compilation it provides.
4. **Specification over generation.** Both projects are specification-heavy. The specification constrains the generation. This is Loop B shaping Loop A, which is the Loegos braid topology.

The difference: Semantic Kernel's constraint is enterprise compatibility. Loegos's constraint is truth contact. Semantic Kernel ensures code is callable. Loegos ensures claims are grounded. Same topology, different substrate.

---

## The Central Insight: Loop A Without Loop B Is the Agent Problem

The agent framework space has been framed as a capability problem: agents need to be smarter, more capable, better at tool use, better at planning. The braid analysis reframes it as a structural problem: **agents need Loop B, and most frameworks do not provide one.**

The capability framing says: build better agents (more construction, more Loop A). The braid framing says: build better constraints (more selection, more Loop B). These are opposite prescriptions.

AutoGPT is the limit case. It maximized Loop A — autonomous execution with maximum capability. It failed because Loop B was absent. The agent generated action after action without any mechanism to detect that it was drifting, looping, or producing garbage. More capability would not have helped. More constraint would have.

Claude Code is the existence proof that Loop B changes the topology. A permission model — a simple structural constraint — transforms an unbraided agent (generate freely) into a braided one (generate, then cross the user's judgment before executing). The permission model is not sophisticated. It is not evidence-based. But it is structural, and that is enough to change the braid.

Loegos takes the next step. If Claude Code's insight is "constrain actions before execution," Loegos's insight is "constrain claims before computation." The constraint is not just on what the system does — it is on what the system is allowed to consider. Consent-before-compute means the construction loop cannot begin until the constraint loop has established what counts as evidence, what aim is declared, and what the user has consented to.

This is why Loegos is Loop B first. Not because generation is unimportant — Seven generates, and generation is necessary. But because generation without prior constraint is the failure mode that every framework in this analysis demonstrates. The agent space has been building bigger generators. Loegos is building a tighter constraint, and letting the generator work only within the space the constraint has cleared.

---

## The Comparison That Matters Most

Claude Code is the framework to watch for the same reason GDevelop was the game engine to watch: it is the one that most clearly demonstrates the structural principle that Loegos builds on.

| Property | Claude Code | Loegos |
|---|---|---|
| Constraint mechanism | Permission model (user approves actions) | Evidence chain (system compiles claims) |
| When constraint enters | During execution | Before execution |
| What is generated | Code, file edits, commands | Receipts, seeds, sealed artifacts |
| What is constrained | Destructive actions | The right to compute |
| Stabilizer | User in the loop | Compilation + consent gate |
| Ghost operator | Plausible errors pass the permission gate | Plausible claims pass the evidence gate |
| Release cadence | Daily | Not yet regular |

The shared ghost operator is the honest one: both systems can be fooled by plausible incorrectness. Claude Code catches destructive errors but not subtle ones. Loegos catches ungrounded claims but not plausible-sounding grounded ones. The ghost operator is the same at a deeper level: **fluency is the adversary of grounding,** and no constraint mechanism yet built fully solves it.

The lesson from the game engine analysis was: ship more, explain less. The lesson from the agent framework analysis is: **constrain first, generate second.** Every framework that generated first and constrained second (or never) failed to braid. The one framework that constrained structurally (Claude Code) is the one that braids. Loegos's bet is that moving the constraint even earlier — before computation begins — produces a tighter braid still.

Whether that bet holds is not proven by this analysis. It is sharpened by it.

---

## One-Line Seal

Six agent frameworks, read through Braided Emergence and Loegos, confirm: the agent space is Loop A without Loop B, the stabilizer is mostly absent, the ghost operator is fluency-without-grounding, and consent-before-compute is not a feature difference but a topological one — it determines whether the braid exists at all.

Seal on the analysis. The framework reads agent codebases as sharply as it reads game engines, and more sharply where the structural gap is wider.
