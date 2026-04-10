import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReaderDocumentPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const documentKey = String(resolvedParams?.documentKey || "").trim();
  if (!documentKey) {
    notFound();
  }

  const query = new URLSearchParams();
  query.set("document", documentKey);

  const projectKey = String(resolvedSearchParams?.project || "").trim();
  if (projectKey) {
    query.set("project", projectKey);
  }

  redirect(`/workspace?${query.toString()}`);
}
