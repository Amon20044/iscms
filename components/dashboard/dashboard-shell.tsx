"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Truck,
  Warehouse,
  Workflow,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/site/brand-mark";
import { USER_ROLE_LABELS, type AuthenticatedUser } from "@/lib/supply-chain/types";

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

function getNavItems(viewer: AuthenticatedUser): NavItem[] {
  const items: NavItem[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/orders", icon: Boxes, label: "Orders" },
    { href: "/dashboard/inventory", icon: Warehouse, label: "Inventory" },
    { href: "/dashboard/warehouses", icon: Building2, label: "Warehouses" },
    { href: "/dashboard/carriers", icon: Truck, label: "Carriers" },
    { href: "/dashboard/automation", icon: Workflow, label: "Automation" },
    { href: "/dashboard/traceability", icon: Activity, label: "Traceability" },
  ];
  if (viewer.role === "owner") {
    items.push({ href: "/dashboard/admins", icon: ShieldCheck, label: "Team Access" });
  }
  return items;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNavLink({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
}: NavItem & { isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
        isActive
          ? "bg-slate-950 text-white shadow-[0_8px_24px_rgba(15,23,42,0.2)]"
          : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function UserCard({ viewer }: { viewer: AuthenticatedUser }) {
  return (
    <div className="rounded-2xl bg-white/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {USER_ROLE_LABELS[viewer.role]}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{viewer.name}</p>
      {viewer.organizationName && (
        <p className="mt-0.5 truncate text-xs text-slate-500">{viewer.organizationName}</p>
      )}
    </div>
  );
}

export function DashboardShell({
  viewer,
  children,
}: {
  viewer: AuthenticatedUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navItems = getNavItems(viewer);

  return (
    <div className="flex min-h-screen">

      {/* ── Desktop Sidebar ── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[220px] flex-col border-r border-slate-900/8 bg-[rgba(248,241,228,0.96)] backdrop-blur-xl lg:flex">
        <div className="px-4 py-5">
          <Link href="/">
            <BrandMark />
          </Link>
        </div>

        <div className="mx-3 mb-3 h-px bg-slate-900/8" />

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.href}
              {...item}
              isActive={isActivePath(pathname, item.href)}
            />
          ))}
        </nav>

        <div className="mx-3 mt-3 h-px bg-slate-900/8" />

        <div className="space-y-1.5 px-3 py-4">
          <UserCard viewer={viewer} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-slate-900/8 bg-[rgba(248,241,228,0.95)] px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/">
          <BrandMark />
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-xl border border-slate-900/10 bg-white/80 p-2 text-slate-700 transition hover:bg-white"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile Drawer Overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-slate-900/8 bg-[rgba(248,241,228,0.99)] transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <BrandMark />
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-xl border border-slate-900/10 bg-white/80 p-1.5 text-slate-600 transition hover:bg-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-4 h-px bg-slate-900/8" />

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.href}
              {...item}
              isActive={isActivePath(pathname, item.href)}
              onClick={() => setDrawerOpen(false)}
            />
          ))}
        </nav>

        <div className="mx-4 h-px bg-slate-900/8" />

        <div className="space-y-1.5 px-3 py-4">
          <UserCard viewer={viewer} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex min-h-screen w-full flex-col lg:ml-[220px]">
        {/* Top spacer for mobile header */}
        <div className="h-[61px] lg:hidden" />
        <div className="flex-1">
          {children}
        </div>
      </div>

    </div>
  );
}
