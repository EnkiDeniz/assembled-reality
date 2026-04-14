# Private Beta Access Runbook

Date: April 14, 2026
Status: Operational
Purpose: Define the exact operational steps for private beta password rotation, allowlist updates, Apple relay support, and public-gate removal.

---

## Environment contract

Private beta uses these env vars:

```env
BETA_ACCESS_PASSWORD=shared-private-beta-password
BETA_ACCESS_VERSION=1
BETA_ALLOWED_EMAILS=alice@example.com,bob@example.com
```

Compatibility aliases remain supported:

```env
PRIVATE_BETA_PASSWORD=shared-private-beta-password
PRIVATE_BETA_EMAILS=alice@example.com,bob@example.com
```

Rules:

- `BETA_ACCESS_PASSWORD` controls the shared front-door unlock.
- `BETA_ALLOWED_EMAILS` controls who may actually sign in.
- `BETA_ACCESS_VERSION` is the manual revoke-all switch for unlock cookies.

---

## Password rotation

Unlock cookies are bound to both:

- `BETA_ACCESS_PASSWORD`
- `BETA_ACCESS_VERSION`

That means:

- changing the password invalidates all existing unlock cookies automatically
- bumping `BETA_ACCESS_VERSION` invalidates all existing unlock cookies without changing the password

Recommended rotation procedure:

1. Choose a new `BETA_ACCESS_PASSWORD`
2. Increment `BETA_ACCESS_VERSION`
3. Redeploy
4. Share the new password only with approved testers

Use a version bump by itself when:

- the password leaked
- you need to force all browsers to re-unlock
- you want an emergency revoke without changing the distributed password yet

---

## Apple relay-email support workflow

If a tester is denied after Sign in with Apple:

1. Ask them which Apple option they used:
   - normal email
   - Hide My Email
2. Look up denied beta-admission attempts in Prisma Studio or the database using `provider = "apple"` and the latest timestamps.
3. Find the exact `candidateEmail` recorded for the denied attempt.
4. Add that exact value to `BETA_ALLOWED_EMAILS`.
5. Redeploy if the allowlist is env-backed in the deployed environment.
6. Ask the tester to retry Apple sign-in.

Important note:

- Do not guess the relay email.
- Use the exact `candidateEmail` captured by the server.

---

## Magic-link support workflow

If a tester is denied after using a magic link:

1. Confirm the email they typed.
2. Compare it with `BETA_ALLOWED_EMAILS`.
3. Add the exact normalized email if the tester is approved but missing.
4. Ask the tester to request a new magic link after the allowlist update.

---

## Prisma Studio lookup

Open Prisma Studio and inspect `BetaAdmissionAttempt`.

Useful filters:

- latest Apple denies: `provider = apple`, `outcome = DENIED_ALLOWLIST`
- latest email denies: `provider = email`, `outcome = DENIED_ALLOWLIST`
- one tester: filter by `normalizedEmail`

The field to copy into the allowlist is:

- `candidateEmail`

The field to search against repeatedly is:

- `normalizedEmail`

---

## Public launch removal path

To remove the beta gate without changing auth providers:

1. Remove `BETA_ACCESS_PASSWORD`
2. Remove `BETA_ALLOWED_EMAILS`
3. Leave Apple and Resend auth config untouched
4. Redeploy

The result:

- no password gate
- no allowlist gate
- Apple and Resend continue working as the same auth methods

---

## Support notes

- No admin UI exists in this pass; support uses Prisma Studio or direct DB access.
- Denied beta-attempt records are intentionally raw enough to recover Apple relay emails.
- Retention/privacy policy for these records should be reviewed before public launch.
