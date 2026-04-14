# Private Beta Access Proposal

Date: April 14, 2026
Status: Proposed
Purpose: Protect the current private beta without replacing or weakening the existing Apple and Resend sign-in flows.

---

## Decision Summary

We should treat private beta protection as an admission layer around the current authentication system, not as a replacement for it.

That means:

1. Keep Sign in with Apple and Resend magic links as the real authentication methods.
2. Add a separate beta gate that decides who may enter before or during sign-in.
3. Make the beta gate removable by configuration, not by rewriting auth.

This gives us a safe private beta now and an instant path to public access later.

---

## Why this proposal

Right now the product has strong authenticated application boundaries after login, but weak admission control before login.

The risk is not that the app lacks auth.
The risk is that any outsider who can authenticate can become a valid user.

If we solve this by replacing Apple or Resend, we create migration risk later.
If we solve this by layering beta admission on top of the current providers, we preserve the public-launch path.

---

## Goals

- Block outsiders from using the beta.
- Preserve the current Apple and Resend flows.
- Avoid a second auth system.
- Make public launch a config change, not a rebuild.
- Keep public marketing and policy pages visible.

## Non-goals

- Building a full invite-management dashboard right now.
- Replacing NextAuth.
- Replacing Apple sign-in.
- Replacing Resend magic links.
- Designing the permanent public signup system.

---

## Proposed Architecture

### 1. Keep auth providers intact

Apple and Resend remain the only true sign-in methods.

They continue to handle:

- identity proof
- email verification
- account creation
- session creation

The beta layer should not impersonate or replace them.

### 2. Add a separate beta admission layer

The beta layer should answer a different question:

> Is this person allowed into the beta right now?

Recommended controls:

- a shared beta password for the front-door gate
- an approved-email allowlist for actual admission

Recommended posture for private beta:

- password + allowlist together

That gives two kinds of protection:

- the password keeps casual outsiders out
- the allowlist prevents password leakage from becoming full product access

### 3. Enforce admission on the server

The gate must be server-enforced, not only client-visible.

Required enforcement points:

1. The landing page may show a password form.
2. The unlock action should mint an `httpOnly` signed cookie.
3. The NextAuth sign-in callback should reject emails not on the beta allowlist.
4. Session resolution should re-check beta eligibility before returning a usable app session.

This ensures that:

- UI hiding alone is not trusted
- direct API access still fails
- bookmarked protected routes still fail
- stale sessions can be invalidated by policy

### 4. Keep the beta gate orthogonal to auth

Do not fork the auth tree into:

- beta auth
- public auth

Do not create separate provider configs for beta and public.

Instead:

- keep one auth stack
- wrap it with admission rules

That way the future public launch is simply:

- disable password requirement
- disable allowlist requirement

Apple and Resend continue working exactly as they already do.

---

## Recommended Modes

### Mode A: Password only

Good for:

- a very small trusted group
- very short-lived testing windows

Weakness:

- anyone who learns the password can sign in

Recommendation:

- not enough by itself for this phase

### Mode B: Allowlist only

Good for:

- a controlled invite set
- a more polished onboarding experience

Weakness:

- landing page still advertises a direct path into auth

Recommendation:

- acceptable, but weaker at discouraging casual probing

### Mode C: Password + allowlist

Good for:

- the current private beta

Strength:

- lowest-friction safe setup without rewriting auth

Recommendation:

- this is the preferred mode now

### Mode D: No beta gate

Good for:

- public launch

Recommendation:

- future state

---

## User Flow

### Private beta flow

1. Visitor lands on the homepage.
2. If beta password protection is enabled, they must unlock the beta first.
3. After unlock, they choose Apple or email magic link.
4. Auth completes through NextAuth.
5. Server checks whether the resolved email is on the beta allowlist.
6. If allowed, the user enters the product.
7. If not allowed, sign-in is denied with a clear message.

### Public launch flow

1. Visitor lands on the homepage.
2. No password gate appears.
3. Visitor chooses Apple or email magic link.
4. Auth completes through the same providers and same routes.
5. User enters the product.

No provider migration is needed.

---

## Operational Model

### Environment variables

Recommended:

```env
BETA_ACCESS_PASSWORD=shared-private-beta-password
BETA_ACCESS_VERSION=1
BETA_ALLOWED_EMAILS=alice@example.com,bob@example.com
```

Optional compatibility aliases:

```env
PRIVATE_BETA_PASSWORD=shared-private-beta-password
PRIVATE_BETA_EMAILS=alice@example.com,bob@example.com
```

### Password rotation and cookie invalidation

The unlock cookie must become invalid when either of these changes:

- `BETA_ACCESS_PASSWORD`
- `BETA_ACCESS_VERSION`

Operational intent:

- rotating the shared beta password should invalidate already-unlocked browsers automatically
- bumping `BETA_ACCESS_VERSION` should act as an emergency revoke-all switch even if the password does not change

The signing semantics should therefore bind unlock-cookie validity to:

- app auth secret
- beta password
- beta access version

### Removal path

To open the product publicly later:

1. Remove `BETA_ACCESS_PASSWORD`
2. Remove `BETA_ALLOWED_EMAILS`
3. Redeploy

That is the whole switch.

Apple and Resend remain live and unchanged.

---

## Important Product Notes

### Sign in with Apple relay emails

If beta admission is enforced by email allowlist, Sign in with Apple needs special handling during onboarding.

Some testers may use:

- their real Apple ID email
- an Apple relay address created by Hide My Email

If a tester uses an Apple relay address, the allowlist must include the relay email that Apple actually returns to the app.

Operational recommendation:

- record denied Apple candidate emails server-side in a durable beta-admission log
- use Prisma Studio or direct DB access to look up the exact `candidateEmail` captured for the denied attempt
- add that exact relay email to the beta allowlist
- or ask testers to avoid Hide My Email during private beta onboarding

### Auth provider continuity

The product should preserve:

- NextAuth provider setup
- Apple provider credentials
- Resend email delivery path
- existing callback and session logic

The beta gate should remain a thin layer above those pieces.

### Public pages should stay public

These should remain accessible without beta admission:

- landing page
- about
- trust
- privacy
- terms
- design proposal

The gate should protect the application, not the marketing surface.

---

## Rollout Plan

### Phase 1: Lock the beta now

- enable password + allowlist
- gather the exact approved tester email list
- verify both Apple and magic-link entry for at least one approved tester each
- verify denied access for one unapproved email

### Phase 2: Stabilize operations

- define who owns allowlist updates
- rotate beta passwords by changing `BETA_ACCESS_PASSWORD` and incrementing `BETA_ACCESS_VERSION`
- define what support response a denied user sees
- document Apple relay-email handling and Prisma Studio lookup for onboarding

### Phase 3: Prepare for public opening

- keep provider auth unchanged
- gradually reduce gate dependence
- remove password first or allowlist first depending on launch plan
- finally remove both when public signup is ready

---

## Acceptance Criteria

The proposal is successful if:

1. An outsider cannot reach `/workspace` or protected APIs without beta admission.
2. An outsider with the password but without an approved email still cannot use the app.
3. An approved tester can still sign in with Apple.
4. An approved tester can still sign in with Resend magic link.
5. Removing the beta gate requires only config changes, not auth rewrites.

---

## Alternatives Considered

### Replace Apple and Resend with a temporary beta-only password login

Rejected because:

- it creates an auth migration later
- it bypasses the real identity providers
- it adds more launch risk than it removes

### Build a database-backed invite system first

Rejected for now because:

- it is a bigger product/system project
- env-backed allowlist is enough for the current private beta
- the launch-critical need is access control now, not invite tooling elegance

### Hide the UI only

Rejected because:

- it does not protect direct route or API access
- it is not real security

---

## Recommended Next Step

Adopt the layered model immediately:

- keep Apple and Resend intact
- enforce private beta admission as a separate server-side gate
- use password + allowlist for the current phase
- plan to remove the gate later by configuration only

This is the safest route because it protects the beta now without spending future public-launch momentum on undoing a temporary auth fork.
