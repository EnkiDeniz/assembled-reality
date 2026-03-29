import React, { useId } from "react";
import EmojiReactions from "../interaction/EmojiReactions";
import { useReactions } from "./ReactionContext";

export const P = ({ children, style }) => (
  <p style={{ marginBottom: "1rem", ...style }}>{children}</p>
);

export const BQ = ({ children, style, id }) => {
  const reactId = useId();
  const { emojiReactions, toggleReaction, reader } = useReactions();

  return (
    <blockquote id={id} style={{ margin: "1.3rem 0", padding: "0.9rem 1.3rem", background: "#F0ECE4", borderLeft: "3px solid #B84C2A", fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.6, ...style }}>
      {children}
      <EmojiReactions bqId={reactId} reactions={emojiReactions} toggleReaction={toggleReaction} reader={reader} />
    </blockquote>
  );
};

export const Cit = ({ children, src }) => (
  <blockquote style={{ margin: "1.3rem 0", padding: "0.9rem 1.3rem", fontStyle: "italic", borderLeft: "3px solid #D6D1C8", fontWeight: 400, fontSize: "0.98rem", lineHeight: 1.6 }}>
    {children}
    <span style={{ display: "block", fontStyle: "normal", fontFamily: "'DM Sans',sans-serif", fontSize: "0.64rem", color: "#8A877F", marginTop: 5 }}>{src}</span>
  </blockquote>
);

export const PH = ({ n, t }) => (
  <div style={{ marginTop: "3.5rem", marginBottom: "2.2rem", paddingTop: "1.4rem", borderTop: "2px solid #1A1917" }}>
    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "#B84C2A" }}>Part {n}</div>
    <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "1.35rem", fontWeight: 700, marginTop: 2 }}>{t}</div>
  </div>
);

export const T = ({ h, r }) => (
  <div style={{ margin: "1.3rem 0", overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", lineHeight: 1.5 }}>
      <thead>
        <tr>{h.map((x, i) => <th key={i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.56rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F", textAlign: "left", padding: "0.4rem 0.6rem", borderBottom: "2px solid #1A1917" }}>{x}</th>)}</tr>
      </thead>
      <tbody>
        {r.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ padding: "0.5rem 0.6rem", borderBottom: "1px solid #E8E4DC", verticalAlign: "top" }}>{c}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);

export const S = ({ t, children }) => (
  <span style={{ color: t === "t" ? "#B84C2A" : t === "s" ? "#2A5A6B" : "#6B5A2A", fontSize: "1rem", marginRight: 1 }}>{children}</span>
);
