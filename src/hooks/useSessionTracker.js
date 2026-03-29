import { useState, useCallback, useEffect, useRef } from "react";
import { ld, sv, KEYS } from "../storage";

const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes

function createSession(reader) {
  return {
    id: `sess_${Date.now()}`,
    reader,
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
    sections: [],
    actions: [],
  };
}

function isSessionExpired(session) {
  return Date.now() - session.lastActivityAt > INACTIVITY_THRESHOLD;
}

export default function useSessionTracker(reader) {
  const [session, setSession] = useState(() => {
    if (!reader) return null;
    const saved = ld(KEYS.session, null);
    if (saved && saved.reader === reader && !isSessionExpired(saved)) {
      return saved;
    }
    return createSession(reader);
  });

  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // Persist session to localStorage on every change
  useEffect(() => {
    if (session) sv(KEYS.session, session);
  }, [session]);

  // Live duration ticker
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      setDuration(Math.floor((Date.now() - session.startedAt) / 1000));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.startedAt]);

  // Touch lastActivityAt
  const touch = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      if (isSessionExpired(prev)) {
        const fresh = createSession(prev.reader);
        return fresh;
      }
      return { ...prev, lastActivityAt: Date.now() };
    });
  }, []);

  const recordAction = useCallback((type, details = {}) => {
    setSession(prev => {
      if (!prev) return prev;
      if (isSessionExpired(prev)) return createSession(prev.reader);
      return {
        ...prev,
        lastActivityAt: Date.now(),
        actions: [...prev.actions, { type, ...details, at: Date.now() }],
      };
    });
  }, []);

  const recordSectionVisit = useCallback((sectionId) => {
    setSession(prev => {
      if (!prev) return prev;
      if (isSessionExpired(prev)) return createSession(prev.reader);

      const sections = [...prev.sections];
      const last = sections[sections.length - 1];

      // If already on this section, just touch
      if (last && last.id === sectionId && !last.leftAt) {
        return { ...prev, lastActivityAt: Date.now() };
      }

      // Close previous section
      if (last && !last.leftAt) {
        sections[sections.length - 1] = { ...last, leftAt: Date.now() };
      }

      // Don't re-add if it's the same section we just left
      sections.push({ id: sectionId, enteredAt: Date.now(), leftAt: null });

      return { ...prev, lastActivityAt: Date.now(), sections };
    });
  }, []);

  const getSessionData = useCallback(() => session, [session]);

  const resetSession = useCallback(() => {
    if (!reader) return;
    const fresh = createSession(reader);
    setSession(fresh);
    sv(KEYS.session, fresh);
  }, [reader]);

  const getActionCounts = useCallback(() => {
    if (!session) return { signals: 0, highlights: 0, annotations: 0, carries: 0, comments: 0, statusTags: 0, reactions: 0 };
    const counts = { signals: 0, highlights: 0, annotations: 0, carries: 0, comments: 0, statusTags: 0, reactions: 0 };
    for (const a of session.actions) {
      if (a.type === "signal") counts.signals++;
      else if (a.type === "highlight") counts.highlights++;
      else if (a.type === "annotation") counts.annotations++;
      else if (a.type === "carry") counts.carries++;
      else if (a.type === "comment") counts.comments++;
      else if (a.type === "status_tag") counts.statusTags++;
      else if (a.type === "reaction") counts.reactions++;
    }
    return counts;
  }, [session]);

  const getUniqueSectionsVisited = useCallback(() => {
    if (!session) return [];
    const seen = new Set();
    return session.sections.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [session]);

  return {
    session,
    duration,
    recordAction,
    recordSectionVisit,
    getSessionData,
    getActionCounts,
    getUniqueSectionsVisited,
    resetSession,
    touch,
  };
}
