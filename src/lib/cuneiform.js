export const BYPASS_CODES = ["enki7", "gracearchercloud"];

const TARGET_GLYPHS = ["𒀭", "𒂗", "𒆠", "𒐛", "𒋾", "𒅎", "𒆳"];

const PASSWORD_A = ["𒀭", "𒂗", "𒆠", "𒐛"];
const PASSWORD_B = ["𒀭", "𒋾", "𒅎", "𒆳"];

export const PUZZLE_SUCCESS_PHASES = [
  ["Alignment registered"],
  ["Threshold opening"],
  ["Entering reader"],
];

const RANGE_A_START = 0x12000;
const RANGE_A_END = 0x12399;
const RANGE_B_START = 0x12400;
const RANGE_B_END = 0x12473;

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export function buildNoisePool() {
  const excluded = new Set(TARGET_GLYPHS);
  const pool = [];

  for (let codePoint = RANGE_A_START; codePoint <= RANGE_A_END; codePoint += 1) {
    const glyph = String.fromCodePoint(codePoint);
    if (!excluded.has(glyph)) pool.push(glyph);
  }

  for (let codePoint = RANGE_B_START; codePoint <= RANGE_B_END; codePoint += 1) {
    const glyph = String.fromCodePoint(codePoint);
    if (!excluded.has(glyph)) pool.push(glyph);
  }

  return pool;
}

export function createSchedule(foundGlyphs, frozenColumns) {
  const remainingTargets = TARGET_GLYPHS.filter((glyph) => !foundGlyphs.includes(glyph));
  const activeColumns = [0, 1, 2, 3].filter((column) => !frozenColumns[column]);
  const availableSlots = [];

  for (let tick = 0; tick < 13; tick += 1) {
    for (const column of activeColumns) {
      availableSlots.push({ tick, column });
    }
  }

  const chosenSlots = shuffle(availableSlots);
  const schedule = Array.from({ length: 13 }, () => []);

  remainingTargets.forEach((glyph, index) => {
    const slot = chosenSlots[index];
    if (!slot) return;
    schedule[slot.tick].push({ column: slot.column, glyph });
  });

  return schedule;
}

export function getUnlockPassword(foundGlyphs) {
  const found = new Set(foundGlyphs);
  const hasPasswordA = PASSWORD_A.every((glyph) => found.has(glyph));
  const hasPasswordB = PASSWORD_B.every((glyph) => found.has(glyph));

  if (hasPasswordA) return "password-a";
  if (hasPasswordB) return "password-b";
  return null;
}
