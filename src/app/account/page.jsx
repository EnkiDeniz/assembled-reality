import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirectToCanonicalHost } from "@/lib/canonical-host";
import { getParsedDocument } from "@/lib/document";
import { listReadingReceiptDraftsForUser, loadReaderPageData } from "@/lib/reader-db";
import AccountScreen from "@/components/AccountScreen";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }) {
  await redirectToCanonicalHost("/account", await searchParams);
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const readerData = await loadReaderPageData(session.user.id);
  const drafts = await listReadingReceiptDraftsForUser(session.user.id);
  const documentData = getParsedDocument();
  const progress = readerData?.progress || null;
  const sectionSlug = progress?.sectionSlug || "beginning";
  const matchedSection =
    sectionSlug === "beginning"
      ? null
      : documentData.sections.find((section) => section.slug === sectionSlug) || null;
  const resumeLabel = matchedSection
    ? `${matchedSection.number} · ${matchedSection.title}`
    : "Beginning";
  const resumeHref = sectionSlug === "beginning" ? "/read" : `/read#${sectionSlug}`;
  const annotations = readerData?.annotations || {
    bookmarks: [],
    highlights: [],
    notes: [],
  };

  return (
    <AccountScreen
      initialProfile={readerData?.profile || null}
      email={session.user.email || ""}
      connectionStatus={readerData?.getReceiptsConnection?.status?.toLowerCase() || "disconnected"}
      drafts={drafts}
      readingSnapshot={{
        progressPercent: progress?.progressPercent || 0,
        resumeLabel,
        resumeHref,
        bookmarkCount: annotations.bookmarks.length,
        highlightCount: annotations.highlights.length,
        noteCount: annotations.notes.length,
      }}
    />
  );
}
