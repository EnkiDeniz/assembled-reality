import { expect, test } from "@playwright/test";

test.beforeAll(() => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to exercise the real inline Operate flow.");
  }
});

test("guardian can run inline operate, attest, and hit seal acknowledgement", async ({
  page,
  context,
  baseURL,
}) => {
  const resetResponse = await context.request.get(`${baseURL}/api/auth/dev-guardian?action=reset`);
  expect(resetResponse.ok()).toBeTruthy();

  const loginResponse = await context.request.get(`${baseURL}/api/auth/dev-guardian`);
  expect(loginResponse.ok()).toBeTruthy();

  await page.goto("/workspace", { waitUntil: "domcontentloaded" });

  const disclaimerGate = page.getByTestId("workspace-disclaimer-gate");
  if (await disclaimerGate.isVisible().catch(() => false)) {
    await page.getByTestId("workspace-disclaimer-input").fill("understand");
    await page.getByTestId("workspace-disclaimer-submit").click();
  }

  const starter = page.getByTestId("workspace-starter");
  await expect(starter).toBeVisible();
  await expect(page.getByTestId("workspace-starter-add-source")).toBeVisible();
  await expect(page.getByTestId("workspace-starter-open-box")).toBeVisible();
  await expect(page.getByTestId("workspace-starter-start-fresh")).toBeVisible();
  await expect(page.getByTestId("workspace-starter-account-link")).toBeVisible();

  await page.getByTestId("workspace-starter-open-box").click();
  await page.getByRole("button", { name: /^Resume$/ }).click();

  await expect(page.getByTestId("workspace-document-workbench")).toBeVisible();
  await expect(page.getByTestId("workspace-diagnostics-rail")).toBeVisible();

  await page.getByTestId("workspace-inline-operate-trigger").click();
  await expect(page.getByTestId("workspace-operate-finding-row").first()).toBeVisible({
    timeout: 60_000,
  });

  await page.getByTestId("workspace-finding-inspect").first().click();
  await expect(page.getByTestId("workspace-operate-inspect")).toBeVisible();

  await page.getByTestId("workspace-attest-block-input").fill(
    `Guardian attestation ${Date.now()}`,
  );
  await page.getByTestId("workspace-attest-block-submit").click();
  await expect(page.getByTestId("workspace-attest-block-remove")).toBeVisible({
    timeout: 30_000,
  });

  await page.getByTestId("workspace-draft-receipt").click();
  await expect(page.getByTestId("workspace-seal-latest-receipt")).toBeVisible({
    timeout: 30_000,
  });

  await page.getByTestId("workspace-seal-latest-receipt").click();
  await expect(page.getByTestId("receipt-seal-dialog")).toBeVisible();

  await expect(page.getByTestId("receipt-seal-blocked-reason")).toBeVisible();

  const acknowledgement = page.getByTestId("receipt-override-acknowledgement");
  await expect(acknowledgement).toBeVisible({ timeout: 30_000 });

  const sealSubmit = page.getByTestId("receipt-seal-submit");
  await expect(sealSubmit).toBeDisabled();
  const proofMetadata = page.getByTestId("workspace-proof-metadata");
  const projectKey = await proofMetadata.getAttribute("data-project-key");
  const draftId = await page.getByTestId("receipt-seal-dialog").getAttribute("data-draft-id");
  const canOverride =
    (await page.getByTestId("receipt-seal-dialog").getAttribute("data-can-override")) === "true";
  const sealReady =
    (await page.getByTestId("receipt-seal-dialog").getAttribute("data-seal-ready")) === "true";
  const deltaStatement = await page.getByTestId("receipt-seal-delta-input").inputValue();

  expect(projectKey).toBeTruthy();
  expect(draftId).toBeTruthy();
  expect(deltaStatement.trim()).toBeTruthy();

  const rejectedSeal = await page.evaluate(
    async ({ draftId: nextDraftId, projectKey: nextProjectKey, nextDeltaStatement, overrideAudit }) => {
      const response = await fetch("/api/workspace/receipt", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftId: nextDraftId,
          deltaStatement: nextDeltaStatement,
          projectKey: nextProjectKey,
          overrideAudit,
          overrideAcknowledged: false,
        }),
      });
      const payload = await response.json().catch(() => null);
      return {
        status: response.status,
        ok: response.ok,
        error: payload?.error || "",
      };
    },
    {
      draftId,
      projectKey,
      nextDeltaStatement: deltaStatement.trim(),
      overrideAudit: canOverride && !sealReady,
    },
  );

  expect(rejectedSeal.ok).toBeFalsy();
  expect(rejectedSeal.status).toBe(409);
  expect(rejectedSeal.error).toContain("Acknowledge the attested overrides");

  const sealResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/workspace/receipt") &&
      response.request().method() === "PUT"
    );
  });

  await acknowledgement.check();
  await expect(sealSubmit).toBeEnabled();
  await sealSubmit.click();

  const sealResponse = await sealResponsePromise;
  const sealPayload = await sealResponse.json().catch(() => null);
  expect(sealResponse.status()).toBe(200);
  expect(sealPayload?.ok).toBeTruthy();

  await expect(page.getByTestId("receipt-seal-dialog")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByTestId("workspace-latest-receipt-status")).toContainText(/sealed/i, {
    timeout: 30_000,
  });
});
