import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listSubmissions } from "@/db/submissions";
import Navbar from "@/components/shared/Navbar";
import ArchivedList from "@/components/admin/ArchivedList";
import type { SubmissionWithUser } from "@/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function ArchivedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");

  const submissions = await listSubmissions({
    includeDeleted: true,
    sort: "updatedAt",
    dir: "desc",
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ChevronLeft size={15} />
          Back to admin
        </Link>

        <div className="mb-6 animate-fade-up">
          <h1 className="font-display text-2xl font-700 text-white mb-1">Archived</h1>
          <p className="text-zinc-500 text-sm">
            Soft-deleted submissions. Restore them or delete for good.
          </p>
        </div>

        <div className="animate-fade-up animate-fade-up-delay-1">
          <ArchivedList submissions={submissions as SubmissionWithUser[]} />
        </div>
      </main>
    </div>
  );
}
