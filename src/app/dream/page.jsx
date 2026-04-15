import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Library",
};

export default async function DreamPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
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

  const suffix = params.toString();
  redirect(`/library${suffix ? `?${suffix}` : ""}`);
}
