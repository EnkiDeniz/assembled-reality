import { useState, useCallback } from "react";
import { ld, sv, KEYS } from "../storage";

function getInitialStoreState() {
  const pass = ld(KEYS.pass, false);
  const reader = ld(KEYS.reader, null);

  return {
    phase: pass && reader ? "doc" : pass ? "name" : "pass",
    reader,
    sigs: ld(KEYS.sigs, {}),
    anns: ld(KEYS.anns, {}),
    highlights: ld(KEYS.highlights, []),
    carryList: ld(KEYS.carryList, {}),
    inlineComments: ld(KEYS.inlineComments, []),
    statusTags: ld(KEYS.statusTags, {}),
    readingPositions: ld(KEYS.readingPos, {}),
    emojiReactions: ld(KEYS.emojiReactions, {}),
    versionPulse: ld(KEYS.versionPulse, { lastSeen: {} }),
    welcomeDismissed: ld(KEYS.welcome, {}),
    sessionReceipts: ld(KEYS.sessionReceipts, []),
  };
}

export default function useStore() {
  const [initialState] = useState(() => getInitialStoreState());
  const [phase, setPhase] = useState(initialState.phase);
  const [reader, setReader] = useState(initialState.reader);
  const [sigs, setSigs] = useState(initialState.sigs);
  const [anns, setAnns] = useState(initialState.anns);
  const [highlights, setHighlights] = useState(initialState.highlights);
  const [carryList, setCarryList] = useState(initialState.carryList);
  const [inlineComments, setInlineComments] = useState(initialState.inlineComments);
  const [statusTags, setStatusTags] = useState(initialState.statusTags);
  const [readingPositions, setReadingPositions] = useState(initialState.readingPositions);
  const [emojiReactions, setEmojiReactions] = useState(initialState.emojiReactions);
  const [versionPulse, setVersionPulse] = useState(initialState.versionPulse);
  const [welcomeDismissed, setWelcomeDismissed] = useState(initialState.welcomeDismissed);
  const [sessionReceipts, setSessionReceipts] = useState(initialState.sessionReceipts);

  const onPass = useCallback(() => {
    sv(KEYS.pass, true);
    setPhase("name");
  }, []);

  const onName = useCallback((n) => {
    setReader(n);
    sv(KEYS.reader, n);
    setPhase("doc");
  }, []);

  const onSig = useCallback((sid, k) => {
    setSigs(prev => {
      const n = { ...prev };
      if (!n[sid]) n[sid] = { triangle: [], square: [], circle: [] };
      const a = [...(n[sid][k] || [])];
      const i = a.indexOf(reader);
      if (i >= 0) a.splice(i, 1); else a.push(reader);
      n[sid] = { ...n[sid], [k]: a };
      sv(KEYS.sigs, n);
      return n;
    });
  }, [reader]);

  const onAnn = useCallback((sid, txt) => {
    const now = new Date();
    const e = {
      author: reader,
      text: txt,
      time: now.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
    };
    setAnns(prev => {
      const n = { ...prev };
      n[sid] = [...(n[sid] || []), e];
      sv(KEYS.anns, n);
      return n;
    });
  }, [reader]);

  // Highlights
  const addHighlight = useCallback((highlight) => {
    setHighlights(prev => {
      const n = [...prev, { ...highlight, reader, timestamp: Date.now() }];
      sv(KEYS.highlights, n);
      return n;
    });
  }, [reader]);

  const removeHighlight = useCallback((id) => {
    setHighlights(prev => {
      const n = prev.filter(h => h.id !== id);
      sv(KEYS.highlights, n);
      return n;
    });
  }, []);

  // Carry list
  const addCarryItem = useCallback((item) => {
    setCarryList(prev => {
      const n = { ...prev };
      n[reader] = [...(n[reader] || []), { ...item, timestamp: Date.now() }];
      sv(KEYS.carryList, n);
      return n;
    });
  }, [reader]);

  const removeCarryItem = useCallback((id) => {
    setCarryList(prev => {
      const n = { ...prev };
      n[reader] = (n[reader] || []).filter(c => c.id !== id);
      sv(KEYS.carryList, n);
      return n;
    });
  }, [reader]);

  // Inline comments
  const addInlineComment = useCallback((comment) => {
    setInlineComments(prev => {
      const n = [...prev, { ...comment, threads: [{ author: reader, text: comment.text, timestamp: Date.now(), time: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) }] }];
      sv(KEYS.inlineComments, n);
      return n;
    });
  }, [reader]);

  const addCommentReply = useCallback((commentId, text) => {
    setInlineComments(prev => {
      const n = prev.map(c => {
        if (c.id !== commentId) return c;
        return { ...c, threads: [...c.threads, { author: reader, text, timestamp: Date.now(), time: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) }] };
      });
      sv(KEYS.inlineComments, n);
      return n;
    });
  }, [reader]);

  // Status tags
  const toggleStatusTag = useCallback((sectionId, tagKey) => {
    setStatusTags(prev => {
      const n = { ...prev };
      if (!n[sectionId]) n[sectionId] = {};
      const voters = [...(n[sectionId][tagKey] || [])];
      const i = voters.indexOf(reader);
      if (i >= 0) voters.splice(i, 1); else voters.push(reader);
      n[sectionId] = { ...n[sectionId], [tagKey]: voters };
      sv(KEYS.statusTags, n);
      return n;
    });
  }, [reader]);

  // Reading position
  const updateReadingPosition = useCallback((sectionId) => {
    setReadingPositions(prev => {
      const n = { ...prev, [reader]: { sectionId, timestamp: Date.now() } };
      sv(KEYS.readingPos, n);
      return n;
    });
  }, [reader]);

  // Emoji reactions
  const toggleReaction = useCallback((bqId, emojiKey) => {
    setEmojiReactions(prev => {
      const n = { ...prev };
      if (!n[bqId]) n[bqId] = {};
      const voters = [...(n[bqId][emojiKey] || [])];
      const i = voters.indexOf(reader);
      if (i >= 0) voters.splice(i, 1); else voters.push(reader);
      n[bqId] = { ...n[bqId], [emojiKey]: voters };
      sv(KEYS.emojiReactions, n);
      return n;
    });
  }, [reader]);

  // Welcome guide
  const dismissWelcome = useCallback(() => {
    setWelcomeDismissed(prev => {
      const n = { ...prev, [reader]: true };
      sv(KEYS.welcome, n);
      return n;
    });
  }, [reader]);

  const resetWelcome = useCallback(() => {
    setWelcomeDismissed(prev => {
      const n = { ...prev, [reader]: false };
      sv(KEYS.welcome, n);
      return n;
    });
  }, [reader]);

  // Version pulse
  const dismissVersionBanner = useCallback((version) => {
    setVersionPulse(prev => {
      const n = { ...prev, lastSeen: { ...prev.lastSeen, [reader]: version } };
      sv(KEYS.versionPulse, n);
      return n;
    });
  }, [reader]);

  // Session receipts
  const saveSessionReceipt = useCallback((summary) => {
    setSessionReceipts(prev => {
      const n = [...prev, { ...summary, savedAt: Date.now() }];
      sv(KEYS.sessionReceipts, n);
      return n;
    });
  }, []);

  return {
    phase, reader,
    sigs, anns, onPass, onName, onSig, onAnn,
    highlights, addHighlight, removeHighlight,
    carryList, addCarryItem, removeCarryItem,
    inlineComments, addInlineComment, addCommentReply,
    statusTags, toggleStatusTag,
    readingPositions, updateReadingPosition,
    emojiReactions, toggleReaction,
    versionPulse, dismissVersionBanner,
    welcomeDismissed, dismissWelcome, resetWelcome,
    sessionReceipts, saveSessionReceipt,
  };
}
