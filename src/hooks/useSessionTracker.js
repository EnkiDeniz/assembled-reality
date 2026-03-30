import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

function restoreSession(reader) {
  if (!reader) return null;
  const saved = ld(KEYS.session, null);
  if (saved && saved.reader === reader && !isSessionExpired(saved)) {
    return saved;
  }
  return createSession(reader);
}

export default function useSessionTracker(reader) {
  const [session, setSession] = useState(() => restoreSession(reader));
  const fallbackSession = useMemo(() => restoreSession(reader), [reader]);
  const activeSession = reader
    ? (session && session.reader === reader && !isSessionExpired(session) ? session : fallbackSession)
    : null;

  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // Persist session to localStorage on every change
  useEffect(() => {
    if (activeSession) sv(KEYS.session, activeSession);
  }, [activeSession]);

  // Live duration ticker
  useEffect(() => {
    if (!activeSession) return;
    const tick = () => {
      setDuration(Math.floor((Date.now() - activeSession.startedAt) / 1000));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeSession]);

  // Touch lastActivityAt
  const touch = useCallback(() => {
    setSession(prev => {
      if (!reader) return prev;
      const current = prev && prev.reader === reader && !isSessionExpired(prev) ? prev : restoreSession(reader);
      if (!current) return current;
      if (isSessionExpired(current)) {
        const fresh = createSession(current.reader);
        return fresh;
      }
      return { ...current, lastActivityAt: Date.now() };
    });
  }, [reader]);

  const recordAction = useCallback((type, details = {}) => {
    setSession(prev => {
      if (!reader) return prev;
      const current = prev && prev.reader === reader && !isSessionExpired(prev) ? prev : restoreSession(reader);
      if (!current) return current;
      if (isSessionExpired(current)) return createSession(current.reader);
      return {
        ...current,
        lastActivityAt: Date.now(),
        actions: [...current.actions, { type, ...details, at: Date.now() }],
      };
    });
  }, [reader]);

  const recordSectionVisit = useCallback((sectionId) => {
    setSession(prev => {
      if (!reader) return prev;
      const current = prev && prev.reader === reader && !isSessionExpired(prev) ? prev : restoreSession(reader);
      if (!current) return current;
      if (isSessionExpired(current)) return createSession(current.reader);

      const sections = [...current.sections];
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

      return { ...current, lastActivityAt: Date.now(), sections };
    });
  }, [reader]);

  const getSessionData = useCallback(() => activeSession, [activeSession]);

  const resetSession = useCallback(() => {
    if (!reader) return;
    const fresh = createSession(reader);
    setSession(fresh);
    sv(KEYS.session, fresh);
  }, [reader]);

  const getActionCounts = useCallback(() => {
    if (!activeSession) return { signals: 0, highlights: 0, annotations: 0, carries: 0, comments: 0, statusTags: 0, reactions: 0 };
    const counts = { signals: 0, highlights: 0, annotations: 0, carries: 0, comments: 0, statusTags: 0, reactions: 0 };
    for (const a of activeSession.actions) {
      if (a.type === "signal") counts.signals++;
      else if (a.type === "highlight") counts.highlights++;
      else if (a.type === "annotation") counts.annotations++;
      else if (a.type === "carry") counts.carries++;
      else if (a.type === "comment") counts.comments++;
      else if (a.type === "status_tag") counts.statusTags++;
      else if (a.type === "reaction") counts.reactions++;
    }
    return counts;
  }, [activeSession]);

  const getUniqueSectionsVisited = useCallback(() => {
    if (!activeSession) return [];
    const seen = new Set();
    return activeSession.sections.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [activeSession]);

  return {
    session: activeSession,
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
