import { sortReaderBlocks } from "@/lib/reader-player";

export const PLAYBACK_SCOPES = Object.freeze({
  flow: "flow",
  section: "section",
  selection: "selection",
  message: "message",
});

export const LISTENING_STATUSES = Object.freeze({
  idle: "idle",
  active: "active",
  paused: "paused",
});

export const VOICE_PROVIDERS = Object.freeze({
  elevenlabs: "elevenlabs",
  openai: "openai",
  device: "device",
});

export const VOICE_PROVIDER_PRIORITY = [
  VOICE_PROVIDERS.elevenlabs,
  VOICE_PROVIDERS.openai,
  VOICE_PROVIDERS.device,
];

export function normalizePlaybackScope(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PLAYBACK_SCOPES[normalized] || PLAYBACK_SCOPES.flow;
}

export function normalizeListeningStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return LISTENING_STATUSES[normalized] || LISTENING_STATUSES.idle;
}

export function normalizeVoiceProvider(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return VOICE_PROVIDERS[normalized] || null;
}

export function toPrismaPlaybackScope(value) {
  const normalized = normalizePlaybackScope(value);
  return normalized.toUpperCase();
}

export function fromPrismaPlaybackScope(value) {
  return normalizePlaybackScope(String(value || "").toLowerCase());
}

export function toPrismaListeningStatus(value) {
  const normalized = normalizeListeningStatus(value);
  return normalized === LISTENING_STATUSES.active
    ? "ACTIVE"
    : normalized === LISTENING_STATUSES.paused
      ? "PAUSED"
      : "IDLE";
}

export function fromPrismaListeningStatus(value) {
  return normalizeListeningStatus(String(value || "").toLowerCase());
}

export function toPrismaVoiceProvider(value) {
  const normalized = normalizeVoiceProvider(value);
  return normalized ? normalized.toUpperCase() : null;
}

export function fromPrismaVoiceProvider(value) {
  return normalizeVoiceProvider(String(value || "").toLowerCase());
}

export function clampListeningRate(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(2.5, Math.max(0.75, Math.round(numeric * 100) / 100));
}

export function trimOptionalValue(value) {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

export function getProviderRequestOrder(preferredProvider) {
  const first = normalizeVoiceProvider(preferredProvider);
  const ordered = first ? [first, ...VOICE_PROVIDER_PRIORITY] : [...VOICE_PROVIDER_PRIORITY];
  return [...new Set(ordered)];
}

export function formatVoiceLabel(provider, voiceId = null) {
  const normalized = normalizeVoiceProvider(provider);
  if (normalized === VOICE_PROVIDERS.elevenlabs) {
    return voiceId ? "Seven" : "Seven";
  }

  if (normalized === VOICE_PROVIDERS.openai) {
    if (!voiceId) return "OpenAI";
    return voiceId
      .split(/[-_ ]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return "Device";
}

export function getVoiceCatalog({
  openAiEnabled = false,
  openAiVoice = null,
  elevenLabsEnabled = false,
  elevenLabsVoiceId = null,
  includeDevice = true,
} = {}) {
  const catalog = [];

  if (elevenLabsEnabled) {
    catalog.push({
      provider: VOICE_PROVIDERS.elevenlabs,
      voiceId: trimOptionalValue(elevenLabsVoiceId),
      label: "Seven",
    });
  }

  if (openAiEnabled) {
    const voiceId = trimOptionalValue(openAiVoice) || "sage";
    catalog.push({
      provider: VOICE_PROVIDERS.openai,
      voiceId,
      label: formatVoiceLabel(VOICE_PROVIDERS.openai, voiceId),
    });
  }

  if (includeDevice) {
    catalog.push({
      provider: VOICE_PROVIDERS.device,
      voiceId: "device",
      label: "Device",
    });
  }

  return catalog;
}

export function resolvePreferredVoiceChoice(catalog, preferredProvider, preferredVoiceId) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return {
      provider: null,
      voiceId: null,
      label: "Voice",
    };
  }

  const provider = normalizeVoiceProvider(preferredProvider);
  const voiceId = trimOptionalValue(preferredVoiceId);
  const matched = catalog.find((entry) => {
    if (provider && entry.provider !== provider) return false;
    if (voiceId && entry.voiceId !== voiceId) return false;
    return true;
  });

  return matched || catalog[0];
}

export function estimateListeningDurationMs(text, rate = 1) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) return 0;

  const normalizedRate = clampListeningRate(rate, 1);
  const wordsPerMinute = 190 * normalizedRate;
  const baseMs = (words / wordsPerMinute) * 60_000;
  return Math.max(1400, Math.round(baseMs + Math.max(0, words - 8) * 18));
}

function getHeadingText(documentData, entry) {
  if (entry.slug === "beginning") {
    return [documentData?.title, documentData?.subtitle].filter(Boolean).join(". ").trim();
  }

  return entry.number ? `${entry.number}. ${entry.title}` : entry.title;
}

function getSectionElementForNode(entry, sectionBlocks) {
  if (sectionBlocks[0]?.element?.closest) {
    return (
      sectionBlocks[0].element.closest(`[data-section-slug="${entry.slug}"]`) ||
      sectionBlocks[0].element
    );
  }

  if (typeof document !== "undefined") {
    return document.getElementById(entry.slug);
  }

  return null;
}

export function createEphemeralPlaybackNode({
  nodeId,
  kind = "ephemeral",
  sectionSlug = "beginning",
  blockId = null,
  label = "",
  text = "",
  element = null,
} = {}) {
  return {
    nodeId,
    kind,
    sectionSlug,
    blockId,
    label,
    text: String(text || "").trim(),
    element,
  };
}

export function buildPlaybackNodes({ documentData, entries, blocks }) {
  const sortedBlocks = sortReaderBlocks(blocks);

  return entries.flatMap((entry) => {
    const sectionBlocks = sortedBlocks.filter((block) => block.sectionSlug === entry.slug);
    const headingText = getHeadingText(documentData, entry);
    const headingNode = headingText
      ? {
          nodeId: `heading:${entry.slug}`,
          kind: "heading",
          sectionSlug: entry.slug,
          blockId: sectionBlocks[0]?.blockId || null,
          label: entry.title,
          text: headingText,
          element: getSectionElementForNode(entry, sectionBlocks),
        }
      : null;

    const blockNodes = sectionBlocks.map((block) => ({
      nodeId: block.blockId,
      kind: "block",
      sectionSlug: block.sectionSlug,
      blockId: block.blockId,
      label: entry.title,
      text: block.text,
      element: block.element,
    }));

    return [headingNode, ...blockNodes].filter((node) => node && node.text);
  });
}

export function getPlaybackNodeIndex(nodes, nodeId) {
  return nodes.findIndex((node) => node.nodeId === nodeId);
}

export function getPlaybackNode(nodes, nodeId) {
  return nodes.find((node) => node.nodeId === nodeId) || null;
}

export function getSectionHeadingNodeId(sectionSlug) {
  return `heading:${sectionSlug}`;
}

export function buildScopedPlaybackQueue(
  nodes,
  { scope = PLAYBACK_SCOPES.flow, sectionSlug = null, startNodeId = null, endNodeId = null } = {},
) {
  const normalizedScope = normalizePlaybackScope(scope);
  let scoped = [...nodes];

  if (normalizedScope === PLAYBACK_SCOPES.section && sectionSlug) {
    scoped = nodes.filter((node) => node.sectionSlug === sectionSlug);
  }

  if (startNodeId) {
    const startIndex = getPlaybackNodeIndex(scoped, startNodeId);
    if (startIndex >= 0) {
      scoped = scoped.slice(startIndex);
    }
  }

  if (endNodeId) {
    const endIndex = getPlaybackNodeIndex(scoped, endNodeId);
    if (endIndex >= 0) {
      scoped = scoped.slice(0, endIndex + 1);
    }
  }

  return scoped;
}

export function getQueueDurationMs(queue, durationMap = {}, rate = 1) {
  return queue.reduce(
    (sum, node) => sum + (durationMap[node.nodeId] || estimateListeningDurationMs(node.text, rate)),
    0,
  );
}

export function getQueueElapsedMs(queue, currentIndex, nodeOffsetMs, durationMap = {}, rate = 1) {
  if (!Array.isArray(queue) || currentIndex < 0) return 0;

  const priorMs = queue.slice(0, currentIndex).reduce(
    (sum, node) => sum + (durationMap[node.nodeId] || estimateListeningDurationMs(node.text, rate)),
    0,
  );

  return Math.max(0, priorMs + Math.max(0, Number(nodeOffsetMs) || 0));
}

export function findQueuePositionByElapsedMs(
  queue,
  targetElapsedMs,
  durationMap = {},
  rate = 1,
) {
  if (!Array.isArray(queue) || queue.length === 0) {
    return { index: -1, nodeOffsetMs: 0 };
  }

  let elapsed = 0;
  const target = Math.max(0, Number(targetElapsedMs) || 0);

  for (let index = 0; index < queue.length; index += 1) {
    const node = queue[index];
    const durationMs = durationMap[node.nodeId] || estimateListeningDurationMs(node.text, rate);
    const nextElapsed = elapsed + durationMs;
    if (target <= nextElapsed || index === queue.length - 1) {
      return {
        index,
        nodeOffsetMs: Math.max(0, Math.min(durationMs, target - elapsed)),
      };
    }
    elapsed = nextElapsed;
  }

  return { index: queue.length - 1, nodeOffsetMs: 0 };
}

export function getQueueSectionMeta(queue) {
  const sections = [...new Set(queue.map((node) => node.sectionSlug).filter(Boolean))];
  return {
    sectionCount: sections.length,
    itemCount: queue.length,
  };
}
