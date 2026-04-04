import { track } from "@vercel/analytics";

export function recordProductEvent(name, properties = {}) {
  try {
    track(name, properties);
  } catch {
    // Ignore analytics failures in the invite-only beta.
  }
}
