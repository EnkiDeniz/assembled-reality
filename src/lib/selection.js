function closestWithAttribute(node, attribute) {
  if (!node) return null;

  if (node instanceof HTMLElement) {
    return node.closest(`[${attribute}]`);
  }

  if (node.parentElement) {
    return node.parentElement.closest(`[${attribute}]`);
  }

  return null;
}

function getOffsetWithinElement(element, container, offset) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.setEnd(container, offset);
  return range.toString().length;
}

function getViewportPoint(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
  };
}

export function clearBrowserSelection() {
  const selection = window.getSelection();
  selection?.removeAllRanges();
}

export function getSelectionAnchor() {
  if (typeof window === "undefined") return null;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  const quote = selection.toString().replace(/\s+/g, " ").trim();

  if (!quote) return null;

  const startBlock = closestWithAttribute(range.startContainer, "data-block-id");
  const endBlock = closestWithAttribute(range.endContainer, "data-block-id");

  if (!startBlock || !endBlock) return null;
  if (startBlock !== endBlock) {
    return { reason: "multi-block" };
  }

  const section = closestWithAttribute(startBlock, "data-section-slug");
  if (!section) return null;

  const startOffset = getOffsetWithinElement(
    startBlock,
    range.startContainer,
    range.startOffset,
  );
  const endOffset = getOffsetWithinElement(startBlock, range.endContainer, range.endOffset);

  if (endOffset <= startOffset) return null;

  return {
    sectionSlug: section.dataset.sectionSlug,
    sectionTitle: section.dataset.sectionTitle || "",
    blockId: startBlock.dataset.blockId,
    startOffset,
    endOffset,
    quote,
    point: getViewportPoint(range.getBoundingClientRect()),
  };
}
