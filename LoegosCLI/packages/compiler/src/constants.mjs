export const HEADS = new Set(["DIR", "GND", "INT", "XFM", "MOV", "TST", "RTN", "CLS"]);

export const KEYWORDS = new Set(["from", "with", "into", "as", "via", "against", "if"]);

export const ADAPTERS = new Set(["manual", "shell", "http", "queue"]);

export const CHANNELS = new Set([
  "user",
  "system",
  "registry",
  "sensor",
  "service",
  "third_party",
  "stripe",
  "substack",
  "counsel",
  "lender_portal",
  "cfo",
]);

export const SCALAR_KINDS = new Set(["text", "count", "score", "bool", "date"]);

export const RESERVED_VERBS = {
  DIR: new Set(["aim", "declare", "commit", "narrow"]),
  GND: new Set(["box", "witness", "constraint", "require", "measure"]),
  INT: new Set(["story", "interpret", "relate", "translate", "flag"]),
  XFM: new Set(["compile", "weld", "compare", "stage", "use"]),
  MOV: new Set(["move", "send", "advance"]),
  TST: new Set(["test", "check", "probe"]),
  RTN: new Set(["receipt", "observe", "confirm", "contradict"]),
  CLS: new Set(["seal", "flag", "stop", "reroute", "attest"]),
};

export const VERB_SIGNATURES = {
  "DIR:aim": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "DIR:declare": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "DIR:commit": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "DIR:narrow": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "GND:box": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "GND:witness": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["from"],
    allowedKeywords: ["from", "with"],
  },
  "GND:constraint": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["as"],
  },
  "GND:require": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "GND:measure": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["as"],
    allowedKeywords: ["as"],
  },
  "INT:story": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "INT:interpret": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "INT:relate": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["against"],
    allowedKeywords: ["against"],
  },
  "INT:translate": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["against"],
    allowedKeywords: ["against"],
  },
  "INT:flag": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: [] },
  "XFM:compile": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["into"],
    allowedKeywords: ["into"],
  },
  "XFM:weld": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["into"],
    allowedKeywords: ["into"],
  },
  "XFM:compare": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["against"],
    allowedKeywords: ["against"],
  },
  "XFM:stage": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["into"],
    allowedKeywords: ["into"],
  },
  "XFM:use": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["from"],
  },
  "MOV:move": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["via"],
    allowedKeywords: ["via"],
  },
  "MOV:send": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["via"],
    allowedKeywords: ["via"],
  },
  "MOV:advance": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["via"],
    allowedKeywords: ["via"],
  },
  "TST:test": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["against"],
  },
  "TST:check": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["against"],
  },
  "TST:probe": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["against"],
  },
  "RTN:receipt": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["via", "as"],
  },
  "RTN:observe": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["via", "as"],
  },
  "RTN:confirm": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["via", "as"],
  },
  "RTN:contradict": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["via", "as"],
  },
  "CLS:seal": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: ["if"] },
  "CLS:flag": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: ["if"] },
  "CLS:stop": { minPositional: 1, maxPositional: 1, requiredKeywords: [], allowedKeywords: ["if"] },
  "CLS:reroute": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: [],
    allowedKeywords: ["if"],
  },
  "CLS:attest": {
    minPositional: 1,
    maxPositional: 1,
    requiredKeywords: ["if"],
    allowedKeywords: ["if"],
  },
};

export function signatureFor(head, verb) {
  return VERB_SIGNATURES[`${head}:${verb}`] || null;
}
