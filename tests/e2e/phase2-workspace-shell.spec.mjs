import { expect, test } from "@playwright/test";

test.setTimeout(300_000);

test("phase2 workspace shell preserves intake/player and proposal gate", async ({ page }) => {

  await page.route("**/api/workspace/paste", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        document: { documentKey: "doc_paste_1" },
      }),
    });
  });

  await page.route("**/api/workspace/link", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        document: { documentKey: "doc_link_1" },
        project: { projectKey: "project_phase2" },
      }),
    });
  });

  await page.route("**/api/reader/listening-session**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          listeningSession: { status: "paused" },
          voicePreferences: {
            preferredListeningRate: 1.1,
            preferredVoiceProvider: "openai",
            preferredVoiceId: "alloy",
          },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        listeningSession: { status: "paused" },
        voicePreferences: { preferredListeningRate: 1.1 },
      }),
    });
  });

  await page.route("**/api/seven", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        answer: "Try a tighter root",
        instrumentResult: {
          summary: "One candidate",
          candidates: [
            {
              rootText: "stabilize intake and playback",
              rationale: "keeps focus",
            },
          ],
        },
      }),
    });
  });

  await page.goto("/workspace/phase1?phase2demo=1", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("phase2-shell-root")).toBeVisible();

  await page.getByTestId("phase2-intake-paste-input").fill("Phase 2 source from paste");
  await page.getByTestId("phase2-intake-paste-submit").click();
  await expect(page.getByTestId("phase2-ledger-panel")).toContainText("intake_imported");

  await page.getByTestId("phase2-chat-input").fill("give me a better root");
  await page.getByTestId("phase2-chat-send").click();
  await expect(page.getByTestId("phase2-ledger-panel")).toContainText("proposal_accepted");

  await page.getByTestId("phase2-voice-resume").click();
  await expect(page.getByText(/Listening session restored/i)).toBeVisible();

  await page.getByTestId("phase2-nav-editor").click();
  await expect(page.getByTestId("phase2-parity-indicator")).toContainText("ok");
});
