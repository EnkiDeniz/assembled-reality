// localStorage keys
export const KEYS = {
  pass: "ar:p2",
  reader: "ar:r2",
  sigs: "ar:s2",
  anns: "ar:a2",
  highlights: "ar:hl",
  carryList: "ar:cl",
  inlineComments: "ar:ic",
  statusTags: "ar:st",
  readingPos: "ar:rp",
  emojiReactions: "ar:er",
  versionPulse: "ar:vp",
  welcome: "ar:wg2",
};

export function ld(k, fallback) {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : fallback;
  } catch {
    return fallback;
  }
}

export function sv(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error("storage write failed:", e);
  }
}
