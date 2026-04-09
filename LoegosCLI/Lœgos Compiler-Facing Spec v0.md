Lœgos Compiler-Facing Spec v0.5-draft

Date: April 9, 2026
Status: Implementation-facing draft
Purpose: Tighten Lœgos into a form that can be implemented by a reference compiler without inventing semantics ad hoc.

⸻

1. Scope

This document does four things only:
	1.	defines an unambiguous ASCII grammar
	2.	defines allowed keyword-part combinations per head/verb
	3.	defines kind signatures for reserved verbs
	4.	defines operational predicate logic for the shape checker

It is intentionally narrower than the broader kernel and canon docs.

⸻

1. Surfaces

1.1 Source surface is authoritative

Lœgos source is ASCII.

Source	Rendered
DIR	△
GND	◻
INT	○
XFM	œ
MOV	→
TST	?
RTN	↩
CLS	7

1.2 Rendered surface is sugar

Rendered sigils are presentation only and must round-trip exactly to ASCII source.

⸻

1. Core Syntax Model

Every executable line has exactly three regions in this order:

HEAD VERB POSITIONAL* KEYWORD_PART*

Rules:
	1.	positional arguments must appear before keyword parts
	2.	keyword parts may not appear before a positional argument they depend on
	3.	each keyword may appear at most once unless explicitly allowed by the verb signature
	4.	unknown keywords are parse errors
	5.	keyword order is semantically irrelevant unless the verb signature states otherwise

This replaces the looser arg* model.

⸻

1. Grammar

program           := line+
line              := comment | clause
comment           := '#' text
clause            := head verb positional_part* keyword_part*
head              := 'DIR' | 'GND' | 'INT' | 'XFM' | 'MOV' | 'TST' | 'RTN' | 'CLS'
verb              := identifier
positional_part   := ref | identifier | string
keyword_part      := kw_from | kw_with | kw_into | kw_as | kw_via | kw_against | kw_if
kw_from           := 'from' value
kw_with           := 'with' value
kw_into           := 'into' value
kw_as             := 'as' scalar_kind
kw_via            := 'via' value
kw_against        := 'against' value
kw_if             := 'if' value
value             := ref | identifier | string
ref               := '@' identifier
identifier        := [A-Za-z_][A-Za-z0-9_]*
string            := '"' .* '"'
scalar_kind       := 'text' | 'count' | 'score' | 'bool' | 'date'

Notes:
	•	if exists in the grammar for guarded closures and guarded diagnostics only; it is not general control flow
	•	parse validity does not imply kind validity or shape validity

⸻

1. Reserved Verbs

4.1 DIR domain
	•	aim
	•	declare
	•	commit
	•	narrow

4.2 GND domain
	•	box
	•	witness
	•	constraint
	•	require
	•	measure

4.3 INT domain
	•	story
	•	interpret
	•	relate
	•	translate
	•	flag

4.4 XFM domain
	•	compile
	•	weld
	•	compare
	•	stage
	•	use

4.5 MOV domain
	•	move
	•	send
	•	advance

4.6 TST domain
	•	test
	•	check
	•	probe

4.7 RTN domain
	•	receipt
	•	observe
	•	confirm
	•	contradict

4.8 CLS domain
	•	seal
	•	flag
	•	stop
	•	reroute
	•	attest

⸻

1. Object Kinds

5.1 Structural kinds
	•	box
	•	aim
	•	witness
	•	block
	•	structure
	•	move
	•	test
	•	receipt
	•	state
	•	measure
	•	constraint
	•	requirement

5.2 Scalar kinds
	•	text
	•	count
	•	score
	•	bool
	•	date

5.3 Reference identity

A reference has:
	•	a name, e.g. @saved_listings
	•	a bound kind
	•	source location of first binding
	•	optional metadata such as witness identity or scalar kind

A reference name cannot change kind without explicit transformation to a new reference.

⸻

1. Keyword Semantics

6.1 from

Binds source origin.

Used primarily by:
	•	GND witness
	•	XFM use

6.2 with

Binds witness identity or auxiliary metadata.

Used primarily by:
	•	GND witness

6.3 into

Binds transformation target.

Used primarily by:
	•	XFM compile
	•	XFM weld
	•	XFM stage

6.4 as

Binds scalar kind annotation.

Used primarily by:
	•	GND measure
	•	RTN receipt|observe|confirm|contradict

6.5 via

Binds adapter or provenance channel, depending on head.
	•	in MOV, via means runtime adapter
	•	in RTN, via means provenance channel

6.6 against

Binds a comparison or test target.

Valid in XFM compare and TST check|probe.

6.7 if

Binds a guard condition.

Only allowed in guarded closure or diagnostics in v0.5-draft. It is not general branching.

⸻

1. Verb Signatures

The following signatures specify:
	•	allowed positional count
	•	allowed keyword parts
	•	input kind expectations
	•	output kind effects

Notation:
	•	ref:k means reference of kind k
	•	id means identifier or string literal
	•	-> describes output or state effect

7.1 DIR signatures

DIR aim

DIR aim <id|string|ref:aim>
keywords: none
output: binds or updates current aim

DIR aim always takes exactly one positional argument in v0.5-draft.

DIR declare

DIR declare <id|string>
keywords: none
output: direction-domain declaration

DIR commit

DIR commit <id|string>
keywords: none
output: direction-domain commitment

DIR narrow

DIR narrow <id|string>
keywords: none
output: direction-domain narrowing

7.2 GND signatures

GND box

GND box [ref:box](ref:box)
keywords: none
output: binds box

GND witness

GND witness [ref:witness](ref:witness) from <string|id> [with ]
keywords: from(required), with(optional, but required in strong-closure path)
output: binds witness with source origin and optional identity token

GND constraint

GND constraint [ref:constraint|id|string](ref:constraint|id|string) [as ]
keywords: as(optional)
output: binds or asserts grounding constraint

GND require

GND require [ref:requirement|id|string](ref:requirement|id|string)
keywords: none
output: binds requirement

GND measure

GND measure [ref:measure](ref:measure) as 
keywords: as(required)
output: binds measure with scalar kind

7.3 INT signatures

INT story

INT story <id|string>
keywords: none
output: interpretation narrative state

INT interpret

INT interpret <id|string>
keywords: none
output: interpretation hypothesis

INT relate

INT relate <ref|id|string> against <ref|id|string>
keywords: against(required)
output: relation assertion

INT translate

INT translate <ref|id|string> against <ref|id|string>
keywords: against(required)
output: translation assertion

INT flag

INT flag <id|string>
keywords: none
output: interpretation-domain concern marker

7.4 XFM signatures

XFM compile

XFM compile [ref:witness|ref:block](ref:witness|ref:block) into [ref:structure](ref:structure)
keywords: into(required)
output: binds target structure

XFM weld

XFM weld [ref:block|ref:structure](ref:block|ref:structure) into [ref:structure](ref:structure)
keywords: into(required)
output: binds or updates target structure

XFM compare

XFM compare <ref|id|string> against <ref|id|string>
keywords: against(required)
output: comparison edge in assembly graph; no mutation

XFM stage

XFM stage [ref:block|ref:structure](ref:block|ref:structure) into [ref:structure](ref:structure)
keywords: into(required)
output: staged structure or candidate set

XFM use

XFM use [ref:structure|ref:witness|ref:receipt|id|string](ref:structure|ref:witness|ref:receipt|id|string) [from [ref:box|id|string](ref:box|id|string)]
keywords: from(optional)
output: inclusion edge from external object or external box into local assembly graph; no local mutation by default

Graph effect:
	•	adds an import/inclusion edge to the assembly graph
	•	may introduce an imported symbol into the local symbol table
	•	does not change the kind of any local reference
	•	does not by itself satisfy MOV/TST requirements

If XFM use introduces an external receipt symbol, that symbol may satisfy imported_receipt_origin() for SH003.

7.5 MOV signatures

MOV move

MOV move <id|ref:structure|ref:move> via 
keywords: via(required)
output: move instance bound to runtime adapter

MOV send

MOV send <id|ref:structure|ref:move> via 
keywords: via(required)
output: move instance bound to runtime adapter

MOV advance

MOV advance <id|ref:structure|ref:move> via 
keywords: via(required)
output: move instance bound to runtime adapter

Where  ∈ {manual, shell, http, queue} in v0.5-draft.

7.6 TST signatures

TST test

TST test <id|string|ref:test>
keywords: [against(optional)]
output: test instance

TST check

TST check <id|string|ref:test> [against <ref|id|string>]
keywords: against(optional)
output: test instance

TST probe

TST probe <id|string|ref:test> [against <ref|id|string>]
keywords: against(optional)
output: test instance

7.7 RTN signatures

RTN receipt

RTN receipt [ref:receipt|id|string](ref:receipt|id|string) [via ] [as ]
keywords: via(optional at parse level, required by shape rules in strong-closure paths), as(optional)
output: receipt binding or receipt observation

RTN observe

RTN observe [ref:receipt|id|string](ref:receipt|id|string) [via ] [as ]
keywords: via(optional at parse level, required by shape rules in strong-closure paths), as(optional)
output: receipt-like observation

RTN confirm

RTN confirm [ref:receipt|id|string](ref:receipt|id|string) [via ] [as ]
keywords: via(optional at parse level, required by shape rules in strong-closure paths), as(optional)
output: confirming return

RTN contradict

RTN contradict [ref:receipt|id|string](ref:receipt|id|string) [via ] [as ]
keywords: via(optional at parse level, required by shape rules in strong-closure paths), as(optional)
output: contradicting return

Where  is a provenance channel.

7.8 CLS signatures

CLS seal

CLS seal <id|string|ref:state> [if <id|string>]
keywords: if(optional)
output: attempts sealed window state

CLS flag

CLS flag <id|string|ref:state> [if <id|string>]
keywords: if(optional)
output: flagged window state

CLS stop

CLS stop <id|string|ref:state> [if <id|string>]
keywords: if(optional)
output: stopped window state

CLS reroute

CLS reroute <id|string|ref:state> [if <id|string>]
keywords: if(optional)
output: rerouted window state

CLS attest

CLS attest <id|string|ref:state> if <id|string>
keywords: if(required)
output: human-attested closure state (distinct from seal)

⸻

1. Parse Errors

The parser must reject at least these conditions:
	•	unknown head
	•	unknown verb for head domain
	•	keyword before required positional
	•	repeated keyword where repetition is disallowed
	•	missing required keyword part
	•	unknown keyword for a given verb signature
	•	invalid scalar kind after as
	•	invalid adapter after MOV via
	•	invalid provenance channel after RTN via

The parser should emit source location ranges for all parse errors.

⸻

1. Kind Pass

The kind pass should evaluate each clause against the verb signatures above.

9.1 Output

For each line, produce:
	•	parsed head/verb
	•	resolved references
	•	input kind checks
	•	output kind effects
	•	success or kind error

9.2 Required kind errors

Minimum kind error classes:
	•	KH001 reference used before binding where forbidden
	•	KH002 reference kind mismatch
	•	KH003 missing transformation target kind
	•	KH004 illegal overwrite of reference kind
	•	KH005 invalid scalar kind annotation site
	•	KH006 invalid adapter or channel binding for head domain

9.3 Kind pass as signatures, not commentary

The kind pass is not a linter. It is the execution of the verb signature table.

⸻

1. Runtime Contract

10.1 Move adapters

Allowed adapters in v0.5-draft:
	•	manual
	•	shell
	•	http
	•	queue

10.2 Adapter semantics

manual
Runtime records the move as issued and sets window state to awaiting until a user- or system-entered return is recorded.

shell
Runtime executes a configured shell command and may capture stdout/stderr as system-originated return material.

http
Runtime issues a configured HTTP request and may capture the response as system/service-originated return material.

queue
Runtime emits a task/event to a queue and sets the window to awaiting until an external return is recorded.

10.3 Return channels

Allowed channels in v0.5-draft:
	•	user
	•	system
	•	registry
	•	sensor
	•	service
	•	third_party
	•	stripe
	•	substack
	•	counsel
	•	lender_portal
	•	cfo

10.4 Runtime states
	•	open
	•	awaiting
	•	returned
	•	closed

10.5 Closure types
	•	seal
	•	flag
	•	stop
	•	reroute
	•	attest

10.6 Merged window state (primary badge)
	•	shape_error
	•	flagged
	•	awaiting
	•	attested
	•	rerouted
	•	stopped
	•	sealed
	•	open

Precedence:
shape_error > flagged > awaiting > attested > rerouted > stopped > sealed > open

10.7 State transitions
	•	compile success -> open
	•	move issued with active test -> awaiting
	•	return appended -> returned
	•	closure line evaluated -> closed with closure_type in {seal, flag, stop, reroute, attest}

10.8 Multi-window handling

Each file corresponds to one box/window by default.
Multiple files may be open simultaneously in the runtime. Window state is tracked per file/box.

10.9 Error reporting requirements

All parse, kind, and shape reports must carry:
	•	rule or error ID
	•	severity
	•	source span
	•	message
	•	involved references, if any

⸻

1. Assembly Graph Output

A reference compiler must output JSON with at least:
	•	box identity
	•	current aim
	•	witness set with origin and identity
	•	transformation edges
	•	moves with adapters
	•	tests
	•	returns with channels and scalar kinds
	•	closure decision
	•	window state
	•	diagnostics list

11.1 Minimal schema example

{
  "box": {"ref": "@farmhouse_box"},
  "aim": "buy_farmhouse_upstate",
  "witnesses": [
    {"ref": "@saved_listings", "source": "saved_listings.md", "identity": "v_apr9"}
  ],
  "transforms": [
    {"op": "compile", "from": ["@saved_listings"], "into": "@listing_structure"}
  ],
  "moves": [
    {"verb": "move", "target": "call_lender_a", "adapter": "manual"}
  ],
  "tests": [
    {"verb": "test", "target": "real_borrowing_range"}
  ],
  "returns": [
    {"verb": "receipt", "ref": "@preapproval_a", "channel": "lender_portal", "scalar_kind": "score"}
  ],
  "closure": {"verb": "reroute", "target": "search_region"},
  "window_state": "rerouted",
  "diagnostics": []
}

⸻

1. Shape Checker: Operational Helpers

The shape checker operates over:
	•	ordered clause list L[0..n-1]
	•	symbol table S
	•	assembly graph G
	•	runtime metadata R

12.1 Ordering model

Clause order is lexical source order.

For v0.5-draft, if a file contains one or more CLS clauses, the active closure is the last CLS clause in lexical order.

Define:
	•	active_closure_index(L) = greatest i such that L[i].head == CLS, else null
	•	active_path(L) = all clauses L[0..i] where i = active_closure_index(L); if i == null, then active_path(L) = L

All closure-sensitive shape rules evaluate over active_path(L).
This makes evaluation deterministic even when earlier CLS clauses exist in the file.

12.2 Helper definitions

has_aim(L)
True iff there exists a clause in active_path(L) with head=DIR and verb=aim.

ground_clauses(L)
Returns all clauses in active_path(L) whose head=GND and verb ∈ {witness, constraint, measure, require}.

has_ground(L)
True iff ground_clauses(L) is non-empty.

return_clauses(L)
Returns all clauses in active_path(L) with head=RTN.

has_return(L)
True iff return_clauses(L) is non-empty.

move_clauses(L)
Returns all clauses in active_path(L) with head=MOV.

test_clauses(L)
Returns all clauses in active_path(L) with head=TST.

has_move_and_test(L)
True iff move_clauses(L) and test_clauses(L) are both non-empty.

closure_clauses(L)
Returns all clauses in active_path(L) with head=CLS.

has_clause_before(L, idx, predicate)
True iff there exists j < idx such that predicate(L[j]) is true.

contradiction_indices(L)
Returns indices in active_path(L) of clauses with head=RTN and verb=contradict.

seal_indices(L)
Returns indices in active_path(L) of clauses with head=CLS and verb=seal.

active_closure_clause(L)
Returns L[active_closure_index(L)] if one exists, else null.

strong_closure_attempt(L)
True iff active_closure_clause(L) != null.

In v0.5-draft, any terminal closure verb (seal, flag, stop, reroute, attest) counts as a closure attempt for witness identity and provenance checks.

has_witness_identity(w)
True iff witness symbol w has non-null identity metadata.

reachable_witnesses_on_active_path(S, G, L)
Returns witness symbols referenced directly or indirectly by clauses in active_path(L).

all_witnesses_anchored(S, G, L)
True iff all symbols in reachable_witnesses_on_active_path(S, G, L) satisfy has_witness_identity.

has_provenance(r)
True iff return clause r has a valid via channel.

returns_on_active_path(L)
Returns return clauses in active_path(L).

all_returns_provenanced(L)
True iff all clauses in returns_on_active_path(L) satisfy has_provenance.

imported_receipt_origin(r, S, G)
True iff return operand r resolves to a symbol of kind receipt introduced by XFM use, or to a receipt node marked imported in the assembly graph.

witness_drifted_since_compile(R)
True iff runtime metadata records at least one witness identity mismatch between compile-time and current source state.

awaiting_age(R)
Returns elapsed duration since window entered awaiting state.

has_resolution_after_flag(L, idx)
True iff there exists j > idx in active_path(L) such that L[j] is CLS reroute or CLS stop.

kind_changed_illegally(S)
True iff symbol table records one reference name bound to more than one kind without an explicit transformation edge producing a new reference.

These helpers are fully implementable over ordered clauses, symbol bindings, and runtime metadata.

⸻

1. Shape Rules v0.1

13.1 Hard errors

SH001 — Missing aim
Predicate:

not has_aim(L)

Message:
program has no declared aim

SH002 — Seal without prior return
Predicate:

exists i in seal_indices(L) such that not has_clause_before(L, i, clause.head == RTN)

Message:
seal requires at least one prior return

SH003 — Return without move/test or imported receipt origin
Predicate:

exists r in return_clauses(L) such that not has_move_and_test(L) and not imported_receipt_origin(r, S, G)

Message:
return requires prior move/test or explicit imported receipt origin

SH004 — Story-plus-seal without ground
Predicate:

exists seal in seal_indices(L) and exists story clause in L and not has_ground(L)

Message:
story cannot support seal without ground

SH005 — Illegal kind change on reference
Predicate:

kind_changed_illegally(S)

Message:
reference kind changed without lawful transformation

SH006 — Closure attempt with unanchored witness
Predicate:

strong_closure_attempt(L) and not all_witnesses_anchored(S, G, L)

Message:
closure attempt requires anchored witness identity on the active path

SH007 — Closure attempt with provenance-less return
Predicate:

strong_closure_attempt(L) and not all_returns_provenanced(L)

Message:
closure attempt requires provenance-bearing return on the active path

SH008 — Contradiction followed by premature seal
Predicate:

exists c in contradiction_indices(L), exists s in seal_indices(L) where c < s and not exists j with c < j < s and L[j].head == CLS and L[j].verb in {flag, reroute, stop}

Message:
contradiction must be mediated before seal

SH009 — Attest without rationale
Predicate:

exists a in active_path(L) where a.head == CLS and a.verb == attest and (a.if is null or trim(a.if) == "")

Message:
attest requires explicit rationale via if clause

13.2 Warnings

SW001 — Move without test
Predicate:

count(move_clauses(L)) > 0 and count(test_clauses(L)) == 0

Message:
move should declare an explicit test

SW002 — Interpretation-heavy / ground-light
Predicate:

count clauses with head == INT > 0 and not has_ground(L)

Message:
interpretation dominates with weak or absent ground

SW003 — Ground-heavy / move-missing
Predicate:

has_ground(L) and count(move_clauses(L)) == 0

Message:
ground exists but no move forces contact

SW004 — Repeated flag without reroute or stop
Predicate:

exists i where L[i].head == CLS and L[i].verb == flag and not has_resolution_after_flag(L, i)

Message:
flagging repeats without resolution path

SW005 — Stale awaiting window
Predicate:

R.window_state == awaiting and awaiting_age(R) > R.expected_horizon

Message:
awaiting window is stale relative to expected return horizon

SW006 — Live witness drift since compile
Predicate:

witness_drifted_since_compile(R)

Message:
witness changed since compile; recompile pressure exists

⸻

1. Canonical Examples With Expected Results

14.1 Lawful program

GND box @farmhouse_box
DIR aim buy_farmhouse_upstate
GND witness @saved_listings from "saved_listings.md" with v_apr9
GND witness @lender_notes from "lender_notes.pdf" with hash_c19a42
INT story quieter_life_next_chapter
XFM compile @saved_listings into @listing_structure
MOV move call_lender_a via manual
TST test real_borrowing_range
RTN receipt @preapproval_a via lender_portal as score
CLS reroute search_region

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: pass
	•	runtime end state: rerouted

14.2 Hard fail: self-sealing story

DIR aim pick_strategy
INT story this_feels_right
CLS seal strategy

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: fail SH002, SH004

14.3 Hard fail: provenance-less closure attempt

DIR aim confirm_deck_matches_current_state
GND witness @pitch_deck_v3 from "pitch_deck_v3.pdf" with hash_a83f19
MOV move send_deck_to_melih via manual
TST test melih_confirms_numbers_accurate
RTN contradict @slide_7_overstates_pipeline
CLS seal deck_ok

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: fail SH007, SH008

14.4 Warning-only: move without explicit test

DIR aim launch_listening_loop
GND witness @usage_logs from "usage_logs.json" with v_apr9
MOV move release_build via http

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: warn SW001
	•	runtime state after move: awaiting

14.5 Imported receipt origin example

GND box @external_audit_window
DIR aim accept_external_audit_result
XFM use @prior_audit_receipt from @audit_archive_box
RTN receipt @prior_audit_receipt via registry as score
CLS seal audit_result_accepted

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: pass, assuming @prior_audit_receipt resolves as imported receipt origin
	•	runtime end state: sealed

This example exists to exercise imported_receipt_origin(r, S, G) and prove that SH003 does not require a local move/test when the receipt is explicitly imported.

14.6 Corpus starter set adopted from audited tiny programs

The following programs are approved as the first external fixture set for the failure corpus and should be included verbatim in the reference implementation test suite.

A. Lawful minimal

# Tiny career pivot window

GND box @career_pivot
DIR aim switch_to_independent_consulting
GND witness @market_research from "market_research_apr9.md" with v_apr9
GND constraint budget_needs_3_months
MOV move post_first_offer via manual
TST test first_client_signs
RTN receipt @client_a_signed via user as score
CLS seal pivot_confirmed

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: pass
	•	runtime: sealed

B. Lawful with transformation

# Tiny feature validation window

GND box @v1_feature_test
DIR aim reduce_onboarding_dropoff
GND witness @usage_logs from "usage_logs_apr9.json" with v_apr9
XFM compile @usage_logs into @dropoff_structure
XFM compare @dropoff_structure against "current_funnel"
MOV move run_user_test_5 via http
TST test user_can_name_core_loop
RTN confirm @4_of_5_succeeded via user as count
CLS reroute to_v2

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: pass
	•	runtime: rerouted

C. Hard fail — classic self-sealing story

# Counterfeit convergence demo

GND box @strategy_pick
DIR aim pick_q3_strategy
INT story this_feels_right
CLS seal strategy

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: fail SH002, SH004

D. Warning-only — move without explicit test

# Grounded but lazy move

GND box @marketing_campaign
DIR aim launch_summer_campaign
GND witness @audience_data from "audience_data_apr9.csv" with v_apr9
MOV move send_email_blast via queue
CLS flag needs_test

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: warn SW001

E. Lawful strong closure

# Tiny budget approval window

GND box @budget_approval
DIR aim approve_q2_budget
GND witness @financials from "q2_financials.pdf" with hash_a83f19
GND measure @burn_rate as score
MOV move submit_to_cfo via manual
TST test cfo_approves_numbers
RTN receipt @approved_450k via cfo as score
CLS seal budget_window

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: pass
	•	runtime: sealed

F. Hard fail — return without move/test

# Fake receipt attack

GND box @revenue_claim
DIR aim hit_100k_mrr
GND witness @stripe_export from "stripe_apr9.csv" with v_apr9
RTN receipt @102k_mrr via stripe as score
CLS seal goal_met

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: fail SH003

G. Warning-heavy — ground-only sterility

# Analysis paralysis window

GND box @metrics_deep_dive
DIR aim understand_user_confusion
GND witness @logs from "logs_apr9.json" with snapshot_2026_04_09
GND measure @confusion_rate as score
GND measure @session_time as score
INT flag still_no_clear_story
CLS stop insufficient_signal

Expected:
	•	parse: pass
	•	kind: pass
	•	shape: warn SW003

These seven programs, together with the earlier canonical examples, are sufficient to seed the first lawful/failing/warning corpus for the reference compiler.

⸻

1. Reference Implementation Checklist

A minimal compiler implementation should be able to:
	1.	parse ASCII source deterministically
	2.	bind references and record source spans
	3.	execute verb signatures as kind rules
	4.	compute SH/SW diagnostics deterministically
	5.	emit assembly graph JSON
	6.	preserve witness identities in output
	7.	preserve return provenance in output
	8.	run a failure corpus as tests

If it can do those eight things, Lœgos has crossed from spec theater into language prototype.

At this point, the next bottleneck is implementation, not further conceptual expansion.

⸻

1. Immediate Next Moves
  1. Implement this grammar and signature table in Rust or Zig.
  2. Encode SH001–SH008 and SW001–SW006 directly in the checker.
  3. Build the first failure corpus around the canonical and adopted fixture examples.
  4. Add source-span reporting and deterministic JSON output.
  5. Only after that, revisit multi-file XFM use semantics and extensibility.

⸻

1. Closing

The point of Lœgos is not symbolic elegance.
The point is to make counterfeit closure mechanically harder.

This document is enough to build the first real checker.
If the checker works, the philosophy has earned the right to remain.
If it does not, the symbols deserve to die.