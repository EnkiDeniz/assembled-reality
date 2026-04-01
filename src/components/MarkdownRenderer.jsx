"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { normalizeReaderBlockText } from "@/lib/reader-player";

function getBlockId(node, sectionSlug, fallback) {
  const start = node?.position?.start?.offset;
  const end = node?.position?.end?.offset;

  if (typeof start === "number") {
    return typeof end === "number"
      ? `${sectionSlug}-${start}-${end}`
      : `${sectionSlug}-${start}`;
  }

  return `${sectionSlug}-${fallback}`;
}

function getMarkMetadata(marks, activeMarkId) {
  const ids = marks.map((mark) => mark.id).join(" ");
  const hasNote = marks.some((mark) => mark.type === "note");
  const isFocused = activeMarkId ? marks.some((mark) => mark.id === activeMarkId) : false;
  const noteTitles = marks
    .filter((mark) => mark.type === "note" && mark.noteText)
    .map((mark) => mark.noteText.trim())
    .filter(Boolean);

  return {
    ids,
    className: [
      "reader-inline-mark",
      hasNote ? "has-note" : "",
      isFocused ? "is-focused" : "",
    ]
      .filter(Boolean)
      .join(" "),
    title: noteTitles.length ? noteTitles.join(" • ") : undefined,
  };
}

function annotateTextContent(text, startOffset, marks, activeMarkId, keyBase) {
  const endOffset = startOffset + text.length;
  const overlapping = marks.filter(
    (mark) => mark.startOffset < endOffset && mark.endOffset > startOffset,
  );

  if (overlapping.length === 0) {
    return text;
  }

  const boundaries = new Set([startOffset, endOffset]);
  overlapping.forEach((mark) => {
    boundaries.add(Math.max(startOffset, mark.startOffset));
    boundaries.add(Math.min(endOffset, mark.endOffset));
  });

  const sorted = [...boundaries].toSorted((left, right) => left - right);

  return sorted.flatMap((boundary, index) => {
    const nextBoundary = sorted[index + 1];
    if (typeof nextBoundary !== "number" || nextBoundary <= boundary) {
      return [];
    }

    const segment = text.slice(boundary - startOffset, nextBoundary - startOffset);
    const covering = overlapping.filter(
      (mark) => mark.startOffset < nextBoundary && mark.endOffset > boundary,
    );

    if (covering.length === 0) {
      return segment;
    }

    const metadata = getMarkMetadata(covering, activeMarkId);
    return (
      <mark
        key={`${keyBase}-${boundary}-${nextBoundary}-${metadata.ids}`}
        className={metadata.className}
        data-annotation-ids={metadata.ids}
        title={metadata.title}
      >
        {segment}
      </mark>
    );
  });
}

function annotateChildren(children, state, marks, activeMarkId) {
  return Children.map(children, (child, index) => {
    if (typeof child === "string" || typeof child === "number") {
      const text = String(child);
      const next = annotateTextContent(text, state.offset, marks, activeMarkId, `${state.key}-${index}`);
      state.offset += text.length;
      return next;
    }

    if (!isValidElement(child)) {
      return child;
    }

    if (!("children" in child.props) || child.props.children == null) {
      return child;
    }

    const nextChildren = annotateChildren(child.props.children, state, marks, activeMarkId);
    return cloneElement(child, undefined, nextChildren);
  });
}

function renderBlockChildren(children, blockId, marksByBlock, activeMarkId) {
  const marks = marksByBlock[blockId] || [];
  if (marks.length === 0) return children;

  const state = { offset: 0, key: blockId };
  return annotateChildren(children, state, marks, activeMarkId);
}

function Block({
  as,
  node,
  sectionSlug,
  fallback,
  children,
  className = "",
  marksByBlock,
  activeMarkId,
  activeBlockId = null,
  nextBlockId = null,
  onRegisterBlock,
  onUnregisterBlock,
  playable = false,
  ...props
}) {
  const blockId = getBlockId(node, sectionSlug, fallback);
  const Tag = as;
  const elementRef = useRef(null);

  useEffect(() => {
    if (!playable || !elementRef.current) return undefined;

    const text = normalizeReaderBlockText(elementRef.current.textContent);
    if (!text) return undefined;

    onRegisterBlock?.({
      blockId,
      sectionSlug,
      text,
      element: elementRef.current,
    });

    return () => onUnregisterBlock?.(blockId);
  }, [blockId, onRegisterBlock, onUnregisterBlock, playable, sectionSlug, children]);

  return (
    <Tag
      ref={elementRef}
      {...props}
      className={[
        className,
        playable ? "reader-block" : "",
        activeBlockId === blockId ? "is-player-active" : "",
        nextBlockId === blockId ? "is-player-next" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-block-id={blockId}
    >
      {renderBlockChildren(children, blockId, marksByBlock, activeMarkId)}
    </Tag>
  );
}

export default function MarkdownRenderer({
  markdown,
  sectionSlug,
  className = "",
  marksByBlock = {},
  activeMarkId = null,
  activeBlockId = null,
  nextBlockId = null,
  onRegisterBlock,
  onUnregisterBlock,
}) {
  return (
    <div className={`markdown-flow ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p({ node, children }) {
            return (
              <Block
                as="p"
                node={node}
                sectionSlug={sectionSlug}
                fallback="p"
                marksByBlock={marksByBlock}
                activeMarkId={activeMarkId}
                activeBlockId={activeBlockId}
                nextBlockId={nextBlockId}
                onRegisterBlock={onRegisterBlock}
                onUnregisterBlock={onUnregisterBlock}
                playable
              >
                {children}
              </Block>
            );
          },
          blockquote({ node, children }) {
            return (
              <Block
                as="blockquote"
                node={node}
                sectionSlug={sectionSlug}
                fallback="blockquote"
                marksByBlock={marksByBlock}
                activeMarkId={activeMarkId}
                activeBlockId={activeBlockId}
                nextBlockId={nextBlockId}
                onRegisterBlock={onRegisterBlock}
                onUnregisterBlock={onUnregisterBlock}
                playable
              >
                {children}
              </Block>
            );
          },
          li({ node, children }) {
            return (
              <Block
                as="li"
                node={node}
                sectionSlug={sectionSlug}
                fallback="li"
                marksByBlock={marksByBlock}
                activeMarkId={activeMarkId}
                activeBlockId={activeBlockId}
                nextBlockId={nextBlockId}
                onRegisterBlock={onRegisterBlock}
                onUnregisterBlock={onUnregisterBlock}
                playable
              >
                {children}
              </Block>
            );
          },
          table({ node, children }) {
            return (
              <Block
                as="div"
                node={node}
                sectionSlug={sectionSlug}
                fallback="table"
                className="table-wrap"
                marksByBlock={marksByBlock}
                activeMarkId={activeMarkId}
              >
                <table>{children}</table>
              </Block>
            );
          },
          hr({ node }) {
            return (
              <Block
                as="hr"
                node={node}
                sectionSlug={sectionSlug}
                fallback="hr"
                marksByBlock={marksByBlock}
                activeMarkId={activeMarkId}
              />
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
