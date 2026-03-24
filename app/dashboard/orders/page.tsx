import { requireDashboardUser } from "@/lib/auth/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import { CreateOrderForm } from "@/components/dashboard/create-order-form";
import { OrderExplorer } from "@/components/dashboard/order-explorer";
import { OrderStatePill } from "@/components/dashboard/status-pill";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function createDefaultRequestedDeliveryAt() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return copy.toISOString().slice(0, 16);
}

export default async function OrdersPage() {
  const viewer = await requireDashboardUser();
  const snapshot = await getDashboardSnapshot(viewer);
  const defaultRequestedDeliveryAt = createDefaultRequestedDeliveryAt();

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <section className="glass-panel rounded-[2.4rem] p-7 sm:p-9">
          <p className="section-kicker">Orders</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900">
            Create and manage orders.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Dispatch new supply requests and monitor the full order book with live carrier and warehouse assignments.
          </p>

          {/* State counts bar */}
          <div className="mt-6 flex flex-wrap gap-3">
            {snapshot.stateCounts.map((s) => (
              <div key={s.state} className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3 py-1.5">
                <OrderStatePill state={s.state} />
                <span className="text-sm font-semibold text-slate-900">{s.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Create Order Form ── */}
        <section className="mt-5">
          <CreateOrderForm
            defaultRequestedDeliveryAt={defaultRequestedDeliveryAt}
            organizations={snapshot.organizations}
            products={snapshot.products}
            viewer={viewer}
          />
        </section>

        {/* ── Order Explorer ── */}
        <section className="mt-5">
          <OrderExplorer
            orders={snapshot.orders}
            carriers={snapshot.carriers.map((c) => ({ id: c.id, name: c.name, status: c.status }))}
            warehouses={snapshot.warehouses.map((w) => ({ id: w.id, name: w.name, city: w.city }))}
          />
        </section>

      </div>
    </main>
  );
}
