import test from "node:test";
import assert from "node:assert/strict";
import {
  SECTION_IDS,
  SHELL_ROUTES,
  buildDormantEchoPulseState,
  buildEchoPulseState,
  buildEchoPulseStateFromRoomView,
  normalizeSectionId,
  normalizeShellRoute,
} from "../src/lib/loegos-shell.js";

test("shell interfaces normalize route and section ids", () => {
  assert.equal(normalizeSectionId("mirror"), SECTION_IDS.mirror);
  assert.equal(normalizeSectionId("witness"), SECTION_IDS.witness);
  assert.equal(normalizeSectionId("unknown"), "");
  assert.equal(normalizeShellRoute("dream"), SHELL_ROUTES.dream);
  assert.equal(normalizeShellRoute("ACCOUNT"), SHELL_ROUTES.account);
  assert.equal(normalizeShellRoute("else"), SHELL_ROUTES.workspace);
});

test("echo pulse prioritizes steering objects over dormant state", () => {
  const pulse = buildEchoPulseState({
    change: "Preview moved.",
    decide: "Check one live source.",
    tension: "The current read conflicts with witness.",
    survives: "The return bent the read.",
  });

  assert.equal(pulse.primary?.key, "decide");
  assert.equal(pulse.secondary?.key, "tension");
  assert.equal(pulse.dormant, false);
});

test("room views produce a minimal live echo pulse", () => {
  const pulse = buildEchoPulseStateFromRoomView({
    activePreview: {
      sections: {
        aim: {
          text: "Aim sharpened toward the live drop-off.",
        },
      },
    },
    workingEcho: {
      whatWouldDecideIt: {
        text: "Check whether one verified receipt closes the split.",
      },
      openTension: [
        {
          text: "The strongest story still outruns the witness.",
        },
      ],
      returnDelta: {
        summary: "One return weakened the previous read.",
      },
    },
  });

  assert.equal(pulse.primary?.key, "decide");
  assert.match(pulse.primary?.text || "", /verified receipt/);
  assert.equal(pulse.entries.length >= 3, true);
});

test("dormant echo pulse stays empty without room signal", () => {
  const pulse = buildDormantEchoPulseState();

  assert.equal(pulse.dormant, true);
  assert.equal(pulse.entries.length, 0);
});
