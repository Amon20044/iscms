import { Sparkles } from "lucide-react";
import { OrderStatePill } from "@/components/dashboard/status-pill";
import {
  canManageAdmins,
  requireDashboardUser,
} from "@/lib/auth/service";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import {
  USER_ROLE_LABELS,
  type AuthenticatedUser,
  type DashboardSnapshot,
} from "@/lib/supply-chain/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadSnapshot(viewer: AuthenticatedUser) {
  try {
    return { snapshot: await getDashboardSnapshot(viewer) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to load dashboard.",
      snapshot: null,
    };
  }
}

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
              { step: "2", label: "Seed owner data", cmd: "npm run db:seed" },
              { step: "3", label: "Start app", cmd: "npm run dev" },
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

function OverviewPage({
  snapshot,
  viewer,
}: {
  snapshot: DashboardSnapshot;
  viewer: AuthenticatedUser;
}) {
  const showOwnerTools = canManageAdmins(viewer.role);
  const delayCount = snapshot.delayAlerts.length;

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <section className="glass-panel rounded-[2.6rem] p-7 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <p className="section-kicker">Control Tower</p>
            <span className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {USER_ROLE_LABELS[viewer.role]}
            </span>
            {delayCount > 0 && (
              <span className="rounded-full border border-[#cb5e4a]/30 bg-[#fff0eb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3e31]">
                {delayCount} delay{delayCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Welcome back, {viewer.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {snapshot.meta.scopeLabel}&nbsp;·&nbsp;Last automation:{" "}
            {formatDateTime(snapshot.meta.lastAutomationRunAt)}
          </p>
        </section>

        {/* ── Workflow Stats ── */}
        <section className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {snapshot.workflowStats.map((stat) => (
            <div key={stat.label} className="glass-panel rounded-[1.8rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">{stat.hint}</p>
            </div>
          ))}
        </section>

        {/* ── Workflow States ── */}
        <section className="mt-5">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">Workflow States</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Order lifecycle at a glance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["State", "Count", "Description"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5">
                  {snapshot.stateCounts.map((state) => (
                    <tr key={state.state} className="transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 pl-6">
                        <OrderStatePill state={state.state} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-2xl font-semibold tabular-nums text-slate-900">{state.count}</span>
                      </td>
                      <td className="px-5 py-4 pr-6">
                        <p className="text-sm leading-6 text-slate-500">{state.description}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Delay Alerts ── */}
        <section className="mt-5">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="flex items-center gap-2 border-b border-slate-900/6 px-6 py-5">
              <Sparkles className="h-4 w-4 text-[#ca6b3f]" />
              <div>
                <p className="section-kicker">Delay Alerts</p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">
                  Orders outside SLA
                </h2>
              </div>
            </div>
            {snapshot.delayAlerts.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-slate-900/6 bg-[#fff8f5]">
                      {["Customer", "Organization", "Hours Past ETA", "Carrier / Warehouse", "Reason"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-[#b96a55] first:pl-6 last:pr-6">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cb5e4a]/10">
                    {snapshot.delayAlerts.map((alert) => (
                      <tr key={alert.orderId} className="bg-[#fff0eb] transition-colors hover:bg-[#ffe8df]">
                        <td className="px-5 py-4 pl-6">
                          <p className="text-sm font-semibold text-[#8f3e31]">{alert.customerName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-[#8f3e31]">{alert.organizationName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold tabular-nums text-[#8f3e31]">{alert.hoursPastDue.toFixed(1)}h</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-[#8f3e31]">{alert.carrierName}</p>
                          <p className="mt-0.5 text-xs text-[#b96a55]">{alert.warehouseName}</p>
                        </td>
                        <td className="px-5 py-4 pr-6">
                          <p className="text-sm leading-6 text-[#8f3e31]">{alert.reason}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-6">
                <div className="rounded-xl border border-[#4f7d3f]/20 bg-[#f0faea] px-5 py-4">
                  <p className="text-sm font-semibold text-[#3d5e31]">All clear — no delayed orders.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Last Automation Summary ── */}
        <section className="mt-5">
          <div className="rounded-[2rem] bg-slate-950 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Last automation run
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-white">
              {formatDateTime(snapshot.meta.lastAutomationRunAt)}
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.meta.lastAutomationSummary.map((item, i) => (
                <div
                  key={`${snapshot.meta.lastAutomationRunAt}-${i}`}
                  className="rounded-xl bg-white/[0.07] px-4 py-3 text-sm text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Owner Tools ── */}
        {showOwnerTools && (
          <section className="mt-5">
            <Link
              className="group flex items-center justify-between rounded-[1.8rem] border border-slate-900/10 bg-white/75 px-6 py-5 transition hover:border-slate-900/18 hover:bg-white"
              href="/dashboard/admins"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Owner tools
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
                  Manage organizations and admin access
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900" />
            </Link>
          </section>
        )}

      </div>
    </main>
  );
}

export default async function DashboardPage() {
  if (!isDatabaseConfigured()) return <SetupBanner />;

  const viewer = await requireDashboardUser();
  const { snapshot, error } = await loadSnapshot(viewer);

  if (!snapshot) return <SetupBanner error={error} />;

  return <OverviewPage snapshot={snapshot} viewer={viewer} />;
}
