import { requireDashboardUser } from "@/lib/auth/service";
import { listCarriers } from "@/lib/carriers/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import { CarrierManagementPanel } from "@/components/dashboard/carriers/carrier-management-panel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CarriersPage() {
  const viewer = await requireDashboardUser();

  const [carriers, snapshot] = await Promise.all([
    listCarriers(),
    getDashboardSnapshot(viewer),
  ]);

  const activeCount = carriers.filter((c) => c.status === "active").length;
  const offlineCount = carriers.filter((c) => c.status === "offline").length;

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Carriers</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
                Logistics mesh &amp; carrier health.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Manage carrier partners, operational status, and regional coverage across the supply chain.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">{carriers.length}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Carriers</p>
              </div>
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-[#3d5e31]">{activeCount}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Active</p>
              </div>
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className={`text-2xl font-semibold ${offlineCount > 0 ? "text-[#8f3e31]" : "text-slate-900"}`}>
                  {offlineCount}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Offline</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Carrier Management Panel ── */}
        <section className="mt-5">
          <CarrierManagementPanel viewer={viewer} carriers={carriers} />
        </section>

        {/* ── Live Signals ── */}
        <section className="mt-5">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">Live Signals</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Active logistics health
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["Carrier", "Status", "Active Orders", "ETA Baseline", "Reliability"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5">
                  {snapshot.carrierSignals.map((cs) => (
                    <tr key={cs.id} className="transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 pl-6">
                        <p className="text-sm font-semibold text-slate-900">{cs.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.13em] ${
                            cs.status === "active"
                              ? "border-[#4f7d3f]/25 bg-[#f0faea] text-[#3d5e31]"
                              : cs.status === "degraded"
                              ? "border-[#b78a2c]/28 bg-[#fff8df] text-[#7a5c17]"
                              : "border-[#cb5e4a]/30 bg-[#fff0eb] text-[#8f3e31]"
                          }`}
                        >
                          {cs.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums text-slate-700">{cs.activeOrders}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold tabular-nums text-slate-900">
                          {cs.averageEtaHours}h
                        </span>
                      </td>
                      <td className="px-5 py-4 pr-6">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            cs.reliabilityScore >= 85
                              ? "text-[#3d5e31]"
                              : cs.reliabilityScore >= 65
                              ? "text-[#7a5c17]"
                              : "text-[#8f3e31]"
                          }`}
                        >
                          {cs.reliabilityScore}/100
                        </span>
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
