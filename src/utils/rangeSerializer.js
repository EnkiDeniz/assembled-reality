/**
 * Serialize a DOM Range into a storable object anchored to a section element.
 * Deserialize back with fallback to text-content search.
 */

function getPathFromNode(node, root) {
  const path = [];
  let current = node;
  while (current && current !== root) {
    const parent = current.parentNode;
    if (!parent) break;
    const children = Array.from(parent.childNodes);
    path.unshift(children.indexOf(current));
    current = parent;
  }
  return path;
}

function getNodeFromPath(path, root) {
  let current = root;
  for (const index of path) {
    if (!current || !current.childNodes || !current.childNodes[index]) return null;
    current = current.childNodes[index];
  }
  return current;
}

function findSectionAncestor(node) {
  let current = node;
  while (current) {
    if (current.nodeType === 1 && current.tagName === "SECTION" && current.id) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

export function serializeRange(range) {
  const section = findSectionAncestor(range.startContainer);
  if (!section) return null;

  const endSection = findSectionAncestor(range.endContainer);
  if (!endSection || endSection.id !== section.id) return null;

  return {
    sectionId: section.id,
    startPath: getPathFromNode(range.startContainer, section),
    startOffset: range.startOffset,
    endPath: getPathFromNode(range.endContainer, section),
    endOffset: range.endOffset,
    textContent: range.toString(),
  };
}

export function deserializeRange(anchor) {
  const section = document.getElementById(anchor.sectionId);
  if (!section) return null;

  // Try path-based resolution first
  const startNode = getNodeFromPath(anchor.startPath, section);
  const endNode = getNodeFromPath(anchor.endPath, section);

  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, Math.min(anchor.startOffset, startNode.textContent?.length || 0));
      range.setEnd(endNode, Math.min(anchor.endOffset, endNode.textContent?.length || 0));
      // Verify the text roughly matches
      const resolved = range.toString();
      if (resolved === anchor.textContent || resolved.includes(anchor.textContent) || anchor.textContent.includes(resolved)) {
        return range;
      }
    } catch {
      // Fall through to fuzzy match
    }
  }

  // Fallback: fuzzy text search within the section
  return fuzzyFindRange(section, anchor.textContent);
}

function fuzzyFindRange(section, text) {
  if (!text || text.length < 2) return null;

  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, null);
  let accumulated = "";
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push({ node: walker.currentNode, start: accumulated.length });
    accumulated += walker.currentNode.textContent;
  }

  const idx = accumulated.indexOf(text);
  if (idx === -1) return null;

  const endIdx = idx + text.length;
  let startNode = null, startOffset = 0, endNode = null, endOffset = 0;

  for (const { node, start } of textNodes) {
    const nodeEnd = start + node.textContent.length;
    if (!startNode && idx >= start && idx < nodeEnd) {
      startNode = node;
      startOffset = idx - start;
    }
    if (endIdx > start && endIdx <= nodeEnd) {
      endNode = node;
      endOffset = endIdx - start;
      break;
    }
  }

  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  } catch {
    return null;
  }
}

/**
 * Get all text node segments within a Range for wrapping highlights.
 * Handles ranges spanning multiple elements.
 */
export function getTextNodesInRange(range) {
  const nodes = [];
  const section = findSectionAncestor(range.startContainer);
  if (!section) return nodes;

  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, null);
  let inRange = false;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node === range.startContainer) inRange = true;
    if (inRange) {
      nodes.push({
        node,
        start: node === range.startContainer ? range.startOffset : 0,
        end: node === range.endContainer ? range.endOffset : node.textContent.length,
      });
    }
    if (node === range.endContainer) break;
  }

  return nodes.filter(n => n.start < n.end);
}
