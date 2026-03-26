import { requireDashboardUser } from "@/lib/auth/service";
import { listWarehouses } from "@/lib/warehouses/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import { WarehouseManagementPanel } from "@/components/dashboard/warehouses/warehouse-management-panel";
import { REGION_LABELS } from "@/lib/supply-chain/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WarehousesPage() {
  const viewer = await requireDashboardUser();

  const [warehouses, snapshot] = await Promise.all([
    listWarehouses(),
    getDashboardSnapshot(viewer),
  ]);

  const regionCounts: Record<string, number> = {};
  for (const w of warehouses) {
    regionCounts[w.region] = (regionCounts[w.region] ?? 0) + 1;
  }

  const avgCapacity =
    warehouses.length > 0
      ? Math.round(
          warehouses.reduce((sum, w) => sum + w.capacityScore, 0) /
            warehouses.length
        )
      : 0;

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Warehouses</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
                Fulfilment network &amp; hub capacity.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Manage warehouse nodes, regions, and allocation readiness across the logistics grid.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">{warehouses.length}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Warehouses</p>
              </div>
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">{avgCapacity}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Avg capacity</p>
              </div>
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">
                  {Object.keys(regionCounts).length}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Regions</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Warehouse Management Panel ── */}
        <section className="mt-5">
          <WarehouseManagementPanel viewer={viewer} warehouses={warehouses} />
        </section>

        {/* ── Allocation Readiness ── */}
        <section className="mt-5">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">Live Signals</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Allocation readiness by hub
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["Warehouse", "Region", "Capacity", "Open Orders", "Low-Stock SKUs"].map((h) => (
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
                  {snapshot.warehouseSignals.map((ws) => (
                    <tr key={ws.id} className="transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 pl-6">
                        <p className="text-sm font-semibold text-slate-900">{ws.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-500">
                          {REGION_LABELS[ws.region]}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-lg font-semibold tabular-nums text-slate-900">
                          {ws.capacityScore}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums text-slate-700">{ws.openOrders}</span>
                      </td>
                      <td className="px-5 py-4 pr-6">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            ws.lowStockSkus > 0 ? "text-[#8f3e31]" : "text-slate-700"
                          }`}
                        >
                          {ws.lowStockSkus}
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
