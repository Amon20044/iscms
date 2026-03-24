import { requireDashboardUser } from "@/lib/auth/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import { AutomationConsole } from "@/components/dashboard/automation-console";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AutomationPage() {
  const viewer = await requireDashboardUser();
  const snapshot = await getDashboardSnapshot(viewer);

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-7 sm:p-9">
          <p className="section-kicker">Automation</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
            Delay detection and recovery loop.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Run the automation cycle to check ETA drift, flag at-risk orders, and trigger carrier reassignment automatically.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Last run: {formatDateTime(snapshot.meta.lastAutomationRunAt)}
          </p>
        </section>

        {/* ── Automation Console ── */}
        <section className="mt-5">
          <AutomationConsole
            lastRunAt={snapshot.meta.lastAutomationRunAt}
            summary={snapshot.meta.lastAutomationSummary}
          />
        </section>

        {/* ── Previous run summary (dark) ── */}
        <section className="mt-5">
          <div className="rounded-[2rem] bg-slate-950 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Last cycle output
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {formatDateTime(snapshot.meta.lastAutomationRunAt)}
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
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

      </div>
    </main>
  );
}
