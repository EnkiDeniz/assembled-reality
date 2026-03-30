import React, { useId } from "react";
import EmojiReactions from "../interaction/EmojiReactions";
import { useReactions } from "./ReactionContext";

export const P = ({ children, style }) => (
  <p className="mb-5 font-serif text-[1.1rem] leading-[1.78] text-ink-secondary md:text-[1.18rem]" style={style}>{children}</p>
);

export const BQ = ({ children, style, id }) => {
  const reactId = useId();
  const { emojiReactions, toggleReaction, reader } = useReactions();

  return (
    <blockquote id={id} className="my-8 rounded-[1.5rem] border border-border-dark/55 bg-surface-raised/94 px-6 py-5 font-serif text-[1.18rem] leading-[1.58] text-ink shadow-[0_16px_38px_rgba(20,17,15,0.05)] md:text-[1.24rem]" style={style}>
      {children}
      <EmojiReactions bqId={reactId} reactions={emojiReactions} toggleReaction={toggleReaction} reader={reader} />
    </blockquote>
  );
};

export const Cit = ({ children, src }) => (
  <blockquote className="my-8 rounded-[1.4rem] border border-border-warm bg-white/34 px-6 py-5 font-serif text-[1.1rem] leading-[1.68] italic text-ink-secondary md:text-[1.15rem]">
    {children}
    <span className="mt-2 block font-sans text-[0.74rem] uppercase tracking-[0.18em] not-italic text-ink-muted">{src}</span>
  </blockquote>
);

export const PH = ({ n, t }) => (
  <div className="mb-9 mt-24 border-t border-border-dark/75 pt-8">
    <div className="mb-2 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-triangle">Part {n}</div>
    <div className="font-serif text-[2.3rem] leading-[0.94] text-ink md:text-[2.9rem]">{t}</div>
  </div>
);

export const T = ({ h, r }) => (
  <div className="my-7 overflow-x-auto rounded-[1.5rem] border border-border-warm bg-white/34">
    <table className="w-full border-collapse text-md leading-normal">
      <thead>
        <tr>{h.map((x, i) => <th key={i} className="border-b border-border-dark px-4 py-3 text-left font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">{x}</th>)}</tr>
      </thead>
      <tbody>
        {r.map((row, ri) => <tr key={ri} className="even:bg-white/24">{row.map((c, ci) => <td key={ci} className="border-b border-border px-4 py-3 align-top text-[0.96rem] leading-[1.68] text-ink-secondary">{c}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);

export const S = ({ t, children }) => (
  <span style={{ color: t === "t" ? "#DC2626" : t === "s" ? "#0369A1" : "#B45309" }} className="font-medium">{children}</span>
);
