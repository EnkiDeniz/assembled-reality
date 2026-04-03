import { getServerSession } from "next-auth";
import ListenerHomeScreen from "@/components/ListenerHomeScreen";
import { authOptions } from "@/lib/auth";
import { getParsedDocument } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { buildExcerpt } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const documentData = getParsedDocument();
  const savedDocuments = session?.user?.id
    ? await listReaderDocumentsForUser(session.user.id)
    : [];

  return (
    <ListenerHomeScreen
      session={session}
      authCapabilities={{
        appleEnabled: appEnv.apple.enabled,
        magicLinksEnabled: appEnv.magicLinksEnabled,
      }}
      savedLibraryCount={savedDocuments.filter((document) => document.sourceType !== "builtin").length}
      sampleDocument={{
        documentKey: documentData.documentKey,
        title: documentData.title,
        subtitle: documentData.subtitle,
        excerpt: buildExcerpt(
          documentData.introMarkdown || documentData.sections[0]?.markdown || "",
          180,
        ),
        sourceType: "builtin",
        format: "markdown",
        formatLabel: "Markdown",
        originalFilename: null,
        href: "/read",
        wordCount: 0,
        sectionCount: documentData.sections.length,
        progressPercent: 0,
        createdAt: null,
        updatedAt: null,
      }}
    />
  );
}
