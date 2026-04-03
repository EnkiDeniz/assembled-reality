import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReaderDocumentPage({ params }) {
  const resolvedParams = await params;
  const documentKey = String(resolvedParams?.documentKey || "").trim();
  if (!documentKey) {
    notFound();
  }

  redirect(`/workspace?document=${encodeURIComponent(documentKey)}`);
}
