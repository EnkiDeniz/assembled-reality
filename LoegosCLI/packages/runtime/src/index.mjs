export const WINDOW_STATES = Object.freeze({
  open: "open",
  awaiting: "awaiting",
  sealed: "sealed",
  flagged: "flagged",
  stopped: "stopped",
  rerouted: "rerouted",
  attested: "attested",
});

export function createWindowState({ windowId, filePath, compileResult }) {
  return {
    windowId,
    filePath,
    updatedAt: new Date().toISOString(),
    state: compileResult?.mergedWindowState || WINDOW_STATES.open,
    compile: {
      compilationId: compileResult?.compilationId || "",
      diagnostics: compileResult?.diagnostics || [],
      summary: compileResult?.summary || { ok: false, hardErrorCount: 1, warningCount: 0 },
      closureVerb: compileResult?.metadata?.activeClosureVerb || null,
    },
    events: [],
    receipts: [],
  };
}

export function appendEvent(current, event) {
  const next = { ...(current || {}) };
  const events = Array.isArray(next.events) ? [...next.events] : [];
  events.push({
    ...event,
    id: `evt_${events.length + 1}`,
    createdAt: new Date().toISOString(),
  });
  next.events = events;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function appendReceipt(current, receipt) {
  const next = { ...(current || {}) };
  const receipts = Array.isArray(next.receipts) ? [...next.receipts] : [];
  receipts.push({
    ...receipt,
    id: `rcpt_${receipts.length + 1}`,
    createdAt: new Date().toISOString(),
  });
  next.receipts = receipts;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function applyClosureState(current, closureVerb = null) {
  const next = { ...(current || {}) };
  if (closureVerb === "seal") next.state = WINDOW_STATES.sealed;
  else if (closureVerb === "flag") next.state = WINDOW_STATES.flagged;
  else if (closureVerb === "stop") next.state = WINDOW_STATES.stopped;
  else if (closureVerb === "reroute") next.state = WINDOW_STATES.rerouted;
  else if (closureVerb === "attest") next.state = WINDOW_STATES.attested;
  return next;
}
