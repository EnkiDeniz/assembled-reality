import { useCallback, useEffect, useRef, useState } from "react";

function upsertProjectDraftInState(setProjectDraftsState, draft) {
  if (!draft?.id) return;

  setProjectDraftsState((previous) => {
    const remaining = previous.filter((entry) => entry.id !== draft.id);
    return [draft, ...remaining].slice(0, 6);
  });
}

export function useReceiptSealController({
  activeProjectKey = "",
  receiptPending = false,
  setReceiptPending,
  setProjectDraftsState,
  requireRootFor,
  setFeedback,
}) {
  const [receiptSealDraft, setReceiptSealDraft] = useState(null);
  const [receiptSealDelta, setReceiptSealDelta] = useState("");
  const [receiptSealAudit, setReceiptSealAudit] = useState(null);
  const [receiptSealAuditPending, setReceiptSealAuditPending] = useState(false);
  const [receiptSealAuditError, setReceiptSealAuditError] = useState("");
  const [receiptSealAuditStatement, setReceiptSealAuditStatement] = useState("");
  const [receiptSealOverrideAcknowledged, setReceiptSealOverrideAcknowledged] = useState(false);
  const receiptSealAuditRequestIdRef = useRef(0);
  const receiptSealImmediateAuditDraftRef = useRef("");

  const resetReceiptSealState = useCallback(() => {
    setReceiptSealDraft(null);
    setReceiptSealDelta("");
    setReceiptSealAudit(null);
    setReceiptSealAuditError("");
    setReceiptSealAuditStatement("");
    setReceiptSealOverrideAcknowledged(false);
  }, []);

  const openReceiptSealDialog = useCallback((draft) => {
    if (!draft?.id) return;

    const nextDelta =
      draft?.payload?.deltaStatement ||
      draft?.payload?.decision ||
      draft?.payload?.learned ||
      draft?.implications ||
      "";
    receiptSealImmediateAuditDraftRef.current = "";
    setReceiptSealDraft(draft);
    setReceiptSealDelta(nextDelta);
    setReceiptSealAudit(null);
    setReceiptSealAuditError("");
    setReceiptSealAuditStatement("");
    setReceiptSealOverrideAcknowledged(false);
  }, []);

  const closeReceiptSealDialog = useCallback(() => {
    if (receiptPending || receiptSealAuditPending) return;
    receiptSealAuditRequestIdRef.current += 1;
    receiptSealImmediateAuditDraftRef.current = "";
    resetReceiptSealState();
  }, [receiptPending, receiptSealAuditPending, resetReceiptSealState]);

  const runReceiptSealAudit = useCallback(
    async (draft = receiptSealDraft, nextDelta = receiptSealDelta) => {
      if (!draft?.id) return null;

      const deltaStatement = String(nextDelta || "").trim();
      if (!deltaStatement) {
        setReceiptSealAudit(null);
        setReceiptSealAuditStatement("");
        setReceiptSealAuditError("");
        return null;
      }

      const requestId = receiptSealAuditRequestIdRef.current + 1;
      receiptSealAuditRequestIdRef.current = requestId;
      setReceiptSealAuditPending(true);
      setReceiptSealAuditError("");

      try {
        const response = await fetch("/api/workspace/receipt/audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draftId: draft.id,
            deltaStatement,
            projectKey: activeProjectKey,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.audit) {
          throw new Error(payload?.error || "Could not run the pre-seal audit.");
        }

        if (receiptSealAuditRequestIdRef.current === requestId) {
          setReceiptSealAudit(payload.audit);
          setReceiptSealAuditStatement(deltaStatement);
        }
        return payload.audit;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not run the pre-seal audit.";
        if (receiptSealAuditRequestIdRef.current === requestId) {
          setReceiptSealAuditError(message);
        }
        return null;
      } finally {
        if (receiptSealAuditRequestIdRef.current === requestId) {
          setReceiptSealAuditPending(false);
        }
      }
    },
    [activeProjectKey, receiptSealDelta, receiptSealDraft],
  );

  useEffect(() => {
    const draftId = String(receiptSealDraft?.id || "").trim();
    if (!draftId) {
      receiptSealImmediateAuditDraftRef.current = "";
      return undefined;
    }
    if (receiptSealImmediateAuditDraftRef.current === draftId) {
      return undefined;
    }

    receiptSealImmediateAuditDraftRef.current = draftId;
    const normalizedDelta = String(receiptSealDelta || "").trim();
    if (!normalizedDelta) return undefined;

    void runReceiptSealAudit(receiptSealDraft, normalizedDelta);
    return undefined;
  }, [receiptSealDelta, receiptSealDraft, runReceiptSealAudit]);

  useEffect(() => {
    if (!receiptSealDraft?.id) return undefined;

    const normalizedDelta = String(receiptSealDelta || "").trim();
    if (!normalizedDelta) {
      setReceiptSealAudit(null);
      setReceiptSealAuditStatement("");
      setReceiptSealAuditError("");
      return undefined;
    }
    if (
      normalizedDelta === receiptSealAuditStatement &&
      (receiptSealAudit || receiptSealAuditPending)
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void runReceiptSealAudit(receiptSealDraft, normalizedDelta);
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [
    receiptSealAudit,
    receiptSealAuditPending,
    receiptSealAuditStatement,
    receiptSealDelta,
    receiptSealDraft,
    runReceiptSealAudit,
  ]);

  const performSealReceiptDraft = useCallback(
    async ({
      draft = receiptSealDraft,
      deltaStatement: nextDeltaStatement = receiptSealDelta,
      overrideAcknowledged: nextOverrideAcknowledged = receiptSealOverrideAcknowledged,
      skipRootGate = false,
      silentFeedback = false,
    } = {}) => {
      if (!draft?.id) return null;
      if (!skipRootGate && requireRootFor("receipt-seal")) {
        return null;
      }

      const deltaStatement = String(nextDeltaStatement || "").trim();
      if (!deltaStatement) {
        setReceiptSealAuditError("Write one operator sentence describing what changed.");
        return null;
      }

      const audit =
        receiptSealAudit &&
        receiptSealDraft?.id === draft.id &&
        receiptSealAuditStatement === deltaStatement
          ? receiptSealAudit
          : await runReceiptSealAudit(draft, deltaStatement);
      if (!audit) {
        return null;
      }
      if (audit?.requiresOverrideAcknowledgement && !nextOverrideAcknowledged) {
        setReceiptSealAuditError("Acknowledge the attested overrides before sealing this receipt.");
        return null;
      }

      const shouldOverride = Boolean(!audit.sealReady && audit.canOverride);
      setReceiptPending(true);
      try {
        const response = await fetch("/api/workspace/receipt", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draftId: draft.id,
            deltaStatement,
            projectKey: activeProjectKey,
            overrideAudit: shouldOverride,
            overrideAcknowledged: nextOverrideAcknowledged,
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.draft?.id) {
          if (payload?.audit) {
            setReceiptSealAudit(payload.audit);
            setReceiptSealAuditStatement(deltaStatement);
          }
          setReceiptSealAuditError(payload?.error || "Could not seal the receipt.");
          throw new Error(payload?.error || "Could not seal the receipt.");
        }

        if (payload?.audit) {
          setReceiptSealAudit(payload.audit);
          setReceiptSealAuditStatement(deltaStatement);
        }
        upsertProjectDraftInState(setProjectDraftsState, payload.draft);
        const remoteSealStatus = String(payload?.draft?.payload?.remoteSeal?.status || "")
          .trim()
          .toLowerCase();
        const sealMessage =
          remoteSealStatus === "sealed"
            ? "Receipt sealed and verified."
            : remoteSealStatus === "pending_create" || remoteSealStatus === "pending_seal"
              ? "Receipt sealed locally. Courthouse sync is still pending."
              : remoteSealStatus === "failed"
                ? "Receipt sealed locally. Courthouse sync can retry from Receipts."
                : "Receipt sealed.";
        if (!silentFeedback) {
          setFeedback(sealMessage, "success");
        }
        return payload.draft;
      } catch (error) {
        if (!silentFeedback) {
          setFeedback(
            error instanceof Error ? error.message : "Could not seal the receipt.",
            "error",
          );
        }
        return null;
      } finally {
        setReceiptPending(false);
      }
    },
    [
      activeProjectKey,
      receiptSealAudit,
      receiptSealAuditStatement,
      receiptSealDelta,
      receiptSealDraft,
      receiptSealOverrideAcknowledged,
      requireRootFor,
      runReceiptSealAudit,
      setFeedback,
      setProjectDraftsState,
      setReceiptPending,
    ],
  );

  const sealReceiptDraft = useCallback(
    async ({ skipRootGate = false } = {}) => {
      const sealedDraft = await performSealReceiptDraft({
        skipRootGate,
      });
      if (!sealedDraft?.id) return null;

      receiptSealImmediateAuditDraftRef.current = "";
      resetReceiptSealState();
      return sealedDraft;
    },
    [performSealReceiptDraft, resetReceiptSealState],
  );

  return {
    receiptSealDraft,
    receiptSealDelta,
    setReceiptSealDelta,
    receiptSealAudit,
    receiptSealAuditPending,
    receiptSealAuditError,
    receiptSealOverrideAcknowledged,
    setReceiptSealOverrideAcknowledged,
    openReceiptSealDialog,
    closeReceiptSealDialog,
    runReceiptSealAudit,
    performSealReceiptDraft,
    sealReceiptDraft,
  };
}
