"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PRIMARY_LINK_CLASS } from "@/components/shared/linkButton";

export default function AdminHeader() {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-500 text-foreground sm:text-2xl">
          Admin Dashboard
        </h1>
        <p className="text-xs text-muted sm:text-sm">All submissions across all users</p>
      </div>
      <Link href="/submit" className={PRIMARY_LINK_CLASS}>
        <Plus size={15} aria-hidden />
        Report an issue
      </Link>
    </div>
  );
}
