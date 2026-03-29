import React, { useId } from "react";
import EmojiReactions from "../interaction/EmojiReactions";
import { useReactions } from "./ReactionContext";

export const P = ({ children, style }) => (
  <p className="mb-3.5" style={style}>{children}</p>
);

export const BQ = ({ children, style, id }) => {
  const reactId = useId();
  const { emojiReactions, toggleReaction, reader } = useReactions();

  return (
    <blockquote id={id} className="my-4.5 py-3 px-4 bg-surface-raised border-l-2 border-ink font-medium text-body leading-[1.65]" style={style}>
      {children}
      <EmojiReactions bqId={reactId} reactions={emojiReactions} toggleReaction={toggleReaction} reader={reader} />
    </blockquote>
  );
};

export const Cit = ({ children, src }) => (
  <blockquote className="my-4.5 py-3 px-4 italic border-l-2 border-border-dark font-normal text-body leading-[1.65]">
    {children}
    <span className="block not-italic text-base text-ink-muted mt-1">{src}</span>
  </blockquote>
);

export const PH = ({ n, t }) => (
  <div className="mt-16 mb-7 pt-6 border-t-2 border-border-dark">
    <div className="text-xs font-semibold tracking-[0.1em] uppercase text-ink-faint mb-0.5">Part {n}</div>
    <div className="text-2xl font-bold leading-[1.2]">{t}</div>
  </div>
);

export const T = ({ h, r }) => (
  <div className="my-4 overflow-x-auto">
    <table className="w-full border-collapse text-md leading-normal">
      <thead>
        <tr>{h.map((x, i) => <th key={i} className="text-sm font-semibold tracking-[0.04em] uppercase text-ink-muted text-left py-1.5 px-2.5 border-b border-ink">{x}</th>)}</tr>
      </thead>
      <tbody>
        {r.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} className="py-2 px-2.5 border-b border-border align-top">{c}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);

export const S = ({ t, children }) => (
  <span style={{ color: t === "t" ? "#DC2626" : t === "s" ? "#0369A1" : "#B45309" }} className="font-medium">{children}</span>
);
