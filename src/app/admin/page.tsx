import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import AdminTable from "./AdminTable";
import KanbanBoard from "./KanbanBoard";
import AdminViewToggle from "./AdminViewToggle";
import { Bug, Sparkles, Users, Inbox } from "lucide-react";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [submissions, stats] = await Promise.all([
    prisma.submission.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.submission.count(),
      prisma.submission.count({ where: { status: "OPEN" } }),
      prisma.submission.count({ where: { status: "IN_PROGRESS" } }),
      prisma.submission.count({ where: { type: "BUG" } }),
      prisma.submission.count({ where: { type: "FEATURE" } }),
      prisma.user.count(),
    ]),
  ]);

  const [total, open, inProgress, bugs, features, users] = stats;

  const statCards = [
    { label: "Total", value: total, icon: Inbox, color: "text-white" },
    { label: "Open", value: open, icon: Inbox, color: "text-blue-400" },
    { label: "In Progress", value: inProgress, icon: Inbox, color: "text-amber-400" },
    { label: "Bugs", value: bugs, icon: Bug, color: "text-red-400" },
    { label: "Features", value: features, icon: Sparkles, color: "text-violet-400" },
    { label: "Users", value: users, icon: Users, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-2xl font-700 text-white mb-1">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm">All submissions across all users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-fade-up animate-fade-up-delay-1">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4">
              <div className={`font-display text-2xl font-700 ${color} mb-0.5`}>{value}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <Icon size={10} />
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* View toggle + content */}
        <div className="animate-fade-up animate-fade-up-delay-2">
          <AdminViewToggle
            tableView={<AdminTable submissions={submissions as any} />}
            kanbanView={<KanbanBoard submissions={submissions as any} />}
          />
        </div>
      </main>
    </div>
  );
}
