# Phase 1 Proof Runbook Pointer

The canonical Phase 1 proof runbook lives at:

- [pivot/solution/Phase 1 Proof Runbook/Phase 1 Proof Runbook.md](../pivot/solution/Phase%201%20Proof%20Runbook/Phase%201%20Proof%20Runbook.md)

Use that document for:

- local human proof with `dev-guardian`
- preview human proof with real sign-in
- the exact golden path required to call Phase 1 proven
- the linked founder-wow session on a real repo document

Important local note:

- For local proof, open the `dev-guardian` URLs in the browser itself. Do not use `curl`, because the guardian login sets an `httpOnly` browser session cookie.

For automation:

- `npm run test:e2e:local` is the current authoritative browser guardrail
- `npm run test:e2e:ci` is wired to the same scenario with Playwright `webServer`
