import { requireDashboardUser } from "@/lib/auth/service";
import { listOrganizations } from "@/lib/auth/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import { listProducts } from "@/lib/products/service";
import { listWarehouses } from "@/lib/inventory/service";
import { CarrierStatusPill } from "@/components/dashboard/status-pill";
import { InventoryManagementPanel } from "@/components/dashboard/inventory/inventory-management-panel";
import { REGION_LABELS } from "@/lib/supply-chain/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InventoryPage() {
  const viewer = await requireDashboardUser();

  const [snapshot, products, warehouses, organizations] = await Promise.all([
    getDashboardSnapshot(viewer),
    listProducts(viewer),
    listWarehouses(),
    listOrganizations(),
  ]);

  const lowStockCount = snapshot.inventorySignals.filter(
    (i) => i.status !== "healthy"
  ).length;

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Inventory</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
                Stock, warehouses &amp; carrier health.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Live pressure across every SKU, warehouse, and logistics carrier.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">{products.length}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">SKUs</p>
              </div>
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className={`text-2xl font-semibold ${lowStockCount > 0 ? "text-[#8f3e31]" : "text-[#3d5e31]"}`}>
                  {lowStockCount}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Low stock</p>
              </div>
              <div className="data-tile rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">{snapshot.carrierSignals.length}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">Carriers</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Product & Inventory Management (RBAC-gated) ── */}
        <section className="mt-5">
          <InventoryManagementPanel
            viewer={viewer}
            products={products}
            organizations={organizations}
            warehouses={warehouses}
          />
        </section>

        {/* ── Inventory Signals Table ── */}
        <section className="mt-5">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">Inventory Signals</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Stock pressure by SKU
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["Product", "SKU / Category", "Organization", "Available", "Reserved", "Primary Hub", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5">
                  {snapshot.inventorySignals.map((item) => (
                    <tr key={item.sku} className="transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 pl-6">
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-600">{item.sku}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{item.category}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">{item.organizationCode}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold tabular-nums text-slate-900">{item.availableUnits}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm tabular-nums text-slate-600">{item.reservedUnits}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">{item.primaryWarehouse}</p>
                      </td>
                      <td className="px-5 py-4 pr-6">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.13em] ${
                          item.status === "healthy"
                            ? "border-[#4f7d3f]/25 bg-[#f0faea] text-[#3d5e31]"
                            : item.status === "watch"
                            ? "border-[#b78a2c]/28 bg-[#fff8df] text-[#7a5c17]"
                            : "border-[#cb5e4a]/30 bg-[#fff0eb] text-[#8f3e31]"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Warehouse + Carrier ── */}
        <section className="mt-5 grid gap-5 xl:grid-cols-2">

          {/* Warehouse Grid Table */}
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">Warehouse Grid</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Allocation readiness
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["Warehouse", "Region", "Capacity", "Open Orders", "Low-Stock SKUs"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5">
                  {snapshot.warehouseSignals.map((warehouse) => (
                    <tr key={warehouse.id} className="transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 pl-6">
                        <p className="text-sm font-semibold text-slate-900">{warehouse.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{REGION_LABELS[warehouse.region]}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-lg font-semibold tabular-nums text-slate-900">{warehouse.capacityScore}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums text-slate-700">{warehouse.openOrders}</span>
                      </td>
                      <td className="px-5 py-4 pr-6">
                        <span className={`text-sm font-semibold tabular-nums ${warehouse.lowStockSkus > 0 ? "text-[#8f3e31]" : "text-slate-700"}`}>
                          {warehouse.lowStockSkus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Carrier Mesh Table */}
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-slate-900/6 px-6 py-5">
              <p className="section-kicker">Carrier Mesh</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Live logistics health
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-900/6 bg-slate-50/50">
                    {["Carrier", "Status", "Active", "ETA Baseline", "Reliability"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5">
                  {snapshot.carrierSignals.map((carrier) => (
                    <tr key={carrier.id} className="transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 pl-6">
                        <p className="text-sm font-semibold text-slate-900">{carrier.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <CarrierStatusPill status={carrier.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums text-slate-700">{carrier.activeOrders}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold tabular-nums text-slate-900">{carrier.averageEtaHours}h</span>
                      </td>
                      <td className="px-5 py-4 pr-6">
                        <span className={`text-sm font-semibold tabular-nums ${
                          carrier.reliabilityScore >= 85
                            ? "text-[#3d5e31]"
                            : carrier.reliabilityScore >= 65
                            ? "text-[#7a5c17]"
                            : "text-[#8f3e31]"
                        }`}>
                          {carrier.reliabilityScore}/100
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
