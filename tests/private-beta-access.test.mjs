import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createBetaUnlockCookieValue,
  isAllowedBetaEmail,
  isBetaPasswordMatch,
  verifyBetaUnlockCookieValue,
} from "../src/lib/beta-access-core.js";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("beta unlock cookie verifies with matching password and version", () => {
  const config = {
    authSecret: "auth-secret",
    password: "shared-beta-password",
    version: "1",
  };

  const value = createBetaUnlockCookieValue(config, 1713110400000);

  assert.equal(verifyBetaUnlockCookieValue(value, config), true);
});

test("beta unlock cookie invalidates when password rotates", () => {
  const initialConfig = {
    authSecret: "auth-secret",
    password: "shared-beta-password",
    version: "1",
  };
  const rotatedConfig = {
    ...initialConfig,
    password: "new-beta-password",
  };

  const value = createBetaUnlockCookieValue(initialConfig, 1713110400000);

  assert.equal(verifyBetaUnlockCookieValue(value, rotatedConfig), false);
});

test("beta unlock cookie invalidates when access version changes", () => {
  const initialConfig = {
    authSecret: "auth-secret",
    password: "shared-beta-password",
    version: "1",
  };
  const rotatedConfig = {
    ...initialConfig,
    version: "2",
  };

  const value = createBetaUnlockCookieValue(initialConfig, 1713110400000);

  assert.equal(verifyBetaUnlockCookieValue(value, rotatedConfig), false);
});

test("beta password matching ignores capitalization and allowlist checks are case-insensitive", () => {
  assert.equal(isBetaPasswordMatch("shared-beta-password", "shared-beta-password"), true);
  assert.equal(isBetaPasswordMatch("Shared-Beta-Password", "shared-beta-password"), true);
  assert.equal(isBetaPasswordMatch("shared-beta-password", "shared-beta-password-2"), false);

  assert.equal(
    isAllowedBetaEmail("Founder@Example.com", ["founder@example.com", "tester@example.com"]),
    true,
  );
  assert.equal(
    isAllowedBetaEmail("outsider@example.com", ["founder@example.com", "tester@example.com"]),
    false,
  );
});

test("beta admission schema, auth logging, and docs stay wired together", async () => {
  const schema = await read("prisma/schema.prisma");
  const auth = await read("src/lib/auth.js");
  const proposal = await read("docs/private-beta-access-proposal-2026-04-14.md");
  const runbook = await read("docs/private-beta-access-runbook-2026-04-14.md");

  assert.match(schema, /enum BetaAdmissionOutcome/);
  assert.match(schema, /model BetaAdmissionAttempt/);
  assert.match(auth, /recordDeniedBetaAdmissionAttempt/);
  assert.match(auth, /resolveSignInProvider/);
  assert.match(auth, /resolveBetaAdmissionEmail/);
  assert.match(auth, /provider_providerAccountId/);
  assert.match(auth, /error:\s*"\/"/);
  assert.match(auth, /scope:\s*"name email"/);
  assert.match(auth, /response_mode:\s*"form_post"/);
  assert.match(auth, /pkceCodeVerifier/);
  assert.match(auth, /state:\s*\{/);
  assert.match(auth, /sameSite:\s*secureAuthCookies \? "none" : "lax"/);
  assert.match(proposal, /BETA_ACCESS_VERSION/);
  assert.match(runbook, /Prisma Studio/);
  assert.match(runbook, /candidateEmail/);
});
