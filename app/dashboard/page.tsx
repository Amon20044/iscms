import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Boxes,
  Building2,
  Sparkles,
  Truck,
  Warehouse,
} from "lucide-react";
import { requireDashboardUser, canManageAdmins } from "@/lib/auth/service";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import {
  getFinancialKpis,
  getRevenueTrend,
  getTopProducts,
  getPipelineBreakdown,
  getRevenueByOrg,
} from "@/lib/analytics/service";
import { KpiCards } from "@/components/dashboard/analytics/kpi-cards";
import { RevenueTrendChart } from "@/components/dashboard/analytics/revenue-trend-chart";
import { TopProductsChart } from "@/components/dashboard/analytics/top-products-chart";
import { PipelineChart } from "@/components/dashboard/analytics/pipeline-chart";
import { OrgRevenueChart } from "@/components/dashboard/analytics/org-revenue-chart";
import { OrderStateTable } from "@/components/dashboard/enterprise/order-state-table";
import { DelayAlertPanel } from "@/components/dashboard/enterprise/delay-alert-panel";
import { USER_ROLE_LABELS, type AuthenticatedUser, type DashboardSnapshot } from "@/lib/supply-chain/types";
import type { FinancialKpis, MonthlyTick, TopProduct, PipelineSlice, OrgRevenue } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ── Setup banner (no DB) ── */
function SetupBanner({ error }: { error?: string }) {
  return (
    <main className="pb-16">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-[2.4rem] p-8 sm:p-12">
          <p className="section-kicker">Setup required</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Connect your Neon database to activate the control tower.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Add your connection string in{" "}
            <code className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-sm">.env</code>{" "}
            then run the DB sync.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { step: "1", label: "Apply schema", cmd: "npm run db:push -- --force" },
              { step: "2", label: "Seed data",    cmd: "npm run db:seed" },
              { step: "3", label: "Start app",    cmd: "npm run dev" },
            ].map((item) => (
              <div key={item.step} className="data-tile rounded-[1.8rem] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {item.step}. {item.label}
                </p>
                <p className="mt-3 font-mono text-sm text-slate-800">{item.cmd}</p>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-6 rounded-[1.4rem] border border-[#cb5e4a]/25 bg-[#fff0eb] px-5 py-4 text-sm text-[#8f3e31]">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ── Quick-nav shortcuts ── */
const NAV_SHORTCUTS = [
  { href: "/dashboard/orders",     icon: Boxes,     label: "Orders" },
  { href: "/dashboard/inventory",  icon: Warehouse, label: "Inventory" },
  { href: "/dashboard/warehouses", icon: Building2, label: "Warehouses" },
  { href: "/dashboard/carriers",   icon: Truck,     label: "Carriers" },
  { href: "/dashboard/traceability", icon: Activity, label: "Traceability" },
];

/* ── Main dashboard ── */
function EnterpriseDashboard({
  viewer,
  snapshot,
  kpis,
  trend,
  topProducts,
  pipeline,
  orgRevenue,
}: {
  viewer: AuthenticatedUser;
  snapshot: DashboardSnapshot;
  kpis: FinancialKpis;
  trend: MonthlyTick[];
  topProducts: TopProduct[];
  pipeline: PipelineSlice[];
  orgRevenue: OrgRevenue[];
}) {
  const isOwnerOrAdmin = viewer.role === "owner" || viewer.role === "admin";
  const showOwnerTools = canManageAdmins(viewer.role);

  function formatRelativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Command Header ── */}
        <section className="glass-panel rounded-[2rem] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: identity */}
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                    {viewer.name.split(" ")[0]}
                  </h1>
                  <span className="rounded-full border border-slate-900/10 bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {USER_ROLE_LABELS[viewer.role]}
                  </span>
                  {viewer.organizationName && (
                    <span className="hidden text-xs text-slate-400 sm:inline">
                      · {viewer.organizationName}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Control Tower · Last run {formatRelativeTime(snapshot.meta.lastAutomationRunAt)}
                </p>
              </div>
            </div>

            {/* Right: alert pills */}
            <div className="flex items-center gap-2">
              {snapshot.delayAlerts.length > 0 && (
                <Link
                  href="/dashboard/orders"
                  className="flex items-center gap-1.5 rounded-full border border-[#cb5e4a]/30 bg-[#fff0eb] px-3 py-1.5 text-xs font-semibold text-[#8f3e31] transition hover:bg-[#ffe8df]"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#cb5e4a]" />
                  {snapshot.delayAlerts.length} delay{snapshot.delayAlerts.length > 1 ? "s" : ""}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
              <span className="rounded-full border border-slate-900/8 bg-white/60 px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-500">
                {snapshot.orders.length} orders
              </span>
              <span className="hidden rounded-full border border-slate-900/8 bg-white/60 px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-500 sm:inline">
                {snapshot.products.length} SKUs
              </span>
            </div>
          </div>

          {/* Quick-nav shortcuts */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-900/6 pt-4">
            {NAV_SHORTCUTS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-1.5 rounded-full border border-slate-900/8 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-900/16 hover:bg-white hover:text-slate-900"
                >
                  <Icon className="h-3 w-3" />
                  {s.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── KPI Strip ── */}
        <section className="mt-4">
          <KpiCards kpis={kpis} />
        </section>

        {/* ── Main Charts: Revenue Trend + Pipeline ── */}
        <section className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RevenueTrendChart data={trend} />
          </div>
          <div className="xl:col-span-1">
            <PipelineChart data={pipeline} />
          </div>
        </section>

        {/* ── Second row: Top Products + Order Health ── */}
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <TopProductsChart data={topProducts} />
          <OrderStateTable states={snapshot.stateCounts} />
        </section>

        {/* ── Org Revenue Breakdown (owner/admin) ── */}
        {isOwnerOrAdmin && orgRevenue.length > 0 && (
          <section className="mt-4">
            <OrgRevenueChart data={orgRevenue} />
          </section>
        )}

        {/* ── Delay Alerts ── */}
        <section className="mt-4">
          <DelayAlertPanel alerts={snapshot.delayAlerts} />
        </section>

        {/* ── Last Automation Run ── */}
        <section className="mt-4">
          <div className="rounded-[2rem] bg-slate-950 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-white/40" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  Last automation run
                </p>
              </div>
              <Link
                href="/dashboard/automation"
                className="flex items-center gap-1 text-xs font-semibold text-white/40 transition hover:text-white/70"
              >
                Run console <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.meta.lastAutomationSummary.map((item, i) => (
                <div
                  key={`${snapshot.meta.lastAutomationRunAt}-${i}`}
                  className="rounded-xl bg-white/[0.06] px-4 py-3 text-sm text-white/65"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Owner tools strip ── */}
        {showOwnerTools && (
          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/admins"
              className="group flex items-center justify-between rounded-[1.6rem] border border-slate-900/10 bg-white/70 px-5 py-4 transition hover:border-slate-900/18 hover:bg-white"
            >
              <div>
                <p className="section-kicker">Owner tools</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Team &amp; admin access
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
            </Link>
            <Link
              href="/dashboard/warehouses"
              className="group flex items-center justify-between rounded-[1.6rem] border border-slate-900/10 bg-white/70 px-5 py-4 transition hover:border-slate-900/18 hover:bg-white"
            >
              <div>
                <p className="section-kicker">Network</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Warehouses &amp; carriers
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
            </Link>
          </section>
        )}

        {/* ── Data footnote ── */}
        <p className="mt-5 text-center text-[11px] text-slate-400">
          Revenue & profit derived from delivered orders · COGS estimated at 62% · Trailing 12 months
        </p>

      </div>
    </main>
  );
}

/* ── Page entry ── */
export default async function DashboardPage() {
  if (!isDatabaseConfigured()) return <SetupBanner />;

  const viewer = await requireDashboardUser();

  let snapshot, kpis, trend, topProducts, pipeline, orgRevenue;
  try {
    [snapshot, kpis, trend, topProducts, pipeline, orgRevenue] =
      await Promise.all([
        getDashboardSnapshot(viewer),
        getFinancialKpis(viewer),
        getRevenueTrend(viewer),
        getTopProducts(viewer),
        getPipelineBreakdown(viewer),
        getRevenueByOrg(viewer),
      ]);
  } catch (error) {
    return (
      <SetupBanner
        error={error instanceof Error ? error.message : "Unable to load dashboard."}
      />
    );
  }

  return (
    <EnterpriseDashboard
      viewer={viewer}
      snapshot={snapshot}
      kpis={kpis}
      trend={trend}
      topProducts={topProducts}
      pipeline={pipeline}
      orgRevenue={orgRevenue}
    />
  );
}
