"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Boxes,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  Warehouse,
  Workflow,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import {
  USER_ROLE_LABELS,
  type AuthenticatedUser,
} from "@/lib/supply-chain/types";
import { BrandMark } from "@/components/site/brand-mark";

type NavigationLink = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

function NavLink({
  href,
  icon: Icon,
  isActive,
  label,
}: NavigationLink & {
  isActive: boolean;
}) {
  return (
    <Link
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        isActive
          ? "border border-transparent bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
          : "border border-slate-900/10 bg-white/72 text-slate-700 hover:border-slate-900/18 hover:bg-white hover:text-slate-950"
      }`}
      href={href}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href.includes("#")) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ viewer }: { viewer: AuthenticatedUser | null }) {
  const pathname = usePathname();

  // Dashboard pages have their own sidebar shell — no top header needed
  if (pathname.startsWith("/dashboard")) return null;

  const links: NavigationLink[] = viewer && ["owner", "org_admin", "admin"].includes(viewer.role)
    ? [
        { href: "/dashboard", icon: LayoutDashboard, label: "Control Tower" },
        { href: "/dashboard#orders", icon: Boxes, label: "Orders" },
        { href: "/dashboard#inventory", icon: Warehouse, label: "Inventory" },
        { href: "/dashboard#automation", icon: Workflow, label: "Automation" },
      ]
    : [
        { href: "/#platform", icon: LayoutDashboard, label: "Platform" },
        { href: "/#workflow", icon: Workflow, label: "Workflow" },
        { href: "/#access", icon: ShieldCheck, label: "Access Model" },
        { href: "/#stack", icon: Boxes, label: "Stack" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/6 bg-[rgba(248,241,228,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Link href="/">
            <BrandMark />
          </Link>

          <div className="flex flex-col gap-3 xl:items-end">
            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  isActive={isActivePath(pathname, link.href)}
                />
              ))}

              {viewer?.role === "owner" ? (
                <NavLink
                  href="/dashboard/admins"
                  icon={ShieldCheck}
                  isActive={isActivePath(pathname, "/dashboard/admins")}
                  label="Team Access"
                />
              ) : null}
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              {viewer ? (
                <>
                  <div className="rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-950">{viewer.name}</span>
                    <span className="mx-2 text-slate-400">/</span>
                    <span>{USER_ROLE_LABELS[viewer.role]}</span>
                    {viewer.organizationName ? (
                      <>
                        <span className="mx-2 text-slate-400">/</span>
                        <span>{viewer.organizationName}</span>
                      </>
                    ) : null}
                  </div>

                  <Link
                    className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900/18 hover:bg-white"
                    href="/dashboard"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Dashboard
                  </Link>

                  <form action={logoutAction}>
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      type="submit"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  href="/login"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
