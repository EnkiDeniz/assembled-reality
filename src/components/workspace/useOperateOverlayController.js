import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pickPreferredOperateFindingId } from "@/lib/operate-overlay";

export function useOperateOverlayController({
  activeProjectKey = "",
  documentKey = "",
  canRunOperate = false,
  setFeedback,
  onReveal = null,
}) {
  const [operateOverlayOpen, setOperateOverlayOpen] = useState(true);
  const [operateOverlayPending, setOperateOverlayPending] = useState(false);
  const [operateOverlayError, setOperateOverlayError] = useState("");
  const [operateOverlayResult, setOperateOverlayResult] = useState(null);
  const [operateOverridePending, setOperateOverridePending] = useState(false);
  const [selectedOperateFindingId, setSelectedOperateFindingId] = useState("");
  const requestCounterRef = useRef(0);
  const latestAppliedRequestIdRef = useRef(0);
  const pendingRequestCountRef = useRef(0);

  const operateOverlayFindingMap = useMemo(
    () =>
      new Map(
        (Array.isArray(operateOverlayResult?.findings) ? operateOverlayResult.findings : [])
          .filter(Boolean)
          .map((finding) => [String(finding?.blockId || "").trim(), finding]),
      ),
    [operateOverlayResult],
  );

  const syncOperateOverlayState = useCallback((nextOverlay, { preferredFindingId = "" } = {}) => {
    const normalizedOverlay =
      nextOverlay && typeof nextOverlay === "object" ? nextOverlay : null;
    const findings = Array.isArray(normalizedOverlay?.findings) ? normalizedOverlay.findings : [];
    const preferredId = String(preferredFindingId || "").trim();

    setOperateOverlayResult(normalizedOverlay);
    setSelectedOperateFindingId((current) => {
      if (!findings.length) return "";
      if (preferredId && findings.some((finding) => finding?.findingId === preferredId)) {
        return preferredId;
      }
      if (current && findings.some((finding) => finding?.findingId === current)) {
        return current;
      }
      return String(findings[0]?.findingId || "").trim();
    });
  }, []);

  const beginOperateOverlayRequest = useCallback(() => {
    pendingRequestCountRef.current += 1;
    setOperateOverlayPending(true);
    requestCounterRef.current += 1;
    return requestCounterRef.current;
  }, []);

  const finishOperateOverlayRequest = useCallback(() => {
    pendingRequestCountRef.current = Math.max(0, pendingRequestCountRef.current - 1);
    if (pendingRequestCountRef.current === 0) {
      setOperateOverlayPending(false);
    }
  }, []);

  const applyOperateOverlayResponse = useCallback(
    (requestId, nextOverlay, { preferredFindingId = "" } = {}) => {
      if (requestId < latestAppliedRequestIdRef.current) {
        return false;
      }
      latestAppliedRequestIdRef.current = requestId;
      syncOperateOverlayState(nextOverlay, { preferredFindingId });
      return true;
    },
    [syncOperateOverlayState],
  );

  const loadOperateOverlay = useCallback(
    async ({ silent = true } = {}) => {
      if (!activeProjectKey || !documentKey) {
        syncOperateOverlayState(null);
        setOperateOverlayError("");
        return null;
      }

      const requestId = beginOperateOverlayRequest();
      if (!silent) {
        setOperateOverlayError("");
      }

      try {
        const params = new URLSearchParams({
          projectKey: activeProjectKey,
          documentKey,
          mode: "overlay",
        });
        const response = await fetch(`/api/workspace/operate?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not load the latest inline Operate run.");
        }

        if (applyOperateOverlayResponse(requestId, payload)) {
          setOperateOverlayError("");
        }
        return payload;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load the latest inline Operate run.";
        if (requestId >= latestAppliedRequestIdRef.current) {
          latestAppliedRequestIdRef.current = requestId;
          syncOperateOverlayState(null);
          setOperateOverlayError(silent ? "" : message);
        }
        return null;
      } finally {
        finishOperateOverlayRequest();
      }
    },
    [
      activeProjectKey,
      applyOperateOverlayResponse,
      beginOperateOverlayRequest,
      documentKey,
      finishOperateOverlayRequest,
      syncOperateOverlayState,
    ],
  );

  const revealOperateOverlay = useCallback(
    (findingId = "") => {
      setOperateOverlayOpen(true);
      onReveal?.();
      if (findingId) {
        setSelectedOperateFindingId(findingId);
      }
    },
    [onReveal],
  );

  const runInlineOperate = useCallback(async () => {
    if (!canRunOperate || !activeProjectKey || !documentKey) {
      return null;
    }

    revealOperateOverlay();
    const requestId = beginOperateOverlayRequest();
    setOperateOverlayError("");

    try {
      const response = await fetch("/api/workspace/operate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProjectKey,
          documentKey,
          mode: "overlay",
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Inline Operate could not read the current seed.");
      }

      if (
        applyOperateOverlayResponse(requestId, payload, {
          preferredFindingId: pickPreferredOperateFindingId(payload),
        })
      ) {
        setOperateOverlayError("");
      }
      setFeedback(
        payload?.stale
          ? "Inline Operate landed, but the seed changed before it returned."
          : payload?.coverage?.truncated
            ? `Inline Operate covered ${payload.coverage.evaluatedBlockCount} of ${payload.coverage.totalBlockCount} blocks.`
            : "Inline Operate attached findings to the current seed.",
        payload?.stale || payload?.coverage?.truncated ? "warning" : "success",
      );
      return payload;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Inline Operate could not read the current seed.";
      if (requestId >= latestAppliedRequestIdRef.current) {
        latestAppliedRequestIdRef.current = requestId;
        setOperateOverlayError(message);
      }
      setFeedback(message, "error");
      return null;
    } finally {
      finishOperateOverlayRequest();
    }
  }, [
    activeProjectKey,
    applyOperateOverlayResponse,
    beginOperateOverlayRequest,
    canRunOperate,
    documentKey,
    finishOperateOverlayRequest,
    revealOperateOverlay,
    setFeedback,
  ]);

  const createAttestedOverride = useCallback(
    async ({ blockId = "", spanStart = null, spanEnd = null, note = "" } = {}) => {
      if (!activeProjectKey || !documentKey || !String(blockId || "").trim()) {
        return null;
      }

      setOperateOverridePending(true);
      try {
        const response = await fetch("/api/workspace/operate/overrides", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectKey: activeProjectKey,
            documentKey,
            blockId,
            spanStart,
            spanEnd,
            note,
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not save the attested override.");
        }

        await loadOperateOverlay({ silent: true });
        setFeedback("Attested override saved.", "success");
        return payload.override || null;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not save the attested override.";
        setFeedback(message, "error");
        return null;
      } finally {
        setOperateOverridePending(false);
      }
    },
    [activeProjectKey, documentKey, loadOperateOverlay, setFeedback],
  );

  const deleteAttestedOverride = useCallback(
    async (overrideId = "") => {
      const normalizedOverrideId = String(overrideId || "").trim();
      if (!activeProjectKey || !documentKey || !normalizedOverrideId) {
        return null;
      }

      setOperateOverridePending(true);
      try {
        const params = new URLSearchParams({
          id: normalizedOverrideId,
          projectKey: activeProjectKey,
          documentKey,
        });
        const response = await fetch(`/api/workspace/operate/overrides?${params.toString()}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not remove the attested override.");
        }

        await loadOperateOverlay({ silent: true });
        setFeedback("Attested override removed.", "success");
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not remove the attested override.";
        setFeedback(message, "error");
        return false;
      } finally {
        setOperateOverridePending(false);
      }
    },
    [activeProjectKey, documentKey, loadOperateOverlay, setFeedback],
  );

  useEffect(() => {
    if (!activeProjectKey || !documentKey) {
      syncOperateOverlayState(null);
      setOperateOverlayError("");
      return;
    }

    void loadOperateOverlay({ silent: true });
  }, [activeProjectKey, documentKey, loadOperateOverlay, syncOperateOverlayState]);

  return {
    operateOverlayOpen,
    setOperateOverlayOpen,
    operateOverlayPending,
    operateOverlayError,
    operateOverlayResult,
    operateOverridePending,
    selectedOperateFindingId,
    setSelectedOperateFindingId,
    operateOverlayFindingMap,
    syncOperateOverlayState,
    loadOperateOverlay,
    revealOperateOverlay,
    runInlineOperate,
    createAttestedOverride,
    deleteAttestedOverride,
  };
}
