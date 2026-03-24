import { requireDashboardUser } from "@/lib/auth/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const API_CONTRACTS = [
  {
    endpoint: "POST /api/orders",
    description: "Create an order, reserve inventory, and assign warehouse and carrier.",
  },
  {
    endpoint: "PATCH /api/orders/:id",
    description: "Reassign an order or confirm delivery from the control tower.",
  },
  {
    endpoint: "POST /api/automation/run",
    description: "Run the automated delay detection and reassignment cycle.",
  },
  {
    endpoint: "GET /api/dashboard",
    description: "Return the live aggregate snapshot that powers the dashboard view.",
  },
] as const;

export default async function TraceabilityPage() {
  const viewer = await requireDashboardUser();
  const snapshot = await getDashboardSnapshot(viewer);

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-7 sm:p-9">
          <p className="section-kicker">Traceability</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
            Audit trail and API contracts.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Every workflow action is logged with a timestamp and summary. The backend API contracts are documented below.
          </p>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">

          {/* Audit trail */}
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Workflow logs</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Recent audit trail
            </h2>
            <div className="mt-6 space-y-3">
              {snapshot.recentLogs.map((log) => (
                <div key={log.id} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{log.action}</p>
                    <p className="shrink-0 text-xs uppercase tracking-[0.13em] text-slate-400">
                      {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{log.summary}</p>
                </div>
              ))}
              {snapshot.recentLogs.length === 0 && (
                <div className="rounded-[1.4rem] border border-slate-900/8 bg-white/60 p-5 text-sm text-slate-500">
                  No workflow logs recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* API contracts */}
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">API Interface</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Backend contract
            </h2>
            <div className="mt-6 space-y-3">
              {API_CONTRACTS.map((contract) => (
                <div key={contract.endpoint} className="data-tile rounded-[1.6rem] p-5">
                  <p className="font-mono text-xs font-semibold text-slate-400">
                    {contract.endpoint}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{contract.description}</p>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
