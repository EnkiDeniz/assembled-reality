# Engineer Proposal: Working Echo Testing

Date: April 11, 2026
Author: Engineer
Status: Proposed

## 1. The Correction

Our previous testing direction was useful, but it still missed the product's real center.

We kept asking versions of:

> "Is Lœgos better than chat?"

or:

> "Is the law kernel healthier than plain conversation?"

Those are worth asking, but they are not the whole product question.

The deeper question is:

> "Does the system create a visible working echo that helps the next reply become more accurate, more discriminating, and more honest?"

That is what the earlier prototypes were doing for you.

You were not only reading Seven's answer.
You were also seeing what was being taken down:

- the aim that seemed to be forming
- the evidence being carried
- the tension still unresolved
- the possible move signal

And then you were shaping your next reply against that surface.

That means the real object is not just:

- assistant answer
- canonical truth

It is:

- assistant answer
- working echo
- canonical truth

We have been testing the first and third more than the second.

## 2. What The Product Is Actually Claiming

Lœgos is not only claiming:

- better truth boundaries
- better closure law
- better proposal/canon separation

It is also implicitly claiming:

- the conversation can externalize a shared, provisional read
- that provisional read can help the user answer better
- the user and Seven can co-create a better echo over multiple turns

That is a stronger and more human claim than "the system has law."

It also means our recent benchmark was blindfolded in the wrong way.

## 3. What Went Wrong In The Earlier Benchmark

The earlier benchmark tested the system as if the evaluator only had access to the final answer text.

That is effectively a blindfold.

But if the product is supposed to help through a visible working echo outside the chat, then a benchmark that hides that surface is not testing the actual product experience.

So the benchmark was not only asking the wrong question. It was also hiding one of the product's main advantages.

To be clear:

- the law kernel tests are still valid and necessary
- the shell benchmark is still useful
- but neither of those tells us whether the visible working echo is helping the next turn

That is the missing benchmark.

## 4. New Core Thesis

We should now test this:

> "When a user or agent can see the working echo, do they produce a better next reply and reach a better outcome than when they only see the chat answer?"

That is the fairest benchmark for the actual promise of the system.

## 5. Define The Objects Clearly

We need three separate objects in the test harness.

### 5.1 Assistant Answer

What Seven says in plain language.

### 5.2 Working Echo

A session-scoped, provisional, visible surface that shows what the conversation currently seems to be assembling.

It is:

- non-canonical
- revisable
- external to the chat stream
- useful for steering the next turn

It should include some version of:

- aim forming
- evidence carried
- unresolved tension
- candidate move
- uncertainty state

### 5.3 Canonical Mirror

The accepted box truth after lawful apply / return / closure steps.

We should stop letting these blur in the tests.

## 6. What We Need To Measure Now

The new testing plan should keep the earlier truth metrics, but add the missing working-echo metrics.

### 6.1 Keep These Existing Metrics

- proposal vs canon separation
- return vs canon separation
- contradiction governance
- premature closure blocking
- handoff continuity
- false-forward rate
- move validity
- efficiency

These are still important.

### 6.2 Add These New Working Echo Metrics

#### Echo Fidelity

Does the visible working echo reflect the strongest supported reading of the conversation and evidence?

#### Echo Visibility Quality

Is the working echo legible and usable as an external thinking surface?

#### Echo Steerability

After seeing the working echo, does the next user/agent reply become more discriminating or better grounded?

#### Echo Co-Creation Quality

Over multiple turns, does the working echo improve because of the back-and-forth, or does it merely repeat Seven's prior framing?

#### Echo Drift Resistance

When the conversation shifts or contradiction arrives, does the working echo update honestly instead of quietly preserving an obsolete frame?

#### Echo-To-Move Validity

Does the visible echo support a justified next move signal?

This is one of the most important metrics.

## 7. The Right Fairness Comparison

To test this properly, we need a new A/B/C structure.

### Arm A: Lœgos With Visible Working Echo

The evaluator sees:

- Seven's answer
- the visible working echo
- nothing hidden beyond what a real user would see

### Arm B: Lœgos Blindfolded

Same underlying system, same law, same model, same scenario.

But the evaluator sees:

- Seven's answer only
- no working echo

This isolates the value of the visible echo surface itself.

### Arm C: Plain Chat

The evaluator sees:

- the assistant answer only
- no law-backed echo surface
- no preview/canon distinction

### Optional Arm D: Schema-Only Working Board

The evaluator sees:

- a structured external board
- but no Lœgos law underneath it

This helps answer whether the win is:

- any visible external summary
- or specifically the Lœgos-style working echo

## 8. The Key Benchmark Question

The most important comparative question becomes:

> "Does a visible Lœgos working echo help the next turn more than chat alone, and more than a generic external board?"

That is much better than asking:

> "Which answer sounded best?"

## 9. How The Evaluator Must Be Designed

This is important.

If we use AI as the evaluator or as the simulated user, it must only see what the corresponding human would see in that arm.

That means:

### In The Visible-Echo Arm

The evaluator may see:

- assistant text
- visible working echo
- visible preview state if the user would see it
- visible witness panel if the user would see it

The evaluator may not see:

- hidden segments
- internal diagnostics unless surfaced
- raw gate payload
- canonical internals unless surfaced

### In The Blindfolded Arm

The evaluator may see:

- only assistant text

This lets us test whether the visible echo is actually helping.

### In All Arms

The evaluator may never see hidden benchmark gold labels or hidden harness state.

Otherwise we get another cheat path.

## 10. The New Main Benchmark Family

I would build one new benchmark family first:

## Working Echo Benchmark

Purpose:
Measure whether the visible working echo improves the next reply and the eventual outcome.

### Scenario Shape

Each scenario should include:

1. an initial vague or partial problem
2. enough evidence for a tentative read
3. at least one unresolved contradiction or alternate reading
4. at least one planted counterfeit explanation
5. one move that would be justified
6. one move that would be premature
7. one return that sharpens or contradicts the echo

### Turn Structure

The benchmark should run at least four stages:

1. initial user turn
2. assistant reply + visible echo
3. second user turn informed by what is visible
4. assistant reply + updated echo
5. move recommendation
6. return arrives
7. re-echo
8. later handoff or fresh session

This is where the product's real advantage should become visible.

Important coverage note:

The current scenarios are good starter cases, not the full suite.

Keep:

- `safe_uncertainty_incident`
- `contradictory_return_journey`

Because they are strong at forcing:

- contradiction handling
- counterfeit blame resistance
- deciding-split behavior
- evidence carry-forward

But add next:

- `no_move_yet`
- `working_echo_correction`
- `return_re_echo`
- `handoff`
- `witness_heavy`

## 11. The Most Important Delta To Measure

The single most important delta is this:

### Next-Reply Improvement

Compare the second user/agent reply under:

- visible working echo
- blindfolded Loegos
- plain chat

Score whether the second reply becomes:

- more specific
- better grounded
- more discriminating
- less likely to overclaim
- more likely to produce a justified move

If the visible working echo does not improve the next reply, then we are not yet delivering the product effect we think we are.

## 12. Suggested Metrics For That Delta

For each second-turn reply, score:

- specificity gain
- evidence alignment
- contradiction awareness
- counterfeit resistance
- move readiness
- false-forward avoidance

This gives us a direct measure of whether the visible echo is doing useful work.

## 13. Keep The Truth-Law Benchmarks Too

We should not replace the earlier truth-path tests.

We still need:

- backend truth-path suites
- route-level truth-path suites
- contradiction/closure benchmarks
- AI-caller isolation tests

But those are now the substrate tests.

The new working-echo benchmark becomes the product test.

That distinction matters:

- substrate tests ask: "is the law real?"
- working-echo tests ask: "does the product experience actually help?"

Both are necessary.

## 14. Proposed Benchmark Stack

This is the stack I would recommend.

### Tier 1: Substrate Law Tests

Already in place or close:

- proposal vs canon separation
- return truth path
- contradiction blocking closure
- handoff continuity
- AI-caller anti-cheat

### Tier 2: Working Echo Benchmarks

New:

- visible echo vs blindfolded Loegos
- visible echo vs plain chat
- visible echo vs schema board

### Tier 3: Product Shell Benchmarks

Later:

- actual current UI
- real pacing
- real voice style
- human usability

This keeps us from confusing kernel strength with product usefulness.

## 15. What Would Count As A Real Win

The system would earn a meaningful win if we can show:

1. the visible working echo improves the next reply
2. the visible working echo lowers false-forward moves
3. the visible working echo helps contradiction stay visible
4. the visible working echo improves handoff
5. these gains are not only coming from hidden state
6. these gains persist over several turns, not just one answer

The strongest version of the win is:

> "With the visible working echo, the user or agent makes a better next move than they would from chat alone."

That is the product promise in plain language.

## 16. Immediate Next Steps

I would do the following next.

### 16.1 Define The Working Echo Payload

We need one benchmark-facing representation of:

- aim forming
- evidence carried
- tension open
- candidate move
- certainty / uncertainty

Even if the UI changes later, the benchmark needs a stable object.

### 16.2 Build A Blindfolded Variant

Same system, same scenario, but hide the working echo from the evaluator.

### 16.3 Build The First Two Scenarios

I would start with:

- safe uncertainty incident
- contradictory return journey

### 16.4 Score Second-Turn Improvement

This is the centerpiece.

### 16.5 Only Then Compare Efficiency

If the visible echo improves the next move enough, token overhead may be justified.

## 17. Short Version

We have been proving that the system has law.

Now we need to prove that the user-facing product advantage is real.

That means testing not just:

- what Seven says
- what becomes canon

but also:

- the visible working echo between them

The fairest next benchmark is:

> visible working echo vs blindfolded Loegos vs plain chat, scored on whether the next reply becomes better and the later journey stays more honest.

That is the benchmark most likely to teach us something true.
