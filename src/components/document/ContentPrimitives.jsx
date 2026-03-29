import React, { useId } from "react";
import EmojiReactions from "../interaction/EmojiReactions";
import { useReactions } from "./ReactionContext";

export const P = ({ children, style }) => (
  <p style={{ marginBottom: "0.85rem", ...style }}>{children}</p>
);

export const BQ = ({ children, style, id }) => {
  const reactId = useId();
  const { emojiReactions, toggleReaction, reader } = useReactions();

  return (
    <blockquote id={id} style={{
      margin: "1.1rem 0", padding: "0.75rem 1rem",
      background: "#F5F5F4", borderLeft: "2px solid #111",
      fontWeight: 500, fontSize: "0.9375rem", lineHeight: 1.65,
      ...style,
    }}>
      {children}
      <EmojiReactions bqId={reactId} reactions={emojiReactions} toggleReaction={toggleReaction} reader={reader} />
    </blockquote>
  );
};

export const Cit = ({ children, src }) => (
  <blockquote style={{
    margin: "1.1rem 0", padding: "0.75rem 1rem",
    fontStyle: "italic", borderLeft: "2px solid #D4D4D4",
    fontWeight: 400, fontSize: "0.9375rem", lineHeight: 1.65,
  }}>
    {children}
    <span style={{ display: "block", fontStyle: "normal", fontSize: "0.75rem", color: "#888", marginTop: 4 }}>{src}</span>
  </blockquote>
);

export const PH = ({ n, t }) => (
  <div style={{ marginTop: "4rem", marginBottom: "1.8rem", paddingTop: "1.5rem", borderTop: "2px solid #D4D4D4" }}>
    <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#BBB", marginBottom: 2 }}>Part {n}</div>
    <div style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1.2 }}>{t}</div>
  </div>
);

export const T = ({ h, r }) => (
  <div style={{ margin: "1rem 0", overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", lineHeight: 1.5 }}>
      <thead>
        <tr>{h.map((x, i) => <th key={i} style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#888", textAlign: "left", padding: "0.4rem 0.6rem", borderBottom: "1px solid #111" }}>{x}</th>)}</tr>
      </thead>
      <tbody>
        {r.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ padding: "0.5rem 0.6rem", borderBottom: "1px solid #E5E5E5", verticalAlign: "top" }}>{c}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);

export const S = ({ t, children }) => (
  <span style={{ color: t === "t" ? "#DC2626" : t === "s" ? "#0369A1" : "#B45309", fontWeight: 500 }}>{children}</span>
);
