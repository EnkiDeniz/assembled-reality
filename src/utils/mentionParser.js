import { READERS } from "../constants";

/**
 * Parse text for @mentions and return an array of segments.
 * Each segment is either { type: "text", value } or { type: "mention", name }.
 */
export function parseMentions(text) {
  if (!text) return [{ type: "text", value: "" }];

  const segments = [];
  const regex = new RegExp(`@(${READERS.join("|")})`, "g");
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mention", name: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

/**
 * Filter text to find mentions of a specific reader.
 */
export function hasMention(text, readerName) {
  return text?.includes(`@${readerName}`);
}
