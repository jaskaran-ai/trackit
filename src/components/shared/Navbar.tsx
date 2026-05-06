"use client";

import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bug, Plus, LayoutDashboard, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session?.user?.role === "admin";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <img
            src="https://docs.docuid.net/logo.webp"
            alt="iVALT"
            className="h-6 w-auto"
          />
          <span className="font-display text-base font-700 text-white hidden sm:block">TrackIt</span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-400 transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/submit"
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:block">New</span>
          </Link>

          {/* User menu */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-600">
                    {session.user.name?.[0]}
                  </div>
                )}
                <ChevronDown size={12} className="text-zinc-500" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-zinc-800">
                      <p className="text-sm font-500 text-zinc-200 truncate">{session.user.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded">
                          <ShieldCheck size={10} /> Admin
                        </span>
                      )}
                    </div>

                    {/* Mobile nav links */}
                    <div className="sm:hidden border-b border-zinc-800">
                      {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <Icon size={14} /> {label}
                        </Link>
                      ))}
                    </div>

                    <button
                      onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/auth/signin"; } } })}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
