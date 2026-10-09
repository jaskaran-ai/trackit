"use client";

import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/shared/BrandLogo";
import {
  NAV_LINK_CLASS,
  PRIMARY_ICON_LINK_CLASS,
} from "@/components/shared/linkButton";
import NotificationBell from "@/components/layout/NotificationBell";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { UserMenu } from "@/components/arc/user-menu/user-menu";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isAdmin = session?.user?.role === "admin";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  /* Menu entries navigate rather than render links, because UserMenu's items are
     buttons. The router push keeps this a client transition, so the menu does
     not do a full page load on the way to a route it could have prefetched. */
  const menuItems = [
    ...navLinks.map(({ href, label, icon: Icon }) => ({
      label,
      icon: <Icon size={14} strokeWidth={1.75} aria-hidden />,
      onSelect: () => router.push(href),
    })),
    {
      label: "Notifications",
      icon: <Bell size={14} strokeWidth={1.75} aria-hidden />,
      onSelect: () => router.push("/notifications"),
    },
    {
      label: "Settings",
      icon: <Settings size={14} strokeWidth={1.75} aria-hidden />,
      onSelect: () => router.push("/settings"),
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--background)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
        <Link href="/dashboard" className="flex shrink-0 items-center">
          <BrandLogo className="h-7 sm:h-8" />
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  NAV_LINK_CLASS,
                  active && "bg-surface-raised text-foreground",
                )}
              >
                <Icon size={14} aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* The one primary action on this surface, on every page. A link, not
              a button: it navigates, and Arc's Button renders a real <button>.

              The label is spelled out from `sm` up because "New" did not say
              what it did. Below that it collapses to the icon: the logo, this,
              and the account menu together do not fit 320px with any text. */}
          <Link href="/submit" className={PRIMARY_ICON_LINK_CLASS}>
            <Plus size={14} aria-hidden />
            <span className="hidden sm:inline">Report an issue</span>
            <span className="sr-only sm:hidden">Report an issue</span>
          </Link>

          {/* Below `sm` the account menu becomes a bottom sheet and carries the
              navigation, notifications, and theme, so the bar keeps one row. */}
          <div className="hidden items-center gap-1 sm:flex">
            <NotificationBell />
            <ThemeToggle />
          </div>

          {session?.user && (
            <UserMenu
              user={{
                name: session.user.name,
                email: session.user.email,
                avatarSrc: session.user.image ?? undefined,
                ...(isAdmin ? { plan: "Admin" } : {}),
              }}
              theme={theme}
              onThemeChange={setTheme}
              showTheme
              items={menuItems}
              showName={false}
              onSignOut={() =>
                signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/auth/signin";
                    },
                  },
                })
              }
            />
          )}
        </div>
      </div>
    </nav>
  );
}