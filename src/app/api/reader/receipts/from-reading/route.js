import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import {
  buildReadingReceiptPayload,
  createRemoteReadingReceiptDraft,
  getGetReceiptsConnectionForUser,
} from "@/lib/getreceipts";
import {
  createReadingReceiptDraftForUser,
  getReaderProfileByUserId,
} from "@/lib/reader-db";
import { getEvidenceItemsForUser } from "@/lib/reader-workspace";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";

export const dynamic = "force-dynamic";

const RECEIPT_STANCES = new Set(["TENTATIVE", "WORKING", "CONFIDENT"]);

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const documentKey = String(body?.documentKey || PRIMARY_DOCUMENT_KEY).trim();
  const title = String(body?.title || "").trim();
  const interpretation = String(body?.interpretation || "").trim();
  const implications = String(body?.implications || "").trim();
  const rawStance = String(body?.stance || "tentative").trim().toUpperCase();
  const stance = RECEIPT_STANCES.has(rawStance) ? rawStance : "TENTATIVE";
  const evidenceItemIds = Array.isArray(body?.evidenceItemIds) ? body.evidenceItemIds : [];
  const linkedMessageIds = Array.isArray(body?.linkedMessageIds) ? body.linkedMessageIds : [];
  const conversationThreadId = String(body?.threadId || "").trim() || null;

  if (!title) {
    return NextResponse.json({ error: "Receipt title is required." }, { status: 400 });
  }

  if (!interpretation) {
    return NextResponse.json({ error: "Interpretation is required." }, { status: 400 });
  }

  if (evidenceItemIds.length === 0) {
    return NextResponse.json(
      { error: "At least one reviewed evidence item is required." },
      { status: 400 },
    );
  }

  const [resolved, evidenceItems] = await Promise.all([
    getReaderProfileByUserId(session.user.id),
    getEvidenceItemsForUser(session.user.id, {
      documentKey,
      evidenceItemIds,
    }),
  ]);

  if (!resolved?.profile) {
    return NextResponse.json({ error: "Reader profile not found" }, { status: 404 });
  }

  if (evidenceItems.length === 0 || evidenceItems.length !== evidenceItemIds.length) {
    return NextResponse.json(
      { error: "The reviewed evidence set could not be resolved." },
      { status: 400 },
    );
  }

  const sourceSections = [
    ...new Set(evidenceItems.map((item) => item.sectionSlug).filter(Boolean)),
  ];
  const sourceMarkIds = evidenceItems.map((item) => item.sourceMarkId).filter(Boolean);
  const resolvedLinkedMessageIds = [
    ...new Set([
      ...linkedMessageIds.filter(Boolean),
      ...evidenceItems.map((item) => item.sourceMessageId).filter(Boolean),
    ]),
  ];
  const payload = buildReadingReceiptPayload({
    profile: resolved.profile,
    documentKey,
    title,
    evidenceItems,
    interpretation,
    implications,
    stance: stance.toLowerCase(),
    linkedMessageIds: resolvedLinkedMessageIds,
  });
  const connection = await getGetReceiptsConnectionForUser(session.user.id);

  let remoteReceipt = null;
  let draftStatus = "LOCAL_DRAFT";
  let remoteError = null;

  if (connection?.status === "CONNECTED" && connection?.accessTokenEncrypted) {
    try {
      remoteReceipt = await createRemoteReadingReceiptDraft(connection, payload);
      draftStatus = "REMOTE_DRAFT";
    } catch (error) {
      remoteError = error instanceof Error ? error.message : "getreceipts-create-failed";
    }
  }

  const draft = await createReadingReceiptDraftForUser(session.user.id, {
    documentKey,
    conversationThreadId,
    status: draftStatus,
    title,
    interpretation,
    implications: implications || null,
    stance,
    linkedEvidenceItemIds: evidenceItems.map((item) => item.id),
    linkedMessageIds: resolvedLinkedMessageIds,
    getReceiptsReceiptId: remoteReceipt?.id || null,
    sourceSections,
    sourceMarkIds,
    payload: {
      documentKey,
      title,
      interpretation,
      implications,
      stance: stance.toLowerCase(),
      evidenceItems,
      linkedMessageIds: resolvedLinkedMessageIds,
      ...payload,
      remoteReceipt,
      remoteError,
    },
  });

  return NextResponse.json({
    ok: true,
    draft: {
      id: draft.id,
      status: draft.status,
      title: draft.title,
      interpretation: draft.interpretation,
      implications: draft.implications,
      stance: String(draft.stance || "").toLowerCase(),
      linkedEvidenceItemIds: draft.linkedEvidenceItemIds,
      linkedMessageIds: draft.linkedMessageIds,
      sourceSections: draft.sourceSections,
      sourceMarkIds: draft.sourceMarkIds,
      payload: draft.payload,
    },
    remoteReceipt,
    remoteError,
  });
}
