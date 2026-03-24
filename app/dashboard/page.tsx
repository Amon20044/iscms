import { Sparkles } from "lucide-react";
import {
  CarrierStatusPill,
  OrderStatePill,
} from "@/components/dashboard/status-pill";
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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

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

        {/* ── Workflow States + Delay Alerts ── */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Workflow States</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Order lifecycle at a glance
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.stateCounts.map((state) => (
                <div key={state.state} className="data-tile rounded-[1.6rem] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <OrderStatePill state={state.state} />
                    <span className="text-2xl font-semibold tracking-tight text-slate-900">
                      {state.count}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">{state.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ca6b3f]" />
              <p className="section-kicker">Delay Alerts</p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Orders outside SLA
            </h2>
            <div className="mt-5 space-y-3">
              {snapshot.delayAlerts.length ? (
                snapshot.delayAlerts.map((alert) => (
                  <div
                    key={alert.orderId}
                    className="rounded-[1.4rem] border border-[#cb5e4a]/18 bg-[#fff0eb] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#8f3e31]">{alert.customerName}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-[#b96a55]">
                          {alert.organizationName}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-[#b96a55]">
                          {alert.hoursPastDue.toFixed(1)}h past ETA
                        </p>
                      </div>
                      <CarrierStatusPill status="degraded" />
                    </div>
                    <p className="mt-2.5 text-sm leading-5 text-[#8f3e31]">{alert.reason}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-[#4f7d3f]/20 bg-[#f0faea] p-4">
                  <p className="font-semibold text-[#3d5e31]">All clear</p>
                  <p className="mt-1 text-sm text-[#3d5e31]/70">No orders are currently delayed.</p>
                </div>
              )}
            </div>
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
