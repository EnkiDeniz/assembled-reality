import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

function parseClock(value = "") {
  const parts = String(value || "")
    .trim()
    .split(":")
    .map((entry) => Number.parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry));

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

async function bootstrapGuardian(page) {
  await page.goto("/api/auth/dev-guardian?action=bootstrap", { waitUntil: "commit" });
  await expect(page.locator("body")).toContainText('"ok":true');
}

function mediaMock() {
  const timers = new WeakMap();

  const clearTimer = (element) => {
    const timerId = timers.get(element);
    if (timerId) {
      clearInterval(timerId);
      timers.delete(element);
    }
  };

  const defineMediaProperty = (name, descriptor) => {
    try {
      Object.defineProperty(HTMLMediaElement.prototype, name, {
        configurable: true,
        ...descriptor,
      });
    } catch {}
  };

  defineMediaProperty("paused", {
    get() {
      return this.__mockPaused ?? true;
    },
  });

  defineMediaProperty("currentTime", {
    get() {
      return this.__mockCurrentTime ?? 0;
    },
    set(value) {
      this.__mockCurrentTime = Number(value) || 0;
    },
  });

  defineMediaProperty("duration", {
    get() {
      return this.__mockDuration ?? 12;
    },
  });

  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value() {
      this.__mockDuration = this.__mockDuration || 12;
      this.dispatchEvent(new Event("loadedmetadata"));
      this.dispatchEvent(new Event("canplay"));
    },
  });

  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value() {
      this.__mockDuration = this.__mockDuration || 12;
      this.__mockPaused = false;
      this.dispatchEvent(new Event("loadedmetadata"));
      this.dispatchEvent(new Event("play"));
      clearTimer(this);

      const timerId = setInterval(() => {
        if (this.__mockPaused) {
          return;
        }

        this.__mockCurrentTime = Math.min((this.__mockCurrentTime || 0) + 0.5, this.__mockDuration);
        this.dispatchEvent(new Event("timeupdate"));

        if (this.__mockCurrentTime >= this.__mockDuration) {
          clearTimer(this);
          this.__mockPaused = true;
          this.dispatchEvent(new Event("ended"));
        }
      }, 50);

      timers.set(this, timerId);
      return Promise.resolve();
    },
  });

  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value() {
      if (this.__mockPaused) {
        return;
      }

      this.__mockPaused = true;
      clearTimer(this);
      this.dispatchEvent(new Event("pause"));
    },
  });
}

async function installMediaMock(page) {
  await page.addInitScript(mediaMock);
  await page.evaluate(mediaMock);
}

async function mockDreamAudio(page) {
  await page.route("**/api/seven/audio", async (route) => {
    const payload = route.request().postDataJSON();

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Seven-Provider": "elevenlabs",
        "X-Seven-Voice-Id": payload?.voiceId || "section-dream",
      },
      body: "FAKEAUDIO",
    });
  });
}

async function mockCompilerRead(page) {
  await page.route("**/api/compiler-read", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        compilerRead: {
          documentSummary: {
            title: "field-notes.md",
            documentType: "protocol",
            dominantMode: "proposal",
            summary: "The document contains one operational subset worth pressure-testing.",
          },
          claimSet: [
            {
              id: "claim_protocol",
              text: "Pull one trace before changing the flow.",
              claimKind: "protocol",
              translationReadiness: "candidate_for_translation",
              provenanceClass: "self_reported",
              supportStatus: "weakly_supported",
              evidenceRefs: ["field-notes"],
              reason: "This is the smallest protocol step the document names.",
              sourceExcerpt: "Pull one trace before changing the flow.",
            },
            {
              id: "claim_phi",
              text: "The flow should feel hospitable to doubt.",
              claimKind: "philosophy",
              translationReadiness: "non_compilable_philosophy",
              provenanceClass: "unknown",
              supportStatus: "unsupported",
              evidenceRefs: [],
              reason: "This belongs outside the v0 translated subset.",
              sourceExcerpt: "The flow should feel hospitable to doubt.",
            },
          ],
          loeCandidate: {
            source: 'GND box @field_notes\nDIR aim "Pull one trace before changing the flow."\nMOV move "Pull one trace before changing the flow." via manual\nTST test "A concrete witness can confirm or falsify this protocol step."',
            translationStrategy: "Carried one protocol line and one move/test pair from the provisional claim set.",
            omittedClaims: ["claim_phi"],
          },
          compileResult: {
            executed: true,
            compileState: "clean",
            runtimeState: "awaiting",
            closureType: null,
            mergedWindowState: "awaiting",
            diagnostics: [],
          },
          verdict: {
            overall: "lawful_subset_compiles",
            primaryFinding: "The language can hold part of this document, but the central protocol still needs stronger witness.",
            failureClass: "mixed",
            readDisposition: "needs_more_witness",
          },
          nextMoves: [
            "Add one quoted witness or external citation for the central protocol claim.",
            "Keep the operational subset, then rerun Compiler Read.",
          ],
        },
      }),
    });
  });
}

test("dream library uploads markdown, plays, pauses, and restores the last position", async ({
  page,
}) => {
  await bootstrapGuardian(page);

  await page.goto("/dream", { waitUntil: "commit" });
  await installMediaMock(page);
  await mockDreamAudio(page);
  await expect(page.getByTestId("dream-screen")).toBeVisible();

  await page.getByTestId("dream-upload-input").setInputFiles({
    name: "field-notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(
      "# Opening\n\nThis is the first paragraph for Dream Library.\n\nThis is the second paragraph so the player has enough text to continue.",
    ),
  });

  await expect(page.getByTestId("dream-player")).toContainText("field-notes.md");
  await expect(page.getByTestId("dream-play-toggle")).toHaveAttribute("aria-label", "Pause playback");
  await expect
    .poll(async () => parseClock(await page.getByTestId("dream-current-time").textContent()))
    .toBeGreaterThan(0);

  await page.getByTestId("dream-play-toggle").click();
  await expect(page.getByTestId("dream-play-toggle")).toHaveAttribute("aria-label", "Continue playback");

  const pausedAt = parseClock(await page.getByTestId("dream-current-time").textContent());
  expect(pausedAt).toBeGreaterThan(0);

  await page.reload({ waitUntil: "commit" });

  await expect(page.getByTestId("dream-player")).toContainText("field-notes.md");
  await expect
    .poll(async () => parseClock(await page.getByTestId("dream-current-time").textContent()))
    .toBeGreaterThan(0);

  await page.getByTestId("dream-play-toggle").click();
  await expect(page.getByTestId("dream-play-toggle")).toHaveAttribute("aria-label", "Pause playback");
  await expect
    .poll(async () => parseClock(await page.getByTestId("dream-current-time").textContent()))
    .toBeGreaterThan(pausedAt);
});

test("section dream is reachable from signed-in menus and remains usable on mobile", async ({
  page,
}) => {
  await bootstrapGuardian(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/account", { waitUntil: "commit" });
  await page.getByTestId("shell-mode-dream").click();
  await expect(page.getByTestId("dream-screen")).toBeVisible();
  await expect(page.getByTestId("dream-player")).toBeVisible();

  await page.goto("/workspace", { waitUntil: "commit" });
  await expect(page.getByTestId("shell-mode-dream")).toBeVisible();
  await page.getByTestId("shell-mode-dream").click();
  await expect(page.getByTestId("dream-screen")).toBeVisible();
});

test("dream runs compiler read inline and clears it on refresh", async ({ page }) => {
  await bootstrapGuardian(page);
  await installMediaMock(page);
  await mockDreamAudio(page);
  await mockCompilerRead(page);

  await page.goto("/dream", { waitUntil: "commit" });
  await expect(page.getByTestId("dream-screen")).toBeVisible();

  await page.getByTestId("dream-upload-input").setInputFiles({
    name: "field-notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(
      "# Field Notes\n\nPull one trace before changing the flow.\n\nThe flow should feel hospitable to doubt.",
    ),
  });

  await page.getByTestId("dream-compiler-read").click();
  await expect(page.getByTestId("dream-compiler-read-panel")).toBeVisible();
  await expect(page.getByTestId("dream-compiler-read-summary")).toContainText(
    "The language can hold part of this document",
  );
  await expect(page.getByTestId("dream-compiler-read-claims")).toContainText("Seven-assisted extraction remains provisional");
  await expect(page.getByTestId("dream-compiler-read-next-moves")).toContainText(
    "Add one quoted witness or external citation",
  );

  await page.getByTestId("dream-compiler-read-inspect").click();
  await expect(page.getByTestId("dream-compiler-read-inspect")).toContainText("GND box @field_notes");

  await page.getByTestId("dream-paste-toggle").click();
  await page.getByTestId("dream-paste-input").fill("# New draft\n\nThis is not saved yet.");
  await expect(page.getByTestId("dream-compiler-read")).toBeDisabled();
  await expect(page.getByTestId("dream-compiler-read-disabled-reason")).toContainText(
    "Update pasted markdown first.",
  );
  await expect(page.getByTestId("dream-compiler-read-panel")).toHaveCount(0);

  await page.reload({ waitUntil: "commit" });
  await expect(page.getByTestId("dream-player")).toContainText("field-notes.md");
  await expect(page.getByTestId("dream-compiler-read-panel")).toHaveCount(0);
});
