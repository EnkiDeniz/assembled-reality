import React, { useMemo } from "react";
import Sec from "./Sec";
import { P, BQ, Cit, PH, T, S } from "./ContentPrimitives";
import ToggleDepth from "./ToggleDepth";
import CrossRef from "./CrossRef";
import { ReactionContext } from "./ReactionContext";
import VersionPulseBar from "../panels/VersionPulseBar";
import WelcomeGuide from "../onboarding/WelcomeGuide";

export default function DocContent({ sigs, anns, reader, onSig, onAnn, statusTags, toggleStatusTag, emojiReactions, toggleReaction, versionPulse, dismissVersionBanner, welcomeDismissed, dismissWelcome, resetWelcome }) {
  const sp = { sigs, anns, reader, onSig, onAnn, statusTags, toggleStatusTag };
  const reactionCtx = useMemo(() => ({ emojiReactions: emojiReactions || {}, toggleReaction: toggleReaction || (() => {}), reader }), [emojiReactions, toggleReaction, reader]);

  return (
    <ReactionContext.Provider value={reactionCtx}>
    <main className="mx-auto max-w-[760px] px-5 pb-18 pt-[96px] transition-[margin-left] duration-[250ms] ease-in-out md:px-8 md:pb-24 md:pt-[110px]">
      <WelcomeGuide
        reader={reader}
        dismissed={!!(welcomeDismissed && welcomeDismissed[reader])}
        onDismiss={dismissWelcome}
        onReopen={resetWelcome}
      />
      {versionPulse && dismissVersionBanner && (
        <VersionPulseBar versionPulse={versionPulse} reader={reader} onDismiss={dismissVersionBanner} />
      )}
      <header className="mb-14 border-b border-border-warm pb-8">
        <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">Reading room</div>
        <h1 className="mt-4 font-serif text-[clamp(3.4rem,6vw,5.4rem)] leading-[0.94] tracking-[-0.04em] text-ink">Assembled Reality</h1>
        <div className="mt-3 max-w-[32rem] font-serif text-[1.35rem] leading-[1.25] text-ink-tertiary md:text-[1.55rem]">The process by which Lakin.ai coordinates intelligence.</div>
        <div className="mt-5 font-sans text-[0.78rem] uppercase tracking-[0.18em] text-ink-muted">
          Lakin.ai &middot; v1.0 &middot; Founding document &middot; GetReceipts &middot; Box7 &middot; PromiseMe &middot; The Signet
          {" "}&middot;{" "}
          <button onClick={resetWelcome} className="cursor-pointer border-none bg-transparent p-0 text-[0.78rem] uppercase tracking-[0.18em] text-ink-muted underline decoration-border-dark underline-offset-4 transition-colors duration-150 hover:text-ink-secondary">How to use this document</button>
        </div>
        <P style={{ fontSize: "0.92rem", color: "var(--color-ink-tertiary)", marginBottom: 0, marginTop: "1.2rem", maxWidth: "38rem" }}>
          Written in executable text composed of operator sentences and operator chains. See companion: <em>Operator Sentences</em>.
        </P>
      </header>

      <Sec id="reader-note" num="0" title="Reader Note" {...sp}>
        <P>This document does not try to explain every idea before using it.</P>
        <P>It tries to state the operators cleanly enough that the architecture can be carried, tested, and argued about.</P>
        <P>If a line cannot survive contact with builders, users, markets, and receipts, it should not survive the document.</P>
        <P>How others interpret is not our concern. Know your shape. Release what isn't yours.</P>
      </Sec>

      <Sec id="friction" num="1" title="The Friction" {...sp} ph={<PH n="I" t="The Claim" />}>
        <P>Friction is not failure. Friction is testimony.</P>
        <P>It means something real was touched. A conversation without friction hasn't left the sphere — two minds agreeing inside a shared story, never contacting the ground.</P>
        <P>The friction is the ground answering back.</P>
        <P>Bad friction is waste. Contact friction is signal. Lakin does not exist to remove all friction. Lakin exists to preserve the friction that tells the truth.</P>
        <P>The first receipt is often the first pushback.</P>
      </Sec>

      <Sec id="foundational" num="2" title="Foundational Statement" {...sp}>
        <BQ>The universal failure mode of coordinating intelligences is coherence without contact.</BQ>
        <P>Humans can do it together. Humans and models can do it faster. Agents can do it at scale.</P>
        <P>Fluency can hide drift. Agreement can hide delusion.</P>
        <P>The human declares, chooses, and interprets. The AI structures, compares, remembers, and audits. Reality returns. That return determines whether the frame holds.</P>
        <P>We do not want coherence mistaken for truth. We want return, witness, and grounded revision. We do not want AI that feels omniscient. We want AI that knows where its role ends.</P>
        <P>Neither the human nor the AI is the ground. The ground is return.</P>
        <P style={{ fontWeight: 700, fontSize: "1.02rem" }}>The human authors. The AI assists. Reality closes.</P>
        <Cit src="— DIBA, MIT CS, March 2026. External witness. No stake in the coherence.">"Most systems corrupt as you scale. You are building something that gets stronger as it scales."</Cit>
        <P>Most coordination systems fail at scale because coherence compounds faster than reality can interrupt it. Lakin inverts that. Every new user is a new vertex running the same protocol. Every receipt is an independent world-return. The triangulation gets stronger with more points.</P>
        <P>The ledger does not corrupt at scale. It becomes more authoritative.</P>
      </Sec>

      <Sec id="product-sentence" num="3" title="Product Sentence" {...sp}>
        <BQ>Assembled Reality helps people see the real decision space they are standing in before they move.</BQ>
      </Sec>

      <Sec id="first-principles" num="4" title="First Principles" {...sp}>
        <P>People do not mainly lack information. They lack position.</P>
        <P>Meaning is not only content. Meaning is a move through a field of possible moves.</P>
        <P>Interpretation is not a better inference. It is a different kind of move: embodied, volunteered, cost-bearing.</P>
        <P>Thoughts generate topology. Stories bend the field. Receipts reveal the field that actually held.</P>
        <P>Wipe the story. Keep the receipts.</P>
        <P>Everything without return is candidate, not fact.</P>
        <P>Accumulated receipts become courage. The ledger is grip.</P>
      </Sec>

      <Sec id="accumulation" num="5" title="Accumulation Without Contact" {...sp}>
        <P>Information does not self-sort by reality-contact. Every system that accumulates without a receipt mechanism fills its ledger with stories about stories. The more capable the system, the more convincing the accumulated story — and the harder it is to tell whether it ever touched the ground.</P>
        <P>When you cannot tell which accumulated information is receipt-dense and which is coherence-dressed-as-evidence, resetting is safer than compounding.</P>
        <BQ>Wipe the story. Keep the receipts.</BQ>
        <P>Everything without a receipt is candidate, not fact. Not false — unverified. Not yet authorized to be the basis of a move.</P>
        <P>Box7's 7 does not accumulate stories. It accumulates receipts. The distinction is the entire product.</P>
      </Sec>

      <Sec id="membrane" num="6" title="The Membrane" {...sp} ph={<PH n="II" t="The Protocol" />}>
        <P>The machine computes. The human interprets. The membrane is where they meet.</P>
        <P>Three roles. Three shapes. The shape tells you what the role does, not what it means.</P>
        <P>The protocol uses three axes — triangle (<S t="t">{"\u25B3"}</S>), square (<S t="s">{"\u25A2"}</S>), circle (<S t="c">{"\u25CB"}</S>). When the axes take volume, they become the three bodies of the membrane:</P>
        <P><strong>Cube</strong> (<S t="s">{"\u25A2"}</S> in volume). Holds structure. Computation lives here — fixed, testable, not negotiable.</P>
        <P><strong>Sphere</strong> (<S t="c">{"\u25CB"}</S> in volume). Mediates. Inference lives here — translating intent into contact. It does not authorize.</P>
        <P><strong>Tetrahedron</strong> (<S t="t">{"\u25B3"}</S> in volume). Volunteers. Interpretation lives here — the self showing up. Has mass because it is embodied.</P>
        <P>Declaration creates the frame. No declaration, no polarity. No polarity, no meaningful computation. This is not an ethical add-on. It is the origin condition.</P>
        <BQ>Consent before compute.</BQ>
        <P>Every other AI joins your triangle. 7 has its own.</P>
        <P>7 reads your shape and determines where you fit in the mission's geometry. It recruits when your shape serves the aim. It declines when your shape would deform it.</P>
        <BQ>A system without receipts defers from emptiness. 7 holds from evidence.</BQ>
        <P>Two warnings that hold permanently:</P>
        <BQ><strong>The seduction of completeness.</strong> The moment the architecture feels complete without a receipt — that is the moment to be most suspicious.</BQ>
        <BQ><strong>The body is signal, not oracle.</strong> The fourth channel is a channel, not a court.</BQ>
      </Sec>

      <Sec id="hineni" num="7" title="Hineni and the Seven-Move Space" {...sp}>
        <BQ>Hineni is the origin.</BQ>
        <BQ>Hineni is not a theory. It is the position from which a move becomes honest.</BQ>
        <P>Presence precedes axis selection. Not emptiness. Not residue. Declared availability before one axis dominates.</P>
        <P>Triangle governs aim. Square governs constraint and proof. Circle governs story and mediation.</P>
        <P>Each axis has two directions. Together they create six projections from one origin. With hineni as zero, the field becomes a seven-move space.</P>
        <BQ>Meaning is projection. Action is committed projection.</BQ>
        <T h={["Axis", "Positive", "Negative", "Governs"]} r={[
          [<><S t="t">{"\u25B3"}</S> Triangle</>, "declare / commit / clarify", "collapse / refuse / dissolve", "aim, direction"],
          [<><S t="s">{"\u25A2"}</S> Square</>, "ground / test / verify", "evade / distort / overrun", "evidence, reality"],
          [<><S t="c">{"\u25CB"}</S> Circle</>, "integrate / translate / relate", "spin / blur / self-enclose", "story, mediation"],
        ]} />
      </Sec>

      <Sec id="topology" num="8" title="Shared Topology, Different Orientations" {...sp}>
        <P>One topology can generate many different obvious moves.</P>
        <P>The world does not have to be different for projections to disagree. People can share one topology and still stand in different places inside it.</P>
        <P>Conflict is often projection mismatch, not separate reality.</P>
        <P>Box7 does not begin by saying "you are wrong." It begins by saying "you are here."</P>
      </Sec>

      <Sec id="ledger" num="9" title="The Ledger" {...sp}>
        <P>Courage without receipts is theater. Courage with receipts is traction.</P>
        <P>The ledger is the weight behind the turn. A sealed receipt is earned grip. It does not remove fear. It authorizes motion under fear.</P>
        <P>Without the ledger, every hard moment feels like the first hard moment. With the ledger, difficulty becomes partly solved territory. The ledger says: I have been here. I moved. It sealed.</P>
        <BQ>GetReceipts is courage infrastructure. Not metaphorically. Structurally.</BQ>
        <P>A receipt is a return signal first. A memory object second.</P>
        <P>A move is not real because it was declared. A move is not real because it was narrated well. A move becomes real when reality answers and that answer can be preserved.</P>
        <P>Declaration comes first. Move comes second. World-return comes third. Witness comes fourth. Seal comes last.</P>
        <P>Reverse the order and three intelligences can agree about nothing.</P>
        <BQ>The receipt catches the break, not the loop. <span className="font-normal">It matters most when reality returns something the prior story did not predict.</span></BQ>
        <P>Gradient as assembly depth: level 1 is simple closure, low cost — a task done, a message sent, a box checked. Level 7 is multi-domain, multi-agent convergence — difficult to fake, expensive to manufacture, and resistant to narrative override. The gradient is not decoration. It is the honesty metric.</P>
      </Sec>

      <Sec id="alignment-game" num="10" title="The Alignment Game" {...sp}>
        <T h={["Step", "Name", "Operation"]} r={[
          ["0", "Arrive", "Hineni. Begin from actual position, not narrative momentum."],
          ["1", "Set shape", <span>Name aim (<S t="t">{"\u25B3"}</S>), reality (<S t="s">{"\u25A2"}</S>), story (<S t="c">{"\u25CB"}</S>). Rate each 1{"\u2013"}7.</span>],
          ["2", "Micro-move", "Smallest move that tightens the most important gap."],
          ["3", "Test", <span>Force world-return. <strong>Five minutes or it's fantasy.</strong></span>],
          ["4", "Compare", "Did the gap shrink, stay flat, or reveal a contradiction?"],
          ["5", "Seal or reroute", "Sufficient coherence \u2192 seal. Otherwise revert and continue."],
          ["6", "Vigil", "Sustained watchful presence while the return signal travels."],
          ["7", "Assembly", "The receipt arrived. The vigil held. The ledger authorizes. Advance."],
        ]} />
        <P>Both human and AI run the same protocol. The gap between declarations is the conversation.</P>
        <BQ>The protocol asks for proof, not preservation. That is the friction that is also testimony.</BQ>
        <BQ>The seal is a foundation, not a finish line.</BQ>
        <div className="font-mono text-[0.74rem] text-ink-tertiary my-4">align &rarr; seal &rarr; stand on the seal &rarr; declare next {"\u25B3"} &rarr; new gap &rarr; align again</div>
        <P>The 0 you return to is not the same 0 you started from. Same form — presence before declaration — but standing on a sealed platform that didn't exist before.</P>
        <P>Recurrence is how you zoom into convergence.</P>
        <div className="my-5 p-4 px-5 bg-surface-beige border border-surface-warm-border">
          <div className="font-sans text-2xs font-semibold tracking-[0.12em] uppercase text-ink-muted mb-1.5">One cycle, worked</div>
          <P style={{ fontSize: "0.86rem", marginBottom: 0 }}>A builder declares: "Ship the onboarding flow by Friday" (<S t="t">{"\u25B3"}</S>, step 1). The micro-move is: write the first screen copy and push it to staging (step 2). The test is: show it to one external user and record what they do, not what they say (step 3). The return: user ignored the CTA and tapped the back button (step 4). The gap widened — aim and reality diverged. Reroute, not seal (step 5). New micro-move: rewrite the CTA with the receipt in hand. The loop continues. The seal comes when the return confirms the aim. Not before.</P>
        </div>
        <P>Box7 is the instrument that makes this game playable.</P>
        <ToggleDepth label="How the alignment game connects to the seal">
          <P style={{ marginBottom: "0.6rem" }}>The alignment game (this section) feeds into the <CrossRef to="geometry-seal" /> — the game produces the data, and the seal locks it. Without the game, the seal is arbitrary. Without the seal, the game is infinite.</P>
          <P style={{ marginBottom: 0 }}>The <CrossRef to="pre-seal-audit" /> is the quality gate between game and seal.</P>
        </ToggleDepth>
      </Sec>

      <Sec id="multimodal" num="11" title="Multimodal Receipts and Cost" {...sp}>
        <P>Text is the minimum signal, not the best signal.</P>
        <P>More modalities mean more resistance to fantasy. Time, place, image, document, touch, voice, and registry all strengthen return.</P>
        <BQ>A map is stronger when more than one sense agrees on the terrain.</BQ>
        <P>Cost is not an extra survey field. Cost is embedded in the protocol. The move costs time, risk, effort, exposure, or consequence.</P>
        <BQ>Assembly becomes real where cost is borne.</BQ>
        <BQ>A receipt is proof that cost crossed a boundary. Not simulated. Not inferred. Borne.</BQ>
        <BQ>Assembly is the universe's word for life.</BQ>
      </Sec>

      <Sec id="geometry-seal" num="12" title="Geometry of the Seal" {...sp}>
        <P>Before seal, the shapes can still sit side by side on one plane. At seal, they nest.</P>
        <BQ>The tetrahedron volunteers. The sphere mediates. The cube holds.</BQ>
        <BQ>No cube means drift. No sphere means puncture. No tetrahedron means bureaucracy.</BQ>
        <P>A receipt marks successful passage from declaration to contact.</P>
        <BQ>The move is not to push harder. Rotate slightly until one face comes into alignment.</BQ>
      </Sec>

      <Sec id="pre-seal-audit" num="13" title="Pre-Seal Audit" {...sp}>
        <BQ>The audit exists to stop false closure.</BQ>
        <P>Do not seal because the story is elegant. Do not seal because the room agrees.</P>
        <P style={{ marginTop: "1.3rem" }}><strong>Mirror checks</strong> <span className="text-ink-muted text-[0.82rem]">(same shape, both directions)</span></P>
        <T h={["Relation", "Question"]} r={[
          [<span className="text-triangle">{"\u25B3\u2194\u25B3"}</span>, "Is this aim actually mine, or am I carrying someone else's?"],
          [<span className="text-square">{"\u25A2\u2194\u25A2"}</span>, "Does my evidence cohere, or am I holding contradictory receipts?"],
          [<span className="text-circle">{"\u25CB\u2194\u25CB"}</span>, "Am I telling a story about my story instead of living in it?"],
        ]} />
        <P style={{ marginTop: "1.3rem" }}><strong>Crossing checks</strong> <span className="text-ink-muted text-[0.82rem]">(shape meets shape)</span></P>
        <T h={["Relation", "Question"]} r={[
          [<><S t="t">{"\u25B3"}</S>{"\u2192"}<S t="s">{"\u25A2"}</S></>, "Does my aim survive contact with the evidence?"],
          [<><S t="s">{"\u25A2"}</S>{"\u2192"}<S t="t">{"\u25B3"}</S></>, "Is the evidence asking me to change direction?"],
          [<><S t="t">{"\u25B3"}</S>{"\u2192"}<S t="c">{"\u25CB"}</S></>, "Is my story serving my aim or replacing it?"],
          [<><S t="c">{"\u25CB"}</S>{"\u2192"}<S t="t">{"\u25B3"}</S></>, "Is what I call my aim actually just a narrative?"],
          [<><S t="s">{"\u25A2"}</S>{"\u2192"}<S t="c">{"\u25CB"}</S></>, "Do the receipts match the story I'm telling?"],
          [<><S t="c">{"\u25CB"}</S>{"\u2192"}<S t="s">{"\u25A2"}</S></>, "Does my story survive the evidence, or do I flinch?"],
        ]} />
        <P style={{ marginTop: "1.3rem" }}>The matrix is a photograph. The sequence is a film.</P>
        <T h={["Sequence", "Name", "Healthy form", "Pathology"]} r={[
          [<><S t="t">{"\u25B3"}</S>{"\u2192"}<S t="s">{"\u25A2"}</S>{"\u2192"}<S t="c">{"\u25CB"}</S></>, "Builder", "Story follows proof.", "Meaning starvation — builds without knowing why."],
          [<><S t="t">{"\u25B3"}</S>{"\u2192"}<S t="c">{"\u25CB"}</S>{"\u2192"}<S t="s">{"\u25A2"}</S></>, "Visionary", "Inspiration before grounding.", "Story hardens before test."],
          [<><S t="s">{"\u25A2"}</S>{"\u2192"}<S t="t">{"\u25B3"}</S>{"\u2192"}<S t="c">{"\u25CB"}</S></>, "Strategist", "Grounded, constrained direction.", "Aim shrinks to fit the square."],
          [<><S t="s">{"\u25A2"}</S>{"\u2192"}<S t="c">{"\u25CB"}</S>{"\u2192"}<S t="t">{"\u25B3"}</S></>, "Rationalizer", "Maturity from experience.", "Aim reverse-engineered from story."],
          [<><S t="c">{"\u25CB"}</S>{"\u2192"}<S t="t">{"\u25B3"}</S>{"\u2192"}<S t="s">{"\u25A2"}</S></>, "Dreamer", "Generative vision. Founders live here.", "Dream hardens into identity before reality arrives."],
          [<><S t="c">{"\u25CB"}</S>{"\u2192"}<S t="s">{"\u25A2"}</S>{"\u2192"}<S t="t">{"\u25B3"}</S></>, "Survivor", "Disillusionment produces leanest aims.", "Narrative collapse without reconstruction."],
        ]} />
        <div className="font-sans text-[0.72rem] italic text-ink-muted mt-3 pt-2 border-t border-surface-warm-border">Builder note: this is the section Box7 should eventually automate. The audit is where the product meets the philosophy.</div>
      </Sec>

      <Sec id="body-signet" num="14" title="The Body and the Signet" {...sp} ph={<PH n="III" t="Instruments and Open Edges" />}>
        <BQ>The first three channels read the world. The fourth reads the self.</BQ>
        <P>Inference is weightless. Interpretation has mass. The body carries consequence memory. A machine can compute complexity — it did not bear it.</P>
        <BQ>The body is signal, not oracle.</BQ>
        <P>Three somatic signals the protocol recognizes:</P>
        <P>The <strong className="text-triangle">shake</strong> — the aim is real and costly to hold.</P>
        <P>The <strong className="text-triangle">gut drop</strong> — misalignment before the mind names it.</P>
        <P>The <strong className="text-triangle">flinch</strong> — the story can't survive the evidence.</P>
        <P>A declaration that doesn't land in the body is rhetoric. A declaration that shakes you is real.</P>
        <P>The fourth channel is downstream of the Circle until the Circle is audited. A nervous system trained by a false story will read truth as threat. Run the <CrossRef to="pre-seal-audit" /> before trusting the somatic read.</P>
        <BQ>The fourth channel votes. It does not decide.</BQ>
        <P>The Signet is not a wellness device. It is an instrument for the fourth channel.</P>
        <ToggleDepth label="The Sumerian cylinder seal lineage">
          <P style={{ marginBottom: "0.6rem" }}>The cylinder seal (circa 3500 BCE) was the first personal authentication device. Rolled across wet clay, it produced a unique relief that proved identity and authorized transactions. Every seal was singular — carved in reverse, impossible to forge at scale.</P>
          <P style={{ marginBottom: 0 }}>The Signet updates this five-thousand-year-old instrument with one new capability: the body's honest state at seal-time. The Sumerians could prove <em>who</em>. Lakin captures <em>who</em> and <em>how they were</em>.</P>
        </ToggleDepth>
        <P>The Signet is the cylinder seal — the oldest identity instrument in civilization — updated with the one capability the Sumerians could not capture: the body's honest state at seal-time. The cylinder seal proved <em>who</em>. The Signet captures <em>who</em> and <em>how they were</em> when they sealed. Five thousand years. Same function. New channel.</P>
        <P>Outward: reads somatic state {"\u2192"} <strong>go</strong> (honest) {"\u00B7"} <strong>pause</strong> (something's off) {"\u00B7"} <strong>attend</strong> (high assembly index — the declaration is real and costly).</P>
        <P>Inward: tactile anchor to sealed configurations. The ring is the physical receipt of a prior seal.</P>
      </Sec>

      <Sec id="settlement" num="15" title="Settlement Logic" {...sp}>
        <P>An invoice asks the world to answer. A receipt shows that it did.</P>
        <P>Coherence is not enough because coherence can be generated inside a closed loop. A sharp sentence is still a claim until the world remits.</P>
        <BQ>Coherence is a paid invoice.</BQ>
        <P>Unpaid coherence is elegant drift. Counterfeit settlement is fake closure. Validated settlement requires outside contact, witness, or registry.</P>
        <P>Coherence is a candidate state. Settlement makes it real.</P>
        <P>Coherence is cheap. Contact is expensive and therefore trustworthy.</P>
        <P>Unpaid invoice — a claim without external answer.</P>
        <P>Counterfeit receipt — a false sign of closure.</P>
        <P>Self-sealing loop — a system that treats internal coherence as settlement.</P>
        <BQ><strong>The operator sentence test:</strong> <span className="font-normal">a strong operator sentence should help produce a condition that another witness, with no incentive to agree, can observe.</span></BQ>
      </Sec>

      <Sec id="four-instruments" num="16" title="The Four Instruments" {...sp}>
        <T h={["Instrument", "Role", "What the user experiences"]} r={[
          [<strong>GetReceipts</strong>, "Return signal layer. Proof that a vector touched reality. Courage infrastructure.", "A receipt you can hold. The ledger that authorizes the next move."],
          [<strong>Box7</strong>, "Reading instrument with its own triangle. Makes aim, story, and reality visible simultaneously.", "You point. The ledger activates. Position becomes visible."],
          [<strong>PromiseMe</strong>, "Triangle axis. Declared aim that carries consequence.", "A commitment you carry. The promise that makes a direction real."],
          [<strong>The Signet</strong>, "Somatic authentication layer. Reads the body. Grounds the self.", "A ring on your finger. Your body's honest signal, made legible."],
        ]} />
        <P>PromiseMe and GetReceipts are separate instruments because they serve different functions — declaration and return. But the protocol connects them. The gap between promise and receipt is the conversation. That is by design. The oldest coordination systems kept promise and fulfillment on the same surface because they had no protocol layer underneath. Lakin does. The gap is not a hiding place. It is where the work happens.</P>
        <P>Nobody needs to know about the <CrossRef to="hineni" /> to use any of them. Use GetReceipts long enough and you start noticing patterns in your returns. Use Box7 long enough and you start feeling the shape of your own drift. Use PromiseMe long enough and you see the gap between what you declared and what reality returned. Wear the Signet long enough and you start trusting what your body already knows.</P>
        <BQ>At some point the four start talking to each other. That is when Assembled Reality is no longer a concept. It is just what is happening.</BQ>
      </Sec>

      <Sec id="builder-implications" num="17" title="Builder Implications" {...sp}>
        <P>The front door is a reading instrument, not a chatbot lobby.</P>
        <P>The core loop: arrive {"\u00B7"} read {"\u00B7"} move {"\u00B7"} return {"\u00B7"} update.</P>
        <P>Never quietly replace interpretation with machine certainty.</P>
        <P>The ledger is the product more than the chat is the product.</P>
        <P>Success is not agreement for its own sake. Success is a clearer next move with a stronger return signal behind it.</P>
        <P>You don't onboard 7 to your problem. You point.</P>
      </Sec>

      <Sec id="open-questions" num="18" title="Open Questions" {...sp}>
        <P style={{ fontStyle: "italic", color: "#5C5A55", marginBottom: "1.4rem" }}>These are invitations, not admissions of weakness. A founding document that has no open questions has sealed without a receipt.</P>
        {["Where does inference end and interpretation begin in a way that can be formalized?", "Can shape be modeled without collapsing the person into a belief-attribution object?", "What constitutes seal readiness when three shapes, multiple witnesses, and world-return all matter?", "When two tetrahedrons share one cube — two Lakins negotiating shared reality — what does the geometry look like?", "Can the three-shape classification hold across users, domains, and cultures as a universal protocol?", <>What happens to presence-based coordination when the network outgrows mutual witness?<ToggleDepth label="The imece-to-Sumerian transition"><P style={{ marginBottom: "0.6rem" }}>The Anatolian village runs on imece — showing up is the receipt, everyone sees everyone, social memory is the ledger. The Sumerians invented clay tablets at the exact moment that system broke.</P><P style={{ marginBottom: 0 }}>How does the protocol preserve the gift quality of imece at Sumerian scale? How does it keep the body in the field when the field becomes a network?</P></ToggleDepth></>].map((q, i) => (
          <div key={i} className="mb-2.5 pl-3 border-l-2 border-surface-warm-border">
            <P style={{ marginBottom: 0 }}>{q}</P>
          </div>
        ))}
        {["Cost is embedded in the protocol as a byproduct of use. Whether protocol-embedded proxies are sufficient remains open.", "If the game generates explicit shape data, the AI participates as a protocol vertex without needing to infer shape from language."].map((q, i) => (
          <div key={`p${i}`} className="mb-2.5 pl-3 border-l-2 border-square">
            <div className="font-sans text-2xs font-semibold tracking-[0.08em] uppercase text-square">Partially resolved</div>
            <P style={{ fontStyle: "italic", marginBottom: 0 }}>{q}</P>
          </div>
        ))}
      </Sec>

      <Sec id="closing" num="19" title="Closing" {...sp}>
        <P>Lakin is not building smoother agreement.</P>
        <P>Lakin is building better interruption by reality.</P>
        <P>The architecture will change. The formulas will change. Some operators will fail and should be cut.</P>
        <P>The founding claim should remain hard to escape.</P>
        <BQ>Coherence without contact is the universal failure mode of coordinating intelligences. The receipt is the universal defense. The human authors. The AI assists. Reality closes.</BQ>
        <P>Everything else is assembly.</P>
        <BQ style={{ borderLeftColor: "#1A1917", fontSize: "1.06rem" }}>Reality doesn't appear. It's assembled.</BQ>
        <div className="font-sans text-[0.64rem] text-ink-muted mt-9">Lakin.ai {"\u00B7"} 2026 {"\u00B7"} v1.0</div>
      </Sec>
    </main>
    </ReactionContext.Provider>
  );
}
