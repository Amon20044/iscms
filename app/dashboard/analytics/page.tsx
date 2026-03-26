import { requireDashboardUser } from "@/lib/auth/service";
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AnalyticsPage() {
  const viewer = await requireDashboardUser();

  const [kpis, trend, topProducts, pipeline, orgRevenue] = await Promise.all([
    getFinancialKpis(viewer),
    getRevenueTrend(viewer),
    getTopProducts(viewer),
    getPipelineBreakdown(viewer),
    getRevenueByOrg(viewer),
  ]);

  const isOwnerOrAdmin = viewer.role === "owner" || viewer.role === "admin";

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Analytics</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
                Revenue, profit &amp; trends.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Financial performance derived from{" "}
                {viewer.role === "org_admin"
                  ? `${viewer.organizationName} orders`
                  : "all delivered orders"}{" "}
                · last 12 months
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                COGS ratio 62%
              </span>
              <p className="text-[11px] text-slate-400">
                Gross margin estimated from order revenue
              </p>
            </div>
          </div>
        </section>

        {/* ── KPI Row ── */}
        <section className="mt-5">
          <KpiCards kpis={kpis} />
        </section>

        {/* ── Revenue Trend ── */}
        <section className="mt-5">
          <RevenueTrendChart data={trend} />
        </section>

        {/* ── Top Products + Pipeline ── */}
        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <TopProductsChart data={topProducts} />
          <PipelineChart data={pipeline} />
        </section>

        {/* ── Org Breakdown (owner/admin only) ── */}
        {isOwnerOrAdmin && orgRevenue.length > 0 && (
          <section className="mt-5">
            <OrgRevenueChart data={orgRevenue} />
          </section>
        )}

        {/* ── Footnote ── */}
        <section className="mt-6">
          <div className="rounded-[1.6rem] border border-slate-900/8 bg-white/40 px-5 py-4">
            <p className="text-xs leading-6 text-slate-400">
              <span className="font-semibold text-slate-500">Revenue</span> is computed from delivered orders (quantity × unit price).{" "}
              <span className="font-semibold text-slate-500">COGS</span> is estimated at 62% of revenue — a representative figure for distribution operations.{" "}
              <span className="font-semibold text-slate-500">Pipeline value</span> includes assigned and in-transit orders.
              All figures are in USD and cover the trailing 12 months.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
