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
  { method: "POST", path: "/api/orders", description: "Create order, reserve inventory, assign warehouse and carrier." },
  { method: "PATCH", path: "/api/orders/:id", description: "Reassign an order or confirm delivery from the control tower." },
  { method: "POST", path: "/api/automation/run", description: "Run the automated delay detection and reassignment cycle." },
  { method: "GET", path: "/api/dashboard", description: "Return the live aggregate snapshot powering the dashboard." },
] as const;

const METHOD_STYLES: Record<string, string> = {
  GET: "border-[#2f5f8f]/25 bg-[#edf4ff] text-[#24476b]",
  POST: "border-[#4f7d3f]/25 bg-[#f0faea] text-[#3d5e31]",
  PATCH: "border-[#b78a2c]/28 bg-[#fff8df] text-[#7a5c17]",
  DELETE: "border-[#cb5e4a]/30 bg-[#fff0eb] text-[#8f3e31]",
};

export default async function TraceabilityPage() {
  const viewer = await requireDashboardUser();
  const snapshot = await getDashboardSnapshot(viewer);

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Traceability</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
                Audit trail &amp; API contracts.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Every workflow action is timestamped and logged. Backend API contracts are documented below.
              </p>
            </div>
            <div className="data-tile rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-semibold text-slate-900">{snapshot.recentLogs.length}</p>
              <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Log entries</p>
            </div>
          </div>
        </section>

        {/* ── Audit Log Table ── */}
        <section className="mt-5">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">Workflow Logs</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Recent audit trail
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["Action", "Summary", "Timestamp"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5">
                  {snapshot.recentLogs.length ? (
                    snapshot.recentLogs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-white/40">
                        <td className="px-5 py-4 pl-6">
                          <p className="whitespace-nowrap text-sm font-semibold text-slate-900">{log.action}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm leading-6 text-slate-600">{log.summary}</p>
                        </td>
                        <td className="px-5 py-4 pr-6">
                          <p className="whitespace-nowrap text-xs tabular-nums text-slate-400">
                            {formatDateTime(log.timestamp)}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400">
                        No workflow logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── API Contracts Table ── */}
        <section className="mt-5">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">API Interface</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Backend route contracts
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["Method", "Endpoint", "Description"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5">
                  {API_CONTRACTS.map((c) => (
                    <tr key={c.path} className="transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 pl-6">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wide ${METHOD_STYLES[c.method] ?? ""}`}>
                          {c.method}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap font-mono text-sm text-slate-700">{c.path}</p>
                      </td>
                      <td className="px-5 py-4 pr-6">
                        <p className="text-sm leading-6 text-slate-600">{c.description}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
