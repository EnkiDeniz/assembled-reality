# Listener-First Retrospective

Date: April 2, 2026

## What Went Wrong

- The product problem was interpreted too literally and too narrowly.
- "Let me put text files in and listen" became "replace the product with a generic upload utility."
- The signed-in fast path was broken conceptually by removing the direct route into the real product surface.
- The homepage was redesigned like a commodity SaaS tool instead of preserving the identity, tone, and tension of the existing product.
- Useful infrastructure work was mixed together with a bad product and UX rewrite, which made the whole change feel worse than it was.

## What Was Actually Learned

- The repo does need a simpler primary action.
- That simpler action should live inside the existing product language, not replace it.
- Guest or local reading can be a useful capability.
- Local persistence for imported documents is a valid direction.
- Saving a local document into an account-backed library is also a valid direction.
- The reader should have a clearer separation between core listening controls and advanced tooling.
- None of those truths require a generic landing page or a brand reset.

## What Should Not Be Repeated

- Do not replace the front door until the signed-in and signed-out flows are mapped end to end.
- Do not present a product simplification as a visual or brand simplification.
- Do not remove the fastest path for existing users in order to optimize for a hypothetical new user.
- Do not mix "plumbing changes" and "product positioning changes" in one pass.
- Do not hide the product's identity under generic utility copy.

## What Was Valuable In The Failed Pass

- Public document normalization as a separable ingest step.
- Browser-local persistence for imported documents.
- A local-reader route and loader pattern.
- A future save-to-account bridge for local documents.
- Clearer gating between listening controls and advanced features inside the reader shell.

These ideas were sound in isolation. The mistake was shipping them as a full product pivot.

## Guardrails For The Redo

- Keep the existing product identity intact.
- Preserve the current signed-in path first.
- Add import-and-listen as a first-class action inside the real app.
- Treat local mode as a capability, not the new story of the company.
- Evaluate entry flow, auth flow, and post-login flow as one system before changing copy or layout.
- Ship structural improvements behind the existing shell before attempting any homepage rewrite.

## Practical Next Move

- Restore the previous working product surface.
- Re-spec the import-and-listen feature as an in-product flow.
- Keep any future implementation sliced into:
  1. infrastructure
  2. integration into the existing reader
  3. only then any visible UX rewrite
