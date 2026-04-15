import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  params.set("artifactType", "library");
  const project = String(resolvedSearchParams?.project || "").trim();
  const sessionId = String(
    resolvedSearchParams?.sessionId || resolvedSearchParams?.session || "",
  ).trim();

  const artifactId = String(
    resolvedSearchParams?.artifactId || resolvedSearchParams?.document || "",
  ).trim();
  const anchor = String(resolvedSearchParams?.anchor || "").trim();
  if (project) {
    params.set("project", project);
  }
  if (sessionId) {
    params.set("sessionId", sessionId);
  }
  if (artifactId) {
    params.set("artifactId", artifactId);
  }
  if (anchor) {
    params.set("anchor", anchor);
  }

  redirect(`/workspace?${params.toString()}`);
}
