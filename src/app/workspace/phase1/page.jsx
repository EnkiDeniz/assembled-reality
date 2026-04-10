import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspacePhase1Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();

  Object.entries(resolvedSearchParams || {}).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        const normalizedEntry = String(entry || "").trim();
        if (normalizedEntry) {
          params.append(key, normalizedEntry);
        }
      });
      return;
    }

    const normalizedValue = String(value || "").trim();
    if (normalizedValue) {
      params.set(key, normalizedValue);
    }
  });

  const query = params.toString();
  redirect(query ? `/workspace?${query}` : "/workspace");
}
