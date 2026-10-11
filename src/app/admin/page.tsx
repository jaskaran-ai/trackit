import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Navbar from "@/components/shared/Navbar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsSection from "@/components/admin/AdminStatsSection";
import AdminSubmissionsSection from "@/components/admin/AdminSubmissionsSection";
import AdminUsersSection from "@/components/admin/AdminUsersSection";

/**
 * Only the auth check runs on the server. The shell is sent right away, and each
 * section fetches its own data through the shared TanStack cache. Awaiting the
 * data here would hold the whole route behind the slowest query, and the client
 * cache could not skip that wait, because the route itself is never cached.
 */
export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <AdminHeader />
        <AdminStatsSection />
        <AdminSubmissionsSection />
        <div className="mt-8">
          <AdminUsersSection currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
