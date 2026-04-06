# Phase 1 Proof Runbook

## Purpose

Use this runbook to prove the current Phase 1 loop with a human before treating architecture cleanup as the main milestone.

The loop is only considered real when a non-author human can complete it and understand why the product blocked or allowed seal.

## Golden Path

1. Open the seeded workspace.
2. Land on the document/workbench immediately.
3. Run inline Operate.
4. Open inspect on a finding.
5. Add an attested override.
6. Open seal.
7. Confirm seal is blocked without acknowledgment.
8. Acknowledge and complete seal.

## Local Proof

### Prerequisites

- Local environment is configured well enough to sign in and run Operate.
- `OPENAI_API_KEY` is present locally.
- The app can run on `http://127.0.0.1:3003`.

### Setup

1. Start the app locally:

```bash
npm run dev -- --port 3003
```

2. Reset the local guardian workspace:

```bash
curl -s "http://127.0.0.1:3003/api/auth/dev-guardian?action=reset"
curl -s "http://127.0.0.1:3003/api/auth/dev-guardian"
```

3. Open:

```text
http://127.0.0.1:3003/workspace
```

### Expected Visible States

- [ ] Workspace opens on the document/workbench, not a secondary room.
- [ ] If the disclaimer gate appears, it can be completed and the workbench opens.
- [ ] Clicking `Run Operate` produces finding rows in the diagnostics rail.
- [ ] Clicking `Inspect` opens a detailed inspect panel for a finding.
- [ ] Adding an attested override shows saved override state and removal control.
- [ ] Opening seal shows the receipt seal dialog.
- [ ] The dialog explicitly says seal is blocked until overrides are acknowledged.
- [ ] After checking acknowledgment, seal can complete.
- [ ] The latest receipt status changes to `Sealed`.

### Pass / Fail

- Pass if every visible state above is true in one uninterrupted run.
- Fail if the user has to guess what happened, guess why seal is blocked, or leave the main loop to complete the path.

## Preview Proof

### Prerequisites

- A preview deployment is available.
- A real sign-in path is available:
  - email magic link if the landing screen offers it
  - Apple fallback if Apple sign-in is the only available provider
- If neither appears on the preview sign-in surface, mark preview proof as `Blocked: no preview auth provider`.

### Setup

1. Open the preview URL.
2. Sign in using the visible real auth provider.
3. Open the seeded workspace.

### Expected Visible States

Use the same checklist as local proof:

- [ ] Workspace opens on the document/workbench.
- [ ] Inline Operate completes and produces findings.
- [ ] Inspect opens from a finding.
- [ ] An attested override can be added.
- [ ] Seal is visibly blocked before acknowledgment.
- [ ] Seal completes after acknowledgment.
- [ ] The latest receipt status changes to `Sealed`.

### Pass / Fail

- Pass if the same loop works with real preview auth.
- Fail if the loop is confusing, blocked, or visually ambiguous.

## Sign-off

### Local Human Proof

- Tester:
- Date:
- Result: `Pass / Fail`
- Notes:

### Preview Human Proof

- Tester:
- Date:
- Result: `Pass / Fail / Blocked`
- Notes:
