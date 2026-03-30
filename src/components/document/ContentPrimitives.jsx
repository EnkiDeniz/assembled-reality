import React, { useId } from "react";
import EmojiReactions from "../interaction/EmojiReactions";
import { useReactions } from "./ReactionContext";

export const P = ({ children, style }) => (
  <p className="mb-5 font-serif text-[1.14rem] leading-[1.72] text-ink-secondary md:text-[1.22rem]" style={style}>{children}</p>
);

export const BQ = ({ children, style, id }) => {
  const reactId = useId();
  const { emojiReactions, toggleReaction, reader } = useReactions();

  return (
    <blockquote id={id} className="my-7 border-l-[3px] border-triangle bg-surface-raised/92 px-6 py-5 font-serif text-[1.22rem] leading-[1.55] text-ink shadow-[0_14px_34px_rgba(27,24,21,0.05)]" style={style}>
      {children}
      <EmojiReactions bqId={reactId} reactions={emojiReactions} toggleReaction={toggleReaction} reader={reader} />
    </blockquote>
  );
};

export const Cit = ({ children, src }) => (
  <blockquote className="my-7 border-l-[3px] border-border-dark px-6 py-5 font-serif text-[1.15rem] leading-[1.62] italic text-ink-secondary">
    {children}
    <span className="mt-2 block font-sans text-[0.74rem] uppercase tracking-[0.18em] not-italic text-ink-muted">{src}</span>
  </blockquote>
);

export const PH = ({ n, t }) => (
  <div className="mb-8 mt-24 border-t border-border-dark/75 pt-7">
    <div className="mb-2 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-triangle">Part {n}</div>
    <div className="font-serif text-[2.2rem] leading-[0.95] text-ink md:text-[2.7rem]">{t}</div>
  </div>
);

export const T = ({ h, r }) => (
  <div className="my-6 overflow-x-auto">
    <table className="w-full border-collapse text-md leading-normal">
      <thead>
        <tr>{h.map((x, i) => <th key={i} className="border-b border-border-dark py-2 px-3 text-left font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">{x}</th>)}</tr>
      </thead>
      <tbody>
        {r.map((row, ri) => <tr key={ri} className="even:bg-white/28">{row.map((c, ci) => <td key={ci} className="border-b border-border px-3 py-3 align-top text-[0.94rem] leading-[1.65] text-ink-secondary">{c}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);

export const S = ({ t, children }) => (
  <span style={{ color: t === "t" ? "#DC2626" : t === "s" ? "#0369A1" : "#B45309" }} className="font-medium">{children}</span>
);
