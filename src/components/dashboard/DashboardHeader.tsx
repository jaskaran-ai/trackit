"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { PRIMARY_LINK_CLASS } from "@/components/shared/linkButton";

export default function DashboardHeader() {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 sm:mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-500 text-foreground sm:text-2xl">
          My submissions
        </h1>
        <p className="text-xs text-muted sm:text-sm">Welcome back, {firstName}</p>
      </div>
      <Link href="/submit" className={PRIMARY_LINK_CLASS}>
        <Plus size={15} aria-hidden />
        Report an issue
      </Link>
    </div>
  );
}
