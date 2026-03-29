import { useState, useEffect } from "react";

export default function WelcomeGuide({ reader, dismissed, onDismiss, onReopen }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expanded, setExpanded] = useState(!dismissed);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // When dismissed changes externally (e.g. resetWelcome), sync
  useEffect(() => {
    if (!dismissed) setExpanded(true);
  }, [dismissed]);

  if (dismissed && !expanded) {
    return (
      <button
        onClick={() => { onReopen(); setExpanded(true); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "0.6875rem", color: "#999", padding: "0 0 8px",
          textDecoration: "underline", textUnderlineOffset: 2,
        }}
      >
        How to use this document
      </button>
    );
  }

  if (!expanded) return null;

  return (
    <div style={{
      marginBottom: "1.5rem",
      padding: isMobile ? "16px 14px" : "18px 20px",
      background: "#F8F7F5",
      border: "1px solid #E5E2DC",
      borderRadius: 4,
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111", marginBottom: 2 }}>
            Welcome, {reader}.
          </div>
          <div style={{ fontSize: "0.8125rem", color: "#666", lineHeight: 1.5 }}>
            This is a living document. You don't just read it — you shape it.
          </div>
        </div>
        <button
          onClick={() => { onDismiss(); setExpanded(false); }}
          style={{
            background: "none", border: "1px solid #D4D4D4", borderRadius: 3,
            padding: "4px 10px", fontSize: "0.6875rem", fontWeight: 500,
            color: "#666", cursor: "pointer", whiteSpace: "nowrap",
            marginLeft: 12, minHeight: 28,
          }}
        >
          Got it
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 8 : 10,
      }}>
        <GuideItem
          icon="✦"
          title="Select any text"
          desc="Highlight with a shape, carry a passage, or start a comment thread."
        />
        <GuideItem
          icon="△ □ ○"
          title="Three shapes"
          desc={<><Sh c="#B84C2A">△</Sh> Strengthens aim · <Sh c="#2A5A6B">□</Sh> Needs evidence · <Sh c="#6B5A2A">○</Sh> Needs context</>}
        />
        <GuideItem
          icon="§"
          title="Section tools"
          desc={<>Each section has <em>Signal · Tag · Discuss</em> at the bottom. Tag sections as load-bearing, needs work, or ready to seal.</>}
        />
        <GuideItem
          icon="◉"
          title="Pulse & Carry"
          desc={<><strong>Pulse</strong> shows team activity. <strong>Carry</strong> collects your selected passages for export.</>}
        />
      </div>

      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: "1px solid #E5E2DC",
        fontSize: "0.6875rem", color: "#999", lineHeight: 1.5,
      }}>
        When 4+ readers vote "Ready to seal" on a section, it locks. The document evolves through your signals.
      </div>
    </div>
  );
}

function GuideItem({ icon, title, desc }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start",
      padding: "6px 8px", background: "#FAFAF9", borderRadius: 3,
      border: "1px solid #EEEBE6",
    }}>
      <span style={{
        fontSize: "0.75rem", fontWeight: 600, color: "#888",
        minWidth: 28, textAlign: "center", flexShrink: 0,
        fontFamily: "'JetBrains Mono',monospace",
        lineHeight: "18px", paddingTop: 1,
      }}>{icon}</span>
      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#333", marginBottom: 1 }}>{title}</div>
        <div style={{ fontSize: "0.6875rem", color: "#777", lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}

function Sh({ c, children }) {
  return <span style={{ color: c, fontWeight: 600 }}>{children}</span>;
}
