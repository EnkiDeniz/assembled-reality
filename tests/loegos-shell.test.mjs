import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_MODES,
  buildContextCardsFromRoomView,
  SECTION_IDS,
  SHELL_ROUTES,
  CONTEXT_CARD_KINDS,
  buildDormantEchoPulseState,
  buildEchoPulseState,
  buildEchoPulseStateFromRoomView,
  buildWorkingEchoStripStateFromRoomView,
  buildPulseStripState,
  normalizeAppMode,
  normalizeSectionId,
  normalizeShellRoute,
} from "../src/lib/loegos-shell.js";

test("shell interfaces normalize route and section ids", () => {
  assert.equal(normalizeSectionId("context"), SECTION_IDS.context);
  assert.equal(normalizeSectionId("witness"), SECTION_IDS.witness);
  assert.equal(normalizeSectionId("unknown"), "");
  assert.equal(normalizeShellRoute("dream"), SHELL_ROUTES.dream);
  assert.equal(normalizeShellRoute("ACCOUNT"), SHELL_ROUTES.account);
  assert.equal(normalizeShellRoute("else"), SHELL_ROUTES.workspace);
  assert.equal(normalizeAppMode("Dream"), APP_MODES.dream);
  assert.equal(normalizeAppMode("else"), APP_MODES.room);
});

test("echo pulse prioritizes steering objects over dormant state", () => {
  const pulse = buildEchoPulseState({
    change: "Preview moved.",
    decide: "Check one live source.",
    tension: "The current read conflicts with witness.",
    survives: "The return bent the read.",
  });

  assert.equal(pulse.primary?.key, "decide");
  assert.equal(pulse.secondary?.key, "changed");
  assert.equal(pulse.dormant, false);
  assert.equal(pulse.pulse.primary?.kind, CONTEXT_CARD_KINDS.decide);
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

test("room working echo strip keeps field state and steering objects visible", () => {
  const strip = buildWorkingEchoStripStateFromRoomView({
    fieldState: {
      key: "awaiting_return",
      label: "Awaiting return",
    },
    session: {
      updatedAt: "2026-04-13T12:00:00.000Z",
    },
    workingEcho: {
      whatSeemsReal: {
        text: "The source points to one live protocol worth keeping.",
      },
      openTension: [
        {
          text: "The story still outruns the witness.",
        },
      ],
      whatWouldDecideIt: {
        text: "Check one external witness before moving.",
      },
    },
  });

  assert.equal(strip.field.label, "Awaiting return");
  assert.equal(strip.field.tone, "grounded");
  assert.equal(strip.primary?.label, "Would Decide");
  assert.match(strip.primary?.verdict || "", /external witness/);
  assert.equal(strip.secondaryCards.length >= 2, true);
});

test("room context cards and pulse strip stay priority-ordered and compressed", () => {
  const cards = buildContextCardsFromRoomView({
    activePreview: {
      summary: "Preview formed.",
    },
    focusedWitness: {
      title: "Field notes",
      summary: "Witness opened.",
      openHref: "/workspace?document=field-notes&adjacent=witness",
    },
    workingEcho: {
      whatWouldDecideIt: {
        text: "Check one live receipt.",
      },
      openTension: [
        {
          text: "Signal and story still diverge.",
        },
      ],
    },
  });
  const pulse = buildPulseStripState(cards);

  assert.equal(cards[0].kind, CONTEXT_CARD_KINDS.decide);
  assert.equal(pulse.primary?.kind, CONTEXT_CARD_KINDS.decide);
  assert.equal(pulse.visibleCardIds.length >= 2, true);
});

test("dormant echo pulse stays empty without room signal", () => {
  const pulse = buildDormantEchoPulseState();

  assert.equal(pulse.dormant, true);
  assert.equal(pulse.entries.length, 0);
});
