import { requireDashboardUser } from "@/lib/auth/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import { CarrierStatusPill } from "@/components/dashboard/status-pill";
import { REGION_LABELS } from "@/lib/supply-chain/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InventoryPage() {
  const viewer = await requireDashboardUser();
  const snapshot = await getDashboardSnapshot(viewer);

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-7 sm:p-9">
          <p className="section-kicker">Inventory</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
            Stock, warehouses, and carrier health.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Monitor SKU pressure, warehouse allocation readiness, and live logistics health across all carriers.
          </p>
        </section>

        {/* ── Three panels ── */}
        <section className="mt-5 grid gap-5 xl:grid-cols-3">

          {/* Inventory Signals */}
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Inventory Signals</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Stock pressure by SKU
            </h2>
            <div className="mt-6 space-y-3">
              {snapshot.inventorySignals.map((item) => (
                <div key={item.sku} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.13em] text-slate-400">
                        {item.organizationCode} · {item.sku}
                      </p>
                      <p className="text-xs uppercase tracking-[0.13em] text-slate-400">
                        {item.category}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-900/10 bg-white/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Available", value: item.availableUnits },
                      { label: "Reserved", value: item.reservedUnits },
                      { label: "Hub", value: item.primaryWarehouse },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-400">{s.label}</p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warehouse Grid */}
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Warehouse Grid</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Allocation readiness
            </h2>
            <div className="mt-6 space-y-3">
              {snapshot.warehouseSignals.map((warehouse) => (
                <div key={warehouse.id} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{warehouse.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.13em] text-slate-400">
                        {REGION_LABELS[warehouse.region]}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold tracking-tight text-slate-900">
                      {warehouse.capacityScore}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { label: "Open orders", value: warehouse.openOrders },
                      { label: "Low-stock SKUs", value: warehouse.lowStockSkus },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-400">{s.label}</p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrier Mesh */}
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Carrier Mesh</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Live logistics health
            </h2>
            <div className="mt-6 space-y-3">
              {snapshot.carrierSignals.map((carrier) => (
                <div key={carrier.id} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{carrier.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.13em] text-slate-400">
                        {carrier.activeOrders} active
                      </p>
                    </div>
                    <CarrierStatusPill status={carrier.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { label: "ETA baseline", value: `${carrier.averageEtaHours}h` },
                      { label: "Reliability", value: `${carrier.reliabilityScore}/100` },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-400">{s.label}</p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
