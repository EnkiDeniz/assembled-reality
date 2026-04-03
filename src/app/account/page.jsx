import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AccountScreen from "@/components/AccountScreen";
import { authOptions } from "@/lib/auth";
import AuthenticatedAppFallback from "@/components/AuthenticatedAppFallback";
import HydrationBoundary from "@/components/HydrationBoundary";
import { getReaderDocumentDataForUser, getReaderDocumentHref } from "@/lib/reader-documents";
import {
  listReadingReceiptDraftsForUser,
  loadLatestReadingSnapshotForUser,
  loadReaderPageData,
} from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const [readerData, drafts, snapshot] = await Promise.all([
    loadReaderPageData(session.user.id),
    listReadingReceiptDraftsForUser(session.user.id),
    loadLatestReadingSnapshotForUser(session.user.id),
  ]);

  const documentData = await getReaderDocumentDataForUser(
    session.user.id,
    snapshot?.documentKey,
  );
  const sectionSlug = snapshot?.sectionSlug || "beginning";
  const matchedSection =
    sectionSlug === "beginning"
      ? null
      : documentData?.sections.find((section) => section.slug === sectionSlug) || null;
  const resumeLabel = matchedSection
    ? `${matchedSection.number} · ${matchedSection.title}`
    : "Beginning";
  const baseResumeHref = getReaderDocumentHref(snapshot?.documentKey);
  const resumeHref = sectionSlug === "beginning" ? baseResumeHref : `${baseResumeHref}#${sectionSlug}`;

  return (
    <HydrationBoundary fallback={<AuthenticatedAppFallback variant="account" />}>
      <AccountScreen
        initialProfile={readerData?.profile || null}
        email={session.user.email || ""}
        connectionStatus={readerData?.getReceiptsConnection?.status?.toLowerCase() || "disconnected"}
        drafts={drafts}
        readingSnapshot={{
          progressPercent: snapshot?.progressPercent || 0,
          resumeLabel,
          resumeHref,
          bookmarkCount: snapshot?.bookmarkCount || 0,
          highlightCount: snapshot?.highlightCount || 0,
          noteCount: snapshot?.noteCount || 0,
        }}
      />
    </HydrationBoundary>
  );
}
