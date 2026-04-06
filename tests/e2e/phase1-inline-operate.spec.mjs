import { expect, test } from "@playwright/test";

test("guardian can run inline operate, attest, and hit seal acknowledgement", async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(
    !process.env.OPENAI_API_KEY,
    "OPENAI_API_KEY is required to exercise the real inline Operate flow.",
  );

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

  const acknowledgement = page.getByTestId("receipt-override-acknowledgement");
  await expect(acknowledgement).toBeVisible({ timeout: 30_000 });

  const sealSubmit = page.getByTestId("receipt-seal-submit");
  await expect(sealSubmit).toBeDisabled();
  await acknowledgement.check();
  await expect(sealSubmit).toBeEnabled();
});
