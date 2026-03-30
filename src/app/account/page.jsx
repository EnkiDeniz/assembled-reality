import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadReaderPageData } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const readerData = await loadReaderPageData(session.user.id);

  return (
    <main className="account-shell">
      <section className="account-card">
        <p className="lock-screen__eyebrow">Reader account</p>
        <h1 className="account-card__title">{readerData?.profile?.displayName || session.user.name}</h1>
        <dl className="account-card__meta">
          <div>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt>Cohort</dt>
            <dd>{readerData?.profile?.cohort?.toLowerCase() || "member"}</dd>
          </div>
          <div>
            <dt>Reader slug</dt>
            <dd>{readerData?.profile?.readerSlug || "pending"}</dd>
          </div>
          <div>
            <dt>GetReceipts</dt>
            <dd>{readerData?.getReceiptsConnection?.status?.toLowerCase() || "disconnected"}</dd>
          </div>
        </dl>
        <a className="account-card__link" href="/connect/getreceipts">
          Connect GetReceipts
        </a>
      </section>
    </main>
  );
}
