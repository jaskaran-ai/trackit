import { requireAdmin } from "@/lib/session";
import Navbar from "@/components/shared/Navbar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsSection from "@/components/admin/AdminStatsSection";
import AdminSubmissionsSection from "@/components/admin/AdminSubmissionsSection";
import AdminUsersSection from "@/components/admin/AdminUsersSection";

/**
 * The auth check is the only work here, and requireAdmin() does it against the
 * database. The shell is sent right away, and each section fetches its own data
 * through the shared TanStack cache. Awaiting the data here would hold the
 * whole route behind the slowest query, and the client cache could not skip
 * that wait, because the route itself is never cached.
 */
export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <AdminHeader />
        <AdminStatsSection />
        <AdminSubmissionsSection />
        <div className="mt-8">
          <AdminUsersSection />
        </div>
      </main>
    </div>
  );
}
