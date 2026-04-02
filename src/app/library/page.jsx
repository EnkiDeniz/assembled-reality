import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import DocumentLibraryScreen from "@/components/DocumentLibraryScreen";
import { authOptions } from "@/lib/auth";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getReaderProfileByUserId } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const [documents, readerData] = await Promise.all([
    listReaderDocumentsForUser(session.user.id),
    getReaderProfileByUserId(session.user.id),
  ]);

  return (
    <DocumentLibraryScreen
      documents={documents}
      profile={readerData?.profile || null}
    />
  );
}
