function compareBlockPosition(left, right) {
  if (left.element === right.element) return 0;
  if (!left.element || !right.element) return 0;

  const position = left.element.compareDocumentPosition(right.element);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

export function normalizeReaderBlockText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export function sortReaderBlocks(blocks) {
  return [...blocks].sort(compareBlockPosition);
}

export function getBlockIndex(blocks, blockId) {
  return blocks.findIndex((block) => block.blockId === blockId);
}

export function getNextBlock(blocks, blockId, offset = 1) {
  const index = getBlockIndex(blocks, blockId);
  if (index === -1) return null;
  return blocks[index + offset] || null;
}

export function getSectionBlocks(blocks, sectionSlug) {
  return blocks.filter((block) => block.sectionSlug === sectionSlug);
}

export function getFirstSectionBlock(blocks, sectionSlug) {
  return getSectionBlocks(blocks, sectionSlug)[0] || null;
}

export function buildPlaybackQueue(blocks, startBlockId) {
  const sorted = sortReaderBlocks(blocks);
  if (!startBlockId) return sorted;

  const startIndex = getBlockIndex(sorted, startBlockId);
  return startIndex === -1 ? sorted : sorted.slice(startIndex);
}
