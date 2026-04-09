import { useState, useRef, useEffect, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// LŒGOS — unified prototype
//
// Three views, one app:
//   Mirror  — box on top, chat below, tappable reveals
//   Editor  — syntax-highlighted .loe source with diagnostics
//   Ledger  — sealed/closed boxes (placeholder for Phase 3)
//
// The box is the artifact. Everything else is a surface on it.
// ═══════════════════════════════════════════════════════════

const t = {
  // Light mode (mirror/chat)
  bg: "#FAFAF8", bgAlt: "#F4F3EF",
  card: "#FFFFFF", cardHuman: "#EDEAE3",
  text: "#1a1a1a", textSoft: "#5c5c5c", textMeta: "#9c9c9c", textGhost: "#c8c8c8",
  border: "rgba(0,0,0,0.07)", borderStrong: "rgba(0,0,0,0.12)",
  // Dark mode (editor)
  canvas: "#0c0d10", shell: "#121315", raised: "#1a1d22",
  dkWhite: "#f0f2f4", dkSoft: "rgba(255,255,255,0.70)",
  dkMeta: "rgba(255,255,255,0.42)", dkGhost: "rgba(255,255,255,0.18)",
  dkVoid: "rgba(255,255,255,0.06)", dkLine: "rgba(255,255,255,0.07)",
  // Shared accent
  blue: "#3B7DD8", blueBg: "rgba(59,125,216,0.05)", blueBorder: "rgba(59,125,216,0.14)",
  green: "#3A8F5C", greenBg: "rgba(58,143,92,0.05)", greenBorder: "rgba(58,143,92,0.14)",
  amber: "#B08A1A", amberBg: "rgba(176,138,26,0.05)", amberBorder: "rgba(176,138,26,0.14)",
  purple: "#7B5EA7", purpleBg: "rgba(123,94,167,0.05)",
  cyan: "#2A8A8A", cyanBg: "rgba(42,138,138,0.05)", cyanBorder: "rgba(42,138,138,0.14)",
  red: "#C0392B", redBg: "rgba(192,57,43,0.05)",
  // Editor accents (brighter for dark bg)
  eBlue: "#5ea7ff", eGreen: "#7fd9a0", eAmber: "#f0bf69",
  ePurple: "#c4a0ff", eCyan: "#7fd9d9", eRed: "#ff7f7f",
  eWhite: "#f0f2f4",
  mono: "'SF Mono',SFMono-Regular,ui-monospace,Menlo,Consolas,monospace",
  sans: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif",
};

const DOMAIN = {
  aim:         { glyph: "△", color: t.blue, bg: t.blueBg, border: t.blueBorder },
  evidence:    { glyph: "◻", color: t.green, bg: t.greenBg, border: t.greenBorder },
  story:       { glyph: "○", color: t.amber, bg: t.amberBg, border: t.amberBorder },
  move:        { glyph: "→", color: t.cyan, bg: t.cyanBg, border: t.cyanBorder },
  test:        { glyph: "?", color: t.cyan, bg: t.cyanBg, border: t.cyanBorder },
  observation: { glyph: "◇", color: t.amber, bg: t.amberBg, border: t.amberBorder },
  neutral:     { glyph: "",  color: t.textSoft, bg: "transparent", border: "transparent" },
  transform:   { glyph: "œ", color: t.purple, bg: t.purpleBg, border: "rgba(123,94,167,0.14)" },
  return:      { glyph: "↩", color: t.green, bg: t.greenBg, border: t.greenBorder },
  closure:     { glyph: "7", color: t.red, bg: t.redBg, border: "rgba(192,57,43,0.14)" },
};

// ═══════════════════════════════════════════════════════════
// COMPILER MODULE
// ═══════════════════════════════════════════════════════════

const HEAD_META = {
  DIR: { glyph: "△", color: t.eBlue, domain: "direction" },
  GND: { glyph: "◻", color: t.eGreen, domain: "ground" },
  INT: { glyph: "○", color: t.eAmber, domain: "interpretation" },
  XFM: { glyph: "œ", color: t.ePurple, domain: "transformation" },
  MOV: { glyph: "→", color: t.eCyan, domain: "action" },
  TST: { glyph: "?", color: t.eWhite, domain: "action" },
  RTN: { glyph: "↩", color: t.eGreen, domain: "action" },
  CLS: { glyph: "7", color: t.eRed, domain: "closure" },
};
const HEADS = new Set(Object.keys(HEAD_META));
const KEYWORDS = new Set(["from", "with", "into", "as", "via", "against", "if"]);
const SCALAR_KINDS = new Set(["text", "count", "score", "bool", "date"]);
const ADAPTERS = new Set(["manual", "shell", "http", "queue"]);

const STATE_PRECEDENCE = ["shape_error", "flagged", "awaiting", "rerouted", "stopped", "sealed", "open"];
const STATE_COLORS_DK = { shape_error: t.eRed, flagged: t.eRed, awaiting: t.eBlue, rerouted: t.eAmber, stopped: t.dkMeta, sealed: t.eGreen, open: t.dkGhost };
const STATE_COLORS_LT = { shape_error: t.red, flagged: t.red, awaiting: t.blue, rerouted: t.amber, stopped: t.textMeta, sealed: t.green, open: t.textGhost, empty: t.textGhost, grounded: t.green };

const Compiler = {
  tokenize(source) {
    return source.split("\n").map((raw, i) => {
      const lineNum = i + 1, trimmed = raw.trim();
      if (!trimmed) return { line: lineNum, raw, type: "blank", head: null, verb: null, tokens: [] };
      if (trimmed.startsWith("#")) return { line: lineNum, raw, type: "comment", head: null, verb: null, tokens: [{ text: raw, cat: "comment" }] };
      const parts = trimmed.split(/(\s+)/), lineTokens = [];
      let wordIdx = 0;
      const indent = raw.match(/^(\s*)/)?.[1] || "";
      if (indent) lineTokens.push({ text: indent, cat: "ws" });
      parts.forEach(p => {
        if (/^\s+$/.test(p)) { lineTokens.push({ text: p, cat: "ws" }); return; }
        wordIdx++;
        if (wordIdx === 1 && HEADS.has(p)) lineTokens.push({ text: p, cat: "head" });
        else if (wordIdx === 2 && lineTokens.some(t => t.cat === "head")) lineTokens.push({ text: p, cat: "verb" });
        else if (KEYWORDS.has(p)) lineTokens.push({ text: p, cat: "kw" });
        else if (p.startsWith("@")) lineTokens.push({ text: p, cat: "ref" });
        else if (p.startsWith('"') || p.endsWith('"')) lineTokens.push({ text: p, cat: "str" });
        else if (SCALAR_KINDS.has(p)) lineTokens.push({ text: p, cat: "scalar" });
        else if (ADAPTERS.has(p)) lineTokens.push({ text: p, cat: "adapter" });
        else lineTokens.push({ text: p, cat: "id" });
      });
      const h = lineTokens.find(x => x.cat === "head")?.text || null;
      const v = lineTokens.find(x => x.cat === "verb")?.text || null;
      return { line: lineNum, raw, type: h ? "clause" : "unknown", head: h, verb: v, tokens: lineTokens, domain: h ? HEAD_META[h]?.domain : null };
    });
  },
  buildAST(lines) {
    return lines.filter(l => l.type === "clause").map(l => {
      const wt = l.tokens.filter(t => t.cat !== "ws");
      const pos = [], kw = {};
      let ck = null;
      wt.slice(2).forEach(tok => { if (tok.cat === "kw") ck = tok.text; else if (ck) { kw[ck] = tok.text; ck = null; } else pos.push(tok.text); });
      return { line: l.line, head: l.head, verb: l.verb, pos, kw, domain: l.domain };
    });
  },
  checkShape(ast) {
    const d = [];
    const ac = (() => { for (let i = ast.length - 1; i >= 0; i--) if (ast[i].head === "CLS") return { i, n: ast[i] }; return null; })();
    const ap = ac ? ast.slice(0, ac.i + 1) : ast;
    const has = (h, v) => ap.some(n => n.head === h && (!v || (Array.isArray(v) ? v.includes(n.verb) : n.verb === v)));
    const get = (h, v) => ap.filter(n => n.head === h && (!v || (Array.isArray(v) ? v.includes(n.verb) : n.verb === v)));
    const hasAim = has("DIR", "aim"), hasGnd = get("GND", ["witness", "constraint", "measure", "require"]).length > 0;
    const hasRtn = has("RTN"), hasMov = has("MOV"), hasTst = has("TST"), hasInt = has("INT");
    const seals = get("CLS", "seal"), hasSeal = seals.length > 0, closureAttempt = ac !== null;
    if (!hasAim && ap.length > 0) d.push({ id: "SH001", sev: "error", msg: "Program has no declared aim", line: ap[0]?.line });
    seals.forEach(sc => { if (!ap.some(n => n.head === "RTN" && n.line < sc.line)) d.push({ id: "SH002", sev: "error", msg: "Seal requires at least one prior return", line: sc.line }); });
    if (hasSeal && hasInt && !hasGnd) d.push({ id: "SH004", sev: "error", msg: "Story cannot support seal without ground", line: seals[0].line });
    if (closureAttempt) {
      get("GND", "witness").forEach(w => { if (!w.kw.with) d.push({ id: "SH006", sev: "error", msg: "Closure requires anchored witness (missing 'with')", line: w.line }); });
      get("RTN").forEach(r => { if (!r.kw.via) d.push({ id: "SH007", sev: "error", msg: "Closure requires provenanced return (missing 'via')", line: r.line }); });
    }
    get("RTN", "contradict").forEach(cc => { seals.forEach(sc => { if (cc.line < sc.line && !ap.some(n => n.line > cc.line && n.line < sc.line && n.head === "CLS" && ["flag", "reroute", "stop"].includes(n.verb))) d.push({ id: "SH008", sev: "error", msg: "Contradiction must be mediated before seal", line: sc.line }); }); });
    if (hasMov && !hasTst) d.push({ id: "SW001", sev: "warning", msg: "Move should declare an explicit test", line: get("MOV")[0].line });
    if (hasInt && !hasGnd && !hasSeal) d.push({ id: "SW002", sev: "warning", msg: "Interpretation dominates without ground", line: get("INT")[0].line });
    if (hasGnd && !hasMov) d.push({ id: "SW003", sev: "warning", msg: "Ground exists but no move forces contact", line: get("GND").pop().line });
    return d;
  },
  windowState(ast, diags) {
    if (diags.some(d => d.sev === "error")) return "shape_error";
    const lc = (() => { for (let i = ast.length - 1; i >= 0; i--) if (ast[i].head === "CLS") return ast[i]; return null; })();
    if (lc) { if (lc.verb === "flag") return "flagged"; if (lc.verb === "reroute") return "rerouted"; if (lc.verb === "stop") return "stopped"; if (lc.verb === "seal") return "sealed"; }
    if (ast.some(n => n.head === "MOV") && ast.some(n => n.head === "TST") && !ast.some(n => n.head === "RTN") && !lc) return "awaiting";
    return "open";
  },
  compile(source) {
    const lines = this.tokenize(source);
    const ast = this.buildAST(lines);
    const diags = this.checkShape(ast);
    const ws = this.windowState(ast, diags);
    return { lines, ast, diags, ws, stats: { lines: lines.length, clauses: ast.length, errors: diags.filter(d => d.sev === "error").length, warnings: diags.filter(d => d.sev === "warning").length } };
  }
};

// ═══════════════════════════════════════════════════════════
// SAMPLE .LOE FILES
// ═══════════════════════════════════════════════════════════

const SAMPLE_FILES = {
  "farmhouse-search.loe": { label: "farmhouse-search", content: `# Farmhouse grounding window\n\nGND box @farmhouse_box\nDIR aim buy_farmhouse_upstate\n\nGND witness @saved_listings from "saved_listings.md" with v_apr9\nGND witness @lender_notes from "lender_notes.pdf" with hash_c19a42\nGND constraint @budget_cap as score\n\nINT story quieter_life_next_chapter\nINT flag fantasy_drift\n\nXFM compile @saved_listings into @listing_structure\nXFM compare @lender_notes against @listing_structure\n\nMOV move call_lender_a via manual\nTST test real_borrowing_range\n\nRTN receipt @preapproval_a via lender_portal as score\nGND measure @viable_budget_window as score\n\nCLS reroute search_region` },
  "onboarding-test.loe": { label: "onboarding-test", content: `# Product clarity test\n\nGND box @onboarding_clarity\nDIR aim reduce_v1_user_confusion\n\nGND witness @onboarding_copy from "onboarding_v3.md" with hash_a4f8\nGND witness @shell_flow from "figma_export.png" with v_apr9\n\nINT story too_many_surfaces\n\nMOV move run_user_test_5 via manual\nTST test user_can_name_core_loop\n\nRTN confirm 4_of_5_users_confused via user\n\nCLS flag entry_not_legible` },
  "self-seal-ERROR.loe": { label: "self-seal-ERROR", content: `# Counterfeit convergence example\n\nDIR aim pick_strategy\n\nINT story this_feels_right\n\nCLS seal strategy` },
  "seal-ux.loe": { label: "seal-ux", content: `# Seal UX — awaiting\n\nGND box @seal_ux_test\nDIR aim user_feels_seal_moment\n\nGND witness @sessions from "hotjar_batch_04.zip" with v_apr9\n\nINT story seal_is_satisfying\n\nMOV move run_5_user_sessions via manual\nTST test user_can_describe_what_seal_meant` },
};

// ═══════════════════════════════════════════════════════════
// SEVEN API
// ═══════════════════════════════════════════════════════════

async function sevenRespond(msg, history, box) {
  const ctx = box.aim ? `Box: aim="${box.aim}", evidence=[${box.evidence.map(e=>e.text).join(";")}], story=[${box.story.map(s=>s.text).join(";")}]` : "Empty box.";
  const hist = history.slice(-4).map(m => m.role === "human" ? `H: ${m.text}` : `S: ${m.segments?.map(s=>s.text).join(" ")}`).join("\n");
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
        system: `You are Seven. Warm, sharp, brief (3-6 sentences). Help people see their thinking structure.\n\nTag every sentence:\n{"segments":[{"text":"...","domain":"aim|evidence|story|move|observation|neutral","loe":"DIR aim ...|GND witness ...|INT story ...|MOV move ...|","boxRegion":"aim|evidence|story|moves|","boxAction":"set|add|","boxValue":"..."}]}\n\nRules: separate evidence from story. "Revenue is $40k" = evidence. "We're growing" = story. Never say Lœgos/sigil/compile/kernel. JSON only, no markdown.`,
        messages: [{ role: "user", content: `${ctx}\n${hist}\nHuman: "${msg}"\nJSON only.` }]
      })
    });
    const d = await r.json();
    return JSON.parse((d.content?.map(c=>c.text||"").join("")||"").replace(/```json|```/g,"").trim());
  } catch(e) { return { segments: [{ text: "Could you say that again?", domain: "neutral", loe: "", boxRegion: "", boxAction: "", boxValue: "" }] }; }
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

function Segment({ text, domain, loe, isLast, boxRegion, onHighlight }) {
  const [open, setOpen] = useState(false);
  const ds = DOMAIN[domain] || DOMAIN.neutral;
  const tagged = domain && domain !== "neutral";
  return (
    <span>
      <span onClick={() => { if (tagged) { setOpen(!open); if (!open && boxRegion) onHighlight?.(boxRegion); } }}
        style={{ cursor: tagged ? "pointer" : "default", borderBottom: tagged ? `1.5px dotted ${ds.border}` : "none", backgroundColor: open ? ds.bg : "transparent", borderRadius: 2, paddingBottom: 0.5, transition: "all 0.15s" }}>
        {text}
      </span>
      {open && loe?.trim() && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: "0 3px", padding: "1px 6px", background: ds.bg, border: `1px solid ${ds.border}`, borderRadius: 4, fontFamily: t.mono, fontSize: 9, color: ds.color, fontWeight: 500, whiteSpace: "nowrap", verticalAlign: "middle" }}>
          <span style={{ opacity: 0.5 }}>{ds.glyph}</span>{loe}
        </span>
      )}
      {open && !loe?.trim() && tagged && (
        <span style={{ display: "inline-flex", margin: "0 2px", padding: "1px 5px", background: ds.bg, borderRadius: 3, fontFamily: t.mono, fontSize: 8, color: ds.color, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", verticalAlign: "middle" }}>{ds.glyph}</span>
      )}
      {!isLast && " "}
    </span>
  );
}

function BoxItem({ text, domain, onRemove }) {
  const ds = DOMAIN[domain] || DOMAIN.neutral;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 5, padding: "3px 0", animation: "itemIn 0.25s ease" }}>
      <span style={{ fontSize: 10, color: ds.color, flexShrink: 0, marginTop: 2, opacity: 0.6 }}>{ds.glyph}</span>
      <span style={{ fontSize: 12.5, color: t.text, lineHeight: 1.4, flex: 1 }}>{text}</span>
      {onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: t.textGhost, fontSize: 10, cursor: "pointer", padding: "0 2px" }}>✕</button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MIRROR VIEW — box + chat
// ═══════════════════════════════════════════════════════════

function MirrorView({ box, setBox, messages, setMessages, loading, setLoading }) {
  const [input, setInput] = useState("");
  const [highlighted, setHighlighted] = useState(null);
  const [boxCollapsed, setBoxCollapsed] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }, [messages, loading]);

  const highlightRegion = r => { setHighlighted(r); setBoxCollapsed(false); setTimeout(() => setHighlighted(null), 1200); };
  const removeItem = (r, id) => setBox(p => ({ ...p, [r]: p[r].filter(i => i.id !== id) }));

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim(); setInput(""); setLoading(true);
    const nm = [...messages, { role: "human", text: txt }]; setMessages(nm);
    const res = await sevenRespond(txt, nm, box);
    if (res?.segments) {
      setMessages(p => [...p, { role: "seven", segments: res.segments }]);
      setBox(prev => {
        const next = { ...prev, evidence: [...prev.evidence], story: [...prev.story], moves: [...prev.moves] };
        res.segments.forEach(s => {
          if (!s.boxAction || !s.boxRegion) return;
          if (s.boxAction === "set" && s.boxRegion === "aim") next.aim = s.boxValue || "";
          if (s.boxAction === "add" && s.boxValue && Array.isArray(next[s.boxRegion]) && !next[s.boxRegion].some(e => e.text === s.boxValue))
            next[s.boxRegion].push({ text: s.boxValue, id: Math.random().toString(36).slice(2) });
        });
        return next;
      });
    }
    setLoading(false); inputRef.current?.focus();
  };

  const hasContent = box.aim || box.evidence.length > 0 || box.story.length > 0 || box.moves.length > 0;
  const boxState = !hasContent ? "empty" : box.moves.length > 0 ? "awaiting" : box.evidence.length > 0 ? "grounded" : "open";
  const sc = STATE_COLORS_LT[boxState];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: t.bg, overflow: "hidden" }}>
      {/* BOX */}
      <div style={{ flexShrink: 0, borderBottom: `1px solid ${t.border}`, background: t.card, overflow: "hidden", transition: "max-height 0.3s", maxHeight: boxCollapsed ? 38 : 420 }}>
        <div onClick={() => setBoxCollapsed(!boxCollapsed)} style={{ padding: "8px 16px", display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
          <span style={{ fontSize: 9, color: t.textMeta, marginRight: 6 }}>{boxCollapsed ? "▸" : "▾"}</span>
          <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: t.textMeta }}>Box</span>
          {box.aim && <span style={{ fontSize: 12, color: t.textSoft, marginLeft: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{box.aim}</span>}
          {!box.aim && <span style={{ fontSize: 12, color: t.textGhost, marginLeft: 10, fontStyle: "italic" }}>Start talking below</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: sc, marginLeft: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: sc }} />{boxState}
          </span>
        </div>
        {!boxCollapsed && hasContent && (
          <div style={{ padding: "0 16px 10px" }}>
            {box.aim && (
              <div style={{ padding: "6px 10px", marginBottom: 5, borderRadius: 8, border: `1px solid ${highlighted === "aim" ? t.blueBorder : t.border}`, background: highlighted === "aim" ? t.blueBg : "transparent", transition: "all 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: t.blue }}>△</span>
                  <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.blue }}>Aim</span>
                </div>
                <div style={{ fontSize: 13, color: t.text, fontWeight: 500, lineHeight: 1.4 }}>{box.aim}</div>
              </div>
            )}
            {(box.evidence.length > 0 || box.story.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 5 }}>
                <div style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${highlighted === "evidence" ? t.greenBorder : t.border}`, background: highlighted === "evidence" ? t.greenBg : "transparent", transition: "all 0.3s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: t.green }}>◻</span>
                    <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: t.green }}>Evidence</span>
                    <span style={{ fontFamily: t.mono, fontSize: 8, color: t.textGhost, marginLeft: "auto" }}>{box.evidence.length}</span>
                  </div>
                  {box.evidence.map(i => <BoxItem key={i.id} text={i.text} domain="evidence" onRemove={() => removeItem("evidence", i.id)} />)}
                  {!box.evidence.length && <span style={{ fontSize: 11, color: t.textGhost, fontStyle: "italic" }}>—</span>}
                </div>
                <div style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${highlighted === "story" ? t.amberBorder : t.border}`, background: highlighted === "story" ? t.amberBg : "transparent", transition: "all 0.3s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: t.amber }}>○</span>
                    <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: t.amber }}>Story</span>
                    <span style={{ fontFamily: t.mono, fontSize: 8, color: t.textGhost, marginLeft: "auto" }}>{box.story.length}</span>
                  </div>
                  {box.story.map(i => <BoxItem key={i.id} text={i.text} domain="story" onRemove={() => removeItem("story", i.id)} />)}
                  {!box.story.length && <span style={{ fontSize: 11, color: t.textGhost, fontStyle: "italic" }}>—</span>}
                </div>
              </div>
            )}
            {box.moves.length > 0 && (
              <div style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${highlighted === "moves" ? t.cyanBorder : t.border}`, background: highlighted === "moves" ? t.cyanBg : "transparent", transition: "all 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: t.cyan }}>→</span>
                  <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: t.cyan }}>Moves</span>
                </div>
                {box.moves.map(i => <BoxItem key={i.id} text={i.text} domain="move" onRemove={() => removeItem("moves", i.id)} />)}
              </div>
            )}
          </div>
        )}
      </div>
      {/* CHAT */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: 5 }}>
        {!messages.length && <div style={{ textAlign: "center", padding: "20px 20px 8px" }}><div style={{ fontSize: 13, color: t.textMeta }}>What are you thinking about?</div><div style={{ fontSize: 11, color: t.textGhost, marginTop: 4 }}>Tap any sentence in a reply to see its structure</div></div>}
        {messages.map((m, i) => m.role === "human" ? (
          <div key={i} style={{ display: "flex", justifyContent: "flex-end", padding: "2px 14px" }}>
            <div style={{ maxWidth: "82%", padding: "8px 12px", background: t.cardHuman, borderRadius: "14px 14px 4px 14px", fontSize: 14, color: t.text, lineHeight: 1.55 }}>{m.text}</div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", justifyContent: "flex-start", padding: "2px 14px" }}>
            <div style={{ maxWidth: "88%", padding: "8px 12px", background: t.card, borderRadius: "14px 14px 14px 4px", border: `1px solid ${t.border}`, fontSize: 14, color: t.text, lineHeight: 1.65 }}>
              {m.segments?.map((s, j) => <Segment key={j} text={s.text} domain={s.domain} loe={s.loe} isLast={j === m.segments.length - 1} boxRegion={s.boxRegion} onHighlight={highlightRegion} />)}
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", justifyContent: "flex-start", padding: "2px 14px" }}><div style={{ padding: "10px 16px", background: t.card, borderRadius: "14px 14px 14px 4px", border: `1px solid ${t.border}`, display: "flex", gap: 4 }}>{[0,1,2].map(i=><span key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.textMeta, animation: `dotPulse 1.2s ease ${i*0.2}s infinite` }}/>)}</div></div>}
      </div>
      {/* INPUT */}
      <div style={{ padding: "6px 10px 10px", borderTop: `1px solid ${t.border}`, background: t.card, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", background: t.bg, borderRadius: 14, padding: "3px 3px 3px 13px", border: `1px solid ${t.border}` }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Think out loud..." rows={1}
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: t.sans, fontSize: 15, color: t.text, resize: "none", lineHeight: 1.5, padding: "7px 0", maxHeight: 100 }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }} />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: loading || !input.trim() ? "default" : "pointer", background: input.trim() && !loading ? t.blue : "rgba(0,0,0,0.04)", color: input.trim() && !loading ? "#fff" : t.textGhost, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, transition: "all 0.15s" }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EDITOR VIEW
// ═══════════════════════════════════════════════════════════

function TokenLine({ tokens }) {
  const catStyle = { head: c => ({ color: HEAD_META[c]?.color || t.dkSoft, fontWeight: 700 }), verb: () => ({ color: t.eWhite, fontWeight: 500 }), kw: () => ({ color: t.ePurple, fontStyle: "italic" }), ref: () => ({ color: t.eCyan }), str: () => ({ color: "#c9a06c" }), scalar: () => ({ color: t.eAmber, fontStyle: "italic" }), adapter: () => ({ color: t.eGreen }), id: () => ({ color: t.dkSoft }), ws: () => ({}), comment: () => ({ color: "rgba(255,255,255,0.25)", fontStyle: "italic" }) };
  return <span>{tokens.map((tk, i) => {
    const sf = (catStyle[tk.cat] || catStyle.id)(tk.text);
    return <span key={i}><span style={sf}>{tk.text}</span>{tk.cat === "head" && HEAD_META[tk.text] && <span style={{ color: `${HEAD_META[tk.text].color}40`, fontSize: "0.85em", marginLeft: 2 }}>{HEAD_META[tk.text].glyph}</span>}</span>;
  })}</span>;
}

function EditorView({ activeFile, setActiveFile }) {
  const [activeDiag, setActiveDiag] = useState(null);
  const allCompiled = useMemo(() => { const r = {}; Object.entries(SAMPLE_FILES).forEach(([k, f]) => { r[k] = Compiler.compile(f.content); }); return r; }, []);
  const compiled = allCompiled[activeFile];
  if (!compiled) return null;
  const { lines, diags, ws, stats } = compiled;
  const errLines = new Set(diags.filter(d => d.sev === "error").map(d => d.line));
  const warnLines = new Set(diags.filter(d => d.sev === "warning").map(d => d.line));
  const primary = diags.find(d => d.sev === "error");
  const wsc = STATE_COLORS_DK[ws];

  return (
    <div style={{ flex: 1, display: "flex", background: t.canvas, color: t.dkWhite, overflow: "hidden" }}>
      {/* File tree */}
      <div style={{ width: 180, flexShrink: 0, borderRight: `1px solid ${t.dkLine}`, background: t.shell, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 12px 6px", borderBottom: `1px solid ${t.dkLine}` }}>
          <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.dkMeta }}>Files</span>
        </div>
        <div style={{ padding: "4px 0", flex: 1, overflow: "auto" }}>
          {Object.keys(SAMPLE_FILES).map(k => {
            const isActive = activeFile === k;
            const fws = allCompiled[k]?.ws || "open";
            return (
              <div key={k} onClick={() => { setActiveFile(k); setActiveDiag(null); }} style={{ padding: "4px 12px 4px 16px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: isActive ? "rgba(94,167,255,0.08)" : "transparent", borderLeft: isActive ? `2px solid ${t.eBlue}` : "2px solid transparent" }}>
                <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: STATE_COLORS_DK[fws], flexShrink: 0 }} />
                <span style={{ fontFamily: t.mono, fontSize: 10, color: isActive ? t.dkWhite : t.dkSoft, fontWeight: isActive ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{SAMPLE_FILES[k].label}</span>
                <span style={{ fontFamily: t.mono, fontSize: 7, color: t.dkGhost }}>.loe</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Code */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "5px 14px", borderBottom: `1px solid ${t.dkLine}`, background: t.raised, flexShrink: 0, display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.dkMeta }}>{SAMPLE_FILES[activeFile].label}.loe</span>
          <div style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: wsc }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: wsc }} />{ws.replace("_", " ")}
          </span>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ padding: "4px 0" }}>
            {lines.map((l, i) => {
              const isErr = errLines.has(l.line), isWarn = warnLines.has(l.line);
              const isActive = activeDiag?.line === l.line;
              const isPrimary = primary?.line === l.line && !activeDiag;
              const diag = diags.find(d => d.line === l.line);
              const dm = l.domain ? HEAD_META[l.head] : null;
              return (
                <div key={i}>
                  <div style={{ display: "flex", minHeight: 21, background: isActive ? "rgba(94,167,255,0.07)" : isErr ? "rgba(255,127,127,0.03)" : isWarn ? "rgba(240,191,105,0.02)" : "transparent" }}>
                    <div style={{ width: 3, flexShrink: 0, backgroundColor: dm ? `${dm.color}18` : "transparent" }} />
                    <div style={{ width: 40, flexShrink: 0, textAlign: "right", padding: "1px 8px 1px 0", fontSize: 10, color: isActive ? t.dkSoft : t.dkGhost, userSelect: "none", borderRight: `1px solid ${t.dkLine}`, position: "relative" }}>
                      {l.line}
                      {(isErr || isWarn) && <span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", width: 4, height: 4, borderRadius: 2, backgroundColor: isErr ? t.eRed : t.eAmber }} />}
                    </div>
                    <div style={{ flex: 1, padding: "1px 8px 1px 12px", fontSize: 12, lineHeight: "21px", whiteSpace: "pre", fontFamily: t.mono }}>
                      <TokenLine tokens={l.tokens} />
                    </div>
                  </div>
                  {diag && (isActive || isPrimary) && (
                    <div style={{ padding: "2px 8px 2px 56px", background: diag.sev === "error" ? "rgba(255,127,127,0.05)" : "rgba(240,191,105,0.04)" }}>
                      <span style={{ fontFamily: t.mono, fontSize: 9, color: diag.sev === "error" ? t.eRed : t.eAmber, fontWeight: 700 }}>{diag.id}</span>
                      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.dkSoft, marginLeft: 6 }}>{diag.msg}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Diagnostics */}
        <div style={{ borderTop: `1px solid ${t.dkLine}`, background: t.shell, flexShrink: 0, maxHeight: 120, overflow: "auto" }}>
          {!diags.length ? (
            <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.eGreen }} />
              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.eGreen }}>Shape pass: clear</span>
            </div>
          ) : (
            <div style={{ padding: "6px 0" }}>
              {diags.map((d, i) => (
                <div key={i} onClick={() => setActiveDiag(activeDiag?.line === d.line ? null : d)} style={{ padding: "3px 14px", display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                  <span style={{ width: 5, height: 5, borderRadius: 3, marginTop: 4, flexShrink: 0, backgroundColor: d.sev === "error" ? t.eRed : t.eAmber }} />
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.dkSoft, lineHeight: 1.5 }}>
                    <span style={{ color: d.sev === "error" ? t.eRed : t.eAmber, fontWeight: 700 }}>{d.id}</span> {d.msg}
                    <span style={{ color: t.dkGhost }}> [ln {d.line}]</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ height: 22, display: "flex", alignItems: "center", padding: "0 14px", borderTop: `1px solid ${t.dkLine}`, background: t.shell, gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: t.mono, fontSize: 8, color: t.dkMeta }}>Lœgos v0.5</span>
          <span style={{ fontFamily: t.mono, fontSize: 8, color: t.dkMeta }}>{stats.clauses} clauses</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: t.mono, fontSize: 8, color: stats.errors ? t.eRed : t.eGreen }}>{stats.errors}E {stats.warnings}W</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP — unified
// ═══════════════════════════════════════════════════════════

export default function Loegos() {
  const [view, setView] = useState("mirror");
  const [box, setBox] = useState({ aim: "", evidence: [], story: [], moves: [] });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorFile, setEditorFile] = useState("farmhouse-search.loe");

  const isDark = view === "editor";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: isDark ? t.canvas : t.bg }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes dotPulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1); } }
        @keyframes itemIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        textarea:focus, button:focus { outline: none; }
        ::placeholder { color: ${isDark ? "rgba(255,255,255,0.25)" : "#b5b5b5"}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}; border-radius: 2px; }
      `}</style>

      {/* NAV */}
      <div style={{
        height: 40, display: "flex", alignItems: "center", padding: "0 14px",
        borderBottom: `1px solid ${isDark ? t.dkLine : t.border}`,
        background: isDark ? t.shell : t.card, flexShrink: 0, gap: 10,
      }}>
        <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: isDark ? t.dkWhite : t.text }}>LŒGOS</span>
        <div style={{ flex: 1 }} />
        {["mirror", "editor"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            fontFamily: t.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "5px 12px", border: `1px solid ${view === v ? (isDark ? "rgba(255,255,255,0.12)" : t.borderStrong) : "transparent"}`,
            borderRadius: 6, cursor: "pointer",
            background: view === v ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
            color: view === v ? (isDark ? t.dkWhite : t.text) : (isDark ? t.dkMeta : t.textMeta),
          }}>{v}</button>
        ))}
      </div>

      {/* VIEWS */}
      {view === "mirror" && <MirrorView box={box} setBox={setBox} messages={messages} setMessages={setMessages} loading={loading} setLoading={setLoading} />}
      {view === "editor" && <EditorView activeFile={editorFile} setActiveFile={setEditorFile} />}
    </div>
  );
}
