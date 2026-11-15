import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  description: "Danielle's dashboard for PartyTenders quote requests.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};

export default function AdminPage() {
  return (
    <main className="admin-stub">
      <p className="by">PartyTenders</p>
      <h1>Admin</h1>
      <p>
        This is where Danielle will sign in to read quote requests. Accounts
        and the database are not connected yet.
      </p>
      <p>
        <Link href="/">Back to the site</Link>
      </p>
    </main>
  );
}
